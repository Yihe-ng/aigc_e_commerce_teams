import hashlib
import hmac
import json
import logging
import os
import threading
import time
from datetime import datetime
import requests
import schedule
from flask import Flask, request, jsonify
from flask_cors import CORS
import asyncio
import aiohttp
from platforms import PLATFORM_CONFIG, COST_CONFIG
import redis
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type


# 定义重试装饰器
def retry_api(times=3, delay=1):
    return retry(
        stop=stop_after_attempt(times),
        wait=wait_exponential(multiplier=1, min=delay, max=10),
        retry=retry_if_exception_type((requests.exceptions.RequestException, ConnectionError)),
        reraise=True
    )


PRODUCTS_CACHE_EXPIRE = 300

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 数据缓存
DATA_CACHE = {
    'taobao': {'data': [], 'expire_time': 0},
    'xiaohongshu': {'data': [], 'expire_time': 0},
    'douyin': {'data': [], 'expire_time': 0},
    'jd': {'data': [], 'expire_time': 0}
}


@app.route('/api/auth_status')
def auth_status():
    return jsonify({
        'jd': PLATFORM_CONFIG['jd']['access_token'] is not None,
        'douyin': PLATFORM_CONFIG['douyin']['access_token'] is not None,
        'xiaohongshu': PLATFORM_CONFIG['xiaohongshu']['access_token'] is not None,
        'taobao': PLATFORM_CONFIG['taobao']['access_token'] is not None
    })



def load_xhs_token():
    config = PLATFORM_CONFIG['xiaohongshu']
    try:
        if os.path.exists(config['token_path']):
            with open(config['token_path'], 'r') as f:
                token_data = json.load(f)
                config['access_token'] = token_data.get('access_token')
                config['refresh_token'] = token_data.get('refresh_token')
                config['expires_at'] = token_data.get('expires_at', 0)
    except Exception as e:
        logger.error(f"加载小红书token失败: {e}")


def save_xhs_token(token_data):
    """保存小红书token数据"""
    config = PLATFORM_CONFIG['xiaohongshu']
    try:
        # 计算过期时间
        expires_at = time.time() + token_data.get('expires_in', 3600)
        # 保存完整的token数据
        with open(config['token_path'], 'w') as f:
            json.dump({
                'access_token': token_data.get('access_token'),
                'refresh_token': token_data.get('refresh_token'),
                'expires_at': expires_at
            }, f)

        # 更新内存配置
        config['access_token'] = token_data.get('access_token')
        config['refresh_token'] = token_data.get('refresh_token')
        config['expires_at'] = expires_at
        return True
    except Exception as e:
        logger.error(f"保存小红书token失败: {e}")
        return False


def refresh_xhs_token():
    logger.info("刷新小红书token...")
    config = PLATFORM_CONFIG['xiaohongshu']

    if not config.get('refresh_token'):
        logger.warning("需要获取小红书的新授权")
        return False

    params = {
        'app_id': config['app_id'],
        'app_secret': config['app_secret'],
        'grant_type': 'refresh_token',
        'refresh_token': config['refresh_token'],
        'timestamp': int(datetime.now().timestamp())
    }

    try:
        response = requests.get(
            f"{config['api_url']}/oauth/refresh_token",
            params=params,
            headers={'User-Agent': 'XHS-OpenAPI/1.0'}
        )
        response.raise_for_status()
        data = response.json()

        if data.get('code') == 0 and 'access_token' in data['data']:
            save_xhs_token(data['data'])
            return True
        else:
            logger.error(f"小红书token刷新失败: {data}")
            return False
    except Exception as e:
        logger.error(f"小红书token刷新请求出错: {e}")
        return False


def ensure_xhs_token():
    config = PLATFORM_CONFIG['xiaohongshu']
    load_xhs_token()

    if not config['access_token'] or time.time() > config['expires_at']:
        return refresh_xhs_token()
    return True


# 小红书签名生成（官方要求）

def generate_xhs_sign(params, app_secret):
    """小红书API签名算法（HMAC-SHA256）"""
    sorted_params = sorted(params.items(), key=lambda x: x[0])  # 按参数名排序
    query_str = '&'.join([f"{k}={v}" for k, v in sorted_params])  # 拼接参数
    return hmac.new(
        app_secret.encode('utf-8'),
        query_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()


# 小红书商品数据获取（替换爬虫）

def get_xiaohongshu_products():
    if not ensure_xhs_token():
        return []

    config = PLATFORM_CONFIG['xiaohongshu']
    products = []
    page = 1
    total_pages = 1

    while page <= total_pages:
        try:
            # 1. 获取店铺商品列表（官方API：item_search_shop）
            list_params = {
                'app_id': config['app_id'],
                'sid': config['shop_sid'],  # 店铺ID
                'page': page,
                'page_size': 20,  # 每页20条（官方上限）
                'sort': 'sale',  # 按销量排序
                'access_token': config['access_token'],
                'timestamp': int(datetime.now().timestamp())
            }
            list_params['sign'] = generate_xhs_sign(list_params, config['app_secret'])  # 签名

            list_response = requests.get(
                f"{config['api_url']}/item/search/shop",
                params=list_params,
                headers={'User-Agent': 'XHS-OpenAPI/1.0'}
            )
            list_response.raise_for_status()
            list_data = list_response.json()

            if list_data.get('code') != 0:
                logger.error(f"小红书列表API错误: {list_data.get('msg')}")
                break

            # 解析分页信息
            total_pages = list_data['data']['pagecount']
            total_items = list_data['data']['total_results']
            logger.info(f"获取小红书第{page}/{total_pages}页，共{total_items}件商品")

            # 2. 遍历获取商品详情（官方API：item_get）
            for item in list_data['data']['items']:
                item_id = item['item_id']
                detail_params = {
                    'app_id': config['app_id'],
                    'item_id': item_id,
                    'access_token': config['access_token'],
                    'timestamp': int(datetime.now().timestamp())
                }
                detail_params['sign'] = generate_xhs_sign(detail_params, config['app_secret'])

                try:
                    detail_response = requests.get(
                        f"{config['api_url']}/item/get",
                        params=detail_params,
                        headers={'User-Agent': 'XHS-OpenAPI/1.0'}
                    )
                    detail_response.raise_for_status()
                    detail_data = detail_response.json()

                    if detail_data.get('code') != 0:
                        logger.warning(f"商品{item_id}详情获取失败: {detail_data.get('msg')}")
                        continue

                    # 解析商品详情
                    product = detail_data['data']['item']
                    price = float(product['price']) / 100  # 接口返回分为单位
                    sales = product['sales_count']  # 真实30天销量
                    revenue = price * sales  # 销售额=单价*销量
                    cost = calculate_product_cost('xiaohongshu', price, sales)  # 复用原有成本计算
                    profit = revenue - (cost * sales)  # 利润=销售额-总成本

                    products.append({
                        'platform': 'xiaohongshu',
                        'product_id': item_id,
                        'name': product['title'],
                        'seller': product['shop_name'],
                        'price': price,
                        'sales': sales,
                        'revenue': revenue,
                        'cost': cost,
                        'profit': profit,
                        'url': f"https://www.xiaohongshu.com/goods/{item_id}"
                    })
                except Exception as e:
                    logger.warning(f"商品{item_id}详情解析失败: {e}")
                    continue

            page += 1

        except Exception as e:
            logger.error(f"小红书数据获取出错: {e}")
            break

    return products


# 小红书授权与回调
app.route('/api/auth/xiaohongshu', methods=['GET'])


def get_xhs_auth_url():
    config = PLATFORM_CONFIG['xiaohongshu']
    auth_url = (
        f"{config['api_url']}/oauth/authorize"
        f"?app_id={config['app_id']}"
        f"&response_type=code"
        f"&redirect_uri=http://localhost:5000/api/callback/xiaohongshu"
        f"&state=STATE"
    )
    return jsonify({'auth_url': auth_url})


@app.route('/api/callback/xiaohongshu', methods=['GET'])
def handle_xhs_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Missing code parameter'}), 400

    config = PLATFORM_CONFIG['xiaohongshu']
    params = {
        'app_id': config['app_id'],
        'app_secret': config['app_secret'],
        'code': code,
        'grant_type': 'authorization_code',
        'timestamp': int(datetime.now().timestamp())
    }

    try:
        response = requests.get(
            f"{config['api_url']}/oauth/access_token",
            params=params,
            headers={'User-Agent': 'XHS-OpenAPI/1.0'}
        )
        response.raise_for_status()
        data = response.json()

        if data.get('code') == 0 and 'access_token' in data['data']:
            save_xhs_token(data['data'])
            return jsonify({'message': '小红书授权成功', 'token': data['data']})
        else:
            return jsonify({'error': '小红书授权失败', 'details': data}), 400
    except Exception as e:
        return jsonify({'error': f'回调处理出错: {str(e)}'}), 500


def load_token(platform):
    config = PLATFORM_CONFIG[platform]
    try:
        if os.path.exists(config['token_path']):
            with open(config['token_path'], 'r') as f:
                token_data = json.load(f)
                config['access_token'] = token_data.get('access_token')
                config['refresh_token'] = token_data.get('refresh_token')
                config['expires_at'] = token_data.get('expires_at', 0)
    except Exception as e:
        logger.error(f"加载{platform} token失败: {e}")


def save_token(platform, token_data):
    config = PLATFORM_CONFIG[platform]
    config['access_token'] = token_data.get('access_token')
    config['refresh_token'] = token_data.get('refresh_token')
    config['expires_at'] = int(time.time()) + token_data.get('expires_in', 0) - 600

    try:
        with open(config['token_path'], 'w') as f:
            json.dump({
                'access_token': config['access_token'],
                'refresh_token': config['refresh_token'],
                'expires_at': config['expires_at']
            }, f)
    except Exception as e:
        logger.error(f"保存{platform} token失败: {e}")


def refresh_token(platform):
    logger.info(f"刷新{platform} token...")
    config = PLATFORM_CONFIG[platform]

    if not config.get('refresh_token'):
        logger.warning(f"需要获取{platform}的新授权")
        return False

    if platform == 'taobao':
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': config['refresh_token'],
            'client_id': config['app_key'],
            'client_secret': config['app_secret']
        }
        response = requests.post(config['auth_url'], data=data)
        token_data = response.json()

        if 'access_token' in token_data:
            save_token(platform, token_data)
            return True
        else:
            logger.error(f"淘宝token刷新失败: {token_data}")
            return False

    elif platform == 'jd':
        data = {
            'grant_type': 'refresh_token',
            'client_id': config['app_key'],
            'client_secret': config['app_secret'],
            'refresh_token': config['refresh_token']
        }
        response = requests.post(config['auth_url'], data=data)
        token_data = response.json()

        if 'access_token' in token_data:
            save_token(platform, token_data)
            return True
        else:
            logger.error(f"京东token刷新失败: {token_data}")
            return False

    elif platform == 'douyin':
        params = {
            'appid': config['app_key'],
            'secret': config['app_secret'],
            'grant_type': 'refresh_token',
            'refresh_token': config['refresh_token']
        }
        try:
            response = requests.get(config['auth_url'], params=params)
            response.raise_for_status()  # 添加HTTP错误处理
            token_data = response.json()

            # 检查响应结构
            if token_data.get('data') and 'access_token' in token_data['data']:
                save_token(platform, token_data['data'])
                return True
            else:
                logger.error(f"抖音token刷新失败: 响应结构异常 {token_data}")
                return False
        except Exception as e:
            logger.error(f"抖音token刷新请求失败: {e}")
            return False

    return False


def ensure_token(platform):
    if platform == 'xiaohongshu':
        return ensure_xhs_token()  # 小红书单独处理
    elif platform not in ['taobao', 'jd', 'douyin']:
        return True

    config = PLATFORM_CONFIG[platform]
    load_token(platform)

    if not config['access_token'] or time.time() > config['expires_at']:
        return refresh_token(platform)

    return True


def generate_taobao_sign(params, secret):
    params = sorted(params.items())
    query = ''.join([k + str(v) for k, v in params])
    return hashlib.md5((secret + query + secret).encode('utf-8')).hexdigest().upper()


def generate_jd_sign(params, secret):
    sorted_params = sorted(params.items())
    query = ''.join([f"{k}{v}" for k, v in sorted_params])
    return hmac.new(secret.encode('utf-8'), query.encode('utf-8'), hashlib.sha256).hexdigest().upper()


def calculate_product_cost(platform, price, sales_volume):
    cost_config = COST_CONFIG[platform]

    commission = price * cost_config['commission_rate']
    payment_fee = price * cost_config['payment_fee']
    logistics_cost = cost_config['logistics_cost']

    if sales_volume > 1000:
        marketing_rate = cost_config['marketing_rate'] * 0.8
    elif sales_volume > 100:
        marketing_rate = cost_config['marketing_rate']
    else:
        marketing_rate = cost_config['marketing_rate'] * 1.2

    marketing_cost = price * marketing_rate
    total_cost = commission + payment_fee + logistics_cost + marketing_cost

    return total_cost


@retry_api(times=3)
# 其他平台数据获取函数保持不变（淘宝、京东、抖音）
def get_taobao_products():
    # 原有代码未修改
    if not ensure_token('taobao'):
        return []

    products = []
    page_no = 1
    config = PLATFORM_CONFIG['taobao']

    while True:
        params = {
            'app_key': config['app_key'],
            'method': 'taobao.tbk.item.get',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'format': 'json',
            'v': '2.0',
            'sign_method': 'md5',
            'fields': 'num_iid,title,nick,price,sales_volume',
            'page_no': page_no,
            'page_size': 100,
            'access_token': config['access_token']
        }

        params['sign'] = generate_taobao_sign(params, config['app_secret'])

        try:
            response = requests.get(config['api_url'], params=params)
            response.raise_for_status()
            data = response.json()

            if 'tbk_items' in data and 'tbk_item' in data['tbk_items']:
                for item in data['tbk_items']['tbk_item']:
                    product_id = item['num_iid']
                    price = float(item['price'])
                    sales = int(item['sales_volume'])
                    revenue = price * sales
                    cost = calculate_product_cost('taobao', price, sales)
                    profit = revenue - (cost * sales)

                    products.append({
                        'platform': 'taobao',
                        'product_id': product_id,
                        'name': item['title'],
                        'seller': item['nick'],
                        'price': price,
                        'sales': sales,
                        'revenue': revenue,
                        'cost': cost,
                        'profit': profit
                    })

                if len(data['tbk_items']['tbk_item']) < 100:
                    break
                page_no += 1
            else:
                break
        except Exception as e:
            logger.error(f"获取淘宝商品数据出错: {e}")
            break

    return products


def get_jd_products():
    if not ensure_token('jd'):
        return []

    products = []
    page = 1
    config = PLATFORM_CONFIG['jd']

    while True:
        params = {
            'app_key': config['app_key'],
            'method': 'jd.union.open.goods.jingfen.query',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'v': '1.0',
            'sign_method': 'hmac',
            'param_json': json.dumps({
                'goodsReq': {
                    'pageIndex': page,
                    'pageSize': 100
                }
            }),
            'access_token': config['access_token']
        }

        params['sign'] = generate_jd_sign(params, config['app_secret'])

        try:
            response = requests.get(config['api_url'], params=params)
            response.raise_for_status()
            data = response.json()

            if 'result' in data and 'data' in data['result']:
                for item in data['result']['data']:
                    product_id = item['skuId']
                    price = float(item['price'])
                    sales = item.get('inOrderCount30Days', 0)
                    revenue = price * sales
                    cost = calculate_product_cost('jd', price, sales)
                    profit = revenue - (cost * sales)

                    products.append({
                        'platform': 'jd',
                        'product_id': product_id,
                        'name': item['skuName'],
                        'seller': item['shopName'],
                        'price': price,
                        'sales': sales,
                        'revenue': revenue,
                        'cost': cost,
                        'profit': profit
                    })

                if len(data['result']['data']) < 100:
                    break
                page += 1
            else:
                break
        except Exception as e:
            logger.error(f"获取京东商品数据出错: {e}")
            break

    return products


def get_douyin_products():
    if not ensure_token('douyin'):
        return []

    products = []
    cursor = 0
    config = PLATFORM_CONFIG['douyin']

    while True:
        url = f"{config['api_url']}/ecommerce/v1/merchant/products"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f"Bearer {config['access_token']}"
        }
        params = {
            'page_size': 10,
            'cursor': cursor
        }

        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

            if 'data' in data and 'products' in data['data']:
                for item in data['data']['products']:
                    product_id = item['product_id']
                    price = float(item['price']) / 100
                    sales = item.get('sales', 0)
                    revenue = price * sales
                    cost = calculate_product_cost('douyin', price, sales)
                    profit = revenue - (cost * sales)

                    products.append({
                        'platform': 'douyin',
                        'product_id': product_id,
                        'name': item['name'],
                        'seller': item.get('shop_name', '未知'),
                        'price': price,
                        'sales': sales,
                        'revenue': revenue,
                        'cost': cost,
                        'profit': profit
                    })

                if not data['data'].get('has_more', False):
                    break
                cursor = data['data'].get('cursor', 0)
            else:
                break
        except Exception as e:
            logger.error(f"获取抖音商品数据出错: {e}")
            break

    return products


# 初始化Redis连接
redis_client = redis.Redis(host='localhost', port=6379, db=0)


# 缓存数据，使用Redis替代内存缓存
def cache_data(platform, data, expire_seconds=PRODUCTS_CACHE_EXPIRE):
    """使用Redis缓存数据"""
    try:
        # 序列化数据
        data_str = json.dumps(data)
        # 设置带过期时间的缓存
        redis_client.set(f"products:{platform}", data_str, ex=expire_seconds)
        return True
    except Exception as e:
        logger.error(f"缓存{platform}数据失败: {e}")
        return False


def get_cached_data(platform):
    """从Redis获取缓存数据"""
    try:
        data_str = redis_client.get(f"products:{platform}")
        if data_str:
            return json.loads(data_str)
        return None
    except Exception as e:
        logger.error(f"获取{platform}缓存数据失败: {e}")
        return None


def update_all_data():
    logger.info("开始定时更新所有平台数据...")

    for platform in ['taobao', 'xiaohongshu', 'jd', 'douyin']:
        try:
            if platform == 'taobao':
                data = get_taobao_products()
            elif platform == 'xiaohongshu':
                data = get_xiaohongshu_products()
            elif platform == 'jd':
                data = get_jd_products()
            elif platform == 'douyin':
                data = get_douyin_products()

            cache_data(platform, data)
            logger.info(f"成功更新{platform}数据，共{len(data)}条记录")
        except Exception as e:
            logger.error(f"更新{platform}数据失败: {e}")

    logger.info("所有平台数据更新完成")


# 多平台数据并发获取
async def fetch_products(session, platform):
    url = f"http://localhost:5000/api/products?platform={platform}"
    try:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.json()
            return []
    except Exception as e:
        logger.error(f"获取{platform}数据失败: {e}")
        return []


async def get_all_products(platforms):
    async with aiohttp.ClientSession() as session:  # 使用上下文管理器
        tasks = [fetch_products(session, platform) for platform in platforms]
        results = await asyncio.gather(*tasks)
        return [item for sublist in results for item in sublist]


@app.route('/api/products', methods=['GET'])
def get_products():
    platform = request.args.get('platform')
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'

    if not platform:
        return jsonify({'error': 'Missing platform parameter'}), 400

    if platform == 'all':
        platforms = ['taobao', 'xiaohongshu', 'jd', 'douyin']
        all_products = asyncio.run(get_all_products(platforms))
        return jsonify(all_products)

    elif platform in ['taobao', 'xiaohongshu', 'jd', 'douyin']:
        cached_data = get_cached_data(platform) if not force_refresh else None
        if cached_data is not None:
            return jsonify(cached_data)

        if platform == 'taobao':
            data = get_taobao_products()
        elif platform == 'xiaohongshu':
            data = get_xiaohongshu_products()
        elif platform == 'jd':
            data = get_jd_products()
        elif platform == 'douyin':
            data = get_douyin_products()

        cache_data(platform, data)
        return jsonify(data)

    else:
        return jsonify({'error': 'Invalid platform'}), 400


@app.route('/api/auth/<platform>', methods=['GET'])
def get_auth_url(platform):
    if platform == 'xiaohongshu':
        return get_xhs_auth_url()  # 小红书单独处理
    elif platform not in ['taobao', 'jd', 'douyin']:
        return jsonify({'error': 'Authentication not required for this platform'}), 400

    config = PLATFORM_CONFIG[platform]

    if platform == 'taobao':
        auth_url = f"https://oauth.taobao.com/authorize?response_type=code&client_id={config['app_key']}&redirect_uri=http://localhost:5000/api/callback/taobao&state=STATE"
        return jsonify({'auth_url': auth_url})

    elif platform == 'jd':
        auth_url = f"https://oauth.jd.com/oauth/authorize?response_type=code&client_id={config['app_key']}&redirect_uri=http://localhost:5000/api/callback/jd&state=STATE"
        return jsonify({'auth_url': auth_url})

    elif platform == 'douyin':
        auth_url = f"https://open.douyin.com/platform/oauth/connect/?client_key={config['app_key']}&response_type=code&scope=user_info&redirect_uri=http://localhost:5000/api/callback/douyin&state=STATE"
        return jsonify({'auth_url': auth_url})

    return jsonify({'error': 'Platform not supported'}), 400


@app.route('/api/callback/<platform>', methods=['GET'])
def handle_callback(platform):
    if platform == 'xiaohongshu':
        return handle_xhs_callback()  # 小红书单独处理
    elif platform not in ['taobao', 'jd', 'douyin']:
        return jsonify({'error': 'Invalid platform'}), 400

    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Missing code parameter'}), 400

    config = PLATFORM_CONFIG[platform]

    if platform == 'taobao':
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': config['app_key'],
            'client_secret': config['app_secret'],
            'redirect_uri': 'http://localhost:5000/api/callback/taobao'
        }
        response = requests.post(config['auth_url'], data=data)
        token_data = response.json()

        if 'access_token' in token_data:
            save_token(platform, token_data)
            return jsonify({'message': '授权成功', 'token': token_data})
        else:
            return jsonify({'error': '授权失败', 'details': token_data}), 400

    elif platform == 'jd':
        data = {
            'grant_type': 'authorization_code',
            'client_id': config['app_key'],
            'client_secret': config['app_secret'],
            'code': code,
            'redirect_uri': 'http://localhost:5000/api/callback/jd'
        }
        response = requests.post(config['auth_url'], data=data)
        token_data = response.json()

        if 'access_token' in token_data:
            save_token(platform, token_data)
            return jsonify({'message': '授权成功', 'token': token_data})
        else:
            return jsonify({'error': '授权失败', 'details': token_data}), 400

    elif platform == 'douyin':
        params = {
            'appid': config['app_key'],
            'secret': config['app_secret'],
            'code': code,
            'grant_type': 'authorization_code'
        }
        response = requests.get(config['auth_url'], params=params)
        token_data = response.json()

        if 'access_token' in token_data.get('data', {}):
            save_token(platform, token_data['data'])
            return jsonify({'message': '授权成功', 'token': token_data})
        else:
            return jsonify({'error': '授权失败', 'details': token_data}), 400

    return jsonify({'error': 'Platform not supported'}), 400


def run_scheduler():
    schedule.every(1).hours.do(update_all_data)
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == '__main__':
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    update_all_data()
    app.run(host='0.0.0.0', port=5000)

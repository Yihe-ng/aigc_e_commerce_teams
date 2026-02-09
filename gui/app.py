import signal
import atexit
import numpy as np
import pandas as pd
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, make_response, \
    after_this_request
from datetime import datetime, timedelta
import time
from flask import Flask
from flask_cors import CORS
import os
from threading import Lock
import json
import requests
import logging
import io
from flask import redirect, url_for
from gui.api import save_token
from platforms import PLATFORM_CONFIG, COST_CONFIG
import threading
from collections import defaultdict
import zlib
# 添加增量更新相关的导入和全局变量
import sqlite3
from flask_caching import Cache
import time

# 初始化增量更新数据库
def init_incremental_db():
    """初始化增量更新数据库"""
    conn = sqlite3.connect('incremental_updates.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS updates
        (key TEXT PRIMARY KEY, 
         update_time TIMESTAMP,
         data BLOB)
    ''')
    conn.commit()
    conn.close()

# 调用初始化
init_incremental_db()


# 预计算存储
precomputed_data = defaultdict(dict)

# 全局退出标志
exit_flag = threading.Event()

# 添加全局变量
TRACKED_PAGES = [
    '/dashboard',
    '/dashboard_internal',
    '/product_management',  # 商品管理页面
    '/product_marketing',  # 商品营销页面
    '/note',  # 营销笔记页面
    '/calendar',  # 营销日程页面
    '/test1',  # 文案智造器
    '/test2',  # 营销图创作
    '/test3',  # 短视频智造
    '/setting'  # 设置页面
]


# 添加定时清理任务
def cleanup_old_incremental_data():
    """清理过期的增量数据"""
    while not exit_flag.is_set():
        try:
            # 每天执行一次清理
            exit_flag.wait(86400)  # 24小时

            conn = sqlite3.connect('incremental_updates.db')
            c = conn.cursor()
            # 删除7天前的数据
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            c.execute("DELETE FROM updates WHERE update_time < ?", (week_ago,))
            deleted_count = c.rowcount
            conn.commit()
            conn.close()

            app.logger.info(f"清理了 {deleted_count} 条过期增量数据")
        except Exception as e:
            app.logger.error(f"清理增量数据失败: {e}")


#启动清理线程
def init_precompute_system():
    """初始化预计算系统"""
    global precompute_thread, cleanup_thread, exit_flag

    # 确保只启动一次
    if hasattr(app, 'precompute_thread_started') and app.precompute_thread_started:
        return

    # 启动预计算线程


    # 启动清理线程
    cleanup_thread = threading.Thread(target=cleanup_old_incremental_data, daemon=True)
    cleanup_thread.start()

    app.precompute_thread_started = True

    # 注册优雅关闭
    def shutdown_background_tasks():
        exit_flag.set()
        if precompute_thread.is_alive():
            precompute_thread.join(timeout=5.0)
        if cleanup_thread.is_alive():
            cleanup_thread.join(timeout=5.0)

    atexit.register(shutdown_background_tasks)


def precompute_dashboard_data():
    """后台预计算常见查询，优化响应时间"""
    # 等待app初始化完成
    time.sleep(2)

    app.logger.info("预计算线程启动")
    while not exit_flag.is_set():
        try:
            # 常见时间范围
            for period in ['month', 'quarter', 'year']:
                # 常见过滤组合
                for source in ['线上推广', '线下活动', '合作伙伴', None]:
                    for region in ['华东', '华北', '华南', None]:
                        # 构建模拟查询参数
                        params = {
                            'timeRange': period,
                            'source': source,
                            'region': region
                        }

                        # 使用应用上下文执行预计算
                        with app.app_context():
                            # 生成缓存键
                            from flask import Request
                            with app.test_request_context('/api/dashboard/data', query_string=params):
                                # 如果已有缓存则跳过
                                key = get_cache_key()
                                if cache.get(key):
                                    continue

                                # 执行实际计算
                                data = get_dashboard_data()

                                # 存储预计算结果
                                if period not in precomputed_data:
                                    precomputed_data[period] = {}
                                precomputed_data[period][key] = data

                # 短暂休眠避免CPU占用过高
                exit_flag.wait(5)

            # 完成一轮预计算后等待
            exit_flag.wait(30)
        except Exception as e:
            app.logger.error(f"预计算任务出错: {e}")
            exit_flag.wait(60)  # 出错时等待更长时间

    app.logger.info("预计算线程退出")




# 注册信号处理函数
def handle_shutdown_signal(signum, frame):
    app.logger.info("收到退出信号，正在优雅关闭...")
    exit_flag.set()  # 设置退出标志


# 注册信号处理
signal.signal(signal.SIGINT, handle_shutdown_signal)
signal.signal(signal.SIGTERM, handle_shutdown_signal)

# 启动预计算线程
precompute_thread = threading.Thread(target=precompute_dashboard_data, daemon=True)
precompute_thread.start()

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

HISTORY_DATA_FILE = 'history_data.json'
# 初始化历史数据
if os.path.exists(HISTORY_DATA_FILE):
    with open(HISTORY_DATA_FILE, 'r') as f:
        history_data = json.load(f)
else:
    history_data = {
        'month': {'revenue': 0, 'profit': 0, 'merchants': 0, 'active_rate': 0},
        'quarter': {'revenue': 0, 'profit': 0, 'merchants': 0, 'active_rate': 0},
        'year': {'revenue': 0, 'profit': 0, 'merchants': 0, 'active_rate': 0}
    }

app = Flask(__name__)
app.secret_key = '8888'  # 设置密钥
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# 改为在app初始化后启动
def init_precompute_thread():
    # 避免隐藏外部作用域的precompute_thread
    local_precompute_thread = threading.Thread(target=precompute_dashboard_data, daemon=True)
    local_precompute_thread.start()


# 在全局变量区域添加
history_data_lock = threading.Lock()
incremental_updates = {}  # 存储增量更新数据
AIGC_SERVICE_URL = "http://localhost:5000"

def refresh_token(platform):
    config = PLATFORM_CONFIG[platform]
    if time.time() > config['expires_at'] - 300:  # 提前5分钟刷新
        # 调用平台refresh接口
        # 更新token和过期时间

        @app.errorhandler(500)
        def internal_error(error):
            logger.error(f"Server Error: {error}")
            return jsonify({'error': 'Internal server error'}), 500


CORS(app, resources={r"/api/*": {"origins": "http://localhost:5000"}})

# 配置缓存
cache_config = {
    'CACHE_TYPE': 'redis',  # 使用Redis作为缓存后端
    'CACHE_REDIS_URL': 'redis://localhost:6379/0',
    'CACHE_DEFAULT_TIMEOUT': 300,  # 默认5分钟
    'CACHE_KEY_PREFIX': 'dashboard_'
}
cache = Cache(config=cache_config)
cache.init_app(app)


def get_cache_key():
    args = request.args.to_dict()
    # 添加类型前缀
    dashboard_type = args.get('type', 'internal')
    return f"{dashboard_type}:{hash(frozenset(args.items()))}"



def get_incremental_data():
    """获取增量更新数据"""
    try:
        key = get_cache_key()
        last_update_time = request.args.get('last_update')

        if not last_update_time:
            return None

        # 从数据库查询增量更新
        conn = sqlite3.connect('incremental_updates.db')
        c = conn.cursor()
        c.execute(
            "SELECT data FROM updates WHERE key = ? AND update_time > ?",
            (key, last_update_time)
        )
        result = c.fetchone()
        conn.close()

        if result:
            return json.loads(result[0])
    except Exception as e:
        app.logger.error(f"增量更新查询错误: {e}")
    return None


def update_incremental_data(cache_key, data):
    """存储增量更新数据"""
    try:
        conn = sqlite3.connect('incremental_updates.db')
        c = conn.cursor()

        # 序列化数据
        data_str = json.dumps(data)

        # 插入或更新记录
        c.execute(
            "INSERT OR REPLACE INTO updates (key, update_time, data) VALUES (?, ?, ?)",
            (cache_key, datetime.now().isoformat(), data_str)
        )
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        app.logger.error(f"存储增量更新失败: {e}")
        return False




def parse_timestamp(timestamp_str):
    """安全解析时间戳"""
    try:
        return datetime.fromisoformat(timestamp_str)
    except (ValueError, TypeError) as e:
        logger.warning(f"时间戳解析失败: {timestamp_str}, 错误: {e}")
        # 返回默认值或当前时间
        return datetime.now()



@app.route('/health')
def health_check():
    return jsonify({'status': 'ok', 'service': 'app'})



# 获取平台产品数据的统一入口
@app.route('/api/products', methods=['GET'])
def get_platform_products():
    platform = request.args.get('platform')
    if not platform:
        return jsonify({'error': 'Missing platform parameter'}), 400

    if platform == 'taobao':
        products = get_taobao_products()
    elif platform == 'xiaohongshu':
        products = get_xiaohongshu_products()
    elif platform == 'jd':
        products = get_jd_products()
    elif platform == 'douyin':
        products = get_douyin_products()
    else:
        return jsonify({'error': 'Invalid platform'}), 400

    return jsonify(products)


# 平台授权状态检查
@app.route('/api/check_auth/<platform>', methods=['GET'])
def check_auth_status(platform):
    config = PLATFORM_CONFIG.get(platform)
    if not config:
        return jsonify({'authorized': False})

    # 尝试加载token
    load_token(platform)

    # 检查token有效期
    if config.get('access_token') and config.get('expires_at', 0) > time.time():
        return jsonify({'authorized': True})
    return jsonify({'authorized': False})


# 淘宝产品获取
def get_taobao_products():
    # 实际实现应与api.py中的相同
    return [{
        'platform': 'taobao',
        'product_id': '123',
        'name': '示例商品',
        'seller': '示例卖家',
        'price': 100.0,
        'sales': 50,
        'revenue': 5000.0,
        'cost': 4000.0,
        'profit': 1000.0
    }]


def save_token(platform, token_data):
    """保存平台token到文件"""
    config = PLATFORM_CONFIG[platform]
    token_path = config['token_path']

    # 更新内存中的token
    config['access_token'] = token_data.get('access_token')
    config['refresh_token'] = token_data.get('refresh_token')
    config['expires_at'] = time.time() + token_data.get('expires_in', 7200) - 600  # 提前10分钟过期

    # 保存到文件
    try:
        with open(token_path, 'w') as f:
            json.dump({
                'access_token': config['access_token'],
                'refresh_token': config['refresh_token'],
                'expires_at': config['expires_at']
            }, f)
        return True
    except Exception as e:
        logger.error(f"保存{platform} token失败: {e}")
        return False


def load_token(platform):
    """从文件加载token"""
    config = PLATFORM_CONFIG[platform]
    token_path = config['token_path']

    try:
        if os.path.exists(token_path):
            with open(token_path, 'r') as f:
                token_data = json.load(f)
                config['access_token'] = token_data.get('access_token')
                config['refresh_token'] = token_data.get('refresh_token')
                config['expires_at'] = token_data.get('expires_at', 0)
            return True
        return False
    except Exception as e:
        logger.error(f"加载{platform} token失败: {e}")
        return False


# 小红书回调处理
@app.route('/api/callback/xiaohongshu', methods=['GET'])
def xiaohongshu_callback():
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Missing code'}), 400

    config = PLATFORM_CONFIG['xiaohongshu']
    params = {
        'app_id': config['app_id'],
        'app_secret': config['app_secret'],
        'code': code,
        'grant_type': 'authorization_code'
    }

    try:
        response = requests.post(
            f"{config['api_url']}/oauth/access_token",
            params=params,
            headers={'User-Agent': 'XHS-OpenAPI/1.0'}
        )
        response.raise_for_status()
        data = response.json()

        if data.get('code') == 0:
            token_data = data['data']
            save_token('xiaohongshu', token_data)
            return redirect(url_for('dashboard'))  # 授权成功后重定向
        else:
            return jsonify({'error': f"小红书授权失败: {data.get('msg')}"}), 400
    except Exception as e:
        logger.error(f"小红书回调处理失败: {e}")
        return jsonify({'error': '服务器内部错误'}), 500


# 小红书产品获取函数
def get_xiaohongshu_products():
    try:
        # 调用api.py服务获取小红书数据
        response = requests.get('http://localhost:5000/api/products?platform=xiaohongshu')
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"获取小红书数据失败: {response.status_code}")
            return []
    except Exception as e:
        logger.error(f"小红书API请求异常: {e}")
        return []


# 京东产品获取
def get_jd_products():
    # 实际实现应与api.py中的相同
    return [{
        'platform': 'jd',
        'product_id': '789',
        'name': '京东商品',
        'seller': '京东卖家',
        'price': 150.0,
        'sales': 40,
        'revenue': 6000.0,
        'cost': 4800.0,
        'profit': 1200.0
    }]


# 抖音产品获取
def get_douyin_products():
    # 实际实现应与api.py中的相同
    return [{
        'platform': 'douyin',
        'product_id': '101',
        'name': '抖音商品',
        'seller': '抖音卖家',
        'price': 80.0,
        'sales': 60,
        'revenue': 4800.0,
        'cost': 3600.0,
        'profit': 1200.0
    }]


# 生成授权URL
def generate_auth_url(platform):
    config = PLATFORM_CONFIG.get(platform)
    if not config:
        return None

    if platform == 'taobao':
        return f"https://oauth.taobao.com/authorize?response_type=code&client_id={config['app_key']}&redirect_uri=http://localhost:5001/callback/{platform}&state=STATE"
    elif platform == 'jd':
        return f"https://oauth.jd.com/oauth/authorize?response_type=code&client_id={config['app_key']}&redirect_uri=http://localhost:5001/callback/{platform}&state=STATE"
    elif platform == 'douyin':
        return f"https://open.douyin.com/platform/oauth/connect/?client_key={config['app_key']}&response_type=code&scope=user_info&redirect_uri=http://localhost:5001/callback/{platform}&state=STATE"
    if platform == 'xiaohongshu':
        config = PLATFORM_CONFIG['xiaohongshu']
        return f"{config['api_url']}/oauth/authorize?app_id={config['app_id']}&response_type=code&redirect_uri=http://localhost:5001/api/callback/xiaohongshu&state=STATE"
    return None


def handle_callback(platform, code):
    config = PLATFORM_CONFIG.get(platform)
    if not config:
        return None

    try:
        if platform == 'taobao':
            data = {
                'grant_type': 'authorization_code',
                'code': code,
                'client_id': config['app_key'],
                'client_secret': config['app_secret'],
                'redirect_uri': f'http://localhost:5001/callback/{platform}'
            }
            response = requests.post(config['auth_url'], data=data)
            token_data = response.json()
            if 'access_token' in token_data:
                save_token(platform, token_data)
                return redirect(url_for('dashboard'))  # 重定向到 dashboard 页面
            return token_data
        # 其他平台类似实现
        return {'status': 'success', 'message': '授权成功'}
    except Exception as e:
        logger.error(f"{platform}回调处理失败: {e}")
        return None


# 商家数据管理
MERCHANT_DATA_FILE = 'merchant_data.csv'

# 在应用启动时加载已有数据
if os.path.exists(MERCHANT_DATA_FILE):
    merchant_df = pd.read_csv(MERCHANT_DATA_FILE)
else:
    merchant_df = pd.DataFrame(columns=[
        'id', 'name', 'category', 'source',
        'signup_date', 'usage_hours', 'region'
    ])


# 线程锁确保数据安全
merchant_df_lock = Lock()
history_data_lock = Lock()  # 新增：定义 history_data_lock


# 使用时长更新函数
def update_usage(merchant_id, duration):
    global merchant_df, merchant_df_lock

    with merchant_df_lock:
        if merchant_id in merchant_df['id'].values:
            idx = merchant_df.index[merchant_df['id'] == merchant_id].tolist()[0]
            # 转换为小时并更新
            duration_hours = duration / 3600
            merchant_df.at[idx, 'usage_hours'] += duration_hours
            merchant_df.to_csv(MERCHANT_DATA_FILE, index=False)
            print(
                f"商家 {merchant_id} 使用时长增加: {duration_hours:.2f}小时 (总计: {merchant_df.at[idx, 'usage_hours']:.2f}小时)")


def calculate_growth(current, period, metric):
    """计算增长率"""
    previous = history_data.get(period, {}).get(metric, 0)
    if previous == 0:
        return "--"  # 无历史数据
    return round(((current - previous) / previous) * 100, 1)


# 活跃度计算函数
# 修改数据获取API，确保活跃度计算正确
def calculate_activity_ratio(row, now):
    try:
        signup_time = datetime.strptime(row['signup_date'], '%Y-%m-%d %H:%M:%S')
        hours_since_reg = max((now - signup_time).total_seconds() / 3600, 0.1)  # 避免除零
        return min(row['usage_hours'] / hours_since_reg, 1.0)  # 不超过100%
    except:
        return 0.0


# 转换 numpy 类型
def convert_numpy_types(obj):
    if isinstance(obj, np.int64):
        return int(obj)
    elif isinstance(obj, np.float64):
        return float(obj)
    elif isinstance(obj, (list, tuple)):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    return obj


@app.route('/')
def index():
    global merchant_df
    return render_template('index_main.html')


# 功能面板
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')


# 注册路由
@app.route('/sign_up', methods=['GET', 'POST'])
def merchant_signup():
    global merchant_df, merchant_df_lock
    # 处理GET请求 - 显示注册表单
    if request.method == 'GET':
        return render_template('sign_up.html')  # 确保返回HTML页面

    # 获取表单数据
    data = request.get_json() if request.is_json else request.form

    merchant_name = data.get('merchant_name')
    source = data.get('source')
    category = data.get('category')
    region = data.get('region')

    # 验证必填字段
    if not all([merchant_name, source, category, region]):
        return jsonify({
            'status': 'error',
            'message': '所有字段都是必填的'
        }), 400

    now = datetime.now()
    new_merchant = {
        'id': len(merchant_df) + 1,
        'name': merchant_name,
        'category': category,
        'source': source,
        'signup_date': now.strftime('%Y-%m-%d %H:%M:%S'),
        'usage_hours': 0,  # 初始为0
        'region': region
    }

    # 使用锁确保线程安全
    with merchant_df_lock:
        merchant_df = pd.concat([merchant_df, pd.DataFrame([new_merchant])], ignore_index=True)
        # 保存到CSV
        merchant_df.to_csv(MERCHANT_DATA_FILE, index=False)

    # 在session中存储商家ID
    session['merchant_id'] = new_merchant['id']
    session['page_enter_time'] = time.time()

    cache.delete_memoized(get_dashboard_data)

    return jsonify({
        'status': 'success',
        'message': '商家注册成功',
        'redirect': url_for('dashboard'),  # 可以更改来源统计网页之后的跳转页面
        'merchant_id': new_merchant['id']
    })


# 商家登录端点
@app.route('/merchant_login', methods=['POST'])
def merchant_login():
    merchant_id = request.json.get('merchant_id')

    # 验证商家ID
    if merchant_id and merchant_id in merchant_df['id'].values:
        session['merchant_id'] = merchant_id
        session['page_enter_time'] = time.time()
        return jsonify({'status': 'success', 'merchant_id': merchant_id})

    return jsonify({'status': 'error', 'message': '商家ID无效'}), 401


@app.route('/api/track_usage', methods=['POST'])
def track_usage():
    global merchant_df, merchant_df_lock
    data = request.json
    merchant_id = data.get('merchant_id')
    session_seconds = data.get('session_seconds', 0)
    page = data.get('page', '')
    current_path = request.path  # 明确获取当前请求路径
    is_tracked_page = any(current_path.startswith(page) for page in TRACKED_PAGES) if current_path else False

    if not merchant_id or not is_tracked_page:
        return
    if not is_tracked_page:
        return jsonify({'status': 'error', 'message': 'Invalid tracking request'})
    if not merchant_id or merchant_id not in merchant_df['id'].values:
        return jsonify({'status': 'error', 'message': f'商家ID {merchant_id} 不存在'})

    # 转换为小时
    session_hours = session_seconds / 3600

    # 使用锁更新使用时长
    with merchant_df_lock:
        idx = merchant_df[merchant_df['id'] == merchant_id].index[0]
        merchant_df.loc[idx, 'usage_hours'] += session_hours
        merchant_df.to_csv(MERCHANT_DATA_FILE, index=False)

    return jsonify({
        'status': 'success',
        'merchant_id': merchant_id,
        'added_hours': session_hours,
        'total_hours': merchant_df.loc[idx, 'usage_hours']
    })


# 新增：商家数据导出接口
@app.route('/api/export_merchants', methods=['GET'])
def export_merchants():
    try:
        # 从请求参数获取筛选条件
        source_filter = request.args.get('source', '')
        category_filter = request.args.get('category', '')
        region_filter = request.args.get('region', '')
        active_filter = request.args.get('active', '')
        time_range = request.args.get('timeRange', 'month')

        # 应用筛选条件（这里简化处理，实际应根据条件过滤数据）
        # 应用筛选条件（匹配定义的过滤变量）
        filtered_df = merchant_df.copy()
        if source_filter:
            filtered_df = filtered_df[filtered_df['source'] == source_filter]
        if category_filter:
            filtered_df = filtered_df[filtered_df['category'] == category_filter]
        if region_filter:
            filtered_df = filtered_df[filtered_df['region'] == region_filter]
        if active_filter == 'active':
            filtered_df = filtered_df[filtered_df['activity_ratio'] > 0.4]
        elif active_filter == 'inactive':
            filtered_df = filtered_df[filtered_df['activity_ratio'] <= 0.4]

        # 创建内存文件
        output = io.BytesIO()

        # 使用ExcelWriter创建Excel文件
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            filtered_df.to_excel(writer, sheet_name='商家数据', index=False)

        output.seek(0)

        # 创建响应
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = 'attachment; filename=merchant_data.xlsx'
        response.headers['Content-type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        return response

    except Exception as e:
        logger.error(f"导出商家数据失败: {e}")
        return jsonify({'status': 'error', 'message': '导出失败'}), 500


# 商品数据导出接口
@app.route('/api/export_products', methods=['GET'])
def export_products():
    try:
        # 从请求参数获取平台筛选条件
        platforms = request.args.get('platforms', '').split(',')
        time_range = request.args.get('timeRange', 'month')

        # 收集所有平台的产品数据
        all_products = []
        for platform in platforms:
            if platform in ['taobao', 'xiaohongshu', 'jd', 'douyin']:
                products = get_platform_products(platform)
                all_products.extend(products)

        # 转换为DataFrame
        df = pd.DataFrame(all_products)

        # 创建内存文件
        output = io.BytesIO()

        # 使用ExcelWriter创建Excel文件
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='商品销售数据', index=False)

        output.seek(0)

        # 创建响应
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = 'attachment; filename=product_sales.xlsx'
        response.headers['Content-type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        return response
    except Exception as e:
        logger.error(f"导出商品数据失败: {e}")
        return jsonify({'status': 'error', 'message': '导出失败'}), 500


# 授权接口
@app.route('/api/auth/<platform>', methods=['GET'])
def get_auth_url(platform):
    # 小红书特殊处理
    if platform == 'xiaohongshu':
        config = PLATFORM_CONFIG['xiaohongshu']
        auth_url = (
            f"https://open.xiaohongshu.com/oauth/authorize"
            f"?app_id={config['app_id']}"
            f"&response_type=code"
            f"&redirect_uri=http://localhost:5001/api/callback/xiaohongshu"  # 注意端口是5001
            f"&state=STATE"
        )
        return jsonify({'auth_url': auth_url})
    elif platform not in ['taobao', 'jd', 'douyin']:
        return jsonify({'error': 'Authentication not required for this platform'}), 400

    auth_url = generate_auth_url(platform)
    if auth_url:
        return jsonify({'auth_url': auth_url})
    else:
        return jsonify({'error': 'Platform not supported'}), 400


# 授权回调接口
@app.route('/api/callback/<platform>', methods=['GET'])
def handle_platform_callback(platform):
    if platform not in ['taobao', 'jd', 'douyin']:
        return jsonify({'error': 'Invalid platform'}), 400

    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'Missing code parameter'}), 400

    token_data = handle_callback(platform, code)
    if token_data:
        return jsonify({'message': '授权成功', 'token': token_data})
    else:
        return jsonify({'error': '授权失败'}), 400


# 使用时长计算逻辑
@app.before_request
def track_merchant_usage():
    merchant_id = session.get('merchant_id')
    current_path = request.path  # 获取当前请求路径

    # 使用 TRACKED_PAGES
    is_tracked_page = any(current_path.startswith(page) for page in TRACKED_PAGES) if current_path else False

    if not merchant_id or not is_tracked_page:
        return
    # 使用更精确的计时方式
    current_time = time.time()
    enter_time = session.get('page_enter_time')

    if not enter_time:
        # 新会话开始，只设置进入时间不累加时长
        session['page_enter_time'] = current_time
    else:
        # 计算实际活动时长
        duration = min(current_time - enter_time, 300)  # 限制最大5分钟

        # 更新使用时长（转换为小时）
        duration_hours = duration / 3600


        with merchant_df_lock:
            if merchant_id in merchant_df['id'].values:
                idx = merchant_df.index[merchant_df['id'] == merchant_id].tolist()[0]
                merchant_df.loc[idx, 'usage_hours'] += duration_hours
                merchant_df.to_csv(MERCHANT_DATA_FILE, index=False)
                print(
                    f"商家 {merchant_id} 使用时长增加: {duration_hours:.3f}小时 (总计: {merchant_df.loc[idx, 'usage_hours']:.3f}小时)")
        # 重置进入时间
        session['page_enter_time'] = current_time


@app.route('/api/export_activity', methods=['GET'])
def export_activity():
    try:
        # 从请求参数获取筛选条件
        source_filter = request.args.get('source', '')
        category_filter = request.args.get('category', '')
        region_filter = request.args.get('region', '')
        active_filter = request.args.get('active', '')
        time_range = request.args.get('timeRange', 'month')

        # 使用锁确保线程安全
        with merchant_df_lock:
            filtered_df = merchant_df.copy()

        now = datetime.now()

        # 应用过滤条件
        if source_filter and source_filter != "全部来源":
            filtered_df = filtered_df[filtered_df['source'] == source_filter]
        if category_filter:
            filtered_df = filtered_df[filtered_df['category'] == category_filter]
        if region_filter:
            filtered_df = filtered_df[filtered_df['region'] == region_filter]

        # 计算注册至今的小时数和活跃度 - 使用全局函数
        filtered_df['signup_datetime'] = pd.to_datetime(filtered_df['signup_date'])
        filtered_df['hours_since_registration'] = (now - filtered_df['signup_datetime']).dt.total_seconds() / 3600
        filtered_df['activity_ratio'] = filtered_df.apply(
            lambda row: calculate_activity_ratio(row, now), axis=1
        )
        filtered_df['active'] = filtered_df['activity_ratio'] > 0.4

        # 应用活跃状态过滤
        if active_filter == 'active':
            filtered_df = filtered_df[filtered_df['active']]
        elif active_filter == 'inactive':
            filtered_df = filtered_df[~filtered_df['active']]

        # 时间范围过滤 - 修复条件逻辑
        if time_range != 'all':  # 只有当不是"全部时间"时才过滤
            if time_range == 'month':
                time_delta = timedelta(days=30)
            elif time_range == 'quarter':
                time_delta = timedelta(days=90)
            elif time_range == 'year':
                time_delta = timedelta(days=365)
            else:
                time_delta = timedelta(days=30)  # 默认30天

            # 应用时间范围过滤
            filtered_df = filtered_df[filtered_df['signup_datetime'] > (now - time_delta)]

        # 只保留需要的列
        result_df = filtered_df[['name', 'source', 'category', 'region',
                                 'hours_since_registration', 'usage_hours', 'activity_ratio']]

        # 创建内存文件
        output = io.BytesIO()

        # 使用ExcelWriter创建Excel文件
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            result_df.to_excel(writer, sheet_name='活跃度数据', index=False)

        output.seek(0)

        # 创建响应
        response = make_response(output.getvalue())
        response.headers['Content-Disposition'] = 'attachment; filename=activity_data.xlsx'
        response.headers['Content-type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

        return response
    except Exception as e:
        logger.error(f"导出活跃度数据失败: {e}")
        return jsonify({'status': 'error', 'message': '导出失败'}), 500


# 根据前端筛选条件（时间范围、平台、地区等）处理数据，返回不同看板所需结果。
@app.route('/api/dashboard/data')
@cache.cached(timeout=60, key_prefix=get_cache_key)  # 1分钟缓存
def get_dashboard_data():
    @after_this_request
    def compress_response(response):
        # 只压缩大于1KB的响应
        if len(response.data) > 1024:
            response.data = zlib.compress(response.data, level=6)
            response.headers['Content-Encoding'] = 'deflate'
            response.headers['Vary'] = 'Accept-Encoding'
        return response

        # 检查增量更新
        incremental_data = get_incremental_data()
        if incremental_data:
            app.logger.info(f"返回增量数据 for {get_cache_key()}")
            return jsonify(incremental_data)

    global merchant_df
    start_time = time.time()  # 记录开始时间
    now = datetime.now()

    # 获取过滤参数
    source_filter = request.args.get('source', '')
    category_filter = request.args.get('category', '')
    region_filter = request.args.get('region', '')
    active_filter = request.args.get('active', '')  # 'active' 或 'inactive'
    time_range = request.args.get('timeRange', 'month')  # 添加时间范围参数
    dashboard_type = request.args.get('type', 'internal')  # 区分看板类型

    # 复制数据进行过滤，避免修改原始数据
    filtered_df = merchant_df.copy()

    # 应用过滤条件
    if source_filter and source_filter != "全部来源":
        filtered_df = filtered_df[filtered_df['source'] == source_filter]
    if category_filter:
        filtered_df = filtered_df[filtered_df['category'] == category_filter]
    if region_filter:
        filtered_df = filtered_df[filtered_df['region'] == region_filter]

    # 计算注册至今的小时数和活跃度
    filtered_df['signup_datetime'] = pd.to_datetime(filtered_df['signup_date'])
    filtered_df['hours_since_registration'] = (now - filtered_df['signup_datetime']).dt.total_seconds() / 3600

    # 计算活跃度
    now = datetime.now()
    filtered_df['activity_ratio'] = filtered_df.apply(
        lambda row: calculate_activity_ratio(row, now), axis=1
    )

    filtered_df['active'] = filtered_df['activity_ratio'] > 0.4  # 活跃度阈值,可以手动更改

    # 应用活跃状态过滤
    if active_filter == 'active':
        filtered_df = filtered_df[filtered_df['active']]
    elif active_filter == 'inactive':
        filtered_df = filtered_df[~filtered_df['active']]

    # 时间范围过滤
    if time_range == 'month':
        time_delta = timedelta(days=30)
    elif time_range == 'quarter':
        time_delta = timedelta(days=90)
    elif time_range == 'year':
        time_delta = timedelta(days=365)
    else:
        time_delta = timedelta(days=30)  # 默认30天

    # 应用时间范围过滤
    if time_range != 'all':  # 添加"全部时间"选项
        filtered_df = filtered_df[filtered_df['signup_datetime'] > (now - time_delta)]

    # 准备返回数据
    response_data = {
        'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    active_rate = 0.0
    # 根据看板类型返回不同数据
    if dashboard_type == 'internal':  # 程序员看板
        # 来源分布
        source_counts = filtered_df['source'].value_counts().reset_index()
        source_counts.columns = ['name', 'value']
        response_data['source_data'] = source_counts.to_dict(orient='records')
        # source_counts = source_counts[source_counts['value'] > 0] #为0时不显示

        # 类别分布
        category_counts = filtered_df['category'].value_counts().reset_index()
        category_counts.columns = ['name', 'value']
        response_data['category_data'] = category_counts.to_dict(orient='records')
        # category_counts = category_counts[category_counts['value'] > 0] #为0时不显示

        # 区域分布
        region_counts = filtered_df['region'].value_counts().reset_index()
        region_counts.columns = ['name', 'value']
        response_data['region_data'] = region_counts.to_dict(orient='records')
        # region_counts = region_counts[region_counts['value'] > 0]  #为0时不显示

        # 时间趋势（按月）
        time_df = filtered_df.copy()
        time_df['signup_month'] = pd.to_datetime(time_df['signup_date']).dt.strftime('%Y-%m')
        monthly_counts = time_df.groupby('signup_month').size().reset_index(name='count')
        monthly_counts = monthly_counts.sort_values('signup_month')

        response_data['time_data'] = {
            'months': monthly_counts['signup_month'].tolist(),
            'counts': monthly_counts['count'].tolist()
        }

        # 活跃商家占比
        active_rate = filtered_df['active'].mean() * 100 if len(filtered_df) > 0 else 0
        response_data['active_rate'] = round(active_rate, 1)
        response_data['total_merchants'] = len(filtered_df)

        # 活跃度详情
        top_active = filtered_df.sort_values('activity_ratio', ascending=False).head(100000)
        response_data['activity_details'] = {
            'top_active': top_active[['name', 'hours_since_registration', 'usage_hours', 'activity_ratio']].to_dict(
                orient='records')
        }
    else:
        # 获取平台商品数据
        platforms = request.args.get('platforms', '').split(',')
        # 修改get_dashboard_data函数中的商品数据处理逻辑
        product_data = []
        for platform in platforms:
            if platform in ['taobao', 'xiaohongshu', 'jd', 'douyin']:
                products = get_platform_products(platform)
                # 确保数据结构一致性
                for p in products:
                    p['revenue'] = p.get('revenue', p['price'] * p['sales'])
                    p['profit'] = p.get('profit', p['revenue'] - (p.get('cost', 0) * p['sales']))
                product_data.extend(products)

        # 销售额和利润
        revenue = sum(p['revenue'] for p in product_data)
        profit = sum(p['profit'] for p in product_data)

        # 按平台分布
        platform_revenue = {}
        platform_profit = {}
        for p in product_data:
            platform = p['platform']
            platform_revenue[platform] = platform_revenue.get(platform, 0) + p['revenue']
            platform_profit[platform] = platform_profit.get(platform, 0) + p['profit']

        # 格式化分布数据
        revenue_distribution = [{'name': k, 'value': v} for k, v in platform_revenue.items()]
        profit_distribution = [{'name': k, 'value': v} for k, v in platform_profit.items()]

        response_data['revenue_profit'] = [{'revenue': revenue, 'profit': profit}]
        response_data['revenue_distribution'] = revenue_distribution
        response_data['profit_distribution'] = profit_distribution
        response_data['total_revenue'] = revenue
        response_data['total_profit'] = profit
        response_data['product_sales'] = product_data

    # 根据时间范围计算增长率
    period = time_range
    if dashboard_type == 'internal':
        response_data['total_merchants_growth'] = calculate_growth(
            len(filtered_df), period, 'merchants'
        )
        response_data['active_rate_growth'] = calculate_growth(
            active_rate, period, 'active_rate'
        )
    else:
        response_data['revenue_growth'] = calculate_growth(
            response_data['total_revenue'], period, 'revenue'
        )
        response_data['profit_growth'] = calculate_growth(
            response_data['total_profit'], period, 'profit'
        )

    # 更新历史数据
    if period != 'all':  # 不保存"全部时间"的历史数据
        with history_data_lock:
            history_data[period] = {
                'merchants': len(filtered_df),
                'active_rate': active_rate,
                'revenue': response_data.get('total_revenue', 0),
                'profit': response_data.get('total_profit', 0)
            }
            # 保存到文件
            with open(HISTORY_DATA_FILE, 'w') as f:
                json.dump(history_data, f)

    response_data = convert_numpy_types(response_data)

    # 在返回响应前添加增量更新逻辑
    cache_key = get_cache_key()
    response_data['last_update'] = datetime.now().isoformat()
    update_incremental_data(cache_key, response_data)  # 存储增量更新
    response_data = convert_numpy_types(response_data)

    # 只记录超过100ms的慢请求
    response_time = time.time() - start_time
    if response_time > 0.5:  # 500毫秒
        logger.warning(f"API响应时间过长: {response_time:.3f}秒")
    elif app.debug:  # 调试模式才显示所有日志
        logger.debug(f"API响应时间: {response_time:.3f}秒")

    return jsonify(response_data)



# 新增路由：程序员数据看板
@app.route('/dashboard_internal')
def dashboard_internal():
    return render_template('dashboard_internal.html')




# 文案智造器

if __name__ == '__main__':
    init_precompute_system()
    init_precompute_thread()  # 确保app已定义
    app.run(debug=True, port=5001)

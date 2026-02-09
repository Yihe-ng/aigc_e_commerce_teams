  # config/platform
import os

#得到密钥直接在相应的平台替换即可
PLATFORM_CONFIG = {
    'taobao': {
        'app_key': os.getenv('TAOBAO_APP_KEY', 'your_taobao_app_key'),
        'app_secret': os.getenv('TAOBAO_APP_SECRET', 'your_taobao_app_secret'),
        'api_url': 'https://eco.taobao.com/router/rest',
        'auth_url': 'https://oauth.taobao.com/token',
        'token_path': 'taobao_token.json'
    },
    'xiaohongshu': {
        'app_id': os.getenv('XHS_APP_ID', 'your_xhs_app_id'),
        'app_secret': os.getenv('XHS_APP_SECRET', 'your_xhs_app_secret'),
        'shop_sid': os.getenv('XHS_SHOP_SID', 'your_shop_sid'),
        'api_url': 'https://open.xiaohongshu.com/api/sns/v1',
        'token_path': 'xiaohongshu_token.json'
    },
    'jd': {
        'app_key': os.getenv('JD_APP_KEY', 'your_jd_app_key'),
        'app_secret': os.getenv('JD_APP_SECRET', 'your_jd_app_secret'),
        'api_url': 'https://api.jd.com/routerjson',
        'auth_url': 'https://oauth.jd.com/oauth/token',
        'token_path': 'jd_token.json'
    },
    'douyin': {
        'app_key': os.getenv('DOUYIN_APP_KEY', 'your_douyin_app_key'),
        'app_secret': os.getenv('DOUYIN_APP_SECRET', 'your_douyin_app_secret'),
        'api_url': 'https://open.douyin.com',
        'auth_url': 'https://open.douyin.com/oauth/access_token/',
        'token_path': 'douyin_token.json'
    }
}

#各大平台成本计算（需要自己查询平台网页实时更新)
COST_CONFIG = {
    'taobao': {
        'commission_rate': 0.02, #佣金
        'payment_fee': 0.006,    #手续费
        'logistics_cost': 8.0,   #物流成本
        'marketing_rate': 0.05   #营销
    },
    'xiaohongshu': {
        'commission_rate': 0.05,
        'payment_fee': 0.006,
        'logistics_cost': 7.0,
        'marketing_rate': 0.12
    },
    'jd': {
        'commission_rate': 0.05,
        'payment_fee': 0.006,
        'logistics_cost': 6.0,
        'marketing_rate': 0.08
    },
    'douyin': {
        'commission_rate': 0.03,
        'payment_fee': 0.006,
        'logistics_cost': 7.0,
        'marketing_rate': 0.15
    }
}
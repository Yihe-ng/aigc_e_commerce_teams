import os

# 1. 平台 API 配置 (之前的部分)
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

# 2. 积分/成本配置 (补全这部分解决报错)
COST_CONFIG = {
    'generate_xiaohongshu': {'free': 5, 'plus': 2, 'pro': 0},
    'generate_image': {'free': 10, 'plus': 5, 'pro': 0},
    'generate_video': {'free': 50, 'plus': 20, 'pro': 0},
    'analyze_customer': {'free': 5, 'plus': 1, 'pro': 0}
}
#入口文件main
import sys
import os
# --- 加载 .env 文件开始 ---
def load_env_file():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    if os.path.exists(env_path):
        print(f">>> Loading .env from {env_path}")
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    # 去除引号
                    if (value.startswith('"') and value.endswith('"')) or \
                       (value.startswith("'") and value.endswith("'")):
                        value = value[1:-1]
                    os.environ[key.strip()] = value.strip()

load_env_file()
# --- 加载 .env 文件结束 ---

os.environ['PATH'] += os.pathsep + os.path.join(os.getcwd(), "test", "ovr_lipsync", "ffmpeg", "bin")
import sys
import time
import re
from utils import config_util
from asr import ali_nls
from core import wsa_server
from gui import flask_server
from gui import aigc_server
from gui.window import MainWindow
from core import content_db
import pandas as pd
from flask import jsonify, send_from_directory


#载入配置
config_util.load_config()

# 获取项目根目录
project_root = os.path.dirname(os.path.abspath(__file__))

# 将项目根目录添加到 Python 路径
if project_root not in sys.path:
    sys.path.insert(0, project_root)
#是否为普通模式（桌面模式）
if config_util.start_mode == 'common':
    from PyQt5 import QtGui
    from PyQt5.QtWidgets import QApplication

#音频清理
def __clear_samples():
    if not os.path.exists("./samples"):
        os.mkdir("./samples")
    for file_name in os.listdir('./samples'):
        if file_name.startswith('sample-'):
            os.remove('./samples/' + file_name)

#日志文件清理
def __clear_logs():
    if not os.path.exists("./logs"):
        os.mkdir("./logs")
    for file_name in os.listdir('./logs'):
        if file_name.endswith('.log'):
            os.remove('./logs/' + file_name)

#ip替换,修改这里——file_path:需要修改的文件的路径   new_ip:新的ip
def replace_ip_in_file(file_path, new_ip):
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
    content = re.sub(r"127\.0\.0\.1", new_ip, content)
    content = re.sub(r"localhost", new_ip, content)
    with open(file_path, "w", encoding="utf-8") as file:
        file.write(content)


if __name__ == '__main__':
    __clear_samples()
    __clear_logs()

    # init_db
    contentdb = content_db.new_instance()
    contentdb.init_db()

    # ip替换
    if config_util.fay_url != "127.0.0.1:5000":
        replace_ip_in_file("gui/static/js/index.js", config_util.fay_url)

    # --- 关键修改开始 ---
    # 只有当不是 Flask 的重载进程时，才启动这些 WebSocket 服务
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        print(">>> 正在启动核心服务...")
        print(">>> Auto-starting WebSocket servers...")

        # 1. 启动数字人接口服务 (默认 10004)
        ws_server = wsa_server.new_instance(port=10004)
        ws_server.start_server()
        
        # 2. 额外监听 10000 并转发到 10004，兼容旧 UE5 客户端
        wsa_server.start_port_forwarder(listen_port=10000, target_port=10004)
        
        # 启动UI数据接口服务 (10003)
        web_ws_server = wsa_server.new_web_instance(port=10003)
        web_ws_server.start_server()

        # 启动阿里云asr
        if config_util.ASR_mode == "ali":
            ali_nls.start()
    # --- 关键修改结束 ---

    # 启动http服务器
    aigc_server.start()
    flask_server.start()  # web，如果这里面有 debug=True，它会重启子进程

    # ... 后面的代码保持不变 ...

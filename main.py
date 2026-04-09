#入口文件main
import atexit
import importlib
import os
import re
import subprocess
import sys
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
from utils import config_util
from asr import ali_nls
from core import wsa_server
from core import content_db


#载入配置
config_util.load_config()

# 获取项目根目录
project_root = os.path.dirname(os.path.abspath(__file__))

# 将项目根目录添加到 Python 路径
if project_root not in sys.path:
    sys.path.insert(0, project_root)

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


def start_frontend():
    """自动启动 Next.js 前端开发服务器"""
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend')
    
    # 检查 frontend 目录是否存在
    if not os.path.exists(frontend_dir):
        print(">>> frontend 目录不存在，跳过启动前端")
        return None
    
    # 检查 node_modules 是否存在
    if not os.path.exists(os.path.join(frontend_dir, 'node_modules')):
        print(">>> 警告: frontend/node_modules 不存在，请先运行 pnpm install")
        return None
    
    # 启动 pnpm dev
    print(">>> 正在启动 frontend (pnpm dev)...")
    
    # Windows 使用 shell=True
    process = subprocess.Popen(
        'pnpm dev',
        cwd=frontend_dir,
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    print(f">>> Frontend 已启动，PID: {process.pid}")
    return process


def stop_frontend(process):
    """关闭 frontend 进程"""
    if process:
        print(">>> 正在关闭 frontend...")
        process.terminate()
        process.wait()
        print(">>> Frontend 已关闭")


def start_http_services():
    services = [
        ("login_server", "gui.login_server"),
        ("aigc_server", "gui.aigc_server"),
        ("flask_server", "gui.flask_server"),
    ]
    for service_name, module_name in services:
        try:
            module = importlib.import_module(module_name)
            module.start()
        except Exception as e:
            print(f"Failed to start {service_name}: {e}")


if __name__ == '__main__':
    __clear_samples()
    __clear_logs()

    # init_db
    contentdb = content_db.new_instance()
    contentdb.init_db()

    # ip替换
    if config_util.backend_api_url != "127.0.0.1:5000":
        replace_ip_in_file("gui/static/js/index.js", config_util.backend_api_url)

    # --- 关键修改开始 ---
    # 只有当不是 Flask 的重载进程时，才启动这些 WebSocket 服务
    if os.environ.get('WERKZEUG_RUN_MAIN') != 'true':
        print(">>> 正在启动核心服务...")
        if wsa_server.ensure_bootstrap():
            print(">>> Auto-starting WebSocket servers...")

        # 启动阿里云asr
        if config_util.ASR_mode == "ali":
            ali_nls.start()
    # --- 关键修改结束 ---

    # 启动 frontend (Next.js 开发服务器)
    frontend_process = None
    try:
        frontend_process = start_frontend()
        if frontend_process:
            atexit.register(lambda: stop_frontend(frontend_process))
    except Exception as e:
        print(f">>> 启动 frontend 失败: {e}")

    # 启动 http 服务。按需导入，避免主进程启动时一次性加载所有重模块。
    start_http_services()

    # ... 后面的代码保持不变 ...

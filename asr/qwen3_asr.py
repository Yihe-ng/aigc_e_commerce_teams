
import requests
import threading
import os
from utils import config_util as cfg
from utils import util

class Qwen3ASR:
    def __init__(self, username):
        self.username = username
        self.url = cfg.qwen3_asr_url if hasattr(cfg, 'qwen3_asr_url') else "http://127.0.0.1:8001/asr"
        self.finalResults = ""
        self.done = False
        self.thread = None
        util.printInfo(1, self.username, f"Qwen3-ASR 客户端已初始化，服务端地址: {self.url}")

    def connect(self):
        """
        检查服务端是否可用
        """
        try:
            # 尝试访问健康检查接口
            health_url = self.url.replace("/asr", "/health")
            response = requests.get(health_url, timeout=2)
            if response.status_code == 200:
                util.printInfo(1, self.username, "Qwen3-ASR 服务端连接成功！")
                return True
            else:
                util.printInfo(1, self.username, "Qwen3-ASR 服务端响应异常，请检查服务端状态。")
                return False
        except Exception as e:
            util.printInfo(1, self.username, f"无法连接到 Qwen3-ASR 服务端: {e}")
            return False

    def start(self):
        self.done = False
        self.finalResults = ""

    def end(self):
        pass

    def send_url(self, file_path):
        """
        发送音频文件到 Qwen3-ASR 服务端。
        在单独的线程中执行，以匹配 recorder.py 期望的异步特性
        """
        self.done = False
        self.thread = threading.Thread(target=self._send_request, args=(file_path,))
        self.thread.start()

    def _send_request(self, file_path):
        try:
            util.printInfo(1, self.username, f"正在发送音频到 Qwen3-ASR: {file_path}")
            with open(file_path, 'rb') as f:
                files = {'file': f}
                # 增加超时时间以适应初次运行或长音频
                response = requests.post(self.url, files=files, timeout=120)
            
            if response.status_code == 200:
                result = response.json()
                self.finalResults = result.get("text", "")
                util.printInfo(1, self.username, f"Qwen3-ASR 识别结果: {self.finalResults}")
            else:
                util.printInfo(1, self.username, f"Qwen3-ASR 错误: {response.status_code} - {response.text}")
                self.finalResults = ""
        except requests.exceptions.Timeout:
             util.printInfo(1, self.username, f"Qwen3-ASR 请求超时 (120s)。请检查 GPU 负载或模型状态。")
             self.finalResults = ""
        except Exception as e:
            util.printInfo(1, self.username, f"Qwen3-ASR 异常: {e}")
            self.finalResults = ""
        finally:
            self.done = True


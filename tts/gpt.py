import os
import time
import json
import http.client
import socket
import traceback
import configparser
from urllib.parse import urlparse


class Speech:
    def __init__(self):
        # 读取配置文件 system.conf
        config = configparser.ConfigParser()

        # 修正：__file__ 是 tts/gpt.py，dirname 是 tts，再 dirname 是项目根目录
        project_root = os.path.dirname(os.path.dirname(__file__))
        conf_path = os.path.join(project_root, 'system.conf')

        print(f"[初始化] 正在尝试读取配置文件: {conf_path}")

        if not os.path.exists(conf_path):
            raise FileNotFoundError(f"配置文件不存在: {conf_path}")
        config.read(conf_path, encoding='utf-8')

        # 获取 GPT-SoVITS 相关配置（均在 DEFAULT 段下）
        tts_url = config.get('DEFAULT', 'gpt_tts_url', fallback='http://127.0.0.1:9880')
        parsed = urlparse(tts_url)

        self.api_host = parsed.hostname or '127.0.0.1'
        self.api_port = parsed.port or 9880

        # 修正：规范化路径，防止末尾斜杠导致双斜杠或路径错误
        raw_path = parsed.path or '/tts'
        self.api_path = raw_path.rstrip('/')
        if not self.api_path.startswith('/'):
            self.api_path = '/' + self.api_path

        print(f"[初始化] 解析 API 配置 -> Host: {self.api_host}, Port: {self.api_port}, Path: {self.api_path}")

        self.ref_audio_path = config.get('DEFAULT', 'ref_audio_path', fallback='')
        self.prompt_text = config.get('DEFAULT', 'gpt_prompt_text', fallback='')
        self.prompt_lang = config.get('DEFAULT', 'prompt_lang', fallback='zh')
        self.text_lang = config.get('DEFAULT', 'text_lang', fallback='zh')

        # 简单校验必填项
        if not self.ref_audio_path:
            raise ValueError("配置文件中缺少 ref_audio_path")
        # 修正：增加对参考音频文件是否存在的检查
        if not os.path.exists(self.ref_audio_path):
            raise FileNotFoundError(f"参考音频文件不存在: {self.ref_audio_path}")

        if not self.prompt_text:
            raise ValueError("配置文件中缺少 gpt_prompt_text")

    def connect(self):
        # 对于 HTTP 连接，无需额外连接操作，可保留占位
        return True

    def to_sample(self, text, voice_type):
        """
        将文本转换为语音，返回生成的音频文件路径
        :param text: 要合成的文本
        :param voice_type: 音色类型（GPT-SoVITS 中由参考音频决定，此处暂不使用）
        :return: 音频文件路径，失败返回 None
        """
        # 记录调用痕迹（便于调试）
        try:
            with open("to_sample_called.txt", "a", encoding="utf-8") as f:
                f.write(f"{time.time()}: text={text[:20]}..., voice_type={voice_type}\n")
        except:
            pass

        print(f"===== gpt.py: to_sample 被调用, voice_type={voice_type} =====")

        # 准备输出目录
        output_dir = "./samples"
        os.makedirs(output_dir, exist_ok=True)
        filename = f"gpt_tts_{int(time.time() * 1000)}.wav"
        output_path = os.path.join(output_dir, filename)

        # 构造请求 JSON
        data = {
            "text": text,
            "text_lang": self.text_lang,
            "ref_audio_path": self.ref_audio_path,
            "prompt_text": self.prompt_text,
            "prompt_lang": self.prompt_lang
        }
        json_body = json.dumps(data, ensure_ascii=False)

        print(f"请求 URL: http://{self.api_host}:{self.api_port}{self.api_path}")
        print(f"请求数据: {json_body}")

        conn = http.client.HTTPConnection(self.api_host, self.api_port, timeout=30)
        headers = {
            "Content-Type": "application/json",
            "Content-Length": str(len(json_body.encode('utf-8'))),
            "Connection": "close",
            "User-Agent": "GPT-SoVITS-Client/1.0"  # 可选，便于服务器日志识别
        }

        try:
            conn.request("POST", self.api_path, body=json_body.encode('utf-8'), headers=headers)
            response = conn.getresponse()
            print(f"响应状态码: {response.status} {response.reason}")
            resp_body = response.read()

            if response.status == 200:
                with open(output_path, 'wb') as f:
                    f.write(resp_body)
                print(f"音频保存至: {output_path}")
                return output_path
            else:
                try:
                    error_text = resp_body.decode('utf-8')
                except:
                    error_text = f"<二进制数据，长度 {len(resp_body)}>"
                print(f"错误响应体: {error_text[:200]}")
                return None
        except socket.timeout:
            print("连接超时")
            return None
        except Exception as e:
            print(f"异常: {e}")
            traceback.print_exc()
            return None
        finally:
            conn.close()

    def close(self):
        # 无需额外关闭操作
        pass

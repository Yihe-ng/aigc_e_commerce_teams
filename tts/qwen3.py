import requests
import time
import base64
import os
from utils import util, config_util as cfg
from tts import tts_voice
from utils.trace_utils import summarize_text, trace_log


def get_qwen_voices():
    return tts_voice.get_qwen_voice_options()


class Speech:
    def __init__(self):
        # 从配置中获取服务端地址，如果没有则使用默认值
        self.url = getattr(cfg, 'qwen3_tts_url', "http://127.0.0.1:8000/tts")
        self.last_error_code = ""
        self.last_error_detail = ""
        util.log(1, f"[TTS-CLIENT] Qwen3-TTS 客户端已初始化，服务端地址: {self.url}")

    def connect(self):
        """
        检查服务端是否可用
        """
        try:
            # 尝试访问健康检查接口
            health_url = self.url.replace("/tts", "/health")
            response = requests.get(health_url, timeout=2)
            if response.status_code == 200:
                util.log(1, "[TTS-CLIENT] Qwen3-TTS 服务端连接成功！")
            else:
                util.log(1, "[TTS-CLIENT] Qwen3-TTS 服务端响应异常，请检查服务端状态。")
        except Exception as e:
            util.log(1, f"[TTS-CLIENT] 无法连接到 Qwen3-TTS 服务端: {e}")

    def close(self):
        pass

    def to_sample(self, text, style, request_id=None):
        """
        将文字转换为语音采样文件
        :param text: 待转换文本
        :param style: 情绪指令 (此时已经是 tts_voice.py 中定义的中文指令)
        :return: 合成后的 wav 文件路径
        """
        # 获取当前 UI 选择的声音对象
        voice_type = tts_voice.get_voice_of(cfg.config["attribute"]["voice"])
        speaker = "vivian"
        if voice_type is not None:
            speaker = voice_type.value.get("voiceName", "vivian")
        
        # 此时的 style 如果是 Qwen3 音色，已经是对应的中文 instruct 了
        instruct = style if "语气" in str(style) else "用自然、平稳的语气说话"

        data = {
            "text": text,
            "instruct": instruct,
            "speaker": speaker,
            "language": "Chinese"
        }

        started_at = time.perf_counter()
        self.last_error_code = ""
        self.last_error_detail = ""

        try:
            util.log(1, f"[TTS-CLIENT] 正在向 Qwen3-TTS 请求合成: [{text[:20]}...] 指令: [{instruct}]，超时时间 120s")
            # 增加超时时间到 120s，以防模型在 4060 上初次运行冷启动过慢
            response = requests.post(self.url, json=data, timeout=120)
            
            if response.status_code == 200:
                res_json = response.json()
                if res_json.get("status") == "success":
                    if not res_json.get("audio_base64"):
                        self.last_error_code = "empty_audio"
                        self.last_error_detail = "TTS returned empty audio payload"
                        trace_log(
                            module="tts_client",
                            stage="qwen3_tts",
                            status="error",
                            request_id=request_id,
                            error=self.last_error_code,
                            time_cost=(time.perf_counter() - started_at) * 1000,
                            speaker=speaker,
                            text_len=len(text),
                        )
                        return None
                    # 解码 Base64 音频数据
                    audio_content = base64.b64decode(res_json["audio_base64"])
                    
                    # 生成保存路径
                    file_url = './samples/sample-' + str(int(time.time() * 1000)) + '.wav'
                    
                    # 确保目录存在
                    if not os.path.exists('./samples/'):
                        os.makedirs('./samples/')
                        
                    with open(file_url, 'wb') as f:
                        f.write(audio_content)
                    
                    time_cost = res_json.get("time_cost_ms", 0)
                    util.log(1, f"[TTS-CLIENT] Qwen3-TTS 合成成功，耗时: {time_cost:.1f}ms, 保存至 {file_url}")
                    trace_log(
                        module="tts_client",
                        stage="qwen3_tts",
                        status="ok",
                        request_id=request_id,
                        time_cost=(time.perf_counter() - started_at) * 1000,
                        speaker=speaker,
                        text_len=len(text),
                        text_preview=summarize_text(text),
                        filename=os.path.basename(file_url),
                    )
                    return file_url
                else:
                    self.last_error_code = "provider_error"
                    self.last_error_detail = str(res_json.get("detail") or "TTS provider returned error")
                    util.log(1, f"[TTS-CLIENT][x] Qwen3-TTS 转换失败: 服务端返回错误 {res_json.get('detail')}")
                    trace_log(
                        module="tts_client",
                        stage="qwen3_tts",
                        status="error",
                        request_id=request_id,
                        error=self.last_error_code,
                        time_cost=(time.perf_counter() - started_at) * 1000,
                        speaker=speaker,
                        text_len=len(text),
                    )
            else:
                self.last_error_code = "provider_error"
                self.last_error_detail = f"TTS HTTP {response.status_code}"
                util.log(1, f"[TTS-CLIENT][x] Qwen3-TTS 请求失败: 状态码 {response.status_code}")
                trace_log(
                    module="tts_client",
                    stage="qwen3_tts",
                    status="error",
                    request_id=request_id,
                    error=self.last_error_code,
                    time_cost=(time.perf_counter() - started_at) * 1000,
                    speaker=speaker,
                    text_len=len(text),
                )
                
        except requests.exceptions.Timeout:
            self.last_error_code = "provider_unreachable"
            self.last_error_detail = "TTS request timeout"
            util.log(1, f"[TTS-CLIENT][x] Qwen3-TTS 请求超时 (120s)，请检查 GPU 负载或显存是否充足。")
            trace_log(
                module="tts_client",
                stage="qwen3_tts",
                status="error",
                request_id=request_id,
                error=self.last_error_code,
                time_cost=(time.perf_counter() - started_at) * 1000,
                speaker=speaker,
                text_len=len(text),
            )
        except requests.RequestException as e:
            self.last_error_code = "provider_unreachable"
            self.last_error_detail = str(e)
            util.log(1, f"[TTS-CLIENT][x] Qwen3-TTS 请求异常: {e}")
            trace_log(
                module="tts_client",
                stage="qwen3_tts",
                status="error",
                request_id=request_id,
                error=self.last_error_code,
                time_cost=(time.perf_counter() - started_at) * 1000,
                speaker=speaker,
                text_len=len(text),
            )
        except Exception as e:
            self.last_error_code = "provider_error"
            self.last_error_detail = str(e)
            util.log(1, f"[TTS-CLIENT][x] Qwen3-TTS 转换异常: {e}")
            trace_log(
                module="tts_client",
                stage="qwen3_tts",
                status="error",
                request_id=request_id,
                error=self.last_error_code,
                time_cost=(time.perf_counter() - started_at) * 1000,
                speaker=speaker,
                text_len=len(text),
            )
            
        return None

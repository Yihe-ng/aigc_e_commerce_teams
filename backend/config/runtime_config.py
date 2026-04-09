from utils import config_util


def reload_runtime_config():
    config_util.load_config()
    return config_util.config


def get_runtime_config():
    return config_util.config


def save_runtime_config(config_data):
    config_util.save_config(config_data)
    config_util.load_config()
    return config_util.config


def get_backend_api_url():
    return getattr(config_util, "backend_api_url", "127.0.0.1:5000")


def get_asr_url():
    return getattr(config_util, "qwen3_asr_url", "http://127.0.0.1:8001/asr")


def get_tts_url():
    return getattr(config_util, "qwen3_tts_url", "http://127.0.0.1:8000/tts")


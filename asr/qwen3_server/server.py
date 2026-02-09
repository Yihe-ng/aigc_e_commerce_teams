
import os
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
import torch
import tempfile
import shutil
import sys
from unittest.mock import MagicMock
from modelscope import snapshot_download

# Mock nagisa 以避免导入时的运行时错误
class MockNagisa:
    def __init__(self):
        self.tagger = MagicMock()
sys.modules['nagisa'] = MockNagisa()

from qwen_asr.inference.qwen3_asr import Qwen3ASRModel

# 初始化 FastAPI
app = FastAPI(title="Qwen3-ASR API Server")

# 配置
MODEL_ID = "Qwen/Qwen3-ASR-0.6B"
DEVICE = "cuda:0" if torch.cuda.is_available() else "cpu"
TORCH_DTYPE = torch.float16 if torch.cuda.is_available() else torch.float32

# 全局模型变量
asr_model = None

@app.on_event("startup")
def load_model():
    """启动时加载模型"""
    global asr_model
    try:
        print("="*50)
        print(f"正在从 ModelScope 下载/检查模型: {MODEL_ID}...")
        
        # 使用 ModelScope 下载模型
        model_dir = snapshot_download(MODEL_ID)
        print(f"模型准备就绪于: {model_dir}")
        
        print(f"正在加载模型到 {DEVICE}...")
        # 直接使用 qwen_asr 包中的类加载
        asr_model = Qwen3ASRModel.from_pretrained(
            model_dir, 
            torch_dtype=TORCH_DTYPE,
            device_map=DEVICE,
            trust_remote_code=True
        )
        print("模型加载成功！服务已就绪。")
        print("="*50)
    except Exception as e:
        print(f"模型加载错误: {e}")
        print("请检查网络连接或 ModelScope 访问权限。")
        # 此处不抛出异常以允许服务启动 (以便健康检查返回失败)，
        # 或者抛出异常以快速失败。TTS 代码捕获并打印异常。
        # 我们将打印并让它在请求时失败，如果模型为 None。

@app.post("/asr")
async def asr_endpoint(file: UploadFile = File(...)):
    if asr_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # 将上传的文件保存到临时文件
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存文件失败: {e}")

    try:
        # 执行推理
        print(f"Processing file: {tmp_path}, Size: {os.path.getsize(tmp_path)} bytes")
        result = asr_model.transcribe(tmp_path)
        print(f"Raw inference result: {result}, Type: {type(result)}")
        
        text = ""
        if isinstance(result, list) and len(result) > 0:
             if hasattr(result[0], 'text'):
                 text = "".join([r.text for r in result])
             elif isinstance(result[0], dict) and 'text' in result[0]:
                 text = "".join([r['text'] for r in result])
             else:
                 text = str(result)
        elif hasattr(result, 'text'):
             text = result.text
        elif isinstance(result, dict) and 'text' in result:
             text = result['text']
        else:
             text = str(result)
             
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"推理失败: {e}")
    finally:
        # 清理
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except:
                pass

@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": asr_model is not None}

@app.get("/")
async def root():
    """返回服务信息的根端点"""
    return {
        "service": "Qwen3-ASR API Server",
        "status": "running",
        "docs_url": "/docs",
        "health_check": "/health",
        "model_loaded": asr_model is not None
    }

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """处理浏览器自动 favicon 请求"""
    return {}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)

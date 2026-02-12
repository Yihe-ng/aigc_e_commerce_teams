import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from qwen_tts import Qwen3TTSModel
import os
import time
import base64
import io
from modelscope import snapshot_download

app = FastAPI(title="Qwen3-TTS API Server")

# 全局变量存储模型
model = None

class TTSRequest(BaseModel):
    text: str
    instruct: str = "用自然、平稳的语气说话"
    speaker: str = "vivian"
    language: str = "Chinese"

@app.on_event("startup")
def load_model():
    """服务启动时加载模型"""
    global model
    try:
        print("="*50)
        print("正在从 ModelScope 下载/检查 Qwen3-TTS-12Hz-0.6B-CustomVoice 模型...")
        
        # 强制使用 ModelScope 下载模型到本地缓存
        model_dir = snapshot_download("Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice")
        print(f"模型已准备就绪，路径: {model_dir}")
        
        print("正在加载模型到显存 (RTX 4060)...")
        # 条件启用 flash-attn，加速注意力；未安装时安全回退
        use_flash = False
        try:
            import flash_attn
            print(f"检测到 flash-attn 版本: {getattr(flash_attn, '__version__', 'unknown')}")
            use_flash = True
        except Exception as e:
            print(f"未启用 flash-attn: {e}")
        # 针对 4060 开启 bfloat16
        model = Qwen3TTSModel.from_pretrained(
            model_dir,
            device_map="cuda:0",
            dtype=torch.bfloat16,
            attn_implementation="flash_attention_2" if use_flash else None
        )
        # 预热一次，降低首个请求的冷启动延迟
        try:
            _wavs, _sr = model.generate_custom_voice(
                text="预热",
                language="Chinese",
                speaker="vivian",
                instruct="用自然、平稳的语气说话"
            )
            print("模型预热完成")
        except Exception as e:
            print(f"模型预热失败: {e}")
        print("模型加载成功！服务已就绪。")
        print("="*50)
    except Exception as e:
        print(f"模型加载失败: {e}")
        print("请检查网络连接是否正常（建议开启手机热点尝试或检查 ModelScope 访问权限）。")

@app.post("/tts")
async def generate_tts(request: TTSRequest):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        start_time = time.time()
        print(f"收到合成请求: text='{request.text[:20]}...', speaker='{request.speaker}', instruct='{request.instruct}'")
        
        # 1. 模型推理
        inference_start = time.time()
        # 调用 Qwen3-TTS 生成音频
        wavs, sr = model.generate_custom_voice(
            text=request.text,
            language=request.language,
            speaker=request.speaker,
            instruct=request.instruct
        )
        inference_time = (time.time() - inference_start) * 1000
        print(f"模型推理完成，耗时: {inference_time:.2f}ms")
        
        # 2. 音频处理与编码
        encoding_start = time.time()
        # 关键修复：确保张量被移至 CPU 并转换为 numpy 数组，sf.write 才能正确处理
        audio_data = wavs[0]
        if torch.is_tensor(audio_data):
            audio_data = audio_data.detach().cpu().numpy()
            
        buffer = io.BytesIO()
        sf.write(buffer, audio_data, sr, format='WAV')
        audio_content = buffer.getvalue()
        audio_base64 = base64.b64encode(audio_content).decode('utf-8')
        
        encoding_time = (time.time() - encoding_start) * 1000
        total_time = (time.time() - start_time) * 1000
        print(f"音频编码完成，耗时: {encoding_time:.2f}ms，总计耗时: {total_time:.2f}ms")
        
        return {
            "status": "success",
            "audio_base64": audio_base64,
            "format": "wav",
            "sample_rate": sr,
            "time_cost_ms": total_time
        }
    except Exception as e:
        print(f"合成出错: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": model is not None}

@app.get("/")
async def root():
    """根路径返回服务信息，避免 404"""
    return {
        "service": "Qwen3-TTS API Server",
        "status": "running",
        "docs_url": "/docs",
        "health_check": "/health",
        "model_loaded": model is not None
    }

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """处理浏览器自动请求 favicon.ico"""
    return {}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

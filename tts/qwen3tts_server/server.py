import base64
import inspect
import io
import time

import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Qwen3-TTS API Server")

model = None
model_error = None
model_generate_signature = None

MODEL_ID = "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice"
DEFAULT_SAMPLE_RATE = 24000
DEFAULT_CHUNK_SIZE = 8


class TTSRequest(BaseModel):
    text: str
    instruct: str = "用自然、平稳的语气说话"
    speaker: str = "vivian"
    language: str = "Chinese"


def _method_accepts_argument(name: str) -> bool:
    return model_generate_signature is not None and name in model_generate_signature.parameters


def _prepare_generate_kwargs(request: TTSRequest) -> dict:
    kwargs = {
        "text": request.text,
        "language": request.language,
        "speaker": request.speaker,
    }

    if _method_accepts_argument("instruct"):
        kwargs["instruct"] = request.instruct
    if _method_accepts_argument("chunk_size"):
        kwargs["chunk_size"] = DEFAULT_CHUNK_SIZE

    return kwargs


def _to_numpy_audio(chunk):
    if chunk is None:
        return None
    if torch.is_tensor(chunk):
        return chunk.detach().cpu().numpy()
    return np.asarray(chunk)


def _normalize_chunk_payload(chunk_result):
    if isinstance(chunk_result, tuple):
        if len(chunk_result) == 3:
            audio_chunk, sample_rate, _timing = chunk_result
            return audio_chunk, sample_rate
        if len(chunk_result) == 2:
            audio_chunk, sample_rate = chunk_result
            return audio_chunk, sample_rate
        if len(chunk_result) == 1:
            return chunk_result[0], None
    return chunk_result, None


def _collect_audio_from_stream(request: TTSRequest):
    audio_chunks = []
    sample_rate = DEFAULT_SAMPLE_RATE

    for chunk_result in model.generate_custom_voice_streaming(**_prepare_generate_kwargs(request)):
        audio_chunk, chunk_sample_rate = _normalize_chunk_payload(chunk_result)
        audio_array = _to_numpy_audio(audio_chunk)
        if audio_array is None:
            continue

        audio_array = np.asarray(audio_array).reshape(-1)
        if audio_array.size == 0:
            continue

        audio_chunks.append(audio_array)
        if chunk_sample_rate:
            sample_rate = int(chunk_sample_rate)

    if not audio_chunks:
        raise RuntimeError("No audio generated")

    return np.concatenate(audio_chunks, axis=0), sample_rate


@app.on_event("startup")
def load_model():
    global model
    global model_error
    global model_generate_signature

    try:
        print("=" * 60)
        print(f"正在加载 Faster Qwen3-TTS 模型: {MODEL_ID}")

        from faster_qwen3_tts import FasterQwen3TTS

        if torch.cuda.is_available():
            print(f"CUDA 可用: {torch.cuda.get_device_name(0)}")
        else:
            print("警告: CUDA 不可用，将使用 CPU 推理")

        model = FasterQwen3TTS.from_pretrained(MODEL_ID)
        model_error = None
        model_generate_signature = inspect.signature(model.generate_custom_voice_streaming)

        try:
            list(
                model.generate_custom_voice_streaming(
                    text="预热",
                    language="Chinese",
                    speaker="vivian",
                    **({"chunk_size": DEFAULT_CHUNK_SIZE} if _method_accepts_argument("chunk_size") else {}),
                )
            )
            print("模型预热完成")
        except Exception as exc:
            print(f"模型预热失败（非致命）: {exc}")

        print("Faster Qwen3-TTS 服务已就绪")
        print("=" * 60)
    except Exception as exc:
        model = None
        model_generate_signature = None
        model_error = str(exc)
        print(f"模型加载失败: {exc}")


@app.post("/tts")
async def generate_tts(request: TTSRequest):
    if model is None:
        detail = "Model not loaded" if not model_error else f"Model not loaded: {model_error}"
        raise HTTPException(status_code=500, detail=detail)

    try:
        start_time = time.time()
        print(
            f"收到合成请求: text='{request.text[:20]}...', "
            f"speaker='{request.speaker}', instruct='{request.instruct}'"
        )

        inference_start = time.time()
        audio_data, sample_rate = _collect_audio_from_stream(request)
        inference_time = (time.time() - inference_start) * 1000
        print(f"模型推理完成，耗时: {inference_time:.2f}ms")

        encoding_start = time.time()
        buffer = io.BytesIO()
        sf.write(buffer, audio_data, sample_rate, format="WAV")
        audio_content = buffer.getvalue()
        audio_base64 = base64.b64encode(audio_content).decode("utf-8")

        encoding_time = (time.time() - encoding_start) * 1000
        total_time = (time.time() - start_time) * 1000
        print(f"音频编码完成，耗时: {encoding_time:.2f}ms，总耗时: {total_time:.2f}ms")

        return {
            "status": "success",
            "audio_base64": audio_base64,
            "format": "wav",
            "sample_rate": sample_rate,
            "time_cost_ms": total_time,
        }
    except Exception as exc:
        print(f"合成出错: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": model is not None}


@app.get("/")
async def root():
    return {
        "service": "Qwen3-TTS API Server",
        "status": "running",
        "docs_url": "/docs",
        "health_check": "/health",
        "model_loaded": model is not None,
    }


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return {}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)

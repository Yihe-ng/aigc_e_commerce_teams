import io
import time
import requests

from pydub import AudioSegment

from backend.config import runtime_config
from utils.runtime_checks import find_ffmpeg_executable
from utils.trace_utils import summarize_text, trace_log

_QWEN3_ASR_SESSION = requests.Session()


class Qwen3AsrAdapter:
    @staticmethod
    def _error_payload(error_code: str, detail: str, request_id: str | None):
        return {
            "error": error_code,
            "error_code": error_code,
            "detail": detail,
            "request_id": request_id or "",
        }

    def transcribe_upload(self, upload, request_id: str | None = None):
        safe_name = upload.filename or "recording.webm"
        audio_data = upload.read()
        started_at = time.perf_counter()

        if not safe_name.lower().endswith(".wav"):
            ffmpeg_path = find_ffmpeg_executable()
            if not ffmpeg_path:
                payload = self._error_payload("ffmpeg_missing", "FFmpeg executable not found for audio conversion", request_id)
                trace_log(
                    module="asr_adapter",
                    stage="qwen3_asr",
                    status="error",
                    request_id=request_id,
                    error=payload["error_code"],
                    time_cost=(time.perf_counter() - started_at) * 1000,
                    filename=safe_name,
                    source_bytes=len(audio_data),
                )
                return payload, 503
            try:
                audio = AudioSegment.from_file(io.BytesIO(audio_data))
                audio = audio.set_frame_rate(16000)
                audio = audio.set_channels(1)
                wav_buffer = io.BytesIO()
                audio.export(wav_buffer, format="wav")
                wav_buffer.seek(0)
                safe_name = (
                    safe_name.rsplit(".", 1)[0] + ".wav"
                    if "." in safe_name
                    else safe_name + ".wav"
                )
                audio_data = wav_buffer.read()
            except Exception as exc:
                payload = self._error_payload("provider_error", f"Audio conversion failed: {exc}", request_id)
                trace_log(
                    module="asr_adapter",
                    stage="qwen3_asr",
                    status="error",
                    request_id=request_id,
                    error=payload["error_code"],
                    time_cost=(time.perf_counter() - started_at) * 1000,
                    filename=safe_name,
                    source_bytes=len(audio_data),
                )
                return payload, 400

        try:
            response = _QWEN3_ASR_SESSION.post(
                runtime_config.get_asr_url(),
                files={"file": (safe_name, audio_data, "audio/wav")},
                timeout=180,
            )
        except requests.RequestException as exc:
            payload = self._error_payload("provider_unreachable", str(exc), request_id)
            trace_log(
                module="asr_adapter",
                stage="qwen3_asr",
                status="error",
                request_id=request_id,
                error=payload["error_code"],
                time_cost=(time.perf_counter() - started_at) * 1000,
                filename=safe_name,
                source_bytes=len(audio_data),
            )
            return payload, 503
        try:
            payload = response.json()
        except ValueError:
            payload = {"error": response.text or "Invalid ASR response"}
        if response.status_code >= 400:
            payload = self._error_payload(
                "provider_error",
                str(payload.get("detail") or payload.get("error") or f"ASR HTTP {response.status_code}"),
                request_id,
            )
        elif not str(payload.get("text", "") or "").strip():
            payload = {
                "text": "",
                "error": "empty_text",
                "error_code": "empty_text",
                "detail": "ASR returned empty text",
                "request_id": request_id or "",
            }
            response_status = 422
        else:
            payload.setdefault("request_id", request_id or "")
            response_status = response.status_code

        if response.status_code >= 400:
            response_status = 502
        trace_log(
            module="asr_adapter",
            stage="qwen3_asr",
            status="ok" if response_status < 400 else "error",
            request_id=request_id,
            error="" if response_status < 400 else summarize_text(payload.get("error_code") or payload.get("error") or payload.get("detail")),
            time_cost=(time.perf_counter() - started_at) * 1000,
            filename=safe_name,
            source_bytes=len(audio_data),
            asr_status=response_status,
            text_len=len(str(payload.get("text", "") or "")),
        )
        return payload, response_status


qwen3_asr_adapter = Qwen3AsrAdapter()

import json
import os
import time
import threading
from pathlib import Path
from urllib.parse import urlparse

from flask import jsonify, send_file

import avatar_runtime
from backend.adapters.asr.qwen3_adapter import qwen3_asr_adapter
from backend.config import runtime_config
from backend.schemas.live_dto import ChatCompletionRequest, ChatRequest, HistoryRequest
from core import content_db, member_db, wsa_server
from core.interact import Interact
from scheduler.thread_manager import MyThread
from tts import qwen3, tts_voice, volcano_tts
from utils.runtime_checks import build_health_url, find_ffmpeg_executable, probe_http_health, probe_tcp_port
from utils.trace_utils import ensure_request_id, summarize_text, trace_log


class LiveService:
    """Live2D-oriented service chain with a deliberately short call path."""

    def __init__(self):
        self._voice_lock = threading.RLock()
        self._voice_list = None
        self._latest_audio_log_lock = threading.RLock()
        self._latest_audio_miss_count = 0

    def _trace_latest_audio(self, *, request_id: str, since: int | None, total_files: int, filtered_files: int,
                            matched_filename: str = "", matched_mtime_ms: int | None = None):
        debug_enabled = os.getenv("LIVE_AUDIO_POLL_DEBUG", "").lower() in {"1", "true", "yes", "on"}
        with self._latest_audio_log_lock:
            if matched_filename:
                self._latest_audio_miss_count = 0
                trace_log(
                    module="live_service",
                    stage="latest_audio",
                    status="ok",
                    request_id=request_id,
                    since=since,
                    total_files=total_files,
                    filtered_files=filtered_files,
                    matched_filename=matched_filename,
                    matched_mtime_ms=matched_mtime_ms or "",
                    miss_count=0,
                )
                return

            self._latest_audio_miss_count += 1
            miss_count = self._latest_audio_miss_count
            if debug_enabled or miss_count == 1 or miss_count % 10 == 0:
                trace_log(
                    module="live_service",
                    stage="latest_audio",
                    status="empty",
                    request_id=request_id,
                    since=since,
                    total_files=total_files,
                    filtered_files=filtered_files,
                    matched_filename="",
                    miss_count=miss_count,
                )

    def _get_voice_list(self, force_reload: bool = False):
        with self._voice_lock:
            if self._voice_list is None or force_reload:
                runtime_config.reload_runtime_config()
                try:
                    self._voice_list = tts_voice.merge_voice_options(
                        tts_voice.get_builtin_voice_options(),
                        tts_voice.get_ali_voice_options(),
                        volcano_tts.get_volcano_voices(),
                        qwen3.get_qwen_voices(),
                    )
                except Exception:
                    self._voice_list = tts_voice.get_builtin_voice_options()
            return [voice.copy() for voice in self._voice_list]

    def _ensure_runtime(self):
        web = wsa_server.new_web_instance(port=10003)
        if not web.is_running():
            web.start_server()
        human = wsa_server.new_instance(port=10004)
        if not human.is_running():
            human.start_server()
        if not avatar_runtime.is_running() or avatar_runtime.get_instance() is None:
            return avatar_runtime.start()
        return avatar_runtime.get_instance()

    def _broadcast_live_state(self, state: int):
        web = wsa_server.get_web_instance()
        if web and web.is_running():
            web.add_cmd({"liveState": state})

    def get_runtime_payload(self):
        config = runtime_config.reload_runtime_config()
        voices = self._get_voice_list(force_reload=True)
        return {"config": config, "voice_list": voices}

    def save_runtime_payload(self, request_data):
        data = request_data.values.get("data")
        config_data = json.loads(data) if data else request_data.get_json(force=True)
        cfg = config_data.get("config", config_data)
        runtime_config.save_runtime_config(cfg)
        self._get_voice_list(force_reload=True)
        return {"result": "successful"}

    def start_live(self):
        runtime_config.reload_runtime_config()
        self._ensure_runtime()
        self._broadcast_live_state(1)
        return {"result": "successful"}

    def stop_live(self):
        if avatar_runtime.is_running():
            avatar_runtime.stop()
        web = wsa_server.get_web_instance()
        if web and web.is_running():
            web.stop_server()
        human = wsa_server.get_instance()
        if human and human.is_running():
            human.stop_server()
        self._broadcast_live_state(0)
        return {"result": "successful"}

    def get_message_history(self, request_data):
        raw_data = request_data.form.get("data")
        if not raw_data:
            return {"list": []}

        try:
            payload = json.loads(raw_data)
        except Exception:
            return {"list": []}

        dto = HistoryRequest.from_payload(payload)
        uid = member_db.new_instance().find_user(dto.username)
        if uid == 0:
            return {"list": []}

        rows = content_db.new_instance().get_list("all", "desc", 1000, uid)
        result = [
            {
                "type": row[0],
                "way": row[1],
                "content": row[2],
                "createtime": row[3],
                "timetext": row[4],
                "username": row[5],
            }
            for row in reversed(rows)
        ]
        return {"list": result}

    def get_member_list(self):
        users = member_db.new_instance().get_all_users()
        return {"list": [{"uid": row[0], "username": row[1]} for row in users]}

    def submit_chat(self, payload, request_id: str | None = None):
        started_at = time.perf_counter()
        dto = ChatRequest.from_payload(payload)
        effective_request_id = ensure_request_id(request_id or dto.request_id)
        if not dto.text:
            trace_log(
                module="live_service",
                stage="submit_chat",
                status="error",
                request_id=effective_request_id,
                error="empty_text",
                time_cost=(time.perf_counter() - started_at) * 1000,
                user=dto.user,
            )
            return {"error": "Empty text", "request_id": effective_request_id}, 400

        avatar = self._ensure_runtime()
        interact = Interact("text", 1, {"user": dto.user, "msg": dto.text, "request_id": effective_request_id})
        trace_log(
            module="live_service",
            stage="submit_chat",
            status="ok",
            request_id=effective_request_id,
            time_cost=(time.perf_counter() - started_at) * 1000,
            user=dto.user,
            text_len=len(dto.text),
            text_preview=summarize_text(dto.text),
        )
        MyThread(target=avatar.on_interact, args=[interact]).start()
        return {"status": "success", "message": "Interaction started", "request_id": effective_request_id}, 200

    def transcribe_audio(self, upload, request_id: str | None = None):
        started_at = time.perf_counter()
        effective_request_id = ensure_request_id(request_id)
        if upload is None or upload.filename == "":
            trace_log(
                module="live_service",
                stage="transcribe_audio",
                status="error",
                request_id=effective_request_id,
                error="missing_audio_file",
                time_cost=(time.perf_counter() - started_at) * 1000,
            )
            return {"error": "Missing audio file", "request_id": effective_request_id}, 400
        try:
            payload, status = qwen3_asr_adapter.transcribe_upload(upload, request_id=effective_request_id)
            payload.setdefault("request_id", effective_request_id)
            trace_log(
                module="live_service",
                stage="transcribe_audio",
                status="ok" if status < 400 else "error",
                request_id=effective_request_id,
                error="" if status < 400 else summarize_text(payload.get("error") or payload.get("detail")),
                time_cost=(time.perf_counter() - started_at) * 1000,
                filename=getattr(upload, "filename", ""),
                asr_status=status,
                text_len=len(str(payload.get("text", "") or "")),
            )
            return payload, status
        except Exception as exc:
            trace_log(
                module="live_service",
                stage="transcribe_audio",
                status="error",
                request_id=effective_request_id,
                error=summarize_text(exc),
                time_cost=(time.perf_counter() - started_at) * 1000,
                filename=getattr(upload, "filename", ""),
            )
            return {"error": f"Audio conversion failed: {exc}", "request_id": effective_request_id}, 400

    def serve_audio_file(self, filename):
        audio_dir = os.path.join(os.getcwd(), "samples")
        audio_path = os.path.join(audio_dir, filename)
        if not os.path.isfile(audio_path):
            return jsonify({"error": "Audio file not found"}), 404
        return send_file(audio_path)

    def get_latest_audio(self, since: int | None, request_id: str | None = None):
        effective_request_id = ensure_request_id(request_id)
        samples_dir = Path(os.getcwd()) / "samples"
        if not samples_dir.exists():
            self._trace_latest_audio(
                request_id=effective_request_id,
                since=since,
                total_files=0,
                filtered_files=0,
            )
            return {"audio": None, "request_id": effective_request_id}

        all_candidates = [path for path in samples_dir.glob("sample-*.wav") if path.is_file()]
        candidates = list(all_candidates)
        if since is not None:
            candidates = [path for path in candidates if int(path.stat().st_mtime * 1000) >= since]
        if not candidates:
            self._trace_latest_audio(
                request_id=effective_request_id,
                since=since,
                total_files=len(all_candidates),
                filtered_files=0,
            )
            return {"audio": None, "request_id": effective_request_id}

        latest = max(candidates, key=lambda path: path.stat().st_mtime)
        mtime_ms = int(latest.stat().st_mtime * 1000)
        self._trace_latest_audio(
            request_id=effective_request_id,
            since=since,
            total_files=len(all_candidates),
            filtered_files=len(candidates),
            matched_filename=latest.name,
            matched_mtime_ms=mtime_ms,
        )
        return {
            "audio": {
                "filename": latest.name,
                "mtime_ms": mtime_ms,
                "url": f"/audio/{latest.name}",
            },
            "request_id": effective_request_id,
        }

    def get_ws_status(self):
        ui = wsa_server.get_web_instance()
        human = wsa_server.get_instance()
        return {
            "avatar_running": bool(avatar_runtime.is_running()),
            "ui_server_running": bool(ui is not None and ui.is_running()),
            "human_server_running": bool(human is not None and human.is_running()),
            "human_client_connected": bool(human.isConnect if human else False),
        }

    def get_live_health(self):
        runtime_config.reload_runtime_config()
        ui = wsa_server.get_web_instance()
        tts_url = runtime_config.get_tts_url()
        asr_url = runtime_config.get_asr_url()
        ffmpeg_path = find_ffmpeg_executable()
        ws_probe = probe_tcp_port("127.0.0.1", 10003, timeout=1.0)

        checks = {
            "api_5000": {
                "ok": True,
                "detail": "current /api/health/live route is reachable",
                "port": 5000,
            },
            "ws_10003": {
                "ok": bool(ui is not None and ui.is_running()) and bool(ws_probe.get("ok")),
                "detail": ws_probe.get("detail") if not (ui is not None and ui.is_running()) else "reachable",
                "port": 10003,
            },
            "tts_8000": {
                **probe_http_health(build_health_url(tts_url)),
                "url": build_health_url(tts_url),
                "port": urlparse(tts_url).port or 8000,
            },
            "asr_8001": {
                **probe_http_health(build_health_url(asr_url)),
                "url": build_health_url(asr_url),
                "port": urlparse(asr_url).port or 8001,
            },
            "ffmpeg": {
                "ok": bool(ffmpeg_path),
                "detail": ffmpeg_path or "ffmpeg executable not found",
                "path": ffmpeg_path,
            },
        }
        checks["avatar_runtime"] = {
            "ok": bool(avatar_runtime.is_running()),
            "detail": "running" if avatar_runtime.is_running() else "stopped",
        }
        overall_ok = all(bool(item.get("ok")) for item in checks.values())
        return {
            "overall_status": "ok" if overall_ok else "degraded",
            "checks": checks,
        }

    def create_chat_completion(self, payload):
        dto = ChatCompletionRequest.from_payload(payload)
        avatar = self._ensure_runtime()
        interact = Interact("text", 1, {"user": dto.username, "msg": dto.prompt})
        resp = avatar.on_interact(interact)
        resp_text = "" if resp is None else str(resp)
        return {
            "id": "chatcmpl-local",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": dto.model,
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": resp_text},
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": len(dto.prompt or ""),
                "completion_tokens": len(resp_text),
                "total_tokens": len(dto.prompt or "") + len(resp_text),
            },
        }


live_service = LiveService()

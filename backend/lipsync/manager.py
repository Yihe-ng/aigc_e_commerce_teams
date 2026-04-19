from __future__ import annotations

import threading
import time
import wave
from pathlib import Path

from backend.lipsync.base import LipSyncProvider
from backend.lipsync.energy_provider import EnergyBasedLipSyncProvider
from backend.lipsync.text_timeline_provider import TextTimelineProvider
from backend.websocket.send_lipsync import send_lipsync, send_lipsync_end
from core import wsa_server


class LipSyncManager:
    def __init__(self, provider: LipSyncProvider | None = None):
        self.provider = provider or EnergyBasedLipSyncProvider()
        self.text_timeline_provider = TextTimelineProvider()
        self._lock = threading.RLock()
        self._text_timelines: dict[str, dict] = {}
        self._text_timeline_order: list[str] = []
        self._text_timeline_limit = 64

    def reset(self) -> None:
        with self._lock:
            self.provider.reset()

    def process_chunk(self, audio_chunk: bytes, *, sample_rate: int, sample_width: int, channels: int, timestamp_ms: int):
        with self._lock:
            return self.provider.process_audio_chunk(
                audio_chunk=audio_chunk,
                sample_rate=sample_rate,
                sample_width=sample_width,
                channels=channels,
                timestamp_ms=timestamp_ms,
            )

    def register_text_timeline(self, text: str, *, request_id: str = "") -> dict:
        timeline = self.text_timeline_provider.build_timeline(text, request_id=request_id)
        if not request_id:
            return timeline

        with self._lock:
            self._text_timelines[request_id] = timeline
            self._text_timeline_order = [key for key in self._text_timeline_order if key != request_id]
            self._text_timeline_order.append(request_id)
            while len(self._text_timeline_order) > self._text_timeline_limit:
                expired = self._text_timeline_order.pop(0)
                self._text_timelines.pop(expired, None)
        return timeline

    def get_text_timeline(self, request_id: str = "") -> dict | None:
        if not request_id:
            return None
        with self._lock:
            return self._text_timelines.get(request_id)

    def stream_wav_file(self, wav_path: str | Path, *, username: str = "User", request_id: str = "", lead_in_ms: int = 220) -> None:
        path = Path(wav_path)
        if not path.exists():
            return

        web = wsa_server.get_web_instance()
        if web is None or not web.is_running() or not web.is_connected(username):
            return

        with wave.open(str(path), "rb") as wav_reader:
            sample_rate = wav_reader.getframerate()
            sample_width = wav_reader.getsampwidth()
            channels = wav_reader.getnchannels()
            samples_per_chunk = max(1, int(sample_rate * getattr(self.provider, "frame_ms", 20) / 1000))

            self.reset()
            started_at = time.perf_counter()
            base_wallclock = int(time.time() * 1000) + lead_in_ms
            offset_ms = 0

            while True:
                raw = wav_reader.readframes(samples_per_chunk)
                if not raw:
                    break

                frame = self.process_chunk(
                    raw,
                    sample_rate=sample_rate,
                    sample_width=sample_width,
                    channels=channels,
                    timestamp_ms=offset_ms,
                )

                target_elapsed = max(0.0, (lead_in_ms + offset_ms) / 1000.0)
                now_elapsed = time.perf_counter() - started_at
                delay = target_elapsed - now_elapsed
                if delay > 0:
                    time.sleep(delay)

                send_lipsync(
                    web,
                    frame.mouth_open,
                    base_wallclock + frame.timestamp,
                    username=username,
                    request_id=request_id,
                    rms=frame.rms,
                    short_energy=frame.short_energy,
                )

                actual_frames = max(1, len(raw) // (sample_width * channels))
                offset_ms += int(actual_frames / float(sample_rate) * 1000) if sample_rate else getattr(self.provider, "frame_ms", 20)

            send_lipsync_end(web, base_wallclock + offset_ms, username=username, request_id=request_id)

    def build_audio_timeline(self, wav_path: str | Path, *, request_id: str = "") -> dict:
        text_timeline = self.get_text_timeline(request_id)
        if text_timeline and text_timeline.get("cues"):
            return text_timeline

        path = Path(wav_path)
        if not path.exists():
            return {"request_id": request_id, "frame_ms": getattr(self.provider, "frame_ms", 20), "duration_ms": 0, "cues": []}

        cues = []
        with wave.open(str(path), "rb") as wav_reader:
            sample_rate = wav_reader.getframerate()
            sample_width = wav_reader.getsampwidth()
            channels = wav_reader.getnchannels()
            samples_per_chunk = max(1, int(sample_rate * getattr(self.provider, "frame_ms", 20) / 1000))
            self.reset()
            offset_ms = 0

            while True:
                raw = wav_reader.readframes(samples_per_chunk)
                if not raw:
                    break
                frame = self.process_chunk(
                    raw,
                    sample_rate=sample_rate,
                    sample_width=sample_width,
                    channels=channels,
                    timestamp_ms=offset_ms,
                )
                cues.append(
                    {
                        "offset_ms": frame.timestamp,
                        "ts_ms": frame.timestamp,
                        "mouth_open": frame.mouth_open,
                        "mouth_form": 0.0,
                        "energy": frame.short_energy,
                    }
                )
                actual_frames = max(1, len(raw) // (sample_width * channels))
                offset_ms += int(actual_frames / float(sample_rate) * 1000) if sample_rate else getattr(self.provider, "frame_ms", 20)

        return {
            "request_id": request_id,
            "frame_ms": getattr(self.provider, "frame_ms", 20),
            "duration_ms": offset_ms,
            "cues": cues,
        }


lip_sync_manager = LipSyncManager()

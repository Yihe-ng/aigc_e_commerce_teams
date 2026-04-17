import audioop
import threading
import time
import wave
from dataclasses import asdict, dataclass
from pathlib import Path

from core import wsa_server


@dataclass
class LipSyncFrame:
    type: str
    timestamp: int
    mouth_open: float
    rms: float
    short_energy: float


class EnergyLipSyncService:
    """
    Stage-1 Energy Based Lip Sync.
    - 20ms per frame
    - compute RMS + short-time energy
    - attack / release smoothing
    - threshold / clamp / anti-jitter
    - stream frames through current WebSocket
    """

    def __init__(
        self,
        *,
        frame_ms: int = 20,
        min_threshold: float = 0.02,
        max_open: float = 1.0,
        gain: float = 3.2,
        attack_alpha: float = 0.42,
        release_alpha: float = 0.22,
        jitter_epsilon: float = 0.012,
    ):
        self.frame_ms = frame_ms
        self.min_threshold = min_threshold
        self.max_open = max_open
        self.gain = gain
        self.attack_alpha = attack_alpha
        self.release_alpha = release_alpha
        self.jitter_epsilon = jitter_epsilon
        self._cache: dict[str, list[LipSyncFrame]] = {}
        self._lock = threading.RLock()

    def _cache_key(self, wav_path: Path) -> str:
        stat = wav_path.stat()
        return f"{wav_path.resolve()}|{int(stat.st_mtime * 1000)}|{stat.st_size}"

    def _normalize_rms(self, rms_value: float, sample_width: int) -> float:
        max_amplitude = float((1 << (8 * sample_width - 1)) - 1)
        if max_amplitude <= 0:
            return 0.0
        return max(0.0, min(1.0, rms_value / max_amplitude))

    def _smooth(self, current: float, target: float) -> float:
        alpha = self.attack_alpha if target > current else self.release_alpha
        next_value = current + (target - current) * alpha
        if abs(next_value - current) <= self.jitter_epsilon:
            return current
        if abs(target - next_value) <= self.jitter_epsilon:
            return target
        return next_value

    def analyze_wav(self, wav_path: str | Path) -> list[LipSyncFrame]:
        path = Path(wav_path)
        if not path.exists():
            return []

        cache_key = self._cache_key(path)
        with self._lock:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        frames: list[LipSyncFrame] = []
        current_open = 0.0

        with wave.open(str(path), "rb") as wav_reader:
            sample_rate = wav_reader.getframerate()
            sample_width = wav_reader.getsampwidth()
            channels = wav_reader.getnchannels()
            samples_per_chunk = max(1, int(sample_rate * self.frame_ms / 1000))
            offset_ms = 0

            while True:
                raw = wav_reader.readframes(samples_per_chunk)
                if not raw:
                    break

                if channels > 1:
                    raw = audioop.tomono(raw, sample_width, 0.5, 0.5)

                rms = audioop.rms(raw, sample_width)
                normalized_rms = self._normalize_rms(rms, sample_width)
                short_energy = normalized_rms * normalized_rms

                combined_energy = max(normalized_rms, short_energy)
                target_open = combined_energy * self.gain

                if target_open < self.min_threshold:
                    target_open = 0.0

                target_open = max(0.0, min(self.max_open, target_open))
                current_open = self._smooth(current_open, target_open)
                current_open = max(0.0, min(self.max_open, current_open))

                frames.append(
                    LipSyncFrame(
                        type="lip_sync",
                        timestamp=offset_ms,
                        mouth_open=round(current_open, 4),
                        rms=round(normalized_rms, 4),
                        short_energy=round(short_energy, 4),
                    )
                )

                actual_mono_samples = max(1, len(raw) // sample_width)
                offset_ms += int(actual_mono_samples / float(sample_rate) * 1000) if sample_rate else self.frame_ms

        with self._lock:
            self._cache = {cache_key: frames}
        return frames

    def build_payload_timeline(self, wav_path: str | Path, request_id: str = "") -> dict:
        frames = self.analyze_wav(wav_path)
        return {
            "request_id": request_id,
            "frame_ms": self.frame_ms,
            "duration_ms": frames[-1].timestamp if frames else 0,
            "cues": [
                {
                    "offset_ms": frame.timestamp,
                    "ts_ms": frame.timestamp,
                    "mouth_open": frame.mouth_open,
                    "mouth_form": round(min(0.16, frame.mouth_open * 0.1), 4),
                    "energy": frame.short_energy,
                }
                for frame in frames
            ],
        }

    def stream_frames(self, wav_path: str | Path, *, username: str = "User", request_id: str = "", lead_in_ms: int = 220):
        frames = self.analyze_wav(wav_path)
        if not frames:
            return

        web = wsa_server.get_web_instance()
        if web is None or not web.is_running() or not web.is_connected(username):
            return

        started_at = time.perf_counter()
        base_wallclock = int(time.time() * 1000) + lead_in_ms

        for frame in frames:
            target_elapsed = max(0.0, (lead_in_ms + frame.timestamp) / 1000.0)
            now_elapsed = time.perf_counter() - started_at
            delay = target_elapsed - now_elapsed
            if delay > 0:
                time.sleep(delay)

            web.add_cmd(
                {
                    "type": frame.type,
                    "timestamp": base_wallclock + frame.timestamp,
                    "mouth_open": frame.mouth_open,
                    "rms": frame.rms,
                    "short_energy": frame.short_energy,
                    "request_id": request_id,
                    "Username": username,
                }
            )

        web.add_cmd(
            {
                "type": "lip_sync_end",
                "timestamp": base_wallclock + (frames[-1].timestamp if frames else 0),
                "mouth_open": 0.0,
                "request_id": request_id,
                "Username": username,
            }
        )


energy_lip_sync_service = EnergyLipSyncService()

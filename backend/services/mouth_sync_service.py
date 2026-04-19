import audioop
import threading
import wave
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class MouthCue:
    offset_ms: int
    ts_ms: int
    mouth_open: float
    mouth_form: float
    energy: float


class AudioEnergyMouthSyncService:
    """
    Stage-1 mouth sync:
    Build a time-coded mouth_open timeline from wav energy.
    """

    def __init__(
        self,
        *,
        frame_ms: int = 40,
        noise_floor: float = 0.015,
        gain: float = 3.0,
        smooth_alpha: float = 0.28,
        max_open: float = 1.0,
        closed_threshold: float = 0.02,
    ):
        self.frame_ms = frame_ms
        self.noise_floor = noise_floor
        self.gain = gain
        self.smooth_alpha = smooth_alpha
        self.max_open = max_open
        self.closed_threshold = closed_threshold
        self._cache: dict[str, dict] = {}
        self._lock = threading.RLock()

    def _cache_key(self, wav_path: Path, request_id: str) -> str:
        stat = wav_path.stat()
        return f"{request_id}|{wav_path.resolve()}|{int(stat.st_mtime * 1000)}|{stat.st_size}"

    def _normalize_energy(self, rms_value: float, sample_width: int) -> float:
        max_amplitude = float((1 << (8 * sample_width - 1)) - 1)
        if max_amplitude <= 0:
            return 0.0
        return max(0.0, min(1.0, rms_value / max_amplitude))

    def _energy_to_open(self, normalized_energy: float) -> float:
        if normalized_energy <= self.noise_floor:
            return 0.0
        boosted = (normalized_energy - self.noise_floor) * self.gain
        return max(0.0, min(self.max_open, boosted))

    def _smooth(self, current: float, target: float) -> float:
        next_value = current + (target - current) * self.smooth_alpha
        if abs(target - next_value) <= 0.0015:
            return target
        return next_value

    def _open_to_form(self, mouth_open: float) -> float:
        if mouth_open <= self.closed_threshold:
            return 0.0
        # Stage-1 keeps form subtle; future phoneme mapping can replace this.
        return max(-1.0, min(1.0, mouth_open * 0.12))

    def build_timeline(self, wav_path: str | Path, request_id: str = "") -> dict:
        path = Path(wav_path)
        if not path.exists():
            return {
                "request_id": request_id,
                "frame_ms": self.frame_ms,
                "duration_ms": 0,
                "cues": [],
            }

        cache_key = self._cache_key(path, request_id)
        with self._lock:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        cues: list[MouthCue] = []
        smoothed_open = 0.0

        with wave.open(str(path), "rb") as wav_reader:
            sample_rate = wav_reader.getframerate()
            sample_width = wav_reader.getsampwidth()
            channels = wav_reader.getnchannels()
            frame_count = wav_reader.getnframes()
            duration_ms = int(frame_count / float(sample_rate) * 1000) if sample_rate else 0

            frames_per_window = max(1, int(sample_rate * self.frame_ms / 1000))
            bytes_per_window = frames_per_window * sample_width * channels
            offset_ms = 0

            while True:
                raw = wav_reader.readframes(frames_per_window)
                if not raw:
                    break

                if channels > 1:
                    raw = audioop.tomono(raw, sample_width, 0.5, 0.5)

                rms = audioop.rms(raw, sample_width)
                normalized_energy = self._normalize_energy(rms, sample_width)
                target_open = self._energy_to_open(normalized_energy)
                smoothed_open = self._smooth(smoothed_open, target_open)
                if smoothed_open <= self.closed_threshold:
                    smoothed_open = 0.0

                cue = MouthCue(
                    offset_ms=offset_ms,
                    ts_ms=offset_ms,
                    mouth_open=round(smoothed_open, 4),
                    mouth_form=round(self._open_to_form(smoothed_open), 4),
                    energy=round(normalized_energy, 4),
                )
                cues.append(cue)

                # If the last chunk is short, still advance by actual chunk length.
                actual_frames = max(1, len(raw) // sample_width)
                offset_ms += int(actual_frames / float(sample_rate) * 1000) if sample_rate else self.frame_ms

        timeline = {
            "request_id": request_id,
            "frame_ms": self.frame_ms,
            "duration_ms": duration_ms,
            "cues": [asdict(cue) for cue in cues],
        }

        with self._lock:
            self._cache = {cache_key: timeline}
        return timeline


mouth_sync_service = AudioEnergyMouthSyncService()

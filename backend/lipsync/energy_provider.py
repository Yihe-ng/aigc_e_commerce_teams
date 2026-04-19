from __future__ import annotations

from backend.lipsync.base import LipSyncFrameResult, LipSyncProvider
from backend.lipsync.utils import clamp, compute_rms, compute_short_energy, normalize_rms, pcm_to_mono


class EnergyBasedLipSyncProvider(LipSyncProvider):
    def __init__(
        self,
        *,
        frame_ms: int = 20,
        threshold: float = 0.02,
        gain: float = 3.2,
        attack: float = 0.42,
        release: float = 0.22,
        min_value: float = 0.0,
        max_value: float = 1.0,
        jitter_gate: float = 0.012,
    ):
        self.frame_ms = frame_ms
        self.threshold = threshold
        self.gain = gain
        self.attack = attack
        self.release = release
        self.min_value = min_value
        self.max_value = max_value
        self.jitter_gate = jitter_gate
        self._current_open = 0.0

    def reset(self) -> None:
        self._current_open = 0.0

    def _smooth(self, current: float, target: float) -> float:
        alpha = self.attack if target > current else self.release
        next_value = current + (target - current) * alpha
        if abs(next_value - current) <= self.jitter_gate:
            return current
        if abs(target - next_value) <= self.jitter_gate:
            return target
        return next_value

    def process_audio_chunk(self, audio_chunk: bytes, sample_rate: int, sample_width: int, channels: int, timestamp_ms: int) -> LipSyncFrameResult:
        mono_chunk = pcm_to_mono(audio_chunk, sample_width, channels)
        rms = compute_rms(mono_chunk, sample_width)
        normalized_rms = normalize_rms(rms, sample_width)
        short_energy = compute_short_energy(normalized_rms)

        combined_energy = max(normalized_rms, short_energy)
        target_open = combined_energy * self.gain
        if target_open < self.threshold:
            target_open = 0.0

        target_open = clamp(target_open, self.min_value, self.max_value)
        self._current_open = clamp(self._smooth(self._current_open, target_open), self.min_value, self.max_value)

        return LipSyncFrameResult(
            timestamp=timestamp_ms,
            mouth_open=round(self._current_open, 4),
            rms=round(normalized_rms, 4),
            short_energy=round(short_energy, 4),
        )

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class LipSyncFrameResult:
    timestamp: int
    mouth_open: float
    rms: float
    short_energy: float


class LipSyncProvider(ABC):
    @abstractmethod
    def reset(self) -> None:
        raise NotImplementedError

    @abstractmethod
    def process_audio_chunk(self, audio_chunk: bytes, sample_rate: int, sample_width: int, channels: int, timestamp_ms: int) -> LipSyncFrameResult:
        raise NotImplementedError

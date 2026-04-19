from __future__ import annotations

from backend.lipsync.base import LipSyncFrameResult, LipSyncProvider


class ModelBasedLipSyncProvider(LipSyncProvider):
    """
    TODO:
    Future upgrade point.
    Audio -> feature extractor (Mel/MFCC) -> lightweight PyTorch model
    -> mouth_open or viseme classes.
    Keep the same interface so the manager / websocket / frontend do not need large rewrites.
    """

    def __init__(self, *args, **kwargs):
        self._model = None

    def reset(self) -> None:
        pass

    def process_audio_chunk(self, audio_chunk: bytes, sample_rate: int, sample_width: int, channels: int, timestamp_ms: int) -> LipSyncFrameResult:
        raise NotImplementedError("ModelBasedLipSyncProvider is reserved for future PyTorch integration.")

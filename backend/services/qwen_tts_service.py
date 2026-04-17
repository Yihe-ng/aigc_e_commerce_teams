from __future__ import annotations

from tts.qwen3 import Speech
from backend.lipsync.manager import LipSyncManager


class QwenTTSService:
    """
    Minimal-intrusion wrapper for current project.
    Current Qwen TTS client returns a wav file path after synthesis.
    Future upgrade:
    if the TTS server starts yielding PCM/audio chunks, the same service can feed
    chunks into LipSyncManager.process_chunk(...) in real time.
    """

    def __init__(self, lip_sync_manager: LipSyncManager | None = None):
        self.speech = Speech()
        self.lip_sync_manager = lip_sync_manager or LipSyncManager()
        self.speech.connect()

    def synthesize_to_wav(self, text: str, style: str, *, request_id: str | None = None) -> str | None:
        return self.speech.to_sample(text, style, request_id=request_id)

    def synthesize_and_stream_lipsync(
        self,
        text: str,
        style: str,
        *,
        username: str = "User",
        request_id: str | None = None,
        lead_in_ms: int = 220,
    ) -> str | None:
        wav_path = self.synthesize_to_wav(text, style, request_id=request_id)
        if wav_path:
            self.lip_sync_manager.stream_wav_file(
                wav_path,
                username=username,
                request_id=request_id or "",
                lead_in_ms=lead_in_ms,
            )
        return wav_path

    # TODO future streaming path:
    # def synthesize_streaming(self, text, style, on_audio_chunk): ...

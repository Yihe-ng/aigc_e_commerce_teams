from __future__ import annotations

import audioop


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def pcm_to_mono(audio_chunk: bytes, sample_width: int, channels: int) -> bytes:
    if channels <= 1:
        return audio_chunk
    if channels == 2:
        return audioop.tomono(audio_chunk, sample_width, 0.5, 0.5)

    # Fallback for more-than-stereo input: keep the first channel only.
    frame_size = sample_width * channels
    mono = bytearray()
    for i in range(0, len(audio_chunk), frame_size):
        mono.extend(audio_chunk[i:i + sample_width])
    return bytes(mono)


def compute_rms(audio_chunk: bytes, sample_width: int) -> float:
    if not audio_chunk:
        return 0.0
    return float(audioop.rms(audio_chunk, sample_width))


def normalize_rms(rms_value: float, sample_width: int) -> float:
    max_amplitude = float((1 << (8 * sample_width - 1)) - 1)
    if max_amplitude <= 0:
        return 0.0
    return clamp(rms_value / max_amplitude, 0.0, 1.0)


def compute_short_energy(normalized_rms: float) -> float:
    return clamp(normalized_rms * normalized_rms, 0.0, 1.0)

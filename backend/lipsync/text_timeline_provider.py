from __future__ import annotations

import re
from dataclasses import dataclass

try:
    from pypinyin import Style, lazy_pinyin  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    Style = None
    lazy_pinyin = None


PUNCTUATION_PATTERN = re.compile(r"[，。！？；：、,.!?;:\s]+")
CJK_CHAR_PATTERN = re.compile(r"[\u4e00-\u9fff]")


@dataclass
class TextMouthCue:
    start_ms: int
    end_ms: int
    phoneme: str
    mouth_open: float
    mouth_form: float


class TextTimelineProvider:
    """
    Stage-2 pseudo phoneme timeline.

    This provider does not require real viseme timestamps from TTS. It converts
    Chinese reply text into a rough pinyin-final sequence and maps each final to
    a Live2D mouth shape with heuristic durations.
    """

    DEFAULT_FRAME_MS = 40
    PUNCTUATION_PAUSE_MS = 120

    FINAL_TO_MOUTH = {
        "a": {"open": 0.9, "form": 0.08, "duration": 170},
        "ia": {"open": 0.82, "form": 0.02, "duration": 170},
        "ua": {"open": 0.84, "form": 0.14, "duration": 170},
        "ai": {"open": 0.72, "form": 0.02, "duration": 160},
        "an": {"open": 0.66, "form": -0.02, "duration": 155},
        "ang": {"open": 0.74, "form": 0.04, "duration": 165},
        "ao": {"open": 0.74, "form": 0.24, "duration": 165},
        "o": {"open": 0.58, "form": 0.34, "duration": 160},
        "ou": {"open": 0.52, "form": 0.36, "duration": 150},
        "ong": {"open": 0.56, "form": 0.38, "duration": 160},
        "u": {"open": 0.48, "form": 0.42, "duration": 150},
        "uo": {"open": 0.6, "form": 0.36, "duration": 160},
        "ui": {"open": 0.4, "form": 0.12, "duration": 145},
        "un": {"open": 0.44, "form": 0.26, "duration": 145},
        "i": {"open": 0.34, "form": -0.32, "duration": 145},
        "ie": {"open": 0.46, "form": -0.18, "duration": 150},
        "in": {"open": 0.3, "form": -0.24, "duration": 140},
        "ing": {"open": 0.34, "form": -0.2, "duration": 145},
        "iu": {"open": 0.38, "form": 0.04, "duration": 145},
        "e": {"open": 0.46, "form": -0.08, "duration": 145},
        "en": {"open": 0.44, "form": -0.06, "duration": 145},
        "eng": {"open": 0.5, "form": 0.0, "duration": 150},
        "er": {"open": 0.48, "form": 0.06, "duration": 150},
        "v": {"open": 0.32, "form": -0.24, "duration": 145},
        "ve": {"open": 0.42, "form": -0.18, "duration": 150},
        "vn": {"open": 0.34, "form": -0.2, "duration": 145},
        "m": {"open": 0.0, "form": 0.0, "duration": 90},
        "n": {"open": 0.08, "form": 0.0, "duration": 95},
        "sil": {"open": 0.0, "form": 0.0, "duration": 100},
        "default": {"open": 0.48, "form": 0.02, "duration": 150},
    }

    def _text_to_tokens(self, text: str) -> list[tuple[str, bool]]:
        tokens: list[tuple[str, bool]] = []
        if not text:
            return tokens

        for ch in text:
            if PUNCTUATION_PATTERN.fullmatch(ch):
                tokens.append((ch, True))
            else:
                tokens.append((ch, False))
        return tokens

    def _extract_final(self, token: str) -> str:
        if not token:
            return "sil"

        if PUNCTUATION_PATTERN.fullmatch(token):
            return "sil"

        if lazy_pinyin and Style and CJK_CHAR_PATTERN.fullmatch(token):
            finals = lazy_pinyin(token, style=Style.FINALS, neutral_tone_with_five=True, strict=False)
            final = (finals[0] if finals else "").replace("ü", "v").replace("u:", "v")
            return final or "default"

        ascii_token = token.strip().lower()
        if ascii_token in {"m", "b", "p"}:
            return "m"
        if ascii_token in {"a", "i", "u", "e", "o"}:
            return ascii_token
        return "default"

    def _map_final(self, final: str) -> dict[str, float | int]:
        if final in self.FINAL_TO_MOUTH:
            return self.FINAL_TO_MOUTH[final]

        for candidate in sorted(self.FINAL_TO_MOUTH.keys(), key=len, reverse=True):
            if candidate in {"default", "sil"}:
                continue
            if final.endswith(candidate):
                return self.FINAL_TO_MOUTH[candidate]

        return self.FINAL_TO_MOUTH["default"]

    def build_timeline(self, text: str, request_id: str = "") -> dict:
        normalized_text = (text or "").strip()
        if not normalized_text:
            return {
                "request_id": request_id,
                "frame_ms": self.DEFAULT_FRAME_MS,
                "duration_ms": 0,
                "cues": [],
                "source": "text",
            }

        cues: list[TextMouthCue] = []
        offset_ms = 0

        for token, is_pause in self._text_to_tokens(normalized_text):
            if is_pause:
                cues.append(
                    TextMouthCue(
                        start_ms=offset_ms,
                        end_ms=offset_ms + self.PUNCTUATION_PAUSE_MS,
                        phoneme="sil",
                        mouth_open=0.0,
                        mouth_form=0.0,
                    )
                )
                offset_ms += self.PUNCTUATION_PAUSE_MS
                continue

            final = self._extract_final(token)
            mouth = self._map_final(final)
            duration = int(mouth["duration"])

            cues.append(
                TextMouthCue(
                    start_ms=offset_ms,
                    end_ms=offset_ms + duration,
                    phoneme=final,
                    mouth_open=float(mouth["open"]),
                    mouth_form=float(mouth["form"]),
                )
            )
            offset_ms += duration

        if cues:
            cues.append(
                TextMouthCue(
                    start_ms=offset_ms,
                    end_ms=offset_ms + 80,
                    phoneme="sil",
                    mouth_open=0.0,
                    mouth_form=0.0,
                )
            )
            offset_ms += 80

        return {
            "request_id": request_id,
            "frame_ms": self.DEFAULT_FRAME_MS,
            "duration_ms": offset_ms,
            "source": "text",
            "cues": [
                {
                    "offset_ms": cue.start_ms,
                    "ts_ms": cue.start_ms,
                    "start_ms": cue.start_ms,
                    "end_ms": cue.end_ms,
                    "phoneme": cue.phoneme,
                    "mouth_open": cue.mouth_open,
                    "mouth_form": cue.mouth_form,
                    "energy": cue.mouth_open,
                }
                for cue in cues
            ],
        }

import os
import re
import threading
from pathlib import Path


_DEFAULT_WORDS_FILE = Path("runtime/forbidden_words.txt")
_NORMALIZE_RE = re.compile(r"[\s\-_.,，。！？、“”\"'（）()\[\]【】:：;；]+")
_LOCK = threading.RLock()
_CACHE: set[str] = set()
_SOURCE_PATH: str = ""
_LOADED = False


def normalize_text(text: str | None) -> str:
    value = str(text or "").strip().lower()
    return _NORMALIZE_RE.sub("", value)


def _get_words_file() -> Path:
    configured_path = os.getenv("FORBIDDEN_WORDS_FILE", "").strip()
    if configured_path:
        return Path(configured_path)
    return _DEFAULT_WORDS_FILE


def load_local_words(force: bool = False) -> set[str]:
    global _CACHE, _LOADED, _SOURCE_PATH

    with _LOCK:
        if _LOADED and not force:
            return set(_CACHE)

        words_file = _get_words_file()
        words: set[str] = set()
        if words_file.exists():
            try:
                with words_file.open("r", encoding="utf-8") as file:
                    for line in file:
                        normalized = normalize_text(line)
                        if normalized:
                            words.add(normalized)
            except OSError:
                words = set()

        _CACHE = words
        _LOADED = True
        _SOURCE_PATH = str(words_file)
        return set(_CACHE)


def check_text(text: str | None) -> tuple[bool, str]:
    normalized_text = normalize_text(text)
    if not normalized_text:
        return False, ""

    words = load_local_words()
    for word in words:
        if word and word in normalized_text:
            return True, word
    return False, ""


def reload_words() -> dict:
    source_path = _get_words_file()
    words = load_local_words(force=True)
    return {
        "loaded": True,
        "count": len(words),
        "source": _SOURCE_PATH,
        "file_exists": source_path.exists(),
    }


def get_stats() -> dict:
    source_path = _get_words_file()
    words = load_local_words()
    return {
        "loaded": _LOADED,
        "count": len(words),
        "source": _SOURCE_PATH,
        "file_exists": source_path.exists(),
    }

from __future__ import annotations

import time
from pathlib import Path
from typing import Iterable

from utils import util
from utils.trace_utils import sanitize_request_token


SAMPLES_DIR = Path("./samples")
DEFAULT_KEEP_COUNT = 50


def cleanup_sample_outputs(
    samples_dir: str | Path = SAMPLES_DIR,
    *,
    keep_count: int = DEFAULT_KEEP_COUNT,
    patterns: Iterable[str] = ("sample-*.wav", "sample-*.mp3"),
) -> None:
    try:
        directory = Path(samples_dir)
        if not directory.exists():
            return

        matched_files: list[Path] = []
        for pattern in patterns:
            matched_files.extend([path for path in directory.glob(pattern) if path.is_file()])

        matched_files.sort(key=lambda path: path.stat().st_mtime, reverse=True)
        for stale_file in matched_files[keep_count:]:
            try:
                stale_file.unlink()
                util.log(1, f"清理旧音频文件: {stale_file.name}")
            except Exception as exc:
                util.log(1, f"清理文件失败: {exc}")
    except Exception as exc:
        util.log(1, f"清理样本文件时出错: {exc}")


def build_sample_output_path(
    *,
    request_id: str | None = None,
    extension: str = ".wav",
    samples_dir: str | Path = SAMPLES_DIR,
    keep_count: int = DEFAULT_KEEP_COUNT,
) -> str:
    directory = Path(samples_dir)
    directory.mkdir(parents=True, exist_ok=True)
    cleanup_sample_outputs(directory, keep_count=keep_count)

    normalized_extension = extension if extension.startswith(".") else f".{extension}"
    request_token = sanitize_request_token(request_id, fallback="sample")
    filename = f"sample-{request_token}-{int(time.time() * 1000)}{normalized_extension}"
    return str(directory / filename)

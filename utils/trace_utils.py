import json
import time
import uuid
from typing import Any
import re


def ensure_request_id(value: str | None = None) -> str:
    request_id = (value or "").strip()
    return request_id or uuid.uuid4().hex


def summarize_text(value: Any, limit: int = 80) -> str:
    text = "" if value is None else str(value).replace("\n", " ").strip()
    if len(text) <= limit:
        return text
    return f"{text[:limit]}..."


def sanitize_request_token(value: str | None, fallback: str = "req") -> str:
    raw = (value or "").strip()
    if not raw:
        return fallback
    normalized = re.sub(r"[^0-9A-Za-z_-]+", "-", raw).strip("-_")
    return normalized or fallback


def trace_log(
    *,
    module: str,
    stage: str,
    status: str,
    request_id: str | None = None,
    error: str | None = None,
    time_cost: int | float | None = None,
    **extra: Any,
) -> None:
    payload: dict[str, Any] = {
        "ts": int(time.time() * 1000),
        "module": module,
        "stage": stage,
        "status": status,
        "request_id": request_id or "-",
        "error": error or "",
        "time_cost": round(float(time_cost), 2) if time_cost is not None else "",
    }
    for key, value in extra.items():
        if value is None:
            continue
        payload[key] = value
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True))

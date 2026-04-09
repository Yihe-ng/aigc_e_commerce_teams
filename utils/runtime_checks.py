import shutil
import socket
from urllib.parse import urlparse

import requests

from pydub import AudioSegment


def find_ffmpeg_executable() -> str:
    candidates = []
    converter = getattr(AudioSegment, "converter", "")
    if converter:
        candidates.append(converter)
    candidates.extend(["ffmpeg", "ffmpeg.exe"])

    for candidate in candidates:
        resolved = shutil.which(candidate) if candidate else ""
        if resolved:
            return resolved
        if candidate and shutil.which(str(candidate)):
            return str(candidate)
    return ""


def probe_http_health(url: str, timeout: float = 2.0) -> dict:
    try:
        response = requests.get(url, timeout=timeout)
        return {
            "ok": response.status_code < 400,
            "status_code": response.status_code,
            "detail": response.text[:120] if response.status_code >= 400 else "reachable",
            "latency_ms": round(response.elapsed.total_seconds() * 1000, 2),
        }
    except requests.RequestException as exc:
        return {
            "ok": False,
            "status_code": 0,
            "detail": str(exc),
            "latency_ms": "",
        }


def build_health_url(service_url: str, endpoint: str = "/health") -> str:
    parsed = urlparse(service_url)
    base_path = parsed.path.rsplit("/", 1)[0] if "/" in parsed.path else ""
    path = endpoint if endpoint.startswith("/") else f"/{endpoint}"
    if base_path and base_path != "/":
        path = base_path + path
    return parsed._replace(path=path, params="", query="", fragment="").geturl()


def probe_tcp_port(host: str, port: int, timeout: float = 1.0) -> dict:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return {"ok": True, "detail": "reachable"}
    except OSError as exc:
        return {"ok": False, "detail": str(exc)}

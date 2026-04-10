from urllib.parse import urlparse

from .config import get_oss_storage_config


def build_public_url(object_key: str, custom_domain: str | None = None) -> str:
    key = (object_key or "").strip().lstrip("/")
    if not key:
        return ""

    resolved_domain = (custom_domain or get_oss_storage_config().custom_domain or "").strip()
    if not resolved_domain:
        return ""

    return f"https://{resolved_domain}/{key}"


def extract_object_key(raw_url_or_key: str) -> str:
    raw = (raw_url_or_key or "").strip()
    if not raw:
        return ""
    if raw.startswith("http://") or raw.startswith("https://"):
        return urlparse(raw).path.lstrip("/")
    return raw.lstrip("/")

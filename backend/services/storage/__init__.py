"""Minimal storage service layer for OSS-backed asset operations."""

from .client import get_bucket
from .config import OssStorageConfig, get_oss_storage_config
from .json_store import read_json_object, write_json_object
from .objects import (
    copy_object,
    delete_object,
    ensure_prefix,
    get_object_bytes,
    get_object_text,
    list_object_keys,
    object_exists,
    object_exists_quiet,
    put_object,
    put_text_object,
)
from .paths import (
    category_index_key,
    generated_asset_key,
    generated_content_prefixes,
    marketing_text_key,
    temp_upload_key,
)
from .url import build_public_url, extract_object_key

__all__ = [
    "OssStorageConfig",
    "build_public_url",
    "category_index_key",
    "copy_object",
    "delete_object",
    "ensure_prefix",
    "extract_object_key",
    "generated_asset_key",
    "generated_content_prefixes",
    "get_bucket",
    "get_object_bytes",
    "get_object_text",
    "get_oss_storage_config",
    "list_object_keys",
    "marketing_text_key",
    "object_exists",
    "object_exists_quiet",
    "put_object",
    "put_text_object",
    "read_json_object",
    "temp_upload_key",
    "write_json_object",
]

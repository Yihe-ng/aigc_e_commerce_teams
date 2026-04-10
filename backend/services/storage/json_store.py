import json

import oss2

from .objects import get_object_bytes, object_exists, put_object


def read_json_object(
    bucket: oss2.Bucket, object_key: str, default=None
):
    if not object_exists(bucket, object_key):
        return default

    try:
        return json.loads(get_object_bytes(bucket, object_key))
    except Exception:
        return default


def write_json_object(
    bucket: oss2.Bucket, object_key: str, payload, ensure_ascii: bool = False
):
    return put_object(
        bucket,
        object_key,
        json.dumps(payload, ensure_ascii=ensure_ascii).encode("utf-8"),
    )

import oss2


def put_object(bucket: oss2.Bucket, object_key: str, data):
    return bucket.put_object(object_key, data)


def put_text_object(
    bucket: oss2.Bucket, object_key: str, text: str, encoding: str = "utf-8"
):
    return bucket.put_object(object_key, text.encode(encoding))


def get_object_bytes(bucket: oss2.Bucket, object_key: str) -> bytes:
    return bucket.get_object(object_key).read()


def get_object_text(
    bucket: oss2.Bucket, object_key: str, encoding: str = "utf-8"
) -> str:
    return get_object_bytes(bucket, object_key).decode(encoding)


def delete_object(bucket: oss2.Bucket, object_key: str):
    return bucket.delete_object(object_key)


def copy_object(
    bucket: oss2.Bucket, bucket_name: str, source_key: str, target_key: str
):
    return bucket.copy_object(bucket_name, source_key, target_key)


def object_exists(bucket: oss2.Bucket, object_key: str) -> bool:
    return bucket.object_exists(object_key)


def object_exists_quiet(bucket: oss2.Bucket, object_key: str) -> bool:
    result = bucket.list_objects(prefix=object_key, max_keys=1)
    return any(obj.key == object_key for obj in result.object_list)


def ensure_prefix(bucket: oss2.Bucket, prefix: str):
    normalized_prefix = prefix if prefix.endswith("/") else f"{prefix}/"
    if not bucket.object_exists(normalized_prefix):
        bucket.put_object(normalized_prefix, "")


def list_object_keys(
    bucket: oss2.Bucket, prefix: str, suffixes: tuple[str, ...] | None = None
) -> list[str]:
    normalized_suffixes = tuple(s.lower() for s in (suffixes or ()))
    keys = []
    for obj in oss2.ObjectIterator(bucket, prefix=prefix):
        key = obj.key
        if key.endswith("/"):
            continue
        if normalized_suffixes and not key.lower().endswith(normalized_suffixes):
            continue
        keys.append(key)
    return keys

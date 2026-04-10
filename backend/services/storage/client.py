import oss2

from .config import OssStorageConfig, get_oss_storage_config


def get_bucket(config: OssStorageConfig | None = None) -> oss2.Bucket:
    resolved_config = config or get_oss_storage_config()
    if not resolved_config.access_key_id or not resolved_config.access_key_secret:
        raise ValueError("未配置阿里云 OSS 密钥")

    auth = oss2.Auth(
        resolved_config.access_key_id, resolved_config.access_key_secret
    )
    return oss2.Bucket(
        auth, resolved_config.endpoint, resolved_config.bucket_name
    )

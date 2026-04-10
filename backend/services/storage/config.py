import os
from dataclasses import dataclass


@dataclass(frozen=True)
class OssStorageConfig:
    access_key_id: str | None
    access_key_secret: str | None
    endpoint: str
    bucket_name: str
    custom_domain: str | None


def get_oss_storage_config() -> OssStorageConfig:
    return OssStorageConfig(
        access_key_id=os.getenv("ALIYUN_ACCESS_KEY_ID"),
        access_key_secret=os.getenv("ALIYUN_ACCESS_KEY_SECRET"),
        endpoint=os.getenv(
            "ALIYUN_OSS_ENDPOINT", "https://oss-cn-shenzhen.aliyuncs.com"
        ),
        bucket_name=os.getenv("ALIYUN_OSS_BUCKET", "oceanedgen"),
        custom_domain=os.getenv(
            "ALIYUN_OSS_CUSTOM_DOMAIN", "oceanedgen.oss-cn-shenzhen.aliyuncs.com"
        ),
    )

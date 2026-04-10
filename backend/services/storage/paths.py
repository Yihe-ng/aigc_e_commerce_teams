from datetime import datetime
from pathlib import PurePosixPath
import uuid


def temp_upload_key(filename: str, now: datetime | None = None) -> str:
    current_time = now or datetime.now()
    suffix = PurePosixPath(filename or "").suffix.lstrip(".").lower()
    if suffix:
        return (
            f"temp_uploads/{current_time.strftime('%Y%m%d')}/"
            f"{uuid.uuid4().hex}.{suffix}"
        )
    return f"temp_uploads/{current_time.strftime('%Y%m%d')}/{uuid.uuid4().hex}"


def marketing_text_key(product_id: str) -> str:
    return f"products/{product_id}/generated_content/marketing.txt"


def generated_content_prefixes(product_id: str) -> list[str]:
    return [
        f"products/{product_id}/",
        f"products/{product_id}/generated_content/",
        f"products/{product_id}/generated_content/images/",
        f"products/{product_id}/generated_content/videos/",
    ]


def generated_asset_key(
    product_id: str,
    content_type: str,
    file_ext: str,
    now: datetime | None = None,
) -> str:
    current_time = now or datetime.now()
    normalized_type = "images" if content_type == "image" else "videos"
    normalized_ext = (file_ext or "").lstrip(".").lower()
    filename = (
        f"gen_{current_time.strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6]}."
        f"{normalized_ext}"
    )
    return f"products/{product_id}/generated_content/{normalized_type}/{filename}"


def category_index_key(category: str) -> str:
    return f"products/_index/by_category/{category}.json"

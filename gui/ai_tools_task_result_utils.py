import json
from typing import Any


def _coerce_result_dict(result: Any) -> dict[str, Any]:
    if isinstance(result, dict):
        return dict(result)

    if isinstance(result, str):
        try:
            parsed = json.loads(result)
        except json.JSONDecodeError:
            return {}

        if isinstance(parsed, dict):
            return parsed

    return {}


def build_image_task_result(
    image_url: str, product_id: str | None = None
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "image_url": image_url,
        "percent": 100,
    }

    if product_id:
        result["product_id"] = product_id

    return result


def build_video_task_result(
    video_data: dict[str, Any], product_id: str | None = None
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "video_url": video_data.get("videoUrl"),
        "cover_url": video_data.get("coverPath"),
        "points_cost": video_data.get("pointsCost", 0),
        "log": [
            "状态变更: 执行中 -> 任务成功",
            "任务进度: 任务成功, 完成度 100.0%",
            f"消耗点数: {video_data.get('pointsCost', 0)}",
            "视频生成成功",
        ],
    }

    if product_id:
        result["product_id"] = product_id

    return result


def merge_saved_video_result(result: Any, oss_url: str) -> dict[str, Any]:
    merged = _coerce_result_dict(result)
    merged["oss_url"] = oss_url
    return merged


def extract_task_product_id(result: Any) -> str | None:
    parsed = _coerce_result_dict(result)
    product_id = parsed.get("product_id")
    if isinstance(product_id, str) and product_id.strip():
        return product_id.strip()
    return None

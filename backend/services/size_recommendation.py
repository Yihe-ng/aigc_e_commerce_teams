"""尺码推荐引擎 —— 解析用户身材信息 + 规则匹配推荐尺码"""

import re
from typing import Optional


def parse_user_body_info(text: str) -> Optional[dict]:
    content = str(text or "").strip()
    if not content:
        return None

    info = {}

    height_match = re.search(r"(\d{3,4})\s*(?:cm|厘米|CM)", content)
    if not height_match:
        height_match = re.search(r"(\d{3,4})\s*(?![斤kg公斤])", content)
    if height_match:
        h = int(height_match.group(1))
        if 130 <= h <= 200:
            info["height"] = h

    weight_match = re.search(r"(\d{2,3})\s*(?:斤|kg|公斤)", content)
    if not weight_match:
        weight_match = re.search(r"我?\s*(\d{2,3})\s*(?:斤|kg|公斤|重)?", content)
    if weight_match:
        w = int(weight_match.group(1))
        if 30 <= w <= 200:
            match_text = weight_match.group(0)
            if "kg" in match_text or "公斤" in match_text:
                w = w * 2
            info["weight"] = w

    return info if info else None


def _parse_weight_range(weight_str: str) -> tuple:
    weight_str = str(weight_str or "").strip()
    nums = re.findall(r"(\d+)", weight_str)
    if len(nums) >= 2:
        return int(nums[0]), int(nums[1])
    return None, None


def generate_size_advice(text: str, product: dict) -> Optional[str]:
    user_info = parse_user_body_info(text)
    if not user_info or "weight" not in user_info:
        return None

    raw_info = product.get("raw_info") if isinstance(product.get("raw_info"), dict) else {}
    size_chart = raw_info.get("size_chart") if isinstance(raw_info.get("size_chart"), dict) else {}
    fit = str(raw_info.get("fit") or "").strip()
    fabric = str(raw_info.get("fabric") or "").strip()

    if not size_chart:
        return None

    matched_size = None
    for size_code, dims in size_chart.items():
        if not isinstance(dims, dict):
            continue
        weight_str = str(dims.get("建议体重") or "")
        w_min, w_max = _parse_weight_range(weight_str)
        if w_min and w_max and w_min <= user_info["weight"] <= w_max:
            matched_size = size_code
            break

    if not matched_size:
        return None

    parts = [f"根据您提供的身材信息（体重约{user_info['weight']}斤），系统推荐尺码：{matched_size}码。"]

    if fit == "修身":
        parts.append("该款为修身版型，如需活动余量可考虑大一码。")
    elif fit == "宽松":
        parts.append("该款为宽松版型，按推荐尺码选购即可。")
    elif fit == "oversized":
        parts.append("该款为Oversized设计，按推荐尺码选购即可呈现慵懒效果。")

    if "弹" in fabric:
        parts.append("面料含弹性纤维，对身材包容度较高。")

    return "【系统尺码推荐】" + "".join(parts)

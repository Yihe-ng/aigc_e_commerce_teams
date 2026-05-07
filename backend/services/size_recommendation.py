"""尺码推荐引擎 —— 解析用户身材信息 + 规则匹配推荐尺码"""

import re
from typing import Optional


def _get_raw_info(product: dict) -> dict:
    raw = product.get("raw_info")
    return raw if isinstance(raw, dict) else {}


def _get_size_chart_from_raw(raw_info: dict) -> dict:
    chart = raw_info.get("size_chart")
    return chart if isinstance(chart, dict) else {}


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

    raw_info = _get_raw_info(product)
    size_chart = _get_size_chart_from_raw(raw_info)
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


def parse_body_type(text: str) -> Optional[str]:
    content = str(text or "").strip()
    if not content:
        return None
    body_specific = {
        "梨形": ["梨形", "梨型", "胯宽"],
        "苹果型": ["苹果型", "苹果形", "肚子大", "腰粗"],
        "肩宽": ["肩宽", "宽肩"],
        "小个子": ["小个子", "矮个子", "个子小", "个矮"],
        "大码": ["大码", "微胖", "丰满"],
    }
    for body_type, keywords in body_specific.items():
        if any(kw in content for kw in keywords):
            return body_type
    return None


def find_recommendations_by_body(text: str) -> Optional[str]:
    user_info = parse_user_body_info(text)
    if not user_info or "weight" not in user_info:
        body_type = parse_body_type(text)
        if body_type:
            from backend.services.product_intro_service import load_products_for_intro
            products = load_products_for_intro()
            matches = []
            for product in products:
                raw_info = _get_raw_info(product)
                fit = str(raw_info.get("fit") or "").strip()
                if body_type == "大码" and fit in ("宽松", "oversized"):
                    matches.append(product)
                elif body_type == "肩宽" and raw_info.get("size_chart"):
                    matches.append(product)
                elif body_type == "小个子":
                    size_chart = _get_size_chart_from_raw(raw_info)
                    for dims in size_chart.values():
                        if isinstance(dims, dict) and dims.get("衣长", 0):
                            length = int(str(dims.get("衣长", "0")).replace("cm", "").strip() or "0")
                            if length and length <= 70:
                                matches.append(product)
                                break
            if matches:
                parts = ["根据您的体型，以下商品可能有合适的尺码："]
                for product in matches[:2]:
                    name = product.get("name", "未知")
                    raw_info = _get_raw_info(product)
                    price = product.get("price") or raw_info.get("price") or "价格待确认"
                    size_chart = _get_size_chart_from_raw(raw_info)
                    size_code = next(iter(size_chart.keys()), "合适")
                    weight_range = ""
                    if size_code != "合适":
                        dims = size_chart.get(size_code, {})
                        if isinstance(dims, dict):
                            weight_range = str(dims.get("建议体重", ""))
                    weight_part = f" | 建议体重{weight_range}" if weight_range else ""
                    parts.append(f"- {name} | 推荐{size_code}码 | 价格{price}{weight_part}")
                parts.append("请优先基于以上商品与尺码回答，不要编造额外尺码信息。")
                return " | ".join(parts)
        return None

    from backend.services.product_intro_service import load_products_for_intro
    products = load_products_for_intro()
    matches = []
    for product in products:
        raw_info = _get_raw_info(product)
        size_chart = _get_size_chart_from_raw(raw_info)
        if not size_chart:
            continue
        for size_code, dims in size_chart.items():
            if not isinstance(dims, dict):
                continue
            weight_str = str(dims.get("建议体重") or "")
            nums = re.findall(r"(\d+)", weight_str)
            if len(nums) >= 2:
                w_min, w_max = int(nums[0]), int(nums[1])
                if w_min <= user_info["weight"] <= w_max:
                    matches.append((product, size_code))
                    break
    if matches:
        parts = [f"根据您的体重（约{user_info['weight']}斤），以下商品有合适尺码："]
        for product, size_code in matches[:2]:
            name = product.get("name", "未知")
            raw_info = _get_raw_info(product)
            price = product.get("price") or raw_info.get("price") or "价格待确认"
            size_chart = _get_size_chart_from_raw(raw_info)
            dims = size_chart.get(size_code, {}) if isinstance(size_chart, dict) else {}
            weight_range = str(dims.get("建议体重", "")) if isinstance(dims, dict) else ""
            weight_part = f" | 建议体重{weight_range}" if weight_range else ""
            parts.append(f"- {name} | 推荐{size_code}码 | 价格{price}{weight_part}")
        body_type = parse_body_type(text)
        if body_type:
            body_advice = {"梨形": "优先关注臀围和腰围数据", "肩宽": "优先关注肩宽数据", "小个子": "优先关注衣长数据"}.get(body_type, "")
            if body_advice:
                parts.append(f"体型建议：{body_advice}")
        parts.append("请优先基于以上商品与尺码回答，不要编造额外尺码信息。")
        return " | ".join(parts)
    return None

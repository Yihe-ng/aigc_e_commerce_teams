"""搭配规则引擎 —— 基于 rules.json 的专家规则匹配 + 店内在售商品反查"""

import json
import os
from typing import Optional

_rules_path = os.path.join(os.path.dirname(__file__), "rules.json")
_rules_cache: dict | None = None


def _load_rules() -> dict | None:
    global _rules_cache
    if _rules_cache is not None:
        return _rules_cache
    try:
        with open(_rules_path, "r", encoding="utf-8") as f:
            _rules_cache = json.load(f)
    except Exception:
        _rules_cache = None
    return _rules_cache


def get_outfit_recommendation(product: dict) -> tuple | None:
    rules = _load_rules()
    if not rules:
        return None
    assert rules is not None

    raw_info = product.get("raw_info") if isinstance(product.get("raw_info"), dict) else {}
    style = str(product.get("style") or raw_info.get("style") or "").strip()
    scene_list = product.get("scene") or raw_info.get("scene") or []
    fit = str(product.get("fit") or raw_info.get("fit") or "").strip()
    colors = product.get("colors") or raw_info.get("colors") or []
    name = str(product.get("name") or raw_info.get("name") or "这件商品")

    parts = []
    keywords = []

    # 1. 风格推荐
    if style and style in rules.get("style", {}):
        s = rules["style"][style]
        parts.append(f"搭配建议：{s.get('reason', '')}推荐搭配{s.get('bottoms', '')}，{s.get('shoes', '')}，配{s.get('bags', '')}。")
        for k in [s.get("shoes"), s.get("bottoms"), s.get("bags"), s.get("accessories")]:
            if k:
                keywords.extend(k.replace("或", " ").replace("、", " ").split())

    # 2. 场景建议
    for scene in scene_list:
        scene = str(scene).strip()
        if scene and scene in rules.get("scene", {}):
            sc = rules["scene"][scene]
            if sc.get("tip"):
                parts.append(f"「{scene}」场景：{sc['tip']}。")

    # 3. 版型建议
    if fit and fit in rules.get("fit", {}):
        f = rules["fit"][fit]
        if f.get("tip"):
            parts.append(f"版型提示：{f['tip']}。")

    # 4. 颜色建议
    for color in colors:
        color = str(color).strip()
        if color and color in rules.get("color", {}):
            parts.append(rules["color"][color])
            break

    if not parts:
        return None

    prefix = f"【搭配参考 — {name}】"
    text = prefix + "\n" + "\n".join(parts)
    return text, keywords


def get_outfit_text(product: dict) -> Optional[str]:
    """返回纯文本搭配建议（给 LLM 上下文用）"""
    result = get_outfit_recommendation(product)
    if result is None:
        return None
    text, _ = result
    return text


def get_outfit_keywords(product: dict) -> list[str]:
    """返回搭配建议中的关键品类词，用于反查店内在售商品"""
    result = get_outfit_recommendation(product)
    if result is None:
        return []
    _, keywords = result
    return list(set(k.strip() for k in keywords if len(k.strip()) >= 2))


def find_matching_products(keywords: list[str], products: list[dict]) -> list[dict]:
    """从商品库中查找 name 或 tags 包含关键词的商品，按匹配数排序"""
    if not keywords or not products:
        return []
    scored = []
    for p in products:
        name = str(p.get("name") or "").lower()
        tags = [str(t).lower() for t in (p.get("tags") or [])]
        raw_info = p.get("raw_info") if isinstance(p.get("raw_info"), dict) else {}
        rt = [str(t).lower() for t in (raw_info.get("tags") or [])]
        all_tags = set(tags + rt)
        hits = sum(1 for kw in keywords if kw.lower() in name or any(kw.lower() in t for t in all_tags))
        if hits > 0:
            scored.append((p, hits))
    scored.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in scored[:2]]


def build_full_outfit_context(product: dict, all_products: Optional[list[dict]] = None) -> Optional[str]:
    """构建完整的搭配上下文，包含文字建议 + 店内在售商品"""
    text = get_outfit_text(product)
    if text is None:
        return None

    if all_products:
        keywords = get_outfit_keywords(product)
        matches = find_matching_products(keywords, all_products)
        if matches:
            text += "\n\n⚡ 店内在售同类单品："
            for mp in matches:
                pname = mp.get("name", "")
                pprice = mp.get("price") or (mp.get("raw_info") or {}).get("price") or ""
                price_str = f"（{pprice}元）" if pprice else ""
                text += f"\n- {pname}{price_str}"

    return text


if __name__ == "__main__":
    # 手动测试
    test_product = {
        "name": "夏日多巴胺假两件甜辣斜肩T恤",
        "style": "甜辣",
        "scene": ["约会", "日常"],
        "fit": "标准版型",
        "colors": ["红色", "蓝色"],
    }
    text = get_outfit_text(test_product)
    print("=== 搭配建议 ===")
    print(text or "无匹配")

    kws = get_outfit_keywords(test_product)
    print(f"\n=== 关键品类词 ===")
    print(kws)

    # 模拟商品反查
    mock_products = [
        {"name": "高腰直筒牛仔裤", "tags": ["百搭", "显瘦"], "price": 89},
        {"name": "链条斜挎小包", "tags": ["精致"], "price": 49},
    ]
    matches = find_matching_products(kws, mock_products)
    print(f"\n=== 店在售匹配 ===")
    for m in matches:
        print(f"- {m['name']} (${m['price']})")

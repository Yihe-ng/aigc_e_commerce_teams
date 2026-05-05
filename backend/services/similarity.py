"""Jaccard 相似商品推荐引擎 —— 基于商品属性集合的集合相似度计算，TF-IDF 加权"""
import math
from typing import Optional


def jaccard_similarity(set_a: set, set_b: set) -> float:
    union = set_a | set_b
    if not union:
        return 0.0
    return len(set_a & set_b) / len(union)


def _build_product_features(product: dict) -> set:
    raw_info = product.get("raw_info") if isinstance(product.get("raw_info"), dict) else {}
    features = set()

    for field in ("style", "fit"):
        val = product.get(field) or raw_info.get(field)
        if val and str(val).strip():
            features.add(str(val).strip())

    for field in ("tags", "scene"):
        raw_val = product.get(field) or raw_info.get(field) or []
        if isinstance(raw_val, str):
            raw_val = [raw_val]
        if not isinstance(raw_val, (list, tuple, set)):
            raw_val = []
        for item in raw_val:
            s = str(item).strip()
            if s:
                features.add(s)

    return features


def _compute_idf_weights(all_products: list[dict]) -> dict[str, float]:
    n = len(all_products)
    if n <= 1:
        return {}
    doc_counts: dict[str, int] = {}
    all_features: list[set] = []
    for p in all_products:
        feats = _build_product_features(p)
        all_features.append(feats)
        for f in feats:
            doc_counts[f] = doc_counts.get(f, 0) + 1
    return {f: math.log((n + 1) / (count + 1)) + 1.0 for f, count in doc_counts.items()}


def _weighted_jaccard(features_a: set, features_b: set, weights: dict) -> float:
    intersection = features_a & features_b
    union = features_a | features_b
    if not union:
        return 0.0
    w_inter = sum(weights.get(f, 1.0) for f in intersection)
    w_union = sum(weights.get(f, 1.0) for f in union)
    return w_inter / w_union if w_union > 0 else 0.0


def get_similar_products(current_product: dict, all_products: list[dict], top_n: int = 2, threshold: float = 0.30) -> list[dict]:
    current_features = _build_product_features(current_product)
    if not current_features:
        return []

    weights = _compute_idf_weights(all_products)
    current_id = str(current_product.get("id") or current_product.get("name") or "")

    scored = []
    for product in all_products:
        product_id = str(product.get("id") or product.get("name") or "")
        if product_id == current_id:
            continue
        features = _build_product_features(product)
        if not features:
            continue
        score = _weighted_jaccard(current_features, features, weights)
        if score >= threshold:
            scored.append((product, round(score, 2)))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in scored[:top_n]]


def build_similarity_context(current_product: dict, all_products: list[dict]) -> Optional[str]:
    similar = get_similar_products(current_product, all_products)
    if not similar:
        return None

    parts = ["【相似推荐】"]
    for p in similar:
        name = p.get("name", "")
        raw_info = p.get("raw_info") if isinstance(p.get("raw_info"), dict) else {}
        style = p.get("style") or raw_info.get("style") or ""
        price = p.get("price") or raw_info.get("price") or ""
        price_str = f" {price}元" if price else ""
        style_str = f" · {style}" if style else ""
        parts.append(f"- {name}{style_str}{price_str}")

    parts.append("请自然地在回答中向用户提及以上相似商品，但不要生硬罗列。")
    return "\n".join(parts)


if __name__ == "__main__":
    store = [
        {"name": "夏日多巴胺假两件甜辣斜肩T恤", "style": "甜辣", "tags": ["显瘦", "百搭", "少女感"], "scene": ["约会", "日常"], "fit": "标准版型", "colors": ["红色", "蓝色"]},
        {"name": "美式复古斜肩短袖T恤", "style": "美式复古", "tags": ["显瘦", "百搭", "复古"], "scene": ["约会", "日常"], "fit": "宽松", "colors": ["黑色"]},
        {"name": "法式碎花连衣裙", "style": "法式", "tags": ["显瘦", "气质"], "scene": ["约会", "度假"], "fit": "修身", "colors": ["白色"]},
        {"name": "通勤西装外套", "style": "通勤", "tags": ["气质", "高级感"], "scene": ["通勤", "日常"], "fit": "修身", "colors": ["黑色", "灰色"]},
    ]

    print("=== Feature Sets ===")
    for p in store:
        f = _build_product_features(p)
        score_str = ", ".join(sorted(f))
        print(f"  {p['name'][:12]:12s} -> {{{score_str}}}")

    print("\n=== Similarity Matrix ===")
    for a in store:
        for b in store:
            if a["name"] == b["name"]:
                continue
            a_f = _build_product_features(a)
            b_f = _build_product_features(b)
            sim = jaccard_similarity(a_f, b_f)
            if sim >= 0.15:
                print(f"  {a['name'][:12]:12s} vs {b['name'][:12]:12s} = {sim:.0%}")

    print("\n=== Top Similar for Each ===")
    for p in store:
        sims = get_similar_products(p, store)
        names = [s["name"].split("假")[0] for s in sims]
        print(f"  {p['name'][:12]:12s} -> {names if names else 'none'}")

    print("\n=== Context Output ===")
    for p in store:
        ctx = build_similarity_context(p, store)
        print(ctx or f"  {p['name'][:12]}: no similar products")
        print()

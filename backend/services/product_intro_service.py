import re
from typing import Any

import oss2

from backend.services.storage import get_bucket, read_json_object


_GENERIC_INTRO_RE = re.compile(
    "^(?:介绍一下|介绍下|介绍|讲讲|说说|看看)(?:已有的|现有的)?商品[。！!？?]*$"
)
_FIRST_PRODUCT_RE = re.compile(
    "^(?:介绍一下|介绍下|介绍|讲讲|说说|看看)(?:第1个|第一个)商品[。！!？?]*$"
)
_INTRO_PREFIX_RE = re.compile("^(?:介绍一下|介绍下|介绍|讲讲|说说|看看)")
_NORMALIZE_RE = re.compile(r"[\s\-_.,，。！？、“”\"'（）()\[\]【】:：;；/]+")
_KEYWORD_TOKEN_RE = re.compile(r"[a-z0-9]+(?:[\u4e00-\u9fff]{1,3})?|[\u4e00-\u9fff]+")
_TEXT_VARIANT_MAP = str.maketrans({
    "桖": "恤",
    "Ｔ": "T",
    "ｔ": "t",
})
_GENERIC_PRODUCT_TOKENS = {
    "商品", "这件", "那件", "款", "衣服", "上衣", "外套", "开衫", "针织衫", "衬衫", "裙子",
    "裤子", "t恤", "短t", "短袖", "连衣裙", "半裙", "牛仔裤"
}
_GENERIC_QUERY_HINTS = (
    "我想看", "想看", "看看", "介绍一下", "介绍下", "介绍", "讲讲", "说说",
    "这件衣服", "这件", "这款衣服", "这款", "这个衣服", "这个", "那件", "那款",
    "怎么样", "怎么", "想了解"
)
_WEAK_QUERY_PREFIXES = ("这件", "这款", "这个", "那件", "那款")
_WEAK_QUERY_SUFFIXES = ("怎么样", "如何", "怎么选", "怎么回事")
_WEAK_QUERY_EXACT = {
    "这件衣服怎么样",
    "这件怎么样",
    "这款衣服怎么样",
    "这款怎么样",
    "这个衣服怎么样",
    "这个怎么样",
}


def _normalize_text(value: str | None) -> str:
    text = str(value or "").strip().translate(_TEXT_VARIANT_MAP).lower()
    return _NORMALIZE_RE.sub("", text)


def _strip_intro_suffix(text: str) -> str:
    stripped = str(text or "").strip()
    stripped = re.sub(r"[。！!？?]+$", "", stripped)
    if stripped.endswith("商品"):
        stripped = stripped[:-2]
    return stripped.strip()


def _extract_intro_keyword(text: str) -> str:
    raw_text = str(text or "").strip()
    if not raw_text:
        return ""

    prefix_match = _INTRO_PREFIX_RE.match(raw_text)
    if not prefix_match:
        return ""

    remainder = raw_text[prefix_match.end():].strip()
    remainder = _strip_intro_suffix(remainder)
    if not remainder or remainder in {"已有的", "现有的"}:
        return ""
    return remainder


def _extract_direct_product_keyword(text: str) -> str:
    raw_text = str(text or "").strip()
    if not raw_text:
        return ""

    stripped = _strip_intro_suffix(raw_text)
    if stripped != raw_text and stripped and stripped not in {"已有的", "现有的"}:
        return stripped
    return ""


def _split_keywords(value: str | None) -> list[str]:
    text = str(value or "").strip()
    if not text:
        return []

    coarse_parts = re.split(r"[\s,，、/]+", text)
    tokens: list[str] = []
    for part in coarse_parts:
        mixed_parts = _KEYWORD_TOKEN_RE.findall(str(part or "").lower())
        normalized_part = _normalize_text(part)
        normalized_mixed_parts: list[str] = []
        for mixed_part in mixed_parts:
            normalized_mixed = _normalize_text(mixed_part)
            if normalized_mixed and normalized_mixed not in normalized_mixed_parts:
                normalized_mixed_parts.append(normalized_mixed)

        if len(normalized_mixed_parts) > 1:
            for normalized_mixed in normalized_mixed_parts:
                if normalized_mixed not in tokens:
                    tokens.append(normalized_mixed)
            continue

        if normalized_part and normalized_part not in tokens:
            tokens.append(normalized_part)

    return tokens


def _coerce_features(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item or "").strip()]
    if isinstance(value, str):
        return [item.strip() for item in re.split(r"[，,、/]", value) if item.strip()]
    return []


def load_products_for_intro(bucket=None) -> list[dict[str, Any]]:
    local_bucket = bucket or get_bucket()
    products: list[dict[str, Any]] = []

    for obj in oss2.ObjectIterator(local_bucket, prefix="products/", delimiter="/"):
        if not obj.is_prefix() or obj.key.count("/") != 2:
            continue

        product_id = obj.key.split("/")[1]
        if not product_id.startswith("prod_"):
            continue

        info = read_json_object(local_bucket, f"products/{product_id}/info.json", default=None)
        if not isinstance(info, dict):
            continue

        product_name = str(info.get("name") or "").strip()
        if not product_name:
            continue

        products.append(
            {
                "id": product_id,
                "name": product_name,
                "price": info.get("price"),
                "description": str(info.get("description") or "").strip(),
                "features": _coerce_features(info.get("features")),
                "category": str(info.get("category") or "").strip(),
                "raw_info": info,
            }
        )

    return products


def detect_intro_intent(text: str) -> dict[str, Any]:
    raw_text = str(text or "").strip()
    if not raw_text:
        return {"handled": False, "mode": None, "keyword": ""}

    if _GENERIC_INTRO_RE.match(raw_text):
        return {"handled": True, "mode": "generic", "keyword": ""}

    if _FIRST_PRODUCT_RE.match(raw_text):
        return {"handled": True, "mode": "generic", "keyword": ""}

    keyword = _extract_intro_keyword(raw_text)
    if not keyword:
        return {"handled": False, "mode": None, "keyword": ""}

    return {"handled": True, "mode": "named", "keyword": keyword}


def pick_default_product(products: list[dict[str, Any]]) -> dict[str, Any] | None:
    return products[0] if products else None


def _token_overlap_score(source_tokens: list[str], target_tokens: list[str]) -> float:
    if not source_tokens or not target_tokens:
        return 0.0
    overlap = sum(1 for token in source_tokens if token in target_tokens)
    return overlap / max(len(source_tokens), 1)


def _is_generic_query(tokens: list[str]) -> bool:
    meaningful_tokens = [token for token in tokens if token]
    if not meaningful_tokens:
        return True
    return all(token in _GENERIC_PRODUCT_TOKENS for token in meaningful_tokens)


def _extract_query_signal_text(text: str) -> str:
    normalized_text = _normalize_text(text)
    signal_text = normalized_text
    for hint in _GENERIC_QUERY_HINTS:
        signal_text = signal_text.replace(_normalize_text(hint), "")
    for token in _GENERIC_PRODUCT_TOKENS:
        signal_text = signal_text.replace(_normalize_text(token), "")
    return signal_text.strip()


def _is_weak_product_query(text: str) -> bool:
    raw_text = str(text or "").strip()
    if not raw_text:
        return True
    if raw_text in _WEAK_QUERY_EXACT:
        return True
    normalized_text = _normalize_text(raw_text)
    normalized_prefixes = [_normalize_text(prefix) for prefix in _WEAK_QUERY_PREFIXES]
    normalized_suffixes = [_normalize_text(suffix) for suffix in _WEAK_QUERY_SUFFIXES]
    return any(normalized_text.startswith(prefix) for prefix in normalized_prefixes) and any(normalized_text.endswith(suffix) for suffix in normalized_suffixes)


def _build_candidate_snippet(product: dict[str, Any]) -> str:
    product_features = _coerce_features(product.get("features"))
    product_description = str(product.get("description") or "").strip()
    product_category = str(product.get("category") or "").strip()
    product_price = str(product.get("price") or "").strip()
    raw_info = product.get("raw_info") if isinstance(product.get("raw_info"), dict) else {}

    if product_features:
        return "，".join(product_features[:2])
    if product_description:
        return product_description[:24]
    if product_category and product_price:
        return f"{product_category}，价格约{product_price}"
    if product_category:
        return f"偏{product_category}"

    for key, value in raw_info.items():
        if key in {"name", "price", "description", "features", "category"}:
            continue
        if isinstance(value, str) and value.strip():
            return value.strip()[:24]
        if isinstance(value, list):
            values = [str(item).strip() for item in value if str(item).strip()]
            if values:
                return "，".join(values[:2])
    return ""


def _score_product_candidate(query: str, product: dict[str, Any]) -> dict[str, Any]:
    trimmed_query = str(query or "").strip()
    normalized_query = _normalize_text(trimmed_query)
    normalized_name = _normalize_text(product.get("name"))
    query_tokens = _split_keywords(trimmed_query)
    name_tokens = _split_keywords(product.get("name"))
    feature_tokens = _split_keywords(" ".join(_coerce_features(product.get("features"))))
    description_tokens = _split_keywords(product.get("description"))
    category_tokens = _split_keywords(product.get("category"))

    score = 0.0
    strong_name_signal = False
    full_name_in_query = False
    partial_name_ratio = 0.0

    if trimmed_query and str(product.get("name") or "").strip() == trimmed_query:
        score += 120
        strong_name_signal = True
        full_name_in_query = True
    elif normalized_query and normalized_name == normalized_query:
        score += 110
        strong_name_signal = True
        full_name_in_query = True
    elif normalized_name and normalized_name in normalized_query:
        score += 95
        strong_name_signal = True
        full_name_in_query = True
    elif normalized_query and normalized_query in normalized_name and len(normalized_query) >= 2:
        score += 80
        partial_name_ratio = len(normalized_query) / max(len(normalized_name), 1)
        if partial_name_ratio >= 0.72:
            strong_name_signal = True

    name_overlap = _token_overlap_score(name_tokens, query_tokens)
    feature_overlap = _token_overlap_score(feature_tokens, query_tokens)
    description_overlap = _token_overlap_score(description_tokens, query_tokens)
    category_overlap = _token_overlap_score(category_tokens, query_tokens)

    score += name_overlap * 60
    score += feature_overlap * 18
    score += description_overlap * 12
    score += category_overlap * 10

    if len(name_tokens) >= 2 and name_overlap >= 0.66:
        strong_name_signal = True
        score += 18
    elif len(name_tokens) == 1 and normalized_name and normalized_name in normalized_query:
        strong_name_signal = True

    return {
        "product": product,
        "score": round(score, 2),
        "strong_name_signal": strong_name_signal,
        "full_name_in_query": full_name_in_query,
        "partial_name_ratio": round(partial_name_ratio, 2),
        "query_tokens": query_tokens,
        "name_overlap": round(name_overlap, 2),
        "feature_overlap": round(feature_overlap, 2),
        "description_overlap": round(description_overlap, 2),
        "category_overlap": round(category_overlap, 2),
        "snippet": _build_candidate_snippet(product),
    }


def _filter_confident_candidates(candidates: list[dict[str, Any]], *, require_strong_name: bool) -> list[dict[str, Any]]:
    confident = []
    for candidate in candidates:
        score = float(candidate.get("score", 0.0))
        strong_name_signal = bool(candidate.get("strong_name_signal"))
        signal_text = _extract_query_signal_text("".join(candidate.get("query_tokens", [])))
        if not require_strong_name and len(signal_text) < 2 and not strong_name_signal:
            continue
        if require_strong_name and _is_generic_query(candidate.get("query_tokens", [])):
            continue
        if require_strong_name and len(signal_text) < 3:
            continue
        if require_strong_name and not strong_name_signal:
            continue
        if score >= 78:
            confident.append(candidate)
        elif strong_name_signal and score >= 68:
            confident.append(candidate)
    return confident


def _rank_products_for_query(query: str, products: list[dict[str, Any]], *, require_strong_name: bool) -> list[dict[str, Any]]:
    candidates = [_score_product_candidate(query, product) for product in products]
    candidates.sort(key=lambda item: (-float(item.get("score", 0.0)), item["product"].get("name") or ""))
    return _filter_confident_candidates(candidates, require_strong_name=require_strong_name)


def _build_match_result(candidates: list[dict[str, Any]]) -> dict[str, Any]:
    if not candidates:
        return {"status": "not_found", "product": None, "matches": []}

    top = candidates[0]
    if len(candidates) == 1:
        return {"status": "matched", "product": top["product"], "matches": [item["product"] for item in candidates], "candidates": candidates}

    second = candidates[1]
    if bool(top.get("full_name_in_query")) and not bool(second.get("full_name_in_query")):
        return {"status": "matched", "product": top["product"], "matches": [item["product"] for item in candidates], "candidates": candidates}
    if float(top.get("score", 0.0)) - float(second.get("score", 0.0)) >= 18:
        return {"status": "matched", "product": top["product"], "matches": [item["product"] for item in candidates], "candidates": candidates}

    return {"status": "multiple", "product": None, "matches": [item["product"] for item in candidates], "candidates": candidates}


def match_product(keyword: str, products: list[dict[str, Any]]) -> dict[str, Any]:
    trimmed_keyword = str(keyword or "").strip()
    if not trimmed_keyword:
        return {"status": "not_found", "product": None, "matches": []}

    exact_matches = [product for product in products if str(product.get("name") or "").strip() == trimmed_keyword]
    if len(exact_matches) == 1:
        return {"status": "matched", "product": exact_matches[0], "matches": exact_matches}
    if len(exact_matches) > 1:
        ranked = _rank_products_for_query(trimmed_keyword, exact_matches, require_strong_name=False)
        return _build_match_result(ranked)

    normalized_keyword = _normalize_text(trimmed_keyword)
    normalized_exact_matches = [product for product in products if _normalize_text(product.get("name")) == normalized_keyword]
    if len(normalized_exact_matches) == 1:
        return {"status": "matched", "product": normalized_exact_matches[0], "matches": normalized_exact_matches}
    if len(normalized_exact_matches) > 1:
        ranked = _rank_products_for_query(trimmed_keyword, normalized_exact_matches, require_strong_name=False)
        return _build_match_result(ranked)

    keyword_tokens = _split_keywords(trimmed_keyword)
    signal_text = _extract_query_signal_text(trimmed_keyword)
    if _is_generic_query(keyword_tokens) or len(signal_text) < 2:
        return {"status": "not_found", "product": None, "matches": []}

    ranked = _rank_products_for_query(trimmed_keyword, products, require_strong_name=False)
    return _build_match_result(ranked)


def match_product_from_query(text: str, products: list[dict[str, Any]]) -> dict[str, Any]:
    normalized_text = _normalize_text(text)
    if not normalized_text:
        return {"status": "not_found", "product": None, "matches": []}
    if _is_weak_product_query(text):
        return {"status": "not_found", "product": None, "matches": []}

    direct_name_matches = []
    for product in products:
        normalized_name = _normalize_text(product.get("name"))
        if normalized_name and normalized_name in normalized_text:
            direct_name_matches.append(product)

    if len(direct_name_matches) == 1:
        return {"status": "matched", "product": direct_name_matches[0], "matches": direct_name_matches}
    if len(direct_name_matches) > 1:
        direct_name_matches.sort(key=lambda item: len(_normalize_text(item.get("name"))), reverse=True)
        if len(direct_name_matches) == 1 or len(_normalize_text(direct_name_matches[0].get("name"))) > len(_normalize_text(direct_name_matches[1].get("name"))):
            return {"status": "matched", "product": direct_name_matches[0], "matches": direct_name_matches}
        ranked = _rank_products_for_query(text, direct_name_matches, require_strong_name=True)
        return _build_match_result(ranked)

    ranked = _rank_products_for_query(text, products, require_strong_name=True)
    if ranked:
        return _build_match_result(ranked)

    signal_text = _extract_query_signal_text(text)
    signal_tokens = _split_keywords(signal_text)
    if _is_generic_query(signal_tokens) or len(signal_text) < 2:
        return {"status": "not_found", "product": None, "matches": []}

    ranked = _rank_products_for_query(signal_text, products, require_strong_name=False)
    return _build_match_result(ranked)


def _load_rag_context(product: dict[str, Any]) -> list[str]:
    return []


def build_intro_prompt(product: dict[str, Any]) -> str:
    product_name = str(product.get("name") or "").strip()
    product_price = str(product.get("price") or "").strip()
    product_description = str(product.get("description") or "").strip()
    product_features = _coerce_features(product.get("features"))
    product_category = str(product.get("category") or "").strip()
    rag_context = _load_rag_context(product)
    feature_text = "、".join(product_features[:4])
    rag_text = "；".join(rag_context)

    lines = [
        "你是一名直播间主播，请用自然、简洁、口语化的中文介绍商品。",
        f"商品名称：{product_name}",
    ]
    if product_category:
        lines.append(f"商品分类：{product_category}")
    if product_price:
        lines.append(f"商品价格：{product_price}")
    if product_description:
        lines.append(f"商品描述：{product_description}")
    if product_features:
        lines.append(f"商品卖点：{feature_text}")
    if rag_context:
        lines.append(f"补充信息：{rag_text}")

    lines.extend(
        [
            "请先讲清楚这款商品最值得关注的亮点，再自然补充适合的人群或场景。",
            "语气要像专业又亲切的导购，不要浮夸，不要像硬广。",
            "直接输出面向用户的中文介绍，不要解释规则，不要输出提示词。",
        ]
    )
    return "\n".join(lines)


def _collect_product_context_lines(product: dict[str, Any]) -> list[str]:
    raw_info = product.get("raw_info") if isinstance(product.get("raw_info"), dict) else {}
    product_name = str(product.get("name") or "").strip()
    product_price = str(product.get("price") or "").strip()
    product_description = str(product.get("description") or "").strip()
    product_features = _coerce_features(product.get("features"))
    product_category = str(product.get("category") or "").strip()

    lines = [f"商品名称：{product_name}"]
    if product_category:
        lines.append(f"商品分类：{product_category}")
    if product_price:
        lines.append(f"商品价格：{product_price}")
    if product_description:
        lines.append(f"商品描述：{product_description}")
    if product_features:
        lines.append(f"商品特点：{'、'.join(product_features[:6])}")

    for key, value in raw_info.items():
        if key in {"name", "price", "description", "features", "category"}:
            continue
        if isinstance(value, (str, int, float)) and str(value).strip():
            lines.append(f"{key}：{str(value).strip()}")
        elif isinstance(value, list):
            values = [str(item).strip() for item in value if str(item).strip()]
            if values:
                lines.append(f"{key}：{'、'.join(values[:6])}")
    return lines


def build_product_question_prompt(product: dict[str, Any], original_text: str) -> str:
    lines = [
        "你是一名直播间导购，请基于已知商品资料回答用户当前的问题。",
        "先直接回答用户最关心的问题，再结合商品特点、描述和卖点做自然补充。",
        "语气要亲切、专业、可信，可以适度给出场景或搭配建议，但不要浮夸，不要像硬广。",
    ]
    lines.extend(_collect_product_context_lines(product))
    lines.append(f"用户问题：{str(original_text or '').strip()}")
    lines.append("请直接输出面向用户的中文回答，不要解释规则，不要输出提示词。")
    return "\n".join(lines)


def build_not_found_prompt(original_text: str, keyword: str) -> str:
    return "\n".join(
        [
            f"用户原话：{str(original_text or '').strip()}",
            (
                f"请用自然、简洁、友好的中文回复：当前没有找到名称包含“{str(keyword or '').strip()}”的商品，"
                "并引导用户提供更具体、更完整的商品名称。"
            ),
            "只输出面向用户的中文回复，不要解释规则，不要输出英文。",
        ]
    )


def _limit_candidate_candidates(matches: list[dict[str, Any]] | list[dict]) -> list[dict]:
    limited = []
    for item in matches[:2]:
        if "product" in item:
            limited.append(item)
        else:
            limited.append({"product": item, "snippet": _build_candidate_snippet(item), "score": 0.0})
    return limited


def build_multiple_matches_prompt(original_text: str, matches: list[dict[str, Any]]) -> str:
    top_candidates = _limit_candidate_candidates(matches)
    candidate_lines: list[str] = []
    for index, item in enumerate(top_candidates, start=1):
        product = item["product"]
        name = str(product.get("name") or "").strip()
        snippet = str(item.get("snippet") or "").strip()
        if snippet:
            candidate_lines.append(f"{index}. {name}（{snippet}）")
        else:
            candidate_lines.append(f"{index}. {name}")

    candidate_text = "；".join(candidate_lines) if candidate_lines else "几款相关商品"
    return "\n".join(
        [
            f"用户原话：{str(original_text or '').strip()}",
            (
                "请用自然、亲切、像导购确认需求一样的中文回复。"
                "先告诉用户你已经帮他锁定了1到2款可能相关的商品，再邀请他确认具体是哪一款。"
            ),
            f"候选商品：{candidate_text}",
            "回复里要顺手告诉用户：确认商品后，我可以继续帮你看材质、场景、搭配或洗护建议。",
            "不要像系统报错，不要说“请更具体一些哦”这种机械提示，不要编造商品信息。",
        ]
    )


def build_multiple_matches_reply(original_text: str, matches: list[dict[str, Any]]) -> str:
    top_candidates = _limit_candidate_candidates(matches)
    if not top_candidates:
        return "我这边先帮你看看更具体的商品款式，你也可以直接回我完整商品名，我继续帮你看。"

    candidate_lines: list[str] = []
    for index, item in enumerate(top_candidates, start=1):
        product = item["product"]
        name = str(product.get("name") or "").strip()
        snippet = str(item.get("snippet") or "").strip()
        if snippet:
            candidate_lines.append(f"{index}. {name}（{snippet}）")
        else:
            candidate_lines.append(f"{index}. {name}")

    if len(candidate_lines) == 1:
        return (
            f"你是在问 {candidate_lines[0]} 吗？"
            "如果是这款，我可以继续帮你看材质、场景、搭配或洗护建议。"
        )

    return (
        f"我这边先帮你锁定了两款可能相关的商品：{'；'.join(candidate_lines)}。"
        "你想先了解哪一款呢？你回我商品名，我继续帮你看材质、场景、搭配或洗护建议。"
    )


def build_no_products_prompt(original_text: str) -> str:
    return "\n".join(
        [
            f"用户原话：{str(original_text or '').strip()}",
            "请用自然、简洁、友好的中文回复：当前商品库里还没有可介绍的商品，请用户先补充商品基础信息。",
            "只输出面向用户的中文回复，不要输出英文。",
        ]
    )


def resolve_product_intro(text: str, products: list[dict[str, Any]] | None = None, bucket=None) -> dict[str, Any]:
    intent = detect_intro_intent(text)
    available_products = products if products is not None else load_products_for_intro(bucket=bucket)

    if not intent["handled"]:
        query_match = match_product_from_query(text, available_products)
        if query_match["status"] == "matched":
            matched_product = query_match["product"]
            return {
                "handled": True,
                "llm_input": build_product_question_prompt(matched_product, text),
                "reply_text": None,
                "matched_product": matched_product,
                "allow_knowledge_enhance": True,
                "response_mode": "product_qa",
            }
        if query_match["status"] == "multiple":
            multiple_reply = build_multiple_matches_reply(text, query_match.get("candidates") or query_match["matches"])
            return {
                "handled": True,
                "llm_input": build_multiple_matches_prompt(text, query_match.get("candidates") or query_match["matches"]),
                "reply_text": multiple_reply,
                "matched_product": None,
                "allow_knowledge_enhance": False,
                "response_mode": "product_multiple",
            }

        direct_keyword = _extract_direct_product_keyword(text)
        if not direct_keyword:
            return {
                "handled": False,
                "llm_input": None,
                "reply_text": None,
                "matched_product": None,
                "allow_knowledge_enhance": False,
                "response_mode": None,
            }
        intent = {"handled": True, "mode": "named", "keyword": direct_keyword}

    if not available_products:
        return {
            "handled": True,
            "llm_input": build_no_products_prompt(text),
            "reply_text": None,
            "matched_product": None,
            "allow_knowledge_enhance": False,
            "response_mode": "product_empty",
        }

    if intent["mode"] == "generic":
        matched_product = pick_default_product(available_products)
        if matched_product is None:
            return {
                "handled": True,
                "llm_input": build_no_products_prompt(text),
                "reply_text": None,
                "matched_product": None,
                "allow_knowledge_enhance": False,
                "response_mode": "product_empty",
            }
        return {
            "handled": True,
            "llm_input": build_intro_prompt(matched_product),
            "reply_text": None,
            "matched_product": matched_product,
            "allow_knowledge_enhance": False,
            "response_mode": "product_intro",
        }

    match_result = match_product(intent["keyword"], available_products)
    if match_result["status"] == "matched":
        matched_product = match_result["product"]
        return {
            "handled": True,
            "llm_input": build_intro_prompt(matched_product),
            "reply_text": None,
            "matched_product": matched_product,
            "allow_knowledge_enhance": False,
            "response_mode": "product_intro",
        }

    if match_result["status"] == "multiple":
        multiple_reply = build_multiple_matches_reply(text, match_result.get("candidates") or match_result["matches"])
        return {
            "handled": True,
            "llm_input": build_multiple_matches_prompt(text, match_result.get("candidates") or match_result["matches"]),
            "reply_text": multiple_reply,
            "matched_product": None,
            "allow_knowledge_enhance": False,
            "response_mode": "product_multiple",
        }

    query_match = match_product_from_query(text, available_products)
    if query_match["status"] == "matched":
        matched_product = query_match["product"]
        return {
            "handled": True,
            "llm_input": build_product_question_prompt(matched_product, text),
            "reply_text": None,
            "matched_product": matched_product,
            "allow_knowledge_enhance": True,
            "response_mode": "product_qa",
        }
    if query_match["status"] == "multiple":
        multiple_reply = build_multiple_matches_reply(text, query_match.get("candidates") or query_match["matches"])
        return {
            "handled": True,
            "llm_input": build_multiple_matches_prompt(text, query_match.get("candidates") or query_match["matches"]),
            "reply_text": multiple_reply,
            "matched_product": None,
            "allow_knowledge_enhance": False,
            "response_mode": "product_multiple",
        }

    return {
        "handled": True,
        "llm_input": build_not_found_prompt(text, intent["keyword"]),
        "reply_text": None,
        "matched_product": None,
        "allow_knowledge_enhance": False,
        "response_mode": "product_not_found",
    }

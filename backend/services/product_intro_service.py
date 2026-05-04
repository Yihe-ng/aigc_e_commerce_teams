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
_CATALOG_QUERY_RE = re.compile(
    r"^(?:(?:我想看|想看|看看|看下|给我看看|给我看下)?(?:我们(?:现在)?|店里|当前)?(?:有|有什么|有哪些)?(?:的)?"
    r"(?:已有商品|现有商品|商品|衣服|款式)(?:列表)?|我们有什么商品|我们有哪些商品|我想看我们现在已有的商品)[。！!？?]*$"
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
    "这个好看吗",
    "有什么推荐吗",
}
_WEAK_QUERY_SIGNAL_TEXTS = ("好看吗", "推荐吗", "推荐")
_CATEGORY_STYLE_TERMS = (
    "斜肩", "短袖", "短t", "t恤", "上衣", "衬衫", "针织", "针织衫", "开衫", "外套",
    "圆领", "方领", "v领", "吊带", "背心", "半裙", "连衣裙", "牛仔裤", "裤子"
)
_SINGLE_TERM_CATEGORY_TERM_NAMES = (
    "斜肩", "短袖", "短t", "t恤", "衬衫", "针织衫", "开衫", "外套",
    "吊带", "背心", "半裙", "连衣裙", "牛仔裤",
)
_SINGLE_TERM_CATEGORY_TERMS = set(_CATEGORY_STYLE_TERMS).intersection(_SINGLE_TERM_CATEGORY_TERM_NAMES)
_CATEGORY_TERM_ALIASES = {
    "上衣": ("上衣", "t恤", "短t", "短袖", "衬衫", "针织衫", "针织", "开衫", "外套"),
    "短袖": ("短袖", "t恤", "短t"),
    "t恤": ("t恤", "短t", "短袖"),
}
_CONTEXT_PRONOUN_TOKENS = (
    "这个",
    "那个",
    "这款",
    "那款",
    "这件",
    "那件",
    "这件衣服",
    "那件衣服",
    "这件上衣",
    "那件上衣",
    "这件t恤",
    "那件t恤",
    "这个t恤",
    "那个t恤",
    "这件短袖",
    "那件短袖",
    "这个短袖",
    "那个短袖",
    "这件衬衫",
    "那件衬衫",
    "这个衬衫",
    "那个衬衫",
    "这件外套",
    "那件外套",
    "这个外套",
    "那个外套",
    "这件开衫",
    "那件开衫",
    "这个开衫",
    "那个开衫",
    "这条",
    "那条",
    "这条裙子",
    "那条裙子",
    "这条裤子",
    "那条裤子",
    "这条牛仔裤",
    "那条牛仔裤",
    "这条半裙",
    "那条半裙",
    "这件裙子",
    "那件裙子",
    "这件连衣裙",
    "那件连衣裙",
    "这条连衣裙",
    "那条连衣裙",
    "这身",
    "那身",
    "它",
)
_FIRST_CHOICE_TERMS = (
    "第一个",
    "第1个",
    "第一款",
    "第一件",
    "第一条",
    "第一套",
    "第1款",
    "第1件",
    "第1条",
    "第1套",
    "1号",
    "1",
)
_SECOND_CHOICE_TERMS = (
    "第二个",
    "第2个",
    "第二款",
    "第二件",
    "第二条",
    "第二套",
    "第2款",
    "第2件",
    "第2条",
    "第2套",
    "2号",
    "2",
)
_SELECTION_INTRO_HINTS = (
    "了解",
    "介绍",
    "介绍下",
    "介绍一下",
    "讲讲",
    "说说",
    "看看",
    "看下",
    "想看",
)
_CATALOG_INTRO_HINTS = ("介绍", "介绍下", "介绍一下", "讲讲", "说说", "看看", "看下", "我想看", "给我看看", "给我看下")
_CATALOG_SCOPE_HINTS = ("我们", "现在", "已有", "现有", "店里", "当前")
_CATALOG_INVENTORY_HINTS = ("现在", "已有", "现有", "店里", "当前")
_CATALOG_TARGET_HINTS = ("商品", "衣服", "款式", "单品")
_CATALOG_ASK_HINTS = ("有什么", "有哪些", "有啥", "有哪", "都有什么")


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


def _build_resolution(
    *,
    handled: bool,
    llm_input: str | None,
    reply_text: str | None,
    matched_product: dict[str, Any] | None,
    allow_knowledge_enhance: bool,
    response_mode: str | None,
    context_source: str | None = None,
    candidate_products: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "handled": handled,
        "llm_input": llm_input,
        "reply_text": reply_text,
        "matched_product": matched_product,
        "allow_knowledge_enhance": allow_knowledge_enhance,
        "response_mode": response_mode,
        "context_source": context_source,
        "candidate_products": candidate_products or [],
    }


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


def _is_catalog_query(text: str) -> bool:
    raw_text = str(text or "").strip()
    if not raw_text:
        return False

    normalized_text = _normalize_text(raw_text)
    if not normalized_text:
        return False

    # Keep the existing regex as a compatibility fallback for older utterances.
    if _CATALOG_QUERY_RE.match(raw_text):
        return True

    has_catalog_target = any(_normalize_text(token) in normalized_text for token in _CATALOG_TARGET_HINTS)
    if not has_catalog_target:
        return False

    has_catalog_scope = any(_normalize_text(token) in normalized_text for token in _CATALOG_SCOPE_HINTS)
    has_catalog_inventory = any(_normalize_text(token) in normalized_text for token in _CATALOG_INVENTORY_HINTS)
    has_catalog_ask = any(_normalize_text(token) in normalized_text for token in _CATALOG_ASK_HINTS)
    has_catalog_intro = any(_normalize_text(token) in normalized_text for token in _CATALOG_INTRO_HINTS)

    # Stable combinations we want to support:
    # 1. "介绍/看看 + 有什么/有哪些 + 商品"
    # 2. "我们/现有/已有 + 商品"
    # 3. "介绍/看看 + 现有/已有 + 商品"
    return (
        (has_catalog_intro and has_catalog_ask)
        or (has_catalog_inventory and has_catalog_target)
        or (has_catalog_intro and has_catalog_scope)
    )


def detect_intro_intent(text: str) -> dict[str, Any]:
    raw_text = str(text or "").strip()
    if not raw_text:
        return {"handled": False, "mode": None, "keyword": ""}

    if _is_catalog_query(raw_text):
        return {"handled": True, "mode": "catalog", "keyword": ""}

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
    if any(normalized_text.startswith(prefix) for prefix in normalized_prefixes) and any(normalized_text.endswith(suffix) for suffix in normalized_suffixes):
        return True
    signal_text = _extract_query_signal_text(raw_text)
    if len(signal_text) < 2:
        return False
    normalized_weak_signals = [_normalize_text(item) for item in _WEAK_QUERY_SIGNAL_TEXTS]
    return signal_text in normalized_weak_signals


def _extract_category_style_terms(text: str) -> list[str]:
    normalized_text = _normalize_text(text)
    matched_terms: list[str] = []
    for term in _CATEGORY_STYLE_TERMS:
        normalized_term = _normalize_text(term)
        if normalized_term and normalized_term in normalized_text and term not in matched_terms:
            matched_terms.append(term)
    return matched_terms


def _product_matches_category_term(product_blob: str, term: str) -> bool:
    aliases = _CATEGORY_TERM_ALIASES.get(term, (term,))
    return any(_normalize_text(alias) in product_blob for alias in aliases)


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


def _match_category_candidates(text: str, products: list[dict[str, Any]]) -> dict[str, Any]:
    if _is_weak_product_query(text):
        return {"status": "not_found", "product": None, "matches": []}

    matched_terms = _extract_category_style_terms(text)
    allow_single_term = len(matched_terms) == 1 and matched_terms[0] in _SINGLE_TERM_CATEGORY_TERMS
    if len(matched_terms) < 2 and not allow_single_term:
        return {"status": "not_found", "product": None, "matches": []}

    candidates: list[dict[str, Any]] = []
    for product in products:
        product_blob = _normalize_text(
            " ".join(
                [
                    str(product.get("name") or ""),
                    str(product.get("category") or ""),
                    str(product.get("description") or ""),
                    " ".join(_coerce_features(product.get("features"))),
                ]
            )
        )
        term_hits = []
        for term in matched_terms:
            if _product_matches_category_term(product_blob, term):
                term_hits.append(term)

        if len(term_hits) >= 2 or (allow_single_term and len(term_hits) >= 1):
            candidate = _score_product_candidate(text, product)
            candidate["category_term_hits"] = len(term_hits)
            candidate["matched_terms"] = term_hits
            if float(candidate.get("score", 0.0)) < 70:
                candidate["score"] = 70 + len(term_hits)
            candidates.append(candidate)

    if not candidates:
        return {"status": "not_found", "product": None, "matches": []}

    candidates.sort(
        key=lambda item: (
            -int(item.get("category_term_hits", 0)),
            -float(item.get("score", 0.0)),
            item["product"].get("name") or "",
        )
    )
    if len(candidates) >= 2:
        return {"status": "multiple", "product": None, "matches": [item["product"] for item in candidates], "candidates": candidates}
    return {"status": "matched", "product": candidates[0]["product"], "matches": [item["product"] for item in candidates], "candidates": candidates}


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

    category_match = _match_category_candidates(trimmed_keyword, products)
    if category_match["status"] != "not_found":
        return category_match

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

    category_match = _match_category_candidates(text, products)
    if category_match["status"] == "multiple":
        return category_match

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
        elif isinstance(value, dict) and value:
            if key == "size_chart":
                parts = []
                for size_code, dims in value.items():
                    if isinstance(dims, dict):
                        size_parts = [f"{size_code}码"]
                        for dim_key, dim_val in dims.items():
                            if dim_val:
                                size_parts.append(f"{dim_key}{dim_val}")
                        parts.append("(" + ",".join(size_parts) + ")")
                if parts:
                    lines.append("尺码表：" + " | ".join(parts))
            else:
                lines.append(f"{key}：{str(value)}")
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


def build_catalog_reply(products: list[dict[str, Any]]) -> str:
    if not products:
        return "当前商品库里还没有可介绍的商品，你可以先补充商品信息，我再继续帮你介绍。"

    top_products = products[:3]
    product_names = [str(product.get("name") or "").strip() for product in top_products if str(product.get("name") or "").strip()]
    if not product_names:
        return "当前已经有商品上架了，你可以告诉我想看的款式方向，我继续帮你推荐。"

    return (
        f"我们现在已有的商品里，先可以看这几款：{'、'.join(product_names)}。"
        "你想先了解哪一款？我可以继续帮你介绍亮点、面料、场景或洗护建议。"
    )


def _extract_candidate_products(matches: list[dict[str, Any]] | list[dict]) -> list[dict[str, Any]]:
    return [item["product"] for item in _limit_candidate_candidates(matches)]


def _has_direct_product_name_in_text(text: str, products: list[dict[str, Any]]) -> bool:
    normalized_text = _normalize_text(text)
    if not normalized_text:
        return False
    for product in products:
        normalized_name = _normalize_text(product.get("name"))
        if normalized_name and normalized_name in normalized_text:
            return True
    return False


def _is_context_pronoun_query(text: str, products: list[dict[str, Any]]) -> bool:
    raw_text = str(text or "").strip()
    if not raw_text:
        return False
    if _has_direct_product_name_in_text(raw_text, products):
        return False
    normalized_text = _normalize_text(raw_text)
    return any(_normalize_text(token) in normalized_text for token in _CONTEXT_PRONOUN_TOKENS)


def _resolve_candidate_selection_index(text: str) -> int | None:
    normalized_text = _normalize_text(text)
    if not normalized_text:
        return None
    for token in _FIRST_CHOICE_TERMS:
        if _normalize_text(token) in normalized_text:
            return 0
    for token in _SECOND_CHOICE_TERMS:
        if _normalize_text(token) in normalized_text:
            return 1
    return None


def _strip_selection_tokens(text: str) -> str:
    cleaned_text = str(text or "").strip()
    for token in _FIRST_CHOICE_TERMS + _SECOND_CHOICE_TERMS:
        cleaned_text = re.sub(re.escape(token), "", cleaned_text, flags=re.IGNORECASE)
    cleaned_text = re.sub(r"^[，,。.!！？、\s]+", "", cleaned_text)
    return cleaned_text.strip()


def _is_selection_intro_request(text: str) -> bool:
    normalized_text = _normalize_text(text)
    if not normalized_text:
        return True
    return normalized_text in {_normalize_text(item) for item in _SELECTION_INTRO_HINTS}


def resolve_contextual_product_reference(
    text: str,
    conversation_context: dict[str, Any] | None,
    products: list[dict[str, Any]],
) -> dict[str, Any]:
    if not conversation_context:
        return {"status": "not_found", "product": None, "resolved_question": str(text or "").strip(), "source": None}

    recent_candidates = conversation_context.get("last_candidates") or []
    selection_index = _resolve_candidate_selection_index(text)
    if selection_index is not None and selection_index < len(recent_candidates):
        resolved_question = _strip_selection_tokens(text)
        return {
            "status": "matched",
            "product": recent_candidates[selection_index],
            "resolved_question": resolved_question,
            "source": "context_candidate_selection",
        }

    recent_product = conversation_context.get("last_matched_product")
    if recent_product and _is_context_pronoun_query(text, products):
        return {
            "status": "matched",
            "product": recent_product,
            "resolved_question": str(text or "").strip(),
            "source": "context_pronoun",
        }

    return {"status": "not_found", "product": None, "resolved_question": str(text or "").strip(), "source": None}


def resolve_product_intro(
    text: str,
    products: list[dict[str, Any]] | None = None,
    bucket=None,
    conversation_context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    intent = detect_intro_intent(text)
    available_products = products if products is not None else load_products_for_intro(bucket=bucket)

    if not intent["handled"]:
        query_match = match_product_from_query(text, available_products)
        if query_match["status"] == "matched":
            matched_product = query_match["product"]
            return _build_resolution(
                handled=True,
                llm_input=build_product_question_prompt(matched_product, text),
                reply_text=None,
                matched_product=matched_product,
                allow_knowledge_enhance=True,
                response_mode="product_qa",
            )
        if query_match["status"] == "multiple":
            query_candidates = query_match.get("candidates") or query_match["matches"]
            multiple_reply = build_multiple_matches_reply(text, query_candidates)
            return _build_resolution(
                handled=True,
                llm_input=build_multiple_matches_prompt(text, query_candidates),
                reply_text=multiple_reply,
                matched_product=None,
                allow_knowledge_enhance=False,
                response_mode="product_multiple",
                candidate_products=_extract_candidate_products(query_candidates),
            )

        contextual_resolution = resolve_contextual_product_reference(text, conversation_context, available_products)
        if contextual_resolution["status"] == "matched":
            matched_product = contextual_resolution["product"]
            resolved_question = str(contextual_resolution.get("resolved_question") or "").strip()
            context_source = contextual_resolution.get("source")
            if context_source == "context_candidate_selection" and _is_selection_intro_request(resolved_question):
                return _build_resolution(
                    handled=True,
                    llm_input=build_intro_prompt(matched_product),
                    reply_text=None,
                    matched_product=matched_product,
                    allow_knowledge_enhance=False,
                    response_mode="product_intro",
                    context_source=context_source,
                )
            return _build_resolution(
                handled=True,
                llm_input=build_product_question_prompt(matched_product, resolved_question or text),
                reply_text=None,
                matched_product=matched_product,
                allow_knowledge_enhance=True,
                response_mode="product_qa",
                context_source=context_source,
            )

        direct_keyword = _extract_direct_product_keyword(text)
        if not direct_keyword:
            return _build_resolution(
                handled=False,
                llm_input=None,
                reply_text=None,
                matched_product=None,
                allow_knowledge_enhance=False,
                response_mode=None,
            )
        intent = {"handled": True, "mode": "named", "keyword": direct_keyword}

    if not available_products:
        return _build_resolution(
            handled=True,
            llm_input=build_no_products_prompt(text),
            reply_text=None,
            matched_product=None,
            allow_knowledge_enhance=False,
            response_mode="product_empty",
        )

    if intent["mode"] == "catalog":
        return _build_resolution(
            handled=True,
            llm_input=None,
            reply_text=build_catalog_reply(available_products),
            matched_product=None,
            allow_knowledge_enhance=False,
            response_mode="product_catalog",
        )

    if intent["mode"] == "generic":
        matched_product = pick_default_product(available_products)
        if matched_product is None:
            return _build_resolution(
                handled=True,
                llm_input=build_no_products_prompt(text),
                reply_text=None,
                matched_product=None,
                allow_knowledge_enhance=False,
                response_mode="product_empty",
            )
        return _build_resolution(
            handled=True,
            llm_input=build_intro_prompt(matched_product),
            reply_text=None,
            matched_product=matched_product,
            allow_knowledge_enhance=False,
            response_mode="product_intro",
        )

    match_result = match_product(intent["keyword"], available_products)
    if match_result["status"] == "matched":
        matched_product = match_result["product"]
        return _build_resolution(
            handled=True,
            llm_input=build_intro_prompt(matched_product),
            reply_text=None,
            matched_product=matched_product,
            allow_knowledge_enhance=False,
            response_mode="product_intro",
        )

    if match_result["status"] == "multiple":
        match_candidates = match_result.get("candidates") or match_result["matches"]
        multiple_reply = build_multiple_matches_reply(text, match_candidates)
        return _build_resolution(
            handled=True,
            llm_input=build_multiple_matches_prompt(text, match_candidates),
            reply_text=multiple_reply,
            matched_product=None,
            allow_knowledge_enhance=False,
            response_mode="product_multiple",
            candidate_products=_extract_candidate_products(match_candidates),
        )

    query_match = match_product_from_query(text, available_products)
    if query_match["status"] == "matched":
        matched_product = query_match["product"]
        return _build_resolution(
            handled=True,
            llm_input=build_product_question_prompt(matched_product, text),
            reply_text=None,
            matched_product=matched_product,
            allow_knowledge_enhance=True,
            response_mode="product_qa",
        )
    if query_match["status"] == "multiple":
        query_candidates = query_match.get("candidates") or query_match["matches"]
        multiple_reply = build_multiple_matches_reply(text, query_candidates)
        return _build_resolution(
            handled=True,
            llm_input=build_multiple_matches_prompt(text, query_candidates),
            reply_text=multiple_reply,
            matched_product=None,
            allow_knowledge_enhance=False,
            response_mode="product_multiple",
            candidate_products=_extract_candidate_products(query_candidates),
        )

    return _build_resolution(
        handled=True,
        llm_input=build_not_found_prompt(text, intent["keyword"]),
        reply_text=None,
        matched_product=None,
        allow_knowledge_enhance=False,
        response_mode="product_not_found",
    )

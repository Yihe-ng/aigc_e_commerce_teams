import re
from typing import Any

import oss2

from backend.services.storage import get_bucket, read_json_object


_GENERIC_INTRO_RE = re.compile(
    "^(?:\u4ecb\u7ecd\u4e00\u4e0b|\u4ecb\u7ecd\u4e0b|\u4ecb\u7ecd|\u8bb2\u8bb2|\u8bf4\u8bf4|\u770b\u770b)(?:\u5df2\u6709\u7684|\u73b0\u6709\u7684)?\u5546\u54c1[\u3002\uff01!\uff1f?]*$"
)
_FIRST_PRODUCT_RE = re.compile(
    "^(?:\u4ecb\u7ecd\u4e00\u4e0b|\u4ecb\u7ecd\u4e0b|\u4ecb\u7ecd|\u8bb2\u8bb2|\u8bf4\u8bf4|\u770b\u770b)(?:\u7b2c1\u4e2a|\u7b2c\u4e00\u4e2a)\u5546\u54c1[\u3002\uff01!\uff1f?]*$"
)
_INTRO_PREFIX_RE = re.compile(
    "^(?:\u4ecb\u7ecd\u4e00\u4e0b|\u4ecb\u7ecd\u4e0b|\u4ecb\u7ecd|\u8bb2\u8bb2|\u8bf4\u8bf4|\u770b\u770b)"
)
_NORMALIZE_RE = re.compile(
    "[\s\-_.,\uff0c\u3002\uff01\uff1f\u3001\u201c\u201d\"'\uff08\uff09()\u3010\u3011\[\]:\uff1a;\uff1b]+"
)
_KEYWORD_TOKEN_RE = re.compile("[a-z0-9]+(?:[\u4e00-\u9fff]{1,3})?|[\u4e00-\u9fff]+")
_TEXT_VARIANT_MAP = str.maketrans({
    "\u6856": "\u6064",
    "\uff34": "T",
    "\uff54": "t",
})


def _normalize_text(value: str | None) -> str:
    text = str(value or "").strip().translate(_TEXT_VARIANT_MAP).lower()
    return _NORMALIZE_RE.sub("", text)


def _strip_intro_suffix(text: str) -> str:
    stripped = str(text or "").strip()
    stripped = re.sub("[\u3002\uff01!\uff1f?]+$", "", stripped)
    if stripped.endswith("\u5546\u54c1"):
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
    if not remainder or remainder in {"\u5df2\u6709\u7684", "\u73b0\u6709\u7684"}:
        return ""
    return remainder


def _extract_direct_product_keyword(text: str) -> str:
    raw_text = str(text or "").strip()
    if not raw_text:
        return ""

    stripped = _strip_intro_suffix(raw_text)
    if stripped != raw_text and stripped and stripped not in {"\u5df2\u6709\u7684", "\u73b0\u6709\u7684"}:
        return stripped
    return ""


def _split_keywords(value: str | None) -> list[str]:
    text = str(value or "").strip()
    if not text:
        return []
    coarse_parts = re.split("[\s,\uff0c\u3001/]+", text)
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
        return [item.strip() for item in re.split("[\uff0c,\u3001/]", value) if item.strip()]
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


def match_product(keyword: str, products: list[dict[str, Any]]) -> dict[str, Any]:
    trimmed_keyword = str(keyword or "").strip()
    if not trimmed_keyword:
        return {"status": "not_found", "product": None, "matches": []}

    exact_matches = [
        product for product in products if str(product.get("name") or "").strip() == trimmed_keyword
    ]
    if len(exact_matches) == 1:
        return {"status": "matched", "product": exact_matches[0], "matches": exact_matches}
    if len(exact_matches) > 1:
        return {"status": "multiple", "product": None, "matches": exact_matches}

    normalized_keyword = _normalize_text(trimmed_keyword)
    normalized_exact_matches = [
        product for product in products if _normalize_text(product.get("name")) == normalized_keyword
    ]
    if len(normalized_exact_matches) == 1:
        return {
            "status": "matched",
            "product": normalized_exact_matches[0],
            "matches": normalized_exact_matches,
        }
    if len(normalized_exact_matches) > 1:
        return {"status": "multiple", "product": None, "matches": normalized_exact_matches}

    contains_matches = [
        product
        for product in products
        if normalized_keyword and normalized_keyword in _normalize_text(product.get("name"))
    ]
    if len(contains_matches) == 1:
        return {"status": "matched", "product": contains_matches[0], "matches": contains_matches}
    if len(contains_matches) > 1:
        return {"status": "multiple", "product": None, "matches": contains_matches}

    keyword_tokens = _split_keywords(trimmed_keyword)
    if keyword_tokens:
        token_matches = []
        for product in products:
            normalized_name = _normalize_text(product.get("name"))
            if all(token in normalized_name for token in keyword_tokens):
                token_matches.append(product)

        if len(token_matches) == 1:
            return {"status": "matched", "product": token_matches[0], "matches": token_matches}
        if len(token_matches) > 1:
            return {"status": "multiple", "product": None, "matches": token_matches}

    return {"status": "not_found", "product": None, "matches": []}


def _load_rag_context(product: dict[str, Any]) -> list[str]:
    # Reserved for future retrieval augmentation.
    return []


def build_intro_prompt(product: dict[str, Any]) -> str:
    product_name = str(product.get("name") or "").strip()
    product_price = str(product.get("price") or "").strip()
    product_description = str(product.get("description") or "").strip()
    product_features = _coerce_features(product.get("features"))
    product_category = str(product.get("category") or "").strip()
    rag_context = _load_rag_context(product)
    feature_text = "\u3001".join(product_features[:4])
    rag_text = "\uff1b".join(rag_context)

    lines = [
        "\u4f60\u662f\u4e00\u540d\u76f4\u64ad\u95f4\u4e3b\u64ad\uff0c\u8bf7\u7528\u81ea\u7136\u3001\u7b80\u6d01\u3001\u53e3\u8bed\u5316\u7684\u4e2d\u6587\u4ecb\u7ecd\u5546\u54c1\u3002",
        f"\u5546\u54c1\u540d\u79f0\uff1a{product_name}",
    ]

    if product_category:
        lines.append(f"\u5546\u54c1\u5206\u7c7b\uff1a{product_category}")
    if product_price:
        lines.append(f"\u5546\u54c1\u4ef7\u683c\uff1a{product_price}")
    if product_description:
        lines.append(f"\u5546\u54c1\u63cf\u8ff0\uff1a{product_description}")
    if product_features:
        lines.append(f"\u5546\u54c1\u5356\u70b9\uff1a{feature_text}")
    if rag_context:
        lines.append(f"\u8865\u5145\u4fe1\u606f\uff1a{rag_text}")

    lines.extend(
        [
            "\u8bf7\u76f4\u63a5\u8f93\u51fa\u4e00\u5c0f\u6bb5\u9002\u5408\u76f4\u64ad\u53e3\u64ad\u7684\u4e2d\u6587\u4ecb\u7ecd\u3002",
            "\u4e0d\u8981\u89e3\u91ca\u89c4\u5219\uff0c\u4e0d\u8981\u8f93\u51fa\u63d0\u793a\u8bcd\uff0c\u4e0d\u8981\u8f93\u51fa\u82f1\u6587\u3002",
            "\u5982\u679c\u4fe1\u606f\u4e0d\u8db3\uff0c\u53ea\u57fa\u4e8e\u7ed9\u5b9a\u5546\u54c1\u4e8b\u5b9e\u4ecb\u7ecd\uff0c\u4e0d\u8981\u7f16\u9020\u4e0d\u5b58\u5728\u7684\u53c2\u6570\u3002",
        ]
    )
    return "\n".join(lines)


def build_not_found_prompt(original_text: str, keyword: str) -> str:
    return "\n".join(
        [
            f"\u7528\u6237\u539f\u8bdd\uff1a{str(original_text or '').strip()}",
            (
                f"\u8bf7\u7528\u81ea\u7136\u3001\u7b80\u6d01\u3001\u53cb\u597d\u7684\u4e2d\u6587\u56de\u590d\uff1a"
                f"\u5f53\u524d\u6ca1\u6709\u627e\u5230\u540d\u79f0\u5305\u542b\u201c{str(keyword or '').strip()}\u201d\u7684\u5546\u54c1\uff0c"
                "\u5e76\u5f15\u5bfc\u7528\u6237\u63d0\u4f9b\u66f4\u5177\u4f53\u3001\u66f4\u5b8c\u6574\u7684\u5546\u54c1\u540d\u79f0\u3002"
            ),
            "\u53ea\u8f93\u51fa\u9762\u5411\u7528\u6237\u7684\u4e2d\u6587\u56de\u590d\uff0c\u4e0d\u8981\u89e3\u91ca\u89c4\u5219\uff0c\u4e0d\u8981\u8f93\u51fa\u82f1\u6587\u3002",
        ]
    )


def build_multiple_matches_prompt(original_text: str, matches: list[dict[str, Any]]) -> str:
    candidate_names = [str(item.get("name") or "").strip() for item in matches if str(item.get("name") or "").strip()]
    candidate_text = "\u3001".join(candidate_names[:5]) if candidate_names else "\u591a\u4e2a\u5546\u54c1"
    return "\n".join(
        [
            f"\u7528\u6237\u539f\u8bdd\uff1a{str(original_text or '').strip()}",
            (
                "\u8bf7\u7528\u81ea\u7136\u3001\u7b80\u6d01\u3001\u53cb\u597d\u7684\u4e2d\u6587\u56de\u590d\uff1a"
                "\u5f53\u524d\u5339\u914d\u5230\u591a\u4e2a\u5546\u54c1\uff0c\u8bf7\u7528\u6237\u8bf4\u5f97\u66f4\u5177\u4f53\u4e00\u4e9b\u3002"
            ),
            f"\u5019\u9009\u5546\u54c1\uff1a{candidate_text}",
            "\u53ea\u8f93\u51fa\u9762\u5411\u7528\u6237\u7684\u4e2d\u6587\u56de\u590d\uff0c\u4e0d\u8981\u5217\u51fa\u5185\u90e8\u63d0\u793a\u8bcd\uff0c\u4e0d\u8981\u8f93\u51fa\u82f1\u6587\u3002",
        ]
    )


def build_no_products_prompt(original_text: str) -> str:
    return "\n".join(
        [
            f"\u7528\u6237\u539f\u8bdd\uff1a{str(original_text or '').strip()}",
            (
                "\u8bf7\u7528\u81ea\u7136\u3001\u7b80\u6d01\u3001\u53cb\u597d\u7684\u4e2d\u6587\u56de\u590d\uff1a"
                "\u5f53\u524d\u5546\u54c1\u5e93\u91cc\u8fd8\u6ca1\u6709\u53ef\u4ecb\u7ecd\u7684\u5546\u54c1\uff0c"
                "\u8bf7\u7528\u6237\u5148\u8865\u5145\u5546\u54c1\u57fa\u7840\u4fe1\u606f\u3002"
            ),
            "\u53ea\u8f93\u51fa\u9762\u5411\u7528\u6237\u7684\u4e2d\u6587\u56de\u590d\uff0c\u4e0d\u8981\u8f93\u51fa\u82f1\u6587\u3002",
        ]
    )


def resolve_product_intro(
    text: str, products: list[dict[str, Any]] | None = None, bucket=None
) -> dict[str, Any]:
    intent = detect_intro_intent(text)
    available_products = products if products is not None else load_products_for_intro(bucket=bucket)

    if not intent["handled"]:
        direct_keyword = _extract_direct_product_keyword(text)
        if not direct_keyword:
            return {"handled": False, "llm_input": None, "reply_text": None, "matched_product": None}
        intent = {"handled": True, "mode": "named", "keyword": direct_keyword}

    if not available_products:
        return {
            "handled": True,
            "llm_input": build_no_products_prompt(text),
            "reply_text": None,
            "matched_product": None,
        }

    if intent["mode"] == "generic":
        matched_product = pick_default_product(available_products)
        if matched_product is None:
            return {
                "handled": True,
                "llm_input": build_no_products_prompt(text),
                "reply_text": None,
                "matched_product": None,
            }
        return {
            "handled": True,
            "llm_input": build_intro_prompt(matched_product),
            "reply_text": None,
            "matched_product": matched_product,
        }

    match_result = match_product(intent["keyword"], available_products)
    if match_result["status"] == "matched":
        matched_product = match_result["product"]
        return {
            "handled": True,
            "llm_input": build_intro_prompt(matched_product),
            "reply_text": None,
            "matched_product": matched_product,
        }

    if match_result["status"] == "multiple":
        return {
            "handled": True,
            "llm_input": build_multiple_matches_prompt(text, match_result["matches"]),
            "reply_text": None,
            "matched_product": None,
        }

    return {
        "handled": True,
        "llm_input": build_not_found_prompt(text, intent["keyword"]),
        "reply_text": None,
        "matched_product": None,
    }

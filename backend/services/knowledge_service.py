import json
import os
import re
import threading
import time
from pathlib import Path

import requests

from utils import config_util as cfg
from utils.trace_utils import summarize_text, trace_log


_CONFIG_PATH = Path("config/knowledge_keywords.json")
_CONFIG_CACHE: dict | None = None
_CONFIG_LOCK = threading.RLock()

_DATASET_CACHE_LOCK = threading.RLock()
_DATASET_CACHE: dict = {
    "items": [],
    "domain_map": {},
    "fetched_at": 0.0,
    "expires_at": 0.0,
    "last_reason": "not_loaded",
}

_DEFAULT_DIFY_BASE_URL = "https://api.dify.ai/v1"
_DEFAULT_CACHE_TTL_SECONDS = 300
_DEFAULT_LIST_LIMIT = 100
_DEFAULT_RERANKING_MODEL_NAME = "BAAI/bge-reranker-v2-m3"
_NORMALIZE_RE = re.compile(r"[\s\-_.,:;!?，。！？、\"'“”‘’（）()\[\]【】/]+")


def _load_config() -> dict:
    global _CONFIG_CACHE
    with _CONFIG_LOCK:
        if _CONFIG_CACHE is not None:
            return _CONFIG_CACHE

        if not _CONFIG_PATH.exists():
            _CONFIG_CACHE = {}
            return _CONFIG_CACHE

        try:
            with _CONFIG_PATH.open("r", encoding="utf-8") as file:
                _CONFIG_CACHE = json.load(file)
        except (OSError, json.JSONDecodeError):
            _CONFIG_CACHE = {}
        return _CONFIG_CACHE


def _normalize_text(text: str | None) -> str:
    value = str(text or "").strip().lower()
    return _NORMALIZE_RE.sub("", value)


def _get_api_key() -> str:
    return os.getenv("DIFY_DATASET_API_KEY", "").strip()


def _get_base_url() -> str:
    configured = os.getenv("DIFY_API_BASE_URL", "").strip()
    return (configured or _DEFAULT_DIFY_BASE_URL).rstrip("/")


def _get_headers() -> dict:
    return {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }


def _get_timeout_seconds() -> float:
    timeout_ms = getattr(cfg, "knowledge_timeout_ms", 15000)
    return max(float(timeout_ms) / 1000.0, 0.5)


def _get_cache_ttl_seconds() -> int:
    raw = os.getenv("DIFY_DATASET_CACHE_TTL_SECONDS", "").strip()
    try:
        return max(int(raw), 30) if raw else _DEFAULT_CACHE_TTL_SECONDS
    except ValueError:
        return _DEFAULT_CACHE_TTL_SECONDS


def should_enhance(text: str | None) -> bool:
    return detect_domain(text) is not None


def detect_domain(text: str | None) -> str | None:
    normalized_text = _normalize_text(text)
    if not normalized_text:
        return None

    for domain, options in _load_config().items():
        for keyword in options.get("keywords", []):
            normalized_keyword = _normalize_text(keyword)
            if normalized_keyword and normalized_keyword in normalized_text:
                return domain
    return None


def _get_domain_aliases(domain: str, options: dict) -> list[str]:
    aliases = [domain]
    aliases.extend(options.get("aliases", []))
    aliases.extend(options.get("dataset_aliases", []))
    aliases.extend(options.get("keywords", []))

    result: list[str] = []
    seen: set[str] = set()
    for alias in aliases:
        normalized = _normalize_text(alias)
        if normalized and normalized not in seen:
            seen.add(normalized)
            result.append(normalized)
    return result


def _request_json(method: str, path: str, *, params: dict | None = None, payload: dict | None = None) -> dict:
    try:
        response = requests.request(
            method=method,
            url=f"{_get_base_url()}{path}",
            headers=_get_headers(),
            params=params,
            json=payload,
            timeout=_get_timeout_seconds(),
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        trace_log(
            module="knowledge_service",
            stage="api_request",
            status="error",
            request_id="-",
            path=path,
            error=summarize_text(exc),
        )
        raise


def _match_domain_to_dataset(domain: str, datasets: list[dict]) -> tuple[dict | None, str]:
    config = _load_config()
    options = config.get(domain) or {}
    aliases = _get_domain_aliases(domain, options)
    if not aliases:
        return None, "domain_aliases_empty"

    best_dataset = None
    best_score = -1
    for dataset in datasets:
        dataset_name = str(dataset.get("name") or "")
        dataset_description = str(dataset.get("description") or "")
        haystack = _normalize_text(f"{dataset_name} {dataset_description}")
        if not haystack:
            continue

        score = -1
        for alias in aliases:
            if not alias:
                continue
            if haystack == alias:
                score = max(score, 100)
            elif haystack.startswith(alias):
                score = max(score, 90)
            elif alias in haystack:
                score = max(score, 80)

        if score > best_score:
            best_score = score
            best_dataset = dataset

    if best_dataset is None or best_score < 0:
        return None, "dataset_name_not_matched"

    if not bool(best_dataset.get("enable_api", True)):
        return None, "dataset_api_disabled"

    return best_dataset, "dataset_matched"


def _discover_domain_map(datasets: list[dict]) -> tuple[dict, dict]:
    mapping: dict[str, dict] = {}
    reasons: dict[str, str] = {}
    for domain in sorted(_load_config().keys()):
        matched, reason = _match_domain_to_dataset(domain, datasets)
        reasons[domain] = reason
        if matched is not None:
            mapping[domain] = matched
    if "care" not in mapping and "fabric" in mapping:
        mapping["care"] = mapping["fabric"]
        reasons["care"] = "fallback_to_fabric_dataset"
    return mapping, reasons


def _build_retrieve_payload(query: str) -> dict:
    return {
        "query": query,
        "retrieval_model": {
            "search_method": "hybrid_search",
            "reranking_enable": True,
            "reranking_mode": "reranking_model",
            "top_k": 6,
            "score_threshold_enabled": False,
        },
    }


def _augment_retrieve_payload(payload: dict, response_text: str) -> tuple[dict, bool]:
    updated = json.loads(json.dumps(payload))
    retrieval_model = updated.setdefault("retrieval_model", {})
    changed = False
    response_text = str(response_text or "")

    if "retrieval_model.reranking_model" in response_text:
        reranking_model = retrieval_model.get("reranking_model")
        if not isinstance(reranking_model, dict):
            retrieval_model["reranking_model"] = {
                "reranking_provider_name": os.getenv("DIFY_RERANKING_PROVIDER_NAME", "").strip(),
                "reranking_model_name": os.getenv("DIFY_RERANKING_MODEL_NAME", "").strip() or _DEFAULT_RERANKING_MODEL_NAME,
            }
            changed = True

    if "retrieval_model.reranking_provider_name" in response_text and not retrieval_model.get("reranking_provider_name"):
        retrieval_model["reranking_provider_name"] = os.getenv("DIFY_RERANKING_PROVIDER_NAME", "").strip()
        changed = True

    if "retrieval_model.reranking_model_name" in response_text and not retrieval_model.get("reranking_model_name"):
        retrieval_model["reranking_model_name"] = os.getenv("DIFY_RERANKING_MODEL_NAME", "").strip() or _DEFAULT_RERANKING_MODEL_NAME
        changed = True

    return updated, changed


def _fetch_dataset_list(force_refresh: bool = False) -> dict:
    api_key = _get_api_key()
    if not api_key:
        return {
            "ok": False,
            "reason": "missing_api_key",
            "items": [],
            "domain_map": {},
            "match_reasons": {},
        }

    now = time.time()
    with _DATASET_CACHE_LOCK:
        if (
            not force_refresh
            and _DATASET_CACHE["items"]
            and now < float(_DATASET_CACHE.get("expires_at", 0.0))
        ):
            return {
                "ok": True,
                "reason": "cache_hit",
                "items": list(_DATASET_CACHE["items"]),
                "domain_map": dict(_DATASET_CACHE["domain_map"]),
                "match_reasons": dict(_DATASET_CACHE.get("match_reasons", {})),
            }

    datasets: list[dict] = []
    page = 1
    limit = _DEFAULT_LIST_LIMIT
    try:
        while True:
            payload = _request_json("GET", "/datasets", params={"page": page, "limit": limit})
            page_items = payload.get("data") or []
            if not isinstance(page_items, list):
                page_items = []
            datasets.extend(page_items)
            has_more = bool(payload.get("has_more"))
            if not has_more or not page_items:
                break
            page += 1
    except (requests.RequestException, ValueError) as exc:
        trace_log(
            module="knowledge_service",
            stage="dataset_list",
            status="error",
            request_id="-",
            reason="list_request_failed",
            error=summarize_text(exc),
        )
        return {
            "ok": False,
            "reason": "list_request_failed",
            "items": [],
            "domain_map": {},
            "match_reasons": {},
        }

    domain_map, match_reasons = _discover_domain_map(datasets)
    trace_log(
        module="knowledge_service",
        stage="dataset_list",
        status="ok",
        request_id="-",
        reason="list_loaded",
        dataset_count=len(datasets),
        matched_domains=",".join(sorted(domain_map.keys())),
    )

    with _DATASET_CACHE_LOCK:
        _DATASET_CACHE["items"] = list(datasets)
        _DATASET_CACHE["domain_map"] = dict(domain_map)
        _DATASET_CACHE["match_reasons"] = dict(match_reasons)
        _DATASET_CACHE["fetched_at"] = now
        _DATASET_CACHE["expires_at"] = now + _get_cache_ttl_seconds()
        _DATASET_CACHE["last_reason"] = "list_loaded"

    return {
        "ok": True,
        "reason": "list_loaded",
        "items": datasets,
        "domain_map": domain_map,
        "match_reasons": match_reasons,
    }


def _get_dataset_for_domain(domain: str) -> tuple[dict | None, str]:
    discovery = _fetch_dataset_list()
    if not discovery.get("ok"):
        return None, discovery.get("reason") or "dataset_list_unavailable"

    dataset = (discovery.get("domain_map") or {}).get(domain)
    if dataset is not None:
        trace_log(
            module="knowledge_service",
            stage="dataset_match",
            status="ok",
            request_id="-",
            domain=domain,
            reason="dataset_matched",
            dataset_name=str(dataset.get("name") or ""),
        )
        return dataset, "dataset_matched"

    reason = (discovery.get("match_reasons") or {}).get(domain) or "dataset_not_found"
    trace_log(
        module="knowledge_service",
        stage="dataset_match",
        status="skip",
        request_id="-",
        domain=domain,
        reason=reason,
    )
    return None, reason


def _extract_context(data: dict) -> tuple[str | None, int]:
    records = data.get("records") or []
    if not records and isinstance(data.get("data"), dict):
        records = (data.get("data") or {}).get("records") or []
    if not isinstance(records, list):
        return None, 0

    contents: list[str] = []
    for record in records[:3]:
        segment = record.get("segment") or {}
        content = str(segment.get("content") or "").strip()
        if not content:
            content = str(record.get("content") or "").strip()
        if content:
            contents.append(content)

    if not contents:
        return None, len(records)
    return "\n\n".join(contents), len(records)


def retrieve_context_details(text: str | None, domain: str | None = None) -> dict:
    cfg.load_config()
    if not getattr(cfg, "knowledge_enabled", False):
        return {
            "enabled": False,
            "domain": domain,
            "reason": "knowledge_disabled",
            "context": None,
            "records": 0,
            "dataset_name": "",
        }

    query = str(text or "").strip()
    if not query:
        return {
            "enabled": True,
            "domain": domain,
            "reason": "empty_query",
            "context": None,
            "records": 0,
            "dataset_name": "",
        }

    active_domain = domain or detect_domain(query)
    if not active_domain:
        return {
            "enabled": True,
            "domain": None,
            "reason": "domain_not_matched",
            "context": None,
            "records": 0,
            "dataset_name": "",
        }

    if not _get_api_key():
        trace_log(
            module="knowledge_service",
            stage="retrieve_context",
            status="skip",
            request_id="-",
            domain=active_domain,
            reason="missing_api_key",
            query_preview=summarize_text(query),
        )
        return {
            "enabled": True,
            "domain": active_domain,
            "reason": "missing_api_key",
            "context": None,
            "records": 0,
            "dataset_name": "",
        }

    dataset, dataset_reason = _get_dataset_for_domain(active_domain)
    if dataset is None:
        trace_log(
            module="knowledge_service",
            stage="retrieve_context",
            status="skip",
            request_id="-",
            domain=active_domain,
            reason=dataset_reason,
            query_preview=summarize_text(query),
        )
        return {
            "enabled": True,
            "domain": active_domain,
            "reason": dataset_reason,
            "context": None,
            "records": 0,
            "dataset_name": "",
        }

    dataset_id = str(dataset.get("id") or "").strip()
    dataset_name = str(dataset.get("name") or "").strip()
    if not dataset_id:
        trace_log(
            module="knowledge_service",
            stage="retrieve_context",
            status="skip",
            request_id="-",
            domain=active_domain,
            reason="dataset_id_missing_in_list",
            dataset_name=dataset_name,
            query_preview=summarize_text(query),
        )
        return {
            "enabled": True,
            "domain": active_domain,
            "reason": "dataset_id_missing_in_list",
            "context": None,
            "records": 0,
            "dataset_name": dataset_name,
        }

    payload = _build_retrieve_payload(query)
    url = f"{_get_base_url()}/datasets/{dataset_id}/retrieve"
    headers = {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
    }
    timeout = _get_timeout_seconds()

    response = None
    data = None
    for _ in range(3):
        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=timeout,
            )
            response.raise_for_status()
            data = response.json()
            break
        except requests.RequestException as exc:
            response_text = getattr(response, "text", "")
            payload, changed = _augment_retrieve_payload(payload, response_text)
            if changed and getattr(response, "status_code", 0) == 400:
                continue
            trace_log(
                module="knowledge_service",
                stage="retrieve_context",
                status="error",
                request_id="-",
                domain=active_domain,
                reason="retrieve_request_failed",
                dataset_name=dataset_name,
                error=summarize_text(exc),
                http_status=getattr(response, "status_code", ""),
                response_text=summarize_text(response_text, limit=200),
                query_preview=summarize_text(query),
            )
            return {
                "enabled": True,
                "domain": active_domain,
                "reason": "retrieve_request_failed",
                "context": None,
                "records": 0,
                "dataset_name": dataset_name,
            }
        except ValueError as exc:
            trace_log(
                module="knowledge_service",
                stage="retrieve_context",
                status="error",
                request_id="-",
                domain=active_domain,
                reason="retrieve_request_failed",
                dataset_name=dataset_name,
                error=summarize_text(exc),
                http_status=getattr(response, "status_code", ""),
                response_text=summarize_text(getattr(response, "text", ""), limit=200),
                query_preview=summarize_text(query),
            )
            return {
                "enabled": True,
                "domain": active_domain,
                "reason": "retrieve_request_failed",
                "context": None,
                "records": 0,
                "dataset_name": dataset_name,
            }

    if data is None:
        trace_log(
            module="knowledge_service",
            stage="retrieve_context",
            status="error",
            request_id="-",
            domain=active_domain,
            reason="retrieve_request_failed",
            dataset_name=dataset_name,
            error="retrieve_request_failed",
            http_status=getattr(response, "status_code", ""),
            response_text=summarize_text(getattr(response, "text", ""), limit=200),
            query_preview=summarize_text(query),
        )
        return {
            "enabled": True,
            "domain": active_domain,
            "reason": "retrieve_request_failed",
            "context": None,
            "records": 0,
            "dataset_name": dataset_name,
        }

    context, records_count = _extract_context(data)
    if not context:
        trace_log(
            module="knowledge_service",
            stage="retrieve_context",
            status="empty",
            request_id="-",
            domain=active_domain,
            reason="empty_records",
            dataset_name=dataset_name,
            query_preview=summarize_text(query),
            records_count=records_count,
        )
        return {
            "enabled": True,
            "domain": active_domain,
            "reason": "empty_records",
            "context": None,
            "records": records_count,
            "dataset_name": dataset_name,
        }

    trace_log(
        module="knowledge_service",
        stage="retrieve_context",
        status="ok",
        request_id="-",
        domain=active_domain,
        reason="context_loaded",
        dataset_name=dataset_name,
        query_preview=summarize_text(query),
        records_count=records_count,
        context_len=len(context),
    )
    return {
        "enabled": True,
        "domain": active_domain,
        "reason": "context_loaded",
        "context": context,
        "records": records_count,
        "dataset_name": dataset_name,
    }


def retrieve_context(text: str | None, domain: str | None = None) -> str | None:
    return retrieve_context_details(text, domain=domain).get("context")


def get_status(force_refresh: bool = False) -> dict:
    cfg.load_config()
    config = _load_config()
    domains = sorted(config.keys())
    discovery = _fetch_dataset_list(force_refresh=force_refresh) if _get_api_key() else {
        "ok": False,
        "reason": "missing_api_key",
        "items": [],
        "domain_map": {},
        "match_reasons": {},
    }

    matched = {}
    for domain in domains:
        dataset = (discovery.get("domain_map") or {}).get(domain)
        matched[domain] = {
            "matched": bool(dataset),
            "dataset_name": str((dataset or {}).get("name") or ""),
            "reason": (discovery.get("match_reasons") or {}).get(domain) or ("dataset_matched" if dataset else "dataset_not_found"),
        }

    return {
        "enabled": bool(getattr(cfg, "knowledge_enabled", False)),
        "provider": str(getattr(cfg, "key_chat_module", "") or ""),
        "gpt_only": bool(getattr(cfg, "knowledge_for_gpt_only", True)),
        "timeout_ms": int(getattr(cfg, "knowledge_timeout_ms", 3000) or 3000),
        "config_path": str(_CONFIG_PATH),
        "config_loaded": bool(config),
        "domains": domains,
        "has_api_key": bool(_get_api_key()),
        "dataset_list_loaded": bool(discovery.get("ok")),
        "dataset_list_reason": discovery.get("reason") or "",
        "dataset_count": len(discovery.get("items") or []),
        "matched_datasets": matched,
    }

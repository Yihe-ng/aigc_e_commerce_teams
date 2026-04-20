import os
import time
from pathlib import Path

from backend.services.local_rag.chroma_store import (
    collection_exists,
    get_client,
    get_collection_name,
    get_persist_dir,
    list_collections,
    reset_collection,
)
from backend.services.local_rag.document_loader import load_markdown
from backend.services.local_rag.retriever import LocalRetriever
from utils.trace_utils import summarize_text, trace_log


_DEFAULT_DOCS_DIR = "data/rag_documents"
_DEFAULT_CONTEXT_LIMIT = 1600


class LocalRagApiError(Exception):
    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _has_api_key() -> bool:
    return bool(
        (os.getenv("LOCAL_RAG_API_KEY") or "").strip()
        or (os.getenv("SILICONFLOW_API_KEY") or "").strip()
    )


def _resolve_documents_dir() -> Path:
    raw = (os.getenv("LOCAL_RAG_DOCUMENTS_DIR") or "").strip() or _DEFAULT_DOCS_DIR
    path = Path(raw)
    if not path.is_absolute():
        path = _project_root() / path
    return path


def _normalize_domain(domain: str | None) -> str:
    value = str(domain or "").strip().lower()
    return value or "default"


def _list_markdown_files(docs_dir: Path) -> list[Path]:
    if not docs_dir.exists():
        return []
    return sorted(path for path in docs_dir.glob("*.md") if path.is_file())


def _truncate_context(text: str, limit: int = _DEFAULT_CONTEXT_LIMIT) -> str:
    content = str(text or "")
    if len(content) <= limit:
        return content
    return content[: limit - 3].rstrip() + "..."


def get_local_rag_status() -> dict:
    started_at = time.perf_counter()
    docs_dir = _resolve_documents_dir()
    files = _list_markdown_files(docs_dir)
    collections_payload: list[dict] = []
    for name in list_collections():
        try:
            collection = get_client().get_collection(name=name)
            collections_payload.append({"name": name, "count": collection.count()})
        except Exception as exc:
            collections_payload.append({"name": name, "count": 0})
            trace_log(
                module="local_rag_api",
                stage="status",
                status="error",
                request_id="-",
                error=summarize_text(exc),
                domain=name,
                records=0,
                elapsed_ms=(time.perf_counter() - started_at) * 1000,
            )

    payload = {
        "enabled": _has_api_key(),
        "has_api_key": _has_api_key(),
        "documents_dir": str(docs_dir.relative_to(_project_root())) if docs_dir.exists() and docs_dir.is_relative_to(_project_root()) else str(docs_dir),
        "documents_dir_exists": docs_dir.exists(),
        "documents_file_count": len(files),
        "persist_dir": str(get_persist_dir().relative_to(_project_root())) if get_persist_dir().is_relative_to(_project_root()) else str(get_persist_dir()),
        "collections": collections_payload,
    }
    trace_log(
        module="local_rag_api",
        stage="status",
        status="ok",
        request_id="-",
        domain="*",
        records=sum(int(item.get("count") or 0) for item in collections_payload),
        elapsed_ms=(time.perf_counter() - started_at) * 1000,
    )
    return payload


def import_local_rag_documents(domain=None, reset=False) -> dict:
    started_at = time.perf_counter()
    active_domain = _normalize_domain(domain)
    docs_dir = _resolve_documents_dir()
    if not _has_api_key():
        raise LocalRagApiError("missing_api_key", 400)
    if not docs_dir.exists():
        raise LocalRagApiError("documents_dir_not_found", 400)

    files = _list_markdown_files(docs_dir)
    if not files:
        raise LocalRagApiError("documents_not_found", 400)

    retriever = LocalRetriever()
    total_chunks = 0
    failed_files = 0
    if bool(reset):
        reset_collection(active_domain)

    for file_path in files:
        try:
            chunks = load_markdown(str(file_path))
            result = retriever.add_documents(chunks, domain=active_domain)
            total_chunks += int(result.get("records") or 0)
        except Exception as exc:
            failed_files += 1
            trace_log(
                module="local_rag_api",
                stage="import",
                status="error",
                request_id="-",
                domain=active_domain,
                file=str(file_path),
                chunks=total_chunks,
                records=total_chunks,
                error=summarize_text(exc),
                elapsed_ms=(time.perf_counter() - started_at) * 1000,
            )
            # 继续处理下一个文件，而不是中断整个导入过程

    payload = {
        "status": "success",
        "domain": active_domain,
        "files": len(files),
        "chunks": total_chunks,
        "failed_files": failed_files,
        "elapsed_ms": round((time.perf_counter() - started_at) * 1000, 2),
    }
    trace_log(
        module="local_rag_api",
        stage="import",
        status="ok",
        request_id="-",
        domain=active_domain,
        chunks=total_chunks,
        records=total_chunks,
        elapsed_ms=payload["elapsed_ms"],
    )
    return payload


def query_local_rag(query, domain=None, top_k=3) -> dict:
    started_at = time.perf_counter()
    text = str(query or "").strip()
    requested_domain = _normalize_domain(domain)
    if not text:
        raise LocalRagApiError("empty_query", 400)
    if not _has_api_key():
        raise LocalRagApiError("missing_api_key", 400)

    resolved_domain = requested_domain
    if not collection_exists(requested_domain):
        resolved_domain = "default"

    if not collection_exists(resolved_domain):
        payload = {
            "status": "success",
            "requested_domain": requested_domain,
            "resolved_domain": resolved_domain,
            "records": 0,
            "scores": [],
            "context": "",
            "items": [],
            "elapsed_ms": round((time.perf_counter() - started_at) * 1000, 2),
        }
        trace_log(
            module="local_rag_api",
            stage="query",
            status="empty",
            request_id="-",
            domain=resolved_domain,
            records=0,
            elapsed_ms=payload["elapsed_ms"],
        )
        return payload

    try:
        result = LocalRetriever().retrieve(text, domain=resolved_domain, top_k=max(1, int(top_k or 3)))
    except Exception as exc:
        trace_log(
            module="local_rag_api",
            stage="query",
            status="error",
            request_id="-",
            domain=resolved_domain,
            records=0,
            error=summarize_text(exc),
            elapsed_ms=(time.perf_counter() - started_at) * 1000,
        )
        raise LocalRagApiError("embedding_failed", 500) from exc

    payload = {
        "status": "success",
        "requested_domain": requested_domain,
        "resolved_domain": _normalize_domain(result.get("domain") or resolved_domain),
        "records": int(result.get("records") or 0),
        "scores": list(result.get("scores") or []),
        "context": _truncate_context(result.get("context") or ""),
        "items": list(result.get("items") or []),
        "elapsed_ms": round((time.perf_counter() - started_at) * 1000, 2),
    }
    trace_log(
        module="local_rag_api",
        stage="query",
        status="ok" if payload["records"] else "empty",
        request_id="-",
        domain=payload["resolved_domain"],
        records=payload["records"],
        elapsed_ms=payload["elapsed_ms"],
    )
    return payload

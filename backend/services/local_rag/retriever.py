import hashlib
import time
from typing import Callable

from backend.services import knowledge_service
from utils.trace_utils import summarize_text, trace_log

from .chroma_store import add_documents as store_documents
from .chroma_store import query_documents
from .embedding_service import LocalEmbeddingService


def _normalize_domain(domain: str | None) -> str:
    value = str(domain or "").strip().lower()
    return value or "default"


def _build_item_id(domain: str, metadata: dict, index: int, content: str) -> str:
    raw = "|".join(
        [
            domain,
            str(metadata.get("source_file") or ""),
            str(metadata.get("section") or ""),
            str(index),
            content,
        ]
    )
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


class LocalRetriever:
    def __init__(self, *, embedding_service: Callable[[str], list[float]] | None = None):
        self.embedding_service = embedding_service or LocalEmbeddingService()

    def _embed_documents(self, texts: list[str]) -> list[list[float]]:
        service = self.embedding_service
        if hasattr(service, "embed_documents"):
            return service.embed_documents(texts)
        return [service(text) for text in texts]

    def _resolve_domain(self, text: str | None, domain: str | None = None) -> str:
        if domain:
            return _normalize_domain(domain)
        try:
            detected = knowledge_service.detect_domain(text)
        except Exception:
            detected = None
        return _normalize_domain(detected)

    def add_documents(self, documents: list[dict], *, domain: str | None = None) -> dict:
        active_domain = self._resolve_domain("", domain=domain)
        pairs: list[tuple[str, dict]] = []
        for item in documents:
            text = str(item.get("content") or "").strip()
            if not text:
                continue
            pairs.append((text, dict(item.get("metadata") or {})))
        if not pairs:
            return {"domain": active_domain, "records": 0}

        started_at = time.perf_counter()
        texts = [text for text, _ in pairs]
        metadatas = [metadata for _, metadata in pairs]
        embeddings = self._embed_documents(texts)
        ids = [
            _build_item_id(active_domain, metadata, index, text)
            for index, (text, metadata) in enumerate(zip(texts, metadatas))
        ]
        store_documents(
            active_domain,
            ids=ids,
            documents=texts,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        trace_log(
            module="local_rag",
            stage="import",
            status="ok",
            request_id="-",
            domain=active_domain,
            records=len(texts),
            time_cost=(time.perf_counter() - started_at) * 1000,
        )
        return {"domain": active_domain, "records": len(texts)}

    def _query_store(self, domain: str, query: str, top_k: int) -> tuple[str, dict]:
        query_embedding = self.embedding_service(query)
        try:
            return domain, query_documents(domain, query_embedding=query_embedding, top_k=top_k)
        except Exception:
            if domain != "default":
                return "default", query_documents("default", query_embedding=query_embedding, top_k=top_k)
            raise

    def retrieve(self, query: str, domain: str | None = None, top_k: int = 5) -> dict:
        active_domain = self._resolve_domain(query, domain=domain)
        started_at = time.perf_counter()
        try:
            active_domain, raw = self._query_store(active_domain, query, top_k)
        except Exception as exc:
            trace_log(
                module="local_rag",
                stage="retrieve",
                status="error",
                request_id="-",
                domain=active_domain,
                error=summarize_text(exc),
                query_preview=summarize_text(query),
                time_cost=(time.perf_counter() - started_at) * 1000,
            )
            return {
                "context": "",
                "domain": active_domain,
                "items": [],
                "records": 0,
                "scores": [],
            }

        documents = (raw.get("documents") or [[]])[0]
        metadatas = (raw.get("metadatas") or [[]])[0]
        distances = (raw.get("distances") or [[]])[0]
        items: list[dict] = []
        for document, metadata, distance in zip(documents, metadatas, distances):
            score = round(max(0.0, 1 - float(distance or 0.0)), 4)
            items.append(
                {
                    "content": str(document or ""),
                    "metadata": dict(metadata or {}),
                    "score": score,
                }
            )

        trace_log(
            module="local_rag",
            stage="retrieve",
            status="ok" if items else "empty",
            request_id="-",
            domain=active_domain,
            records=len(items),
            query_preview=summarize_text(query),
            time_cost=(time.perf_counter() - started_at) * 1000,
        )
        return {
            "context": "\n\n".join(item["content"] for item in items if item["content"]),
            "domain": active_domain,
            "items": items,
            "records": len(items),
            "scores": [item["score"] for item in items],
        }


_DEFAULT_RETRIEVER = LocalRetriever()


def add_documents(documents: list[dict], *, domain: str | None = None) -> dict:
    return _DEFAULT_RETRIEVER.add_documents(documents, domain=domain)


def retrieve(query: str, domain: str | None = None, top_k: int = 5) -> dict:
    return _DEFAULT_RETRIEVER.retrieve(query, domain=domain, top_k=top_k)

import os
from pathlib import Path

import chromadb


def _project_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _persist_dir() -> Path:
    raw = os.getenv("LOCAL_RAG_PERSIST_DIR", "").strip() or "data/chroma_db"
    path = Path(raw)
    if not path.is_absolute():
        path = _project_root() / path
    path.mkdir(parents=True, exist_ok=True)
    return path


def _collection_prefix() -> str:
    return (os.getenv("LOCAL_RAG_COLLECTION_PREFIX", "local_rag") or "local_rag").strip()


def _normalize_domain(domain: str | None) -> str:
    value = str(domain or "").strip().lower()
    return value or "default"


def _collection_name(domain: str | None) -> str:
    return f"{_collection_prefix()}__{_normalize_domain(domain)}"


def get_persist_dir() -> Path:
    return _persist_dir()


def get_collection_name(domain: str | None) -> str:
    return _collection_name(domain)


def get_client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(path=str(_persist_dir()))


def get_collection(domain: str | None, *, create: bool = True):
    client = get_client()
    name = _collection_name(domain)
    if create:
        return client.get_or_create_collection(
            name=name,
            metadata={"domain": _normalize_domain(domain)},
        )
    return client.get_collection(name=name)


def add_documents(
    domain: str | None,
    *,
    ids: list[str],
    documents: list[str],
    embeddings: list[list[float]],
    metadatas: list[dict],
) -> None:
    collection = get_collection(domain, create=True)
    collection.upsert(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )


def query_documents(
    domain: str | None,
    *,
    query_embedding: list[float],
    top_k: int = 5,
) -> dict:
    collection = get_collection(domain, create=False)
    return collection.query(
        query_embeddings=[query_embedding],
        n_results=max(1, int(top_k)),
    )


def list_collections() -> list[str]:
    names: list[str] = []
    for item in get_client().list_collections():
        names.append(str(getattr(item, "name", item)))
    return sorted(names)


def collection_exists(domain: str | None) -> bool:
    return get_collection_name(domain) in list_collections()


def get_collection_stats(domain: str | None) -> dict:
    collection = get_collection(domain, create=False)
    return {
        "name": collection.name,
        "count": collection.count(),
    }


def reset_collection(domain: str | None) -> None:
    client = get_client()
    try:
        client.delete_collection(name=_collection_name(domain))
    except Exception:
        pass

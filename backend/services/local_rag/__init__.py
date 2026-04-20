"""Local RAG services for offline document import and retrieval."""

from .chroma_store import get_collection_stats, list_collections, reset_collection
from .document_loader import load_markdown
from .retriever import LocalRetriever, add_documents, retrieve

__all__ = [
    "LocalRetriever",
    "add_documents",
    "get_collection_stats",
    "list_collections",
    "load_markdown",
    "reset_collection",
    "retrieve",
]

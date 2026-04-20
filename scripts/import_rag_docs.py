import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env", override=False)

from backend.services.local_rag.chroma_store import reset_collection
from backend.services.local_rag.document_loader import load_markdown
from backend.services.local_rag.retriever import LocalRetriever


def _resolve_docs_dir(raw: str | None) -> Path:
    value = raw or os.getenv("LOCAL_RAG_DOCUMENTS_DIR") or "data/rag_documents"
    path = Path(value)
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    path.mkdir(parents=True, exist_ok=True)
    return path


def main():
    parser = argparse.ArgumentParser(description="Import Markdown documents into the local RAG store.")
    parser.add_argument("--docs-dir", default="", help="Directory that contains Markdown files.")
    parser.add_argument("--domain", default="", help="Force all imported documents into one domain.")
    parser.add_argument("--reset", action="store_true", help="Reset the target collection before import.")
    args = parser.parse_args()

    docs_dir = _resolve_docs_dir(args.docs_dir)
    files = sorted(docs_dir.glob("*.md"))
    if not files:
        print(f"No Markdown files found in {docs_dir}")
        return 0

    retriever = LocalRetriever()
    reset_done: set[str] = set()
    total_chunks = 0
    print(f"Found {len(files)} Markdown file(s) in {docs_dir}")
    for file_path in files:
        chunks = load_markdown(str(file_path))
        domain = (args.domain or "").strip() or "default"
        if args.reset and domain not in reset_done:
            reset_collection(domain)
            reset_done.add(domain)
        result = retriever.add_documents(chunks, domain=domain)
        total_chunks += int(result.get("records") or 0)
        print(f"- {file_path.name}: {len(chunks)} chunk(s) -> domain={result['domain']}")

    print(f"Imported {total_chunks} chunk(s) in total")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

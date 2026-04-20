import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env", override=False)

from backend.services.local_rag_api_service import LocalRagApiError, import_local_rag_documents


def main():
    parser = argparse.ArgumentParser(description="Import Markdown documents into the local RAG store.")
    parser.add_argument("--docs-dir", default="", help="Directory that contains Markdown files.")
    parser.add_argument("--domain", default="", help="Force all imported documents into one domain.")
    parser.add_argument("--reset", action="store_true", help="Reset the target collection before import.")
    args = parser.parse_args()

    if args.docs_dir:
        os.environ["LOCAL_RAG_DOCUMENTS_DIR"] = args.docs_dir
    try:
        result = import_local_rag_documents(domain=args.domain or None, reset=args.reset)
    except LocalRagApiError as exc:
        print(exc.message)
        return 1

    print(f"domain: {result['domain']}")
    print(f"files: {result['files']}")
    print(f"chunks: {result['chunks']}")
    print(f"failed_files: {result['failed_files']}")
    print(f"elapsed_ms: {result['elapsed_ms']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

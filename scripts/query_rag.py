import argparse
import sys
from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env", override=False)

from backend.services.local_rag_api_service import LocalRagApiError, query_local_rag


def main():
    parser = argparse.ArgumentParser(description="Query the local RAG store.")
    parser.add_argument("query", help="Query text.")
    parser.add_argument("--domain", default="", help="Optional domain.")
    parser.add_argument("--top-k", type=int, default=3, help="Number of results to return.")
    args = parser.parse_args()

    try:
        result = query_local_rag(args.query, domain=args.domain or None, top_k=args.top_k)
    except LocalRagApiError as exc:
        print(exc.message)
        return 1

    print(f"requested_domain: {result['requested_domain']}")
    print(f"resolved_domain: {result['resolved_domain']}")
    print(f"records: {result['records']}")
    print("context:")
    print(result["context"] or "<empty>")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

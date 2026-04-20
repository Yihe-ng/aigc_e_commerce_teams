import os
import time
from typing import Iterable

import requests

from utils.trace_utils import summarize_text, trace_log


_DEFAULT_API_BASE = "https://api.siliconflow.cn/v1"
_DEFAULT_MODEL = "BAAI/bge-m3"
_DEFAULT_TIMEOUT_SECONDS = 30


class LocalEmbeddingService:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        api_base: str | None = None,
        timeout_seconds: float | None = None,
    ):
        self.api_key = (api_key or os.getenv("LOCAL_RAG_API_KEY") or os.getenv("SILICONFLOW_API_KEY") or "").strip()
        self.model = (model or os.getenv("LOCAL_RAG_EMBEDDING_MODEL") or os.getenv("SILICONFLOW_EMBEDDING_MODEL") or _DEFAULT_MODEL).strip()
        self.api_base = (api_base or os.getenv("LOCAL_RAG_EMBEDDING_BASE_URL") or _DEFAULT_API_BASE).rstrip("/")
        self.timeout_seconds = float(timeout_seconds or os.getenv("LOCAL_RAG_TIMEOUT_SECONDS") or _DEFAULT_TIMEOUT_SECONDS)

    def embed_documents(self, texts: Iterable[str]) -> list[list[float]]:
        payload_texts = [str(text or "").strip() for text in texts]
        if not payload_texts:
            return []
        if not self.api_key:
            raise ValueError("LOCAL_RAG_API_KEY or SILICONFLOW_API_KEY is required for local RAG embeddings")

        started_at = time.perf_counter()
        last_exception: Exception | None = None

        # 指数退避重试机制
        for attempt in range(3):
            try:
                response = requests.post(
                    f"{self.api_base}/embeddings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "input": payload_texts,
                        "encoding_format": "float",
                    },
                    timeout=self.timeout_seconds,
                )
                response.raise_for_status()
                payload = response.json()
                break
            except (requests.RequestException, TimeoutError) as exc:
                last_exception = exc
                if attempt == 2:
                    # 最后一次尝试失败，记录日志并抛出异常
                    trace_log(
                        module="local_rag",
                        stage="embed",
                        status="error",
                        request_id="-",
                        error=summarize_text(exc),
                        texts=len(payload_texts),
                        time_cost=(time.perf_counter() - started_at) * 1000,
                    )
                    raise
                # 指数退避等待
                time.sleep(2 ** attempt)
        else:
            # 如果循环正常结束（没有break），说明所有重试都失败了
            if last_exception:
                raise last_exception

        data = payload.get("data") or []
        if not isinstance(data, list) or len(data) != len(payload_texts):
            raise ValueError("Unexpected embedding response payload")

        embeddings: list[list[float]] = []
        for item in data:
            vector = item.get("embedding")
            if not isinstance(vector, list):
                raise ValueError("Embedding response missing vector data")
            embeddings.append(vector)

        trace_log(
            module="local_rag",
            stage="embed",
            status="ok",
            request_id="-",
            texts=len(payload_texts),
            model=self.model,
            time_cost=(time.perf_counter() - started_at) * 1000,
        )
        return embeddings

    def embed_query(self, text: str) -> list[float]:
        return self.embed_documents([text])[0]

    def __call__(self, text: str) -> list[float]:
        return self.embed_query(text)

"""语义意图路由器 —— 用 Embedding 相似度替代关键词正则匹配"""

import math
import time
from typing import Optional

from utils.trace_utils import trace_log


class SemanticRouter:

    INTENT_ANCHORS = {
        "chat": [
            "你好", "你是谁", "你能做什么", "谢谢", "哈哈哈",
            "主播好", "晚上好", "在吗", "有人在吗",
            "来了", "打卡", "冒泡", "看看", "在播吗", "主播在吗",
        ],
        "product_inquiry": [
            "多少钱", "有M码吗", "什么颜色", "尺码表",
            "还有其他颜色吗", "有优惠吗", "发什么快递",
            "什么时候发货", "怎么买", "哪里下单",
            "哪个好", "帮我推荐", "和这款比怎么样",
            "我想看", "有没有", "给我看看", "推荐一下",
            "适合什么身材", "质量行不行", "偏码吗", "会掉色吗", "能便宜点吗",
            "我100斤穿什么", "有没有适合我的", "推荐适合的",
            "有没有红色的", "有没有便宜的", "黑色的有哪些", "大码的有吗",
        ],
        "knowledge_question": [
            "面料是什么", "怎么洗", "会缩水吗", "透气性好吗",
            "这个材质怎么样", "适合什么季节", "怎么搭配",
            "适合什么场合", "穿起来舒服吗", "会不会起球",
            "起球吗", "掉色吗", "会不会皱", "适合夏天穿吗",
            "冬天穿暖和吗", "显瘦吗", "显黑吗",
            "好搭配吗", "怎么搭配好看", "适合什么场合穿",
            "这是纯棉吗", "桑蚕丝吗", "会不会褪色",
        ],
        "negative_feedback": [
            "太贵了吧", "不好看", "质量差", "骗人的",
            "不值这个价", "算了不要了", "看看别的",
            "不太喜欢", "有没有更便宜的", "一点都不好",
            "不透气吧", "这也太差了", "完全不值",
            "算了", "不买了", "再看看吧", "太差了", "不值",
        ],
    }

    INTENT_TO_DOMAIN = {
        "knowledge_question": "knowledge",
        "product_inquiry": "product",
        "chat": "chat",
        "negative_feedback": "negative",
    }

    SIMILARITY_THRESHOLD = 0.55

    def __init__(self):
        self._embedding_service = None
        self._anchor_vectors = {}
        self._initialized = False

    @classmethod
    def get_instance(cls) -> "SemanticRouter":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _ensure_initialized(self):
        if self._initialized:
            return
        from backend.services.local_rag.embedding_service import LocalEmbeddingService
        self._embedding_service = LocalEmbeddingService()
        for intent, anchors in self.INTENT_ANCHORS.items():
            self._anchor_vectors[intent] = self._embedding_service.embed_documents(anchors)
        self._initialized = True
        trace_log(
            module="semantic_router",
            stage="init",
            status="ok",
            intents=str(list(self.INTENT_ANCHORS.keys())),
            anchor_count=sum(len(v) for v in self.INTENT_ANCHORS.values()),
        )

    @staticmethod
    def _cosine_similarity(a, b):
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot / (norm_a * norm_b)

    def _best_intent(self, query_vector):
        best_intent = None
        best_score = -1.0
        for intent, vectors in self._anchor_vectors.items():
            for anchor_vec in vectors:
                score = self._cosine_similarity(query_vector, anchor_vec)
                if score > best_score:
                    best_score = score
                    best_intent = intent
        return best_intent, max(0.0, float(best_score))

    def classify(self, text):
        started_at = time.perf_counter()
        normalized = (text or "").strip()
        if not normalized or len(normalized) < 1:
            return {"domain": None, "method": "low_confidence_fallback", "confidence": 0.0}
        try:
            self._ensure_initialized()
            if not self._embedding_service or not self._anchor_vectors:
                return {"domain": None, "method": "error_fallback", "confidence": 0.0}
            query_embedding = self._embedding_service(normalized)
            if not query_embedding:
                return {"domain": None, "method": "error_fallback", "confidence": 0.0}
            best_intent, confidence = self._best_intent(query_embedding)
            if best_intent and confidence >= self.SIMILARITY_THRESHOLD:
                domain = self.INTENT_TO_DOMAIN.get(best_intent)
                method = "semantic"
            else:
                domain = None
                method = "low_confidence_fallback"
            elapsed_ms = int((time.perf_counter() - started_at) * 1000)
            trace_log(
                module="semantic_router",
                stage="classify",
                status="ok",
                intent=best_intent or "",
                domain=domain or "",
                confidence=round(confidence, 3),
                method=method,
                time_cost=elapsed_ms,
            )
            return {"domain": domain, "method": method, "confidence": confidence}
        except Exception:
            elapsed_ms = int((time.perf_counter() - started_at) * 1000)
            trace_log(
                module="semantic_router",
                stage="classify",
                status="error",
                time_cost=elapsed_ms,
            )
            return {"domain": None, "method": "error_fallback", "confidence": 0.0}


_router_instance = None


def get_router():
    global _router_instance
    if _router_instance is None:
        _router_instance = SemanticRouter()
    return _router_instance


def classify_intent(text):
    return get_router().classify(text)

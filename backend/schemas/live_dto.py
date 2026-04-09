from dataclasses import dataclass
from typing import Any


@dataclass
class ChatRequest:
    text: str
    user: str = "User"
    request_id: str = ""

    @classmethod
    def from_payload(cls, payload: dict[str, Any] | None):
        payload = payload or {}
        return cls(
            text=str(payload.get("text", "") or ""),
            user=str(payload.get("user", "User") or "User"),
            request_id=str(payload.get("request_id", "") or ""),
        )


@dataclass
class HistoryRequest:
    username: str = "User"

    @classmethod
    def from_payload(cls, payload: dict[str, Any] | None):
        payload = payload or {}
        return cls(username=str(payload.get("username", "User") or "User"))


@dataclass
class ChatCompletionRequest:
    model: str = "avatar"
    username: str = "User"
    prompt: str = ""

    @classmethod
    def from_payload(cls, payload: dict[str, Any] | None):
        payload = payload or {}
        username = "User"
        prompt = ""
        messages = payload.get("messages") or []
        if isinstance(messages, list) and messages:
            last_message = messages[-1] if isinstance(messages[-1], dict) else {}
            username = last_message.get("role", "User") or "User"
            if username == "user":
                username = "User"
            prompt = str(last_message.get("content", "") or "")
        elif isinstance(payload.get("prompt"), str):
            prompt = payload.get("prompt", "")
        return cls(
            model=str(payload.get("model", "avatar") or "avatar"),
            username=str(username),
            prompt=prompt,
        )


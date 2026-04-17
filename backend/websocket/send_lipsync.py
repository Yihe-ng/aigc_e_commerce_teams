from __future__ import annotations


def send_lipsync(ws, mouth_open: float, timestamp: int, *, username: str = "User", request_id: str = "", rms: float = 0.0, short_energy: float = 0.0) -> None:
    if ws is None:
        return
    ws.add_cmd(
        {
            "type": "lip_sync",
            "timestamp": int(timestamp),
            "mouth_open": round(float(mouth_open), 4),
            "rms": round(float(rms), 4),
            "short_energy": round(float(short_energy), 4),
            "request_id": request_id,
            "Username": username,
        }
    )


def send_lipsync_end(ws, timestamp: int, *, username: str = "User", request_id: str = "") -> None:
    if ws is None:
        return
    ws.add_cmd(
        {
            "type": "lip_sync_end",
            "timestamp": int(timestamp),
            "mouth_open": 0.0,
            "request_id": request_id,
            "Username": username,
        }
    )

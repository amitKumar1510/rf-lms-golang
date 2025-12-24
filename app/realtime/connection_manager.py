from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, Optional, Set, Tuple

from fastapi import WebSocket


UserKey = Tuple[str, str]  # (role, id)


@dataclass(frozen=True)
class Connection:
    websocket: WebSocket


class ConnectionManager:
    """
    Very small in-memory connection registry.
    Keyed by (role, id) where "id" meaning depends on the hub:
    - chat: subject_id (parent.id or teacher.id)
    - notifications: recipient_id (parent.id or user.user_id)
    """

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._by_user: Dict[UserKey, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, key: UserKey) -> None:
        await websocket.accept()
        async with self._lock:
            self._by_user.setdefault(key, set()).add(websocket)

    async def disconnect(self, websocket: WebSocket, key: UserKey) -> None:
        async with self._lock:
            conns = self._by_user.get(key)
            if not conns:
                return
            conns.discard(websocket)
            if not conns:
                self._by_user.pop(key, None)

    async def send_to(self, key: UserKey, data: Dict[str, Any]) -> None:
        async with self._lock:
            conns = list(self._by_user.get(key, set()))
        if not conns:
            return
        for ws in conns:
            try:
                await ws.send_json(data)
            except Exception:
                # ignore; cleanup happens on disconnect
                pass

    async def send_to_many(self, keys: list[UserKey], data: Dict[str, Any]) -> None:
        # de-dupe keys but keep order
        seen: set[UserKey] = set()
        uniq: list[UserKey] = []
        for k in keys:
            if k in seen:
                continue
            seen.add(k)
            uniq.append(k)
        for k in uniq:
            await self.send_to(k, data)



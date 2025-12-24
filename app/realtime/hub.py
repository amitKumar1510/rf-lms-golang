from __future__ import annotations

from typing import Any, Dict, Tuple

from app.realtime.connection_manager import ConnectionManager, UserKey


class RealtimeHub:
    def __init__(self) -> None:
        self.chat = ConnectionManager()
        self.notifications = ConnectionManager()

    async def send_chat_to_participants(self, parent_id: str, teacher_id: str, data: Dict[str, Any]) -> None:
        keys: list[UserKey] = [("parent", parent_id), ("teacher", teacher_id)]
        await self.chat.send_to_many(keys, data)

    async def send_notification_to_recipient(self, recipient_role: str, recipient_id: str, data: Dict[str, Any]) -> None:
        await self.notifications.send_to((recipient_role, recipient_id), data)


hub = RealtimeHub()



from __future__ import annotations

from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect

from app.realtime.auth import authenticate_websocket, chat_actor_identity
from app.realtime.hub import hub
from app.services.notification_service import NotificationService
from app.config.database import SessionLocal


router = APIRouter()


@router.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket):
    try:
        u = authenticate_websocket(websocket)
        role, _, subject_id = chat_actor_identity(u)
        key = (role, subject_id)
    except Exception:
        # can't send close reason reliably across clients; just close
        await websocket.close(code=1008)
        return

    await hub.chat.connect(websocket, key)
    try:
        # keep socket open; we currently push only (send/edit still over HTTP)
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        await hub.chat.disconnect(websocket, key)


@router.websocket("/ws/notifications")
async def ws_notifications(websocket: WebSocket):
    try:
        u = authenticate_websocket(websocket)
        db = SessionLocal()
        try:
            role, _, rid = NotificationService._actor_identity(db, u)
        finally:
            db.close()
        key = (role, rid)
    except Exception:
        await websocket.close(code=1008)
        return

    await hub.notifications.connect(websocket, key)
    # Send initial unread count
    try:
        db = SessionLocal()
        try:
            count = NotificationService.unread_count(db, u)
        finally:
            db.close()
        await websocket.send_json({"type": "notification.unread_count", "count": int(count)})
    except Exception:
        # ignore
        pass

    try:
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        await hub.notifications.disconnect(websocket, key)



from __future__ import annotations

from typing import Optional, Tuple

from fastapi import HTTPException, WebSocket, status
from jose import jwt
from jose.exceptions import JWTError

from app.config.database import SessionLocal
from app.services.parent_service import ParentService
from app.services.user_service import UserService

import os
from dotenv import load_dotenv

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")


def _extract_token(websocket: WebSocket) -> Optional[str]:
    # Prefer query param: ws://.../ws/chat?token=...
    token = websocket.query_params.get("token")
    if token:
        return token

    # Fallback: Authorization header (rarely used by browsers for WS)
    auth = websocket.headers.get("authorization") or websocket.headers.get("Authorization")
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]

    # Fallback: cookie set by backend login
    cookie = websocket.cookies.get("auth") if hasattr(websocket, "cookies") else None
    if cookie:
        return cookie
    return None


def authenticate_websocket(websocket: WebSocket):
    """
    Returns the same object shape as request.state.user (User or StudentsParent).
    Raises HTTPException (caller should close WS).
    """
    token = _extract_token(websocket)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not found")
    if not SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SECRET_KEY not configured")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    email: str | None = payload.get("sub")
    role: str | None = payload.get("role")
    if not email or not role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    db = SessionLocal()
    try:
        if role == "parent":
            u = ParentService.get_by_email(db, email)
        else:
            u = UserService.get_user_by_email(db, email)
        if not u:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return u
    finally:
        db.close()


def chat_actor_identity(u) -> Tuple[str, str, str]:
    """
    Match chat_route._actor() behavior:
    - parent: id = StudentsParent.id
    - teacher: id = User.teacher_id (Teacher.id)
    """
    role = getattr(u, "role", None)
    school_id = getattr(u, "school_id", None)
    if not role or not school_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if role == "parent":
        sid = getattr(u, "id", None)
        if not sid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return role, school_id, sid
    if role == "teacher":
        tid = getattr(u, "teacher_id", None)
        if not tid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return role, school_id, tid
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parent/teacher can use chat")



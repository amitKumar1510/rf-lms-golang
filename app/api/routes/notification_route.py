from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.notification import InboxResponse, NotificationRecipientResponse, NotificationSendRequest, UnreadCountResponse
from app.services.notification_service import NotificationService
from app.realtime.hub import hub
import anyio

router = APIRouter()


@router.get("/unread-count", response_model=UnreadCountResponse, tags=["Notification"])
def unread_count(request: Request, db: Session = Depends(get_db)):
    c = NotificationService.unread_count(db, request.state.user)
    return {"count": c}


@router.get("/inbox", response_model=InboxResponse, tags=["Notification"])
def inbox(request: Request, db: Session = Depends(get_db), limit: int = 50):
    items = NotificationService.inbox(db, request.state.user, limit=limit)
    return {"items": [NotificationRecipientResponse.model_validate(x) for x in items]}


@router.post("/{recipient_row_id}/read", response_model=NotificationRecipientResponse, tags=["Notification"])
def mark_read(request: Request, recipient_row_id: str, db: Session = Depends(get_db)):
    row = NotificationService.mark_read(db, request.state.user, recipient_row_id)
    # Push updated unread count to this user (and any other open sessions)
    try:
        role, _, rid = NotificationService._actor_identity(db, request.state.user)
        count = NotificationService.unread_count(db, request.state.user)
        anyio.from_thread.run(hub.send_notification_to_recipient, role, rid, {"type": "notification.unread_count", "count": int(count)})
    except Exception:
        pass
    return NotificationRecipientResponse.model_validate(row)


@router.post("/send", response_model=dict, tags=["Notification"])
def send_notification(request: Request, data: NotificationSendRequest, db: Session = Depends(get_db)):
    notif, recipients = NotificationService.send_from_principle(
        db,
        request.state.user,
        audience=data.audience,
        title=data.title,
        message=data.message,
    )

    # Push realtime event to connected recipients (DB is still the source of truth for inbox)
    payload = {
        "type": "notification.new",
        "notification": {
            "id": notif.id,
            "school_id": notif.school_id,
            "title": notif.title,
            "message": notif.message,
            "created_by_role": notif.created_by_role,
            "created_by_id": notif.created_by_id,
            "created_at": notif.created_at.isoformat() if getattr(notif, "created_at", None) else None,
        },
    }
    for (r_role, r_id) in recipients:
        try:
            anyio.from_thread.run(hub.send_notification_to_recipient, r_role, r_id, payload)
        except Exception:
            pass

    return {"message": "Notification sent", "notification_id": notif.id, "recipients": len(recipients)}



from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.utils_functions import generate_id
from app.models.notification import Notification, NotificationRecipient
from app.models.student import StudentsParent
from app.models.users import School, User


class NotificationService:
    @staticmethod
    def _actor_identity(db: Session, actor):
        """
        Returns: role, school_id, recipient_id (stable id used in notification_recipients)
        - For admin/subadmin/principle/teacher/student: recipient_id = User.user_id
        - For parent: recipient_id = StudentsParent.id
        """
        role = getattr(actor, "role", None)
        school_id = getattr(actor, "school_id", None)
        if not role:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if role == "parent":
            if not school_id:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
            rid = getattr(actor, "id", None)
            if not rid:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
            return role, school_id, rid
        if role != "admin" and not school_id:
            # admin users may not have school_id set; inbox still works by recipient_id
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        rid = getattr(actor, "user_id", None)
        if not rid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        return role, school_id, rid
        

    @staticmethod
    def unread_count(db: Session, actor):
        role, _, rid = NotificationService._actor_identity(db, actor)
        return (
            db.query(NotificationRecipient)
            .filter(
                NotificationRecipient.recipient_role == role,
                NotificationRecipient.recipient_id == rid,
                NotificationRecipient.is_read == False,
            )
            .count()
        )

    @staticmethod
    def inbox(db: Session, actor, limit: int = 50):
        role, _, rid = NotificationService._actor_identity(db, actor)
        items = (
            db.query(NotificationRecipient)
            .options(joinedload(NotificationRecipient.notification))
            .filter(NotificationRecipient.recipient_role == role, NotificationRecipient.recipient_id == rid)
            .order_by(NotificationRecipient.created_at.desc())
            .limit(limit)
            .all()
        )
        return items

    @staticmethod
    def mark_read(db: Session, actor, recipient_row_id: str):
        role, _, rid = NotificationService._actor_identity(db, actor)
        row = (
            db.query(NotificationRecipient)
            .filter(
                NotificationRecipient.id == recipient_row_id,
                NotificationRecipient.recipient_role == role,
                NotificationRecipient.recipient_id == rid,
            )
            .first()
        )
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        if not row.is_read:
            row.is_read = True
            row.read_at = datetime.utcnow()
            db.commit()
        return row

    @staticmethod
    def send_from_principle(db: Session, actor: User, audience: str, title: str, message: str):
        role = getattr(actor, "role", None)
        if role != "principle":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only principle can send notifications")
        school_id = getattr(actor, "school_id", None)
        if not school_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="School not found")

        audience = (audience or "").strip().lower()
        allowed = {"all", "subadmin", "teacher", "student", "parent", "principle"}
        if audience not in allowed:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid audience. Allowed: {sorted(allowed)}")

        notif = Notification(
            id=generate_id("notif"),
            school_id=school_id,
            title=title.strip(),
            message=message.strip(),
            created_by_role="principle",
            created_by_id=actor.user_id,
        )
        db.add(notif)
        db.flush()

        recipients: list[tuple[str, str]] = []

        # Users table recipients
        if audience == "all":
            users = db.query(User).filter(User.school_id == school_id, User.is_deleted == False).all()
        else:
            users = db.query(User).filter(User.school_id == school_id, User.role == audience, User.is_deleted == False).all()
        for u in users:
            if u.user_id:
                recipients.append((u.role, u.user_id))

        # Parents are stored separately
        if audience in {"all", "parent"}:
            parents = db.query(StudentsParent).filter(StudentsParent.school_id == school_id, StudentsParent.is_deleted == False).all()
            for p in parents:
                recipients.append(("parent", p.id))

        # Include school admin (School.admin_id) when audience=all (admin user typically doesn't have school_id)
        if audience == "all":
            school = db.query(School).filter(School.id == school_id, School.is_deleted == False).first()
            if school and school.admin_id:
                recipients.append(("admin", school.admin_id))

        # De-dupe recipients
        seen = set()
        uniq = []
        for r in recipients:
            if not r[0] or not r[1]:
                continue
            key = f"{r[0]}::{r[1]}"
            if key in seen:
                continue
            seen.add(key)
            uniq.append(r)

        for (r_role, r_id) in uniq:
            db.add(
                NotificationRecipient(
                    id=generate_id("notif_rcp"),
                    notification_id=notif.id,
                    recipient_role=r_role,
                    recipient_id=r_id,
                    is_read=False,
                )
            )

        db.commit()
        return notif, uniq



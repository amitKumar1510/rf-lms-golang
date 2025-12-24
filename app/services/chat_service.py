from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.utils_functions import generate_id
from app.models.chat import ChatConversation, ChatMessage
from app.models.student import Student, StudentsParent
from app.models.teacher import Teacher
from app.models.users import ClassSubject, User


class ChatService:
    @staticmethod
    def _conv_query(db: Session):
        return db.query(ChatConversation).options(
            joinedload(ChatConversation.parent)
            .joinedload(StudentsParent.student)
            .joinedload(Student.user),
            joinedload(ChatConversation.parent)
            .joinedload(StudentsParent.student)
            .joinedload(Student.class_info),
            joinedload(ChatConversation.teacher).joinedload(Teacher.user),
            joinedload(ChatConversation.class_subject).joinedload(ClassSubject.subject),
            joinedload(ChatConversation.class_subject).joinedload(ClassSubject.class_info),
        )

    @staticmethod
    def _require_parent(db: Session, school_id: str, parent_id: str) -> StudentsParent:
        p = (
            db.query(StudentsParent)
            .filter(
                StudentsParent.id == parent_id,
                StudentsParent.school_id == school_id,
                StudentsParent.is_deleted == False,
            )
            .first()
        )
        if not p:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Parent access required")
        return p

    @staticmethod
    def _require_teacher(db: Session, school_id: str, teacher_id: str) -> Teacher:
        t = (
            db.query(Teacher)
            .options(joinedload(Teacher.user))
            .filter(
                Teacher.id == teacher_id,
                Teacher.school_id == school_id,
                Teacher.is_deleted == False,
            )
            .first()
        )
        if not t:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher access required")
        return t

    @staticmethod
    def list_conversations_for_parent(db: Session, school_id: str, parent_id: str):
        ChatService._require_parent(db, school_id, parent_id)
        return (
            ChatService._conv_query(db)
            .filter(ChatConversation.school_id == school_id, ChatConversation.parent_id == parent_id, ChatConversation.is_active == True)
            .order_by(ChatConversation.last_message_at.desc().nullslast(), ChatConversation.updated_at.desc())
            .all()
        )

    @staticmethod
    def list_conversations_for_teacher(db: Session, school_id: str, teacher_id: str):
        ChatService._require_teacher(db, school_id, teacher_id)
        return (
            ChatService._conv_query(db)
            .filter(ChatConversation.school_id == school_id, ChatConversation.teacher_id == teacher_id, ChatConversation.is_active == True)
            .order_by(ChatConversation.last_message_at.desc().nullslast(), ChatConversation.updated_at.desc())
            .all()
        )

    @staticmethod
    def get_or_create_conversation(db: Session, school_id: str, parent_id: str, teacher_id: str, class_subject_id: str | None = None):
        ChatService._require_parent(db, school_id, parent_id)
        ChatService._require_teacher(db, school_id, teacher_id)

        q = db.query(ChatConversation).filter(
            ChatConversation.school_id == school_id,
            ChatConversation.parent_id == parent_id,
            ChatConversation.teacher_id == teacher_id,
            ChatConversation.is_active == True,
        )
        if class_subject_id:
            q = q.filter(ChatConversation.class_subject_id == class_subject_id)
        else:
            q = q.filter(ChatConversation.class_subject_id == None)
        existing = q.first()
        if existing:
            return ChatService._conv_query(db).filter(ChatConversation.id == existing.id).first()

        conv = ChatConversation(
            id=generate_id("chat_conv"),
            school_id=school_id,
            parent_id=parent_id,
            teacher_id=teacher_id,
            class_subject_id=class_subject_id,
            last_message_at=None,
            is_active=True,
        )
        db.add(conv)
        db.commit()
        return ChatService._conv_query(db).filter(ChatConversation.id == conv.id).first()

    @staticmethod
    def _require_participant(db: Session, conv_id: str, role: str, subject_id: str):
        conv = ChatService._conv_query(db).filter(ChatConversation.id == conv_id, ChatConversation.is_active == True).first()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        if role == "parent":
            if conv.parent_id != subject_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        elif role == "teacher":
            if conv.teacher_id != subject_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        return conv

    @staticmethod
    def list_messages(db: Session, conv_id: str, role: str, subject_id: str, limit: int = 50):
        ChatService._require_participant(db, conv_id, role, subject_id)
        items = (
            db.query(ChatMessage)
            .filter(ChatMessage.conversation_id == conv_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
            .all()
        )
        return items

    @staticmethod
    def send_message(db: Session, conv_id: str, role: str, subject_id: str, text: str):
        conv = ChatService._require_participant(db, conv_id, role, subject_id)
        if not text or not str(text).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message text is required")
        msg = ChatMessage(
            id=generate_id("chat_msg"),
            conversation_id=conv.id,
            sender_role=role,
            sender_id=subject_id,
            text=str(text).strip(),
        )
        db.add(msg)
        conv.last_message_at = datetime.utcnow()
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def edit_message(db: Session, conv_id: str, message_id: str, role: str, subject_id: str, text: str):
        ChatService._require_participant(db, conv_id, role, subject_id)
        if not text or not str(text).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message text is required")

        msg = (
            db.query(ChatMessage)
            .filter(ChatMessage.id == message_id, ChatMessage.conversation_id == conv_id)
            .first()
        )
        if not msg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

        if msg.sender_role != role or msg.sender_id != subject_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own messages")

        msg.text = str(text).strip()
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def to_participant_parent(p: StudentsParent):
        s: Student | None = getattr(p, "student", None)
        u: User | None = getattr(s, "user", None) if s else None
        cl = getattr(s, "class_info", None) if s else None
        return {
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "student_id": getattr(s, "id", None) if s else None,
            "student_name": getattr(u, "name", None) if u else None,
            "class_name": getattr(cl, "name", None) if cl else None,
            "class_section": getattr(cl, "section", None) if cl else None,
        }

    @staticmethod
    def to_participant_teacher(t: Teacher):
        u: User | None = getattr(t, "user", None)
        return {"id": t.id, "name": getattr(u, "name", None), "email": getattr(u, "email", None)}



from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.config.database import Base


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, ForeignKey("schools.id"), nullable=False)

    parent_id = Column(String, ForeignKey("students_parents.id"), nullable=False)
    teacher_id = Column(String, ForeignKey("teachers.id"), nullable=False)
    class_subject_id = Column(String, ForeignKey("class_subjects.id"), nullable=True)

    last_message_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    is_active = Column(Boolean, default=True)

    parent = relationship("StudentsParent")
    teacher = relationship("Teacher")
    class_subject = relationship("ClassSubject")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("chat_conversations.id"), nullable=False)

    sender_role = Column(String, nullable=False)  # "parent" | "teacher"
    sender_id = Column(String, nullable=False)    # StudentsParent.id or Teacher.id
    text = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ChatConversation", back_populates="messages")



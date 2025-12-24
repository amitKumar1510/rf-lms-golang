from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.config.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, ForeignKey("schools.id"), nullable=False)

    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    created_by_role = Column(String, nullable=False)  # principle
    created_by_id = Column(String, nullable=False)    # User.user_id

    created_at = Column(DateTime, default=datetime.utcnow)

    recipients = relationship("NotificationRecipient", back_populates="notification", cascade="all, delete-orphan")


class NotificationRecipient(Base):
    __tablename__ = "notification_recipients"

    id = Column(String, primary_key=True, index=True)
    notification_id = Column(String, ForeignKey("notifications.id"), nullable=False)

    recipient_role = Column(String, nullable=False)  # admin/subadmin/teacher/student/parent/principle
    recipient_id = Column(String, nullable=False)    # User.user_id OR StudentsParent.id (for parent)

    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    notification = relationship("Notification", back_populates="recipients")



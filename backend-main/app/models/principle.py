from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class Principle(Base):
    __tablename__ = "principles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    user = relationship("User", backref="principle_profile")

    # Principle-specific fields
    qualification = Column(String, nullable=True)  # e.g., "M.Ed.", "Ph.D. in Education"
    experience_years = Column(Integer, nullable=True)
    specialization = Column(String, nullable=True)  # e.g., "Educational Leadership", "Curriculum Development"

    # Administrative role
    designation = Column(String, nullable=True)  # e.g., "Principal", "Vice Principal", "Headmaster"

    # School management
    assigned_school_id = Column(String, ForeignKey("schools.id"), nullable=True)
    assigned_school = relationship("School", backref="principles")

    # Contact information (additional to user contact)
    office_phone = Column(String, nullable=True)
    office_email = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

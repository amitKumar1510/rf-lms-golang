from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    user = relationship("User", backref="teacher_profile")

    # Teacher-specific fields
    qualification = Column(String, nullable=True)  # e.g., "M.Sc. Mathematics", "B.Ed."
    experience_years = Column(Integer, nullable=True)
    specialization = Column(String, nullable=True)  # Main subject area

    # Relationships
    subjects = relationship("TeacherSubject", back_populates="teacher")
    class_assignments = relationship("ClassSubjectTeacher", back_populates="teacher")

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"

    id = Column(String, primary_key=True, index=True)
    teacher_id = Column(String, ForeignKey("teachers.id"))
    subject_id = Column(String, ForeignKey("subjects.id"))

    # Relationships
    teacher = relationship("Teacher", back_populates="subjects")
    subject = relationship("Subject", back_populates="teachers")

    # Additional info
    is_primary = Column(Boolean, default=False)  # Is this their primary teaching subject?
    experience_years = Column(Integer, nullable=True)  # Years teaching this subject
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Unique constraint to prevent duplicate assignments
    __table_args__ = (
        {"schema": None},
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

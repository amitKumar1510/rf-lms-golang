from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base
from datetime import datetime


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(String, primary_key=True, index=True)
    school_id = Column(String, ForeignKey("schools.id"))
    user_id = Column(String, ForeignKey("users.user_id"), unique=True)
    user = relationship("User", backref="teacher_profile")

    # Teacher-specific fields
    qualification = Column(String, nullable=True)  # e.g., "M.Sc. Mathematics", "B.Ed."
    experience_years = Column(Integer, nullable=True)
    specialization = Column(String, nullable=True)  # Main subject area

    # Relationships
    subjects = relationship("TeacherSubject", back_populates="teacher")
    departments = relationship("TeacherDepartment", back_populates="teacher")
    class_assignments = relationship("ClassSubjectTeacher", back_populates="teacher")

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


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
    created_at = Column(DateTime, default=datetime.utcnow())


class TeacherDepartment(Base):
    __tablename__ = "teacher_departments"

    id = Column(String, primary_key=True, index=True)
    teacher_id = Column(String, ForeignKey("teachers.id"))
    department_id = Column(String, ForeignKey("departments.id"))

    # Relationships
    teacher = relationship("Teacher", back_populates="departments")
    department = relationship("Department", back_populates="teachers")

    # Additional info
    is_primary = Column(Boolean, default=False)  # Is this their primary department?
    assigned_date = Column(DateTime, default=datetime.utcnow())
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Unique constraint to prevent duplicate assignments
    __table_args__ = (
        {"schema": None},
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())
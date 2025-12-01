from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    user = relationship("User", backref="student_profile")

    # Student-specific fields
    roll_number = Column(String, nullable=True)  # Class roll number
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String, nullable=True)  # "Male", "Female", "Other"
    blood_group = Column(String, nullable=True)  # "A+", "B-", etc.

    # Class enrollment (mandatory)
    class_id = Column(String, ForeignKey("classes.id"))
    class_info = relationship("Class", back_populates="students")

    # Academic info
    admission_date = Column(DateTime, nullable=True)
    guardian_name = Column(String, nullable=True)
    guardian_phone = Column(String, nullable=True)
    guardian_relation = Column(String, nullable=True)  # "Father", "Mother", "Guardian"

    # Relationships
    subjects = relationship("StudentSubject", back_populates="student")
    subject_enrollments = relationship("StudentSubjectEnrollment", back_populates="student")

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class StudentSubject(Base):
    __tablename__ = "student_subjects"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"))
    subject_id = Column(String, ForeignKey("subjects.id"))

    # Relationships
    student = relationship("Student", back_populates="subjects")
    subject = relationship("Subject", back_populates="students")

    # Academic tracking
    is_elective = Column(Boolean, default=False)  # Elective or compulsory subject
    priority_order = Column(Integer, nullable=True)  # Student's preference order
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Unique constraint to prevent duplicate assignments
    __table_args__ = (
        {"schema": None},
    )

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

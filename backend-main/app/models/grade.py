from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.config.database import Base
from datetime import datetime


class StudentGrade(Base):
    __tablename__ = "student_grades"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    class_subject_id = Column(String, ForeignKey("class_subjects.id"), nullable=False)
    academic_year = Column(String, nullable=False)
    midterm_marks = Column(Float, nullable=True)
    final_marks = Column(Float, nullable=True)
    grade = Column(String(5), nullable=True)  # A+, A, B+, etc.
    attendance_percentage = Column(Float, nullable=True)
    status = Column(String, default="enrolled")  # enrolled, completed, failed, withdrawn
    remarks = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="grades")
    class_subject = relationship("ClassSubject", back_populates="grades")

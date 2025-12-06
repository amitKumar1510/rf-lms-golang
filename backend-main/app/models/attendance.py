from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.config.database import Base
from datetime import datetime


class StudentAttendance(Base):
    __tablename__ = "student_attendance"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    class_subject_id = Column(String, ForeignKey("class_subjects.id"), nullable=False)
    academic_year = Column(String, nullable=False)
    attendance_date = Column(Date, nullable=False)
    status = Column(String, nullable=False)  # present, absent, late, excused
    remarks = Column(String, nullable=True)
    marked_by = Column(String, ForeignKey("users.id"), nullable=True)  # Teacher/Admin who marked attendance
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="attendance")
    class_subject = relationship("ClassSubject", back_populates="attendance")
    marker = relationship("User", foreign_keys=[marked_by])

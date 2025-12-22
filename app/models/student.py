from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base
from datetime import datetime

class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), unique=True)
    school_id = Column(String, ForeignKey("schools.id"))

    # Student-specific fields
    roll_number = Column(String, nullable=True)  # Class roll number
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)  # "Male", "Female", "Other"
    blood_group = Column(String, nullable=True)  # "A+", "B-", etc.

    # Class enrollment (mandatory)
    class_id = Column(String, ForeignKey("classes.id"))
    class_info = relationship("Class", back_populates="students")

    # Academic info
    admission_date = Column(DateTime, nullable=True)


    # Relationships
    # subjects = relationship("StudentSubject", back_populates="student")
    subject_enrollments = relationship("StudentSubjectEnrollment", back_populates="student")
    grades = relationship("StudentGrade", back_populates="student")
    attendance = relationship("StudentAttendance", back_populates="student")
    # Many-to-many via student_subject_enrollments; use StudentSubjectEnrollment for writes.
    class_subjects = relationship(
        "ClassSubject",
        secondary="student_subject_enrollments",
        back_populates="students",
        viewonly=True,
    )
    # One parent record per student (as used by current services)
    parent = relationship("StudentsParent", back_populates="student", uselist=False)
    user = relationship("User", backref="student_profile")

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


# class StudentSubject(Base):
#     __tablename__ = "student_subjects"

#     id = Column(String, primary_key=True, index=True)
#     student_id = Column(String, ForeignKey("students.id"))
#     subject_id = Column(String, ForeignKey("subjects.id"))

#     # Relationships
#     student = relationship("Student", back_populates="subjects")
#     subject = relationship("Subject", back_populates="students")

#     # Academic tracking
#     is_elective = Column(Boolean, default=False)  # Elective or compulsory subject
#     priority_order = Column(Integer, nullable=True)  # Student's preference order
#     is_active = Column(Boolean, default=True)
#     is_deleted = Column(Boolean, default=False)

#     # Unique constraint to prevent duplicate assignments
#     __table_args__ = (
#         {"schema": None},
#     )

#     # Timestamps
#     created_at = Column(DateTime, default=datetime.utcnow())
#     updated_at = Column(DateTime, onupdate=datetime.utcnow())


class StudentsParent(Base):
    __tablename__ = "students_parents"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"))
    student = relationship("Student", back_populates="parent")
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    relation = Column(String, nullable=True)
    password = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="parent")
    school_id = Column(String, ForeignKey("schools.id"))
    street = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    occupation = Column(String, nullable=True)  # e.g., "Engineer", "Teacher", "Business"
    education_level = Column(String, nullable=True)  # e.g., "Bachelor's", "Master's", "Ph.D."
    marital_status = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())

    @property
    def address(self):
        # Expose an address-like object for Pydantic schemas (street/city/state/country/postal_code)
        return {
            "street": self.street,
            "city": self.city,
            "state": self.state,
            "country": self.country,
            "postal_code": self.postal_code,
        }
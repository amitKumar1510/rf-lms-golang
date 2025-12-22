from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base
from datetime import datetime

class Address(Base):
    __tablename__ = "addresses"

    id = Column(String, primary_key=True, index=True)
    street = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)

    # Relationship with User
    user_id = Column(String, ForeignKey("users.user_id"), unique=True)
    user = relationship("User", back_populates="address")

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=False)  # e.g., "MATH101", "ENG202"
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # School association - subjects can be school-specific
    school_id = Column(String, ForeignKey("schools.id"), nullable=True)
    school = relationship("School", backref="subjects")

    # Ensure unique name and code per school
    __table_args__ = (
        {"schema": None},
    )

    # Relationships (will be populated by individual model imports)
    teachers = relationship("TeacherSubject", back_populates="subject")
    # students = relationship("StudentSubject", back_populates="subject")
    class_subjects = relationship("ClassSubject", back_populates="subject")
    modules = relationship("Module", back_populates="subject", cascade="all, delete-orphan")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


class Class(Base):
    __tablename__ = "classes"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "Grade 10-A", "Class 8-B"
    grade_level = Column(String, nullable=False)  # e.g., "Grade 1", "Grade 10"
    section = Column(String, nullable=False)  # e.g., "A", "B", "C"
    academic_year = Column(String, nullable=False)  # e.g., "2024-2025"
    capacity = Column(Integer, nullable=True)  # Maximum students

    # School relationship
    school_id = Column(String, ForeignKey("schools.id"), nullable=False)
    school = relationship("School", backref="classes")

    # Class teacher (homeroom teacher - teacher assigned as main teacher for the class)
    class_teacher_id = Column(String, ForeignKey("teachers.id"), nullable=True)
    class_teacher = relationship("Teacher", foreign_keys=[class_teacher_id], backref="homeroom_classes")

    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Relationships (will be populated by individual model imports)
    students = relationship("Student", back_populates="class_info")
    subjects = relationship("ClassSubject", back_populates="class_info")

    # Academic session info # e.g., "2024-2025"
    term = Column(String, nullable=True)  # e.g., "Term 1", "Semester 1"

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


class ClassSubject(Base):
    __tablename__ = "class_subjects"

    id = Column(String, primary_key=True, index=True)
    class_id = Column(String, ForeignKey("classes.id"))
    subject_id = Column(String, ForeignKey("subjects.id"))
    school_id = Column(String, ForeignKey("schools.id"))

    # Relationships
    class_info = relationship("Class", back_populates="subjects")
    subject = relationship("Subject", back_populates="class_subjects")
    teachers = relationship("ClassSubjectTeacher", back_populates="class_subject")
    student_enrollments = relationship("StudentSubjectEnrollment", back_populates="class_subject")
    grades = relationship("StudentGrade", back_populates="class_subject")
    attendance = relationship("StudentAttendance", back_populates="class_subject")
    # Students are linked via the enrollment association table, not a direct FK.
    # Keep this viewonly; create/delete enrollment rows via StudentSubjectEnrollment.
    students = relationship(
        "Student",
        secondary="student_subject_enrollments",
        back_populates="class_subjects",
        viewonly=True,
    )

    # Additional info
    is_compulsory = Column(Boolean, default=True)  # Compulsory or elective
    credits = Column(Integer, nullable=True)  # Credit hours/points
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Unique constraint to prevent duplicate assignments
    __table_args__ = (
        {"schema": None},
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())


class ClassSubjectTeacher(Base):
    __tablename__ = "class_subject_teachers"

    id = Column(String, primary_key=True, index=True)
    class_subject_id = Column(String, ForeignKey("class_subjects.id"))
    teacher_id = Column(String, ForeignKey("teachers.id"))

    # Relationships
    class_subject = relationship("ClassSubject", back_populates="teachers")
    teacher = relationship("Teacher", back_populates="class_assignments")

    # Assignment details
    academic_year = Column(String, nullable=True)  # e.g., "2024-2025"
    periods_per_week = Column(Integer, default=1)  # How many periods per week
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Performance tracking (optional)
    syllabus_completion = Column(Integer, default=0)  # Percentage completed

    # Unique constraint to prevent duplicate assignments
    __table_args__ = (
        {"schema": None},
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # admin, subadmin, principle, teacher, student, parent

    # School relationship (for subadmin, principle, teacher, student)
    school_id = Column(String, ForeignKey("schools.id"), nullable=True)

    # Additional fields for different roles
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    # is_verified = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    image_url = Column(String, nullable=True)

    # For students
    student_id = Column(String, unique=True, nullable=True)  # Student roll number/ID
    parent_id = Column(String, ForeignKey("students_parents.id"), nullable=True)  # Link to parent

    # For teachers
    teacher_id = Column(String, unique=True, nullable=True)  # Teacher ID
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())
    created_by = Column(String, nullable=True)  # Who created this user

    # Relationships
    # parent = relationship("User", remote_side=[id], backref="children")
    # school = relationship("School", foreign_keys=[school_id], lazy='dynamic')  # Disabled to avoid FK conflicts
    address = relationship("Address", back_populates="user", uselist=False)


class School(Base):
    __tablename__ = "schools"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    street = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)

    # Admin who created this school
    admin_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    is_deleted = Column(Boolean, default=False)
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())

    # Relationship
    admin = relationship("User", foreign_keys=[admin_id])


class StudentSubjectEnrollment(Base):
    __tablename__ = "student_subject_enrollments"

    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"))
    class_subject_id = Column(String, ForeignKey("class_subjects.id"))

    # Relationships
    student = relationship("Student", back_populates="subject_enrollments")
    class_subject = relationship("ClassSubject", back_populates="student_enrollments")

    # Enrollment details
    enrollment_date = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    academic_year = Column(String, nullable=True)

    # Academic tracking
    midterm_marks = Column(Integer, nullable=True)
    final_marks = Column(Integer, nullable=True)
    grade = Column(String, nullable=True)  # A+, A, B+, etc.
    attendance_percentage = Column(Integer, default=0)

    # Status
    status = Column(String, default="enrolled")  # enrolled, completed, withdrawn, failed

    # Unique constraint
    __table_args__ = (
        {"schema": None},
    )

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    # code = Column(String, nullable=False)  # e.g., "MATH", "SCI", "ENG"
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # School association - departments can be school-specific
    school_id = Column(String, ForeignKey("schools.id"), nullable=False)
    school = relationship("School", backref="departments")

    # Ensure unique name and code per school
    __table_args__ = (
        {"schema": None},
    )

    # Relationships (will be populated by individual model imports)
    teachers = relationship("TeacherDepartment", back_populates="department")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())


class AcademicSession(Base):
    __tablename__ = "academic_sessions"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)  # e.g., "2024-2025", "2025-2026"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_current = Column(Boolean, default=False)  # Only one session can be current
    is_active = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    # School association
    school_id = Column(String, ForeignKey("schools.id"), nullable=False)
    school = relationship("School", backref="academic_sessions")

    # Session details
    term_count = Column(Integer, default=2)  # Number of terms/semesters in session

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())




class OtpModel(Base):
    __tablename__ = "otp_models"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False,index=True)
    otp_code = Column(String, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())
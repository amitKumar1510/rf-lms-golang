from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base
from datetime import datetime


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assignment_type = Column(String, nullable=False)  # 'file_upload' or 'mcq_quiz'
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    class_subject_id = Column(String, ForeignKey("class_subjects.id"), nullable=False)
    teacher_id = Column(String, ForeignKey("teachers.id"), nullable=False)

    # Assignment settings
    total_marks = Column(Float, default=100)
    passing_marks = Column(Float, default=40)
    due_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())

    # Relationships
    subject = relationship("Subject", backref="assignments")
    class_subject = relationship("ClassSubject", backref="assignments")
    teacher = relationship("Teacher", backref="assignments")
    questions = relationship("AssignmentQuestion", back_populates="assignment", cascade="all, delete-orphan")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentQuestion(Base):
    __tablename__ = "assignment_questions"

    id = Column(String, primary_key=True, index=True)
    assignment_id = Column(String, ForeignKey("assignments.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False)  # 'multiple_choice', 'true_false', 'short_answer'
    options = Column(JSON, nullable=True)  # For multiple choice questions
    correct_answer = Column(String, nullable=True)  # For auto-gradable questions
    marks = Column(Float, default=1)
    order = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())

    # Relationships
    assignment = relationship("Assignment", back_populates="questions")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(String, primary_key=True, index=True)
    assignment_id = Column(String, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)

    # Submission details
    submission_type = Column(String, nullable=False)  # 'file_upload' or 'mcq_answers'
    submitted_answers = Column(JSON, nullable=True)  # For MCQ submissions
    file_path = Column(String, nullable=True)  # For file uploads
    file_name = Column(String, nullable=True)

    # Grading
    marks_obtained = Column(Float, nullable=True)
    total_marks = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    grade = Column(String, nullable=True)  # A, B, C, D, F
    feedback = Column(Text, nullable=True)
    is_graded = Column(Boolean, default=False)
    graded_by = Column(String, ForeignKey("teachers.id"), nullable=True)
    graded_at = Column(DateTime, nullable=True)

    # Statu
    is_submitted = Column(Boolean, default=False)
    submitted_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow())
    updated_at = Column(DateTime, onupdate=datetime.utcnow())

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", backref="assignment_submissions")
    grader = relationship("Teacher", foreign_keys=[graded_by], backref="graded_submissions")

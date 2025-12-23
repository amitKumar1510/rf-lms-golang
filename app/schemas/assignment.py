from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class AssignmentQuestionBase(BaseModel):
    question_text: str
    question_type: str  # 'multiple_choice', 'true_false', 'short_answer'
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    marks: float = 1.0
    order: int = 0


class AssignmentQuestionCreate(AssignmentQuestionBase):
    pass


class AssignmentQuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    question_type: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    marks: Optional[float] = None
    order: Optional[int] = None


class AssignmentQuestionResponse(AssignmentQuestionBase):
    id: str
    assignment_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    assignment_type: str  # 'file_upload' or 'mcq_quiz'
    subject_id: str
    class_subject_id: str
    total_marks: float = 100.0
    passing_marks: float = 40.0
    due_date: Optional[datetime] = None


class AssignmentCreate(AssignmentBase):
    questions: Optional[List[AssignmentQuestionCreate]] = None


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignment_type: Optional[str] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    due_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    questions: Optional[List[AssignmentQuestionCreate]] = None


class AssignmentResponse(AssignmentBase):
    id: str
    teacher_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
    questions: List[AssignmentQuestionResponse] = []
    submission_count: int = 0
    question_file_url: Optional[str] = None
    question_file_name: Optional[str] = None
    question_file_mime: Optional[str] = None
    question_file_size: Optional[int] = None

    class Config:
        from_attributes = True


class AssignmentSubmissionBase(BaseModel):
    assignment_id: str
    submission_type: str  # 'file_upload' or 'mcq_answers'


class AssignmentSubmissionCreate(AssignmentSubmissionBase):
    submitted_answers: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None


class AssignmentSubmissionUpdate(BaseModel):
    marks_obtained: Optional[float] = None
    feedback: Optional[str] = None
    is_graded: bool = False


class AssignmentSubmissionResponse(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    submission_type: str
    submitted_answers: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    marks_obtained: Optional[float] = None
    total_marks: Optional[float] = None
    percentage: Optional[float] = None
    grade: Optional[str] = None
    feedback: Optional[str] = None
    is_graded: bool
    graded_by: Optional[str] = None
    graded_at: Optional[datetime] = None
    is_submitted: bool
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime]

    # Additional fields for display
    student_name: Optional[str] = None
    assignment_title: Optional[str] = None

    class Config:
        from_attributes = True


class AssignmentStatsResponse(BaseModel):
    total_assignments: int
    submitted_assignments: int
    pending_assignments: int
    graded_assignments: int
    average_score: Optional[float] = None


class MCQSubmissionData(BaseModel):
    question_id: str
    selected_answer: str
    is_correct: Optional[bool] = None
    marks: Optional[float] = None


class ClassSubjectPerformanceResponse(BaseModel):
    class_subject_id: str
    class_id: str
    class_name: Optional[str] = None
    class_section: Optional[str] = None
    subject_id: str
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None

    total_assignments: int = 0
    total_submissions: int = 0
    graded_submissions: int = 0
    average_percentage: Optional[float] = None

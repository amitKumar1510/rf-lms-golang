from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime


class AttendanceBase(BaseModel):
    student_id: str
    class_subject_id: str
    attendance_date: date
    status: str  # present, absent, late, excused
    remarks: Optional[str] = None


class AttendanceCreate(BaseModel):
    attendance_date: date
    class_subject_id: str
    attendance_records: List[dict]  # List of {student_id: str, status: str, remarks: Optional[str]}


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: str
    student_id: str
    class_subject_id: str
    academic_year: str
    attendance_date: date
    status: str
    remarks: Optional[str] = None
    marked_by: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    # Related data
    student: Optional[dict] = None
    class_subject: Optional[dict] = None
    marker: Optional[dict] = None

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    class_subject_id: str
    attendance_date: date
    total_students: int
    present_count: int
    absent_count: int
    late_count: int
    excused_count: int
    attendance_percentage: float


class ClassSubjectInfo(BaseModel):
    id: str
    class_id: str
    subject_id: str
    class_name: str
    subject_name: str
    grade_level: str
    section: str
    is_compulsory: bool
    credits: Optional[int] = None

    class Config:
        from_attributes = True


class StudentAttendanceInfo(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    roll_number: Optional[str] = None
    class_id: str
    class_name: str
    grade_level: str
    section: str

    class Config:
        from_attributes = True

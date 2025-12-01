from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class StudentSubjectBase(BaseModel):
    subject_id: str
    is_elective: Optional[bool] = False
    priority_order: Optional[int] = None


class StudentCreate(BaseModel):
    roll_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    class_id: str  # Required - students must be enrolled in a class
    admission_date: Optional[datetime] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_relation: Optional[str] = None
    subjects: List[StudentSubjectBase] = []


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None  # AddressBase fields
    roll_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    class_id: Optional[str] = None
    admission_date: Optional[datetime] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_relation: Optional[str] = None
    subjects: Optional[List[StudentSubjectBase]] = None


class StudentResponse(BaseModel):
    id: str
    user_id: str
    user: Optional[dict] = None  # User data (name, email, phone, is_active)
    roll_number: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    class_id: str
    class_info: Optional[dict] = None
    admission_date: Optional[datetime] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_relation: Optional[str] = None
    subjects: List[dict] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True


class StudentSubjectResponse(BaseModel):
    id: str
    student_id: str
    subject_id: str
    subject: dict  # Subject details
    is_elective: bool
    priority_order: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

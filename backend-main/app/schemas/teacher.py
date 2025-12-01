from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class TeacherSubjectBase(BaseModel):
    subject_id: str
    is_primary: Optional[bool] = False
    experience_years: Optional[int] = None


class TeacherCreate(BaseModel):
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    subjects: List[TeacherSubjectBase] = []


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    subjects: Optional[List[TeacherSubjectBase]] = None
    address: Optional[dict] = None  # Address dict with street, city, state, country, postal_code


class TeacherResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    subjects: List[dict] = []  # Will contain subject details with relationships
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[dict] = None  # User details including address

    class Config:
        from_attributes = True


class TeacherSubjectResponse(BaseModel):
    id: str
    teacher_id: str
    subject_id: str
    subject: dict  # Subject details
    is_primary: bool
    experience_years: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

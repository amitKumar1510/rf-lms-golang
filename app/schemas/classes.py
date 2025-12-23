from pydantic import BaseModel
from typing import Optional,List
from datetime import datetime

class ClassCreate(BaseModel):
    name: str
    grade_level: str
    section: str
    academic_year: str
    capacity: Optional[int] = None
    # school_id: str


class SessionCreate(BaseModel):
    name: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    # school_id: str



class ClassResponse(BaseModel):
    id: str
    name: str
    grade_level: str
    section: str
    academic_year: str
    capacity: Optional[int] = None
    school_id: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  

class SessionResponse(BaseModel):
    id: str
    name: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    school_id: str
    # term_count: Optional[int] = 2
    is_active: bool
    is_current: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  

class DepartmentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    school_id: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    # Filled from logged-in user scope in routes/services
    school_id: Optional[str] = None


class SubjectCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    # school_id: str

class SubjectResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    school_id: str
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  




class ClassSubjectCreate(BaseModel):
    is_compulsory: bool
    credits: Optional[int] = None


class ClassSubjectResponse(BaseModel):
    id: str
    class_id: str
    subject_id: str
    school_id: str
    subject: SubjectResponse
    is_compulsory: bool
    credits: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
    

# Class Subject Teacher Routes ------------------------------------------------------------------------------------------------------------

class TeacherResponse(BaseModel):
    id: str
    user_id: str
    name: str
    email: str
    phone: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True



class ClassSubjectTeacherCreate(BaseModel):
    class_subject_id: str
    teacher_id: str
    academic_year: Optional[str] = None
    periods_per_week: Optional[int] = None
    # percentage (0-100) stored as int in DB
    syllabus_completion: Optional[int] = None


class ClassSubjectTeacherResponse(BaseModel):
    id: str
    class_id: str
    subject_id: str
    subject: SubjectResponse
    teacher: TeacherResponse
    academic_year: Optional[str] = None
    periods_per_week: Optional[int] = None
    syllabus_completion: Optional[int] = None
    is_active: bool
    is_deleted: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
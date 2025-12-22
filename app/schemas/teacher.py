from pydantic import BaseModel, EmailStr, Field, AliasPath
from typing import List, Optional
from datetime import datetime


class AddressBase(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    class Config:
        from_attributes = True


class TeacherSubjectBase(BaseModel):
    subject_id: str
    is_primary: Optional[bool] = False
    experience_years: Optional[int] = None

    class Config:
        from_attributes = True


class TeacherDepartmentBase(BaseModel):
    department_id: str
    is_primary: Optional[bool] = False

    class Config:
        from_attributes = True


class TeacherCreate(BaseModel):
    # User fields
    name: str
    email: EmailStr
    password: str = "teacher"
    phone: Optional[str] = None
    role: str = "teacher"
    address: Optional[AddressBase] = None

    # Teacher fields
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    subjects: List[TeacherSubjectBase] = []
    departments: List[TeacherDepartmentBase] = []



class TeacherUpdate(BaseModel):
    # User fields
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None

    address: Optional[AddressBase] = None

    # Teacher fields
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    subjects: Optional[List[TeacherSubjectBase]] = None
    departments: Optional[List[TeacherDepartmentBase]] = None


class TeacherUserResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None
    school_id: Optional[str] = None
    is_active: bool
    is_deleted: bool
    address: Optional[AddressBase] = None

    class Config:
        from_attributes = True


class SubjectResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class DepartmentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ClassResponse(BaseModel):
    id: str
    name: str
    grade_level: str
    section: str
    academic_year: str
    school_id: str

    class Config:
        from_attributes = True


class TeacherResponse(BaseModel):
    id: str
    user_id: str
    school_id: str

    # convenience fields from user
    name: str = Field(validation_alias=AliasPath("user", "name"))
    email: EmailStr = Field(validation_alias=AliasPath("user", "email"))
    phone: Optional[str] = Field(default=None, validation_alias=AliasPath("user", "phone"))

    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool
    is_deleted: bool

    user: Optional[TeacherUserResponse] = None
    address: Optional[AddressBase] = Field(default=None, validation_alias=AliasPath("user", "address"))

    subjects: List["TeacherSubjectResponse"] = []
    departments: List["TeacherDepartmentResponse"] = []
    class_assignments: List["TeacherClassAssignmentResponse"] = []

    class Config:
        from_attributes = True


class TeacherSubjectResponse(BaseModel):
    id: str
    teacher_id: str
    subject_id: str
    subject: SubjectResponse
    is_primary: bool
    experience_years: Optional[int] = None
    is_active: bool
    is_deleted: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TeacherDepartmentResponse(BaseModel):
    id: str
    teacher_id: str
    department_id: str
    department: DepartmentResponse
    is_primary: bool
    is_active: bool
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClassSubjectResponse(BaseModel):
    id: str
    class_id: str
    subject_id: str
    subject: SubjectResponse
    class_info: Optional[ClassResponse] = None
    is_compulsory: bool
    credits: Optional[int] = None
    is_active: bool
    is_deleted: bool

    class Config:
        from_attributes = True


class TeacherClassAssignmentResponse(BaseModel):
    id: str
    class_subject_id: str
    teacher_id: str
    academic_year: Optional[str] = None
    periods_per_week: int
    syllabus_completion: int
    is_active: bool
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    class_subject: Optional[ClassSubjectResponse] = None

    class Config:
        from_attributes = True


TeacherResponse.model_rebuild()

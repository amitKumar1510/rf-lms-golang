from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date


class StudentSubjectBase(BaseModel):
    subject_id: str
    is_elective: Optional[bool] = False
    priority_order: Optional[int] = None

class AddressBase(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    class Config:
        from_attributes = True

class ParentCreate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    relation: Optional[str] = None
    email: Optional[str] = None
    occupation: Optional[str] = None
    education_level: Optional[str] = None
    marital_status: Optional[str] = None
    address: Optional[AddressBase] = None

    class Config:
        from_attributes = True

class ParentResponse(ParentCreate):
    id: str
    class Config:
        from_attributes = True


class StudentUserResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None
    school_id: Optional[str] = None
    is_active: bool
    is_deleted: bool

    class Config:
        from_attributes = True


class StudentCreatePayload(BaseModel):
    id: str
    user_id: str
    user: Optional[StudentUserResponse] = None
    roll_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    school_id: str
    class_id: str
    admission_date: Optional[datetime] = datetime.utcnow()
    created_at: Optional[datetime] = datetime.utcnow()
    updated_at: Optional[datetime] = None
    is_active: Optional[bool] = True
    is_deleted: Optional[bool] = False

    class Config:
        from_attributes = True

class StudentCreate(BaseModel):
    name:str
    email:EmailStr
    password:str = "student"
    phone: Optional[str] = None
    role: str = "student"
    created_at: Optional[datetime] = datetime.utcnow()

    roll_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    class_id: str  # Required - students must be enrolled in a class
    admission_date: Optional[datetime] = datetime.utcnow()
    parent: Optional[ParentCreate] = None
    # subjects: List[StudentSubjectBase] = []
    # address: Optional[AddressBase] = None

class StudentResponse(BaseModel):
    id: str
    user_id: str
    user: Optional[dict] = None
    roll_number: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    class_id: str
    admission_date: Optional[datetime] = None
    parent: Optional[ParentCreate] = None
    address: Optional[AddressBase] = None
    created_at: Optional[datetime] = datetime.utcnow()
    updated_at: Optional[datetime] = None
    is_active: Optional[bool] = True

class StudentCreateResponse(BaseModel):
    # Matches StudentService.create_student() return:
    # { "student": Student, "parent": StudentsParent | None, "address": Address }
    student: StudentCreatePayload
    parent: Optional[ParentResponse] = None
    address: Optional[AddressBase] = None

    class Config:
        from_attributes = True

















# class StudentUpdate(BaseModel):
#     name: Optional[str] = None
#     email: Optional[str] = None
#     phone: Optional[str] = None
#     address: Optional[dict] = None  # AddressBase fields
#     roll_number: Optional[str] = None
#     date_of_birth: Optional[datetime] = None
#     gender: Optional[str] = None
#     blood_group: Optional[str] = None
#     class_id: Optional[str] = None
#     admission_date: Optional[datetime] = None
#     guardian_name: Optional[str] = None
#     guardian_phone: Optional[str] = None
#     guardian_relation: Optional[str] = None
#     subjects: Optional[List[StudentSubjectBase]] = None


# class StudentResponse(BaseModel):
#     id: str
#     user_id: str
#     user: Optional[dict] = None  # User data (name, email, phone, is_active)
#     roll_number: Optional[str] = None
#     date_of_birth: Optional[datetime] = None
#     gender: Optional[str] = None
#     blood_group: Optional[str] = None
#     class_id: str
#     class_info: Optional[dict] = None
#     admission_date: Optional[datetime] = None
#     guardian_name: Optional[str] = None
#     guardian_phone: Optional[str] = None
#     guardian_relation: Optional[str] = None
#     subjects: List[dict] = []
#     created_at: datetime
#     updated_at: Optional[datetime] = None
#     is_active: Optional[bool] = True

#     class Config:
#         from_attributes = True


# class StudentSubjectResponse(BaseModel):
#     id: str
#     student_id: str
#     subject_id: str
#     subject: dict  # Subject details
#     is_elective: bool
#     priority_order: Optional[int] = None
#     created_at: datetime

#     class Config:
#         from_attributes = True


# # Student Dashboard Schemas
# class StudentGradeResponse(BaseModel):
#     id: str
#     subject: dict  # Subject details
#     academic_year: str
#     midterm_marks: Optional[float] = None
#     final_marks: Optional[float] = None
#     grade: Optional[str] = None
#     attendance_percentage: Optional[float] = None
#     status: str  # enrolled, completed, etc.
#     teacher: Optional[str] = None
#     created_at: Optional[datetime] = None
#     updated_at: Optional[datetime] = None


# class StudentSubjectInfo(BaseModel):
#     id: str
#     subject_id: str
#     subject: dict  # Subject details (name, code, description)
#     teacher: Optional[dict] = None  # Teacher details (name, email, qualification)
#     is_elective: bool
#     is_compulsory: Optional[bool] = None
#     credits: Optional[int] = None
#     academic_year: Optional[str] = None
#     enrolled_at: Optional[datetime] = None


# class StudentAttendanceSubject(BaseModel):
#     name: str
#     percentage: float
#     present: int
#     total: int


# class StudentAttendanceResponse(BaseModel):
#     overall: float
#     subjects: List[StudentAttendanceSubject]


# class StudentDashboardProfile(BaseModel):
#     id: str
#     name: str
#     email: str
#     roll_number: Optional[str] = None
#     class_name: Optional[str] = None
#     date_of_birth: Optional[datetime] = None
#     gender: Optional[str] = None
#     blood_group: Optional[str] = None
#     admission_date: Optional[datetime] = None
#     guardian_name: Optional[str] = None
#     guardian_phone: Optional[str] = None
#     address: Optional[dict] = None  # Address details


# class StudentDashboardResponse(BaseModel):
#     profile: StudentDashboardProfile
#     subjects: List[StudentSubjectInfo]
#     grades: List[StudentGradeResponse]
#     attendance: StudentAttendanceResponse
#     quick_stats: dict  # overall_attendance, current_gpa, etc.

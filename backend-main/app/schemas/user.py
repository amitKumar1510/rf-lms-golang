from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# Request Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # Optional role filter for login


class AddressBase(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None


class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class SubjectResponse(SubjectBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ClassBase(BaseModel):
    name: str
    grade_level: str
    section: str
    academic_session: str
    capacity: Optional[int] = None
    class_teacher_id: Optional[str] = None
    term: Optional[str] = None


class ClassResponse(BaseModel):
    id: str
    name: str
    grade_level: str
    section: str
    academic_session: Optional[str] = None
    academic_year: Optional[str] = None  # Keep for backward compatibility
    capacity: Optional[int] = None
    class_teacher_id: Optional[str] = None
    term: Optional[str] = None
    school_id: str
    is_active: bool
    created_at: datetime
    student_count: Optional[int] = None  # Current number of students in class
    available_seats: Optional[int] = None  # Available seats (capacity - student_count)

    class Config:
        from_attributes = True
    
    @model_validator(mode='after')
    def set_academic_session(self):
        """Ensure academic_session is set from academic_year if not present"""
        if not self.academic_session and self.academic_year:
            self.academic_session = self.academic_year
        elif not self.academic_year and self.academic_session:
            self.academic_year = self.academic_session
        return self


class ClassSubjectBase(BaseModel):
    subject_id: str
    is_compulsory: Optional[bool] = True
    credits: Optional[int] = None


class ClassSubjectUpdate(BaseModel):
    is_compulsory: Optional[bool] = None
    credits: Optional[int] = None


class ClassSubjectResponse(BaseModel):
    id: str
    class_id: str
    subject_id: str
    subject: dict  # Subject details
    is_compulsory: bool
    credits: Optional[int] = None
    teachers: List[dict] = []  # Assigned teachers
    created_at: datetime

    class Config:
        from_attributes = True


class ClassSubjectTeacherBase(BaseModel):
    teacher_id: str
    academic_year: Optional[str] = None


class ClassSubjectTeacherResponse(BaseModel):
    id: str
    class_subject_id: str
    teacher_id: str
    teacher: dict  # Teacher details
    academic_year: Optional[str] = None
    periods_per_week: int
    syllabus_completion: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StudentSubjectEnrollmentBase(BaseModel):
    midterm_marks: Optional[int] = None
    final_marks: Optional[int] = None
    grade: Optional[str] = None
    attendance_percentage: Optional[int] = None
    status: Optional[str] = "enrolled"


class StudentSubjectEnrollmentResponse(BaseModel):
    id: str
    student_id: str
    class_subject_id: str
    class_subject: dict  # Class subject details
    enrollment_date: datetime
    academic_year: Optional[str] = None
    midterm_marks: Optional[int] = None
    final_marks: Optional[int] = None
    grade: Optional[str] = None
    attendance_percentage: int
    status: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TeacherSubjectBase(BaseModel):
    subject_id: str
    is_primary: Optional[bool] = False
    experience_years: Optional[int] = None


class TeacherCreate(BaseModel):
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    subjects: List[TeacherSubjectBase] = []


class TeacherResponse(BaseModel):
    id: str
    user_id: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    subjects: List[dict] = []  # Will contain subject details
    created_at: datetime

    class Config:
        from_attributes = True


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


class StudentResponse(BaseModel):
    id: str
    user_id: str
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

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Optional[str] = None  # Made optional for admin creation
    school_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[AddressBase] = None

    @model_validator(mode='after')
    def validate_school_id_for_non_admin(self):
        # Skip validation if role is not set (will be set in route handler)
        if not self.role:
            return self

        # Admin users don't need school_id (they manage all schools)
        # All other user types must have school_id
        if self.role != "admin" and not self.school_id:
            raise ValueError(f"school_id is required for {self.role} users")
        if self.role == "admin" and self.school_id:
            raise ValueError("school_id should not be provided for admin users")
            return self


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    address: Optional[AddressBase] = None


class SchoolCreate(BaseModel):
    name: str
    address: Optional[AddressBase] = None
    phone: Optional[str] = None
    email: Optional[str] = None


# Response Schemas
class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    school_id: Optional[str] = None
    phone: Optional[str] = None
    student_id: Optional[str] = None
    teacher_id: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    address: Optional[AddressBase] = None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

    @model_validator(mode='after')
    def convert_address(self):
        """Convert SQLAlchemy Address model to AddressBase schema"""
        if self.address and not isinstance(self.address, AddressBase):
            # Convert SQLAlchemy model to AddressBase
            address_dict = {}
            if hasattr(self.address, 'street'):
                address_dict['street'] = self.address.street
            if hasattr(self.address, 'city'):
                address_dict['city'] = self.address.city
            if hasattr(self.address, 'state'):
                address_dict['state'] = self.address.state
            if hasattr(self.address, 'country'):
                address_dict['country'] = self.address.country
            if hasattr(self.address, 'postal_code'):
                address_dict['postal_code'] = self.address.postal_code

            self.address = AddressBase(**address_dict)
        return self


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    message: str


class SchoolResponse(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool
    admin_id: str
    created_at: datetime
    subadmins: Optional[List[UserResponse]] = []

    class Config:
        from_attributes = True


class TeacherUserCreate(BaseModel):
    """Combined schema for creating a teacher user"""
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    address: Optional[AddressBase] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    subjects: List[Dict[str, Any]] = []  # List of {subject_id, is_primary, experience_years}


class StudentUserCreate(BaseModel):
    """Combined schema for creating a student user"""
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    address: Optional[AddressBase] = None
    roll_number: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format string
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    class_id: str  # Required
    admission_date: Optional[str] = None  # ISO format string
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    guardian_relation: Optional[str] = None
    subjects: List[Dict[str, Any]] = []  # List of {subject_id, is_elective, priority_order}


class PrincipleUserCreate(BaseModel):
    """Combined schema for creating a principle user"""
    email: EmailStr
    password: Optional[str] = "principle"  # Default password
    name: str
    phone: Optional[str] = None
    address: Optional[AddressBase] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    office_phone: Optional[str] = None
    office_email: Optional[str] = None

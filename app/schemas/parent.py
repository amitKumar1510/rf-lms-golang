from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class AddressBase(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    class Config:
        from_attributes = True


class ParentMeResponse(BaseModel):
    id: str
    student_id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    relation: Optional[str] = None
    role: str
    school_id: Optional[str] = None

    occupation: Optional[str] = None
    education_level: Optional[str] = None
    marital_status: Optional[str] = None
    address: Optional[AddressBase] = None

    is_active: bool
    is_deleted: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ParentLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ParentLoginResponse(BaseModel):
    access_token: str
    token_type: str
    message: str


class ChangePasswordRequest(BaseModel):
    new_password: str


class ForgetPassword(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

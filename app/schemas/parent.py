from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ParentCreate(BaseModel):
    occupation: Optional[str] = None
    education_level: Optional[str] = None
    marital_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    number_of_children: Optional[int] = None


class ParentUpdate(BaseModel):
    occupation: Optional[str] = None
    education_level: Optional[str] = None
    marital_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    number_of_children: Optional[int] = None


class ParentResponse(BaseModel):
    id: str
    user_id: str
    occupation: Optional[str] = None
    education_level: Optional[str] = None
    marital_status: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relation: Optional[str] = None
    number_of_children: Optional[int] = None
    children: List[dict] = []  # Associated student information
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ParentLoginResponse(BaseModel):
    access_token: str
    token_type: str
    message: str


class ChangePasswordRequest(BaseModel):
    new_password: str


class ForgetPassword(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str

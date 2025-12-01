from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PrincipleCreate(BaseModel):
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    designation: Optional[str] = None
    assigned_school_id: Optional[str] = None
    office_phone: Optional[str] = None
    office_email: Optional[str] = None


class PrincipleUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    designation: Optional[str] = None
    assigned_school_id: Optional[str] = None
    office_phone: Optional[str] = None
    office_email: Optional[str] = None


class PrincipleResponse(BaseModel):
    id: str
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    designation: Optional[str] = None
    assigned_school_id: Optional[str] = None
    assigned_school: Optional[dict] = None
    office_phone: Optional[str] = None
    office_email: Optional[str] = None
    user: Optional[dict] = None  # User details (name, email, phone, is_active, address)
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

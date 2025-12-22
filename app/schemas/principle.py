from pydantic import BaseModel, EmailStr, Field, AliasPath
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


class SchoolResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


class PrincipleUserResponse(BaseModel):
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


class PrincipleCreate(BaseModel):
    # user fields
    name: str
    email: EmailStr
    password: str = "principle"
    phone: Optional[str] = None
    role: str = "principle"
    address: Optional[AddressBase] = None

    # principle fields
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    designation: Optional[str] = None
    assigned_school_id: Optional[str] = None
    office_phone: Optional[str] = None
    office_email: Optional[str] = None


class PrincipleUpdate(BaseModel):
    # user fields
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    address: Optional[AddressBase] = None

    # principle fields
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
    # convenience fields from user
    name: str = Field(validation_alias=AliasPath("user", "name"))
    email: EmailStr = Field(validation_alias=AliasPath("user", "email"))
    phone: Optional[str] = Field(default=None, validation_alias=AliasPath("user", "phone"))

    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    specialization: Optional[str] = None
    designation: Optional[str] = None
    assigned_school_id: Optional[str] = None
    assigned_school: Optional[SchoolResponse] = None
    office_phone: Optional[str] = None
    office_email: Optional[str] = None
    is_active: bool
    is_deleted: bool
    user: Optional[PrincipleUserResponse] = None
    address: Optional[AddressBase] = Field(default=None, validation_alias=AliasPath("user", "address"))
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

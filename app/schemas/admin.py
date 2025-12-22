from pydantic import BaseModel
from typing import Optional
from pydantic import EmailStr
from datetime import datetime

class AddressBase(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    class Config:
        from_attributes = True

class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "admin"
    name: str
    phone: Optional[str] = None
    address: Optional[AddressBase] = None
    created_at: Optional[datetime] = datetime.utcnow()


class SchoolCreate(BaseModel):
    name: str
    address: Optional[AddressBase] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class SubadminCreate(BaseModel):
    email: EmailStr
    password: str = "subadmin"
    name: str
    role: str = "subadmin"
    school_id: str
    phone: Optional[str] = None
    address: Optional[AddressBase] = None
    created_at: Optional[datetime] = datetime.utcnow()


class SubadminResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    role: str
    school_id: str
    phone: Optional[str] = None
    address: Optional[AddressBase] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: bool
    is_deleted: bool
    image_url: Optional[str] = None
    class Config:
        from_attributes = True

class schoolResponse(BaseModel):
    id: str
    name: str
    address: Optional[AddressBase] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: bool
    admin_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class adminResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None
    # address: Optional[AddressBase] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AdminCreateResponse(BaseModel):
    admin: adminResponse
    admin_address: AddressBase

    class Config:
        from_attributes = True

class AdminResponse(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    role: str
    phone: Optional[str] = None
    address: Optional[AddressBase] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SchoolResponse(BaseModel):
    id: str
    name: str
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: bool
    admin_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


        
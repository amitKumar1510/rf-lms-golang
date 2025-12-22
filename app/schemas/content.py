from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Module Schemas
class ModuleBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: Optional[int] = 0


class ModuleCreate(ModuleBase):
    subject_id: str
    pass


class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    subject_id: Optional[str] = None


class ModuleResponse(ModuleBase):
    id: str
    subject_id: str
    submodules: Optional[List['SubmoduleResponse']] = []
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Submodule Schemas
class SubmoduleBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: Optional[int] = 0


class SubmoduleCreate(SubmoduleBase):
    module_id: str
    pass


class SubmoduleUpdate(BaseModel):
    module_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None


class SubmoduleResponse(SubmoduleBase):
    id: str
    module_id: str
    contents: Optional[List['ContentResponse']] = []
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Content Schemas
class ContentBase(BaseModel):
    title: str
    content_type: str  # "ppt", "pdf", "video", "text", "image", "other"
    content_data: Optional[str] = None  # For text content
    file_url: Optional[str] = None  # URL/path to uploaded file
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    order_index: Optional[int] = 0


class ContentCreate(ContentBase):
    pass


class ContentUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = None
    content_data: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    order_index: Optional[int] = None


class ContentResponse(ContentBase):
    id: str
    submodule_id: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Update forward references
ModuleResponse.model_rebuild()
SubmoduleResponse.model_rebuild()


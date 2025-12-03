from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class Module(Base):
    __tablename__ = "modules"

    id = Column(String, primary_key=True, index=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Module 1", "Introduction to Algebra"
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)  # For ordering modules within a subject
    
    # Relationships
    subject = relationship("Subject", back_populates="modules")
    submodules = relationship("Submodule", back_populates="module", cascade="all, delete-orphan", order_by="Submodule.order_index")
    
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Submodule(Base):
    __tablename__ = "submodules"

    id = Column(String, primary_key=True, index=True)
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Submodule 1", "Basic Concepts"
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)  # For ordering submodules within a module
    
    # Relationships
    module = relationship("Module", back_populates="submodules")
    contents = relationship("Content", back_populates="submodule", cascade="all, delete-orphan", order_by="Content.order_index")
    
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Content(Base):
    __tablename__ = "contents"

    id = Column(String, primary_key=True, index=True)
    submodule_id = Column(String, ForeignKey("submodules.id"), nullable=False)
    title = Column(String, nullable=False)
    content_type = Column(String, nullable=False)  # "ppt", "pdf", "video", "text", "image", "other"
    content_data = Column(Text, nullable=True)  # For text content or JSON data
    file_url = Column(String, nullable=True)  # URL/path to uploaded file (PPT, PDF, etc.)
    file_name = Column(String, nullable=True)  # Original file name
    file_size = Column(Integer, nullable=True)  # File size in bytes
    mime_type = Column(String, nullable=True)  # MIME type of the file
    order_index = Column(Integer, default=0)  # For ordering content within a submodule
    
    # Relationships
    submodule = relationship("Submodule", back_populates="contents")
    
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


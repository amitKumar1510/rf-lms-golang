from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.content import Module, Submodule, Content
from app.models.users import Subject
from app.core.utils_functions import generate_id
from typing import List, Optional


class ContentService:
    # Module operations
    @staticmethod
    def create_module(db: Session, module_data: dict) -> Module:
        """Create a new module for a subject"""
        # Verify subject exists
        subject = db.query(Subject).filter(Subject.id == module_data["subject_id"]).first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found"
            )
        
        module = Module(
            id=generate_id(f"{subject.name}_{module_data['name']}_module"),
            subject_id=module_data["subject_id"],
            name=module_data["name"],
            description=module_data.get("description"),
            order_index=module_data.get("order_index", 0)
        )
        
        db.add(module)
        db.commit()
        db.refresh(module)
        return module
    
    @staticmethod
    def get_modules_by_subject(db: Session, subject_id: str) -> List[Module]:
        """Get all modules for a subject"""
        return db.query(Module).filter(
            Module.subject_id == subject_id,
            Module.is_deleted == False
        ).order_by(Module.order_index).all()
    
    @staticmethod
    def get_module_by_id(db: Session, module_id: str) -> Optional[Module]:
        """Get module by ID"""
        return db.query(Module).filter(
            Module.id == module_id,
            Module.is_deleted == False
        ).first()
    
    @staticmethod
    def update_module(db: Session, module_id: str, update_data: dict) -> Module:
        """Update a module"""
        module = ContentService.get_module_by_id(db, module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found"
            )
        
        if "name" in update_data:
            module.name = update_data["name"]
        if "description" in update_data:
            module.description = update_data["description"]
        if "order_index" in update_data:
            module.order_index = update_data["order_index"]
        
        db.commit()
        db.refresh(module)
        return module
    
    @staticmethod
    def delete_module(db: Session, module_id: str) -> bool:
        """Delete a module (soft delete)"""
        module = ContentService.get_module_by_id(db, module_id)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found"
            )
        
        module.is_deleted = True
        module.is_active = False
        db.commit()
        return True
    
    # Submodule operations
    @staticmethod
    def create_submodule(db: Session, submodule_data: dict) -> Submodule:
        """Create a new submodule for a module"""
        # Verify module exists
        module = ContentService.get_module_by_id(db, submodule_data["module_id"])
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Module not found"
            )
        
        submodule = Submodule(
            id=generate_id(f"{module.name}_{submodule_data['name']}_submodule"),
            module_id=submodule_data["module_id"],
            name=submodule_data["name"],
            description=submodule_data.get("description"),
            order_index=submodule_data.get("order_index", 0)
        )
        
        db.add(submodule)
        db.commit()
        db.refresh(submodule)
        return submodule
    
    @staticmethod
    def get_submodules_by_module(db: Session, module_id: str) -> List[Submodule]:
        """Get all submodules for a module"""
        return db.query(Submodule).filter(
            Submodule.module_id == module_id,
            Submodule.is_deleted == False
        ).order_by(Submodule.order_index).all()
    
    @staticmethod
    def get_submodule_by_id(db: Session, submodule_id: str) -> Optional[Submodule]:
        """Get submodule by ID"""
        return db.query(Submodule).filter(
            Submodule.id == submodule_id,
            Submodule.is_deleted == False
        ).first()
    
    @staticmethod
    def update_submodule(db: Session, submodule_id: str, update_data: dict) -> Submodule:
        """Update a submodule"""
        submodule = ContentService.get_submodule_by_id(db, submodule_id)
        if not submodule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submodule not found"
            )
        
        if "name" in update_data:
            submodule.name = update_data["name"]
        if "description" in update_data:
            submodule.description = update_data["description"]
        if "order_index" in update_data:
            submodule.order_index = update_data["order_index"]
        
        db.commit()
        db.refresh(submodule)
        return submodule
    
    @staticmethod
    def delete_submodule(db: Session, submodule_id: str) -> bool:
        """Delete a submodule (soft delete)"""
        submodule = ContentService.get_submodule_by_id(db, submodule_id)
        if not submodule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submodule not found"
            )
        
        submodule.is_deleted = True
        submodule.is_active = False
        db.commit()
        return True
    
    # Content operations
    @staticmethod
    def create_content(db: Session, content_data: dict) -> Content:
        """Create new content for a submodule"""
        # Verify submodule exists
        submodule = ContentService.get_submodule_by_id(db, content_data["submodule_id"])
        if not submodule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Submodule not found"
            )
        
        content = Content(
            id=generate_id(f"{submodule.name}_{content_data['title']}_content"),
            submodule_id=content_data["submodule_id"],
            title=content_data["title"],
            content_type=content_data["content_type"],
            content_data=content_data.get("content_data"),
            file_url=content_data.get("file_url"),
            file_name=content_data.get("file_name"),
            file_size=content_data.get("file_size"),
            mime_type=content_data.get("mime_type"),
            order_index=content_data.get("order_index", 0)
        )
        
        db.add(content)
        db.commit()
        db.refresh(content)
        return content
    
    @staticmethod
    def get_contents_by_submodule(db: Session, submodule_id: str) -> List[Content]:
        """Get all contents for a submodule"""
        return db.query(Content).filter(
            Content.submodule_id == submodule_id,
            Content.is_deleted == False
        ).order_by(Content.order_index).all()
    
    @staticmethod
    def get_content_by_id(db: Session, content_id: str) -> Optional[Content]:
        """Get content by ID"""
        return db.query(Content).filter(
            Content.id == content_id,
            Content.is_deleted == False
        ).first()
    
    @staticmethod
    def update_content(db: Session, content_id: str, update_data: dict) -> Content:
        """Update content"""
        content = ContentService.get_content_by_id(db, content_id)
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found"
            )
        
        updatable_fields = ["title", "content_type", "content_data", "file_url", 
                          "file_name", "file_size", "mime_type", "order_index"]
        for field in updatable_fields:
            if field in update_data:
                setattr(content, field, update_data[field])
        
        db.commit()
        db.refresh(content)
        return content
    
    @staticmethod
    def delete_content(db: Session, content_id: str) -> bool:
        """Delete content (soft delete)"""
        content = ContentService.get_content_by_id(db, content_id)
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Content not found"
            )
        
        content.is_deleted = True
        content.is_active = False
        db.commit()
        return True
    
    @staticmethod
    def get_subject_content_tree(db: Session, subject_id: str) -> dict:
        """Get complete content tree for a subject (modules -> submodules -> contents)"""
        modules = ContentService.get_modules_by_subject(db, subject_id)
        result = []
        
        for module in modules:
            submodules = ContentService.get_submodules_by_module(db, module.id)
            submodule_list = []
            
            for submodule in submodules:
                contents = ContentService.get_contents_by_submodule(db, submodule.id)
                content_list = [
                    {
                        "id": c.id,
                        "title": c.title,
                        "content_type": c.content_type,
                        "content_data": c.content_data,
                        "file_url": c.file_url,
                        "file_name": c.file_name,
                        "file_size": c.file_size,
                        "mime_type": c.mime_type,
                        "order_index": c.order_index,
                        "created_at": c.created_at.isoformat() if c.created_at else None
                    }
                    for c in contents
                ]
                
                submodule_list.append({
                    "id": submodule.id,
                    "name": submodule.name,
                    "description": submodule.description,
                    "order_index": submodule.order_index,
                    "contents": content_list,
                    "created_at": submodule.created_at.isoformat() if submodule.created_at else None
                })
            
            result.append({
                "id": module.id,
                "name": module.name,
                "description": module.description,
                "order_index": module.order_index,
                "submodules": submodule_list,
                "created_at": module.created_at.isoformat() if module.created_at else None
            })
        
        return {"subject_id": subject_id, "modules": result}


from fastapi import HTTPException, status, Request, Response
from app.models.content import Module
from app.schemas.content import ModuleCreate, ModuleUpdate, ModuleResponse
from app.core.utils_functions import generate_id
from datetime import timedelta, datetime
from sqlalchemy.orm import Session, joinedload

class ModuleService:
    def create_module(db: Session, data: ModuleCreate):
        module = Module(
            id=generate_id("module"),
            name=data.name,
            description=data.description,
            order_index=data.order_index,
            subject_id=data.subject_id,
        )
        db.add(module)
        db.commit()
        db.refresh(module)
        return ModuleResponse.model_validate(module)


    def get_module(db: Session, module_id: str, subject_id: str):
        module = db.query(Module).filter(Module.id == module_id, Module.subject_id == subject_id, Module.is_deleted == False).first()
        if not module:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
        return ModuleResponse.model_validate(module)

    def get_all_modules(db: Session, subject_id: str):
        # Return both active and inactive modules for management UI; exclude only deleted.
        modules = db.query(Module).filter(Module.subject_id == subject_id, Module.is_deleted == False).all()
        return [ModuleResponse.model_validate(module) for module in modules]

    def update_module(db: Session, module_id: str, data: ModuleUpdate, subject_id: str):
        module = ModuleService.get_module(db, module_id, subject_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(module, field, value)
        db.commit()
        db.refresh(module)
        return ModuleResponse.model_validate(module)

    def delete_module(db: Session, module_id: str, subject_id: str):
        module = ModuleService.get_module(db, module_id, subject_id)
        module.is_deleted = True
        db.commit()
        db.refresh(module)
        return {
            "message": "Module deleted successfully"
        }
        
    @staticmethod
    def deactivate_module(db: Session, module_id: str, subject_id: str):
        module = ModuleService.get_module(db, module_id, subject_id)
        module.is_active = False
        db.commit()
        db.refresh(module)
        return {
            "message": "Module deactivated successfully"
        }
        
    @staticmethod
    def activate_module(db: Session, module_id: str, subject_id: str):
        module = ModuleService.get_module(db, module_id, subject_id)
        module.is_active = True
        db.commit()
        db.refresh(module)
        return { "message": "Module activated successfully" }



        
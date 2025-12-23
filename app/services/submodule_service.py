from fastapi import HTTPException, status, Request, Response
from app.models.content import Submodule
from app.schemas.content import SubmoduleCreate, SubmoduleUpdate, SubmoduleResponse
from app.core.utils_functions import generate_id
from sqlalchemy.orm import Session, joinedload

class SubmoduleService:
    def create_submodule(db: Session, data: SubmoduleCreate):
        submodule = Submodule(
            id=generate_id("submodule"),
            name=data.name,
            description=data.description,
            order_index=data.order_index,
            module_id=data.module_id,
        )
        db.add(submodule)
        db.commit()
        db.refresh(submodule)
        return SubmoduleResponse.model_validate(submodule)

    def get_submodule(db: Session, submodule_id: str, module_id: str):
        submodule = db.query(Submodule).filter(Submodule.id == submodule_id, Submodule.module_id == module_id, Submodule.is_deleted == False).first()
        if not submodule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submodule not found")
        return SubmoduleResponse.model_validate(submodule)

    def get_all_submodules(db: Session, module_id: str):
        # Return both active and inactive submodules for management UI; exclude only deleted.
        submodules = db.query(Submodule).filter(Submodule.module_id == module_id, Submodule.is_deleted == False).all()
        return [SubmoduleResponse.model_validate(submodule) for submodule in submodules]

    def update_submodule(db: Session, submodule_id: str, data: SubmoduleUpdate, module_id: str):
        submodule = db.query(Submodule).filter(Submodule.id == submodule_id, Submodule.module_id == module_id, Submodule.is_deleted == False).first()
        if not submodule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submodule not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(submodule, field, value)
        db.commit()
        db.refresh(submodule)
        return SubmoduleResponse.model_validate(submodule)

    def delete_submodule(db: Session, submodule_id: str, module_id: str):
        submodule = db.query(Submodule).filter(Submodule.id == submodule_id, Submodule.module_id == module_id, Submodule.is_deleted == False).first()
        if not submodule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submodule not found")
        submodule.is_deleted = True
        db.commit()
        db.refresh(submodule)
        return {
            "message": "Submodule deleted successfully"
        }

    def deactivate_submodule(db: Session, submodule_id: str, module_id: str):
        submodule = db.query(Submodule).filter(Submodule.id == submodule_id, Submodule.module_id == module_id, Submodule.is_deleted == False).first()
        if not submodule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submodule not found")
        submodule.is_active = False
        db.commit()
        db.refresh(submodule)
        return {
            "message": "Submodule deactivated successfully"
        }
        
    def activate_submodule(db: Session, submodule_id: str, module_id: str):
        submodule = db.query(Submodule).filter(Submodule.id == submodule_id, Submodule.module_id == module_id, Submodule.is_deleted == False).first()
        if not submodule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submodule not found")
        submodule.is_active = True
        db.commit()
        db.refresh(submodule)
        return {
            "message": "Submodule activated successfully"
        }
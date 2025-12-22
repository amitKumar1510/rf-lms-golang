from app.models.users import School
from app.core.utils_functions import generate_id
from sqlalchemy.orm import Session
from app.schemas.admin import SchoolCreate
from fastapi import HTTPException, status



class SchoolService:
    def create_school(db: Session, school: SchoolCreate, admin_id: str):
        school = School(
            id=generate_id("school"),
            name=school.name,
            street=school.address.street,
            city=school.address.city,
            state=school.address.state,
            country=school.address.country,
            postal_code=school.address.postal_code,
            phone=school.phone,
            email=school.email,
            is_active=True,
            admin_id=admin_id,
        )
        db.add(school)
        db.commit()
        db.refresh(school)
        return school

    def get_school(db: Session, school_id: str):
        return db.query(School).filter(School.id == school_id, School.is_deleted == False).first()

    def get_school_by_admin_id(db: Session, admin_id: str):
        return db.query(School).filter(School.admin_id == admin_id, School.is_deleted == False).first()

    def update_school(db: Session, school_id: str, school_data: SchoolCreate):
        school = db.query(School).filter(School.id == school_id, School.is_deleted == False).first()
        if not school:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")

        for field, value in school_data.model_dump(exclude_unset=True).items():
            setattr(school, field, value)
        db.commit()
        db.refresh(school)
        return school

    def delete_school(db: Session, school_id: str):
        school = db.query(School).filter(School.id == school_id, School.is_deleted == False).first()
        if not school:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
        school.is_deleted = True
        db.commit()
        db.refresh(school)
        return {"message": "School deleted successfully"}

    def get_all_schools(db: Session):
        return db.query(School).filter(School.is_active == True, School.is_deleted == False).all()

    def deactivate_school(db: Session, school_id: str):
        school = db.query(School).filter(School.id == school_id, School.is_deleted == False).first()
        if not school:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
        school.is_active = False
        db.commit()
        db.refresh(school)
        return {"message": "School deactivated successfully"}
        
    def activate_school(db: Session, school_id: str):
        school = db.query(School).filter(School.id == school_id, School.is_deleted == False).first()
        if not school:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
        school.is_active = True
        db.commit()
        db.refresh(school)
        return {"message": "School activated successfully"}
        
    
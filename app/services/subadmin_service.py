
from app.core.utils_functions import generate_id
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from app.schemas.admin import SubadminCreate, SubadminResponse
from fastapi import HTTPException, status
from app.services.user_service import UserService
from app.models.users import User,Address
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.users import Class, Subject, Department, AcademicSession
from sqlalchemy import func


class SubadminService:

    def create_subadmin(db: Session, admin_id: str, subadmin: SubadminCreate):
        created_by = admin_id
        subadmin_user = UserService.create_user(db,  subadmin, created_by)
        subadmin_address = Address(
            id=generate_id("add"),
            street=subadmin.address.street,
            city=subadmin.address.city,
            state=subadmin.address.state,
            country=subadmin.address.country,
            postal_code=subadmin.address.postal_code,
            user_id=subadmin_user.user_id,   
        )
        db.add(subadmin_address)
        db.commit()
        db.refresh(subadmin_address)
        return subadmin_user


    def get_subadmin(db: Session, email: str):
        subadmin = UserService.get_user(db, email)
        if not subadmin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subadmin not found")
        return SubadminResponse.model_validate(subadmin)

    
    def get_subadmin_by_school_id(db: Session, school_id: str):
        subadmins = (
            db.query(User)
            .options(joinedload(User.address))
            .filter(
                User.school_id == school_id,
                User.role == "subadmin",
                User.is_deleted == False,
                User.address.has(Address.is_deleted == False),
            )
            .all()
        )
        if not subadmins:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subadmins not found")
        return [SubadminResponse.model_validate(subadmin) for subadmin in subadmins]

    def get_subadmin_by_id(db: Session, subadmin_id: str):
        subadmin = (
            db.query(User)
            .options(joinedload(User.address))
            .filter(
                User.user_id == subadmin_id,
                User.is_deleted == False,
                User.address.has(Address.is_deleted == False),
            )
            .first()
        )
        if not subadmin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subadmin not found")
        return SubadminResponse.model_validate(subadmin)



    def update_subadmin(db: Session, subadmin_id: str, subadmin_data: SubadminCreate):
        subadmin = (
            db.query(User)
            .options(joinedload(User.address))
            .filter(
                User.user_id == subadmin_id,
                User.is_deleted == False,
                User.address.has(Address.is_deleted == False),
            )
            .first()
        )
        if not subadmin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subadmin not found")
        payload = subadmin_data.model_dump(exclude_unset=True)
        address_payload = payload.pop("address", None)

        # Update scalar User fields (avoid assigning dicts to ORM relationships)
        for field, value in payload.items():
            setattr(subadmin, field, value)

        # Update nested address fields (if provided)
        if address_payload is not None:
            if subadmin.address is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Address not found")
            for field, value in address_payload.items():
                setattr(subadmin.address, field, value)

        db.commit()
        db.refresh(subadmin)
        return SubadminResponse.model_validate(subadmin)



    def delete_subadmin(db: Session, subadmin_id: str):
        subadmin = (
            db.query(User)
            .options(joinedload(User.address))
            .filter(
                User.user_id == subadmin_id,
                User.is_deleted == False,
                User.address.has(Address.is_deleted == False),
            )
            .first()
        )
        if not subadmin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subadmin not found")
        subadmin.is_deleted = True
        subadmin.address.is_deleted = True
        db.commit()
        db.refresh(subadmin)
        db.refresh(subadmin.address)
        return {
            "message": "Subadmin deleted successfully"
        }

    
    def deactivate_subadmin(db: Session, subadmin_id: str):
        subadmin = (
            db.query(User)
            .options(joinedload(User.address))
            .filter(
                User.user_id == subadmin_id,
                User.is_deleted == False,
                User.address.has(Address.is_deleted == False),
            )
            .first()
        )
        if not subadmin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subadmin not found")
        subadmin.is_active = False
        subadmin.address.is_active = False
        db.commit()
        db.refresh(subadmin)
        db.refresh(subadmin.address)
        return {
            "message": "Subadmin deactivated successfully"
        }

    
    def activate_subadmin(db: Session, subadmin_id: str):
        subadmin = (
            db.query(User)
            .options(joinedload(User.address))
            .filter(
                User.user_id == subadmin_id,
                User.is_deleted == False,
                User.address.has(Address.is_deleted == False),
            )
            .first()
        )
        if not subadmin:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subadmin not found")
        subadmin.is_active = True
        subadmin.address.is_active = True
        db.commit()
        db.refresh(subadmin)
        db.refresh(subadmin.address)
        return {
            "message": "Subadmin activated successfully"
        }

    @staticmethod
    def get_overview_counts(db: Session, school_id: str):
        if not school_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="school_id is required")

        total_teachers = db.query(func.count(Teacher.id)).filter(
            Teacher.school_id == school_id,
            Teacher.is_deleted == False,
        ).scalar() or 0

        total_students = db.query(func.count(Student.id)).filter(
            Student.school_id == school_id,
            Student.is_deleted == False,
        ).scalar() or 0

        total_classes = db.query(func.count(Class.id)).filter(
            Class.school_id == school_id,
            Class.is_deleted == False,
        ).scalar() or 0

        total_subjects = db.query(func.count(Subject.id)).filter(
            Subject.school_id == school_id,
            Subject.is_deleted == False,
        ).scalar() or 0

        total_departments = db.query(func.count(Department.id)).filter(
            Department.school_id == school_id,
            Department.is_deleted == False,
        ).scalar() or 0

        total_sessions = db.query(func.count(AcademicSession.id)).filter(
            AcademicSession.school_id == school_id,
            AcademicSession.is_deleted == False,
        ).scalar() or 0

        total_subadmins = db.query(func.count(User.user_id)).filter(
            User.school_id == school_id,
            User.role == "subadmin",
            User.is_deleted == False,
        ).scalar() or 0

        return {
            "total_teachers": int(total_teachers),
            "total_students": int(total_students),
            "total_classes": int(total_classes),
            "total_subjects": int(total_subjects),
            "total_departments": int(total_departments),
            "total_sessions": int(total_sessions),
            "total_subadmins": int(total_subadmins),
        }
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.user_service import UserService
from app.core.utils_functions import generate_id
from app.models.users import Address
from dotenv import load_dotenv
from app.schemas.admin import AdminCreate, SchoolCreate, SubadminCreate
from app.services.school_service import SchoolService

import os
load_dotenv()
DOMAIN = os.getenv("DOMAIN", "localhost")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

class AdminService:
    def create_admin(db: Session, admin_data: AdminCreate):
        admin = UserService.create_user(db, admin_data)

        admin_address = Address(
            id=generate_id("add"),
            street=admin_data.address.street,
            city=admin_data.address.city,
            state=admin_data.address.state,
            country=admin_data.address.country,
            postal_code=admin_data.address.postal_code,
            user_id=admin.user_id,
        )
        db.add(admin_address)
        db.commit()
        db.refresh(admin_address)
        return {
            "admin": admin,
            "admin_address": admin_address,
        }


    def get_admin(db: Session, email: str):
        return UserService.get_user(db, email)

    def add_school(db: Session, admin_id: str, school: SchoolCreate):
        school = SchoolService.create_school(db, school, admin_id)
        return school

    def get_school(db: Session, school_id: str):
        return SchoolService.get_school(db, school_id)

    def get_school_by_admin_id(db: Session, admin_id: str):
        return SchoolService.get_school_by_admin_id(db, admin_id)

    def update_school(db: Session, school_id: str, school: SchoolCreate):
        return SchoolService.update_school(db, school_id, school)

    def delete_school(db: Session, school_id: str):
        return SchoolService.delete_school(db, school_id)
    
    def get_all_schools(db: Session):
        return SchoolService.get_all_schools(db)

    def deactivate_school(db: Session, school_id: str):
        return SchoolService.deactivate_school(db, school_id)

    def activate_school(db: Session, school_id: str):
        return SchoolService.activate_school(db, school_id)


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





























        
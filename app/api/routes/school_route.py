from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.school_service import SchoolService
from app.schemas.admin import SchoolCreate, SchoolResponse

router = APIRouter()

@router.post("/school/create", response_model=SchoolResponse, tags=["School"])
def create_school(school_data: SchoolCreate, db: Session = Depends(get_db)):
    return SchoolService.create_school(db, school_data)

@router.get("/school/get", response_model=SchoolResponse, tags=["School"])
def get_school(school_id: str, db: Session = Depends(get_db)):
    return SchoolService.get_school(db, school_id)

@router.get("/school/get-by-admin-id", response_model=SchoolResponse, tags=["School"])
def get_school_by_admin_id(admin_id: str, db: Session = Depends(get_db)):
    return SchoolService.get_school_by_admin_id(db, admin_id)
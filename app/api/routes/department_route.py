from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.classes import DepartmentCreate, DepartmentResponse
from app.services.department_service import DepartmentService

router = APIRouter()


@router.post("/create", response_model=DepartmentResponse, tags=["Department"])
def create_department(request: Request, data: DepartmentCreate, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return DepartmentService.create_department(db, school_id, data)


@router.get("/get/{department_id}", response_model=DepartmentResponse, tags=["Department"])
def get_department(request: Request, department_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return DepartmentService.get_department(db, department_id, school_id)


@router.get("/get-all", response_model=list[DepartmentResponse], tags=["Department"])
def get_all_departments(request: Request, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return DepartmentService.get_all_departments(db, school_id)


@router.put("/update/{department_id}", response_model=DepartmentResponse, tags=["Department"])
def update_department(request: Request, department_id: str, data: DepartmentCreate, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return DepartmentService.update_department(db, department_id, school_id, data)


@router.delete("/delete/{department_id}", tags=["Department"])
def delete_department(request: Request, department_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return DepartmentService.delete_department(db, department_id, school_id)


@router.post("/deactivate/{department_id}", response_model=DepartmentResponse, tags=["Department"])
def deactivate_department(request: Request, department_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return DepartmentService.deactivate_department(db, department_id, school_id)


@router.post("/activate/{department_id}", response_model=DepartmentResponse, tags=["Department"])
def activate_department(request: Request, department_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return DepartmentService.activate_department(db, department_id, school_id)



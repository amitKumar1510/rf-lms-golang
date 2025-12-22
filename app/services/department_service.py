from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.users import Department
from app.schemas.classes import DepartmentCreate, DepartmentResponse
from app.core.utils_functions import generate_id



class DepartmentService:
    @staticmethod
    def create_department(db: Session, school_id: str, data: DepartmentCreate):
        department_model = Department(
            id=generate_id("dept"),
            name=data.name,
            # code=data.code,
            description=data.description,
            school_id=school_id,
        )
        db.add(department_model)
        db.commit()
        db.refresh(department_model)
        return DepartmentResponse.model_validate(department_model)

    @staticmethod
    def get_department(db: Session, department_id: str, school_id: str):
        department = (
            db.query(Department)
            .filter(
                Department.id == department_id,
                Department.school_id == school_id,
                Department.is_deleted == False,
            )
            .first()
        )
        if not department:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        return DepartmentResponse.model_validate(department)
    
    @staticmethod
    def get_all_departments(db: Session, school_id: str):
        departments = (
            db.query(Department)
            .filter(
                Department.school_id == school_id,
                Department.is_deleted == False,
            )
            .all()
        )
        return [DepartmentResponse.model_validate(d) for d in departments]
    
    @staticmethod
    def update_department(db: Session, department_id: str, school_id: str, data: DepartmentCreate):
        department = (
            db.query(Department)
            .filter(
                Department.id == department_id,
                Department.school_id == school_id,
                Department.is_deleted == False,
            )
            .first()
        )
        if not department:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        for field, value in data.model_dump(exclude_unset=True, exclude={"school_id"}).items():
            setattr(department, field, value)
        db.commit()
        db.refresh(department)
        return DepartmentResponse.model_validate(department)
    
    @staticmethod
    def delete_department(db: Session, department_id: str, school_id: str):
        department = (
            db.query(Department)
            .filter(
                Department.id == department_id,
                Department.school_id == school_id,
                Department.is_deleted == False,
            )
            .first()
        )
        if not department:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        department.is_deleted = True
        db.commit()
        db.refresh(department)
        return {
            "message": "Department deleted successfully"
        }
    
    @staticmethod
    def deactivate_department(db: Session, department_id: str, school_id: str):
        department = (
            db.query(Department)
            .filter(
                Department.id == department_id,
                Department.school_id == school_id,
                Department.is_deleted == False,
            )
            .first()
        )
        if not department:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        department.is_active = False
        db.commit()
        db.refresh(department)
        return DepartmentResponse.model_validate(department)
    
    @staticmethod
    def activate_department(db: Session, department_id: str, school_id: str):
        department = (
            db.query(Department)
            .filter(
                Department.id == department_id,
                Department.school_id == school_id,
                Department.is_deleted == False,
            )
            .first()
        )
        if not department:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
        department.is_active = True
        db.commit()
        db.refresh(department)
        return DepartmentResponse.model_validate(department)


    





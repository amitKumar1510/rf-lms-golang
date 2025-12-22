from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.teacher_service import TeacherService
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse


router = APIRouter()



@router.post("/create", response_model=TeacherResponse, tags=["Teacher"])
def create_teacher(request: Request, teacher_data: TeacherCreate, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return TeacherResponse.model_validate(
        TeacherService.create_teacher(db, loged_in_user.school_id, loged_in_user.user_id, teacher_data)
    )


@router.get("/get/{teacher_id}", response_model=TeacherResponse, tags=["Teacher"])
def get_teacher_by_id(request: Request, teacher_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return TeacherResponse.model_validate(TeacherService.get_teacher_by_id(db, teacher_id, school_id))


@router.get("/get-all", response_model=list[TeacherResponse], tags=["Teacher"])
def get_all_teachers(request: Request, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    teachers = TeacherService.get_all_teachers(db, school_id)
    return [TeacherResponse.model_validate(t) for t in teachers]


@router.get("/get-by-class/{class_id}", response_model=list[TeacherResponse], tags=["Teacher"])
def get_teachers_by_class_id(request: Request, class_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    teachers = TeacherService.get_teachers_by_class_id(db, school_id, class_id)
    return [TeacherResponse.model_validate(t) for t in teachers]


@router.get("/get-by-subject/{subject_id}", response_model=list[TeacherResponse], tags=["Teacher"])
def get_teachers_by_subject_id(request: Request, subject_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    teachers = TeacherService.get_teachers_by_subject_id(db, school_id, subject_id)
    return [TeacherResponse.model_validate(t) for t in teachers]


@router.get("/get-by-department/{department_id}", response_model=list[TeacherResponse], tags=["Teacher"])
def get_teachers_by_department_id(request: Request, department_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    teachers = TeacherService.get_teachers_by_department_id(db, school_id, department_id)
    return [TeacherResponse.model_validate(t) for t in teachers]


@router.get("/admin/get-by-school/{school_id}", response_model=list[TeacherResponse], tags=["Teacher"])
def admin_get_teachers_by_school_id(request: Request, school_id: str, db: Session = Depends(get_db)):
    # Admin-scope endpoint to fetch teachers by any school id
    if getattr(request.state.user, "role", None) != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    teachers = TeacherService.get_teachers_by_school_id(db, school_id)
    return [TeacherResponse.model_validate(t) for t in teachers]


@router.put("/update/{teacher_id}", response_model=TeacherResponse, tags=["Teacher"])
def update_teacher(request: Request, teacher_id: str, data: TeacherUpdate, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    updated = TeacherService.update_teacher(db, school_id, teacher_id, data)
    return TeacherResponse.model_validate(updated)


@router.delete("/delete/{teacher_id}", tags=["Teacher"])
def delete_teacher(request: Request, teacher_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    return TeacherService.delete_teacher(db, school_id, teacher_id)


@router.post("/deactivate/{teacher_id}", response_model=TeacherResponse, tags=["Teacher"])
def deactivate_teacher(request: Request, teacher_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    teacher = TeacherService.deactivate_teacher(db, school_id, teacher_id)
    return TeacherResponse.model_validate(teacher)


@router.post("/activate/{teacher_id}", response_model=TeacherResponse, tags=["Teacher"])
def activate_teacher(request: Request, teacher_id: str, db: Session = Depends(get_db)):
    school_id = request.state.user.school_id
    teacher = TeacherService.activate_teacher(db, school_id, teacher_id)
    return TeacherResponse.model_validate(teacher)





from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.student_service import StudentService
from app.schemas.student import StudentCreate, StudentCreateResponse


router = APIRouter()


@router.post("/create", response_model=StudentCreateResponse, tags=["Student"])
def create_student(request: Request, student_data: StudentCreate, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return StudentCreateResponse.model_validate(StudentService.create_student(db, loged_in_user.school_id,loged_in_user.user_id, student_data))


@router.get("/get/{student_id}", response_model=StudentCreateResponse, tags=["Student"])
def get_student(request: Request, student_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return StudentCreateResponse.model_validate(StudentService.get_student(db, student_id))

@router.get("/get/stu/me", response_model=StudentCreateResponse, tags=["Student"])
def get_my_student_profile(request: Request, db: Session = Depends(get_db)):
    user = request.state.user
    school_id = getattr(user, "school_id", None)
    user_id = getattr(user, "user_id", None)
    if not school_id or not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return StudentCreateResponse.model_validate(StudentService.get_student_by_user_id(db, school_id, user_id))

# @router.get("/get/stu/me", response_model=StudentCreateResponse, tags=["Student"])
# def get_student_me(request: Request, db: Session = Depends(get_db)):
#     loged_in_user = request.state.user
#     print("user_id", loged_in_user.user_id)
#     return StudentCreateResponse.model_validate(StudentService.get_student_by_user_id(db, loged_in_user.user_id))

@router.get("/get-all", response_model=list[StudentCreateResponse], tags=["Student"])
def get_all_students(request: Request, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return [StudentCreateResponse.model_validate(student) for student in StudentService.get_all_students(db, loged_in_user.school_id)]

@router.put("/update/{student_id}", response_model=StudentCreateResponse, tags=["Student"])
def update_student(request: Request, student_id: str, student_data: StudentCreate, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return StudentCreateResponse.model_validate(StudentService.update_student(db, student_id, student_data))

@router.delete("/delete/{student_id}", response_model=dict, tags=["Student"])
def delete_student(request: Request, student_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return StudentService.delete_student(db, student_id)

@router.put("/deactivate/{student_id}", response_model=StudentCreateResponse, tags=["Student"]) 
def deactivate_student(request: Request, student_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return StudentCreateResponse.model_validate(StudentService.deactivate_student(db, student_id))

@router.put("/activate/{student_id}", response_model=StudentCreateResponse, tags=["Student"])
def activate_student(request: Request, student_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return StudentCreateResponse.model_validate(StudentService.activate_student(db, student_id))

@router.get("/get-by-class-id/{class_id}", response_model=list[StudentCreateResponse], tags=["Student"])
def get_students_by_class_id(request: Request, class_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return [StudentCreateResponse.model_validate(student) for student in StudentService.get_students_by_class_id(db, class_id)]














from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.subject_service import SubjectService, ClassSubjectService, ClassSubjectTeacherService
from app.schemas.classes import SubjectCreate, SubjectResponse, ClassSubjectCreate, ClassSubjectResponse, ClassSubjectTeacherCreate, ClassSubjectTeacherResponse

router = APIRouter()

# Subject Routes ------------------------------------------------------------------------------------------------------------
@router.post("/create", response_model=SubjectResponse, tags=["Subject"])
def create_subject(request: Request, subject_data: SubjectCreate, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SubjectResponse.model_validate(SubjectService.create_subject(db, school_id, subject_data))

@router.get("/get/{subject_id}", response_model=SubjectResponse, tags=["Subject"])
def get_subject(request: Request, subject_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SubjectResponse.model_validate(SubjectService.get_subject(db, subject_id, school_id))

@router.get("/get-all", response_model=list[SubjectResponse], tags=["Subject"])
def get_all_subjects(request: Request, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SubjectService.get_all_subjects(db, school_id)

@router.put("/update/{subject_id}", response_model=SubjectResponse, tags=["Subject"])
def update_subject(request: Request, subject_id: str, subject_data: SubjectCreate, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SubjectResponse.model_validate(SubjectService.update_subject(db, subject_id, school_id, subject_data))

@router.delete("/delete/{subject_id}", tags=["Subject"])
def delete_subject(request: Request, subject_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SubjectService.delete_subject(db, subject_id, school_id)

@router.post("/deactivate/{subject_id}", tags=["Subject"])
def deactivate_subject(request: Request, subject_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SubjectService.deactivate_subject(db, subject_id, school_id)

@router.post("/activate/{subject_id}", tags=["Subject"])
def activate_subject(request: Request, subject_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SubjectService.activate_subject(db, subject_id, school_id)




# Class Subject Routes ------------------------------------------------------------------------------------------------------------

@router.post("/assign-subject-to-class/{subject_id}/{class_id}", response_model=ClassSubjectResponse, tags=["Subject"])
def assign_subject_to_class(request: Request, subject_id: str, class_id: str, data: ClassSubjectCreate, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassSubjectResponse.model_validate(
        ClassSubjectService.assign_subject_to_class(db, subject_id, class_id,school_id, data.is_compulsory, data.credits)
    )

@router.get("/get-all-class-subjects/{class_id}", response_model=list[ClassSubjectResponse], tags=["Subject"])
def get_all_class_subjects(request: Request, class_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassSubjectService.get_all_class_subjects(db, class_id, school_id)

@router.put("/update-class-subject/{class_id}/{subject_id}", response_model=ClassSubjectResponse, tags=["Subject"])
def update_class_subject(request: Request, class_id: str, subject_id: str, class_subject_data: ClassSubjectCreate, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassSubjectResponse.model_validate(ClassSubjectService.update_class_subject(db, class_id, subject_id, school_id, class_subject_data))

@router.delete("/delete-class-subject/{class_id}/{subject_id}", tags=["Subject"])
def delete_class_subject(request: Request, class_id: str, subject_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassSubjectService.delete_class_subject(db, subject_id, school_id, class_id)

@router.post("/deactivate-class-subject/{class_id}/{subject_id}", tags=["Subject"])
def deactivate_class_subject(request: Request, class_id: str, subject_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id  
    return ClassSubjectService.deactivate_class_subject(db, subject_id, school_id, class_id,)

@router.post("/activate-class-subject/{class_id}/{subject_id}", tags=["Subject"])
def activate_class_subject(request: Request, class_id: str, subject_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassSubjectService.activate_class_subject(db, subject_id, school_id, class_id)


# Class Subject Teacher Routes ------------------------------------------------------------------------------------------------------------


@router.post("/assign-teacher-to-class-subject/{class_id}/{subject_id}/{teacher_id}", response_model=ClassSubjectTeacherResponse, tags=["Subject"])
def assign_teacher_to_class_subject(
    request: Request,
    class_id: str,
    subject_id: str,
    teacher_id: str,
    academic_year: str | None = None,
    periods_per_week: int = 1,
    syllabus_completion: int = 0,
    db: Session = Depends(get_db),
):
    school_id=request.state.user.school_id
    return ClassSubjectTeacherResponse.model_validate(
        ClassSubjectTeacherService.assign_teacher_to_class_subject(
            db, class_id, subject_id, teacher_id, school_id, academic_year, periods_per_week, syllabus_completion
        )
    )

@router.get("/get-all-class-subject-teachers/{class_id}/{subject_id}", response_model=list[ClassSubjectTeacherResponse], tags=["Subject"])
def get_all_class_subject_teachers(request: Request, class_id: str, subject_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassSubjectTeacherService.get_all_class_subject_teachers(db, class_id, subject_id, school_id)

@router.post("/deactivate-class-subject-teacher/{class_id}/{subject_id}/{teacher_id}", tags=["Subject"])
def deactivate_class_subject_teacher(request: Request, class_id: str, subject_id: str, teacher_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassSubjectTeacherResponse.model_validate(ClassSubjectTeacherService.deactivate_class_subject_teacher(db, class_id, subject_id, teacher_id, school_id))

@router.post("/activate-class-subject-teacher/{class_id}/{subject_id}/{teacher_id}", tags=["Subject"])
def activate_class_subject_teacher(request: Request, class_id: str, subject_id: str, teacher_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassSubjectTeacherResponse.model_validate(ClassSubjectTeacherService.activate_class_subject_teacher(db, class_id, subject_id, teacher_id, school_id))
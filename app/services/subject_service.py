from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.users import Subject, ClassSubject, ClassSubjectTeacher, Class
from app.schemas.classes import SubjectCreate, SubjectResponse, ClassSubjectCreate, ClassSubjectResponse, ClassSubjectTeacherCreate, ClassSubjectTeacherResponse
from app.core.utils_functions import generate_id


class SubjectService:
    def create_subject(db: Session, school_id: str, data: SubjectCreate):
        subject_model = Subject(
            id=generate_id("subject"),
            name=data.name,
            code=data.code,
            description=data.description,
            school_id=school_id,
        )
        db.add(subject_model)
        db.commit()
        db.refresh(subject_model)
        return SubjectResponse.model_validate(subject_model)

    def get_subject(db: Session, subject_id: str, school_id: str):
        subject_model = db.query(Subject).filter(Subject.id == subject_id, Subject.school_id == school_id, Subject.is_deleted == False).first()
        if not subject_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        return SubjectResponse.model_validate(subject_model)


    def get_all_subjects(db: Session, school_id: str):
        subject_models = db.query(Subject).filter(Subject.school_id == school_id, Subject.is_active == True, Subject.is_deleted == False).all()
        subjects = []
        for subject_model in subject_models:
            subjects.append(SubjectResponse.model_validate(subject_model))
        return subjects

    def update_subject(db: Session, subject_id: str,school_id: str, data: SubjectCreate):
        subject_model = db.query(Subject).filter(Subject.id == subject_id, Subject.school_id == school_id, Subject.is_deleted == False).first()
        if not subject_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        for field, value in data.model_dump().items():
            setattr(subject_model, field, value)
        db.commit()
        db.refresh(subject_model)
        return SubjectResponse.model_validate(subject_model)
        
    def delete_subject(db: Session, subject_id: str, school_id: str):
        subject_model = db.query(Subject).filter(Subject.id == subject_id, Subject.school_id == school_id, Subject.is_deleted == False).first()
        if not subject_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        subject_model.is_deleted = True
        db.commit()
        db.refresh(subject_model)
        return {
            "message": "Subject deleted successfully"
        }   
        
    def deactivate_subject(db: Session, subject_id: str, school_id: str):
        subject_model = db.query(Subject).filter(Subject.id == subject_id, Subject.school_id == school_id, Subject.is_deleted == False).first()
        if not subject_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        subject_model.is_active = False
        db.commit()
        db.refresh(subject_model)
        return {
            "message": "Subject deactivated successfully"
        }   
        
    def activate_subject(db: Session, subject_id: str, school_id: str):
        subject_model = db.query(Subject).filter(Subject.id == subject_id, Subject.school_id == school_id, Subject.is_deleted == False).first()
        if not subject_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subject not found")
        subject_model.is_active = True
        db.commit()
        db.refresh(subject_model)
        return {
            "message": "Subject activated successfully"
        }   
        
        
class ClassSubjectService:
    def assign_subject_to_class(db: Session, subject_id: str, class_id: str,school_id: str, is_compulsory: bool, credits: int):
        # Validate IDs before inserting to avoid DB FK errors.
        subject = db.query(Subject).filter(Subject.id == subject_id, Subject.is_deleted == False).first()
        class_model = db.query(Class).filter(Class.id == class_id, Class.is_deleted == False).first()

        # If caller accidentally swapped IDs, auto-correct when it is unambiguous.
        if subject is None and class_model is None:
            swapped_subject = db.query(Subject).filter(Subject.id == class_id, Subject.is_deleted == False).first()
            swapped_class = db.query(Class).filter(Class.id == subject_id, Class.is_deleted == False).first()
            if swapped_subject is not None and swapped_class is not None:
                subject_id, class_id = class_id, subject_id
                subject, class_model = swapped_subject, swapped_class

        if class_model is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Class not found for id '{class_id}'. Make sure you pass a valid class_id (from /api/class/...).",
            )
        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Subject not found for id '{subject_id}'. Make sure you pass a valid subject_id (from /api/subject/get-all).",
            )

        existing = (
            db.query(ClassSubject)
            .filter(
                ClassSubject.class_id == class_id,
                ClassSubject.subject_id == subject_id,
                ClassSubject.is_deleted == False,
            )
            .first()
        )
        if existing:
            return (
                db.query(ClassSubject)
                .options(joinedload(ClassSubject.subject))
                .filter(ClassSubject.id == existing.id)
                .first()
            )

        class_subject = ClassSubject(
            id=generate_id("class_subject"),
            subject_id=subject_id,
            class_id=class_id,
            school_id=school_id,
            is_compulsory=is_compulsory,
            credits=credits,
        )
        db.add(class_subject)
        db.commit()
        # Reload with joined subject to satisfy ClassSubjectResponse(subject=...)
        return (
            db.query(ClassSubject)
            .options(joinedload(ClassSubject.subject))
            .filter(ClassSubject.id == class_subject.id)
            .first()
        )
    
    def get_all_class_subjects(db: Session, class_id: str, school_id: str):
        class_subjects = (
            db.query(ClassSubject)
            .options(joinedload(ClassSubject.subject))
            .filter(
                ClassSubject.class_id == class_id,
                ClassSubject.school_id == school_id,
                ClassSubject.is_deleted == False,
            )
            .all()
        )
        class_subjects_list = []
        for class_subject in class_subjects:
            class_subjects_list.append(ClassSubjectResponse.model_validate(class_subject))
        return class_subjects_list

    def update_class_subject(db: Session, class_id: str, subject_id: str, school_id: str, data: ClassSubjectCreate):
        class_subject = (
            db.query(ClassSubject)
            .filter(
                ClassSubject.class_id == class_id,
                ClassSubject.subject_id == subject_id,
                ClassSubject.school_id == school_id,
                ClassSubject.is_deleted == False,
            )
            .first()
        )
        if not class_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(class_subject, field, value)
        db.commit()
        return (
            db.query(ClassSubject)
            .options(joinedload(ClassSubject.subject))
            .filter(ClassSubject.id == class_subject.id)
            .first()
        )

    def delete_class_subject(db: Session, subject_id: str, school_id: str, class_id: str  ):
        class_subject = db.query(ClassSubject).filter(ClassSubject.subject_id == subject_id, ClassSubject.school_id == school_id, ClassSubject.class_id == class_id, ClassSubject.is_deleted == False).first()
        if not class_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject not found")
        class_subject.is_deleted = True
        db.commit()
        db.refresh(class_subject)
        return {
            "message": "Class subject deleted successfully"
        }
    
    def deactivate_class_subject(db: Session, subject_id: str, school_id: str, class_id: str):
        class_subject = db.query(ClassSubject).filter(ClassSubject.subject_id == subject_id, ClassSubject.school_id == school_id, ClassSubject.class_id == class_id, ClassSubject.is_deleted == False).first()
        if not class_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject not found")
        class_subject.is_active = False
        db.commit()
        db.refresh(class_subject)
        return {
            "message": "Class subject deactivated successfully"
        }
    def activate_class_subject(db: Session, subject_id: str, school_id: str, class_id: str):
        class_subject = db.query(ClassSubject).filter(ClassSubject.subject_id == subject_id, ClassSubject.school_id == school_id, ClassSubject.class_id == class_id, ClassSubject.is_deleted == False).first()
        if not class_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject not found")
        class_subject.is_active = True
        db.commit()
        db.refresh(class_subject)
        return {
            "message": "Class subject activated successfully"
        }


# Class Subject Teacher Routes ------------------------------------------------------------------------------------------------------------


class ClassSubjectTeacherService:
    def assign_teacher_to_class_subject(
        db: Session,
        class_id: str,
        subject_id: str,
        teacher_id: str,
        academic_year: str,
        periods_per_week: int,
        syllabus_completion: int,
    ):
        class_subject = (
            db.query(ClassSubject)
            .filter(
                ClassSubject.class_id == class_id,
                ClassSubject.subject_id == subject_id,
                ClassSubject.is_deleted == False,
            )
            .first()
        )
        if not class_subject:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject not found")

        class_subject_teacher = ClassSubjectTeacher(
            id=generate_id("class_subject_teacher"),
            class_subject_id=class_subject.id,
            teacher_id=teacher_id,
            academic_year=academic_year,
            periods_per_week=periods_per_week,
            syllabus_completion=syllabus_completion,
        )
        db.add(class_subject_teacher)
        db.commit()
        return class_subject_teacher

    def get_all_class_subject_teachers(db: Session, class_subject_id: str, school_id: str):
        class_subject_teachers = db.query(ClassSubjectTeacher).filter(ClassSubjectTeacher.class_subject_id == class_subject_id, ClassSubjectTeacher.school_id == school_id, ClassSubjectTeacher.is_deleted == False).all()
        class_subject_teachers_list = []
        for class_subject_teacher in class_subject_teachers:
            class_subject_teachers_list.append(ClassSubjectTeacherResponse.model_validate(class_subject_teacher))
        return class_subject_teachers_list
    def update_class_subject_teacher(db: Session, class_subject_teacher_id: str, data: ClassSubjectTeacherCreate):
        class_subject_teacher = db.query(ClassSubjectTeacher).filter(ClassSubjectTeacher.id == class_subject_teacher_id, ClassSubjectTeacher.is_deleted == False).first()
        if not class_subject_teacher:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject teacher not found")
        for field, value in data.model_dump().items():
            setattr(class_subject_teacher, field, value)
        db.commit()
        db.refresh(class_subject_teacher)
        return ClassSubjectTeacherResponse.model_validate(class_subject_teacher)
    def delete_class_subject_teacher(db: Session, class_subject_teacher_id: str, school_id: str, class_subject_id: str):
        class_subject_teacher = db.query(ClassSubjectTeacher).filter(ClassSubjectTeacher.id == class_subject_teacher_id, ClassSubjectTeacher.school_id == school_id, ClassSubjectTeacher.class_subject_id == class_subject_id, ClassSubjectTeacher.is_deleted == False).first()
        if not class_subject_teacher:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject teacher not found")
        class_subject_teacher.is_deleted = True
        db.commit()
        db.refresh(class_subject_teacher)
        return {
            "message": "Class subject teacher deleted successfully"
        }
    def deactivate_class_subject_teacher(db: Session, class_subject_teacher_id: str, school_id: str, class_subject_id: str):
        class_subject_teacher = db.query(ClassSubjectTeacher).filter(ClassSubjectTeacher.id == class_subject_teacher_id, ClassSubjectTeacher.school_id == school_id, ClassSubjectTeacher.class_subject_id == class_subject_id, ClassSubjectTeacher.is_deleted == False).first()
        if not class_subject_teacher:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject teacher not found")
        class_subject_teacher.is_active = False
        db.commit()
        db.refresh(class_subject_teacher)

        return {
            "message": "Class subject teacher deactivated successfully"
        }
    def activate_class_subject_teacher(db: Session, class_subject_teacher_id: str, school_id: str, class_subject_id: str):
        class_subject_teacher = db.query(ClassSubjectTeacher).filter(ClassSubjectTeacher.id == class_subject_teacher_id, ClassSubjectTeacher.school_id == school_id, ClassSubjectTeacher.class_subject_id == class_subject_id, ClassSubjectTeacher.is_deleted == False).first()
        if not class_subject_teacher:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class subject teacher not found")
        class_subject_teacher.is_active = True
        db.commit()
        db.refresh(class_subject_teacher)
        return {
            "message": "Class subject teacher activated successfully"
        }       

        
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.users import Class, AcademicSession
from app.schemas.classes import ClassCreate, SessionCreate, ClassResponse, SessionResponse
from app.core.utils_functions import generate_id



class ClassService:
    def create_class(db: Session, school_id: str, data: ClassCreate):
        class_model = Class(
            id=generate_id("class"),
            name=data.name,
            grade_level=data.grade_level,
            section=data.section,
            academic_year=data.academic_year,
            capacity=data.capacity,
            school_id=school_id,
        )
        db.add(class_model)
        db.commit()
        db.refresh(class_model)
        return ClassResponse.model_validate(class_model)

    def get_class(db: Session, class_id: str, school_id: str):
        class_model = db.query(Class).filter(Class.id == class_id, Class.school_id == school_id, Class.is_deleted == False).first()
        if not class_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        return ClassResponse.model_validate(class_model)

    def get_all_classes(db: Session, school_id: str):
        class_models = db.query(Class).filter(Class.school_id == school_id, Class.is_deleted == False).all()
        classes = []
        for class_model in class_models:
            classes.append(ClassResponse.model_validate(class_model))
        return classes

    def update_class(db: Session, class_id: str, school_id: str, data: ClassCreate):
        class_model = db.query(Class).filter(Class.id == class_id, Class.school_id == school_id, Class.is_deleted == False).first()
        if not class_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        for field, value in data.model_dump().items():
            setattr(class_model, field, value)
        db.commit()
        db.refresh(class_model)
        return ClassResponse.model_validate(class_model)


    def delete_class(db: Session, class_id: str, school_id: str):
        class_model = db.query(Class).filter(Class.id == class_id, Class.school_id == school_id, Class.is_deleted == False).first()
        if not class_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        class_model.is_deleted = True
        db.commit()
        db.refresh(class_model)
        return {
            "message": "Class deleted successfully"
        }   

    def deactivate_class(db: Session, class_id: str, school_id: str):
        class_model = db.query(Class).filter(Class.id == class_id, Class.school_id == school_id, Class.is_deleted == False).first()
        if not class_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        class_model.is_active = False
        db.commit()
        db.refresh(class_model)
        return {
            "message": "Class deactivated successfully"
        }   
        
    def activate_class(db: Session, class_id: str, school_id: str):
        class_model = db.query(Class).filter(Class.id == class_id, Class.school_id == school_id, Class.is_deleted == False).first()
        if not class_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        class_model.is_active = True
        db.commit()
        db.refresh(class_model)
        return {
            "message": "Class activated successfully"
        }   

    
#  session related data services ------------------------------------------------------------------------------------------------------------

    def create_session(db: Session, school_id: str, data: SessionCreate):
        session_model = AcademicSession(
            id=generate_id("session"),
            name=data.name,
            start_date=data.start_date,
            end_date=data.end_date,
            school_id=school_id,
            is_current=True
        )
        db.add(session_model)
        db.commit()
        db.refresh(session_model)
        return session_model

    def get_session(db: Session, session_id: str, school_id: str):
        session_model = db.query(AcademicSession).filter(AcademicSession.id == session_id, AcademicSession.school_id == school_id, AcademicSession.is_deleted == False).first()
        if not session_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return SessionResponse.model_validate(session_model)

    def get_all_sessions(db: Session, school_id: str):
        session_models = db.query(AcademicSession).filter(AcademicSession.school_id == school_id, AcademicSession.is_deleted == False).all()
        sessions = []
        for session_model in session_models:
            sessions.append(SessionResponse.model_validate(session_model))
        return sessions

    def update_session(db: Session, session_id: str, school_id: str, data: SessionCreate):
        session_model = (
            db.query(AcademicSession)
            .filter(
                AcademicSession.id == session_id,
                AcademicSession.school_id == school_id,
                AcademicSession.is_deleted == False,
            )
            .first()
        )
        if not session_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        for field, value in data.model_dump().items():
            setattr(session_model, field, value)
        db.commit()
        db.refresh(session_model)
        return SessionResponse.model_validate(session_model)

    def delete_session(db: Session, session_id: str, school_id: str):
        session_model = (
            db.query(AcademicSession)
            .filter(
                AcademicSession.id == session_id,
                AcademicSession.school_id == school_id,
                AcademicSession.is_deleted == False,
            )
            .first()
        )
        if not session_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        session_model.is_deleted = True
        db.commit()
        db.refresh(session_model)
        return {
            "message": "Session deleted successfully"
        }   

    def deactivate_session(db: Session, session_id: str):
        session_model = db.query(AcademicSession).filter(AcademicSession.id == session_id, AcademicSession.is_deleted == False).first()
        if not session_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        session_model.is_active = False
        db.commit()
        db.refresh(session_model)
        return {
            "message": "Session deactivated successfully"
        }   
    
    def activate_session(db: Session, session_id: str): 
        session_model = db.query(AcademicSession).filter(AcademicSession.id == session_id, AcademicSession.is_deleted == False).first()
        if not session_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        session_model.is_active = True
        db.commit()
        db.refresh(session_model)
        return {
            "message": "Session activated successfully"
        }   

    def set_current_session(db: Session, session_id: str, school_id: str):
        session_model = db.query(AcademicSession).filter(AcademicSession.id == session_id, AcademicSession.school_id == school_id, AcademicSession.is_deleted == False).first()
        if not session_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        session_model.is_current = True
        db.commit()
        db.refresh(session_model)
        return SessionResponse.model_validate(session_model)

    def unset_current_session(db: Session, session_id: str, school_id: str):
        session_model = db.query(AcademicSession).filter(AcademicSession.id == session_id, AcademicSession.school_id == school_id, AcademicSession.is_deleted == False).first()
        if not session_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        session_model.is_current = False
        db.commit()
        db.refresh(session_model)
        return SessionResponse.model_validate(session_model)

    def get_current_session(db: Session, school_id: str):
        session_model = db.query(AcademicSession).filter(AcademicSession.is_current == True, AcademicSession.school_id == school_id, AcademicSession.is_deleted == False).first()
        if not session_model:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        return SessionResponse.model_validate(session_model)






















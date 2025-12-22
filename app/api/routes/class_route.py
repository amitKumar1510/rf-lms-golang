from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.class_service import ClassService
from app.schemas.classes import ClassCreate, SessionCreate, ClassResponse, SessionResponse


router = APIRouter()

@router.post("/create", response_model=ClassResponse, tags=["Class"])
def create_class(request: Request, class_data: ClassCreate, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassResponse.model_validate(ClassService.create_class(db, school_id, class_data))

@router.get("/get/{class_id}", response_model=ClassResponse, tags=["Class"])
def get_class(request: Request, class_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassResponse.model_validate(ClassService.get_class(db, class_id, school_id))

@router.get("/get-all", response_model=list[ClassResponse] , tags=["Class"])
def get_all_classes(request: Request, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassService.get_all_classes(db, school_id)

@router.put("/update/{class_id}", response_model=ClassResponse, tags=["Class"])
def update_class(request: Request, class_id: str, class_data: ClassCreate, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassResponse.model_validate(ClassService.update_class(db, class_id, school_id, class_data))

@router.delete("/delete/{class_id}", tags=["Class"])
def delete_class(request: Request, class_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassService.delete_class(db, class_id, school_id)



# @router.get("/class/get-all-by-teacher-id", response_model=ClassResponse, tags=["Class"])
# def get_all_classes_by_teacher_id(teacher_id: str, db: Session = Depends(get_db)):
#     return ClassService.get_all_classes_by_teacher_id(db, teacher_id)


@router.post("/create-session", response_model=SessionResponse, tags=["Class"])
def create_session(request: Request, session_data: SessionCreate, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SessionResponse.model_validate(ClassService.create_session(db, school_id, session_data))

@router.get("/get-session/{session_id}", response_model=SessionResponse, tags=["Class"])
def get_session(request: Request, session_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SessionResponse.model_validate(ClassService.get_session(db, session_id, school_id))

@router.get("/get-all-sessions", response_model=list[SessionResponse], tags=["Class"])
def get_all_sessions(request: Request, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassService.get_all_sessions(db, school_id)

@router.put("/update-session/{session_id}", response_model=SessionResponse, tags=["Class"])
def update_session(request: Request, session_id: str, session_data: SessionCreate, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SessionResponse.model_validate(ClassService.update_session(db, session_id, school_id, session_data))

@router.delete("/delete-session/{session_id}", tags=["Class"])
def delete_session(request: Request, session_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return ClassService.delete_session(db, session_id, school_id)

@router.post("/set-current-session/{session_id}", response_model=SessionResponse, tags=["Class"])
def set_current_session(request: Request, session_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SessionResponse.model_validate(ClassService.set_current_session(db, session_id, school_id))

@router.post("/unset-current-session/{session_id}", response_model=SessionResponse, tags=["Class"])
def unset_current_session(request: Request, session_id: str, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SessionResponse.model_validate(ClassService.unset_current_session(db, session_id, school_id))

@router.get("/get-current-session", response_model=SessionResponse, tags=["Class"])
def get_current_session(request: Request, db: Session = Depends(get_db)):
    school_id=request.state.user.school_id
    return SessionResponse.model_validate(ClassService.get_current_session(db, school_id))
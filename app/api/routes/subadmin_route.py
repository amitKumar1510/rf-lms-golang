from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.subadmin_service import SubadminService
from app.schemas.admin import SubadminCreate, SubadminResponse


router = APIRouter()

@router.post("/create", response_model=SubadminResponse, tags=["Subadmin"])
def create_subadmin(request: Request, subadmin: SubadminCreate, db: Session = Depends(get_db)):
    subadmin_id=request.state.user.user_id
    return SubadminResponse.model_validate(SubadminService.create_subadmin(db, subadmin_id, subadmin))

# @router.get("/get", response_model=SubadminResponse, tags=["Subadmin"])
# def get_subadmin(email: str, db: Session = Depends(get_db)):
#     return SubadminService.get_subadmin(db, email)

@router.get("/subadmins/{school_id}", response_model=list[SubadminResponse], tags=["Subadmin"])
def get_subadmin_by_school_id(request: Request,school_id: str, db: Session = Depends(get_db)):
    user_id=request.state.user.user_id
    return [SubadminResponse.model_validate(subadmin) for subadmin in SubadminService.get_subadmin_by_school_id(db, school_id)]

@router.get("/id/{subadmin_id}", response_model=SubadminResponse, tags=["Subadmin"])
def get_subadmin_by_id(request: Request, subadmin_id: str, db: Session = Depends(get_db)):
    user_id=request.state.user.user_id
    return SubadminResponse.model_validate(SubadminService.get_subadmin_by_id(db, subadmin_id))

@router.put("/update/{subadmin_id}", response_model=SubadminResponse, tags=["Subadmin"])
def update_subadmin(request: Request, subadmin_id: str, subadmin_data: SubadminCreate, db: Session = Depends(get_db)):
    user_id=request.state.user.user_id
    return SubadminService.update_subadmin(db, subadmin_id, subadmin_data)

@router.delete("/delete/{subadmin_id}", tags=["Subadmin"])
def delete_subadmin(request: Request, subadmin_id: str, db: Session = Depends(get_db)):
    user_id=request.state.user.user_id
    return SubadminService.delete_subadmin(db, subadmin_id)

@router.post("/deactivate/{subadmin_id}", tags=["Subadmin"])
def deactivate_subadmin(request: Request, subadmin_id: str, db: Session = Depends(get_db)):
    user_id=request.state.user.user_id
    return SubadminService.deactivate_subadmin(db, subadmin_id)

@router.post("/activate/{subadmin_id}", tags=["Subadmin"])
def activate_subadmin(request: Request, subadmin_id: str, db: Session = Depends(get_db)):
    user_id=request.state.user.user_id
    return SubadminService.activate_subadmin(db, subadmin_id)




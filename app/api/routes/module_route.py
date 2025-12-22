from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.module_service import ModuleService
from app.schemas.content import ModuleCreate, ModuleUpdate, ModuleResponse


router = APIRouter()

@router.post("/create", response_model=ModuleResponse, tags=["Module"])
def create_module(request: Request, module_data: ModuleCreate, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return ModuleResponse.model_validate(ModuleService.create_module(db, module_data))

@router.get("/get/{subject_id}/{module_id}", response_model=ModuleResponse, tags=["Module"])
def get_module(request: Request, subject_id: str, module_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return ModuleResponse.model_validate(ModuleService.get_module(db, module_id, subject_id))

@router.get("/get-all/{subject_id}", response_model=list[ModuleResponse], tags=["Module"])
def get_all_modules(request: Request, subject_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return [ModuleResponse.model_validate(module) for module in ModuleService.get_all_modules(db, subject_id)]

@router.put("/update/{subject_id}/{module_id}", response_model=ModuleResponse, tags=["Module"])
def update_module(request: Request, subject_id: str, module_id: str, module_data: ModuleUpdate, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return ModuleResponse.model_validate(ModuleService.update_module(db, module_id, module_data, subject_id ))

@router.delete("/delete/{subject_id}/{module_id}", response_model=dict, tags=["Module"])
def delete_module(request: Request, subject_id: str, module_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return ModuleService.delete_module(db, module_id, subject_id)

@router.post("/deactivate/{subject_id}/{module_id}", response_model=dict, tags=["Module"])
def deactivate_module(request: Request, subject_id: str, module_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return ModuleService.deactivate_module(db, module_id, subject_id)

@router.post("/activate/{subject_id}/{module_id}", response_model=dict, tags=["Module"])
def activate_module(request: Request, subject_id: str, module_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return ModuleService.activate_module(db, module_id, subject_id)



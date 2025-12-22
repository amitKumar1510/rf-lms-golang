from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.submodule_service import SubmoduleService
from app.schemas.content import SubmoduleCreate, SubmoduleUpdate, SubmoduleResponse


router = APIRouter()

@router.post("/create", response_model=SubmoduleResponse, tags=["Submodule"])
def create_submodule(request: Request, submodule_data: SubmoduleCreate, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return SubmoduleResponse.model_validate(SubmoduleService.create_submodule(db, submodule_data))

@router.get("/get/{module_id}/{submodule_id}", response_model=SubmoduleResponse, tags=["Submodule"])
def get_submodule(request: Request, module_id: str, submodule_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return SubmoduleResponse.model_validate(SubmoduleService.get_submodule(db, submodule_id, module_id))

@router.get("/get-all/{module_id}", response_model=list[SubmoduleResponse], tags=["Submodule"])
def get_all_submodules(request: Request, module_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return [SubmoduleResponse.model_validate(submodule) for submodule in SubmoduleService.get_all_submodules(db, module_id)]

@router.put("/update/{module_id}/{submodule_id}", response_model=SubmoduleResponse, tags=["Submodule"])
def update_submodule(request: Request, module_id: str, submodule_id: str, submodule_data: SubmoduleUpdate, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return SubmoduleResponse.model_validate(SubmoduleService.update_submodule(db, submodule_id, submodule_data, module_id))

@router.delete("/delete/{module_id}/{submodule_id}", response_model=dict, tags=["Submodule"])
def delete_submodule(request: Request, module_id: str, submodule_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return SubmoduleService.delete_submodule(db, submodule_id, module_id)


@router.post("/deactivate/{module_id}/{submodule_id}", response_model=dict, tags=["Submodule"])
def deactivate_submodule(request: Request, module_id: str, submodule_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return SubmoduleService.deactivate_submodule(db, submodule_id, module_id)

@router.post("/activate/{module_id}/{submodule_id}", response_model=dict, tags=["Submodule"])
def activate_submodule(request: Request, module_id: str, submodule_id: str, db: Session = Depends(get_db)):
    logged_in_user = request.state.user
    return SubmoduleService.activate_submodule(db, submodule_id, module_id)






    
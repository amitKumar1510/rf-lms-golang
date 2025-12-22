from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.parent_service import ParentService
from app.schemas.parent import ParentCreate, ParentUpdate, ParentResponse, ParentLoginResponse, ResetPasswordRequest, ForgetPassword, ChangePasswordRequest

router = APIRouter()


@router.post("/public/login", response_model=ParentLoginResponse, tags=["Parent"])
def public_login(request: Request, email: str, password: str, db: Session = Depends(get_db)):
    return ParentService.public_login(db, email, password)


@router.get("/get-parent", response_model=ParentResponse, tags=["Parent"])
def get_parent(request: Request,db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return ParentResponse.model_validate(ParentService.get_parent(db, loged_in_user.email))

@router.get("/by-student-id/{student_id}", response_model=ParentResponse, tags=["Parent"])
def get_parent_by_student_id(request: Request, student_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return ParentResponse.model_validate(ParentService.get_parent_by_student_id(db, student_id, loged_in_user.school_id))

@router.get("/by-email/{email}", response_model=ParentResponse, tags=["Parent"])
def get_parent_by_email(request: Request, email: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return ParentResponse.model_validate(ParentService.get_parent_by_email(db, email, loged_in_user.school_id))

@router.put("/update/{parent_id}", response_model=ParentResponse, tags=["Parent"])
def update_parent(request: Request, parent_id: str, parent_data: ParentUpdate, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return ParentResponse.model_validate(ParentService.update_parent(db, parent_id, parent_data, loged_in_user.school_id))

@router.delete("/delete/{parent_id}", response_model=dict, tags=["Parent"])
def delete_parent(request: Request, parent_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return ParentService.delete_parent(db, parent_id, loged_in_user.school_id)

@router.put("/deactivate/{parent_id}", response_model=ParentResponse, tags=["Parent"])
def deactivate_parent(request: Request, parent_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return ParentResponse.model_validate(ParentService.deactivate_parent(db, parent_id, loged_in_user.school_id))


@router.post("/change-password", response_model=dict, tags=["Parent"])
def change_password(request: Request, data: ChangePasswordRequest, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return ParentService.change_password(db, loged_in_user.parent_id, data.new_password, loged_in_user.school_id)

@router.post("/public/forgot-password", response_model=dict, tags=["Parent"])
async def forgot_password(data: ForgetPassword, db: Session = Depends(get_db)):
    return await ParentService.forgot_password(db, data.email)

@router.post("/public/reset-password", response_model=dict, tags=["Parent"])
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return await ParentService.reset_password(db, data.email, data.otp_code, data.new_password)


@router.post("/logout", response_model=dict, tags=["Parent"])
def logout(request: Request, response: Response):
    return ParentService.logout(request, response)























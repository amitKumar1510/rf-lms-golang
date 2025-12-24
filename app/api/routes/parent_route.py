from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.parent_service import ParentService
from app.schemas.parent import ParentLoginRequest, ParentMeResponse, ParentLoginResponse, ResetPasswordRequest, ForgetPassword, ChangePasswordRequest

router = APIRouter()


@router.post("/public/login", response_model=ParentLoginResponse, tags=["Parent"])
def public_login(data: ParentLoginRequest, response: Response, db: Session = Depends(get_db)):
    return ParentService.login_parent(db, data.email, data.password, response)


@router.get("/me", response_model=ParentMeResponse, tags=["Parent"])
def me(request: Request):
    # request.state.user is StudentsParent (set by middleware for parent role)
    parent = request.state.user
    return ParentMeResponse.model_validate(parent)


@router.get("/get-parent", response_model=ParentMeResponse, tags=["Parent"])
def get_parent(request: Request):
    # Backward compatible alias
    parent = request.state.user
    return ParentMeResponse.model_validate(parent)

@router.get("/by-student-id/{student_id}", response_model=ParentMeResponse, tags=["Parent"])
def get_parent_by_student_id(request: Request, student_id: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    p = ParentService.get_parent_by_student_id(db, student_id, loged_in_user.school_id)
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    return ParentMeResponse.model_validate(p)

@router.get("/by-email/{email}", response_model=ParentMeResponse, tags=["Parent"])
def get_parent_by_email(request: Request, email: str, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    p = ParentService.get_parent_by_email(db, email, loged_in_user.school_id)
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
    return ParentMeResponse.model_validate(p)

@router.post("/change-password", response_model=dict, tags=["Parent"])
def change_password(request: Request, data: ChangePasswordRequest, db: Session = Depends(get_db)):
    loged_in_user = request.state.user
    return ParentService.change_password(db, loged_in_user.id, data.new_password, loged_in_user.school_id)

@router.post("/public/forgot-password", response_model=dict, tags=["Parent"])
async def forgot_password(data: ForgetPassword, db: Session = Depends(get_db)):
    return await ParentService.forgot_password(db, data.email)

@router.post("/public/reset-password", response_model=dict, tags=["Parent"])
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return await ParentService.reset_password(db, data.email, data.otp_code, data.new_password)


@router.post("/logout", response_model=dict, tags=["Parent"])
def logout(request: Request, response: Response):
    return ParentService.logout(request, response)























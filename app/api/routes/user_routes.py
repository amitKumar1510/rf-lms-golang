from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, UploadFile
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.services.user_service import UserService
from app.schemas.user import LoginRequest, LoginResponse, ForgetPasswordRequest, ResetPasswordRequest, UpdatePasswordRequest, MeResponse

router = APIRouter()

@router.post("/public/login", response_model=LoginResponse, tags=["Authentication"])
def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    return UserService.login_user(db, request, response)


@router.post("/public/forget-password", tags=["Authentication"])
def forget_password(data: ForgetPasswordRequest, db: Session = Depends(get_db)):
    return UserService.forget_password(db, data.email)

@router.post("/public/reset-password", tags=["Authentication"])
def reset_password(email: str, data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return UserService.reset_password(db, email, data.otp_code, data.new_password)


@router.post("/public/update-password", tags=["Authentication"])
def update_password(Request: Request,new_password: UpdatePasswordRequest, db: Session = Depends(get_db)):
    user_id = Request.state.user.user_id
    return UserService.update_password(db, user_id, new_password)


@router.post("/upload-image/{id}", tags=["Authentication"])
def upload_image(Request: Request, id: str, image: UploadFile, db: Session = Depends(get_db)):
    return UserService.upload_user_image(db, id, image)

@router.post("/logout", tags=["Authentication"])
def logout(Request: Request, response: Response, db: Session = Depends(get_db)):
    return UserService.logout(Request, response)


@router.get("/me", response_model=MeResponse, tags=["Authentication"])
def me(request: Request, db: Session = Depends(get_db)):
    # request.state.user is set by middleware, but may be detached; re-fetch with joinedload
    user_id = request.state.user.user_id
    user = UserService.get_by_id(db, user_id)
    return MeResponse.model_validate(user)


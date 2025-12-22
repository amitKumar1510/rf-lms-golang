from app.models.users import User, Address, OtpModel
from app.core.utils_functions import generate_id
from fastapi import HTTPException, status, Response, Request, UploadFile
from datetime import timedelta
from app.config.auth import create_access_token
from app.core.hash import verify_password, hash_password
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from dotenv import load_dotenv
import os
from app.templates.send_credentials import MailTemplatesService
from app.core.utils_functions import generate_otp
from app.services.file_service import FileUploadService
load_dotenv()
DOMAIN = os.getenv("DOMAIN", "localhost")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))


class UserService:
    
    def create_user(db, user_create, created_by: str = None) -> User:
        # Check if user with the same email already exists
        existing_user = db.query(User).filter(User.email == user_create.email).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        # Hash the password
        hashed_password = hash_password(user_create.password)
        # Create new user instance
        new_user = User(
            user_id=generate_id("user"),
            email=user_create.email,
            name=user_create.name,
            role=user_create.role,
            password=hashed_password,
            school_id=user_create.school_id if hasattr(user_create, "school_id") else None,
            teacher_id=user_create.teacher_id if hasattr(user_create, "teacher_id") else None,
            student_id=user_create.student_id if hasattr(user_create, "student_id") else None,
            phone=user_create.phone if hasattr(user_create, "phone") else None,
            parent_id=user_create.parent_id if hasattr(user_create, "parent_id") else None,
            created_by=created_by if created_by else None
        )

        # Add to the database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user
    
    def login_user(db, data, response: Response):
        user = db.query(User).filter(User.email == data.email).first()
        if user.is_deleted == True:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your account is deleted. Please contact the administrator.")
        if user.is_active == False:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your account is deactivated. Please contact the administrator.")
        if not user or not verify_password(data.password, user.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        token_data = {
            "sub": user.email,
            "role": user.role,
            "user_id": user.user_id
        }

        # Token expires in 24 hours
        access_token = create_access_token(
            data=token_data,
            expires_delta=timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        )
        token_expiry = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
        expiry_seconds = int(token_expiry.total_seconds())
        response.set_cookie(
                    key="auth",
                    value=access_token,
                    samesite="Lax",
                    secure=False,
                    max_age=expiry_seconds,
                    expires=expiry_seconds,
                    domain=DOMAIN,
                    path='/'
                )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            # "user": user,
            "message": f"Login successful. Welcome {user.name}!"
        }


    @staticmethod
    def get_user(db: Session, email: str):
        return (
            db.query(User)
            .options(joinedload(User.address))
            .filter(User.email == email, User.is_deleted == False)
            .first()
        )
    
    @staticmethod
    def get_by_id(db: Session, user_id: str):
        return (
            db.query(User)
            .options(joinedload(User.address))
            .filter(User.user_id == user_id, User.is_deleted == False)
            .first()
        )

    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()

    def update_password(db: Session, user_id: str, new_password: str):
        new_hashed_password = hash_password(new_password)
        user = db.query(User).filter(User.user_id == user_id, User.is_deleted == False).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user.password = new_hashed_password
        db.commit()
        db.refresh(user)
        return {"message": "Password updated successfully"}

    async def forget_password(db: Session, email: str):
        user = UserService.get_user_by_email(db, email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        new_otp = generate_otp()
        existing = db.query(OtpModel).filter(OtpModel.email == email).first()
        if existing and existing.is_used == True:
            existing.otp_code = new_otp
            existing.is_used = False
        elif existing and existing.is_used == False:
            existing.otp_code = new_otp
        else:
            new_record = OtpModel(email=email,otp_code=new_otp)
            db.add(new_record)
        db.commit()  
        await MailTemplatesService.send_otp_template(email, new_otp)
        return {"message": "OTP sent successfully"}

    async def reset_password(db: Session, email: str, otp_code: str, new_password: str):
            user = UserService.get_user_by_email(db, email)
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
            existing = db.query(OtpModel).filter(OtpModel.email == email,OtpModel.is_used == False).first()
            if not existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP not found or already used")
            if existing.otp_code != otp_code:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
            existing.is_used = True
            hashed_pw = hash_password(new_password)
            user.password = hashed_pw
            db.commit()       
            db.refresh(user)
            await MailTemplatesService.send_notif_password_change(email)
            return {"message": "Password changed successfully"}


    async def upload_user_image(db: Session, id: str, image: UploadFile):
        user = UserService.get_by_id(db, id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if user.image_url:
            svc = FileUploadService(id)
            svc.delete_file(user.image_url)
        svc = FileUploadService(id)
        file_url = await svc.upload_file(image,"profile_pics")
        user.image_url = file_url["filepath"]
        db.commit()
        db.refresh(user)
        return {"message": "Image uploaded successfully", "image_url": user.image_url}

    def logout(request: Request, response: Response):   
        try:
            response.delete_cookie(
                    key="auth",
                    samesite="Lax",
                    secure=False,
                    domain=DOMAIN,
                    path='/'
                )
            return {"message": "Logged out successfully"}
        except Exception as e:
                raise HTTPException(status_code=500, detail="Internal server error")
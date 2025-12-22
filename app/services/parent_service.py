from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Response, Request
from app.schemas.parent import ParentCreate, ParentResponse
from app.core.utils_functions import generate_id, generate_otp
from app.models.users import User, Address, OtpModel
from app.models.student import StudentsParent
from app.config.auth import create_access_token
from app.core.hash import hash_password, verify_password
from app.templates.send_credentials import MailTemplatesService
from dotenv import load_dotenv
from datetime import timedelta
import os
load_dotenv()
DOMAIN = os.getenv("DOMAIN", "localhost")
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))



class ParentService:
    def create_parent(db: Session, student_id: str, school_id: str, data: ParentCreate):
        hashed_password = hash_password("parent123")
        parent = StudentsParent(
            id=generate_id("parent"),
            student_id=student_id,
            name=data.name,
            phone=data.phone,
            relation=data.relation,
            password=hashed_password,
            email=data.email,
            role="parent",
            school_id=school_id,
            street=data.address.street,
            city=data.address.city,
            state=data.address.state,
            country=data.address.country,
            postal_code=data.address.postal_code,
            occupation=data.occupation,
            education_level=data.education_level,
            marital_status=data.marital_status,
        )   
        db.add(parent)
        db.commit()
        db.refresh(parent)
        return parent

    def login_parent(db: Session, email: str, password: str, response: Response):
        parent = db.query(StudentsParent).filter(StudentsParent.email == email).first()
        if not parent or not verify_password(password, parent.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        token_data = {
            "sub": parent.email,
            "role": parent.role,
            "user_id": parent.id
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
            "message": f"Login successful. Welcome {parent.name}!"
        }




    def get_parent_by_email(db: Session, email: str, school_id: str):
        return db.query(StudentsParent).filter(StudentsParent.email == email, StudentsParent.school_id == school_id).first()    

    def get_parent(db: Session, parent_id: str, school_id: str):
        parent = db.query(StudentsParent).filter(StudentsParent.id == parent_id, StudentsParent.school_id == school_id).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
        return parent

    def get_all_parents(db: Session, school_id: str):
        return db.query(StudentsParent).filter(StudentsParent.school_id == school_id).all()

    def update_parent(db: Session, parent_id: str, data: ParentCreate, school_id: str):
        parent = db.query(StudentsParent).filter(StudentsParent.id == parent_id, StudentsParent.school_id == school_id).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
        for field, value in data.model_dump().items():
            setattr(parent, field, value)
        db.commit()
        db.refresh(parent)
        return parent

    def delete_parent(db: Session, parent_id: str, school_id: str):
        parent = db.query(StudentsParent).filter(StudentsParent.id == parent_id, StudentsParent.school_id == school_id).first()
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
        parent.is_deleted = True
        db.commit()
        db.refresh(parent)
        return {
            "message": "Parent deleted successfully"
        }

    def get_parent_by_student_id(db: Session, student_id: str, school_id: str):
        return db.query(StudentsParent).filter(StudentsParent.student_id == student_id, StudentsParent.school_id == school_id).first()
    
    def get_by_email(db: Session, email: str):
        return db.query(StudentsParent).filter(StudentsParent.email == email, StudentsParent.is_deleted == False).first()



    def change_password(db: Session, user_id: str, new_password: str, school_id: str):
        new_hashed_password = hash_password(new_password)
        user = db.query(StudentsParent).filter(StudentsParent.id == user_id, StudentsParent.school_id == school_id, StudentsParent.is_deleted == False).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
        user.password = new_hashed_password
        db.commit()
        db.refresh(user)
        return {"message": "Password updated successfully"}

    async def forgot_password(db: Session, email: str):
        user = ParentService.get_by_email(db, email)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
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
            user = ParentService.get_by_email(db, email)
            if not user:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent not found")
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





























from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from app.models.teacher import Teacher, TeacherSubject
from app.models.users import User
from app.services.user_service import UserService
from app.core.utils_functions import generate_id
from typing import List, Optional


class TeacherService:
    @staticmethod
    def get_teacher_by_id(db: Session, teacher_id: str) -> Optional[Teacher]:
        """Get teacher by ID"""
        return db.query(Teacher).filter(Teacher.id == teacher_id).first()

    @staticmethod
    def get_teacher_by_user_id(db: Session, user_id: str) -> Optional[Teacher]:
        """Get teacher by user ID"""
        return db.query(Teacher).filter(Teacher.user_id == user_id).first()

    @staticmethod
    def get_teachers_by_school(db: Session, school_id: str) -> List[Teacher]:
        """Get all teachers for a school"""
        return db.query(Teacher).join(User).filter(
            User.school_id == school_id,
            User.role == "teacher",
            User.is_active == True
        ).all()

    @staticmethod
    def create_teacher(db: Session, user_id: str, teacher_data: dict) -> Teacher:
        """Create teacher profile for a user"""
        # Check if user exists and is a teacher
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        if user.role != "teacher":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a teacher"
            )

        # Check if teacher profile already exists
        existing_teacher = TeacherService.get_teacher_by_user_id(db, user_id)
        if existing_teacher:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Teacher profile already exists for this user"
            )

        # Create teacher profile
        teacher = Teacher(
            id=generate_id(user.name + "_teacher"),
            user_id=user_id,
            qualification=teacher_data.get("qualification"),
            experience_years=teacher_data.get("experience_years"),
            specialization=teacher_data.get("specialization")
        )

        db.add(teacher)
        db.flush()  # Get the teacher ID

        # Add teacher subjects
        if teacher_data.get("subjects"):
            for subject_data in teacher_data["subjects"]:
                teacher_subject = TeacherSubject(
                    id=generate_id(f"{user_id}_{subject_data['subject_id']}_teacher"),
                    teacher_id=teacher.id,
                    subject_id=subject_data["subject_id"],
                    is_primary=subject_data.get("is_primary", False),
                    experience_years=subject_data.get("experience_years")
                )
                db.add(teacher_subject)

        db.commit()
        db.refresh(teacher)
        return teacher

    @staticmethod
    def update_teacher(db: Session, teacher_id: str, update_data: dict, updated_by: str) -> Teacher:
        """Update teacher profile"""
        teacher = TeacherService.get_teacher_by_id(db, teacher_id)
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )

        # Check permissions (only subadmin of same school or the teacher themselves can update)
        current_user = db.query(User).filter(User.id == updated_by).first()
        teacher_user = teacher.user

        if current_user.role == "subadmin":
            if current_user.school_id != teacher_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        elif current_user.id != teacher_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Update user fields if provided
        user_update_data = {}
        if "name" in update_data and update_data["name"]:
            user_update_data["name"] = update_data["name"]
        if "email" in update_data and update_data["email"]:
            user_update_data["email"] = update_data["email"]
        if "phone" in update_data:
            user_update_data["phone"] = update_data["phone"]
        if "address" in update_data and update_data["address"]:
            user_update_data["address"] = update_data["address"]
        
        if user_update_data:
            UserService.update_user(db, teacher.user_id, user_update_data, updated_by)

        # Update teacher fields
        for field in ["qualification", "experience_years", "specialization"]:
            if field in update_data:
                setattr(teacher, field, update_data[field])

        # Update teacher subjects if provided
        if "subjects" in update_data:
            # Remove existing subjects
            db.query(TeacherSubject).filter(TeacherSubject.teacher_id == teacher_id).delete()

            # Add new subjects
            for subject_data in update_data["subjects"]:
                teacher_subject = TeacherSubject(
                    id=generate_id(f"{teacher.user_id}_{subject_data['subject_id']}_teacher"),
                    teacher_id=teacher_id,
                    subject_id=subject_data["subject_id"],
                    is_primary=subject_data.get("is_primary", False),
                    experience_years=subject_data.get("experience_years")
                )
                db.add(teacher_subject)

        db.commit()
        db.refresh(teacher)
        return teacher

    @staticmethod
    def get_teacher_subjects(db: Session, teacher_user_id: str) -> List[dict]:
        """Get subjects taught by a teacher"""
        teacher = TeacherService.get_teacher_by_user_id(db, teacher_user_id)
        if not teacher:
            return []

        teacher_subjects = db.query(TeacherSubject).filter(
            TeacherSubject.teacher_id == teacher.id
        ).all()

        return [{
            "id": ts.id,
            "subject_id": ts.subject_id,
            "subject": {
                "id": ts.subject.id,
                "name": ts.subject.name,
                "code": ts.subject.code
            } if ts.subject else None,
            "is_primary": ts.is_primary,
            "experience_years": ts.experience_years,
            "created_at": ts.created_at
        } for ts in teacher_subjects]

    @staticmethod
    def delete_teacher(db: Session, teacher_id: str, deleted_by: str) -> bool:
        """Delete teacher profile (soft delete by deactivating user)"""
        teacher = TeacherService.get_teacher_by_id(db, teacher_id)
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher not found"
            )

        # Check permissions (only subadmin of same school can delete)
        current_user = db.query(User).filter(User.id == deleted_by).first()
        if current_user.role != "subadmin" or current_user.school_id != teacher.user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Soft delete - deactivate user
        teacher.user.is_active = False
        db.commit()

        return True

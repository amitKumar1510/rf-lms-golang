from sqlalchemy.orm import Session
from sqlalchemy import func, case
from fastapi import HTTPException, status
from app.models.principle import Principle
from app.models.users import User, School, Class
from app.models.attendance import StudentAttendance
from app.services.user_service import UserService
from app.core.utils_functions import generate_id
from typing import List, Optional, Dict


class PrincipleService:
    @staticmethod
    def get_principle_by_id(db: Session, principle_id: str) -> Optional[Principle]:
        """Get principle by ID"""
        return db.query(Principle).filter(Principle.id == principle_id).first()

    @staticmethod
    def get_principle_by_user_id(db: Session, user_id: str) -> Optional[Principle]:
        """Get principle by user ID"""
        return db.query(Principle).filter(Principle.user_id == user_id).first()

    @staticmethod
    def get_principles_by_school(db: Session, school_id: str) -> List[Principle]:
        """Get all principles for a school"""
        return db.query(Principle).join(User).filter(
            User.school_id == school_id,
            User.role == "principle"
        ).all()

    @staticmethod
    def create_principle(db: Session, user_id: str, principle_data: dict) -> Principle:
        """Create principle profile for a user"""
        # Check if user exists and is a principle
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        if user.role != "principle":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a principle"
            )

        # Check if principle profile already exists
        existing_principle = PrincipleService.get_principle_by_user_id(db, user_id)
        if existing_principle:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Principle profile already exists for this user"
            )

        # Validate assigned school if provided
        if principle_data.get("assigned_school_id"):
            school = db.query(School).filter(School.id == principle_data["assigned_school_id"]).first()
            if not school:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid school ID"
                )

        # Create principle profile
        principle = Principle(
            id=generate_id(user.name + "_principle"),
            user_id=user_id,
            qualification=principle_data.get("qualification"),
            experience_years=principle_data.get("experience_years"),
            specialization=principle_data.get("specialization"),
            designation=principle_data.get("designation"),
            assigned_school_id=principle_data.get("assigned_school_id"),
            office_phone=principle_data.get("office_phone"),
            office_email=principle_data.get("office_email")
        )

        db.add(principle)
        db.commit()
        db.refresh(principle)
        return principle

    @staticmethod
    def update_principle(db: Session, principle_id: str, update_data: dict, updated_by: str) -> Principle:
        """Update principle profile"""
        principle = PrincipleService.get_principle_by_id(db, principle_id)
        if not principle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Principle not found"
            )

        # Check permissions (only subadmin of same school can update)
        current_user = db.query(User).filter(User.id == updated_by).first()
        if current_user.role != "subadmin" or current_user.school_id != principle.user.school_id:
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
            UserService.update_user(db, principle.user_id, user_update_data, updated_by)

        # Update principle fields
        updatable_fields = [
            "qualification", "experience_years", "specialization", "designation",
            "office_phone", "office_email"
        ]

        for field in updatable_fields:
            if field in update_data:
                setattr(principle, field, update_data[field])

        # Update assigned school if provided (with validation)
        if "assigned_school_id" in update_data:
            if update_data["assigned_school_id"]:
                school = db.query(School).filter(School.id == update_data["assigned_school_id"]).first()
                if not school:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid school ID"
                    )
            principle.assigned_school_id = update_data["assigned_school_id"]

        db.commit()
        db.refresh(principle)
        return principle

    @staticmethod
    def delete_principle(db: Session, principle_id: str, deleted_by: str) -> bool:
        """Delete principle profile (soft delete by deactivating user)"""
        principle = PrincipleService.get_principle_by_id(db, principle_id)
        if not principle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Principle not found"
            )

        # Check permissions (only subadmin of same school can delete)
        current_user = db.query(User).filter(User.id == deleted_by).first()
        if current_user.role != "subadmin" or current_user.school_id != principle.user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Soft delete - deactivate user
        principle.user.is_active = False
        db.commit()

        return True

    @staticmethod
    def get_school_dashboard_stats(db: Session, school_id: str) -> Dict:
        """Get dashboard statistics for a school (principle view)"""
        # Get total students
        total_students = db.query(User).filter(
            User.school_id == school_id,
            User.role == "student",
            User.is_active == True
        ).count()

        # Get total teachers
        total_teachers = db.query(User).filter(
            User.school_id == school_id,
            User.role == "teacher",
            User.is_active == True
        ).count()

        # Get total classes (using Class model)
        total_classes = db.query(Class).filter(
            Class.school_id == school_id,
            Class.is_active == True
        ).count()

        # Calculate average attendance
        # Get attendance data for current month (simplified - you might want to adjust this logic)
        from app.models.student import Student
        attendance_stats = db.query(
            func.avg(
                case((StudentAttendance.status == "present", 100), else_=0)
            ).label("avg_attendance")
        ).join(Student, StudentAttendance.student_id == Student.id).join(User, Student.user_id == User.id).filter(
            User.school_id == school_id,
            User.is_active == True
        ).first()

        average_attendance = round(attendance_stats.avg_attendance or 0, 1)

        return {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_classes": total_classes,
            "average_attendance": average_attendance
        }

    @staticmethod
    def get_school_departments_stats(db: Session, school_id: str) -> List[Dict]:
        """Get department-wise statistics for a school"""
        # This would require more complex queries based on your subject/department structure
        # For now, returning basic structure that can be enhanced later
        departments = []

        # You could implement this based on Subject model or Class-Subject relationships
        # For demonstration, returning empty list that can be populated later

        return departments

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.parent import Parent
from app.models.users import User
from app.core.utils_functions import generate_id
from typing import List, Optional


class ParentService:
    @staticmethod
    def get_parent_by_id(db: Session, parent_id: str) -> Optional[Parent]:
        """Get parent by ID"""
        return db.query(Parent).filter(Parent.id == parent_id).first()

    @staticmethod
    def get_parent_by_user_id(db: Session, user_id: str) -> Optional[Parent]:
        """Get parent by user ID"""
        return db.query(Parent).filter(Parent.user_id == user_id).first()

    @staticmethod
    def get_parents_by_school(db: Session, school_id: str) -> List[Parent]:
        """Get all parents for a school (whose children are in the school)"""
        return db.query(Parent).join(User).filter(
            User.school_id == school_id,
            User.role == "parent",
            User.is_active == True
        ).all()

    @staticmethod
    def create_parent(db: Session, user_id: str, parent_data: dict) -> Parent:
        """Create parent profile for a user"""
        # Check if user exists and is a parent
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        if user.role != "parent":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a parent"
            )

        # Check if parent profile already exists
        existing_parent = ParentService.get_parent_by_user_id(db, user_id)
        if existing_parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent profile already exists for this user"
            )

        # Create parent profile
        parent = Parent(
            id=generate_id(user.name + "_parent"),
            user_id=user_id,
            occupation=parent_data.get("occupation"),
            education_level=parent_data.get("education_level"),
            marital_status=parent_data.get("marital_status"),
            emergency_contact_name=parent_data.get("emergency_contact_name"),
            emergency_contact_phone=parent_data.get("emergency_contact_phone"),
            emergency_contact_relation=parent_data.get("emergency_contact_relation"),
            number_of_children=parent_data.get("number_of_children")
        )

        db.add(parent)
        db.commit()
        db.refresh(parent)
        return parent

    @staticmethod
    def update_parent(db: Session, parent_id: str, update_data: dict, updated_by: str) -> Parent:
        """Update parent profile"""
        parent = ParentService.get_parent_by_id(db, parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found"
            )

        # Check permissions (only subadmin of same school or the parent themselves can update)
        current_user = db.query(User).filter(User.id == updated_by).first()
        parent_user = parent.user

        if current_user.role == "subadmin":
            if current_user.school_id != parent_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
        elif current_user.id != parent_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Update parent fields
        updatable_fields = [
            "occupation", "education_level", "marital_status",
            "emergency_contact_name", "emergency_contact_phone", "emergency_contact_relation",
            "number_of_children"
        ]

        for field in updatable_fields:
            if field in update_data:
                setattr(parent, field, update_data[field])

        db.commit()
        db.refresh(parent)
        return parent

    @staticmethod
    def get_parent_children(db: Session, parent_user_id: str) -> List[dict]:
        """Get children associated with a parent"""
        parent_user = db.query(User).filter(User.id == parent_user_id).first()
        if not parent_user or parent_user.role != "parent":
            return []

        # Find all students where parent_id matches this parent's user ID
        children = db.query(User).filter(
            User.parent_id == parent_user_id,
            User.role == "student",
            User.is_active == True
        ).all()

        return [{
            "id": child.id,
            "name": child.name,
            "email": child.email,
            "school_id": child.school_id,
            "school_name": child.school.name if child.school else None,
            "class_name": child.student_profile.class_info.name if child.student_profile and child.student_profile.class_info else None
        } for child in children]

    @staticmethod
    def delete_parent(db: Session, parent_id: str, deleted_by: str) -> bool:
        """Delete parent profile (soft delete by deactivating user)"""
        parent = ParentService.get_parent_by_id(db, parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent not found"
            )

        # Check permissions (only subadmin of same school can delete)
        current_user = db.query(User).filter(User.id == deleted_by).first()
        if current_user.role != "subadmin" or current_user.school_id != parent.user.school_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )

        # Soft delete - deactivate user
        parent.user.is_active = False
        db.commit()

        return True

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse
from app.services.teacher_service import TeacherService
from app.services.user_service import UserService
from typing import List


router = APIRouter()


def get_current_user(request: Request) -> dict:
    """Get current user from request state (set by middleware)"""
    user = getattr(request.state, 'user', None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "name": user.name,
        "school_id": user.school_id
    }


# CREATE - Teacher profile creation (when user is created as teacher)
@router.post("/profile", response_model=TeacherResponse, tags=["Teacher - Profile"])
async def create_teacher_profile(
    teacher_data: TeacherCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create teacher profile for the current user (must be a teacher)"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can create teacher profiles"
        )

    try:
        teacher = TeacherService.create_teacher(db, current_user["user_id"], teacher_data.model_dump())

        # Get subjects information
        subjects = TeacherService.get_teacher_subjects(db, current_user["user_id"])

        teacher_response = {
            "id": teacher.id,
            "user_id": teacher.user_id,
            "qualification": teacher.qualification,
            "experience_years": teacher.experience_years,
            "specialization": teacher.specialization,
            "subjects": subjects,
            "created_at": teacher.created_at,
            "updated_at": teacher.updated_at
        }

        return TeacherResponse(**teacher_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create teacher profile: {str(e)}"
        )


# READ - Get teacher profile
@router.get("/profile", response_model=TeacherResponse, tags=["Teacher - Profile"])
async def get_teacher_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current teacher's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        teacher = TeacherService.get_teacher_by_user_id(db, current_user["user_id"])
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found"
            )

        subjects = TeacherService.get_teacher_subjects(db, current_user["user_id"])

        teacher_response = {
            "id": teacher.id,
            "user_id": teacher.user_id,
            "qualification": teacher.qualification,
            "experience_years": teacher.experience_years,
            "specialization": teacher.specialization,
            "subjects": subjects,
            "created_at": teacher.created_at,
            "updated_at": teacher.updated_at
        }

        return TeacherResponse(**teacher_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch teacher profile: {str(e)}"
        )


# UPDATE - Update teacher profile
@router.put("/profile", response_model=TeacherResponse, tags=["Teacher - Profile"])
async def update_teacher_profile(
    teacher_data: TeacherUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update current teacher's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        teacher = TeacherService.get_teacher_by_user_id(db, current_user["user_id"])
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Teacher profile not found"
            )

        updated_teacher = TeacherService.update_teacher(
            db, teacher.id, teacher_data.model_dump(), current_user["user_id"]
        )

        subjects = TeacherService.get_teacher_subjects(db, current_user["user_id"])

        teacher_response = {
            "id": updated_teacher.id,
            "user_id": updated_teacher.user_id,
            "qualification": updated_teacher.qualification,
            "experience_years": updated_teacher.experience_years,
            "specialization": updated_teacher.specialization,
            "subjects": subjects,
            "created_at": updated_teacher.created_at,
            "updated_at": updated_teacher.updated_at
        }

        return TeacherResponse(**teacher_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update teacher profile: {str(e)}"
        )


# LIST - Get teachers by school (for subadmin/principle)
@router.get("/school/{school_id}", response_model=List[TeacherResponse], tags=["Teacher - Management"])
async def get_school_teachers(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all teachers for a school (subadmin/principle only)"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] not in ["subadmin", "principle"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Subadmin can only see teachers from their school
    if current_user["role"] == "subadmin" and current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        teachers = TeacherService.get_teachers_by_school(db, school_id)
        result = []

        for teacher in teachers:
            subjects = TeacherService.get_teacher_subjects(db, teacher.user_id)
            teacher_response = {
                "id": teacher.id,
                "name": teacher.user.name,
                "email": teacher.user.email,
                "phone": teacher.user.phone,
                "user_id": teacher.user_id,
                "qualification": teacher.qualification,
                "experience_years": teacher.experience_years,
                "specialization": teacher.specialization,
                "subjects": subjects,
                "created_at": teacher.created_at,
                "updated_at": teacher.updated_at,
                "user": {
                    "id": teacher.user.id,
                    "name": teacher.user.name,
                    "email": teacher.user.email,
                    "phone": teacher.user.phone,
                    "is_active": teacher.user.is_active,
                    "address": {
                        "street": teacher.user.address.street if teacher.user.address else None,
                        "city": teacher.user.address.city if teacher.user.address else None,
                        "state": teacher.user.address.state if teacher.user.address else None,
                        "country": teacher.user.address.country if teacher.user.address else None,
                        "postal_code": teacher.user.address.postal_code if teacher.user.address else None,
                    } if teacher.user.address else None
                }
            }
            result.append(TeacherResponse(**teacher_response))

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch teachers: {str(e)}"
        )


# UPDATE - Update specific teacher (for subadmin)
@router.put("/{teacher_id}", response_model=TeacherResponse, tags=["Teacher - Management"])
async def update_teacher(
    teacher_id: str,
    teacher_data: TeacherUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a specific teacher (subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update teachers"
        )

    try:
        updated_teacher = TeacherService.update_teacher(
            db, teacher_id, teacher_data.model_dump(), current_user["user_id"]
        )

        subjects = TeacherService.get_teacher_subjects(db, updated_teacher.user_id)
        
        # Refresh to get updated user data
        db.refresh(updated_teacher.user)

        teacher_response = {
            "id": updated_teacher.id,
            "name": updated_teacher.user.name,
            "email": updated_teacher.user.email,
            "phone": updated_teacher.user.phone,
            "user_id": updated_teacher.user_id,
            "qualification": updated_teacher.qualification,
            "experience_years": updated_teacher.experience_years,
            "specialization": updated_teacher.specialization,
            "subjects": subjects,
            "created_at": updated_teacher.created_at,
            "updated_at": updated_teacher.updated_at,
            "user": {
                "id": updated_teacher.user.id,
                "name": updated_teacher.user.name,
                "email": updated_teacher.user.email,
                "phone": updated_teacher.user.phone,
                "is_active": updated_teacher.user.is_active,
                "address": {
                    "street": updated_teacher.user.address.street if updated_teacher.user.address else None,
                    "city": updated_teacher.user.address.city if updated_teacher.user.address else None,
                    "state": updated_teacher.user.address.state if updated_teacher.user.address else None,
                    "country": updated_teacher.user.address.country if updated_teacher.user.address else None,
                    "postal_code": updated_teacher.user.address.postal_code if updated_teacher.user.address else None,
                } if updated_teacher.user.address else None
            }
        }

        return TeacherResponse(**teacher_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update teacher: {str(e)}"
        )


# DELETE - Delete teacher (for subadmin)
@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Teacher - Management"])
async def delete_teacher(
    teacher_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a teacher (subadmin only) - soft delete"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can delete teachers"
        )

    try:
        TeacherService.delete_teacher(db, teacher_id, current_user["user_id"])
        return {"message": "Teacher deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete teacher: {str(e)}"
        )

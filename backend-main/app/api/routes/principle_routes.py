from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.principle import PrincipleCreate, PrincipleUpdate, PrincipleResponse
from app.services.principle_service import PrincipleService
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


# CREATE - Principle profile creation (when user is created as principle)
@router.post("/profile", response_model=PrincipleResponse, tags=["Principle - Profile"])
async def create_principle_profile(
    principle_data: PrincipleCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create principle profile for the current user (must be a principle)"""
    current_user = get_current_user(request)

    if current_user["role"] != "principle":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only principles can create principle profiles"
        )

    try:
        principle = PrincipleService.create_principle(db, current_user["user_id"], principle_data.model_dump())

        # Get assigned school information
        assigned_school = {
            "id": principle.assigned_school.id,
            "name": principle.assigned_school.name,
            "address": principle.assigned_school.address
        } if principle.assigned_school else None

        principle_response = {
            "id": principle.id,
            "user_id": principle.user_id,
            "qualification": principle.qualification,
            "experience_years": principle.experience_years,
            "specialization": principle.specialization,
            "designation": principle.designation,
            "assigned_school_id": principle.assigned_school_id,
            "assigned_school": assigned_school,
            "office_phone": principle.office_phone,
            "office_email": principle.office_email,
            "created_at": principle.created_at,
            "updated_at": principle.updated_at
        }

        return PrincipleResponse(**principle_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create principle profile: {str(e)}"
        )


# READ - Get principle profile
@router.get("/profile", response_model=PrincipleResponse, tags=["Principle - Profile"])
async def get_principle_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current principle's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "principle":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        principle = PrincipleService.get_principle_by_user_id(db, current_user["user_id"])
        if not principle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Principle profile not found"
            )

        assigned_school = {
            "id": principle.assigned_school.id,
            "name": principle.assigned_school.name,
            "address": principle.assigned_school.address
        } if principle.assigned_school else None

        principle_response = {
            "id": principle.id,
            "user_id": principle.user_id,
            "qualification": principle.qualification,
            "experience_years": principle.experience_years,
            "specialization": principle.specialization,
            "designation": principle.designation,
            "assigned_school_id": principle.assigned_school_id,
            "assigned_school": assigned_school,
            "office_phone": principle.office_phone,
            "office_email": principle.office_email,
            "created_at": principle.created_at,
            "updated_at": principle.updated_at
        }

        return PrincipleResponse(**principle_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch principle profile: {str(e)}"
        )


# UPDATE - Update principle profile
@router.put("/profile", response_model=PrincipleResponse, tags=["Principle - Profile"])
async def update_principle_profile(
    principle_data: PrincipleUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update current principle's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "principle":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        principle = PrincipleService.get_principle_by_user_id(db, current_user["user_id"])
        if not principle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Principle profile not found"
            )

        updated_principle = PrincipleService.update_principle(
            db, principle.id, principle_data.model_dump(), current_user["user_id"]
        )

        assigned_school = {
            "id": updated_principle.assigned_school.id,
            "name": updated_principle.assigned_school.name,
            "address": updated_principle.assigned_school.address
        } if updated_principle.assigned_school else None

        principle_response = {
            "id": updated_principle.id,
            "user_id": updated_principle.user_id,
            "qualification": updated_principle.qualification,
            "experience_years": updated_principle.experience_years,
            "specialization": updated_principle.specialization,
            "designation": updated_principle.designation,
            "assigned_school_id": updated_principle.assigned_school_id,
            "assigned_school": assigned_school,
            "office_phone": updated_principle.office_phone,
            "office_email": updated_principle.office_email,
            "created_at": updated_principle.created_at,
            "updated_at": updated_principle.updated_at
        }

        return PrincipleResponse(**principle_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update principle profile: {str(e)}"
        )


# LIST - Get principles by school (for subadmin)
@router.get("/school/{school_id}", response_model=List[PrincipleResponse], tags=["Principle - Management"])
async def get_school_principles(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all principles for a school (subadmin only)"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Subadmin can only see principles from their school
    if current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        principles = PrincipleService.get_principles_by_school(db, school_id)
        result = []

        for principle in principles:
            # Safely access assigned_school relationship
            assigned_school = None
            if principle.assigned_school_id:
                try:
                    if principle.assigned_school:
                        assigned_school = {
                            "id": principle.assigned_school.id,
                            "name": principle.assigned_school.name,
                            "address": principle.assigned_school.address
                        }
                except Exception:
                    assigned_school = None

            # Safely access user relationship
            user_data = None
            if principle.user:
                user_data = {
                    "id": principle.user.id,
                    "name": principle.user.name,
                    "email": principle.user.email,
                    "phone": principle.user.phone,
                    "is_active": principle.user.is_active,
                    "address": {
                        "street": principle.user.address.street if principle.user.address else None,
                        "city": principle.user.address.city if principle.user.address else None,
                        "state": principle.user.address.state if principle.user.address else None,
                        "country": principle.user.address.country if principle.user.address else None,
                        "postal_code": principle.user.address.postal_code if principle.user.address else None,
                    } if principle.user.address else None
                }

            principle_response = {
                "id": principle.id,
                "name": principle.user.name if principle.user else None,
                "email": principle.user.email if principle.user else None,
                "phone": principle.user.phone if principle.user else None,
                "user_id": principle.user_id,
                "qualification": principle.qualification,
                "experience_years": principle.experience_years,
                "specialization": principle.specialization,
                "designation": principle.designation,
                "assigned_school_id": principle.assigned_school_id,
                "assigned_school": assigned_school,
                "office_phone": principle.office_phone,
                "office_email": principle.office_email,
                "created_at": principle.created_at,
                "updated_at": principle.updated_at,
                "user": user_data
            }
            result.append(PrincipleResponse(**principle_response))

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch principles: {str(e)}"
        )


# UPDATE - Update specific principle (for subadmin)
@router.put("/{principle_id}", response_model=PrincipleResponse, tags=["Principle - Management"])
async def update_principle(
    principle_id: str,
    principle_data: PrincipleUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a specific principle (subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update principles"
        )

    try:
        updated_principle = PrincipleService.update_principle(
            db, principle_id, principle_data.model_dump(), current_user["user_id"]
        )

        assigned_school = {
            "id": updated_principle.assigned_school.id,
            "name": updated_principle.assigned_school.name,
            "address": updated_principle.assigned_school.address
        } if updated_principle.assigned_school else None

        principle_response = {
            "id": updated_principle.id,
            "name": updated_principle.user.name,
            "email": updated_principle.user.email,
            "phone": updated_principle.user.phone,
            "user_id": updated_principle.user_id,
            "qualification": updated_principle.qualification,
            "experience_years": updated_principle.experience_years,
            "specialization": updated_principle.specialization,
            "designation": updated_principle.designation,
            "assigned_school_id": updated_principle.assigned_school_id,
            "assigned_school": assigned_school,
            "office_phone": updated_principle.office_phone,
            "office_email": updated_principle.office_email,
            "created_at": updated_principle.created_at,
            "updated_at": updated_principle.updated_at,
            "user": {
                "id": updated_principle.user.id,
                "name": updated_principle.user.name,
                "email": updated_principle.user.email,
                "phone": updated_principle.user.phone,
                "is_active": updated_principle.user.is_active,
                "address": {
                    "street": updated_principle.user.address.street if updated_principle.user.address else None,
                    "city": updated_principle.user.address.city if updated_principle.user.address else None,
                    "state": updated_principle.user.address.state if updated_principle.user.address else None,
                    "country": updated_principle.user.address.country if updated_principle.user.address else None,
                    "postal_code": updated_principle.user.address.postal_code if updated_principle.user.address else None,
                } if updated_principle.user.address else None
            }
        }

        return PrincipleResponse(**principle_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update principle: {str(e)}"
        )


# DELETE - Delete principle (for subadmin)
@router.delete("/{principle_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Principle - Management"])
async def delete_principle(
    principle_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a principle (subadmin only) - soft delete"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can delete principles"
        )

    try:
        PrincipleService.delete_principle(db, principle_id, current_user["user_id"])
        return {"message": "Principle deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete principle: {str(e)}"
        )

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.parent import ParentCreate, ParentUpdate, ParentResponse
from app.services.parent_service import ParentService
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


# CREATE - Parent profile creation (when user is created as parent)
@router.post("/profile", response_model=ParentResponse, tags=["Parent - Profile"])
async def create_parent_profile(
    parent_data: ParentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create parent profile for the current user (must be a parent)"""
    current_user = get_current_user(request)

    if current_user["role"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parents can create parent profiles"
        )

    try:
        parent = ParentService.create_parent(db, current_user["user_id"], parent_data.model_dump())

        # Get associated children
        children = ParentService.get_parent_children(db, current_user["user_id"])

        parent_response = {
            "id": parent.id,
            "user_id": parent.user_id,
            "occupation": parent.occupation,
            "education_level": parent.education_level,
            "marital_status": parent.marital_status,
            "emergency_contact_name": parent.emergency_contact_name,
            "emergency_contact_phone": parent.emergency_contact_phone,
            "emergency_contact_relation": parent.emergency_contact_relation,
            "number_of_children": parent.number_of_children,
            "children": children,
            "created_at": parent.created_at,
            "updated_at": parent.updated_at
        }

        return ParentResponse(**parent_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create parent profile: {str(e)}"
        )


# READ - Get parent profile
@router.get("/profile", response_model=ParentResponse, tags=["Parent - Profile"])
async def get_parent_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get current parent's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        parent = ParentService.get_parent_by_user_id(db, current_user["user_id"])
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent profile not found"
            )

        children = ParentService.get_parent_children(db, current_user["user_id"])

        parent_response = {
            "id": parent.id,
            "user_id": parent.user_id,
            "occupation": parent.occupation,
            "education_level": parent.education_level,
            "marital_status": parent.marital_status,
            "emergency_contact_name": parent.emergency_contact_name,
            "emergency_contact_phone": parent.emergency_contact_phone,
            "emergency_contact_relation": parent.emergency_contact_relation,
            "number_of_children": parent.number_of_children,
            "children": children,
            "created_at": parent.created_at,
            "updated_at": parent.updated_at
        }

        return ParentResponse(**parent_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch parent profile: {str(e)}"
        )


# UPDATE - Update parent profile
@router.put("/profile", response_model=ParentResponse, tags=["Parent - Profile"])
async def update_parent_profile(
    parent_data: ParentUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update current parent's profile"""
    current_user = get_current_user(request)

    if current_user["role"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        parent = ParentService.get_parent_by_user_id(db, current_user["user_id"])
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent profile not found"
            )

        updated_parent = ParentService.update_parent(
            db, parent.id, parent_data.model_dump(), current_user["user_id"]
        )

        children = ParentService.get_parent_children(db, current_user["user_id"])

        parent_response = {
            "id": updated_parent.id,
            "user_id": updated_parent.user_id,
            "occupation": updated_parent.occupation,
            "education_level": updated_parent.education_level,
            "marital_status": updated_parent.marital_status,
            "emergency_contact_name": updated_parent.emergency_contact_name,
            "emergency_contact_phone": updated_parent.emergency_contact_phone,
            "emergency_contact_relation": updated_parent.emergency_contact_relation,
            "number_of_children": updated_parent.number_of_children,
            "children": children,
            "created_at": updated_parent.created_at,
            "updated_at": updated_parent.updated_at
        }

        return ParentResponse(**parent_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update parent profile: {str(e)}"
        )


# READ - Get parent's children
@router.get("/children", tags=["Parent - Profile"])
async def get_parent_children(
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all children associated with the current parent"""
    current_user = get_current_user(request)

    if current_user["role"] != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        children = ParentService.get_parent_children(db, current_user["user_id"])
        return {"children": children}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch children: {str(e)}"
        )


# LIST - Get parents by school (for subadmin)
@router.get("/school/{school_id}", response_model=List[ParentResponse], tags=["Parent - Management"])
async def get_school_parents(
    school_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all parents for a school (subadmin only)"""
    current_user = get_current_user(request)

    # Check permissions
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Subadmin can only see parents from their school
    if current_user["school_id"] != school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    try:
        parents = ParentService.get_parents_by_school(db, school_id)
        result = []

        for parent in parents:
            children = ParentService.get_parent_children(db, parent.user_id)
            parent_response = {
                "id": parent.id,
                "user_id": parent.user_id,
                "occupation": parent.occupation,
                "education_level": parent.education_level,
                "marital_status": parent.marital_status,
                "emergency_contact_name": parent.emergency_contact_name,
                "emergency_contact_phone": parent.emergency_contact_phone,
                "emergency_contact_relation": parent.emergency_contact_relation,
                "number_of_children": parent.number_of_children,
                "children": children,
                "created_at": parent.created_at,
                "updated_at": parent.updated_at
            }
            result.append(ParentResponse(**parent_response))

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch parents: {str(e)}"
        )


# UPDATE - Update specific parent (for subadmin)
@router.put("/{parent_id}", response_model=ParentResponse, tags=["Parent - Management"])
async def update_parent(
    parent_id: str,
    parent_data: ParentUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a specific parent (subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update parents"
        )

    try:
        updated_parent = ParentService.update_parent(
            db, parent_id, parent_data.model_dump(), current_user["user_id"]
        )

        children = ParentService.get_parent_children(db, updated_parent.user_id)

        parent_response = {
            "id": updated_parent.id,
            "user_id": updated_parent.user_id,
            "occupation": updated_parent.occupation,
            "education_level": updated_parent.education_level,
            "marital_status": updated_parent.marital_status,
            "emergency_contact_name": updated_parent.emergency_contact_name,
            "emergency_contact_phone": updated_parent.emergency_contact_phone,
            "emergency_contact_relation": updated_parent.emergency_contact_relation,
            "number_of_children": updated_parent.number_of_children,
            "children": children,
            "created_at": updated_parent.created_at,
            "updated_at": updated_parent.updated_at
        }

        return ParentResponse(**parent_response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update parent: {str(e)}"
        )


# DELETE - Delete parent (for subadmin)
@router.delete("/{parent_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Parent - Management"])
async def delete_parent(
    parent_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a parent (subadmin only) - soft delete"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can delete parents"
        )

    try:
        ParentService.delete_parent(db, parent_id, current_user["user_id"])
        return {"message": "Parent deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete parent: {str(e)}"
        )

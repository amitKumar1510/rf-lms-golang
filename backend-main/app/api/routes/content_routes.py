from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.content import (
    ModuleCreate, ModuleUpdate, ModuleResponse,
    SubmoduleCreate, SubmoduleUpdate, SubmoduleResponse,
    ContentCreate, ContentUpdate, ContentResponse
)
from app.services.content_service import ContentService
from typing import List
import os
import uuid
from pathlib import Path

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path("uploads/content")
# Create directory if it doesn't exist
try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Upload directory created/verified: {UPLOAD_DIR.absolute()}")
except Exception as e:
    print(f"Error creating upload directory: {str(e)}")


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


# Module Routes
@router.post("/subjects/{subject_id}/modules", response_model=ModuleResponse, tags=["Content - Modules"])
async def create_module(
    subject_id: str,
    module_data: ModuleCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a module for a subject (Subadmin only)"""
    current_user = get_current_user(request)

    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can create modules"
        )

    try:
        module_dict = module_data.model_dump()
        module_dict["subject_id"] = subject_id
        module = ContentService.create_module(db, module_dict)
        
        # Get submodules
        submodules = ContentService.get_submodules_by_module(db, module.id)
        
        return ModuleResponse(
            id=module.id,
            subject_id=module.subject_id,
            name=module.name,
            description=module.description,
            order_index=module.order_index,
            submodules=submodules,
            is_active=module.is_active,
            created_at=module.created_at,
            updated_at=module.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating module: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create module"
        )


@router.get("/subjects/{subject_id}/modules", response_model=List[ModuleResponse], tags=["Content - Modules"])
async def get_subject_modules(
    subject_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get all modules for a subject"""
    current_user = get_current_user(request)
    
    try:
        modules = ContentService.get_modules_by_subject(db, subject_id)
        result = []
        
        for module in modules:
            submodules = ContentService.get_submodules_by_module(db, module.id)
            submodule_list = []
            
            for submodule in submodules:
                contents = ContentService.get_contents_by_submodule(db, submodule.id)
                submodule_list.append(SubmoduleResponse(
                    id=submodule.id,
                    module_id=submodule.module_id,
                    name=submodule.name,
                    description=submodule.description,
                    order_index=submodule.order_index,
                    contents=[ContentResponse(
                        id=c.id,
                        submodule_id=c.submodule_id,
                        title=c.title,
                        content_type=c.content_type,
                        content_data=c.content_data,
                        file_url=c.file_url,
                        file_name=c.file_name,
                        file_size=c.file_size,
                        mime_type=c.mime_type,
                        order_index=c.order_index,
                        is_active=c.is_active,
                        created_at=c.created_at,
                        updated_at=c.updated_at
                    ) for c in contents],
                    is_active=submodule.is_active,
                    created_at=submodule.created_at,
                    updated_at=submodule.updated_at
                ))
            
            result.append(ModuleResponse(
                id=module.id,
                subject_id=module.subject_id,
                name=module.name,
                description=module.description,
                order_index=module.order_index,
                submodules=submodule_list,
                is_active=module.is_active,
                created_at=module.created_at,
                updated_at=module.updated_at
            ))
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch modules: {str(e)}"
        )


@router.put("/modules/{module_id}", response_model=ModuleResponse, tags=["Content - Modules"])
async def update_module(
    module_id: str,
    module_data: ModuleUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a module (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update modules"
        )
    
    try:
        module = ContentService.update_module(db, module_id, module_data.model_dump(exclude_unset=True))
        submodules = ContentService.get_submodules_by_module(db, module.id)
        
        return ModuleResponse(
            id=module.id,
            subject_id=module.subject_id,
            name=module.name,
            description=module.description,
            order_index=module.order_index,
            submodules=[SubmoduleResponse(
                id=s.id,
                module_id=s.module_id,
                name=s.name,
                description=s.description,
                order_index=s.order_index,
                contents=[],
                is_active=s.is_active,
                created_at=s.created_at,
                updated_at=s.updated_at
            ) for s in submodules],
            is_active=module.is_active,
            created_at=module.created_at,
            updated_at=module.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update module: {str(e)}"
        )


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Content - Modules"])
async def delete_module(
    module_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a module (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can delete modules"
        )
    
    try:
        ContentService.delete_module(db, module_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete module: {str(e)}"
        )


# Submodule Routes
@router.post("/modules/{module_id}/submodules", response_model=SubmoduleResponse, tags=["Content - Submodules"])
async def create_submodule(
    module_id: str,
    submodule_data: SubmoduleCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create a submodule for a module (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can create submodules"
        )
    
    try:
        submodule_dict = submodule_data.model_dump()
        submodule_dict["module_id"] = module_id
        submodule = ContentService.create_submodule(db, submodule_dict)
        contents = ContentService.get_contents_by_submodule(db, submodule.id)
        
        return SubmoduleResponse(
            id=submodule.id,
            module_id=submodule.module_id,
            name=submodule.name,
            description=submodule.description,
            order_index=submodule.order_index,
            contents=[ContentResponse(
                id=c.id,
                submodule_id=c.submodule_id,
                title=c.title,
                content_type=c.content_type,
                content_data=c.content_data,
                file_url=c.file_url,
                file_name=c.file_name,
                file_size=c.file_size,
                mime_type=c.mime_type,
                order_index=c.order_index,
                is_active=c.is_active,
                created_at=c.created_at,
                updated_at=c.updated_at
            ) for c in contents],
            is_active=submodule.is_active,
            created_at=submodule.created_at,
            updated_at=submodule.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create submodule: {str(e)}"
        )


@router.put("/submodules/{submodule_id}", response_model=SubmoduleResponse, tags=["Content - Submodules"])
async def update_submodule(
    submodule_id: str,
    submodule_data: SubmoduleUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update a submodule (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update submodules"
        )
    
    try:
        submodule = ContentService.update_submodule(db, submodule_id, submodule_data.model_dump(exclude_unset=True))
        contents = ContentService.get_contents_by_submodule(db, submodule.id)
        
        return SubmoduleResponse(
            id=submodule.id,
            module_id=submodule.module_id,
            name=submodule.name,
            description=submodule.description,
            order_index=submodule.order_index,
            contents=[ContentResponse(
                id=c.id,
                submodule_id=c.submodule_id,
                title=c.title,
                content_type=c.content_type,
                content_data=c.content_data,
                file_url=c.file_url,
                file_name=c.file_name,
                file_size=c.file_size,
                mime_type=c.mime_type,
                order_index=c.order_index,
                is_active=c.is_active,
                created_at=c.created_at,
                updated_at=c.updated_at
            ) for c in contents],
            is_active=submodule.is_active,
            created_at=submodule.created_at,
            updated_at=submodule.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update submodule: {str(e)}"
        )


@router.delete("/submodules/{submodule_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Content - Submodules"])
async def delete_submodule(
    submodule_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete a submodule (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can delete submodules"
        )
    
    try:
        ContentService.delete_submodule(db, submodule_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete submodule: {str(e)}"
        )


# Content Routes
@router.post("/submodules/{submodule_id}/contents", response_model=ContentResponse, tags=["Content - Contents"])
async def create_content(
    submodule_id: str,
    content_data: ContentCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Create content for a submodule (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can create content"
        )
    
    try:
        content_dict = content_data.model_dump()
        content_dict["submodule_id"] = submodule_id
        content = ContentService.create_content(db, content_dict)
        
        return ContentResponse(
            id=content.id,
            submodule_id=content.submodule_id,
            title=content.title,
            content_type=content.content_type,
            content_data=content.content_data,
            file_url=content.file_url,
            file_name=content.file_name,
            file_size=content.file_size,
            mime_type=content.mime_type,
            order_index=content.order_index,
            is_active=content.is_active,
            created_at=content.created_at,
            updated_at=content.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create content: {str(e)}"
        )


@router.post("/submodules/{submodule_id}/contents/upload", response_model=ContentResponse, tags=["Content - Contents"])
async def upload_content_file(
    submodule_id: str,
    title: str = Form(...),
    content_type: str = Form(...),
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Upload a file (PPT, PDF, etc.) as content (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can upload content"
        )
    
    try:
        print(f"Upload request received - title: {title}, content_type: {content_type}, file: {file.filename if file else 'None'}")

        # Validate required fields
        if not title or not title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title is required"
            )

        # Validate content_type
        allowed_types = ["ppt", "pdf", "video", "image", "other"]
        if content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content type. Must be one of: {', '.join(allowed_types)}"
            )

        # Validate file
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )

        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file"
            )

        # Save file
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        with open(file_path, "wb") as buffer:
            content_bytes = await file.read()
            buffer.write(content_bytes)

        # Create content record
        content_dict = {
            "submodule_id": submodule_id,
            "title": title,
            "content_type": content_type,
            "file_url": f"/uploads/content/{unique_filename}",
            "file_name": file.filename,
            "file_size": len(content_bytes),
            "mime_type": file.content_type,
            "order_index": 0
        }

        content = ContentService.create_content(db, content_dict)
        
        return ContentResponse(
            id=content.id,
            submodule_id=content.submodule_id,
            title=content.title,
            content_type=content.content_type,
            content_data=content.content_data,
            file_url=content.file_url,
            file_name=content.file_name,
            file_size=content.file_size,
            mime_type=content.mime_type,
            order_index=content.order_index,
            is_active=content.is_active,
            created_at=content.created_at,
            updated_at=content.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload content: {str(e)}"
        )


@router.put("/contents/{content_id}", response_model=ContentResponse, tags=["Content - Contents"])
async def update_content(
    content_id: str,
    content_data: ContentUpdate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Update content (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can update content"
        )
    
    try:
        content = ContentService.update_content(db, content_id, content_data.model_dump(exclude_unset=True))
        
        return ContentResponse(
            id=content.id,
            submodule_id=content.submodule_id,
            title=content.title,
            content_type=content.content_type,
            content_data=content.content_data,
            file_url=content.file_url,
            file_name=content.file_name,
            file_size=content.file_size,
            mime_type=content.mime_type,
            order_index=content.order_index,
            is_active=content.is_active,
            created_at=content.created_at,
            updated_at=content.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update content: {str(e)}"
        )


@router.delete("/contents/{content_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Content - Contents"])
async def delete_content(
    content_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Delete content (Subadmin only)"""
    current_user = get_current_user(request)
    
    if current_user["role"] != "subadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only subadmin can delete content"
        )
    
    try:
        ContentService.delete_content(db, content_id)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete content: {str(e)}"
        )


@router.get("/subjects/{subject_id}/content-tree", tags=["Content - Tree"])
async def get_subject_content_tree(
    subject_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get complete content tree for a subject"""
    current_user = get_current_user(request)
    
    try:
        tree = ContentService.get_subject_content_tree(db, subject_id)
        return tree
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch content tree: {str(e)}"
        )


@router.get("/files/{filename}", tags=["Content - Files"])
async def get_content_file(filename: str):
    """Serve uploaded content files"""
    from pathlib import Path
    from fastapi.responses import FileResponse

    file_path = Path("uploads/content") / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    # Determine media type based on file extension
    media_type = "application/octet-stream"
    if filename.lower().endswith('.pdf'):
        media_type = "application/pdf"
    elif filename.lower().endswith(('.ppt', '.pptx')):
        media_type = "application/vnd.ms-powerpoint"
    elif filename.lower().endswith(('.mp4', '.avi', '.mov')):
        media_type = "video/mp4"
    elif filename.lower().endswith(('.jpg', '.jpeg', '.png', '.gif')):
        media_type = f"image/{filename.split('.')[-1].lower()}"
    elif filename.lower().endswith('.txt'):
        media_type = "text/plain"

    # Create response with proper headers for download
    response = FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_type
    )

    # Add headers to force download
    response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'

    return response


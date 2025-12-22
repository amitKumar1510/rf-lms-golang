from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.content import ContentCreate, ContentResponse, ContentUpdate
from app.services.content import ContentService


router = APIRouter()


@router.post("/create/{submodule_id}", response_model=ContentResponse, tags=["Content"])
async def create_content(
    request: Request,
    submodule_id: str,
    title: str = Form(...),
    content_type: str = Form(...),
    content_data: Optional[str] = Form(None),
    order_index: int = Form(0),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    school_id = getattr(request.state.user, "school_id", None)
    payload = ContentCreate(
        title=title,
        content_type=content_type,
        content_data=content_data,
        order_index=order_index,
    )
    res = await ContentService.create_content(db, school_id, submodule_id, payload, file=file)
    if res.file_url:
        res.file_url = ContentService.convert_to_public_url(request, res.file_url)
    return res


@router.get("/get/{submodule_id}/{content_id}", response_model=ContentResponse, tags=["Content"])
def get_content(request: Request, submodule_id: str, content_id: str, db: Session = Depends(get_db)):
    res = ContentService.get_content(db, content_id, submodule_id)
    if res.file_url:
        res.file_url = ContentService.convert_to_public_url(request, res.file_url)
    return res


@router.get("/get-all/{submodule_id}", response_model=list[ContentResponse], tags=["Content"])
def get_all_contents(request: Request, submodule_id: str, db: Session = Depends(get_db)):
    items = ContentService.get_all_contents(db, submodule_id)
    for it in items:
        if it.file_url:
            it.file_url = ContentService.convert_to_public_url(request, it.file_url)
    return items


@router.put("/update/{submodule_id}/{content_id}", response_model=ContentResponse, tags=["Content"])
async def update_content(
    request: Request,
    submodule_id: str,
    content_id: str,
    title: Optional[str] = Form(None),
    content_type: Optional[str] = Form(None),
    content_data: Optional[str] = Form(None),
    file_url: Optional[str] = Form(None),
    file_name: Optional[str] = Form(None),
    file_size: Optional[int] = Form(None),
    mime_type: Optional[str] = Form(None),
    order_index: Optional[int] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    school_id = getattr(request.state.user, "school_id", None)
    payload = ContentUpdate(
        title=title,
        content_type=content_type,
        content_data=content_data,
        file_url=file_url,
        file_name=file_name,
        file_size=file_size,
        mime_type=mime_type,
        order_index=order_index,
    )
    res = await ContentService.update_content(db, school_id, content_id, submodule_id, payload, file=file)
    if res.file_url:
        res.file_url = ContentService.convert_to_public_url(request, res.file_url)
    return res


@router.delete("/delete/{submodule_id}/{content_id}", response_model=dict, tags=["Content"])
def delete_content(request: Request, submodule_id: str, content_id: str, db: Session = Depends(get_db)):
    school_id = getattr(request.state.user, "school_id", None)
    return ContentService.delete_content(db, school_id, content_id, submodule_id)


@router.post("/deactivate/{submodule_id}/{content_id}", response_model=dict, tags=["Content"])
def deactivate_content(request: Request, submodule_id: str, content_id: str, db: Session = Depends(get_db)):
    return ContentService.deactivate_content(db, content_id, submodule_id)


@router.post("/activate/{submodule_id}/{content_id}", response_model=dict, tags=["Content"])
def activate_content(request: Request, submodule_id: str, content_id: str, db: Session = Depends(get_db)):
    return ContentService.activate_content(db, content_id, submodule_id)


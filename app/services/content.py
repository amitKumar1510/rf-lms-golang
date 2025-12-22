import os
from typing import Optional

from fastapi import HTTPException, UploadFile, status, Request
from sqlalchemy.orm import Session

from app.core.utils_functions import generate_id
from app.models.content import Content, Submodule
from app.schemas.content import ContentCreate, ContentResponse, ContentUpdate
from app.services.file_service import FileUploadService


class ContentService:
    UPLOAD_FOLDER = "content"

    @staticmethod
    def _validate_content_inputs(content_type: str, content_data: Optional[str], file: Optional[UploadFile]):
        allowed = {"ppt", "pdf", "video", "text", "image", "other"}
        if content_type not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content_type '{content_type}'. Allowed: {sorted(allowed)}",
            )
        if file is None and (content_data is None or str(content_data).strip() == ""):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either upload a file or provide content_data.",
            )

    @staticmethod
    def _validate_stored_content(content_type: str, content_data: Optional[str], file_url: Optional[str]):
        allowed = {"ppt", "pdf", "video", "text", "image", "other"}
        if content_type not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid content_type '{content_type}'. Allowed: {sorted(allowed)}",
            )
        if (file_url is None or str(file_url).strip() == "") and (content_data is None or str(content_data).strip() == ""):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid content: both file_url and content_data are empty.",
            )

    @staticmethod
    def _file_url_from_path(filepath: str) -> str:
        # Convert OS path like uploads\\school\\content\\x.pdf -> /uploads/school/content/x.pdf
        fp = filepath.replace("\\", "/")
        if fp.startswith("uploads/"):
            return "/" + fp
        return fp

    @staticmethod
    def _local_path_from_url(file_url: str) -> str:
        # Convert /uploads/... -> uploads/...
        if not file_url:
            return ""
        return file_url.lstrip("/").replace("/", os.sep)

    @staticmethod
    def _get_content_or_404(db: Session, content_id: str, submodule_id: str) -> Content:
        content = (
            db.query(Content)
            .filter(
                Content.id == content_id,
                Content.submodule_id == submodule_id,
                Content.is_deleted == False,
            )
            .first()
        )
        if not content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content not found")
        return content

    @staticmethod
    async def create_content(
        db: Session,
        school_id: str,
        submodule_id: str,
        data: ContentCreate,
        file: Optional[UploadFile] = None,
    ):
        submodule = (
            db.query(Submodule)
            .filter(Submodule.id == submodule_id, Submodule.is_deleted == False)
            .first()
        )
        if not submodule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submodule not found")

        ContentService._validate_content_inputs(data.content_type, data.content_data, file)

        file_url = None
        file_name = None
        file_size = None
        mime_type = None

        if file is not None:
            uploader = FileUploadService(school_id or "global")
            meta = await uploader.upload_file(file, ContentService.UPLOAD_FOLDER)
            filepath = meta["filepath"]
            file_url = ContentService._file_url_from_path(filepath)
            file_name = file.filename
            mime_type = file.content_type
            try:
                file_size = os.path.getsize(filepath)
            except OSError:
                file_size = None

        content = Content(
            id=generate_id("content"),
            title=data.title,
            content_type=data.content_type,
            content_data=data.content_data,
            file_url=file_url,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            order_index=data.order_index,
            submodule_id=submodule_id,
        )
        db.add(content)
        db.commit()
        db.refresh(content)
        return ContentResponse.model_validate(content)

    @staticmethod
    def get_content(db: Session, content_id: str, submodule_id: str):
        content = ContentService._get_content_or_404(db, content_id, submodule_id)
        return ContentResponse.model_validate(content)

    @staticmethod
    def get_all_contents(db: Session, submodule_id: str):
        contents = (
            db.query(Content)
            .filter(
                Content.submodule_id == submodule_id,
                Content.is_deleted == False,
                Content.is_active == True,
            )
            .all()
        )
        return [ContentResponse.model_validate(content) for content in contents]

    @staticmethod
    async def update_content(
        db: Session,
        school_id: str,
        content_id: str,
        submodule_id: str,
        data: ContentUpdate,
        file: Optional[UploadFile] = None,
    ):
        content = ContentService._get_content_or_404(db, content_id, submodule_id)

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(content, field, value)

        if file is not None:
            # delete old file if present
            if content.file_url:
                old_path = ContentService._local_path_from_url(content.file_url)
                FileUploadService(school_id or "global").delete_file(old_path)

            uploader = FileUploadService(school_id or "global")
            meta = await uploader.upload_file(file, ContentService.UPLOAD_FOLDER)
            filepath = meta["filepath"]
            content.file_url = ContentService._file_url_from_path(filepath)
            content.file_name = file.filename
            content.mime_type = file.content_type
            try:
                content.file_size = os.path.getsize(filepath)
            except OSError:
                content.file_size = None

        ContentService._validate_stored_content(content.content_type, content.content_data, content.file_url)

        db.commit()
        db.refresh(content)
        return ContentResponse.model_validate(content)

    @staticmethod
    def delete_content(db: Session, school_id: str, content_id: str, submodule_id: str):
        content = ContentService._get_content_or_404(db, content_id, submodule_id)
        content.is_deleted = True
        if content.file_url:
            old_path = ContentService._local_path_from_url(content.file_url)
            FileUploadService(school_id or "global").delete_file(old_path)
        db.commit()
        db.refresh(content)
        return {"message": "Content deleted successfully"}

    @staticmethod
    def deactivate_content(db: Session, content_id: str, submodule_id: str):
        content = ContentService._get_content_or_404(db, content_id, submodule_id)
        content.is_active = False
        db.commit()
        db.refresh(content)
        return {"message": "Content deactivated successfully"}

    @staticmethod
    def activate_content(db: Session, content_id: str, submodule_id: str):
        content = ContentService._get_content_or_404(db, content_id, submodule_id)
        content.is_active = True
        db.commit()
        db.refresh(content)
        return {"message": "Content activated successfully"}

    @staticmethod
    def convert_to_public_url(request: Request, file_url: str | None):
        """
        Convert a stored file_url (usually "/uploads/...") into an absolute URL using request.base_url.
        If file_url is already absolute, it is returned as-is.
        """
        if not file_url:
            return None
        # already absolute?
        if file_url.startswith("http://") or file_url.startswith("https://"):
            return file_url
        base = str(request.base_url).rstrip("/")
        path = file_url.replace("\\", "/")
        if not path.startswith("/"):
            path = "/" + path
        return f"{base}{path}"
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class ChatConversationCreate(BaseModel):
    teacher_id: Optional[str] = None   # required when parent creates
    parent_id: Optional[str] = None    # required when teacher creates
    class_subject_id: Optional[str] = None


class ChatConversationParticipant(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None

    # Extra context for teacher conversation list (optional)
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    class_section: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ChatConversationResponse(BaseModel):
    id: str
    school_id: str
    parent_id: str
    teacher_id: str
    class_subject_id: Optional[str] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    parent: Optional[ChatConversationParticipant] = None
    teacher: Optional[ChatConversationParticipant] = None

    model_config = ConfigDict(from_attributes=True)


class ChatMessageCreate(BaseModel):
    text: str


class ChatMessageUpdate(BaseModel):
    text: str


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_role: str
    sender_id: str
    text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessagesResponse(BaseModel):
    items: List[ChatMessageResponse]



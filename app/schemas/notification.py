from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class NotificationSendRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=5000)
    audience: str = Field(..., description="all|subadmin|teacher|student|parent|principle")


class NotificationResponse(BaseModel):
    id: str
    school_id: str
    title: str
    message: str
    created_by_role: str
    created_by_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationRecipientResponse(BaseModel):
    id: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    notification: NotificationResponse

    class Config:
        from_attributes = True


class InboxResponse(BaseModel):
    items: List[NotificationRecipientResponse]


class UnreadCountResponse(BaseModel):
    count: int



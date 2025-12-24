from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
import anyio

from app.config.database import get_db
from app.schemas.chat import (
    ChatConversationCreate,
    ChatConversationParticipant,
    ChatConversationResponse,
    ChatMessageCreate,
    ChatMessageUpdate,
    ChatMessageResponse,
    ChatMessagesResponse,
)
from app.services.chat_service import ChatService
from app.models.chat import ChatConversation
from app.realtime.hub import hub

router = APIRouter()


def _actor(request: Request):
    u = request.state.user
    role = getattr(u, "role", None)
    school_id = getattr(u, "school_id", None)
    if not role or not school_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if role == "parent":
        return {"role": "parent", "school_id": school_id, "id": getattr(u, "id", None)}
    if role == "teacher":
        return {"role": "teacher", "school_id": school_id, "id": getattr(u, "teacher_id", None)}
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only parent/teacher can use chat")


@router.get("/conversations", response_model=list[ChatConversationResponse], tags=["Chat"])
def list_conversations(request: Request, db: Session = Depends(get_db)):
    a = _actor(request)
    if a["role"] == "parent":
        items = ChatService.list_conversations_for_parent(db, a["school_id"], a["id"])
    else:
        items = ChatService.list_conversations_for_teacher(db, a["school_id"], a["id"])

    out = []
    for c in items:
        resp = ChatConversationResponse.model_validate(c)
        try:
            resp.parent = (
                ChatConversationParticipant.model_validate(ChatService.to_participant_parent(c.parent)) if c.parent else None
            )
        except Exception:
            resp.parent = None
        try:
            resp.teacher = (
                ChatConversationParticipant.model_validate(ChatService.to_participant_teacher(c.teacher)) if c.teacher else None
            )
        except Exception:
            resp.teacher = None
        out.append(resp)
    return out


@router.post("/conversations", response_model=ChatConversationResponse, tags=["Chat"])
def create_conversation(request: Request, data: ChatConversationCreate, db: Session = Depends(get_db)):
    a = _actor(request)
    if a["role"] == "parent":
        if not data.teacher_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="teacher_id is required")
        conv = ChatService.get_or_create_conversation(db, a["school_id"], a["id"], data.teacher_id, class_subject_id=data.class_subject_id)
    else:
        if not data.parent_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="parent_id is required")
        conv = ChatService.get_or_create_conversation(db, a["school_id"], data.parent_id, a["id"], class_subject_id=data.class_subject_id)

    resp = ChatConversationResponse.model_validate(conv)
    try:
        resp.parent = (
            ChatConversationParticipant.model_validate(ChatService.to_participant_parent(conv.parent)) if conv.parent else None
        )
    except Exception:
        resp.parent = None
    try:
        resp.teacher = (
            ChatConversationParticipant.model_validate(ChatService.to_participant_teacher(conv.teacher)) if conv.teacher else None
        )
    except Exception:
        resp.teacher = None
    return resp


@router.get("/conversations/{conversation_id}/messages", response_model=ChatMessagesResponse, tags=["Chat"])
def list_messages(request: Request, conversation_id: str, db: Session = Depends(get_db), limit: int = 50):
    a = _actor(request)
    items = ChatService.list_messages(db, conversation_id, a["role"], a["id"], limit=limit)
    return {"items": [ChatMessageResponse.model_validate(m) for m in items]}


@router.post("/conversations/{conversation_id}/messages", response_model=ChatMessageResponse, tags=["Chat"])
def send_message(request: Request, conversation_id: str, data: ChatMessageCreate, db: Session = Depends(get_db)):
    a = _actor(request)
    msg = ChatService.send_message(db, conversation_id, a["role"], a["id"], data.text)

    # Realtime push to both participants
    try:
        conv = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
        if conv:
            anyio.from_thread.run(
                hub.send_chat_to_participants,
                conv.parent_id,
                conv.teacher_id,
                {
                    "type": "chat.message",
                    "conversation_id": conversation_id,
                    "message": ChatMessageResponse.model_validate(msg).model_dump(),
                },
            )
    except Exception:
        pass

    return ChatMessageResponse.model_validate(msg)


@router.patch("/conversations/{conversation_id}/messages/{message_id}", response_model=ChatMessageResponse, tags=["Chat"])
def edit_message(request: Request, conversation_id: str, message_id: str, data: ChatMessageUpdate, db: Session = Depends(get_db)):
    a = _actor(request)
    msg = ChatService.edit_message(db, conversation_id, message_id, a["role"], a["id"], data.text)

    # Realtime push to both participants
    try:
        conv = db.query(ChatConversation).filter(ChatConversation.id == conversation_id).first()
        if conv:
            anyio.from_thread.run(
                hub.send_chat_to_participants,
                conv.parent_id,
                conv.teacher_id,
                {
                    "type": "chat.message_edited",
                    "conversation_id": conversation_id,
                    "message": ChatMessageResponse.model_validate(msg).model_dump(),
                },
            )
    except Exception:
        pass

    return ChatMessageResponse.model_validate(msg)



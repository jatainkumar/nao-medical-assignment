from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Conversation, Message
from services.grok_service import summarize_conversation

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"
    doctor_language: str = "en"
    patient_language: str = "hi"


class RenameConversationRequest(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: str
    title: str
    doctor_language: str
    patient_language: str
    created_at: str
    updated_at: str
    message_count: int = 0

    class Config:
        from_attributes = True


class SearchResult(BaseModel):
    conversation_id: str
    conversation_title: str
    message_id: str
    role: str
    original_text: str
    translated_text: str
    timestamp: str
    context_before: str = ""
    context_after: str = ""


@router.post("", response_model=ConversationResponse)
async def create_conversation(req: CreateConversationRequest, db: Session = Depends(get_db)):
    """Create a new conversation."""
    conv = Conversation(
        title=req.title,
        doctor_language=req.doctor_language,
        patient_language=req.patient_language,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        doctor_language=conv.doctor_language,
        patient_language=conv.patient_language,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        message_count=0,
    )


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def rename_conversation(conversation_id: str, req: RenameConversationRequest, db: Session = Depends(get_db)):
    """Rename a conversation."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.title = req.title.strip() or conv.title
    conv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conv)

    msg_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        doctor_language=conv.doctor_language,
        patient_language=conv.patient_language,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        message_count=msg_count,
    )


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Delete a conversation and all its messages."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.query(Message).filter(Message.conversation_id == conversation_id).delete()
    db.delete(conv)
    db.commit()
    return {"ok": True, "deleted": conversation_id}


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(db: Session = Depends(get_db)):
    """List all conversations, most recent first."""
    convs = db.query(Conversation).order_by(Conversation.updated_at.desc()).all()
    result = []
    for conv in convs:
        msg_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
        result.append(
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                doctor_language=conv.doctor_language,
                patient_language=conv.patient_language,
                created_at=conv.created_at.isoformat(),
                updated_at=conv.updated_at.isoformat(),
                message_count=msg_count,
            )
        )
    return result


@router.get("/search", response_model=list[SearchResult])
async def search_conversations(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Search across all conversations for matching text."""
    search_term = f"%{q}%"
    messages = (
        db.query(Message)
        .filter(
            or_(
                Message.original_text.ilike(search_term),
                Message.translated_text.ilike(search_term),
            )
        )
        .order_by(Message.timestamp.desc())
        .limit(50)
        .all()
    )

    results = []
    for msg in messages:
        conv = db.query(Conversation).filter(Conversation.id == msg.conversation_id).first()

        # Get surrounding messages for context
        all_msgs = (
            db.query(Message)
            .filter(Message.conversation_id == msg.conversation_id)
            .order_by(Message.timestamp.asc())
            .all()
        )
        msg_index = next((i for i, m in enumerate(all_msgs) if m.id == msg.id), -1)
        context_before = all_msgs[msg_index - 1].original_text if msg_index > 0 else ""
        context_after = all_msgs[msg_index + 1].original_text if msg_index < len(all_msgs) - 1 else ""

        results.append(
            SearchResult(
                conversation_id=msg.conversation_id,
                conversation_title=conv.title if conv else "Unknown",
                message_id=msg.id,
                role=msg.role,
                original_text=msg.original_text,
                translated_text=msg.translated_text,
                timestamp=msg.timestamp.isoformat(),
                context_before=context_before,
                context_after=context_after,
            )
        )

    return results


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Get a specific conversation."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_count = db.query(Message).filter(Message.conversation_id == conv.id).count()
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        doctor_language=conv.doctor_language,
        patient_language=conv.patient_language,
        created_at=conv.created_at.isoformat(),
        updated_at=conv.updated_at.isoformat(),
        message_count=msg_count,
    )


@router.post("/{conversation_id}/summary")
async def generate_summary(conversation_id: str, db: Session = Depends(get_db)):
    """Generate an AI-powered medical summary of the conversation."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.timestamp.asc())
        .all()
    )

    if not messages:
        return {"summary": "No messages in this conversation to summarize."}

    msg_dicts = [
        {"role": m.role, "original_text": m.original_text}
        for m in messages
    ]

    summary = await summarize_conversation(msg_dicts)
    return {"summary": summary, "message_count": len(messages), "conversation_id": conversation_id}

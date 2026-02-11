import json
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Message, Conversation
from services.grok_service import translate_text, transcribe_audio, text_to_speech

router = APIRouter(prefix="/api", tags=["chat"])

# Upload directory — same as audio.py: backend/uploads/
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Store active WebSocket connections per conversation
active_connections: dict[str, list[WebSocket]] = {}


class SendMessageRequest(BaseModel):
    conversation_id: str
    role: str  # "doctor" or "patient"
    text: str = ""
    audio_url: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    original_text: str
    translated_text: str
    original_language: str
    translated_language: str
    audio_url: Optional[str]
    translated_audio_url: Optional[str]
    timestamp: str

    class Config:
        from_attributes = True


@router.post("/messages", response_model=MessageResponse)
async def send_message(req: SendMessageRequest, db: Session = Depends(get_db)):
    """Send a message, translate it, and broadcast to WebSocket clients."""
    conversation = db.query(Conversation).filter(Conversation.id == req.conversation_id).first()
    if not conversation:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Determine source and target languages based on role
    if req.role == "doctor":
        source_lang = conversation.doctor_language
        target_lang = conversation.patient_language
    else:
        source_lang = conversation.patient_language
        target_lang = conversation.doctor_language

    # If audio was provided, transcribe it to get the actual text
    original_text = req.text.strip()
    if req.audio_url:
        # Resolve the audio file path from the URL
        filename = req.audio_url.split("/")[-1]
        file_path = os.path.join(UPLOADS_DIR, filename)
        print(f"[Audio] Looking for file at: {file_path}, exists: {os.path.exists(file_path)}")
        if os.path.exists(file_path):
            transcribed = await transcribe_audio(file_path, language=source_lang)
            print(f"[Audio] Transcription result: '{transcribed}'")
            if transcribed:
                original_text = transcribed
        else:
            print(f"[Audio] File NOT found at {file_path}")
            # List what IS in the uploads dir for debugging
            try:
                files = os.listdir(UPLOADS_DIR)
                print(f"[Audio] Files in uploads dir: {files[:10]}")
            except Exception as e:
                print(f"[Audio] Could not list uploads dir: {e}")

    if not original_text:
        original_text = "(Voice message — transcription unavailable)"

    # Translate the message
    translated = await translate_text(original_text, source_lang, target_lang)

    # Generate TTS for the translated text
    translated_audio_url = None
    tts_audio = await text_to_speech(translated, language=target_lang)
    if tts_audio:
        tts_filename = f"tts_{uuid.uuid4().hex}.wav"
        tts_path = os.path.join(UPLOADS_DIR, tts_filename)
        with open(tts_path, "wb") as f:
            f.write(tts_audio)
        translated_audio_url = f"/api/audio/{tts_filename}"
        print(f"[TTS] Saved to {tts_path}")
    else:
        print("[TTS] No audio generated")

    # Create and save message
    message = Message(
        conversation_id=req.conversation_id,
        role=req.role,
        original_text=original_text,
        translated_text=translated,
        original_language=source_lang,
        translated_language=target_lang,
        audio_url=req.audio_url,
        translated_audio_url=translated_audio_url,
        timestamp=datetime.now(timezone.utc),
    )
    db.add(message)

    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)

    # Broadcast to WebSocket clients
    msg_data = {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "role": message.role,
        "original_text": message.original_text,
        "translated_text": message.translated_text,
        "original_language": message.original_language,
        "translated_language": message.translated_language,
        "audio_url": message.audio_url,
        "translated_audio_url": message.translated_audio_url,
        "timestamp": message.timestamp.isoformat(),
    }

    if req.conversation_id in active_connections:
        for ws in active_connections[req.conversation_id]:
            try:
                await ws.send_text(json.dumps(msg_data))
            except Exception:
                pass

    return MessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        role=message.role,
        original_text=message.original_text,
        translated_text=message.translated_text,
        original_language=message.original_language,
        translated_language=message.translated_language,
        audio_url=message.audio_url,
        translated_audio_url=message.translated_audio_url,
        timestamp=message.timestamp.isoformat(),
    )


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(conversation_id: str, db: Session = Depends(get_db)):
    """Get all messages in a conversation."""
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.timestamp.asc())
        .all()
    )
    return [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            original_text=m.original_text,
            translated_text=m.translated_text,
            original_language=m.original_language,
            translated_language=m.translated_language,
            audio_url=m.audio_url,
            translated_audio_url=m.translated_audio_url,
            timestamp=m.timestamp.isoformat(),
        )
        for m in messages
    ]


@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    """WebSocket endpoint for real-time message updates."""
    await websocket.accept()

    if conversation_id not in active_connections:
        active_connections[conversation_id] = []
    active_connections[conversation_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        active_connections[conversation_id].remove(websocket)
        if not active_connections[conversation_id]:
            del active_connections[conversation_id]

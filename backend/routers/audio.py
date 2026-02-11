import os
import uuid
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/audio", tags=["audio"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Upload an audio file and return its URL."""
    ext = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return {"filename": filename, "url": f"/api/audio/{filename}", "size": len(content)}


@router.get("/{filename}")
async def get_audio(filename: str):
    """Serve an uploaded audio file."""
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Audio file not found")

    media_type = "audio/webm"
    if filename.endswith(".wav"):
        media_type = "audio/wav"
    elif filename.endswith(".mp3"):
        media_type = "audio/mpeg"
    elif filename.endswith(".ogg"):
        media_type = "audio/ogg"

    return FileResponse(filepath, media_type=media_type)

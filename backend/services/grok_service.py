import os
import httpx
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

# Audio models
WHISPER_MODEL = "whisper-large-v3-turbo"
WHISPER_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
TTS_MODEL = "playai-tts"
TTS_API_URL = "https://api.groq.com/openai/v1/audio/speech"

LANGUAGE_NAMES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese (Mandarin)",
    "hi": "Hindi",
    "ar": "Arabic",
    "pt": "Portuguese",
    "ru": "Russian",
    "ja": "Japanese",
    "ko": "Korean",
    "it": "Italian",
    "tr": "Turkish",
    "vi": "Vietnamese",
    "th": "Thai",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "ur": "Urdu",
    "sw": "Swahili",
}

# TTS voice mapping — PlayAI supports English voices; Arabic has a separate model
TTS_VOICES = {
    "en": "Fritz-PlayAI",
    "es": "Fritz-PlayAI",
    "fr": "Fritz-PlayAI",
    "de": "Fritz-PlayAI",
    "hi": "Fritz-PlayAI",
    "pt": "Fritz-PlayAI",
    "it": "Fritz-PlayAI",
    "ar": "Ahmad-PlayAI",
}

DEFAULT_VOICE = "Fritz-PlayAI"


async def transcribe_audio(file_path: str, language: str = "") -> str:
    """Transcribe audio file using Groq Whisper API."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            with open(file_path, "rb") as f:
                files = {"file": (os.path.basename(file_path), f, "audio/webm")}
                data = {
                    "model": WHISPER_MODEL,
                    "response_format": "text",
                }
                if language and language != "auto":
                    data["language"] = language

                response = await client.post(
                    WHISPER_API_URL,
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    files=files,
                    data=data,
                )
                response.raise_for_status()
                return response.text.strip()
    except httpx.HTTPStatusError as e:
        print(f"Transcription HTTP error: {e.response.status_code} - {e.response.text}")
        return ""
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""


async def text_to_speech(text: str, language: str = "en") -> bytes | None:
    """Convert text to speech using Groq PlayAI TTS API. Returns audio bytes (wav)."""
    if not text.strip():
        return None

    # Choose model and voice based on language
    model = "playai-tts-arabic" if language == "ar" else TTS_MODEL
    voice = TTS_VOICES.get(language, DEFAULT_VOICE)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                TTS_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "input": text[:4096],  # PlayAI limit
                    "voice": voice,
                    "response_format": "wav",
                },
            )
            response.raise_for_status()
            return response.content
    except httpx.HTTPStatusError as e:
        print(f"TTS HTTP error: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        print(f"TTS error: {e}")
        return None


async def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text using Groq API with medical context awareness."""
    if source_lang == target_lang:
        return text

    source_name = LANGUAGE_NAMES.get(source_lang, source_lang)
    target_name = LANGUAGE_NAMES.get(target_lang, target_lang)

    system_prompt = (
        f"Translate the user's message from {source_name} to {target_name}. "
        f"Reply with ONLY the {target_name} translation. "
        "No quotes, no labels, no commentary, no original text repeated."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 1024,
                },
            )
            response.raise_for_status()
            data = response.json()
            result = data["choices"][0]["message"]["content"].strip()
            # Strip common prefixes models sometimes add
            for prefix in [
                "Translation:", "Translated text:", "Here is the translation:",
                f"{target_name}:", f"{source_name} to {target_name}:",
                "Here's the translation:", "Translated:",
            ]:
                if result.lower().startswith(prefix.lower()):
                    result = result[len(prefix):].strip()
            # Strip wrapping quotes
            if len(result) >= 2 and result[0] in ('"', "'", "\u201c") and result[-1] in ('"', "'", "\u201d"):
                result = result[1:-1]
            return result
    except httpx.HTTPStatusError as e:
        print(f"Translation HTTP error: {e.response.status_code} - {e.response.text}")
        return f"[Translation failed] {text}"
    except Exception as e:
        print(f"Translation error: {e}")
        return f"[Translation failed] {text}"


async def summarize_conversation(messages: list[dict]) -> str:
    """Generate a medical summary of the conversation using Groq API."""
    conversation_text = ""
    for msg in messages:
        role_label = "Doctor" if msg["role"] == "doctor" else "Patient"
        conversation_text += f"{role_label}: {msg['original_text']}\n"

    prompt = f"""You are a medical documentation specialist. Analyze the following doctor-patient conversation and generate a structured clinical summary.

Conversation:
{conversation_text}

Generate a summary with the following sections (only include sections that have relevant information):

## Chief Complaint
Brief description of the patient's primary concern.

## Symptoms Reported
- List all symptoms mentioned by the patient

## Diagnosis / Assessment
- Any diagnoses mentioned or suggested by the doctor

## Medications & Prescriptions
- Any medications discussed or prescribed

## Treatment Plan
- Recommended treatments or procedures

## Follow-Up Actions
- Any scheduled follow-ups, tests, or referrals

## Key Notes
- Any other medically important observations

Format the summary in clear markdown. Be concise but thorough."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GROQ_API_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a medical documentation specialist who creates structured clinical summaries from doctor-patient conversations."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 2048,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as e:
        print(f"Summary HTTP error: {e.response.status_code} - {e.response.text}")
        return "Failed to generate summary. Please try again."
    except Exception as e:
        print(f"Summary error: {e}")
        return "Failed to generate summary. Please try again."

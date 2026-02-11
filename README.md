# MediBridge – Healthcare Doctor–Patient Translation

> **AI-powered real-time translation web application** that bridges language barriers between doctors and patients during medical consultations.

![MediBridge](https://img.shields.io/badge/MediBridge-Healthcare_Translation-06b6d4?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-FastAPI-3776ab?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-React-3178c6?style=flat-square&logo=typescript)
![Groq](https://img.shields.io/badge/AI-Groq_Cloud-000000?style=flat-square)

---

## 🏥 Project Overview

MediBridge is a full-stack web application that enables real-time doctor–patient communication across language barriers. It uses AI-powered translation (Groq Cloud) and speech recognition (Whisper) to translate text and voice messages instantly, with support for 20 languages.

### Key Features

| Feature | Description |
|---------|-------------|
| 🔄 **Real-Time Translation** | Messages translated between doctor and patient languages instantly using Groq LLM |
| 🎤 **Voice Messages + STT** | Record audio → auto-transcribed via Whisper → translated → displayed |
| 🔊 **Text-to-Speech** | Listen to translated messages with browser-native TTS (Web Speech API) |
| 💬 **Role-Based Chat** | Doctor/Patient toggle in chat input — switch roles per message |
| 🌐 **20 Languages** | English, Hindi, Spanish, French, German, Chinese, Arabic, Portuguese, Russian, Japanese, Korean, Italian, Turkish, Vietnamese, Thai, Bengali, Tamil, Telugu, Urdu, Swahili |
| 📋 **Conversation History** | Persistent sidebar with all past conversations, rename & delete support |
| 🔍 **Full-Text Search** | Search across all conversations with highlighted matches |
| 📊 **AI Medical Summary** | Generate structured clinical summaries (symptoms, diagnoses, medications, follow-up) |
| ✏️ **Rename Conversations** | Click title to edit inline |
| 🗑️ **Delete Conversations** | Hover → trash icon to delete with confirmation |
| 📱 **Fully Responsive** | Works on desktop (sidebar always visible) and mobile (sidebar as overlay) |

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript** (Vite 7)
- Vanilla CSS with custom design system (dark medical theme + light mode)
- MediaRecorder API for audio capture
- Web Speech API for client-side TTS
- WebSocket for real-time message updates

### Backend
- **Python 3.11** with **FastAPI**
- **SQLAlchemy** + **SQLite** for persistence
- WebSocket support for real-time messaging
- File-based audio storage (`backend/uploads/`)

### AI / Cloud APIs
- **Groq Cloud** ([console.groq.com](https://console.groq.com))
  - `llama-3.3-70b-versatile` — Medical-context-aware translation
  - `whisper-large-v3-turbo` — Speech-to-text transcription
  - Structured clinical summarization
- **Web Speech API** — Browser-native text-to-speech for translated text

### Deployment
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Render](https://render.com)

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key from [console.groq.com](https://console.groq.com)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file (optional — defaults to localhost:8000)
cp .env.example .env

npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📁 Project Structure

```
nao-medical-assignment/
├── backend/
│   ├── main.py                  # FastAPI app entry + CORS config
│   ├── database.py              # SQLite + SQLAlchemy engine
│   ├── models.py                # Conversation & Message ORM models
│   ├── routers/
│   │   ├── chat.py              # POST /api/messages, WebSocket, STT pipeline
│   │   ├── conversations.py     # CRUD, rename, delete, search, AI summary
│   │   └── audio.py             # Audio upload & file serving
│   ├── services/
│   │   └── grok_service.py      # Groq API: translate, transcribe, summarize
│   ├── render.yaml              # Render deployment config
│   ├── requirements.txt
│   ├── .env.example
│   └── uploads/                 # Audio files (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Root orchestrator (language select → chat)
│   │   ├── components/
│   │   │   ├── RoleSelection.tsx     # Landing page (language pickers)
│   │   │   ├── ChatView.tsx          # Main chat + sidebar + role toggle
│   │   │   ├── MessageBubble.tsx     # Message display + TTS button
│   │   │   ├── AudioRecorder.tsx     # Record / preview / send audio
│   │   │   ├── ConversationSidebar.tsx # Conversation list + delete
│   │   │   ├── SearchPanel.tsx       # Full-text search overlay
│   │   │   ├── SummaryPanel.tsx      # AI medical summary overlay
│   │   │   └── Icons.tsx             # SVG icon components
│   │   ├── hooks/useAudioRecorder.ts
│   │   ├── services/api.ts      # REST API + WebSocket client
│   │   ├── types/index.ts       # TypeScript interfaces
│   │   └── index.css            # Full design system (~1600 lines)
│   ├── .env.example
│   └── index.html
├── vercel.json                  # Vercel deployment config
├── DEPLOYMENT.md                # Deployment guide (Render + Vercel)
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/health` | Health status |
| `POST` | `/api/conversations` | Create a new conversation |
| `GET` | `/api/conversations` | List all conversations |
| `GET` | `/api/conversations/:id` | Get single conversation |
| `PATCH` | `/api/conversations/:id` | Rename conversation |
| `DELETE` | `/api/conversations/:id` | Delete conversation + messages |
| `POST` | `/api/messages` | Send message (translate + STT + TTS) |
| `GET` | `/api/conversations/:id/messages` | Get conversation messages |
| `GET` | `/api/conversations/:id/summary` | Generate AI medical summary |
| `GET` | `/api/conversations/search?q=` | Search across conversations |
| `POST` | `/api/audio/upload` | Upload audio file |
| `GET` | `/api/audio/:filename` | Serve audio file |
| `WS` | `/ws/:conversation_id` | WebSocket for real-time updates |

---

## 🤖 AI Models & Tools

| Tool | Model | Purpose |
|------|-------|---------|
| **Translation** | `llama-3.3-70b-versatile` (Groq) | Medical-context-aware translation between 20 languages |
| **Speech-to-Text** | `whisper-large-v3-turbo` (Groq) | Transcribe recorded audio messages |
| **Text-to-Speech** | Web Speech API (browser) | Play translated text as spoken audio |
| **Summarization** | `llama-3.3-70b-versatile` (Groq) | Generate structured clinical summaries |

---

## ⚠️ Known Limitations & Trade-offs

1. **Audio Storage**: Files stored on server filesystem — won't persist across Render free-tier redeployments. Production would use S3/cloud storage.
2. **Database**: SQLite for simplicity. Production would use PostgreSQL for concurrent access.
3. **TTS Quality**: Uses browser-native Web Speech API — voice quality depends on the OS/browser. Groq's `playai-tts` model was decommissioned.
4. **Translation Quality**: Dependent on Groq LLM capabilities. Medical terminology accuracy varies by language pair.
5. **No Authentication**: No user accounts or session auth — designed as a consultation tool.
6. **CORS**: Configured for specific Vercel domains. Update `FRONTEND_URL` env var for your domain.

---

## 🌐 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full step-by-step deployment guide.

- **Backend** → Render (Python web service)
- **Frontend** → Vercel (Vite static site)

---

## 🌐 Deployed Links

- **Frontend (Vercel)**: _[Add deployed URL]_
- **Backend (Render)**: _[Add deployed URL]_

---

## 📄 License

This project was created as a technical assignment for Nao Medical.

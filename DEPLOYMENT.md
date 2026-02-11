# MediBridge Deployment Guide

> Deploy the **backend on Render** and the **frontend on Vercel**.

---

## 📋 Prerequisites

Before deploying:
1. Push your code to a **GitHub repository**
2. Have a **Groq API key** from [console.groq.com](https://console.groq.com)
3. Create accounts on [Render](https://render.com) and [Vercel](https://vercel.com)

---

## 1️⃣ Deploy Backend on Render

### Option A: Using render.yaml (Recommended)

The project includes a `backend/render.yaml` blueprint file.

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repo
4. Render will detect `backend/render.yaml` and auto-configure the service
5. Set the environment variables when prompted:

   | Variable | Value |
   |----------|-------|
   | `GROQ_API_KEY` | Your Groq API key |
   | `FRONTEND_URL` | Your Vercel frontend URL (e.g. `https://your-app.vercel.app`) |

6. Click **Apply** and wait for deployment

### Option B: Manual Setup

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `medibridge-api` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

5. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `GROQ_API_KEY` | Your Groq API key |
   | `FRONTEND_URL` | `https://your-app.vercel.app` |
   | `PYTHON_VERSION` | `3.11.0` |

6. Click **Create Web Service**

### After Deployment

- Note your Render URL (e.g. `https://medibridge-api.onrender.com`)
- Test: visit `https://medibridge-api.onrender.com/health` — should return `{"status": "healthy"}`
- API docs available at `https://medibridge-api.onrender.com/docs`

> ⚠️ **Render free tier** spins down after 15 minutes of inactivity. First request after spin-down takes ~30-60 seconds.

---

## 2️⃣ Deploy Frontend on Vercel

### Step-by-Step

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Vercel will auto-detect the `vercel.json` configuration:
   ```json
   {
     "buildCommand": "cd frontend && npm install && npm run build",
     "outputDirectory": "frontend/dist",
     "framework": "vite"
   }
   ```
5. Add **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | Your Render backend URL (e.g. `https://medibridge-api.onrender.com`) |

   > ⚠️ **Important**: Vite env vars are baked in at build time. The `VITE_API_URL` must be set BEFORE deployment.

6. Click **Deploy**

### After Deployment

- Note your Vercel URL (e.g. `https://your-app.vercel.app`)
- Go back to Render and update the `FRONTEND_URL` env var with this URL
- Render will auto-redeploy with the updated CORS settings

---

## 3️⃣ Post-Deployment Checklist

| Step | Action |
|------|--------|
| ✅ | Backend `/health` returns `{"status": "healthy"}` |
| ✅ | Frontend loads at Vercel URL |
| ✅ | Set `FRONTEND_URL` on Render to your Vercel URL |
| ✅ | Set `VITE_API_URL` on Vercel to your Render URL |
| ✅ | Create a conversation and send a test message |
| ✅ | Test audio recording and transcription |
| ✅ | Test the 🔊 Listen button for TTS |
| ✅ | Test conversation rename, delete, and search |

---

## 🔄 Updating After Changes

### Backend (Render)
Push to `main` branch → Render auto-deploys

### Frontend (Vercel)
Push to `main` branch → Vercel auto-deploys

> If you change `VITE_API_URL`, you must **redeploy** the frontend on Vercel (Vercel Settings → Deployments → Redeploy) since Vite bakes env vars at build time.

---

## 🗂 Configuration Files

### `backend/render.yaml`
```yaml
services:
  - type: web
    name: medibridge-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GROQ_API_KEY
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: PYTHON_VERSION
        value: 3.11.0
```

### `vercel.json`
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite"
}
```

### Environment Variables Summary

| Variable | Where | Description |
|----------|-------|-------------|
| `GROQ_API_KEY` | Render (backend) | Groq Cloud API key for translation + STT |
| `FRONTEND_URL` | Render (backend) | Vercel URL for CORS whitelist |
| `PYTHON_VERSION` | Render (backend) | Python version (3.11.0) |
| `VITE_API_URL` | Vercel (frontend) | Render backend URL for API calls |

---

## ⚠️ Important Notes

1. **Render free tier**: Server sleeps after 15 min inactivity. First cold-start request takes ~30-60s.
2. **SQLite on Render**: Database resets on redeploy (Render's ephemeral filesystem). For persistent data, upgrade to Render's PostgreSQL add-on.
3. **Audio files**: Stored on filesystem — reset on redeploy. Use S3 or Cloudinary for persistent audio in production.
4. **WebSocket**: Works on Render but may timeout on free tier after idle periods.
5. **CORS**: The backend whitelists `FRONTEND_URL`, `localhost:5173`, `localhost:3000`, and `*.vercel.app`.

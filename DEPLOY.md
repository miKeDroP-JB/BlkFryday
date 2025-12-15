# 0RB SYSTEM - Deployment Guide

## Architecture: Brain (Local Xeon) + Frontend (Cloud)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUD                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Web Frontend (Vercel/Netlify/etc)             │   │
│  │                   React / Next.js                        │   │
│  └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS/WSS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LOCAL XEON SERVER                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Brain Server (Node.js)                      │   │
│  │         ┌─────────┬─────────┬─────────┐                │   │
│  │         │ Agents  │ Quantum │ Genesis │                │   │
│  │         ├─────────┼─────────┼─────────┤                │   │
│  │         │  Copa   │  Games  │   AI    │                │   │
│  │         └─────────┴─────────┴─────────┘                │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Option 1: Full Local Stack (Docker)

```bash
cd BlkFryday/deploy
chmod +x deploy.sh
./deploy.sh full

# Access:
# - Web UI: http://localhost:3000
# - Brain API: http://localhost:8420
# - WebSocket: ws://localhost:8421
```

### Option 2: Brain on Xeon + Frontend on Cloud

#### Step 1: Deploy Brain on Your Xeon Server

```bash
cd BlkFryday/deploy
./deploy.sh brain
```

#### Step 2: Expose Brain to Internet (choose one)

**Cloudflare Tunnel (Recommended - Free)**
```bash
cloudflared tunnel --url http://localhost:8420
```

**ngrok**
```bash
ngrok http 8420
```

#### Step 3: Deploy Frontend to Cloud

```bash
./cloud-deploy.sh vercel   # or netlify, railway, fly
```

---

## 🚀 One-Click Cloud Deploy (Frontend Only)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/miKeDroP-JB/BlkFryday&root-directory=web)

> Note: Set `NEXT_PUBLIC_BRAIN_URL` in Vercel env vars to point to your Brain server

---

## Environment Variables

### Brain Server (.env)
```bash
BRAIN_AUTH_TOKEN=your-secure-token-change-me
ALLOWED_ORIGINS=https://your-app.vercel.app
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Web Frontend
```bash
NEXT_PUBLIC_BRAIN_URL=https://your-brain-url.com
NEXT_PUBLIC_WS_URL=wss://your-brain-url.com
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | System health |
| `/agents` | GET/POST | Agent management |
| `/chat` | POST | AI conversations |
| `/arc/solve` | POST | ARC puzzle solver |
| `/games` | GET | Available games |
| `/quantum/optimize` | POST | Quantum optimization |
| `/genesis/create` | POST | Create from intent |
| `/copa/simulate` | POST | Run simulation |

---

## Commands Reference

```bash
# Local deployment
./deploy.sh brain    # Brain server only
./deploy.sh web      # Web frontend only
./deploy.sh full     # Full stack
./deploy.sh down     # Stop all
./deploy.sh status   # Check status
./deploy.sh logs     # View logs

# Cloud deployment
./cloud-deploy.sh vercel
./cloud-deploy.sh netlify
./cloud-deploy.sh railway
./cloud-deploy.sh fly
```

---

## Local Development

```bash
# Backend
cd BlkFryday
node server/brain.js

# Frontend
cd web
npm install
npm run dev
```

---

**EVERYBODY EATS**

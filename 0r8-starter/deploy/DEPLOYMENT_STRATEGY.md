# 0R8 Deployment Strategy
## Free Tier & Pay-As-You-Go Options

```
╔═══════════════════════════════════════════════════════════════════════════╗
║   ORB DEPLOYMENT - From Bootstrap to Production                           ║
║   "Start free, scale when income flows"                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Current Architecture Summary

```
0r8-starter/
├── Core Engine (Node.js ESM)
│   ├── amoeba-security.js   - Security scanning
│   ├── grimoire-core.js     - Context & memory
│   ├── module-router.js     - Node routing
│   ├── flowsync-node.js     - 7 Laws orchestration
│   ├── ws-server.js         - WebSocket real-time
│   └── integration-helpers.js - Cross-module events
│
├── AI Nodes
│   ├── sigil-ai.js          - Mystical transformations
│   ├── research-node.js     - Discovery engine (trusted)
│   ├── gift-node.js         - Community karma
│   └── eko-token.js         - Internal economy
│
├── Avatars
│   ├── twin-avatar.js       - Digital mirror (XP/levels)
│   └── spirit-animal.js     - Mystical guide (bond)
│
└── Terminal + UI
    ├── 0r8-term-core.js     - AI-native terminal
    ├── client.js            - Browser WebSocket client
    └── ui-loader.js         - Dashboard layouts
```

---

## Phase 1: FREE TIER OPTIONS (No Credit Card Required)

### Option A: Railway.app (RECOMMENDED for Quick Start)
**Best for:** WebSocket server, immediate deployment

```
Cost:      FREE $5 credit/month (no CC required)
           Pay-as-you-go after (pennies per hour)
Uptime:    24/7 (no sleep)
WebSocket: YES
Deploy:    Git push or CLI
```

**Setup:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login (uses GitHub OAuth - free)
railway login

# Initialize project
cd 0r8-starter
railway init

# Deploy
railway up
```

**Pros:** Instant deploy, WebSocket works, no CC
**Cons:** $5/month limit (enough for ~720 hours light usage)

---

### Option B: Render.com
**Best for:** Simple deployment, good free tier

```
Cost:      FREE (750 hours/month)
           Spins down after 15min inactivity
WebSocket: YES (when active)
Deploy:    Git auto-deploy
```

**Setup:**
1. Connect GitHub repo at render.com
2. Select "Web Service"
3. Build command: `npm install`
4. Start command: `node term.js`

**Pros:** Easy, auto-deploy from Git
**Cons:** Sleeps after inactivity (cold starts)

---

### Option C: Oracle Cloud Free Tier (BEST for Always-On)
**Best for:** 24/7 server, most generous free tier

```
Cost:      ALWAYS FREE
           - 2 AMD VMs (1GB RAM each)
           - 4 ARM cores total
           - 24GB RAM total (ARM)
WebSocket: YES
SSH:       YES
```

**Setup:**
1. Create Oracle Cloud account (needs CC for verification only, NOT charged)
2. Create "Always Free" compute instance
3. SSH in and setup Node.js

```bash
# On Oracle VM
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# Clone and run
git clone https://github.com/YOUR_REPO/0r8-starter.git
cd 0r8-starter
npm install
node term.js
```

**Pros:** True always-free, full VM, 24/7 uptime
**Cons:** Requires CC verification (not charged), more setup

---

### Option D: Fly.io
**Best for:** Global edge deployment

```
Cost:      FREE tier includes:
           - 3 shared-cpu-1x VMs
           - 160GB outbound bandwidth
WebSocket: YES
Deploy:    flyctl CLI
```

**Setup:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch
cd 0r8-starter
fly launch
fly deploy
```

---

## Phase 2: SSD SWAP ARCHITECTURE

Based on your plan, here's how to structure the portable ORB:

```
ORB_SSD/
├── 0r8-starter/          # The brain
├── venv/                  # Python environment (if needed)
├── data/                  # Persistent state
│   ├── ekoLedger.json
│   ├── giftLog.json
│   └── userStorage/
├── models/                # AI models (if local)
├── .env                   # Environment config
└── start-orb.sh          # Universal launcher
```

### Universal Launcher Script

Create `start-orb.sh`:
```bash
#!/bin/bash
# ORB Universal Launcher - Works on Laptop, Xeon, NAS

export ORB_ROOT="$(cd "$(dirname "$0")" && pwd)"
export NODE_ENV=production

# Detect environment
if [ -f /proc/cpuinfo ] && grep -q "Xeon" /proc/cpuinfo; then
    echo "🖥️  Xeon Server Detected"
    export ORB_MODE="server"
    export WS_PORT=8081
elif [ -d /volume1 ]; then
    echo "📦 NAS Detected (Synology)"
    export ORB_MODE="nas"
    export WS_PORT=8081
else
    echo "💻 Development Mode"
    export ORB_MODE="dev"
    export WS_PORT=8081
fi

cd "$ORB_ROOT/0r8-starter"
node term.js --mode=$ORB_MODE
```

---

## Phase 3: RECOMMENDED DEPLOYMENT PATH

### Week 1: Bootstrap Phase (You Are Here)
```
┌─────────────────────────────────────────────────────────┐
│ 1. Deploy to Railway (FREE $5 credit)                   │
│    - WebSocket server running 24/7                      │
│    - Dashboard accessible via public URL                │
│    - Income generation begins                           │
└─────────────────────────────────────────────────────────┘
```

### Week 2: Scale Phase (When Income Flows)
```
┌─────────────────────────────────────────────────────────┐
│ 2. Add Oracle Cloud VM (FREE forever)                   │
│    - Move heavy processing to dedicated VM              │
│    - Railway handles frontend/WebSocket                 │
│    - Data persists on Oracle                            │
└─────────────────────────────────────────────────────────┘
```

### Week 3+: Production Phase
```
┌─────────────────────────────────────────────────────────┐
│ 3. Full Architecture                                    │
│    - Xeon/NAS for local processing                      │
│    - Cloud for public-facing services                   │
│    - SSD swap for mobility                              │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start Commands

### Deploy to Railway NOW (Fastest path to income):
```bash
cd /home/user/BlkFryday/0r8-starter

# Create Procfile for Railway
echo "web: node term.js --server" > Procfile

# Add start script for server mode
# (already configured in package.json)

# Deploy
npm install -g @railway/cli
railway login
railway init
railway up
```

### Environment Variables to Set:
```
NODE_ENV=production
WS_PORT=8081
ORB_MODE=cloud
TRUSTED_KEYS=your_trusted_creator_keys
```

---

## Cost Comparison

| Provider      | Free Tier          | After Free      | WebSocket | Best For        |
|---------------|-------------------|-----------------|-----------|-----------------|
| Railway       | $5/month credit   | $0.01/GB-hr     | ✅        | Quick start     |
| Render        | 750 hrs/month     | $7/month        | ✅        | Easy deploy     |
| Oracle Cloud  | ALWAYS FREE       | ALWAYS FREE     | ✅        | 24/7 server     |
| Fly.io        | 3 VMs free        | $1.94/mo min    | ✅        | Global edge     |
| Vercel        | Unlimited         | $20/mo          | ❌        | Static only     |

---

## Next Steps

1. **Immediate:** Deploy to Railway (5 min, free)
2. **Today:** Set up Oracle Cloud account (for permanent free VM)
3. **This Week:** Configure SSD swap architecture
4. **When Income:** Add Xeon/NAS to the network

---

## Files in This Directory

- `DEPLOYMENT_STRATEGY.md` - This file
- `railway.json` - Railway configuration
- `Procfile` - Process definition
- `start-orb.sh` - Universal launcher
- `docker/Dockerfile` - Container option

---

*"Deploy free, grow fast, scale smart."*

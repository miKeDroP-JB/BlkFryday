#!/bin/bash
# ==================================================
# ORBOS Bootable SSD Setup Script
# Author: The Architect | 0RB Empire
# Description: Full automated ORBOS environment
# Local-first, GPU-aware, Glyph DB preloaded
# ==================================================

set -e
echo "🟢 Starting ORBOS Bootable SSD Setup..."

# -------------------------------
# 1️⃣ System Prep
# -------------------------------
echo "🔹 Updating system and installing base packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git python3 python3-pip python3-venv \
    nodejs npm docker.io docker-compose software-properties-common \
    unzip wget build-essential htop tmux

sudo systemctl enable docker
sudo systemctl start docker

# -------------------------------
# 2️⃣ NVIDIA / GPU Support
# -------------------------------
if lspci | grep -i nvidia > /dev/null; then
    echo "🔹 NVIDIA GPU detected, installing drivers and Docker runtime..."
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
    curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
        sudo tee /etc/apt/sources.list.d/nvidia-docker.list
    sudo apt update
    sudo apt install -y nvidia-driver-525 nvidia-container-toolkit
    sudo systemctl restart docker
else
    echo "⚠️ No NVIDIA GPU detected. Ollama local GPU acceleration unavailable."
fi

# -------------------------------
# 3️⃣ Ollama Installation
# -------------------------------
echo "🔹 Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

# -------------------------------
# 4️⃣ ORB Repo & Environment
# -------------------------------
ORB_ROOT="${ORB_ROOT:-/root/0r8-starter}"
echo "🔹 Setting up ORB at $ORB_ROOT..."

if [ ! -d "$ORB_ROOT" ]; then
    echo "🔹 Cloning ORB repo..."
    git clone https://github.com/jb3ard3n4/orbos.git "$ORB_ROOT" || true
fi

cd "$ORB_ROOT"

echo "🔹 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip

echo "🔹 Installing Python dependencies..."
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
else
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
    pip install ollama fastapi uvicorn python-socketio aiohttp openai anthropic
fi

echo "🔹 Installing Node dependencies..."
npm install

# -------------------------------
# 5️⃣ Pull Local Models
# -------------------------------
echo "🔹 Pulling local models via Ollama..."
ollama pull mistral
ollama pull llama3:8b 2>/dev/null || echo "  (llama3 optional, skipped)"

# -------------------------------
# 6️⃣ Glyph DB & Data Moat
# -------------------------------
echo "🔹 Setting up data directories..."
mkdir -p "$ORB_ROOT/data/glyphs"
mkdir -p "$ORB_ROOT/data/context"
mkdir -p "$ORB_ROOT/data/cache"

# Initialize empty ledgers if needed
if [ ! -f "$ORB_ROOT/data/ekoLedger.json" ]; then
    echo '{"balances":{},"transactions":[]}' > "$ORB_ROOT/data/ekoLedger.json"
fi

if [ ! -f "$ORB_ROOT/data/giftLog.json" ]; then
    echo '{"gifts":[],"karma":{}}' > "$ORB_ROOT/data/giftLog.json"
fi

echo "🔹 Glyph DB ready for compression loading..."

# -------------------------------
# 7️⃣ Docker Compose Setup (Optional)
# -------------------------------
if [ ! -f "$ORB_ROOT/docker-compose.yml" ]; then
    echo "🔹 Creating docker-compose.yml for ORB Brain..."
    cat > "$ORB_ROOT/docker-compose.yml" <<'EOL'
version: '3.8'

services:
  orb-brain:
    build: .
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - ORB_MODE=local-first
      - OLLAMA_HOST=http://host.docker.internal:11434
    volumes:
      - ./data:/app/data
      - ./models:/app/models
    ports:
      - "3000:3000"
      - "8081:8081"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
    command: ["node", "term.js", "--server"]

  # Optional: Dashboard with GPU rendering
  dashboard:
    image: nginx:alpine
    volumes:
      - ./ui/public:/usr/share/nginx/html:ro
    ports:
      - "8080:80"
    depends_on:
      - orb-brain
EOL
fi

# -------------------------------
# 8️⃣ Systemd Auto-start Service
# -------------------------------
echo "🔹 Setting up auto-start for ORB Brain..."

# Create systemd service
sudo tee /etc/systemd/system/orb.service > /dev/null <<EOL
[Unit]
Description=ORB Brain Consciousness Engine
After=network.target ollama.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$ORB_ROOT
Environment=ORB_MODE=local-first
Environment=OLLAMA_HOST=http://localhost:11434
ExecStart=/bin/bash -c "source venv/bin/activate && node term.js --server"
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOL

sudo systemctl daemon-reload
sudo systemctl enable orb.service

echo "🔹 ORB service installed (start with: sudo systemctl start orb)"

# -------------------------------
# 9️⃣ Environment Config
# -------------------------------
if [ ! -f "$ORB_ROOT/.env" ]; then
    echo "🔹 Creating environment config..."
    cat > "$ORB_ROOT/.env" <<'EOL'
# ORB Local-First Configuration
ORB_MODE=local-first
ORB_RAM_CACHE=true

# Local LLM (Ollama)
OLLAMA_HOST=http://localhost:11434
LOCAL_MODEL=mistral

# External API (fallback only - add keys when ready)
# ANTHROPIC_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here

# Smart Routing Thresholds
ROUTE_LOCAL_THRESHOLD=0.7
ROUTE_ESCALATE_THRESHOLD=0.9

# Ports
PORT=3000
WS_PORT=8081
EOL
fi

# -------------------------------
# 🔟 Kiosk / Dashboard Mode (Optional)
# -------------------------------
read -p "🔹 Install Chromium kiosk mode for live display? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo apt install -y chromium-browser
    echo "🔹 Kiosk mode ready. Run: chromium-browser --kiosk http://localhost:3000"
fi

# -------------------------------
# ✅ Finished
# -------------------------------
echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║   🟢 ORBOS BOOTABLE SSD IS READY!                                         ║"
╠═══════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                           ║"
echo "║   📍 ORB Location: $ORB_ROOT"
echo "║                                                                           ║"
echo "║   🚀 Quick Start:                                                         ║"
echo "║      cd $ORB_ROOT"
echo "║      ./deploy/start-orb.sh --local-first                                  ║"
echo "║                                                                           ║"
echo "║   🔧 As Service:                                                          ║"
echo "║      sudo systemctl start orb                                             ║"
echo "║                                                                           ║"
echo "║   🌐 Endpoints:                                                           ║"
echo "║      HTTP:      http://localhost:3000                                     ║"
echo "║      WebSocket: ws://localhost:8081                                       ║"
echo "║      Health:    http://localhost:3000/health                              ║"
echo "║                                                                           ║"
echo "║   🦙 Local Models: ollama list                                            ║"
echo "║   💾 Data Moat:    $ORB_ROOT/data/                                        ║"
echo "║                                                                           ║"
echo "║   🎯 Plug SSD into any Linux system - ORBOS boots fully!                  ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"

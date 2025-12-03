#!/bin/bash
#═══════════════════════════════════════════════════════════════════
# VYRA: Quick Start Script
#═══════════════════════════════════════════════════════════════════
# Starts all VYRA components
#═══════════════════════════════════════════════════════════════════

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${CYAN}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                    VYRA: GENESIS SECTOR                           ║
║                      Starting Systems...                          ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Start Ollama
echo -e "${CYAN}Starting Ollama...${NC}"
ollama serve &>/dev/null &
sleep 2

# Start Channel 0
echo -e "${CYAN}Starting Channel 0...${NC}"
python3 /opt/vyra/channel0/daemon.py &>/dev/null &
sleep 1

# Start Swarm Panel
echo -e "${CYAN}Starting Swarm Panel...${NC}"
python3 /opt/vyra/swarm/panel.py &>/dev/null &
sleep 1

# Start Model Router
echo -e "${CYAN}Starting Model Router...${NC}"
source /opt/vyra/ai/venv/bin/activate
python3 /opt/vyra/ai/model_router.py &>/dev/null &
deactivate
sleep 1

# Start Embedding Server
echo -e "${CYAN}Starting Embedding Server...${NC}"
source /opt/vyra/ai/venv/bin/activate
python3 /opt/vyra/ai/embedding_server.py &>/dev/null &
deactivate
sleep 1

# Start Visual Layer
echo -e "${CYAN}Starting Visual Layer...${NC}"
/usr/share/vyra/visual/ritual-layer.sh &>/dev/null &

echo -e "\n${GREEN}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                      ALL SYSTEMS ONLINE                           ║
╠═══════════════════════════════════════════════════════════════════╣
║   Ollama:      http://localhost:11434                            ║
║   Swarm Panel: http://localhost:7777                             ║
║   Router:      http://localhost:8000                             ║
║   Embeddings:  http://localhost:8001                             ║
║   Channel 0:   /tmp/channel0.sock                                ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

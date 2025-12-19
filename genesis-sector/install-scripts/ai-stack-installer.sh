#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  VYRA: GENESIS SECTOR - AI STACK INSTALLER                          ║
# ║  Complete Local AI Infrastructure                                    ║
# ╚══════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SIGIL="${PURPLE}⟡${NC}"

# Configuration
CHROOT=""
USER=""
VYRA_MODELS_DIR="/var/lib/vyra/models"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --chroot)
            CHROOT="$2"
            shift 2
            ;;
        --user)
            USER="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# === UTILITY FUNCTIONS ===

log() {
    echo -e "${SIGIL} $1"
}

log_success() {
    echo -e "${SIGIL} ${GREEN}$1${NC}"
}

log_warn() {
    echo -e "${SIGIL} ${YELLOW}$1${NC}"
}

run_cmd() {
    if [[ -n "$CHROOT" ]]; then
        arch-chroot "$CHROOT" "$@"
    else
        "$@"
    fi
}

show_banner() {
    echo -e "${PURPLE}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                                                                    ║
║   ⟡ VYRA AI STACK INSTALLER                                        ║
║     Local Intelligence Infrastructure                              ║
║                                                                    ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# === OLLAMA INSTALLATION ===

install_ollama() {
    log "Installing Ollama..."

    if [[ -n "$CHROOT" ]]; then
        # Download and install Ollama in chroot
        curl -fsSL https://ollama.ai/install.sh -o /tmp/ollama-install.sh
        cp /tmp/ollama-install.sh "$CHROOT/tmp/"
        arch-chroot "$CHROOT" bash /tmp/ollama-install.sh
    else
        curl -fsSL https://ollama.ai/install.sh | sh
    fi

    # Create systemd service if it doesn't exist
    local service_path
    if [[ -n "$CHROOT" ]]; then
        service_path="$CHROOT/etc/systemd/system/ollama.service"
    else
        service_path="/etc/systemd/system/ollama.service"
    fi

    if [[ ! -f "$service_path" ]]; then
        cat > "$service_path" << 'EOF'
[Unit]
Description=Ollama Local LLM Service
After=network.target

[Service]
Type=simple
Environment=OLLAMA_HOST=0.0.0.0:11434
Environment=OLLAMA_MODELS=/var/lib/vyra/models/ollama
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF
    fi

    run_cmd systemctl enable ollama

    log_success "Ollama installed"
}

# === WHISPER INSTALLATION ===

install_whisper() {
    log "Installing WhisperX (Speech-to-Text)..."

    run_cmd pip install --break-system-packages \
        openai-whisper \
        whisperx \
        faster-whisper

    log_success "WhisperX installed"
}

# === TTS INSTALLATION ===

install_tts() {
    log "Installing Text-to-Speech engines..."

    # Install Piper TTS
    if [[ -n "$CHROOT" ]]; then
        arch-chroot "$CHROOT" pip install --break-system-packages piper-tts
    else
        pip install --break-system-packages piper-tts
    fi

    # Create models directory for TTS
    local models_dir
    if [[ -n "$CHROOT" ]]; then
        models_dir="$CHROOT$VYRA_MODELS_DIR/tts"
    else
        models_dir="$VYRA_MODELS_DIR/tts"
    fi
    mkdir -p "$models_dir"

    log_success "TTS engines installed"
}

# === EMBEDDING SERVERS ===

install_embeddings() {
    log "Installing embedding infrastructure..."

    run_cmd pip install --break-system-packages \
        sentence-transformers \
        chromadb \
        qdrant-client \
        faiss-cpu

    log_success "Embedding infrastructure installed"
}

# === LANGCHAIN & FRAMEWORKS ===

install_frameworks() {
    log "Installing AI frameworks..."

    run_cmd pip install --break-system-packages \
        langchain \
        langchain-community \
        langchain-openai \
        langchain-anthropic \
        llama-index \
        transformers \
        accelerate \
        bitsandbytes \
        openai \
        anthropic \
        instructor \
        outlines

    log_success "AI frameworks installed"
}

# === LOCAL LLM RUNNERS ===

install_local_runners() {
    log "Installing local LLM runners..."

    run_cmd pip install --break-system-packages \
        llama-cpp-python \
        ctransformers \
        gpt4all

    log_success "Local LLM runners installed"
}

# === GPU SUPPORT ===

install_gpu_support() {
    log "Checking GPU support..."

    # Check for NVIDIA GPU
    if lspci | grep -i nvidia > /dev/null 2>&1; then
        log "NVIDIA GPU detected, installing CUDA support..."

        run_cmd pacman -S --noconfirm --needed \
            cuda \
            cudnn \
            nvidia \
            nvidia-utils \
            nvidia-settings

        # Install PyTorch with CUDA
        run_cmd pip install --break-system-packages \
            torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

        log_success "NVIDIA CUDA support installed"
    else
        # CPU-only PyTorch
        run_cmd pip install --break-system-packages \
            torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

        log_warn "No NVIDIA GPU detected, installed CPU-only PyTorch"
    fi
}

# === AGENT ORCHESTRATION ===

install_agent_stack() {
    log "Installing agent orchestration tools..."

    run_cmd pip install --break-system-packages \
        crewai \
        autogen \
        guidance \
        dspy-ai

    log_success "Agent orchestration installed"
}

# === AUDIO PROCESSING ===

install_audio_stack() {
    log "Installing audio processing stack..."

    run_cmd pacman -S --noconfirm --needed \
        sox \
        ffmpeg \
        portaudio \
        python-pyaudio

    run_cmd pip install --break-system-packages \
        soundfile \
        sounddevice \
        pyaudio \
        pydub \
        librosa \
        webrtcvad

    log_success "Audio stack installed"
}

# === IMAGE/VIDEO PROCESSING ===

install_vision_stack() {
    log "Installing vision/image processing..."

    run_cmd pip install --break-system-packages \
        opencv-python \
        pillow \
        deepface \
        ultralytics \
        supervision

    log_success "Vision stack installed"
}

# === VYRA ORCHESTRATOR ===

install_vyra_orchestrator() {
    log "Installing VYRA Orchestrator daemon..."

    local orchestrator_path
    if [[ -n "$CHROOT" ]]; then
        orchestrator_path="$CHROOT/usr/local/bin/vyra-orchestrator"
    else
        orchestrator_path="/usr/local/bin/vyra-orchestrator"
    fi

    cat > "$orchestrator_path" << 'EOF'
#!/usr/bin/env python3
"""
VYRA: Genesis Sector - Swarm Orchestrator
Agent management and coordination daemon
"""

import asyncio
import json
import logging
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from aiohttp import web
import aiohttp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vyra-orchestrator")

@dataclass
class Agent:
    id: str
    type: str
    model: str
    status: str
    created_at: str
    last_heartbeat: str

class SwarmOrchestrator:
    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")

    async def spawn_agent(self, agent_type: str, model: str) -> Agent:
        """Spawn a new agent"""
        agent_id = f"agent-{uuid.uuid4().hex[:8]}"
        now = datetime.utcnow().isoformat()

        agent = Agent(
            id=agent_id,
            type=agent_type,
            model=model,
            status="initializing",
            created_at=now,
            last_heartbeat=now
        )

        # Verify model is available
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ollama_host}/api/tags") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        models = [m["name"] for m in data.get("models", [])]
                        if model not in models:
                            # Pull the model
                            logger.info(f"Pulling model {model}...")
                            async with session.post(
                                f"{self.ollama_host}/api/pull",
                                json={"name": model}
                            ) as pull_resp:
                                pass
        except Exception as e:
            logger.warning(f"Could not verify model: {e}")

        agent.status = "ready"
        self.agents[agent_id] = agent

        logger.info(f"Spawned agent {agent_id} ({agent_type}, {model})")
        return agent

    async def terminate_agent(self, agent_id: str) -> bool:
        """Terminate an agent"""
        if agent_id in self.agents:
            del self.agents[agent_id]
            logger.info(f"Terminated agent {agent_id}")
            return True
        return False

    async def terminate_all(self) -> int:
        """Terminate all agents"""
        count = len(self.agents)
        self.agents.clear()
        logger.info(f"Terminated all {count} agents")
        return count

    async def inject_instruction(self, agent_id: str, instruction: str) -> Optional[str]:
        """Inject instruction into agent"""
        agent = self.agents.get(agent_id)
        if not agent:
            return None

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.ollama_host}/api/generate",
                    json={
                        "model": agent.model,
                        "prompt": instruction,
                        "stream": False
                    }
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get("response")
        except Exception as e:
            logger.error(f"Injection failed: {e}")

        return None

    async def scale(self, count: int) -> int:
        """Scale swarm to specified count"""
        current = len(self.agents)

        if count > current:
            # Spawn more agents
            for _ in range(count - current):
                await self.spawn_agent("general", "llama3.1:8b")
        elif count < current:
            # Terminate excess agents
            agents_to_remove = list(self.agents.keys())[count:]
            for agent_id in agents_to_remove:
                await self.terminate_agent(agent_id)

        return len(self.agents)

    def get_status(self) -> dict:
        """Get swarm status"""
        return {
            "count": len(self.agents),
            "agents": [asdict(a) for a in self.agents.values()]
        }

# Global orchestrator instance
orchestrator = SwarmOrchestrator()

# === HTTP API ===

async def handle_agents_get(request):
    """GET /agents - List all agents"""
    return web.json_response(orchestrator.get_status())

async def handle_agents_post(request):
    """POST /agents - Spawn new agent"""
    data = await request.json()
    agent_type = data.get("type", "general")
    model = data.get("model", "llama3.1:8b")

    agent = await orchestrator.spawn_agent(agent_type, model)
    return web.json_response(asdict(agent), status=201)

async def handle_agents_delete_all(request):
    """DELETE /agents/all - Terminate all agents"""
    count = await orchestrator.terminate_all()
    return web.json_response({"terminated": count})

async def handle_agent_delete(request):
    """DELETE /agents/{id} - Terminate specific agent"""
    agent_id = request.match_info["id"]
    success = await orchestrator.terminate_agent(agent_id)

    if success:
        return web.json_response({"terminated": agent_id})
    return web.json_response({"error": "Agent not found"}, status=404)

async def handle_agent_inject(request):
    """POST /agents/{id}/inject - Inject instruction"""
    agent_id = request.match_info["id"]
    data = await request.json()
    instruction = data.get("instruction", "")

    response = await orchestrator.inject_instruction(agent_id, instruction)

    if response:
        return web.json_response({"response": response})
    return web.json_response({"error": "Injection failed"}, status=500)

async def handle_scale(request):
    """POST /scale - Scale swarm"""
    data = await request.json()
    count = data.get("count", 3)

    new_count = await orchestrator.scale(count)
    return web.json_response({"count": new_count})

async def handle_health(request):
    """GET /health - Health check"""
    return web.json_response({"status": "healthy", "version": "1.0.0"})

def create_app():
    """Create the web application"""
    app = web.Application()

    app.router.add_get("/health", handle_health)
    app.router.add_get("/agents", handle_agents_get)
    app.router.add_post("/agents", handle_agents_post)
    app.router.add_delete("/agents/all", handle_agents_delete_all)
    app.router.add_delete("/agents/{id}", handle_agent_delete)
    app.router.add_post("/agents/{id}/inject", handle_agent_inject)
    app.router.add_post("/scale", handle_scale)

    return app

if __name__ == "__main__":
    port = int(os.getenv("VYRA_ORCHESTRATOR_PORT", "9999"))
    logger.info(f"Starting VYRA Orchestrator on port {port}")

    app = create_app()
    web.run_app(app, host="0.0.0.0", port=port)
EOF

    chmod +x "$orchestrator_path"

    # Install Python dependencies for orchestrator
    run_cmd pip install --break-system-packages aiohttp

    # Enable service
    run_cmd systemctl enable vyra-orchestrator

    log_success "VYRA Orchestrator installed"
}

# === MODEL PRE-DOWNLOAD ===

predownload_models() {
    log "Pre-downloading essential models..."

    local models=(
        "llama3.1:8b"
        "nomic-embed-text"
        "codellama:7b"
    )

    for model in "${models[@]}"; do
        log "Pulling $model..."
        if [[ -n "$CHROOT" ]]; then
            # Can't pull in chroot without network, skip
            log_warn "Skipping model pull in chroot environment"
            break
        else
            ollama pull "$model" || log_warn "Failed to pull $model"
        fi
    done

    log_success "Model pre-download complete"
}

# === CREATE CONFIGURATION ===

create_config() {
    log "Creating AI stack configuration..."

    local config_dir
    if [[ -n "$CHROOT" ]]; then
        config_dir="$CHROOT/etc/vyra"
    else
        config_dir="/etc/vyra"
    fi

    mkdir -p "$config_dir"

    cat > "$config_dir/ai-stack.yaml" << 'EOF'
# VYRA: Genesis Sector - AI Stack Configuration

ollama:
  host: "http://localhost:11434"
  models_path: "/var/lib/vyra/models/ollama"
  default_model: "llama3.1:8b"

embeddings:
  provider: "ollama"
  model: "nomic-embed-text"
  dimension: 768

whisper:
  model: "base"
  device: "auto"
  compute_type: "float16"

tts:
  engine: "piper"
  model: "en_US-lessac-medium"

orchestrator:
  port: 9999
  max_agents: 32
  heartbeat_interval: 5000
  agent_timeout: 30000

vector_store:
  provider: "chromadb"
  path: "/var/lib/vyra/vectordb"

gpu:
  enabled: auto
  memory_fraction: 0.8
EOF

    log_success "Configuration created"
}

# === MAIN ===

main() {
    show_banner

    install_ollama
    install_whisper
    install_tts
    install_embeddings
    install_frameworks
    install_local_runners
    install_gpu_support
    install_agent_stack
    install_audio_stack
    install_vision_stack
    install_vyra_orchestrator
    create_config

    if [[ -z "$CHROOT" ]]; then
        predownload_models
    fi

    echo ""
    log_success "AI Stack installation complete!"
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${PURPLE}⟡${NC} AI Stack Components Installed:                               ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    • Ollama (Local LLM server)                                     ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    • WhisperX (Speech-to-Text)                                     ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    • Piper TTS (Text-to-Speech)                                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    • LangChain & LlamaIndex                                        ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    • ChromaDB & FAISS (Vector stores)                              ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    • VYRA Orchestrator (Agent swarm)                               ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                    ${GREEN}║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
}

main "$@"

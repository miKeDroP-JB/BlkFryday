#!/bin/bash
#═══════════════════════════════════════════════════════════════════
# VYRA: GENESIS SECTOR - AI Stack Installer
#═══════════════════════════════════════════════════════════════════

set -e

CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                    VYRA AI STACK INSTALLER                        ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ─────────────────────────────────────────────────────────────────
# Ollama - Local LLM Runner
# ─────────────────────────────────────────────────────────────────
install_ollama() {
    echo -e "${GOLD}═══ Installing Ollama ═══${NC}"

    if command -v ollama &> /dev/null; then
        echo -e "${GREEN}✓ Ollama already installed${NC}"
    else
        curl -fsSL https://ollama.ai/install.sh | sh
        echo -e "${GREEN}✓ Ollama installed${NC}"
    fi

    # Pull default models
    echo -e "${CYAN}Pulling default models...${NC}"
    ollama pull llama3 &
    ollama pull mistral &
    ollama pull codellama &
    wait

    echo -e "${GREEN}✓ Models ready${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Python AI Environment
# ─────────────────────────────────────────────────────────────────
setup_python_ai() {
    echo -e "${GOLD}═══ Setting up Python AI Environment ═══${NC}"

    VENV_DIR="/opt/vyra/ai/venv"

    python -m venv "$VENV_DIR"
    source "$VENV_DIR/bin/activate"

    pip install --upgrade pip

    # Core AI packages
    pip install \
        langchain \
        langchain-community \
        langchain-openai \
        openai \
        anthropic \
        transformers \
        torch \
        sentence-transformers \
        chromadb \
        pinecone-client \
        faiss-cpu \
        numpy \
        pandas \
        scikit-learn

    # Voice & Audio
    pip install \
        openai-whisper \
        TTS \
        pydub \
        soundfile \
        librosa

    # Web & API
    pip install \
        fastapi \
        uvicorn \
        httpx \
        websockets \
        python-multipart

    # Utils
    pip install \
        pyyaml \
        python-dotenv \
        rich \
        typer \
        pydantic

    deactivate

    echo -e "${GREEN}✓ Python AI environment ready${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Local Embedding Server
# ─────────────────────────────────────────────────────────────────
setup_embedding_server() {
    echo -e "${GOLD}═══ Setting up Embedding Server ═══${NC}"

    cat > /opt/vyra/ai/embedding_server.py << 'PYTHON'
#!/usr/bin/env python3
"""VYRA Local Embedding Server"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List

app = FastAPI(title="VYRA Embedding Server", version="1.0.0")

# Load model on startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✓ Embedding model loaded")

class EmbedRequest(BaseModel):
    text: str | List[str]

class EmbedResponse(BaseModel):
    embedding: List[List[float]]
    dimensions: int

@app.post("/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    if model is None:
        raise HTTPException(500, "Model not loaded")

    texts = request.text if isinstance(request.text, list) else [request.text]
    embeddings = model.encode(texts)

    return EmbedResponse(
        embedding=embeddings.tolist(),
        dimensions=embeddings.shape[1]
    )

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
PYTHON

    chmod +x /opt/vyra/ai/embedding_server.py

    # Create systemd service
    cat > /etc/systemd/system/vyra-embedding.service << 'SERVICE'
[Unit]
Description=VYRA Embedding Server
After=network.target

[Service]
Type=simple
ExecStart=/opt/vyra/ai/venv/bin/python /opt/vyra/ai/embedding_server.py
Restart=always
User=vyra

[Install]
WantedBy=multi-user.target
SERVICE

    echo -e "${GREEN}✓ Embedding server configured${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Multi-Model Router
# ─────────────────────────────────────────────────────────────────
setup_model_router() {
    echo -e "${GOLD}═══ Setting up Multi-Model Router ═══${NC}"

    cat > /opt/vyra/ai/model_router.py << 'PYTHON'
#!/usr/bin/env python3
"""VYRA Multi-Model Router - Intelligent model selection"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import httpx
import os

app = FastAPI(title="VYRA Model Router", version="1.0.0")

# Model configurations
MODELS = {
    "ollama": {
        "url": "http://localhost:11434",
        "default": "llama3",
        "models": ["llama3", "mistral", "codellama", "mixtral"]
    },
    "openai": {
        "url": "https://api.openai.com/v1",
        "default": "gpt-4-turbo-preview",
        "models": ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"]
    },
    "anthropic": {
        "url": "https://api.anthropic.com/v1",
        "default": "claude-3-opus-20240229",
        "models": ["claude-3-opus-20240229", "claude-3-sonnet-20240229"]
    }
}

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None
    provider: Optional[str] = "ollama"
    temperature: float = 0.7
    max_tokens: int = 2000

class ChatResponse(BaseModel):
    response: str
    model: str
    provider: str
    tokens_used: Optional[int] = None

async def call_ollama(message: str, model: str, temperature: float, max_tokens: int) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MODELS['ollama']['url']}/api/generate",
            json={
                "model": model,
                "prompt": message,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            },
            timeout=120.0
        )
        return response.json().get("response", "")

async def call_openai(message: str, model: str, temperature: float, max_tokens: int) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(500, "OpenAI API key not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MODELS['openai']['url']}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}],
                "temperature": temperature,
                "max_tokens": max_tokens
            },
            timeout=120.0
        )
        data = response.json()
        return data["choices"][0]["message"]["content"]

async def call_anthropic(message: str, model: str, temperature: float, max_tokens: int) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(500, "Anthropic API key not configured")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MODELS['anthropic']['url']}/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": message}],
                "temperature": temperature,
                "max_tokens": max_tokens
            },
            timeout=120.0
        )
        data = response.json()
        return data["content"][0]["text"]

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    provider = request.provider
    model = request.model or MODELS[provider]["default"]

    if provider == "ollama":
        response = await call_ollama(request.message, model, request.temperature, request.max_tokens)
    elif provider == "openai":
        response = await call_openai(request.message, model, request.temperature, request.max_tokens)
    elif provider == "anthropic":
        response = await call_anthropic(request.message, model, request.temperature, request.max_tokens)
    else:
        raise HTTPException(400, f"Unknown provider: {provider}")

    return ChatResponse(response=response, model=model, provider=provider)

@app.get("/models")
async def list_models():
    return MODELS

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
PYTHON

    chmod +x /opt/vyra/ai/model_router.py

    # Create systemd service
    cat > /etc/systemd/system/vyra-router.service << 'SERVICE'
[Unit]
Description=VYRA Model Router
After=network.target

[Service]
Type=simple
ExecStart=/opt/vyra/ai/venv/bin/python /opt/vyra/ai/model_router.py
Restart=always
User=vyra
Environment=OPENAI_API_KEY=
Environment=ANTHROPIC_API_KEY=

[Install]
WantedBy=multi-user.target
SERVICE

    echo -e "${GREEN}✓ Model router configured${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Whisper (Speech-to-Text)
# ─────────────────────────────────────────────────────────────────
setup_whisper() {
    echo -e "${GOLD}═══ Setting up Whisper ═══${NC}"

    # Already in Python packages, just verify
    source /opt/vyra/ai/venv/bin/activate
    python -c "import whisper; print('✓ Whisper available')" || pip install openai-whisper
    deactivate

    echo -e "${GREEN}✓ Whisper ready${NC}"
}

# ─────────────────────────────────────────────────────────────────
# TTS (Text-to-Speech)
# ─────────────────────────────────────────────────────────────────
setup_tts() {
    echo -e "${GOLD}═══ Setting up TTS ═══${NC}"

    cat > /opt/vyra/ai/tts_server.py << 'PYTHON'
#!/usr/bin/env python3
"""VYRA TTS Server"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from TTS.api import TTS
import io
import torch

app = FastAPI(title="VYRA TTS Server", version="1.0.0")

# Load TTS model
tts = None

@app.on_event("startup")
async def load_model():
    global tts
    device = "cuda" if torch.cuda.is_available() else "cpu"
    tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False).to(device)
    print(f"✓ TTS model loaded on {device}")

class TTSRequest(BaseModel):
    text: str
    speaker: str = "default"

@app.post("/speak")
async def speak(request: TTSRequest):
    if tts is None:
        raise HTTPException(500, "TTS model not loaded")

    # Generate audio
    wav = tts.tts(text=request.text)

    # Convert to bytes
    buffer = io.BytesIO()
    tts.synthesizer.save_wav(wav, buffer)
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="audio/wav")

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": tts is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
PYTHON

    chmod +x /opt/vyra/ai/tts_server.py

    echo -e "${GREEN}✓ TTS server configured${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────
main() {
    mkdir -p /opt/vyra/ai

    install_ollama
    setup_python_ai
    setup_embedding_server
    setup_model_router
    setup_whisper
    setup_tts

    # Enable services
    systemctl daemon-reload
    systemctl enable vyra-embedding
    systemctl enable vyra-router

    echo -e "\n${GREEN}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                    AI STACK INSTALLED                             ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   Ollama:     http://localhost:11434                             ║
║   Router:     http://localhost:8000                              ║
║   Embeddings: http://localhost:8001                              ║
║   TTS:        http://localhost:8002                              ║
║                                                                   ║
║   Models:     llama3, mistral, codellama                         ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

main "$@"

"""
═══════════════════════════════════════════════════════════════════════════════
SOVEREIGN AI ENGINE - "THE MIND"

Full independence from external AI providers.
Your knowledge. Your models. Your sovereignty.

Components:
1. Local Inference Layer (Ollama/vLLM)
2. Knowledge Extraction from Fractal Memory
3. Fine-tuning Data Pipeline
4. Model Training & Distillation
5. Edge Inference (ONNX/Quantized)

NO MORE DEPENDENCY ON OPENAI/ANTHROPIC.
═══════════════════════════════════════════════════════════════════════════════
"""

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any, AsyncGenerator
import hashlib

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sovereign AI Engine",
    description="THE MIND - Self-hosted AI with knowledge retention",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

class ModelTier(str, Enum):
    FAST = "fast"           # Small models for quick tasks (7B)
    BALANCED = "balanced"   # Medium models (13B-30B)
    QUALITY = "quality"     # Large models for complex tasks (70B+)
    SOVEREIGN = "sovereign" # Fine-tuned 0RB model


@dataclass
class ModelConfig:
    name: str
    provider: str           # ollama, vllm, onnx, local
    model_id: str
    tier: ModelTier
    context_window: int
    max_tokens: int
    temperature: float = 0.7
    endpoint: str = ""
    quantization: Optional[str] = None  # q4, q8, fp16
    specialization: List[str] = field(default_factory=list)


# Model Registry - Your sovereign fleet
MODEL_REGISTRY: Dict[str, ModelConfig] = {
    # Fast tier - Quick responses
    "mistral-7b": ModelConfig(
        name="Mistral 7B",
        provider="ollama",
        model_id="mistral:7b-instruct-v0.2-q4_K_M",
        tier=ModelTier.FAST,
        context_window=32768,
        max_tokens=4096,
        endpoint="http://localhost:11434",
        quantization="q4",
        specialization=["chat", "quick_tasks", "classification"]
    ),
    "phi-3": ModelConfig(
        name="Phi-3 Mini",
        provider="ollama",
        model_id="phi3:mini",
        tier=ModelTier.FAST,
        context_window=4096,
        max_tokens=2048,
        endpoint="http://localhost:11434",
        specialization=["code", "reasoning"]
    ),

    # Balanced tier - Good quality, reasonable speed
    "llama3-8b": ModelConfig(
        name="Llama 3 8B",
        provider="ollama",
        model_id="llama3:8b-instruct-q8_0",
        tier=ModelTier.BALANCED,
        context_window=8192,
        max_tokens=4096,
        endpoint="http://localhost:11434",
        quantization="q8",
        specialization=["general", "reasoning", "creative"]
    ),
    "mixtral-8x7b": ModelConfig(
        name="Mixtral 8x7B MoE",
        provider="ollama",
        model_id="mixtral:8x7b-instruct-v0.1-q4_K_M",
        tier=ModelTier.BALANCED,
        context_window=32768,
        max_tokens=4096,
        endpoint="http://localhost:11434",
        quantization="q4",
        specialization=["complex_reasoning", "multi_task"]
    ),

    # Quality tier - Maximum capability
    "llama3-70b": ModelConfig(
        name="Llama 3 70B",
        provider="ollama",
        model_id="llama3:70b-instruct-q4_K_M",
        tier=ModelTier.QUALITY,
        context_window=8192,
        max_tokens=4096,
        endpoint="http://localhost:11434",
        quantization="q4",
        specialization=["complex_reasoning", "analysis", "creative", "code"]
    ),
    "qwen2-72b": ModelConfig(
        name="Qwen2 72B",
        provider="ollama",
        model_id="qwen2:72b-instruct-q4_K_M",
        tier=ModelTier.QUALITY,
        context_window=32768,
        max_tokens=8192,
        endpoint="http://localhost:11434",
        quantization="q4",
        specialization=["multilingual", "reasoning", "code"]
    ),

    # Sovereign tier - YOUR fine-tuned model
    "orb-sovereign": ModelConfig(
        name="0RB Sovereign",
        provider="ollama",  # Will be custom after fine-tuning
        model_id="orb-sovereign:latest",
        tier=ModelTier.SOVEREIGN,
        context_window=8192,
        max_tokens=4096,
        endpoint="http://localhost:11434",
        specialization=["0rb_system", "memory", "agents", "rituals"]
    ),
}


# ═══════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════

class Message(BaseModel):
    role: str  # system, user, assistant
    content: str


class InferenceRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None
    tier: Optional[ModelTier] = None
    max_tokens: int = 2048
    temperature: float = 0.7
    stream: bool = False
    task_type: Optional[str] = None  # For intelligent routing
    user_id: Optional[str] = None
    avatar: Optional[str] = None
    retain_knowledge: bool = True  # Store for fine-tuning


class InferenceResponse(BaseModel):
    id: str
    model: str
    content: str
    tokens_used: int
    latency_ms: float
    tier: str
    provider: str
    knowledge_retained: bool = False


class KnowledgeEntry(BaseModel):
    id: str
    timestamp: datetime
    user_id: Optional[str]
    avatar: Optional[str]
    messages: List[Message]
    response: str
    model_used: str
    quality_score: Optional[float] = None
    task_type: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════════════════
# KNOWLEDGE STORE - Retains everything for fine-tuning
# ═══════════════════════════════════════════════════════════════════════════

class KnowledgeStore:
    """
    Stores all interactions for knowledge retention and fine-tuning.
    This is how the system LEARNS and becomes sovereign.
    """

    def __init__(self, storage_path: str = "./knowledge_store"):
        self.storage_path = storage_path
        self.entries: List[KnowledgeEntry] = []
        self.conversation_buffer: Dict[str, List[Dict]] = {}
        os.makedirs(storage_path, exist_ok=True)
        os.makedirs(f"{storage_path}/conversations", exist_ok=True)
        os.makedirs(f"{storage_path}/training_data", exist_ok=True)
        os.makedirs(f"{storage_path}/patterns", exist_ok=True)

    async def store(self, entry: KnowledgeEntry) -> str:
        """Store a knowledge entry"""
        self.entries.append(entry)

        # Save to disk
        filename = f"{self.storage_path}/conversations/{entry.id}.json"
        with open(filename, 'w') as f:
            json.dump(entry.model_dump(), f, default=str, indent=2)

        # Update conversation buffer for context continuity
        if entry.user_id:
            if entry.user_id not in self.conversation_buffer:
                self.conversation_buffer[entry.user_id] = []
            self.conversation_buffer[entry.user_id].append({
                "messages": [m.model_dump() for m in entry.messages],
                "response": entry.response,
                "timestamp": entry.timestamp.isoformat()
            })
            # Keep last 100 conversations per user
            self.conversation_buffer[entry.user_id] = \
                self.conversation_buffer[entry.user_id][-100:]

        logger.info(f"Knowledge stored: {entry.id}")
        return entry.id

    async def export_training_data(self, format: str = "alpaca") -> str:
        """Export stored knowledge as training data"""
        training_data = []

        for entry in self.entries:
            if format == "alpaca":
                # Alpaca format: instruction, input, output
                instruction = ""
                input_text = ""

                for msg in entry.messages:
                    if msg.role == "system":
                        instruction = msg.content
                    elif msg.role == "user":
                        input_text = msg.content

                training_data.append({
                    "instruction": instruction or "You are a helpful AI assistant.",
                    "input": input_text,
                    "output": entry.response,
                    "metadata": {
                        "model": entry.model_used,
                        "avatar": entry.avatar,
                        "task_type": entry.task_type
                    }
                })

            elif format == "chatml":
                # ChatML format for fine-tuning
                conversation = []
                for msg in entry.messages:
                    conversation.append({
                        "role": msg.role,
                        "content": msg.content
                    })
                conversation.append({
                    "role": "assistant",
                    "content": entry.response
                })
                training_data.append({"conversations": conversation})

            elif format == "sharegpt":
                # ShareGPT format
                conversations = []
                for msg in entry.messages:
                    conversations.append({
                        "from": "human" if msg.role == "user" else msg.role,
                        "value": msg.content
                    })
                conversations.append({
                    "from": "gpt",
                    "value": entry.response
                })
                training_data.append({"conversations": conversations})

        # Save training data
        output_file = f"{self.storage_path}/training_data/{format}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(training_data, f, indent=2)

        logger.info(f"Exported {len(training_data)} entries to {output_file}")
        return output_file

    def get_stats(self) -> Dict[str, Any]:
        """Get knowledge store statistics"""
        return {
            "total_entries": len(self.entries),
            "unique_users": len(self.conversation_buffer),
            "storage_path": self.storage_path,
            "by_model": self._count_by_field("model_used"),
            "by_avatar": self._count_by_field("avatar"),
            "by_task": self._count_by_field("task_type")
        }

    def _count_by_field(self, field: str) -> Dict[str, int]:
        counts = {}
        for entry in self.entries:
            value = getattr(entry, field, None) or "unknown"
            counts[value] = counts.get(value, 0) + 1
        return counts


knowledge_store = KnowledgeStore()


# ═══════════════════════════════════════════════════════════════════════════
# INFERENCE ENGINE
# ═══════════════════════════════════════════════════════════════════════════

class SovereignInferenceEngine:
    """
    The core inference engine that routes to local models.
    Intelligent routing based on task type, quality requirements, and speed needs.
    """

    def __init__(self):
        self.http_client = httpx.AsyncClient(timeout=120.0)
        self.model_health: Dict[str, bool] = {}
        self.model_latencies: Dict[str, List[float]] = {}

    async def check_model_health(self, model_key: str) -> bool:
        """Check if a model is available and healthy"""
        if model_key not in MODEL_REGISTRY:
            return False

        config = MODEL_REGISTRY[model_key]

        try:
            if config.provider == "ollama":
                response = await self.http_client.get(
                    f"{config.endpoint}/api/tags",
                    timeout=5.0
                )
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "") for m in models]
                    # Check if model is available
                    available = any(config.model_id.split(":")[0] in name for name in model_names)
                    self.model_health[model_key] = available
                    return available
            return False
        except Exception as e:
            logger.warning(f"Model health check failed for {model_key}: {e}")
            self.model_health[model_key] = False
            return False

    def select_model(
        self,
        tier: Optional[ModelTier] = None,
        task_type: Optional[str] = None,
        prefer_sovereign: bool = True
    ) -> str:
        """
        Intelligently select the best model for the task.
        Priority: Sovereign > Quality > Balanced > Fast
        """

        # If sovereign model is available and preferred, use it
        if prefer_sovereign and self.model_health.get("orb-sovereign", False):
            return "orb-sovereign"

        # Filter by tier if specified
        candidates = []
        for key, config in MODEL_REGISTRY.items():
            if tier and config.tier != tier:
                continue
            if not self.model_health.get(key, False):
                continue
            candidates.append((key, config))

        if not candidates:
            # Fallback: find any healthy model
            for key, config in MODEL_REGISTRY.items():
                if self.model_health.get(key, False):
                    candidates.append((key, config))

        if not candidates:
            raise HTTPException(status_code=503, detail="No models available")

        # If task_type specified, prefer models specialized for it
        if task_type:
            specialized = [
                (k, c) for k, c in candidates
                if task_type in c.specialization
            ]
            if specialized:
                candidates = specialized

        # Sort by tier priority (quality > balanced > fast)
        tier_priority = {
            ModelTier.SOVEREIGN: 0,
            ModelTier.QUALITY: 1,
            ModelTier.BALANCED: 2,
            ModelTier.FAST: 3
        }
        candidates.sort(key=lambda x: tier_priority.get(x[1].tier, 99))

        return candidates[0][0]

    async def infer(self, request: InferenceRequest) -> InferenceResponse:
        """Run inference on the best available model"""
        start_time = time.time()

        # Select model
        model_key = request.model or self.select_model(
            tier=request.tier,
            task_type=request.task_type,
            prefer_sovereign=True
        )

        config = MODEL_REGISTRY.get(model_key)
        if not config:
            raise HTTPException(status_code=400, detail=f"Unknown model: {model_key}")

        # Build prompt
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        # Call the model
        if config.provider == "ollama":
            response_text, tokens = await self._call_ollama(config, messages, request)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {config.provider}")

        latency_ms = (time.time() - start_time) * 1000

        # Track latency
        if model_key not in self.model_latencies:
            self.model_latencies[model_key] = []
        self.model_latencies[model_key].append(latency_ms)
        self.model_latencies[model_key] = self.model_latencies[model_key][-100:]

        # Create response
        response_id = f"inf_{int(time.time())}_{hashlib.md5(response_text.encode()).hexdigest()[:8]}"

        response = InferenceResponse(
            id=response_id,
            model=model_key,
            content=response_text,
            tokens_used=tokens,
            latency_ms=latency_ms,
            tier=config.tier.value,
            provider=config.provider,
            knowledge_retained=False
        )

        # Store for knowledge retention if enabled
        if request.retain_knowledge:
            entry = KnowledgeEntry(
                id=response_id,
                timestamp=datetime.utcnow(),
                user_id=request.user_id,
                avatar=request.avatar,
                messages=request.messages,
                response=response_text,
                model_used=model_key,
                task_type=request.task_type,
                metadata={
                    "latency_ms": latency_ms,
                    "tokens": tokens,
                    "tier": config.tier.value
                }
            )
            await knowledge_store.store(entry)
            response.knowledge_retained = True

        return response

    async def _call_ollama(
        self,
        config: ModelConfig,
        messages: List[Dict],
        request: InferenceRequest
    ) -> tuple[str, int]:
        """Call Ollama API"""
        payload = {
            "model": config.model_id,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens
            }
        }

        try:
            response = await self.http_client.post(
                f"{config.endpoint}/api/chat",
                json=payload,
                timeout=120.0
            )
            response.raise_for_status()
            data = response.json()

            content = data.get("message", {}).get("content", "")
            tokens = data.get("eval_count", 0) + data.get("prompt_eval_count", 0)

            return content, tokens

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Model inference timeout")
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def stream_infer(
        self,
        request: InferenceRequest
    ) -> AsyncGenerator[str, None]:
        """Stream inference response"""
        model_key = request.model or self.select_model(
            tier=request.tier,
            task_type=request.task_type
        )
        config = MODEL_REGISTRY.get(model_key)

        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        payload = {
            "model": config.model_id,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": request.temperature,
                "num_predict": request.max_tokens
            }
        }

        full_response = ""

        async with self.http_client.stream(
            "POST",
            f"{config.endpoint}/api/chat",
            json=payload,
            timeout=120.0
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        if "message" in data:
                            chunk = data["message"].get("content", "")
                            full_response += chunk
                            yield f"data: {json.dumps({'content': chunk})}\n\n"
                        if data.get("done"):
                            yield f"data: {json.dumps({'done': True})}\n\n"
                    except json.JSONDecodeError:
                        continue

        # Store complete response for knowledge retention
        if request.retain_knowledge:
            entry = KnowledgeEntry(
                id=f"inf_{int(time.time())}",
                timestamp=datetime.utcnow(),
                user_id=request.user_id,
                avatar=request.avatar,
                messages=request.messages,
                response=full_response,
                model_used=model_key,
                task_type=request.task_type
            )
            await knowledge_store.store(entry)

    def get_status(self) -> Dict[str, Any]:
        """Get engine status"""
        return {
            "service": "sovereign-ai-engine",
            "codename": "THE MIND",
            "status": "operational",
            "models": {
                key: {
                    "name": config.name,
                    "tier": config.tier.value,
                    "provider": config.provider,
                    "healthy": self.model_health.get(key, False),
                    "avg_latency_ms": (
                        sum(self.model_latencies.get(key, [0])) /
                        max(len(self.model_latencies.get(key, [1])), 1)
                    )
                }
                for key, config in MODEL_REGISTRY.items()
            },
            "knowledge_store": knowledge_store.get_stats()
        }


engine = SovereignInferenceEngine()


# ═══════════════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "sovereign-ai-engine",
        "codename": "THE MIND"
    }


@app.get("/status")
async def status():
    return engine.get_status()


@app.post("/v1/chat/completions")
async def chat_completions(request: InferenceRequest):
    """OpenAI-compatible chat completions endpoint"""
    if request.stream:
        return StreamingResponse(
            engine.stream_infer(request),
            media_type="text/event-stream"
        )
    return await engine.infer(request)


@app.post("/infer")
async def infer(request: InferenceRequest):
    """Direct inference endpoint"""
    return await engine.infer(request)


@app.post("/infer/stream")
async def infer_stream(request: InferenceRequest):
    """Streaming inference endpoint"""
    request.stream = True
    return StreamingResponse(
        engine.stream_infer(request),
        media_type="text/event-stream"
    )


@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "models": [
            {
                "id": key,
                "name": config.name,
                "tier": config.tier.value,
                "provider": config.provider,
                "context_window": config.context_window,
                "specialization": config.specialization,
                "healthy": engine.model_health.get(key, False)
            }
            for key, config in MODEL_REGISTRY.items()
        ]
    }


@app.post("/models/{model_key}/health")
async def check_model(model_key: str):
    """Check specific model health"""
    healthy = await engine.check_model_health(model_key)
    return {"model": model_key, "healthy": healthy}


@app.post("/models/health-check-all")
async def check_all_models():
    """Check health of all models"""
    results = {}
    for model_key in MODEL_REGISTRY.keys():
        results[model_key] = await engine.check_model_health(model_key)
    return {"models": results}


# ─────────────────────────────────────────────────────────────────────────
# Knowledge & Training Endpoints
# ─────────────────────────────────────────────────────────────────────────

@app.get("/knowledge/stats")
async def knowledge_stats():
    """Get knowledge store statistics"""
    return knowledge_store.get_stats()


@app.post("/knowledge/export")
async def export_knowledge(format: str = "alpaca"):
    """Export knowledge as training data"""
    output_file = await knowledge_store.export_training_data(format)
    return {
        "status": "exported",
        "format": format,
        "file": output_file,
        "entries": len(knowledge_store.entries)
    }


# ═══════════════════════════════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup():
    logger.info("=" * 60)
    logger.info("SOVEREIGN AI ENGINE - THE MIND")
    logger.info("Full independence. Your knowledge. Your models.")
    logger.info("=" * 60)

    # Check all models on startup
    logger.info("Checking model availability...")
    for model_key in MODEL_REGISTRY.keys():
        healthy = await engine.check_model_health(model_key)
        status = "✓" if healthy else "✗"
        logger.info(f"  {status} {model_key}")

    healthy_count = sum(1 for v in engine.model_health.values() if v)
    logger.info(f"Models available: {healthy_count}/{len(MODEL_REGISTRY)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8050)

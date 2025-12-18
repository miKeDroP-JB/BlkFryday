"""
═══════════════════════════════════════════════════════════════════════════════
SOVEREIGN AI ENGINE - UNIFIED APPLICATION
"THE MIND"

Complete sovereign AI stack combining:
- Local Inference (Ollama/vLLM)
- Knowledge Extraction & Retention
- Training Pipeline
- Model Routing with Fallback
- Edge Inference (ONNX)

YOUR KNOWLEDGE. YOUR MODELS. YOUR SOVEREIGNTY.
═══════════════════════════════════════════════════════════════════════════════
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Import our modules
from inference import (
    SovereignInferenceEngine,
    KnowledgeStore,
    InferenceRequest,
    InferenceResponse,
    Message,
    MODEL_REGISTRY,
    knowledge_store,
    engine
)
from model_router import (
    ModelRouter,
    RouterConfig,
    FallbackStrategy,
    SovereignServingLayer
)
from knowledge_extractor import (
    KnowledgeExtractor,
    ExtractionConfig
)
from training_pipeline import (
    SovereignTrainingPipeline,
    TrainingConfig,
    DataConfig
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# GLOBAL STATE
# ═══════════════════════════════════════════════════════════════════════════

router_config = RouterConfig(
    fallback_strategy=FallbackStrategy.PREFER_LOCAL,
    enable_external_fallback=os.getenv("ENABLE_EXTERNAL_FALLBACK", "false").lower() == "true",
    external_api_keys={
        "openai": os.getenv("OPENAI_API_KEY", ""),
        "anthropic": os.getenv("ANTHROPIC_API_KEY", "")
    }
)

serving_layer: Optional[SovereignServingLayer] = None
extractor: Optional[KnowledgeExtractor] = None


# ═══════════════════════════════════════════════════════════════════════════
# LIFESPAN
# ═══════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    global serving_layer, extractor

    logger.info("=" * 70)
    logger.info("  SOVEREIGN AI ENGINE - THE MIND")
    logger.info("  Full independence. Your knowledge. Your models.")
    logger.info("=" * 70)

    # Initialize serving layer
    serving_layer = SovereignServingLayer(router_config, knowledge_retention=True)
    await serving_layer.initialize()

    # Initialize extractor
    extractor = KnowledgeExtractor(ExtractionConfig())

    # Check models on startup
    logger.info("\nChecking model availability...")
    for model_key in MODEL_REGISTRY.keys():
        healthy = await engine.check_model_health(model_key)
        status = "OK" if healthy else "UNAVAILABLE"
        logger.info(f"  [{status}] {model_key}")

    healthy_count = sum(1 for v in engine.model_health.values() if v)
    logger.info(f"\nModels available: {healthy_count}/{len(MODEL_REGISTRY)}")
    logger.info("=" * 70)

    yield

    # Cleanup
    logger.info("Sovereign AI Engine shutting down...")


# ═══════════════════════════════════════════════════════════════════════════
# APPLICATION
# ═══════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="Sovereign AI Engine",
    description="THE MIND - Complete sovereign AI stack with knowledge retention",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════

class ChatRequest(BaseModel):
    """Chat completion request"""
    messages: List[Message]
    model: Optional[str] = None
    max_tokens: int = 2048
    temperature: float = 0.7
    stream: bool = False
    user_id: Optional[str] = None
    avatar: Optional[str] = None
    retain_knowledge: bool = True


class ExtractionRequest(BaseModel):
    """Knowledge extraction request"""
    output_format: str = "all"  # alpaca, chatml, sharegpt, all
    min_quality: float = 0.5


class TrainingRequest(BaseModel):
    """Training pipeline request"""
    base_model: str = "meta-llama/Meta-Llama-3-8B-Instruct"
    output_name: str = "orb-sovereign"
    method: str = "qlora"
    epochs: int = 3
    batch_size: int = 4
    lora_r: int = 64


# ═══════════════════════════════════════════════════════════════════════════
# HEALTH & STATUS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "sovereign-ai-engine",
        "codename": "THE MIND"
    }


@app.get("/status")
async def status():
    """Detailed status"""
    return {
        "service": "sovereign-ai-engine",
        "codename": "THE MIND",
        "components": {
            "inference": engine.get_status(),
            "router": serving_layer.router.get_status() if serving_layer else None,
            "knowledge": knowledge_store.get_stats()
        }
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Sovereign AI Engine",
        "codename": "THE MIND",
        "version": "1.0.0",
        "endpoints": {
            "inference": "/v1/chat/completions",
            "models": "/models",
            "knowledge": "/knowledge/stats",
            "training": "/training/prepare"
        }
    }


# ═══════════════════════════════════════════════════════════════════════════
# INFERENCE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    """OpenAI-compatible chat completions endpoint"""
    inference_request = InferenceRequest(
        messages=request.messages,
        model=request.model,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        stream=request.stream,
        user_id=request.user_id,
        avatar=request.avatar,
        retain_knowledge=request.retain_knowledge
    )

    if request.stream:
        return StreamingResponse(
            engine.stream_infer(inference_request),
            media_type="text/event-stream"
        )

    return await engine.infer(inference_request)


@app.post("/infer")
async def infer(request: ChatRequest):
    """Direct inference endpoint with smart routing"""
    if serving_layer:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        result = await serving_layer.generate(
            messages=messages,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            user_id=request.user_id
        )
        return result

    # Fallback to direct engine
    inference_request = InferenceRequest(
        messages=request.messages,
        model=request.model,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        user_id=request.user_id,
        avatar=request.avatar,
        retain_knowledge=request.retain_knowledge
    )
    return await engine.infer(inference_request)


@app.post("/infer/stream")
async def infer_stream(request: ChatRequest):
    """Streaming inference endpoint"""
    inference_request = InferenceRequest(
        messages=request.messages,
        model=request.model,
        max_tokens=request.max_tokens,
        temperature=request.temperature,
        stream=True,
        user_id=request.user_id,
        avatar=request.avatar,
        retain_knowledge=request.retain_knowledge
    )
    return StreamingResponse(
        engine.stream_infer(inference_request),
        media_type="text/event-stream"
    )


# ═══════════════════════════════════════════════════════════════════════════
# MODEL MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

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


@app.post("/models/health-check")
async def health_check_all():
    """Check health of all models"""
    results = {}
    for model_key in MODEL_REGISTRY.keys():
        results[model_key] = await engine.check_model_health(model_key)
    return {"models": results}


@app.get("/router/status")
async def router_status():
    """Get router status and analytics"""
    if not serving_layer:
        return {"error": "Router not initialized"}
    return {
        "status": serving_layer.router.get_status(),
        "analytics": serving_layer.get_analytics()
    }


# ═══════════════════════════════════════════════════════════════════════════
# KNOWLEDGE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

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


@app.post("/knowledge/extract")
async def extract_knowledge(request: ExtractionRequest, background_tasks: BackgroundTasks):
    """Extract knowledge from Fractal Memory Engine"""
    if not extractor:
        raise HTTPException(status_code=500, detail="Extractor not initialized")

    # Run extraction in background
    async def run_extraction():
        extractor.config.min_quality_score = request.min_quality
        await extractor.extract_all()
        extractor.save_extracted(format=request.output_format)

    background_tasks.add_task(run_extraction)

    return {
        "status": "extraction_started",
        "format": request.output_format,
        "min_quality": request.min_quality
    }


@app.get("/knowledge/extraction-status")
async def extraction_status():
    """Get extraction status"""
    if not extractor:
        return {"status": "not_initialized"}
    return extractor.get_stats()


# ═══════════════════════════════════════════════════════════════════════════
# TRAINING PIPELINE
# ═══════════════════════════════════════════════════════════════════════════

@app.post("/training/prepare")
async def prepare_training(request: TrainingRequest):
    """Prepare training pipeline"""
    from training_pipeline import TrainingMethod

    training_config = TrainingConfig(
        base_model=request.base_model,
        method=TrainingMethod(request.method),
        output_name=request.output_name,
        num_epochs=request.epochs,
        batch_size=request.batch_size,
        lora_r=request.lora_r
    )

    data_config = DataConfig(
        input_path="./knowledge_store/extracted"
    )

    pipeline = SovereignTrainingPipeline(training_config, data_config)
    result = pipeline.prepare()

    return {
        "status": "prepared",
        "data": result["data"],
        "scripts": {
            "train": result["train_script"],
            "quantize": result["quantization_script"]
        },
        "instructions": "See /training/instructions for detailed steps"
    }


@app.get("/training/instructions")
async def training_instructions():
    """Get training instructions"""
    return {
        "quick_start": """
# 1. Extract knowledge
curl -X POST http://localhost:8050/knowledge/extract

# 2. Prepare training
curl -X POST http://localhost:8050/training/prepare

# 3. Run training (on machine with GPU)
cd services/sovereign-ai/models
python train_orb-sovereign.py

# 4. Quantize for Ollama
./quantize_orb-sovereign.sh

# 5. Deploy to Ollama
cd orb-sovereign/gguf
ollama create orb-sovereign -f Modelfile

# 6. Test
ollama run orb-sovereign
        """,
        "requirements": [
            "GPU with 24GB+ VRAM for 8B models",
            "GPU with 48GB+ VRAM for 70B models",
            "CUDA 12.0+ or ROCm 5.4+",
            "Python 3.10+",
            "Ollama installed locally"
        ]
    }


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8050)

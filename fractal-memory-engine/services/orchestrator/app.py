"""
Global Orchestration Layer - THE CONDUCTOR
Phase 9: Unified request router for all Fractal Memory Engines

Entry → Router → Engine Pipeline → Response
"""
import asyncio
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.models import CapturePayload, ProcessPayload, SurfaceRequest, SourceType
from shared.firestore_client import get_firestore_client
from shared.edge_kv_client import kv_get, kv_put
from shared.llm_client import llm_call

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fractal Memory - Orchestrator",
    description="THE CONDUCTOR - Global orchestration layer for all engines",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════

class EngineConfig:
    """Service URLs - override with env vars in production"""
    CAPTURE_URL = "http://localhost:8001"
    PROCESS_URL = "http://localhost:8002"
    SURFACE_URL = "http://localhost:8003"
    AUTH_URL = "http://localhost:8004"
    TIMEOUT = 30.0
    MAX_RETRIES = 3
    BACKPRESSURE_THRESHOLD = 100  # Max concurrent requests


# ═══════════════════════════════════════════════════════════════
# Models
# ═══════════════════════════════════════════════════════════════

class Priority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"
    BACKGROUND = "background"


class OrchestrateRequest(BaseModel):
    """Main orchestration request"""
    message: str
    user_id: str
    avatar: str = "default"
    session_id: Optional[str] = None
    priority: Priority = Priority.NORMAL
    include_llm_response: bool = True
    stream: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PipelineStage(BaseModel):
    """Status of each pipeline stage"""
    name: str
    status: str  # pending, running, completed, failed, skipped
    duration_ms: Optional[float] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class OrchestrateResponse(BaseModel):
    """Orchestration response"""
    request_id: str
    user_id: str
    avatar: str
    status: str  # completed, partial, failed
    llm_response: Optional[str] = None
    context_used: List[Dict[str, Any]] = Field(default_factory=list)
    tone_profile: Dict[str, str] = Field(default_factory=dict)
    pipeline: List[PipelineStage] = Field(default_factory=list)
    total_duration_ms: float
    timestamp: str


@dataclass
class PipelineContext:
    """Context passed through the pipeline"""
    request_id: str
    user_id: str
    avatar: str
    message: str
    session_id: Optional[str]
    priority: Priority
    metadata: Dict[str, Any]
    raw_signals: Dict[str, Any] = field(default_factory=dict)
    insights: List[Dict[str, Any]] = field(default_factory=list)
    context_snippets: List[Dict[str, Any]] = field(default_factory=list)
    tone_profile: Dict[str, str] = field(default_factory=dict)
    llm_response: Optional[str] = None
    stages: List[PipelineStage] = field(default_factory=list)
    start_time: float = field(default_factory=time.time)


# ═══════════════════════════════════════════════════════════════
# Backpressure + Rate Limiting
# ═══════════════════════════════════════════════════════════════

class BackpressureController:
    """Manages request flow to prevent overload"""

    def __init__(self, max_concurrent: int = 100):
        self.max_concurrent = max_concurrent
        self.current_count = 0
        self._lock = asyncio.Lock()
        self.queue_depths: Dict[Priority, int] = {p: 0 for p in Priority}

    async def acquire(self, priority: Priority) -> bool:
        async with self._lock:
            if self.current_count >= self.max_concurrent:
                # Allow critical/high to proceed, reject others
                if priority not in (Priority.CRITICAL, Priority.HIGH):
                    return False
            self.current_count += 1
            self.queue_depths[priority] += 1
            return True

    async def release(self, priority: Priority):
        async with self._lock:
            self.current_count = max(0, self.current_count - 1)
            self.queue_depths[priority] = max(0, self.queue_depths[priority] - 1)

    def get_stats(self) -> Dict[str, Any]:
        return {
            "current_count": self.current_count,
            "max_concurrent": self.max_concurrent,
            "utilization": self.current_count / self.max_concurrent,
            "queue_depths": dict(self.queue_depths),
        }


backpressure = BackpressureController(EngineConfig.BACKPRESSURE_THRESHOLD)


# ═══════════════════════════════════════════════════════════════
# HTTP Client Pool
# ═══════════════════════════════════════════════════════════════

_http_client: Optional[httpx.AsyncClient] = None


async def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            timeout=EngineConfig.TIMEOUT,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
        )
    return _http_client


# ═══════════════════════════════════════════════════════════════
# Engine Callers
# ═══════════════════════════════════════════════════════════════

async def call_capture_engine(ctx: PipelineContext) -> PipelineStage:
    """Call Capture Engine to extract signals"""
    stage = PipelineStage(name="capture", status="running")
    start = time.time()

    try:
        client = await get_http_client()
        response = await client.post(
            f"{EngineConfig.CAPTURE_URL}/capture/message",
            json={
                "user_id": ctx.user_id,
                "message": ctx.message,
                "message_id": ctx.request_id,
                "session_id": ctx.session_id,
            },
        )
        response.raise_for_status()
        result = response.json()

        ctx.raw_signals = result.get("signals", {})
        stage.status = "completed"
        stage.result = result

    except Exception as e:
        logger.error(f"Capture engine failed: {e}")
        stage.status = "failed"
        stage.error = str(e)
        # Use fallback signals
        ctx.raw_signals = {"energy": 0.5, "friction": 0.3, "tone": "direct"}

    stage.duration_ms = (time.time() - start) * 1000
    return stage


async def call_process_engine(ctx: PipelineContext) -> PipelineStage:
    """Call Process Engine to generate insights"""
    stage = PipelineStage(name="process", status="running")
    start = time.time()

    try:
        client = await get_http_client()
        response = await client.post(
            f"{EngineConfig.PROCESS_URL}/process/ingest_raw",
            json={
                "user_id": ctx.user_id,
                "raw_signals": [{
                    "text": ctx.message,
                    **ctx.raw_signals,
                }],
            },
        )
        response.raise_for_status()
        result = response.json()

        ctx.insights = result.get("insights", [])
        stage.status = "completed"
        stage.result = {"merged_count": result.get("merged_count", 0)}

    except Exception as e:
        logger.error(f"Process engine failed: {e}")
        stage.status = "failed"
        stage.error = str(e)

    stage.duration_ms = (time.time() - start) * 1000
    return stage


async def call_surface_engine(ctx: PipelineContext) -> PipelineStage:
    """Call Surface Engine to retrieve context"""
    stage = PipelineStage(name="surface", status="running")
    start = time.time()

    try:
        client = await get_http_client()
        response = await client.post(
            f"{EngineConfig.SURFACE_URL}/surface/context",
            json={
                "user_state": {"user_id": ctx.user_id},
                "current_avatar": ctx.avatar,
                "current_message": ctx.message,
                "max_snippets": 10,
            },
        )
        response.raise_for_status()
        result = response.json()

        ctx.context_snippets = result.get("context_snippets", [])
        ctx.tone_profile = result.get("tone_profile", {})
        stage.status = "completed"
        stage.result = {
            "snippets_count": len(ctx.context_snippets),
            "resonance_mode": result.get("resonance_mode", False),
        }

    except Exception as e:
        logger.error(f"Surface engine failed: {e}")
        stage.status = "failed"
        stage.error = str(e)
        ctx.tone_profile = {"preferred_tone": "direct", "pace": "normal"}

    stage.duration_ms = (time.time() - start) * 1000
    return stage


async def call_llm_response(ctx: PipelineContext) -> PipelineStage:
    """Generate LLM response using surfaced context"""
    stage = PipelineStage(name="llm_response", status="running")
    start = time.time()

    try:
        # Build context prompt
        context_str = ""
        if ctx.context_snippets:
            context_str = "User context:\n"
            for snippet in ctx.context_snippets[:5]:
                data = snippet.get("data", {})
                context_str += f"- {snippet.get('collection')}: {data}\n"

        tone_str = f"Tone: {ctx.tone_profile.get('preferred_tone', 'direct')}, Pace: {ctx.tone_profile.get('pace', 'normal')}"

        # Call LLM
        result = llm_call("chat_response", {
            "user_message": ctx.message,
            "avatar": ctx.avatar,
            "context": context_str,
            "tone_guidance": tone_str,
            "signals": ctx.raw_signals,
        })

        if result and len(result) > 0:
            ctx.llm_response = result[0].get("response", "I understand. How can I help?")
        else:
            ctx.llm_response = "I understand. Let me think about that."

        stage.status = "completed"
        stage.result = {"response_length": len(ctx.llm_response or "")}

    except Exception as e:
        logger.error(f"LLM response failed: {e}")
        stage.status = "failed"
        stage.error = str(e)
        ctx.llm_response = "I'm having trouble processing that right now."

    stage.duration_ms = (time.time() - start) * 1000
    return stage


async def trigger_async_engines(ctx: PipelineContext, background_tasks: BackgroundTasks):
    """Trigger async engines (Evolve, Narrative) in background"""

    async def run_evolve():
        try:
            db = get_firestore_client()
            # Lightweight evolve trigger - just mark for processing
            db.collection("users").document(ctx.user_id).collection("_meta").document("pending_evolve").set({
                "triggered_at": datetime.utcnow().isoformat(),
                "request_id": ctx.request_id,
            }, merge=True)
        except Exception as e:
            logger.warning(f"Evolve trigger failed: {e}")

    async def update_narrative():
        try:
            db = get_firestore_client()
            # Append to narrative log
            db.collection("users").document(ctx.user_id).collection("narrative").add({
                "content": ctx.message,
                "avatar": ctx.avatar,
                "signals": ctx.raw_signals,
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": ctx.request_id,
            })
        except Exception as e:
            logger.warning(f"Narrative update failed: {e}")

    background_tasks.add_task(run_evolve)
    background_tasks.add_task(update_narrative)


# ═══════════════════════════════════════════════════════════════
# Main Pipeline
# ═══════════════════════════════════════════════════════════════

async def run_pipeline(
    ctx: PipelineContext,
    include_llm: bool = True,
    background_tasks: Optional[BackgroundTasks] = None,
) -> OrchestrateResponse:
    """Execute the full engine pipeline"""

    # Stage 1: Capture (extract signals)
    capture_stage = await call_capture_engine(ctx)
    ctx.stages.append(capture_stage)

    # Stage 2 & 3: Process and Surface can run in parallel
    process_task = asyncio.create_task(call_process_engine(ctx))
    surface_task = asyncio.create_task(call_surface_engine(ctx))

    process_stage, surface_stage = await asyncio.gather(process_task, surface_task)
    ctx.stages.append(process_stage)
    ctx.stages.append(surface_stage)

    # Stage 4: LLM Response (if requested)
    if include_llm:
        llm_stage = await call_llm_response(ctx)
        ctx.stages.append(llm_stage)

    # Stage 5: Trigger async engines
    if background_tasks:
        await trigger_async_engines(ctx, background_tasks)
        ctx.stages.append(PipelineStage(
            name="async_triggers",
            status="completed",
            duration_ms=0,
            result={"triggered": ["evolve", "narrative"]},
        ))

    # Calculate status
    failed_stages = [s for s in ctx.stages if s.status == "failed"]
    if len(failed_stages) == len(ctx.stages):
        status = "failed"
    elif failed_stages:
        status = "partial"
    else:
        status = "completed"

    return OrchestrateResponse(
        request_id=ctx.request_id,
        user_id=ctx.user_id,
        avatar=ctx.avatar,
        status=status,
        llm_response=ctx.llm_response,
        context_used=ctx.context_snippets,
        tone_profile=ctx.tone_profile,
        pipeline=ctx.stages,
        total_duration_ms=(time.time() - ctx.start_time) * 1000,
        timestamp=datetime.utcnow().isoformat(),
    )


# ═══════════════════════════════════════════════════════════════
# API Endpoints
# ═══════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "orchestrator",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "backpressure": backpressure.get_stats(),
    }


@app.post("/orchestrate/message", response_model=OrchestrateResponse)
async def orchestrate_message(
    request: OrchestrateRequest,
    background_tasks: BackgroundTasks,
    x_request_id: Optional[str] = Header(None),
):
    """
    Main orchestration endpoint - THE CONDUCTOR

    Routes message through all engines:
    1. Capture → Extract signals
    2. Process → Generate insights (parallel)
    3. Surface → Retrieve context (parallel)
    4. LLM → Generate response
    5. Async → Evolve + Narrative (background)
    """
    request_id = x_request_id or str(uuid.uuid4())

    # Backpressure check
    if not await backpressure.acquire(request.priority):
        raise HTTPException(
            status_code=503,
            detail="Service overloaded. Please retry with higher priority or later.",
        )

    try:
        ctx = PipelineContext(
            request_id=request_id,
            user_id=request.user_id,
            avatar=request.avatar,
            message=request.message,
            session_id=request.session_id,
            priority=request.priority,
            metadata=request.metadata,
        )

        response = await run_pipeline(
            ctx,
            include_llm=request.include_llm_response,
            background_tasks=background_tasks,
        )

        logger.info(f"Orchestration complete: {request_id} in {response.total_duration_ms:.2f}ms")
        return response

    finally:
        await backpressure.release(request.priority)


@app.post("/orchestrate/batch")
async def orchestrate_batch(
    requests: List[OrchestrateRequest],
    background_tasks: BackgroundTasks,
):
    """Process multiple messages in batch"""
    results = []

    for req in requests:
        try:
            result = await orchestrate_message(req, background_tasks)
            results.append({"status": "success", "result": result})
        except Exception as e:
            results.append({"status": "error", "error": str(e)})

    return {"results": results, "total": len(results)}


@app.get("/orchestrate/status")
async def orchestrate_status():
    """Get orchestrator status and metrics"""
    return {
        "status": "operational",
        "backpressure": backpressure.get_stats(),
        "engines": {
            "capture": EngineConfig.CAPTURE_URL,
            "process": EngineConfig.PROCESS_URL,
            "surface": EngineConfig.SURFACE_URL,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

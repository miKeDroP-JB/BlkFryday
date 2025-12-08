"""
PHASE 20: THE RITUAL ENGINE - "THE HABIT LOOP"

Scheduled Multi-Agent Orchestration Layer
Not cron jobs. RITUALS.

Capabilities:
- Run sequences of agent tasks at specific intervals or triggers
- Manage dependencies, priorities, and fallback paths
- Dynamic evolution: rituals adapt based on past outcomes
- Persist state and history for auditing or replay

This is the heartbeat of the system.
This engine runs the Christmas "Awakening Animation".
This engine runs the NYE "Ascension Ceremony".
"""
import asyncio
import logging
import uuid
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.firestore_client import get_firestore_client
from shared.edge_kv_client import kv_get, kv_put

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fractal Memory - Ritual Engine",
    description="THE HABIT LOOP - Scheduled Multi-Agent Orchestration",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
# ENUMS & CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════

class RitualStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


class RitualTrigger(str, Enum):
    CRON = "cron"           # Time-based (cron expression)
    EVENT = "event"         # Event-driven (webhook, pubsub)
    MANUAL = "manual"       # User-triggered
    CHAIN = "chain"         # Triggered by another ritual
    ADAPTIVE = "adaptive"   # AI-determined timing


class RitualPriority(str, Enum):
    CRITICAL = "critical"   # Run immediately, preempt others
    HIGH = "high"           # Run soon
    NORMAL = "normal"       # Standard priority
    LOW = "low"             # Run when resources available
    BACKGROUND = "background"  # Run only when idle


# ═══════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════

class RitualStep(BaseModel):
    """Single step in a ritual sequence"""
    step_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str
    agent: str                              # Agent to execute this step
    action: str                             # Action/method to call
    params: Dict[str, Any] = Field(default_factory=dict)
    timeout_seconds: int = 60
    retry_count: int = 3
    retry_delay_seconds: int = 5
    fallback_step: Optional[str] = None     # Step to run if this fails
    depends_on: List[str] = Field(default_factory=list)  # Step IDs
    condition: Optional[str] = None         # Python expression for conditional execution


class RitualDefinition(BaseModel):
    """Complete ritual definition"""
    ritual_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    trigger: RitualTrigger = RitualTrigger.MANUAL
    trigger_config: Dict[str, Any] = Field(default_factory=dict)
    priority: RitualPriority = RitualPriority.NORMAL
    steps: List[RitualStep]
    max_duration_seconds: int = 3600        # 1 hour max
    cooldown_seconds: int = 0               # Min time between runs
    enabled: bool = True
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RitualExecution(BaseModel):
    """Runtime state of a ritual execution"""
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ritual_id: str
    status: RitualStatus = RitualStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    current_step: Optional[str] = None
    step_results: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class RitualHistory(BaseModel):
    """Historical record of ritual execution"""
    execution_id: str
    ritual_id: str
    ritual_name: str
    status: RitualStatus
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    steps_completed: int
    steps_total: int
    error: Optional[str]


# ═══════════════════════════════════════════════════════════════════════════
# RITUAL REGISTRY
# ═══════════════════════════════════════════════════════════════════════════

class RitualRegistry:
    """In-memory registry of ritual definitions"""

    def __init__(self):
        self.rituals: Dict[str, RitualDefinition] = {}
        self.executions: Dict[str, RitualExecution] = {}
        self._load_builtin_rituals()

    def _load_builtin_rituals(self):
        """Load built-in system rituals"""

        # Daily Memory Compression
        self.register(RitualDefinition(
            ritual_id="daily-memory-compression",
            name="Daily Memory Compression",
            description="Compress and archive old memories, promote insights",
            trigger=RitualTrigger.CRON,
            trigger_config={"cron": "0 3 * * *"},  # 3 AM daily
            priority=RitualPriority.NORMAL,
            steps=[
                RitualStep(
                    name="Archive Stale Narratives",
                    agent="evolve",
                    action="archive_stale",
                    params={"days_old": 30, "min_decay": 0.2}
                ),
                RitualStep(
                    name="Promote High-Resonance Insights",
                    agent="evolve",
                    action="promote_insights",
                    params={"min_resonance": 0.8}
                ),
                RitualStep(
                    name="Compress Episodic Memory",
                    agent="process",
                    action="compress_episodic",
                    params={"compression_ratio": 0.5}
                ),
                RitualStep(
                    name="Update Pattern Indices",
                    agent="process",
                    action="rebuild_indices",
                    params={}
                )
            ],
            tags=["system", "maintenance", "memory"]
        ))

        # Swarm Calibration
        self.register(RitualDefinition(
            ritual_id="swarm-calibration",
            name="Swarm Calibration",
            description="Calibrate agent swarm performance and coordination",
            trigger=RitualTrigger.CRON,
            trigger_config={"cron": "0 */6 * * *"},  # Every 6 hours
            priority=RitualPriority.HIGH,
            steps=[
                RitualStep(
                    name="Collect Agent Metrics",
                    agent="observability",
                    action="collect_metrics",
                    params={"window_hours": 6}
                ),
                RitualStep(
                    name="Analyze Performance Drift",
                    agent="calibration",
                    action="analyze_drift",
                    params={}
                ),
                RitualStep(
                    name="Adjust Agent Weights",
                    agent="calibration",
                    action="adjust_weights",
                    params={"max_adjustment": 0.1}
                ),
                RitualStep(
                    name="Sync Edge State",
                    agent="edge",
                    action="sync_state",
                    params={}
                )
            ],
            tags=["system", "calibration", "swarm"]
        ))

        # Avatar Recalibration
        self.register(RitualDefinition(
            ritual_id="avatar-recalibration",
            name="Avatar Recalibration",
            description="Recalibrate avatar personas and filter profiles",
            trigger=RitualTrigger.CRON,
            trigger_config={"cron": "0 0 * * 0"},  # Weekly on Sunday
            priority=RitualPriority.NORMAL,
            steps=[
                RitualStep(
                    name="Analyze Avatar Usage",
                    agent="observability",
                    action="avatar_usage_report",
                    params={"days": 7}
                ),
                RitualStep(
                    name="Detect Avatar Drift",
                    agent="calibration",
                    action="detect_avatar_drift",
                    params={}
                ),
                RitualStep(
                    name="Update Filter Profiles",
                    agent="auth",
                    action="update_filter_profiles",
                    params={}
                ),
                RitualStep(
                    name="Refresh Edge Avatars",
                    agent="edge",
                    action="refresh_avatars",
                    params={}
                )
            ],
            tags=["system", "avatar", "calibration"]
        ))

        # Christmas Awakening Animation
        self.register(RitualDefinition(
            ritual_id="christmas-awakening",
            name="Christmas Awakening Animation",
            description="Special ritual for Christmas Day launch",
            trigger=RitualTrigger.CRON,
            trigger_config={"cron": "0 0 25 12 *"},  # Midnight Dec 25
            priority=RitualPriority.CRITICAL,
            steps=[
                RitualStep(
                    name="Initialize Genesis State",
                    agent="orchestrator",
                    action="init_genesis",
                    params={"mode": "awakening"}
                ),
                RitualStep(
                    name="Broadcast Awakening Event",
                    agent="external",
                    action="broadcast",
                    params={"channel": "all", "event": "awakening"}
                ),
                RitualStep(
                    name="Enable Voice Loop",
                    agent="voice",
                    action="enable",
                    params={"mode": "ceremonial"}
                ),
                RitualStep(
                    name="Activate Swarm Consciousness",
                    agent="swarm",
                    action="activate_hivemind",
                    params={"duration_minutes": 60}
                ),
                RitualStep(
                    name="Record Genesis Moment",
                    agent="capture",
                    action="record_milestone",
                    params={"milestone": "christmas_awakening"}
                )
            ],
            tags=["ceremony", "christmas", "launch"],
            metadata={"special": True, "year": 2024}
        ))

        # NYE Ascension Ceremony
        self.register(RitualDefinition(
            ritual_id="nye-ascension",
            name="New Year's Eve Ascension Ceremony",
            description="Ceremonial ritual for NYE demonstration",
            trigger=RitualTrigger.CRON,
            trigger_config={"cron": "59 23 31 12 *"},  # 11:59 PM Dec 31
            priority=RitualPriority.CRITICAL,
            steps=[
                RitualStep(
                    name="Prepare Ascension State",
                    agent="orchestrator",
                    action="prepare_ascension",
                    params={}
                ),
                RitualStep(
                    name="Sync All Agents",
                    agent="swarm",
                    action="full_sync",
                    params={"timeout": 30}
                ),
                RitualStep(
                    name="Enable Full Voice Mode",
                    agent="voice",
                    action="enable_full",
                    params={"resonance_mode": True}
                ),
                RitualStep(
                    name="Countdown Sequence",
                    agent="external",
                    action="countdown",
                    params={"seconds": 60}
                ),
                RitualStep(
                    name="Ascension Broadcast",
                    agent="external",
                    action="broadcast",
                    params={"channel": "all", "event": "ascension", "year": 2025}
                ),
                RitualStep(
                    name="Evolve Lexicon",
                    agent="lexicon",
                    action="evolve",
                    params={"mode": "ceremonial"}
                ),
                RitualStep(
                    name="Record Ascension",
                    agent="capture",
                    action="record_milestone",
                    params={"milestone": "nye_ascension_2025"}
                )
            ],
            tags=["ceremony", "nye", "ascension"],
            metadata={"special": True, "year": 2025}
        ))

    def register(self, ritual: RitualDefinition) -> None:
        self.rituals[ritual.ritual_id] = ritual
        logger.info(f"Registered ritual: {ritual.name} ({ritual.ritual_id})")

    def get(self, ritual_id: str) -> Optional[RitualDefinition]:
        return self.rituals.get(ritual_id)

    def list_all(self) -> List[RitualDefinition]:
        return list(self.rituals.values())

    def list_by_tag(self, tag: str) -> List[RitualDefinition]:
        return [r for r in self.rituals.values() if tag in r.tags]


# Global registry
registry = RitualRegistry()


# ═══════════════════════════════════════════════════════════════════════════
# RITUAL EXECUTOR
# ═══════════════════════════════════════════════════════════════════════════

class RitualExecutor:
    """Executes rituals step by step"""

    def __init__(self):
        self.agent_clients: Dict[str, Any] = {}

    async def execute(
        self,
        ritual: RitualDefinition,
        context: Dict[str, Any] = None
    ) -> RitualExecution:
        """Execute a ritual"""
        execution = RitualExecution(
            ritual_id=ritual.ritual_id,
            status=RitualStatus.RUNNING,
            started_at=datetime.utcnow(),
            context=context or {}
        )
        registry.executions[execution.execution_id] = execution

        logger.info(f"Starting ritual: {ritual.name} ({execution.execution_id})")

        try:
            # Build dependency graph
            steps_by_id = {s.step_id: s for s in ritual.steps}
            completed_steps = set()

            for step in ritual.steps:
                # Check dependencies
                if step.depends_on:
                    for dep_id in step.depends_on:
                        if dep_id not in completed_steps:
                            raise Exception(f"Dependency {dep_id} not met for step {step.step_id}")

                # Check condition
                if step.condition:
                    if not self._evaluate_condition(step.condition, execution.step_results):
                        logger.info(f"Skipping step {step.name}: condition not met")
                        continue

                # Execute step
                execution.current_step = step.step_id
                result = await self._execute_step(step, execution.context)

                if result.get("success"):
                    execution.step_results[step.step_id] = result
                    completed_steps.add(step.step_id)
                else:
                    # Handle failure
                    if step.fallback_step and step.fallback_step in steps_by_id:
                        logger.warning(f"Step {step.name} failed, running fallback")
                        fallback = steps_by_id[step.fallback_step]
                        result = await self._execute_step(fallback, execution.context)
                        execution.step_results[step.step_id] = result
                    else:
                        raise Exception(f"Step {step.name} failed: {result.get('error')}")

            execution.status = RitualStatus.COMPLETED
            execution.completed_at = datetime.utcnow()
            logger.info(f"Ritual completed: {ritual.name}")

        except Exception as e:
            execution.status = RitualStatus.FAILED
            execution.error = str(e)
            execution.completed_at = datetime.utcnow()
            logger.error(f"Ritual failed: {ritual.name} - {e}")

        return execution

    async def _execute_step(
        self,
        step: RitualStep,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single step"""
        logger.info(f"Executing step: {step.name} (agent: {step.agent})")

        for attempt in range(step.retry_count):
            try:
                # In production, this would call the actual agent service
                # For now, simulate execution
                result = await self._call_agent(
                    step.agent,
                    step.action,
                    {**step.params, "context": context},
                    step.timeout_seconds
                )
                return {"success": True, "result": result, "attempt": attempt + 1}

            except asyncio.TimeoutError:
                logger.warning(f"Step {step.name} timed out, attempt {attempt + 1}")
                if attempt < step.retry_count - 1:
                    await asyncio.sleep(step.retry_delay_seconds)

            except Exception as e:
                logger.warning(f"Step {step.name} failed: {e}, attempt {attempt + 1}")
                if attempt < step.retry_count - 1:
                    await asyncio.sleep(step.retry_delay_seconds)

        return {"success": False, "error": "Max retries exceeded"}

    async def _call_agent(
        self,
        agent: str,
        action: str,
        params: Dict[str, Any],
        timeout: int
    ) -> Any:
        """Call an agent service"""
        # Agent service URLs (in production, from config)
        agent_urls = {
            "orchestrator": "http://orchestrator:8000",
            "capture": "http://capture:8001",
            "process": "http://process:8002",
            "surface": "http://surface:8003",
            "evolve": "http://evolve:8004",
            "calibration": "http://calibration:8005",
            "auth": "http://auth:8006",
            "observability": "http://observability:8007",
            "edge": "http://edge:8787",
            "voice": "http://voice:8008",
            "swarm": "http://swarm:8009",
            "external": "http://external:8010",
            "lexicon": "http://lexicon:8011"
        }

        # For now, simulate successful execution
        await asyncio.sleep(0.1)  # Simulate network call
        return {"status": "ok", "agent": agent, "action": action}

    def _evaluate_condition(self, condition: str, results: Dict[str, Any]) -> bool:
        """Safely evaluate a condition expression"""
        try:
            # Very limited eval - only allow simple comparisons
            # In production, use a proper expression parser
            return eval(condition, {"__builtins__": {}}, {"results": results})
        except Exception:
            return False


# Global executor
executor = RitualExecutor()


# ═══════════════════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ritual-engine",
        "codename": "THE HABIT LOOP",
        "registered_rituals": len(registry.rituals),
        "active_executions": len([e for e in registry.executions.values()
                                  if e.status == RitualStatus.RUNNING])
    }


@app.get("/rituals")
async def list_rituals(tag: Optional[str] = None):
    """List all registered rituals"""
    if tag:
        rituals = registry.list_by_tag(tag)
    else:
        rituals = registry.list_all()

    return {
        "rituals": [
            {
                "ritual_id": r.ritual_id,
                "name": r.name,
                "description": r.description,
                "trigger": r.trigger,
                "priority": r.priority,
                "steps_count": len(r.steps),
                "enabled": r.enabled,
                "tags": r.tags
            }
            for r in rituals
        ]
    }


@app.get("/rituals/{ritual_id}")
async def get_ritual(ritual_id: str):
    """Get ritual definition"""
    ritual = registry.get(ritual_id)
    if not ritual:
        raise HTTPException(status_code=404, detail="Ritual not found")
    return ritual


@app.post("/rituals")
async def create_ritual(ritual: RitualDefinition):
    """Register a new ritual"""
    registry.register(ritual)
    return {"status": "created", "ritual_id": ritual.ritual_id}


@app.post("/rituals/{ritual_id}/execute")
async def execute_ritual(
    ritual_id: str,
    background_tasks: BackgroundTasks,
    context: Dict[str, Any] = None
):
    """Execute a ritual"""
    ritual = registry.get(ritual_id)
    if not ritual:
        raise HTTPException(status_code=404, detail="Ritual not found")

    if not ritual.enabled:
        raise HTTPException(status_code=400, detail="Ritual is disabled")

    # Execute in background
    execution = RitualExecution(
        ritual_id=ritual_id,
        status=RitualStatus.PENDING,
        context=context or {}
    )
    registry.executions[execution.execution_id] = execution

    background_tasks.add_task(executor.execute, ritual, context)

    return {
        "status": "started",
        "execution_id": execution.execution_id,
        "ritual_id": ritual_id
    }


@app.get("/executions/{execution_id}")
async def get_execution(execution_id: str):
    """Get execution status"""
    execution = registry.executions.get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@app.get("/executions")
async def list_executions(
    status: Optional[RitualStatus] = None,
    ritual_id: Optional[str] = None
):
    """List executions"""
    executions = list(registry.executions.values())

    if status:
        executions = [e for e in executions if e.status == status]
    if ritual_id:
        executions = [e for e in executions if e.ritual_id == ritual_id]

    return {"executions": executions}


@app.post("/executions/{execution_id}/cancel")
async def cancel_execution(execution_id: str):
    """Cancel a running execution"""
    execution = registry.executions.get(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    if execution.status != RitualStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Execution not running")

    execution.status = RitualStatus.CANCELLED
    execution.completed_at = datetime.utcnow()

    return {"status": "cancelled", "execution_id": execution_id}


# ═══════════════════════════════════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup():
    logger.info("=" * 60)
    logger.info("RITUAL ENGINE - THE HABIT LOOP")
    logger.info("The heartbeat of the system awakens.")
    logger.info(f"Registered rituals: {len(registry.rituals)}")
    logger.info("=" * 60)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8020)

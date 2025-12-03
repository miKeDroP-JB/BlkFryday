#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
SWARM CONTROL PANEL - Agent Orchestration System
═══════════════════════════════════════════════════════════════════
"One mind coordinates. The swarm executes."

Real-time visualization and control of all agents in the system.
═══════════════════════════════════════════════════════════════════
"""

import asyncio
import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from enum import Enum
import logging

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [SWARM] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────
# Types & Models
# ─────────────────────────────────────────────────────────────────

class AgentType(str, Enum):
    APOLLO = "apollo"       # Vision & Strategy
    ATHENA = "athena"       # Wisdom & Analysis
    HERMES = "hermes"       # Communication
    ARES = "ares"           # Execution
    HEPHAESTUS = "hephaestus"  # Creation
    ARTEMIS = "artemis"     # Precision
    MERCURY = "mercury"     # Speed & Commerce

class AgentStatus(str, Enum):
    IDLE = "idle"
    WORKING = "working"
    WAITING = "waiting"
    ERROR = "error"
    OFFLINE = "offline"

class SwarmPattern(str, Enum):
    CHAIN = "chain"         # Sequential execution
    PARALLEL = "parallel"   # Concurrent execution
    HIERARCHY = "hierarchy" # Tree structure
    COUNCIL = "council"     # Voting/consensus
    HIVEMIND = "hivemind"   # Shared consciousness

@dataclass
class Agent:
    id: str
    type: AgentType
    status: AgentStatus = AgentStatus.IDLE
    current_task: Optional[str] = None
    memory: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, float] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    last_active: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'type': self.type.value,
            'status': self.status.value,
            'current_task': self.current_task,
            'memory': self.memory,
            'metrics': self.metrics,
            'created_at': self.created_at,
            'last_active': self.last_active
        }

@dataclass
class Swarm:
    id: str
    name: str
    pattern: SwarmPattern
    agents: List[str]  # Agent IDs
    target: Optional[str] = None
    status: str = "active"
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)

# ─────────────────────────────────────────────────────────────────
# Request/Response Models
# ─────────────────────────────────────────────────────────────────

class SpawnAgentRequest(BaseModel):
    type: str
    task: Optional[str] = None

class DeploySwarmRequest(BaseModel):
    type: str
    target: Optional[str] = None
    agent_count: int = 3

class TaskRequest(BaseModel):
    agent_id: str
    task: str
    priority: int = 5

class ChatRequest(BaseModel):
    message: str
    agent_id: Optional[str] = None

# ─────────────────────────────────────────────────────────────────
# Swarm Manager
# ─────────────────────────────────────────────────────────────────

class SwarmManager:
    """Manages all agents and swarms"""

    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.swarms: Dict[str, Swarm] = {}
        self.task_queue: List[Dict] = []
        self.websocket_clients: List[WebSocket] = []
        self.metrics = {
            'total_tasks': 0,
            'completed_tasks': 0,
            'total_tokens': 0
        }

    def spawn_agent(self, agent_type: str, task: Optional[str] = None) -> Agent:
        """Spawn a new agent"""

        try:
            atype = AgentType(agent_type.lower())
        except ValueError:
            raise ValueError(f"Unknown agent type: {agent_type}")

        agent_id = f"{atype.value}_{uuid.uuid4().hex[:8]}"
        agent = Agent(
            id=agent_id,
            type=atype,
            status=AgentStatus.IDLE if not task else AgentStatus.WORKING,
            current_task=task,
            metrics={'tasks_completed': 0, 'avg_response_time': 0}
        )

        self.agents[agent_id] = agent
        logger.info(f"Spawned agent: {agent_id}")

        # Broadcast update
        asyncio.create_task(self._broadcast({
            'event': 'agent_spawned',
            'agent': agent.to_dict()
        }))

        return agent

    def dismiss_agent(self, agent_id: str) -> bool:
        """Dismiss an agent"""

        if agent_id not in self.agents:
            return False

        del self.agents[agent_id]
        logger.info(f"Dismissed agent: {agent_id}")

        asyncio.create_task(self._broadcast({
            'event': 'agent_dismissed',
            'agent_id': agent_id
        }))

        return True

    def deploy_swarm(self, swarm_type: str, target: Optional[str], agent_count: int) -> Swarm:
        """Deploy a swarm of agents"""

        # Determine agent composition based on swarm type
        compositions = {
            'analysis': [AgentType.ATHENA, AgentType.APOLLO, AgentType.ARTEMIS],
            'creation': [AgentType.HEPHAESTUS, AgentType.HERMES, AgentType.APOLLO],
            'execution': [AgentType.ARES, AgentType.MERCURY, AgentType.ARTEMIS],
            'full': list(AgentType)
        }

        agent_types = compositions.get(swarm_type, [AgentType.APOLLO, AgentType.ATHENA])

        # Spawn agents
        spawned_agents = []
        for i in range(agent_count):
            atype = agent_types[i % len(agent_types)]
            agent = self.spawn_agent(atype.value, f"Swarm task: {target}")
            spawned_agents.append(agent.id)

        # Create swarm
        swarm_id = f"swarm_{uuid.uuid4().hex[:8]}"
        swarm = Swarm(
            id=swarm_id,
            name=f"{swarm_type.title()} Swarm",
            pattern=SwarmPattern.PARALLEL,
            agents=spawned_agents,
            target=target
        )

        self.swarms[swarm_id] = swarm
        logger.info(f"Deployed swarm: {swarm_id} with {agent_count} agents")

        asyncio.create_task(self._broadcast({
            'event': 'swarm_deployed',
            'swarm': swarm.to_dict()
        }))

        return swarm

    def assign_task(self, agent_id: str, task: str):
        """Assign a task to an agent"""

        if agent_id not in self.agents:
            raise ValueError(f"Agent not found: {agent_id}")

        agent = self.agents[agent_id]
        agent.status = AgentStatus.WORKING
        agent.current_task = task
        agent.last_active = datetime.now().isoformat()

        self.metrics['total_tasks'] += 1

        asyncio.create_task(self._broadcast({
            'event': 'task_assigned',
            'agent_id': agent_id,
            'task': task
        }))

    def complete_task(self, agent_id: str, result: Any = None):
        """Mark a task as complete"""

        if agent_id not in self.agents:
            return

        agent = self.agents[agent_id]
        agent.status = AgentStatus.IDLE
        agent.current_task = None
        agent.metrics['tasks_completed'] = agent.metrics.get('tasks_completed', 0) + 1

        self.metrics['completed_tasks'] += 1

        asyncio.create_task(self._broadcast({
            'event': 'task_completed',
            'agent_id': agent_id,
            'result': result
        }))

    def get_agent_count(self) -> int:
        return len(self.agents)

    def get_all_agents(self) -> List[Dict]:
        return [a.to_dict() for a in self.agents.values()]

    def get_all_swarms(self) -> List[Dict]:
        return [s.to_dict() for s in self.swarms.values()]

    def get_heatmap(self) -> Dict:
        """Generate memory/activity heatmap"""

        return {
            'agents': {
                aid: {
                    'memory_usage': len(json.dumps(a.memory)),
                    'activity': 1 if a.status == AgentStatus.WORKING else 0,
                    'tasks': a.metrics.get('tasks_completed', 0)
                }
                for aid, a in self.agents.items()
            },
            'total_active': sum(1 for a in self.agents.values() if a.status == AgentStatus.WORKING),
            'total_idle': sum(1 for a in self.agents.values() if a.status == AgentStatus.IDLE)
        }

    async def _broadcast(self, message: Dict):
        """Broadcast message to all WebSocket clients"""

        dead_clients = []
        for client in self.websocket_clients:
            try:
                await client.send_json(message)
            except:
                dead_clients.append(client)

        for client in dead_clients:
            self.websocket_clients.remove(client)

# ─────────────────────────────────────────────────────────────────
# FastAPI Application
# ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="VYRA Swarm Control Panel",
    description="Real-time agent orchestration system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize manager
manager = SwarmManager()

# ─────────────────────────────────────────────────────────────────
# REST Endpoints
# ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "name": "VYRA Swarm Control Panel",
        "version": "1.0.0",
        "status": "operational",
        "agents": manager.get_agent_count()
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Agents
@app.get("/agents")
async def list_agents():
    return {"agents": manager.get_all_agents()}

@app.get("/agents/count")
async def agent_count():
    return manager.get_agent_count()

@app.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    if agent_id not in manager.agents:
        raise HTTPException(404, "Agent not found")
    return manager.agents[agent_id].to_dict()

@app.post("/agents/spawn")
async def spawn_agent(request: SpawnAgentRequest):
    try:
        agent = manager.spawn_agent(request.type, request.task)
        return {"success": True, "agent": agent.to_dict()}
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.delete("/agents/{agent_id}")
async def dismiss_agent(agent_id: str):
    if manager.dismiss_agent(agent_id):
        return {"success": True}
    raise HTTPException(404, "Agent not found")

@app.post("/agents/{agent_id}/task")
async def assign_task(agent_id: str, request: TaskRequest):
    try:
        manager.assign_task(agent_id, request.task)
        return {"success": True}
    except ValueError as e:
        raise HTTPException(404, str(e))

# Swarms
@app.get("/swarms")
async def list_swarms():
    return {"swarms": manager.get_all_swarms()}

@app.post("/swarm/deploy")
async def deploy_swarm(request: DeploySwarmRequest):
    swarm = manager.deploy_swarm(request.type, request.target, request.agent_count)
    return {"success": True, "swarm": swarm.to_dict()}

# Metrics
@app.get("/metrics")
async def get_metrics():
    return manager.metrics

@app.get("/heatmap")
async def get_heatmap():
    return manager.get_heatmap()

# Chat (proxy to model router)
@app.post("/chat")
async def chat(request: ChatRequest):
    # Simple mock response for now
    # In production, this would call the model router
    return {
        "response": f"Received: {request.message}",
        "agent_id": request.agent_id
    }

# Embeddings (proxy)
@app.post("/embed")
async def embed(request: dict):
    return {
        "embedding": [0.1, 0.2, 0.3, 0.4, 0.5],
        "note": "Proxy to embedding server"
    }

# ─────────────────────────────────────────────────────────────────
# WebSocket for Real-time Updates
# ─────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    manager.websocket_clients.append(websocket)
    logger.info("WebSocket client connected")

    try:
        # Send initial state
        await websocket.send_json({
            'event': 'initial_state',
            'agents': manager.get_all_agents(),
            'swarms': manager.get_all_swarms(),
            'metrics': manager.metrics
        })

        # Keep connection alive and handle messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle client messages
            if message.get('type') == 'ping':
                await websocket.send_json({'type': 'pong'})

    except WebSocketDisconnect:
        manager.websocket_clients.remove(websocket)
        logger.info("WebSocket client disconnected")

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

def main():
    print("""
╔═══════════════════════════════════════════════════════════════════╗
║                    SWARM CONTROL PANEL                            ║
║              Agent Orchestration System                           ║
╠═══════════════════════════════════════════════════════════════════╣
║   REST API:    http://localhost:7777                             ║
║   WebSocket:   ws://localhost:7777/ws                            ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    uvicorn.run(app, host="0.0.0.0", port=7777)

if __name__ == '__main__':
    main()

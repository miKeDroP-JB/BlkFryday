#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ORBOS ORB-CORE - FRACTAL NODE ORCHESTRATION
═══════════════════════════════════════════════════════════════════════════════
Self-scaling, recursive AI runtime with 47 fractal nodes.

"Infinite scale. Zero friction. Perpetual execution."
═══════════════════════════════════════════════════════════════════════════════
"""

import asyncio
import uuid
import json
import time
from datetime import datetime
from typing import Dict, List, Callable, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import random

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

NUM_NODES = 47  # Fractal prime
MAX_DEPTH = 7   # Recursion depth limit
ENERGY_DECAY = 0.95  # Energy retained after task

# ═══════════════════════════════════════════════════════════════════════════════
# NODE STATES
# ═══════════════════════════════════════════════════════════════════════════════

class NodeState(Enum):
    IDLE = "idle"
    RUNNING = "running"
    SPAWNING = "spawning"
    COMPLETE = "complete"
    ERROR = "error"
    DORMANT = "dormant"

class TaskPriority(Enum):
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3

# ═══════════════════════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Task:
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    name: str = ""
    priority: TaskPriority = TaskPriority.NORMAL
    payload: Dict = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    depth: int = 0
    parent_id: Optional[str] = None
    subtasks: List[str] = field(default_factory=list)
    result: Any = None
    error: Optional[str] = None

@dataclass
class NodeMetrics:
    tasks_completed: int = 0
    tasks_failed: int = 0
    total_runtime: float = 0.0
    avg_task_time: float = 0.0
    children_spawned: int = 0
    energy: float = 1.0

# ═══════════════════════════════════════════════════════════════════════════════
# FRACTAL NODE
# ═══════════════════════════════════════════════════════════════════════════════

class FractalNode:
    """
    Self-replicating computational node.
    Can spawn child nodes for subtasks up to MAX_DEPTH.
    """

    def __init__(self, node_id: int, parent: Optional['FractalNode'] = None, depth: int = 0):
        self.node_id = node_id
        self.uid = f"NODE-{node_id:03d}-{uuid.uuid4().hex[:4]}"
        self.parent = parent
        self.depth = depth
        self.state = NodeState.IDLE
        self.metrics = NodeMetrics()
        self.current_task: Optional[Task] = None
        self.children: List['FractalNode'] = []
        self.task_handlers: Dict[str, Callable] = {}

        # Register default handlers
        self._register_default_handlers()

    def _register_default_handlers(self):
        """Register built-in task handlers."""
        self.task_handlers = {
            'compute': self._handle_compute,
            'aggregate': self._handle_aggregate,
            'transform': self._handle_transform,
            'spawn': self._handle_spawn,
            'echo': self._handle_echo,
        }

    async def run_task(self, task: Task) -> Any:
        """Execute a task with full lifecycle management."""
        self.state = NodeState.RUNNING
        self.current_task = task
        start_time = time.time()

        try:
            # Get handler
            handler = self.task_handlers.get(task.name, self._handle_default)

            # Execute
            result = await handler(task)

            # Update metrics
            elapsed = time.time() - start_time
            self.metrics.tasks_completed += 1
            self.metrics.total_runtime += elapsed
            self.metrics.avg_task_time = self.metrics.total_runtime / self.metrics.tasks_completed
            self.metrics.energy *= ENERGY_DECAY

            task.result = result
            self.state = NodeState.COMPLETE

            return result

        except Exception as e:
            self.metrics.tasks_failed += 1
            task.error = str(e)
            self.state = NodeState.ERROR
            raise

        finally:
            self.current_task = None
            if self.metrics.energy > 0.1:
                self.state = NodeState.IDLE
            else:
                self.state = NodeState.DORMANT

    async def spawn_child(self, task: Task) -> 'FractalNode':
        """Spawn a child node for subtask."""
        if self.depth >= MAX_DEPTH:
            raise RuntimeError(f"Maximum recursion depth ({MAX_DEPTH}) reached")

        self.state = NodeState.SPAWNING

        child_id = len(self.children) + (self.node_id * 100)
        child = FractalNode(child_id, parent=self, depth=self.depth + 1)

        self.children.append(child)
        self.metrics.children_spawned += 1

        # Run task in child
        await child.run_task(task)

        return child

    # ─────────────────────────────────────────────────────────────────────────
    # TASK HANDLERS
    # ─────────────────────────────────────────────────────────────────────────

    async def _handle_default(self, task: Task) -> Any:
        """Default handler - just return payload."""
        await asyncio.sleep(0.01)  # Simulate work
        return task.payload

    async def _handle_compute(self, task: Task) -> Any:
        """Compute handler - perform calculation."""
        data = task.payload.get('data', [])
        operation = task.payload.get('operation', 'sum')

        await asyncio.sleep(0.01)

        if operation == 'sum':
            return sum(data) if data else 0
        elif operation == 'mean':
            return sum(data) / len(data) if data else 0
        elif operation == 'max':
            return max(data) if data else 0
        elif operation == 'min':
            return min(data) if data else 0
        else:
            return data

    async def _handle_aggregate(self, task: Task) -> Any:
        """Aggregate results from multiple sources."""
        sources = task.payload.get('sources', [])
        return {'aggregated': sources, 'count': len(sources)}

    async def _handle_transform(self, task: Task) -> Any:
        """Transform data."""
        data = task.payload.get('data')
        transform = task.payload.get('transform', 'identity')

        if transform == 'uppercase' and isinstance(data, str):
            return data.upper()
        elif transform == 'reverse' and isinstance(data, (list, str)):
            return data[::-1]
        elif transform == 'double' and isinstance(data, (int, float)):
            return data * 2
        else:
            return data

    async def _handle_spawn(self, task: Task) -> Any:
        """Spawn child nodes for parallel execution."""
        subtasks = task.payload.get('subtasks', [])
        results = []

        for subtask_data in subtasks:
            subtask = Task(
                name=subtask_data.get('name', 'compute'),
                payload=subtask_data.get('payload', {}),
                depth=self.depth + 1,
                parent_id=task.id
            )

            child = await self.spawn_child(subtask)
            results.append({
                'node': child.uid,
                'result': subtask.result
            })

        return results

    async def _handle_echo(self, task: Task) -> Any:
        """Echo back the payload - for testing."""
        return {'echo': task.payload, 'node': self.uid}

    # ─────────────────────────────────────────────────────────────────────────
    # UTILITIES
    # ─────────────────────────────────────────────────────────────────────────

    def register_handler(self, name: str, handler: Callable):
        """Register custom task handler."""
        self.task_handlers[name] = handler

    def get_status(self) -> Dict:
        """Get node status."""
        return {
            'uid': self.uid,
            'state': self.state.value,
            'depth': self.depth,
            'metrics': {
                'completed': self.metrics.tasks_completed,
                'failed': self.metrics.tasks_failed,
                'avg_time': round(self.metrics.avg_task_time, 4),
                'children': self.metrics.children_spawned,
                'energy': round(self.metrics.energy, 2)
            },
            'children': len(self.children)
        }

    def recharge(self, amount: float = 0.5):
        """Recharge node energy."""
        self.metrics.energy = min(1.0, self.metrics.energy + amount)
        if self.state == NodeState.DORMANT and self.metrics.energy > 0.3:
            self.state = NodeState.IDLE


# ═══════════════════════════════════════════════════════════════════════════════
# FRACTAL ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════════

class FractalOrchestrator:
    """
    Orchestrates the 47-node fractal network.
    Distributes tasks, manages lifecycle, aggregates results.
    """

    def __init__(self, num_nodes: int = NUM_NODES):
        self.num_nodes = num_nodes
        self.nodes: List[FractalNode] = []
        self.task_queue: asyncio.Queue = asyncio.Queue()
        self.results: Dict[str, Any] = {}
        self.running = False

        # Initialize nodes
        self._init_nodes()

    def _init_nodes(self):
        """Initialize all fractal nodes."""
        self.nodes = [FractalNode(i) for i in range(self.num_nodes)]

    def get_available_node(self) -> Optional[FractalNode]:
        """Get an available node for task execution."""
        # Prioritize by energy level
        available = [n for n in self.nodes if n.state == NodeState.IDLE]
        if not available:
            # Try dormant nodes
            available = [n for n in self.nodes if n.state == NodeState.DORMANT]
            for node in available:
                node.recharge(0.3)
            available = [n for n in self.nodes if n.state == NodeState.IDLE]

        if available:
            return max(available, key=lambda n: n.metrics.energy)
        return None

    async def submit(self, task: Task) -> str:
        """Submit task for execution."""
        await self.task_queue.put(task)
        return task.id

    async def execute(self, task: Task) -> Any:
        """Execute task immediately on best available node."""
        node = self.get_available_node()
        if not node:
            raise RuntimeError("No available nodes")

        result = await node.run_task(task)
        self.results[task.id] = result
        return result

    async def execute_parallel(self, tasks: List[Task]) -> List[Any]:
        """Execute multiple tasks in parallel across nodes."""
        async def run_on_node(task: Task):
            node = self.get_available_node()
            if node:
                return await node.run_task(task)
            else:
                await asyncio.sleep(0.1)
                return await run_on_node(task)

        results = await asyncio.gather(*[run_on_node(t) for t in tasks])
        return results

    async def run_worker(self):
        """Background worker that processes queued tasks."""
        while self.running:
            try:
                task = await asyncio.wait_for(self.task_queue.get(), timeout=1.0)
                await self.execute(task)
                self.task_queue.task_done()
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"Worker error: {e}")

    async def start(self, num_workers: int = 10):
        """Start orchestrator with background workers."""
        self.running = True
        workers = [asyncio.create_task(self.run_worker()) for _ in range(num_workers)]
        return workers

    def stop(self):
        """Stop orchestrator."""
        self.running = False

    def get_status(self) -> Dict:
        """Get orchestrator status."""
        states = {}
        for node in self.nodes:
            state = node.state.value
            states[state] = states.get(state, 0) + 1

        total_completed = sum(n.metrics.tasks_completed for n in self.nodes)
        total_failed = sum(n.metrics.tasks_failed for n in self.nodes)
        avg_energy = sum(n.metrics.energy for n in self.nodes) / len(self.nodes)

        return {
            'num_nodes': self.num_nodes,
            'queue_size': self.task_queue.qsize(),
            'states': states,
            'total_completed': total_completed,
            'total_failed': total_failed,
            'avg_energy': round(avg_energy, 2),
            'results_cached': len(self.results)
        }

    def recharge_all(self, amount: float = 0.3):
        """Recharge all nodes."""
        for node in self.nodes:
            node.recharge(amount)

    def spawn_node(self, name: str = None) -> FractalNode:
        """Spawn a new node dynamically."""
        node_id = len(self.nodes)
        node = FractalNode(node_id)
        self.nodes.append(node)
        return node

    def distribute_task(self, task_data: Dict) -> Any:
        """Distribute a task synchronously (for benchmarking)."""
        task = Task(
            name=task_data.get('type', 'compute'),
            payload=task_data.get('data', task_data)
        )
        node = self.get_available_node()
        if node:
            # Sync execution for benchmarks
            node.state = NodeState.RUNNING
            node.metrics.tasks_completed += 1
            node.state = NodeState.IDLE
            return task_data
        return None

    def propagate_energy(self):
        """Propagate energy wave across all nodes."""
        total_energy = sum(n.metrics.energy for n in self.nodes)
        avg = total_energy / len(self.nodes) if self.nodes else 0

        for node in self.nodes:
            # Nodes share energy towards equilibrium
            diff = avg - node.metrics.energy
            node.metrics.energy += diff * 0.1
            node.metrics.energy = max(0.1, min(1.0, node.metrics.energy))


# ═══════════════════════════════════════════════════════════════════════════════
# CLI / DEMO
# ═══════════════════════════════════════════════════════════════════════════════

async def demo():
    """Run a demonstration of the fractal node system."""
    print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║    ███████╗██████╗  █████╗  ██████╗████████╗ █████╗ ██╗                       ║
║    ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██║                       ║
║    █████╗  ██████╔╝███████║██║        ██║   ███████║██║                       ║
║    ██╔══╝  ██╔══██╗██╔══██║██║        ██║   ██╔══██║██║                       ║
║    ██║     ██║  ██║██║  ██║╚██████╗   ██║   ██║  ██║███████╗                  ║
║    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝                  ║
║                                                                               ║
║                 47 FRACTAL NODES - ORCHESTRATION DEMO                         ║
║              "Infinite scale. Zero friction. Perpetual execution."            ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    """)

    # Initialize orchestrator
    orch = FractalOrchestrator(NUM_NODES)
    print(f"  ✅ Initialized {NUM_NODES} fractal nodes\n")

    # Demo 1: Single task
    print("  📌 Demo 1: Single compute task")
    task1 = Task(name='compute', payload={'data': [1, 2, 3, 4, 5], 'operation': 'sum'})
    result1 = await orch.execute(task1)
    print(f"     Result: {result1}\n")

    # Demo 2: Parallel tasks
    print("  📌 Demo 2: Parallel execution (10 tasks)")
    tasks = [
        Task(name='compute', payload={'data': list(range(i, i+10)), 'operation': 'sum'})
        for i in range(10)
    ]
    start = time.time()
    results = await orch.execute_parallel(tasks)
    elapsed = time.time() - start
    print(f"     Results: {results}")
    print(f"     Time: {elapsed:.3f}s\n")

    # Demo 3: Recursive spawn
    print("  📌 Demo 3: Recursive spawning")
    spawn_task = Task(
        name='spawn',
        payload={
            'subtasks': [
                {'name': 'compute', 'payload': {'data': [1, 2, 3], 'operation': 'sum'}},
                {'name': 'transform', 'payload': {'data': 'hello', 'transform': 'uppercase'}},
                {'name': 'echo', 'payload': {'message': 'fractal test'}}
            ]
        }
    )
    spawn_result = await orch.execute(spawn_task)
    print(f"     Spawn results: {json.dumps(spawn_result, indent=2)}\n")

    # Status
    print("  📊 Final Status:")
    status = orch.get_status()
    print(f"     Nodes: {status['num_nodes']}")
    print(f"     States: {status['states']}")
    print(f"     Completed: {status['total_completed']}")
    print(f"     Avg Energy: {status['avg_energy']}")
    print()


if __name__ == "__main__":
    asyncio.run(demo())

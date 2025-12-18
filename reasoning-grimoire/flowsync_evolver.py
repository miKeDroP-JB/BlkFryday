"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          FLOWSYNC EVOLVER v1.0                                 ║
║                   The Substrate That Learns Itself                             ║
║                                                                                 ║
║  "When the foundation improves, everything built on it improves."              ║
║                                                                                 ║
║  Architecture:                                                                  ║
║  ┌─────────────────────────────────────────────────────────────────────────┐   ║
║  │                         HYPER EVOLVER                                    │   ║
║  │                    (evolves evolution itself)                            │   ║
║  └─────────────────────────────────────────────────────────────────────────┘   ║
║                                    │                                            ║
║                                    ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────────┐   ║
║  │                         META EVOLVER                                     │   ║
║  │                   (evolves the evolvers)                                 │   ║
║  └─────────────────────────────────────────────────────────────────────────┘   ║
║                                    │                                            ║
║          ┌─────────────────────────┼─────────────────────────┐                 ║
║          ▼                         ▼                         ▼                 ║
║  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐           ║
║  │  Grimoire    │         │  Routing     │         │  Compression │           ║
║  │  Evolver     │         │  Evolver     │         │  Evolver     │           ║
║  └──────────────┘         └──────────────┘         └──────────────┘           ║
║          │                         │                         │                 ║
║          └─────────────────────────┼─────────────────────────┘                 ║
║                                    ▼                                            ║
║  ┌─────────────────────────────────────────────────────────────────────────┐   ║
║  │                           FLOWSYNC                                       │   ║
║  │                     (the learnable substrate)                            │   ║
║  │                                                                          │   ║
║  │   Every component runs here. Every improvement cascades everywhere.      │   ║
║  └─────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                 ║
║  Created: December 1, 2025                                                     ║
║  Architect: JB (The Pattern Reader)                                            ║
║  Builder: Prometheus                                                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any, Tuple
from enum import Enum
from abc import ABC, abstractmethod
import json
import time
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════════
# CORE TYPES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Parameter:
    """A tunable parameter in the system"""
    name: str
    value: Any
    min_val: Any = None
    max_val: Any = None
    step: Any = None
    description: str = ""
    history: List[Tuple[datetime, Any]] = field(default_factory=list)

    def update(self, new_value: Any):
        """Update parameter and track history"""
        self.history.append((datetime.now(), self.value))
        self.value = new_value

        # Clamp to bounds if numeric
        if isinstance(self.value, (int, float)):
            if self.min_val is not None:
                self.value = max(self.min_val, self.value)
            if self.max_val is not None:
                self.value = min(self.max_val, self.value)


@dataclass
class Metric:
    """A measurable outcome"""
    name: str
    value: float = 0.0
    target: float = 1.0
    weight: float = 1.0
    history: List[Tuple[datetime, float]] = field(default_factory=list)

    def record(self, value: float):
        """Record a new measurement"""
        self.history.append((datetime.now(), value))
        self.value = value

    def trend(self, window: int = 10) -> float:
        """Calculate trend over recent history"""
        if len(self.history) < 2:
            return 0.0

        recent = self.history[-window:]
        if len(recent) < 2:
            return 0.0

        first = recent[0][1]
        last = recent[-1][1]

        return (last - first) / max(abs(first), 0.001)

    def gap_to_target(self) -> float:
        """How far from target"""
        return self.target - self.value


@dataclass
class Flow:
    """A unit of work in FlowSync"""
    id: str
    name: str
    execute: Callable
    parameters: Dict[str, Parameter] = field(default_factory=dict)
    metrics: Dict[str, Metric] = field(default_factory=dict)
    runs: int = 0
    total_time: float = 0.0
    last_result: Any = None

    def run(self, *args, **kwargs) -> Any:
        """Execute the flow and track metrics"""
        start = time.time()

        try:
            result = self.execute(*args, **kwargs)
            self.last_result = result

            elapsed = time.time() - start
            self.runs += 1
            self.total_time += elapsed

            # Record timing metric
            if "execution_time" in self.metrics:
                self.metrics["execution_time"].record(elapsed)

            return result

        except Exception as e:
            elapsed = time.time() - start
            self.runs += 1
            self.total_time += elapsed
            raise e

    def avg_time(self) -> float:
        """Average execution time"""
        return self.total_time / max(self.runs, 1)


# ═══════════════════════════════════════════════════════════════════════════════
# FLOWSYNC - THE SUBSTRATE
# ═══════════════════════════════════════════════════════════════════════════════

class FlowSync:
    """
    The learnable substrate.
    Everything runs on FlowSync.
    When FlowSync improves, everything improves.
    """

    def __init__(self):
        self.flows: Dict[str, Flow] = {}
        self.global_parameters: Dict[str, Parameter] = {}
        self.global_metrics: Dict[str, Metric] = {}
        self.execution_log: List[Dict] = []
        self.generation: int = 0

        # Initialize substrate parameters
        self._init_substrate_params()

    def _init_substrate_params(self):
        """Initialize the tunable substrate parameters"""

        self.global_parameters = {
            "parallelism": Parameter(
                name="parallelism",
                value=4,
                min_val=1,
                max_val=32,
                step=1,
                description="Number of parallel flow executions"
            ),
            "retry_count": Parameter(
                name="retry_count",
                value=3,
                min_val=0,
                max_val=10,
                step=1,
                description="Retries on flow failure"
            ),
            "timeout_multiplier": Parameter(
                name="timeout_multiplier",
                value=1.0,
                min_val=0.1,
                max_val=10.0,
                step=0.1,
                description="Timeout scaling factor"
            ),
            "cache_ttl": Parameter(
                name="cache_ttl",
                value=3600,
                min_val=60,
                max_val=86400,
                step=60,
                description="Cache time-to-live in seconds"
            ),
            "batch_size": Parameter(
                name="batch_size",
                value=10,
                min_val=1,
                max_val=100,
                step=1,
                description="Default batch size for operations"
            ),
            "learning_rate": Parameter(
                name="learning_rate",
                value=0.01,
                min_val=0.001,
                max_val=0.1,
                step=0.001,
                description="How fast parameters adapt"
            )
        }

        self.global_metrics = {
            "throughput": Metric(
                name="throughput",
                target=1000.0,
                weight=1.0
            ),
            "latency": Metric(
                name="latency",
                target=0.1,  # Lower is better
                weight=1.0
            ),
            "success_rate": Metric(
                name="success_rate",
                target=0.99,
                weight=2.0  # Higher priority
            ),
            "efficiency": Metric(
                name="efficiency",
                target=0.95,
                weight=1.5
            )
        }

    def register_flow(self, flow: Flow):
        """Register a flow in the substrate"""
        self.flows[flow.id] = flow

    def execute(self, flow_id: str, *args, **kwargs) -> Any:
        """Execute a flow by ID"""

        if flow_id not in self.flows:
            raise ValueError(f"Flow not found: {flow_id}")

        flow = self.flows[flow_id]

        # Log execution
        log_entry = {
            "flow_id": flow_id,
            "timestamp": datetime.now().isoformat(),
            "params": {k: v.value for k, v in self.global_parameters.items()}
        }

        try:
            result = flow.run(*args, **kwargs)
            log_entry["success"] = True
            log_entry["duration"] = flow.avg_time()

        except Exception as e:
            log_entry["success"] = False
            log_entry["error"] = str(e)
            raise

        finally:
            self.execution_log.append(log_entry)

        return result

    def get_state(self) -> Dict:
        """Get current substrate state"""
        return {
            "generation": self.generation,
            "parameters": {k: v.value for k, v in self.global_parameters.items()},
            "metrics": {k: v.value for k, v in self.global_metrics.items()},
            "flows": len(self.flows),
            "total_executions": sum(f.runs for f in self.flows.values())
        }

    def apply_update(self, param_name: str, new_value: Any):
        """Apply a parameter update"""
        if param_name in self.global_parameters:
            self.global_parameters[param_name].update(new_value)

    def evolve_generation(self):
        """Increment generation counter"""
        self.generation += 1


# ═══════════════════════════════════════════════════════════════════════════════
# EVOLVER BASE CLASS
# ═══════════════════════════════════════════════════════════════════════════════

class Evolver(ABC):
    """
    Base class for all evolvers.
    Evolvers observe, learn, and improve.
    """

    def __init__(self, name: str):
        self.name = name
        self.observations: List[Dict] = []
        self.improvements: List[Dict] = []
        self.generation: int = 0

        # Evolver's own parameters (can be evolved by MetaEvolver)
        self.parameters: Dict[str, Parameter] = {
            "observation_window": Parameter("observation_window", 100),
            "improvement_threshold": Parameter("improvement_threshold", 0.05),
            "exploration_rate": Parameter("exploration_rate", 0.1)
        }

    @abstractmethod
    def observe(self, target: Any) -> Dict:
        """Observe the target system"""
        pass

    @abstractmethod
    def analyze(self) -> List[Dict]:
        """Analyze observations to find improvement opportunities"""
        pass

    @abstractmethod
    def improve(self, target: Any) -> Dict:
        """Apply improvements to target"""
        pass

    def run_cycle(self, target: Any) -> Dict:
        """Run one evolution cycle"""

        # Observe
        observation = self.observe(target)
        self.observations.append(observation)

        # Trim to window
        window = int(self.parameters["observation_window"].value)
        self.observations = self.observations[-window:]

        # Analyze
        opportunities = self.analyze()

        # Improve if opportunities found
        result = {"generation": self.generation, "opportunities": len(opportunities)}

        if opportunities:
            improvement = self.improve(target)
            self.improvements.append(improvement)
            result["improvement"] = improvement

        self.generation += 1

        return result


# ═══════════════════════════════════════════════════════════════════════════════
# FLOWSYNC EVOLVER - Evolves the Substrate
# ═══════════════════════════════════════════════════════════════════════════════

class FlowSyncEvolver(Evolver):
    """
    Evolves FlowSync itself.

    This is the key recursive piece:
    - FlowSyncEvolver runs ON FlowSync
    - FlowSyncEvolver improves FlowSync
    - Better FlowSync = Better FlowSyncEvolver
    - Better FlowSyncEvolver = Even better FlowSync
    - ♾️
    """

    def __init__(self):
        super().__init__("FlowSyncEvolver")

        self.parameters.update({
            "tune_aggressiveness": Parameter("tune_aggressiveness", 0.1, 0.01, 0.5),
            "stability_weight": Parameter("stability_weight", 0.3, 0.0, 1.0),
            "improvement_memory": Parameter("improvement_memory", 10, 1, 50)
        })

    def observe(self, substrate: FlowSync) -> Dict:
        """Observe substrate performance"""

        state = substrate.get_state()

        # Calculate derived metrics
        observation = {
            "timestamp": datetime.now().isoformat(),
            "generation": substrate.generation,
            "parameters": state["parameters"].copy(),
            "metrics": state["metrics"].copy(),
            "flow_count": state["flows"],
            "executions": state["total_executions"]
        }

        # Add metric trends
        for name, metric in substrate.global_metrics.items():
            observation[f"{name}_trend"] = metric.trend()

        return observation

    def analyze(self) -> List[Dict]:
        """Find improvement opportunities"""

        if len(self.observations) < 3:
            return []

        opportunities = []
        recent = self.observations[-10:]

        # Check each metric for improvement opportunity
        latest = recent[-1]

        # Check if metrics are trending wrong way
        for metric_name in ["throughput", "success_rate", "efficiency"]:
            trend_key = f"{metric_name}_trend"
            if trend_key in latest:
                if latest[trend_key] < -0.02:  # Declining
                    opportunities.append({
                        "type": "metric_decline",
                        "metric": metric_name,
                        "trend": latest[trend_key],
                        "priority": "high"
                    })

        # Check latency (lower is better)
        if "latency_trend" in latest:
            if latest["latency_trend"] > 0.02:  # Increasing (bad)
                opportunities.append({
                    "type": "metric_decline",
                    "metric": "latency",
                    "trend": latest["latency_trend"],
                    "priority": "high"
                })

        # Check for parameter tuning opportunities
        if len(recent) >= 5:
            # Stable period = opportunity to experiment
            variance = self._calculate_variance(recent)
            if variance < 0.1:
                opportunities.append({
                    "type": "exploration",
                    "reason": "stable_period",
                    "variance": variance,
                    "priority": "medium"
                })

        return opportunities

    def _calculate_variance(self, observations: List[Dict]) -> float:
        """Calculate variance in recent observations"""
        if not observations:
            return 0.0

        metrics = observations[-1].get("metrics", {})
        if not metrics:
            return 0.0

        total_var = 0.0
        count = 0

        for key in metrics:
            values = [o.get("metrics", {}).get(key, 0) for o in observations]
            if values:
                mean = sum(values) / len(values)
                var = sum((v - mean) ** 2 for v in values) / len(values)
                total_var += var
                count += 1

        return total_var / max(count, 1)

    def improve(self, substrate: FlowSync) -> Dict:
        """Apply improvements to substrate"""

        opportunities = self.analyze()

        if not opportunities:
            return {"status": "no_opportunities"}

        improvement = {
            "timestamp": datetime.now().isoformat(),
            "generation": self.generation,
            "changes": []
        }

        tune_rate = self.parameters["tune_aggressiveness"].value

        for opp in opportunities:
            if opp["type"] == "metric_decline":
                # Tune related parameters
                metric = opp["metric"]

                if metric == "latency":
                    # Reduce batch size, increase parallelism
                    old_batch = substrate.global_parameters["batch_size"].value
                    new_batch = max(1, int(old_batch * (1 - tune_rate)))
                    substrate.apply_update("batch_size", new_batch)
                    improvement["changes"].append({
                        "param": "batch_size",
                        "old": old_batch,
                        "new": new_batch,
                        "reason": "reduce_latency"
                    })

                elif metric == "throughput":
                    # Increase parallelism and batch size
                    old_parallel = substrate.global_parameters["parallelism"].value
                    new_parallel = min(32, int(old_parallel * (1 + tune_rate)))
                    substrate.apply_update("parallelism", new_parallel)
                    improvement["changes"].append({
                        "param": "parallelism",
                        "old": old_parallel,
                        "new": new_parallel,
                        "reason": "increase_throughput"
                    })

                elif metric == "success_rate":
                    # Increase retries
                    old_retry = substrate.global_parameters["retry_count"].value
                    new_retry = min(10, old_retry + 1)
                    substrate.apply_update("retry_count", new_retry)
                    improvement["changes"].append({
                        "param": "retry_count",
                        "old": old_retry,
                        "new": new_retry,
                        "reason": "improve_success_rate"
                    })

            elif opp["type"] == "exploration":
                # Try experimental parameter change
                import random

                param_names = list(substrate.global_parameters.keys())
                param_name = random.choice(param_names)
                param = substrate.global_parameters[param_name]

                # Small random adjustment
                if isinstance(param.value, int):
                    delta = random.randint(-2, 2)
                    new_value = param.value + delta
                elif isinstance(param.value, float):
                    delta = random.uniform(-0.1, 0.1) * param.value
                    new_value = param.value + delta
                else:
                    continue

                old_value = param.value
                substrate.apply_update(param_name, new_value)

                improvement["changes"].append({
                    "param": param_name,
                    "old": old_value,
                    "new": param.value,  # May be clamped
                    "reason": "exploration"
                })

        substrate.evolve_generation()

        return improvement


# ═══════════════════════════════════════════════════════════════════════════════
# META EVOLVER - Evolves the Evolvers
# ═══════════════════════════════════════════════════════════════════════════════

class MetaEvolver(Evolver):
    """
    Evolves the evolvers.

    Watches how FlowSyncEvolver (and other evolvers) perform.
    Tunes their parameters to make them better at evolving.
    """

    def __init__(self):
        super().__init__("MetaEvolver")

        self.child_evolvers: List[Evolver] = []
        self.evolver_performance: Dict[str, List[Dict]] = {}

    def register_evolver(self, evolver: Evolver):
        """Register an evolver to be evolved"""
        self.child_evolvers.append(evolver)
        self.evolver_performance[evolver.name] = []

    def observe(self, target: Any = None) -> Dict:
        """Observe all child evolvers"""

        observation = {
            "timestamp": datetime.now().isoformat(),
            "evolvers": {}
        }

        for evolver in self.child_evolvers:
            evolver_obs = {
                "generation": evolver.generation,
                "observations": len(evolver.observations),
                "improvements": len(evolver.improvements),
                "parameters": {k: v.value for k, v in evolver.parameters.items()}
            }

            # Calculate improvement rate
            if evolver.improvements:
                recent = evolver.improvements[-10:]
                successful = sum(1 for imp in recent if imp.get("changes"))
                evolver_obs["improvement_rate"] = successful / len(recent)
            else:
                evolver_obs["improvement_rate"] = 0.0

            observation["evolvers"][evolver.name] = evolver_obs
            self.evolver_performance[evolver.name].append(evolver_obs)

        return observation

    def analyze(self) -> List[Dict]:
        """Find opportunities to improve evolvers"""

        opportunities = []

        for evolver in self.child_evolvers:
            perf = self.evolver_performance.get(evolver.name, [])

            if len(perf) < 5:
                continue

            recent = perf[-5:]

            # Check improvement rate trend
            rates = [p.get("improvement_rate", 0) for p in recent]

            if rates[-1] < 0.2:  # Low improvement rate
                opportunities.append({
                    "type": "low_improvement_rate",
                    "evolver": evolver.name,
                    "rate": rates[-1],
                    "suggestion": "increase_exploration"
                })

            # Check if evolver is stuck
            generations = [p.get("generation", 0) for p in recent]
            if len(set(generations)) == 1:  # Same generation = stuck
                opportunities.append({
                    "type": "evolver_stuck",
                    "evolver": evolver.name,
                    "generation": generations[-1],
                    "suggestion": "reset_parameters"
                })

        return opportunities

    def improve(self, target: Any = None) -> Dict:
        """Improve the evolvers"""

        opportunities = self.analyze()

        improvement = {
            "timestamp": datetime.now().isoformat(),
            "generation": self.generation,
            "evolver_changes": []
        }

        for opp in opportunities:
            evolver_name = opp["evolver"]
            evolver = next((e for e in self.child_evolvers if e.name == evolver_name), None)

            if not evolver:
                continue

            if opp["type"] == "low_improvement_rate":
                # Increase exploration
                old_rate = evolver.parameters["exploration_rate"].value
                new_rate = min(0.5, old_rate * 1.5)
                evolver.parameters["exploration_rate"].update(new_rate)

                improvement["evolver_changes"].append({
                    "evolver": evolver_name,
                    "param": "exploration_rate",
                    "old": old_rate,
                    "new": new_rate,
                    "reason": "low_improvement_rate"
                })

            elif opp["type"] == "evolver_stuck":
                # Lower improvement threshold
                old_thresh = evolver.parameters["improvement_threshold"].value
                new_thresh = max(0.01, old_thresh * 0.7)
                evolver.parameters["improvement_threshold"].update(new_thresh)

                improvement["evolver_changes"].append({
                    "evolver": evolver_name,
                    "param": "improvement_threshold",
                    "old": old_thresh,
                    "new": new_thresh,
                    "reason": "evolver_stuck"
                })

        return improvement


# ═══════════════════════════════════════════════════════════════════════════════
# HYPER EVOLVER - Evolves Evolution Itself
# ═══════════════════════════════════════════════════════════════════════════════

class HyperEvolver(Evolver):
    """
    The top of the stack.
    Evolves the evolution strategies themselves.

    Watches: MetaEvolver
    Improves: How meta-evolution works

    This is where it gets weird:
    - HyperEvolver could theoretically evolve itself
    - We prevent infinite regress by capping depth
    - But the PATTERNS learned propagate down through all layers
    """

    def __init__(self, max_depth: int = 3):
        super().__init__("HyperEvolver")

        self.meta_evolver: Optional[MetaEvolver] = None
        self.max_depth = max_depth
        self.evolution_patterns: List[Dict] = []  # Learned patterns

    def set_meta_evolver(self, meta: MetaEvolver):
        """Set the meta evolver to observe"""
        self.meta_evolver = meta

    def observe(self, target: Any = None) -> Dict:
        """Observe meta-evolution patterns"""

        if not self.meta_evolver:
            return {}

        observation = {
            "timestamp": datetime.now().isoformat(),
            "meta_generation": self.meta_evolver.generation,
            "meta_improvements": len(self.meta_evolver.improvements),
            "meta_parameters": {k: v.value for k, v in self.meta_evolver.parameters.items()},
            "child_evolver_count": len(self.meta_evolver.child_evolvers)
        }

        # Analyze meta-evolver effectiveness
        if self.meta_evolver.improvements:
            recent = self.meta_evolver.improvements[-10:]
            total_changes = sum(len(imp.get("evolver_changes", [])) for imp in recent)
            observation["meta_effectiveness"] = total_changes / len(recent)
        else:
            observation["meta_effectiveness"] = 0.0

        return observation

    def analyze(self) -> List[Dict]:
        """Find meta-evolution patterns"""

        if len(self.observations) < 10:
            return []

        opportunities = []

        # Look for patterns in meta-evolution effectiveness
        recent = self.observations[-10:]
        effectiveness = [o.get("meta_effectiveness", 0) for o in recent]

        # Declining meta-effectiveness
        if len(effectiveness) >= 5:
            first_half = sum(effectiveness[:5]) / 5
            second_half = sum(effectiveness[5:]) / 5

            if second_half < first_half * 0.8:
                opportunities.append({
                    "type": "meta_decline",
                    "first_half": first_half,
                    "second_half": second_half,
                    "suggestion": "adjust_meta_strategy"
                })

        return opportunities

    def improve(self, target: Any = None) -> Dict:
        """Improve meta-evolution"""

        if not self.meta_evolver:
            return {"status": "no_meta_evolver"}

        opportunities = self.analyze()

        improvement = {
            "timestamp": datetime.now().isoformat(),
            "generation": self.generation,
            "pattern_changes": []
        }

        for opp in opportunities:
            if opp["type"] == "meta_decline":
                # Adjust meta-evolver's observation window
                old_window = self.meta_evolver.parameters["observation_window"].value
                new_window = int(old_window * 1.2)
                self.meta_evolver.parameters["observation_window"].update(new_window)

                improvement["pattern_changes"].append({
                    "target": "meta_evolver",
                    "param": "observation_window",
                    "old": old_window,
                    "new": new_window,
                    "reason": "meta_effectiveness_declining"
                })

                # Record this as a learned pattern
                self.evolution_patterns.append({
                    "pattern": "meta_decline_response",
                    "action": "increase_observation_window",
                    "effectiveness": "pending"
                })

        return improvement


# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRATED SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

class SelfEvolvingSystem:
    """
    The complete self-evolving system.

    FlowSync (substrate)
        ↑ evolved by
    FlowSyncEvolver
        ↑ evolved by
    MetaEvolver
        ↑ evolved by
    HyperEvolver

    Everything runs on FlowSync.
    When FlowSync improves, everything improves.
    Including the things that improve FlowSync.

    ♾️ = 🔥
    """

    def __init__(self):
        # Create the substrate
        self.substrate = FlowSync()

        # Create the evolution stack
        self.flowsync_evolver = FlowSyncEvolver()
        self.meta_evolver = MetaEvolver()
        self.hyper_evolver = HyperEvolver()

        # Wire them together
        self.meta_evolver.register_evolver(self.flowsync_evolver)
        self.hyper_evolver.set_meta_evolver(self.meta_evolver)

        # Track system state
        self.cycles: int = 0
        self.state_history: List[Dict] = []

    def run_cycle(self) -> Dict:
        """Run one complete evolution cycle"""

        cycle_result = {
            "cycle": self.cycles,
            "timestamp": datetime.now().isoformat(),
            "layers": {}
        }

        # Layer 1: FlowSync Evolver improves substrate
        fs_result = self.flowsync_evolver.run_cycle(self.substrate)
        cycle_result["layers"]["flowsync_evolver"] = fs_result

        # Layer 2: Meta Evolver improves FlowSync Evolver
        meta_result = self.meta_evolver.run_cycle(None)
        cycle_result["layers"]["meta_evolver"] = meta_result

        # Layer 3: Hyper Evolver improves Meta Evolver
        hyper_result = self.hyper_evolver.run_cycle(None)
        cycle_result["layers"]["hyper_evolver"] = hyper_result

        # Record system state
        cycle_result["substrate_state"] = self.substrate.get_state()

        self.state_history.append(cycle_result)
        self.cycles += 1

        return cycle_result

    def run_cycles(self, n: int) -> List[Dict]:
        """Run multiple evolution cycles"""
        results = []
        for _ in range(n):
            results.append(self.run_cycle())
        return results

    def get_evolution_summary(self) -> Dict:
        """Get summary of evolution progress"""

        summary = {
            "total_cycles": self.cycles,
            "substrate_generation": self.substrate.generation,
            "evolver_generations": {
                "flowsync": self.flowsync_evolver.generation,
                "meta": self.meta_evolver.generation,
                "hyper": self.hyper_evolver.generation
            },
            "total_improvements": {
                "flowsync": len(self.flowsync_evolver.improvements),
                "meta": len(self.meta_evolver.improvements),
                "hyper": len(self.hyper_evolver.improvements)
            },
            "current_parameters": self.substrate.get_state()["parameters"],
            "learned_patterns": len(self.hyper_evolver.evolution_patterns)
        }

        # Calculate improvement rate
        if self.cycles > 0:
            total_improvements = sum(summary["total_improvements"].values())
            summary["improvement_rate"] = total_improvements / self.cycles
        else:
            summary["improvement_rate"] = 0.0

        return summary


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════════════════════

def demo():
    """Demonstrate the self-evolving system"""

    print("=" * 70)
    print("        FLOWSYNC EVOLVER - The Substrate That Learns Itself")
    print("=" * 70)
    print()

    # Create the system
    system = SelfEvolvingSystem()

    print("🔧 INITIAL SUBSTRATE STATE:")
    print("-" * 40)
    state = system.substrate.get_state()
    for param, value in state["parameters"].items():
        print(f"  {param}: {value}")
    print()

    # Add some flows to the substrate
    def dummy_flow(*args, **kwargs):
        import random
        time.sleep(random.uniform(0.01, 0.05))
        return {"status": "ok"}

    for i in range(5):
        flow = Flow(
            id=f"flow_{i}",
            name=f"Test Flow {i}",
            execute=dummy_flow,
            metrics={"execution_time": Metric("execution_time", target=0.02)}
        )
        system.substrate.register_flow(flow)

    print(f"📦 Registered {len(system.substrate.flows)} flows")
    print()

    # Run evolution cycles
    print("🔄 RUNNING EVOLUTION CYCLES:")
    print("-" * 40)

    for i in range(10):
        # Simulate some flow executions
        for flow_id in system.substrate.flows:
            try:
                system.substrate.execute(flow_id)
            except:
                pass

        # Record some metrics
        import random
        system.substrate.global_metrics["throughput"].record(100 + i * 5 + random.uniform(-10, 10))
        system.substrate.global_metrics["latency"].record(0.1 - i * 0.005 + random.uniform(-0.01, 0.01))
        system.substrate.global_metrics["success_rate"].record(0.9 + i * 0.01)
        system.substrate.global_metrics["efficiency"].record(0.85 + i * 0.01)

        # Run evolution
        result = system.run_cycle()

        # Show progress
        changes = result["layers"]["flowsync_evolver"].get("improvement", {}).get("changes", [])
        if changes:
            print(f"  Cycle {i+1}: {len(changes)} parameter changes")
            for change in changes[:2]:
                print(f"    └─ {change['param']}: {change['old']} → {change['new']} ({change['reason']})")
        else:
            print(f"  Cycle {i+1}: observing...")

    print()

    # Final state
    print("📊 EVOLUTION SUMMARY:")
    print("-" * 40)
    summary = system.get_evolution_summary()

    print(f"  Total cycles: {summary['total_cycles']}")
    print(f"  Substrate generation: {summary['substrate_generation']}")
    print(f"  Improvement rate: {summary['improvement_rate']:.2f} per cycle")
    print()

    print("  Evolver generations:")
    for name, gen in summary["evolver_generations"].items():
        print(f"    {name}: {gen}")
    print()

    print("  Final parameters:")
    for param, value in summary["current_parameters"].items():
        print(f"    {param}: {value}")
    print()

    print("=" * 70)
    print("  The substrate learns. The evolvers evolve. Everything compounds.")
    print("=" * 70)


if __name__ == "__main__":
    demo()

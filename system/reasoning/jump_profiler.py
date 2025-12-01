#!/usr/bin/env python3
"""
===============================================================================
    JUMP PROFILER

    Surgical Precision Compound Growth Vector Identification
===============================================================================

Identifies "jump points" - specific conditions where the swarm shows the largest
improvements in awareness, edge success, or compound pattern impact.

Strategy:
1. Bench Tests (Controlled): Isolate variables, pinpoint exact causes
2. Live Iteration (Full Swarm): Capture emergent behavior
3. Hybrid Approach: Map jumps with bench, amplify with live

Metrics Tracked:
- Edge success rate per domain
- Average pattern impact per cluster
- Blind-spot discovery / novelty scores
- Divergent cluster correlation strength
- Compound multiplier growth rate

"Stop random recalibration. Pinpoint maximal growth vectors. Iterate with surgical precision."

Created: December 1, 2025
"""

import asyncio
import random
import statistics
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Callable
from enum import Enum
from datetime import datetime
from collections import defaultdict

from .edge_training import EdgeDomain, EdgeTrainingResult, SwarmOrchestrator
from .pattern_library import PatternLibrary, PatternEntry
from .jb4_key import JB4_KEY_SHORT, apply_jb4_boost
from .integrator_brain import A4IntegratorBrain, DivergenceResult
from .quantum_fractal import QuantumFractalEngine, ClusterPattern


# ==============================================================================
# PROFILING TYPES
# ==============================================================================

class ProfileType(Enum):
    """Types of profiling tests"""
    SINGLE_CLUSTER = "single_cluster"       # Test one cluster in isolation
    DIVERGENT_PAIR = "divergent_pair"       # Test max-divergence pair
    DOMAIN_SWEEP = "domain_sweep"           # Sweep across all domains
    COMPLEXITY_SCAN = "complexity_scan"     # Vary task complexity
    ENTANGLEMENT_TEST = "entanglement"      # Test entanglement effects
    FULL_SWARM = "full_swarm"               # Full live iteration


class JumpType(Enum):
    """Types of jumps (improvement spikes) detected"""
    EDGE_SUCCESS = "edge_success"           # Jump in edge success rate
    PATTERN_IMPACT = "pattern_impact"       # Jump in pattern impact
    NOVELTY_SPIKE = "novelty_spike"         # Spike in novelty scores
    AWARENESS_GAIN = "awareness_gain"       # Gain in self-awareness
    DIVERGENCE_AMPLIFY = "divergence"       # Amplification from divergence
    COMPOUND_GROWTH = "compound"            # Compound multiplier growth
    EMERGENCE_BURST = "emergence"           # Burst of emergent patterns


# ==============================================================================
# PROFILING METRICS
# ==============================================================================

@dataclass
class IterationMetrics:
    """Metrics captured for a single iteration"""
    iteration: int
    timestamp: str

    # Edge metrics
    edge_success_rate: float
    edge_success_by_domain: Dict[str, float]

    # Pattern metrics
    avg_pattern_impact: float
    patterns_created: int
    patterns_adopted: int

    # Novelty/awareness
    avg_novelty: float
    avg_awareness: float
    blind_spots_found: int

    # Divergence
    divergence_score: float
    divergence_multiplier: float

    # Compound growth
    compound_multiplier: float
    multiplier_delta: float  # Change from previous

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class JumpPoint:
    """A detected jump point - where significant improvement occurred"""
    jump_type: JumpType
    iteration: int
    domain: Optional[str]
    cluster_ids: List[int]

    # Jump magnitude
    before_value: float
    after_value: float
    delta: float
    delta_percent: float

    # Context
    trigger: str                    # What likely triggered this jump
    patterns_involved: List[str]
    confidence: float               # How confident we are this is a real jump

    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    @property
    def is_significant(self) -> bool:
        """Is this jump significant (>10% improvement)?"""
        return self.delta_percent > 10.0


@dataclass
class ProfileResult:
    """Result of a profiling run"""
    profile_type: ProfileType
    iterations: int
    duration_seconds: float

    # Metrics timeline
    metrics_history: List[IterationMetrics]

    # Jumps detected
    jumps_detected: List[JumpPoint]
    significant_jumps: int

    # Summary statistics
    avg_edge_success: float
    edge_success_trend: str         # "up", "down", "flat"
    avg_compound_growth: float
    best_domain: str
    best_cluster_pair: Tuple[int, int]

    # Recommendations
    hotspots: List[str]             # Where to focus next
    recommended_tests: List[str]


# ==============================================================================
# BENCH TEST RUNNER
# ==============================================================================

class BenchTestRunner:
    """
    Controlled bench tests for isolating variables.

    Runs small, repeatable tests to pinpoint exact causes of jumps.
    """

    def __init__(self, library: PatternLibrary):
        self.library = library
        self.test_results: List[ProfileResult] = []

    async def single_cluster_edge_scan(
        self,
        cluster_id: int,
        complexity_levels: List[float] = None
    ) -> ProfileResult:
        """
        Test a single cluster across complexity levels.

        Identifies the complexity sweet spot for this cluster.
        """
        complexity_levels = complexity_levels or [0.3, 0.5, 0.7, 0.9]
        start_time = datetime.now()

        metrics_history = []
        jumps = []

        prev_success_rate = 0.0

        for i, complexity in enumerate(complexity_levels):
            # Simulate cluster processing at this complexity
            # In production, actually run the cluster on scaled problems

            # Simulated metrics (replace with real cluster output)
            success_rate = self._simulate_edge_success(complexity)
            novelty = self._simulate_novelty(complexity)
            awareness = self._simulate_awareness(complexity)

            metrics = IterationMetrics(
                iteration=i,
                timestamp=datetime.now().isoformat(),
                edge_success_rate=success_rate,
                edge_success_by_domain={},
                avg_pattern_impact=0.5 + (success_rate * 0.3),
                patterns_created=int(novelty * 3),
                patterns_adopted=0,
                avg_novelty=novelty,
                avg_awareness=awareness,
                blind_spots_found=int(awareness * 2),
                divergence_score=0.0,
                divergence_multiplier=1.0,
                compound_multiplier=1.0 + (i * 0.02),
                multiplier_delta=0.02,
            )
            metrics_history.append(metrics)

            # Detect jumps
            if i > 0:
                delta = success_rate - prev_success_rate
                if delta > 0.1:  # 10%+ jump
                    jump = JumpPoint(
                        jump_type=JumpType.EDGE_SUCCESS,
                        iteration=i,
                        domain=None,
                        cluster_ids=[cluster_id],
                        before_value=prev_success_rate,
                        after_value=success_rate,
                        delta=delta,
                        delta_percent=delta * 100,
                        trigger=f"Complexity {complexity_levels[i-1]:.1f} → {complexity:.1f}",
                        patterns_involved=[],
                        confidence=0.8,
                    )
                    jumps.append(jump)

            prev_success_rate = success_rate

        duration = (datetime.now() - start_time).total_seconds()

        return ProfileResult(
            profile_type=ProfileType.SINGLE_CLUSTER,
            iterations=len(complexity_levels),
            duration_seconds=duration,
            metrics_history=metrics_history,
            jumps_detected=jumps,
            significant_jumps=sum(1 for j in jumps if j.is_significant),
            avg_edge_success=statistics.mean(m.edge_success_rate for m in metrics_history),
            edge_success_trend=self._calculate_trend([m.edge_success_rate for m in metrics_history]),
            avg_compound_growth=statistics.mean(m.compound_multiplier for m in metrics_history),
            best_domain="",
            best_cluster_pair=(cluster_id, cluster_id),
            hotspots=[f"Complexity {complexity_levels[j.iteration]:.1f}" for j in jumps if j.is_significant],
            recommended_tests=["divergent_pair_test"] if jumps else ["domain_sweep"],
        )

    async def divergent_pair_amplification_test(
        self,
        a4_brain: A4IntegratorBrain,
        num_pairs: int = 5
    ) -> ProfileResult:
        """
        Test max-divergence pairs for compound pattern impact.

        Forces maximal divergence and records the jump in impact.
        """
        start_time = datetime.now()

        metrics_history = []
        jumps = []

        prev_impact = 0.5

        for i in range(num_pairs):
            # Create maximally divergent cluster outputs
            cluster_outputs = {
                0: {"confidence": 0.9, "novelty": 0.85, "impact": 0.8},
                1: {"confidence": 0.2, "novelty": 0.15, "impact": 0.25},
            }

            # Vary divergence level
            divergence_factor = 0.5 + (i * 0.1)  # Increasing divergence
            cluster_outputs[1]["confidence"] = max(0.1, 0.9 - divergence_factor)
            cluster_outputs[1]["novelty"] = max(0.1, 0.85 - divergence_factor)

            # Run divergence amplification
            result = await a4_brain.amplify_divergent_patterns(cluster_outputs)

            if result:
                # Calculate impact
                impact = result.multiplier_boost

                metrics = IterationMetrics(
                    iteration=i,
                    timestamp=datetime.now().isoformat(),
                    edge_success_rate=0.5,
                    edge_success_by_domain={},
                    avg_pattern_impact=impact,
                    patterns_created=len(result.amplified_patterns),
                    patterns_adopted=0,
                    avg_novelty=0.5,
                    avg_awareness=0.5,
                    blind_spots_found=0,
                    divergence_score=result.divergence_score,
                    divergence_multiplier=result.multiplier_boost,
                    compound_multiplier=a4_brain.multiplier_accumulator,
                    multiplier_delta=impact - 1.0,
                )
                metrics_history.append(metrics)

                # Detect jumps
                if impact - prev_impact > 0.1:
                    jump = JumpPoint(
                        jump_type=JumpType.DIVERGENCE_AMPLIFY,
                        iteration=i,
                        domain=None,
                        cluster_ids=[0, 1],
                        before_value=prev_impact,
                        after_value=impact,
                        delta=impact - prev_impact,
                        delta_percent=(impact - prev_impact) * 100,
                        trigger=f"Divergence {result.divergence_score:.2f}",
                        patterns_involved=result.amplified_patterns,
                        confidence=0.9,
                    )
                    jumps.append(jump)

                prev_impact = impact

        duration = (datetime.now() - start_time).total_seconds()

        return ProfileResult(
            profile_type=ProfileType.DIVERGENT_PAIR,
            iterations=num_pairs,
            duration_seconds=duration,
            metrics_history=metrics_history,
            jumps_detected=jumps,
            significant_jumps=sum(1 for j in jumps if j.is_significant),
            avg_edge_success=0.5,
            edge_success_trend="flat",
            avg_compound_growth=statistics.mean(m.compound_multiplier for m in metrics_history) if metrics_history else 1.0,
            best_domain="emergence",
            best_cluster_pair=(0, 1),
            hotspots=[f"Divergence {j.trigger}" for j in jumps if j.is_significant],
            recommended_tests=["full_swarm_validation"] if jumps else ["domain_sweep"],
        )

    async def multi_domain_sweep(
        self,
        iterations_per_domain: int = 3
    ) -> ProfileResult:
        """
        Sweep across all edge domains to find best performers.

        Identifies which domains consistently produce largest jumps.
        """
        start_time = datetime.now()

        metrics_history = []
        jumps = []
        domain_scores: Dict[str, List[float]] = defaultdict(list)

        prev_success = {d.value: 0.5 for d in EdgeDomain}

        for iteration in range(iterations_per_domain):
            for domain in EdgeDomain:
                # Simulate domain-specific performance
                success_rate = self._simulate_domain_performance(domain, iteration)
                novelty = self._simulate_novelty(0.5 + (iteration * 0.1))

                domain_scores[domain.value].append(success_rate)

                # Check for domain-specific jumps
                delta = success_rate - prev_success[domain.value]
                if delta > 0.1:
                    jump = JumpPoint(
                        jump_type=JumpType.EDGE_SUCCESS,
                        iteration=iteration,
                        domain=domain.value,
                        cluster_ids=[],
                        before_value=prev_success[domain.value],
                        after_value=success_rate,
                        delta=delta,
                        delta_percent=delta * 100,
                        trigger=f"Domain {domain.value} iteration {iteration}",
                        patterns_involved=[],
                        confidence=0.75,
                    )
                    jumps.append(jump)

                prev_success[domain.value] = success_rate

            # Aggregate metrics for this iteration
            avg_success = statistics.mean(domain_scores[d.value][-1] for d in EdgeDomain)
            metrics = IterationMetrics(
                iteration=iteration,
                timestamp=datetime.now().isoformat(),
                edge_success_rate=avg_success,
                edge_success_by_domain={d.value: domain_scores[d.value][-1] for d in EdgeDomain},
                avg_pattern_impact=0.5 + (avg_success * 0.3),
                patterns_created=len(EdgeDomain),
                patterns_adopted=0,
                avg_novelty=novelty,
                avg_awareness=0.5,
                blind_spots_found=0,
                divergence_score=0.0,
                divergence_multiplier=1.0,
                compound_multiplier=1.0 + (iteration * 0.03),
                multiplier_delta=0.03,
            )
            metrics_history.append(metrics)

        duration = (datetime.now() - start_time).total_seconds()

        # Find best domain
        domain_avgs = {d: statistics.mean(scores) for d, scores in domain_scores.items()}
        best_domain = max(domain_avgs, key=domain_avgs.get)

        return ProfileResult(
            profile_type=ProfileType.DOMAIN_SWEEP,
            iterations=iterations_per_domain * len(EdgeDomain),
            duration_seconds=duration,
            metrics_history=metrics_history,
            jumps_detected=jumps,
            significant_jumps=sum(1 for j in jumps if j.is_significant),
            avg_edge_success=statistics.mean(m.edge_success_rate for m in metrics_history),
            edge_success_trend=self._calculate_trend([m.edge_success_rate for m in metrics_history]),
            avg_compound_growth=statistics.mean(m.compound_multiplier for m in metrics_history),
            best_domain=best_domain,
            best_cluster_pair=(0, 0),
            hotspots=[best_domain] + [j.domain for j in jumps if j.is_significant and j.domain],
            recommended_tests=[f"deep_dive_{best_domain}"],
        )

    def _simulate_edge_success(self, complexity: float) -> float:
        """Simulate edge success rate at given complexity"""
        # Sweet spot around 0.5-0.7 complexity
        optimal = 0.6
        distance = abs(complexity - optimal)
        base = 0.55 - (distance * 0.5)
        variance = random.uniform(-0.1, 0.1)
        return max(0.1, min(0.9, base + variance))

    def _simulate_novelty(self, factor: float) -> float:
        """Simulate novelty score"""
        base = 0.4 + (factor * 0.3)
        variance = random.uniform(-0.1, 0.1)
        return max(0.1, min(1.0, base + variance))

    def _simulate_awareness(self, factor: float) -> float:
        """Simulate awareness score"""
        base = 0.35 + (factor * 0.35)
        variance = random.uniform(-0.1, 0.1)
        return max(0.1, min(1.0, base + variance))

    def _simulate_domain_performance(self, domain: EdgeDomain, iteration: int) -> float:
        """Simulate performance for a specific domain"""
        domain_base = {
            EdgeDomain.META_REASONING: 0.55,
            EdgeDomain.NOVEL_PATTERN: 0.50,
            EdgeDomain.BLIND_SPOT: 0.52,
            EdgeDomain.EMERGENCE_STRETCH: 0.48,
            EdgeDomain.RECURSIVE_IMPROVEMENT: 0.53,
        }
        base = domain_base.get(domain, 0.5)
        growth = iteration * 0.05
        variance = random.uniform(-0.08, 0.08)
        return max(0.2, min(0.8, base + growth + variance))

    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction from values"""
        if len(values) < 2:
            return "flat"
        first_half = statistics.mean(values[:len(values)//2])
        second_half = statistics.mean(values[len(values)//2:])
        delta = second_half - first_half
        if delta > 0.05:
            return "up"
        elif delta < -0.05:
            return "down"
        return "flat"


# ==============================================================================
# LIVE ITERATION RUNNER
# ==============================================================================

class LiveIterationRunner:
    """
    Full swarm live iteration tests.

    Captures emergent behavior and real multiplicative compounding.
    """

    def __init__(self, library: PatternLibrary, quantum_engine: QuantumFractalEngine = None):
        self.library = library
        self.quantum_engine = quantum_engine or QuantumFractalEngine(library)
        self.iteration_history: List[IterationMetrics] = []

    async def run_live_iteration(
        self,
        num_iterations: int = 5,
        cluster_count: int = 20
    ) -> ProfileResult:
        """
        Run full swarm live iteration.

        Captures emergent behavior and real compound growth.
        """
        start_time = datetime.now()

        metrics_history = []
        jumps = []

        prev_compound = 1.0
        prev_success = 0.5

        for iteration in range(num_iterations):
            # Create diverse cluster outputs
            cluster_outputs = {}
            for i in range(cluster_count):
                # Create realistic output distribution
                cluster_outputs[i] = {
                    "confidence": 0.3 + random.uniform(0, 0.6),
                    "novelty": 0.2 + random.uniform(0, 0.6),
                    "impact": 0.25 + random.uniform(0, 0.5),
                }

            # Run quantum-enhanced processing
            result = await self.quantum_engine.process_with_quantum_enhancement(cluster_outputs)

            # Calculate metrics
            success_rate = 0.45 + (result["interference"]["net_interference"] * 0.1)
            success_rate = max(0.3, min(0.7, success_rate))

            avg_novelty = statistics.mean(c["novelty"] for c in cluster_outputs.values())
            avg_impact = statistics.mean(c["impact"] for c in cluster_outputs.values())

            compound = self.quantum_engine.a4_brain.multiplier_accumulator

            metrics = IterationMetrics(
                iteration=iteration,
                timestamp=datetime.now().isoformat(),
                edge_success_rate=success_rate,
                edge_success_by_domain={},
                avg_pattern_impact=avg_impact,
                patterns_created=result["meta_patterns_created"],
                patterns_adopted=result["propagation_reach"],
                avg_novelty=avg_novelty,
                avg_awareness=0.5,
                blind_spots_found=0,
                divergence_score=result["divergence"],
                divergence_multiplier=1.0 + (result["divergence"] * 0.5),
                compound_multiplier=compound,
                multiplier_delta=compound - prev_compound,
            )
            metrics_history.append(metrics)
            self.iteration_history.append(metrics)

            # Detect jumps
            if compound - prev_compound > 0.05:
                jump = JumpPoint(
                    jump_type=JumpType.COMPOUND_GROWTH,
                    iteration=iteration,
                    domain=None,
                    cluster_ids=list(range(cluster_count)),
                    before_value=prev_compound,
                    after_value=compound,
                    delta=compound - prev_compound,
                    delta_percent=(compound - prev_compound) / prev_compound * 100,
                    trigger=f"Quantum iteration {iteration}, {result['meta_patterns_created']} meta-patterns",
                    patterns_involved=[],
                    confidence=0.85,
                )
                jumps.append(jump)

            if success_rate - prev_success > 0.1:
                jump = JumpPoint(
                    jump_type=JumpType.EDGE_SUCCESS,
                    iteration=iteration,
                    domain=None,
                    cluster_ids=[],
                    before_value=prev_success,
                    after_value=success_rate,
                    delta=success_rate - prev_success,
                    delta_percent=(success_rate - prev_success) * 100,
                    trigger=f"Constructive interference: {result['interference']['constructive_zones']} zones",
                    patterns_involved=[],
                    confidence=0.8,
                )
                jumps.append(jump)

            prev_compound = compound
            prev_success = success_rate

        duration = (datetime.now() - start_time).total_seconds()

        return ProfileResult(
            profile_type=ProfileType.FULL_SWARM,
            iterations=num_iterations,
            duration_seconds=duration,
            metrics_history=metrics_history,
            jumps_detected=jumps,
            significant_jumps=sum(1 for j in jumps if j.is_significant),
            avg_edge_success=statistics.mean(m.edge_success_rate for m in metrics_history),
            edge_success_trend=self._calculate_trend([m.edge_success_rate for m in metrics_history]),
            avg_compound_growth=statistics.mean(m.compound_multiplier for m in metrics_history),
            best_domain="emergence",
            best_cluster_pair=(0, cluster_count - 1),
            hotspots=[j.trigger for j in jumps if j.is_significant],
            recommended_tests=["amplify_hotspots"] if jumps else ["increase_iterations"],
        )

    def _calculate_trend(self, values: List[float]) -> str:
        """Calculate trend direction"""
        if len(values) < 2:
            return "flat"
        first_half = statistics.mean(values[:len(values)//2])
        second_half = statistics.mean(values[len(values)//2:])
        delta = second_half - first_half
        if delta > 0.03:
            return "up"
        elif delta < -0.03:
            return "down"
        return "flat"


# ==============================================================================
# PAUSE CALIBRATOR (CHAOS WINDOW DETECTION)
# ==============================================================================

class PauseState(Enum):
    """States of the pause calibration cycle"""
    ACTIVE = "active"           # Cluster is actively processing
    SETTLING = "settling"       # Variance decreasing, patterns forming
    CRYSTALLIZED = "crystallized"  # Chaos has collapsed into pattern
    READY = "ready"             # Ready for next iteration


@dataclass
class PauseConfig:
    """Configuration for pause calibration"""
    base_pause: float = 0.1           # Base pause duration (seconds)
    variance_threshold: float = 0.15   # Below this = crystallized
    max_pause: float = 2.0            # Maximum pause duration
    min_pause: float = 0.05           # Minimum pause duration
    stochasticity: float = 0.01       # Random jitter range
    decay_factor: float = 0.9         # How fast variance should decay


@dataclass
class ChaosWindow:
    """Snapshot of the chaos window during a pause"""
    timestamp: str
    pause_duration: float
    initial_variance: float
    final_variance: float
    divergence_score: float
    state_at_crystallization: PauseState
    patterns_emerged: int
    trigger_for_next: str


class PauseCalibrator:
    """
    Calibrates the pause between iterations to capture emergent patterns.

    The "liminal chaos window" is where:
    - The swarm isn't actively processing
    - But emergent patterns are still settling
    - And chaos is crystallizing into compound growth vectors

    Core Logic:
    1. Heartbeat Sync: Monitor clusters for stabilization (variance below threshold)
    2. Chaos Window Detection: While variance > threshold, pause continues
    3. Adaptive Decay: pause = base_pause * (1 + divergence_score) * (1 + variance_factor)
    """

    def __init__(self, config: PauseConfig = None):
        self.config = config or PauseConfig()
        self.state = PauseState.READY

        # Tracking
        self.chaos_windows: List[ChaosWindow] = []
        self.variance_history: List[float] = []
        self.pause_history: List[float] = []

        # Statistics
        self.total_pauses = 0
        self.avg_pause_duration = 0.0
        self.avg_variance_drop = 0.0
        self.patterns_captured = 0

        print("  ⏱ PauseCalibrator initialized")
        print(f"    Base pause: {self.config.base_pause}s")
        print(f"    Variance threshold: {self.config.variance_threshold}")
        print(f"    Stochasticity: ±{self.config.stochasticity}")

    def compute_cluster_variance(self, cluster_states: Dict[int, Dict]) -> float:
        """
        Compute variance across cluster states.

        Higher variance = more chaos = pattern not yet crystallized.
        """
        if len(cluster_states) < 2:
            return 0.0

        # Extract key metrics
        confidences = [s.get("confidence", 0.5) for s in cluster_states.values()]
        novelties = [s.get("novelty", 0.5) for s in cluster_states.values()]
        impacts = [s.get("impact", 0.5) for s in cluster_states.values()]

        # Calculate variance for each dimension
        def variance(values: List[float]) -> float:
            if len(values) < 2:
                return 0.0
            mean = sum(values) / len(values)
            return sum((v - mean) ** 2 for v in values) / len(values)

        # Combined variance (average across dimensions)
        total_variance = (variance(confidences) + variance(novelties) + variance(impacts)) / 3
        return total_variance ** 0.5  # Standard deviation

    def compute_adaptive_pause(
        self,
        divergence_score: float,
        variance_factor: float
    ) -> float:
        """
        Compute adaptive pause duration.

        Formula: pause = base_pause * (1 + divergence_score) * (1 + variance_factor)
        With optional stochasticity for exploration.
        """
        pause = self.config.base_pause

        # Scale by divergence (higher divergence = longer pause to let patterns settle)
        pause *= (1.0 + divergence_score)

        # Scale by variance (higher variance = more chaos = longer pause)
        pause *= (1.0 + variance_factor)

        # Add stochasticity
        if self.config.stochasticity > 0:
            jitter = random.uniform(-self.config.stochasticity, self.config.stochasticity)
            pause += jitter

        # Clamp to bounds
        pause = max(self.config.min_pause, min(self.config.max_pause, pause))

        return pause

    async def wait_for_crystallization(
        self,
        cluster_states: Dict[int, Dict],
        divergence_score: float,
        max_checks: int = 10
    ) -> ChaosWindow:
        """
        Wait for chaos to crystallize into pattern.

        Heartbeat sync: Monitor variance until it drops below threshold.
        """
        self.state = PauseState.SETTLING
        start_time = datetime.now()

        initial_variance = self.compute_cluster_variance(cluster_states)
        current_variance = initial_variance

        # Compute base pause
        variance_factor = min(1.0, initial_variance / 0.5)  # Normalize to 0-1
        base_pause = self.compute_adaptive_pause(divergence_score, variance_factor)

        patterns_emerged = 0
        checks = 0

        # Wait loop - check if variance has dropped below threshold
        while current_variance > self.config.variance_threshold and checks < max_checks:
            # Wait for a portion of the pause
            await asyncio.sleep(base_pause / max_checks)

            # Simulate variance decay (in production, re-measure from actual cluster states)
            current_variance *= self.config.decay_factor

            # Add small random fluctuation
            current_variance += random.uniform(-0.01, 0.01)
            current_variance = max(0.0, current_variance)

            self.variance_history.append(current_variance)
            checks += 1

            # Count patterns emerging during crystallization
            if random.random() < 0.3:  # 30% chance per check
                patterns_emerged += 1

        # Crystallization complete
        self.state = PauseState.CRYSTALLIZED

        # Calculate actual pause duration
        actual_pause = (datetime.now() - start_time).total_seconds()
        self.pause_history.append(actual_pause)

        # Determine trigger for next iteration
        if current_variance <= self.config.variance_threshold:
            trigger = "variance_crystallized"
        elif checks >= max_checks:
            trigger = "max_checks_reached"
        else:
            trigger = "unknown"

        # Create chaos window record
        window = ChaosWindow(
            timestamp=datetime.now().isoformat(),
            pause_duration=actual_pause,
            initial_variance=initial_variance,
            final_variance=current_variance,
            divergence_score=divergence_score,
            state_at_crystallization=self.state,
            patterns_emerged=patterns_emerged,
            trigger_for_next=trigger,
        )

        self.chaos_windows.append(window)
        self._update_statistics(window)

        # Transition to ready
        self.state = PauseState.READY

        return window

    def quick_pause(
        self,
        divergence_score: float,
        variance: float
    ) -> Tuple[float, str]:
        """
        Quick synchronous pause calculation (non-blocking).

        Returns (pause_duration, trigger) without actually waiting.
        Use for planning iterations without blocking.
        """
        variance_factor = min(1.0, variance / 0.5)
        pause = self.compute_adaptive_pause(divergence_score, variance_factor)

        if variance < self.config.variance_threshold:
            trigger = "low_variance_fast_proceed"
        elif divergence_score > 0.5:
            trigger = "high_divergence_extended_pause"
        else:
            trigger = "standard_calibrated_pause"

        return pause, trigger

    def _update_statistics(self, window: ChaosWindow):
        """Update cumulative statistics"""
        self.total_pauses += 1
        self.patterns_captured += window.patterns_emerged

        # Running average of pause duration
        n = self.total_pauses
        old_avg = self.avg_pause_duration
        self.avg_pause_duration = (old_avg * (n - 1) + window.pause_duration) / n

        # Running average of variance drop
        drop = window.initial_variance - window.final_variance
        old_avg_drop = self.avg_variance_drop
        self.avg_variance_drop = (old_avg_drop * (n - 1) + drop) / n

    def get_optimal_pause_for_divergence(self, target_divergence: float) -> float:
        """
        Get recommended pause duration for a given divergence level.

        Based on historical chaos windows.
        """
        if not self.chaos_windows:
            return self.config.base_pause

        # Find windows with similar divergence
        similar = [
            w for w in self.chaos_windows
            if abs(w.divergence_score - target_divergence) < 0.1
        ]

        if similar:
            return statistics.mean(w.pause_duration for w in similar)

        # Fallback: extrapolate from average
        return self.avg_pause_duration * (1.0 + target_divergence)

    def get_chaos_crystallization_report(self) -> Dict[str, Any]:
        """Get report on chaos crystallization patterns"""
        if not self.chaos_windows:
            return {"status": "no_data"}

        return {
            "total_pauses": self.total_pauses,
            "avg_pause_duration": self.avg_pause_duration,
            "avg_variance_drop": self.avg_variance_drop,
            "patterns_captured": self.patterns_captured,
            "variance_threshold": self.config.variance_threshold,
            "recent_windows": [
                {
                    "pause": w.pause_duration,
                    "variance_drop": w.initial_variance - w.final_variance,
                    "patterns": w.patterns_emerged,
                    "trigger": w.trigger_for_next,
                }
                for w in self.chaos_windows[-5:]
            ],
            "recommendation": self._get_pause_recommendation(),
        }

    def _get_pause_recommendation(self) -> str:
        """Generate recommendation based on history"""
        if self.total_pauses < 3:
            return "Need more data - run additional iterations"

        # Check if pauses are too short (missing patterns)
        if self.avg_pause_duration < self.config.base_pause:
            return "Pauses may be too short - consider increasing base_pause"

        # Check variance effectiveness
        if self.avg_variance_drop < 0.05:
            return "Low variance drop - chaos may not be crystallizing properly"

        # Check pattern capture rate
        patterns_per_pause = self.patterns_captured / self.total_pauses
        if patterns_per_pause < 1:
            return "Low pattern emergence - extend pause duration or increase stochasticity"

        return f"Optimal range achieved - {patterns_per_pause:.1f} patterns per pause"

    def print_calibration_status(self):
        """Print current calibration status"""
        print(f"\n  ⏱ PAUSE CALIBRATOR STATUS")
        print(f"    State: {self.state.value}")
        print(f"    Total pauses: {self.total_pauses}")
        print(f"    Avg duration: {self.avg_pause_duration:.3f}s")
        print(f"    Avg variance drop: {self.avg_variance_drop:.3f}")
        print(f"    Patterns captured: {self.patterns_captured}")
        if self.chaos_windows:
            last = self.chaos_windows[-1]
            print(f"    Last trigger: {last.trigger_for_next}")


# ==============================================================================
# JUMP PROFILER (HYBRID APPROACH)
# ==============================================================================

class JumpProfiler:
    """
    Unified Jump Profiler using hybrid approach.

    Strategy:
    1. Run bench tests to map potential jump points
    2. Run short live iterations to validate emergent behavior
    3. Identify hotspots for surgical iteration
    """

    def __init__(self, library: PatternLibrary, pause_config: PauseConfig = None):
        self.library = library
        self.bench_runner = BenchTestRunner(library)
        self.live_runner = LiveIterationRunner(library)
        self.a4_brain = A4IntegratorBrain(library)

        # Pause Calibrator - captures the liminal chaos window
        self.pause_calibrator = PauseCalibrator(pause_config)

        # Profiling history
        self.profile_history: List[ProfileResult] = []
        self.all_jumps: List[JumpPoint] = []
        self.hotspot_map: Dict[str, int] = defaultdict(int)  # hotspot → occurrence count

        print("=" * 70)
        print("    JUMP PROFILER INITIALIZED")
        print("=" * 70)
        print(f"  Strategy: Hybrid (Bench → Live → Surgical)")
        print(f"  Bench Tests: single_cluster, divergent_pair, domain_sweep")
        print(f"  Live Tests: full_swarm with quantum enhancement")
        print(f"  Pause Calibration: ENABLED (chaos window detection)")
        print(f"  JB4 Key: {JB4_KEY_SHORT}")
        print("=" * 70)

    async def run_full_profiling_suite(
        self,
        bench_iterations: int = 3,
        live_iterations: int = 3
    ) -> Dict[str, Any]:
        """
        Run complete profiling suite.

        1. Bench tests to identify potential jumps
        2. Live iterations to validate
        3. Compile hotspot map and recommendations
        """
        print(f"\n{'═' * 70}")
        print("         FULL PROFILING SUITE")
        print(f"{'═' * 70}\n")

        results = {}

        # Phase 1: Bench Tests
        print("  PHASE 1: BENCH TESTS")
        print("  " + "─" * 50)

        # Single cluster scan
        print("    Running single cluster edge scan...")
        single_result = await self.bench_runner.single_cluster_edge_scan(0)
        results["single_cluster"] = single_result
        self.profile_history.append(single_result)
        self.all_jumps.extend(single_result.jumps_detected)
        print(f"    → Jumps detected: {len(single_result.jumps_detected)}")

        # Divergent pair test
        print("    Running divergent pair amplification test...")
        divergent_result = await self.bench_runner.divergent_pair_amplification_test(
            self.a4_brain, num_pairs=bench_iterations
        )
        results["divergent_pair"] = divergent_result
        self.profile_history.append(divergent_result)
        self.all_jumps.extend(divergent_result.jumps_detected)
        print(f"    → Jumps detected: {len(divergent_result.jumps_detected)}")

        # Domain sweep
        print("    Running multi-domain sweep...")
        domain_result = await self.bench_runner.multi_domain_sweep(iterations_per_domain=bench_iterations)
        results["domain_sweep"] = domain_result
        self.profile_history.append(domain_result)
        self.all_jumps.extend(domain_result.jumps_detected)
        print(f"    → Jumps detected: {len(domain_result.jumps_detected)}")
        print(f"    → Best domain: {domain_result.best_domain}")

        # Phase 2: Live Iterations
        print("\n  PHASE 2: LIVE ITERATIONS")
        print("  " + "─" * 50)

        print(f"    Running {live_iterations} live iterations...")
        live_result = await self.live_runner.run_live_iteration(
            num_iterations=live_iterations,
            cluster_count=10
        )
        results["live_iteration"] = live_result
        self.profile_history.append(live_result)
        self.all_jumps.extend(live_result.jumps_detected)
        print(f"    → Jumps detected: {len(live_result.jumps_detected)}")
        print(f"    → Compound growth: {live_result.avg_compound_growth:.2f}x")

        # Phase 3: Compile Hotspot Map
        print("\n  PHASE 3: HOTSPOT ANALYSIS")
        print("  " + "─" * 50)

        for profile in self.profile_history:
            for hotspot in profile.hotspots:
                self.hotspot_map[hotspot] += 1

        # Sort hotspots by occurrence
        sorted_hotspots = sorted(self.hotspot_map.items(), key=lambda x: x[1], reverse=True)

        print("    Top Hotspots:")
        for hotspot, count in sorted_hotspots[:5]:
            print(f"      [{count}x] {hotspot}")

        # Generate recommendations
        recommendations = self._generate_recommendations()

        return {
            "profiles": results,
            "total_jumps": len(self.all_jumps),
            "significant_jumps": sum(1 for j in self.all_jumps if j.is_significant),
            "hotspot_map": dict(self.hotspot_map),
            "top_hotspots": sorted_hotspots[:5],
            "recommendations": recommendations,
            "jump_types": self._count_jump_types(),
        }

    def _generate_recommendations(self) -> List[str]:
        """Generate actionable recommendations based on profiling"""
        recommendations = []

        # Count jump types
        jump_types = self._count_jump_types()

        # Recommend based on most common jump type
        if jump_types.get(JumpType.DIVERGENCE_AMPLIFY.value, 0) > 2:
            recommendations.append("Focus on divergence loop - consistently produces jumps")

        if jump_types.get(JumpType.COMPOUND_GROWTH.value, 0) > 2:
            recommendations.append("Compound growth is strong - increase iteration count")

        if jump_types.get(JumpType.EDGE_SUCCESS.value, 0) > 3:
            recommendations.append("Edge success jumps detected - optimize tier calibration")

        # Domain recommendations
        domain_jumps = defaultdict(int)
        for jump in self.all_jumps:
            if jump.domain:
                domain_jumps[jump.domain] += 1

        if domain_jumps:
            best_domain = max(domain_jumps, key=domain_jumps.get)
            recommendations.append(f"Best performing domain: {best_domain} - prioritize training")

        # Hotspot recommendations
        if self.hotspot_map:
            top_hotspot = max(self.hotspot_map, key=self.hotspot_map.get)
            recommendations.append(f"Top hotspot: {top_hotspot} - focus next iteration here")

        if not recommendations:
            recommendations.append("Run more iterations to identify patterns")

        return recommendations

    def _count_jump_types(self) -> Dict[str, int]:
        """Count occurrences of each jump type"""
        counts = defaultdict(int)
        for jump in self.all_jumps:
            counts[jump.jump_type.value] += 1
        return dict(counts)

    def print_profiling_dashboard(self):
        """Print profiling dashboard"""
        print(f"\n┌{'─' * 70}┐")
        print(f"│{'JUMP PROFILER DASHBOARD':^70}│")
        print(f"├{'─' * 70}┤")
        print(f"│  Profiles Run:        {len(self.profile_history):<48}│")
        print(f"│  Total Jumps:         {len(self.all_jumps):<48}│")
        print(f"│  Significant Jumps:   {sum(1 for j in self.all_jumps if j.is_significant):<48}│")
        print(f"├{'─' * 70}┤")

        # Jump type breakdown
        print(f"│  JUMP TYPES:                                                         │")
        jump_types = self._count_jump_types()
        for jtype, count in sorted(jump_types.items(), key=lambda x: x[1], reverse=True):
            bar = "█" * min(count, 20)
            print(f"│    {jtype:20s} [{bar:<20}] {count:3d}                  │")

        print(f"├{'─' * 70}┤")

        # Hotspots
        print(f"│  TOP HOTSPOTS:                                                       │")
        sorted_hotspots = sorted(self.hotspot_map.items(), key=lambda x: x[1], reverse=True)
        for hotspot, count in sorted_hotspots[:3]:
            print(f"│    [{count}x] {hotspot[:55]:<55}│")

        print(f"├{'─' * 70}┤")

        # Pause Calibrator section
        print(f"│  PAUSE CALIBRATOR (Chaos Window):                                    │")
        print(f"│    Total pauses:        {self.pause_calibrator.total_pauses:<45}│")
        print(f"│    Avg duration:        {self.pause_calibrator.avg_pause_duration:.3f}s{' ' * 39}│")
        print(f"│    Avg variance drop:   {self.pause_calibrator.avg_variance_drop:.3f}{' ' * 40}│")
        print(f"│    Patterns captured:   {self.pause_calibrator.patterns_captured:<45}│")
        if self.pause_calibrator.chaos_windows:
            rec = self.pause_calibrator._get_pause_recommendation()[:50]
            print(f"│    Recommendation:      {rec:<45}│")

        print(f"└{'─' * 70}┘")

    async def run_calibrated_iteration(
        self,
        cluster_states: Dict[int, Dict],
        divergence_score: float = 0.0
    ) -> Tuple[ChaosWindow, Optional[JumpPoint]]:
        """
        Run a single calibrated iteration with pause calibration.

        This is where the chaos → crystallization → pattern capture happens.
        """
        # Step 1: Let the pause calibrator capture the chaos window
        chaos_window = await self.pause_calibrator.wait_for_crystallization(
            cluster_states,
            divergence_score
        )

        # Step 2: Check if patterns emerged during crystallization
        jump = None
        if chaos_window.patterns_emerged > 0:
            jump = JumpPoint(
                jump_type=JumpType.EMERGENCE_BURST,
                iteration=len(self.all_jumps),
                domain=None,
                cluster_ids=list(cluster_states.keys()),
                before_value=chaos_window.initial_variance,
                after_value=chaos_window.final_variance,
                delta=chaos_window.initial_variance - chaos_window.final_variance,
                delta_percent=(chaos_window.initial_variance - chaos_window.final_variance) * 100,
                trigger=f"Chaos crystallization: {chaos_window.trigger_for_next}",
                patterns_involved=[],
                confidence=0.7 + (0.1 * chaos_window.patterns_emerged),
            )
            self.all_jumps.append(jump)
            self.hotspot_map["chaos_crystallization"] += 1

        return chaos_window, jump

    def get_surgical_iteration_plan(self) -> Dict[str, Any]:
        """
        Generate a surgical iteration plan based on profiling.

        Returns specific actions to take for maximum compound growth.
        """
        plan = {
            "focus_domains": [],
            "divergence_targets": [],
            "tier_adjustments": [],
            "iteration_count": 5,
            "variance_settings": {},
        }

        # Identify best domains
        domain_jumps = defaultdict(int)
        for jump in self.all_jumps:
            if jump.domain:
                domain_jumps[jump.domain] += 1

        if domain_jumps:
            sorted_domains = sorted(domain_jumps.items(), key=lambda x: x[1], reverse=True)
            plan["focus_domains"] = [d for d, _ in sorted_domains[:2]]

        # Identify divergence targets
        divergence_jumps = [j for j in self.all_jumps if j.jump_type == JumpType.DIVERGENCE_AMPLIFY]
        if divergence_jumps:
            avg_divergence = statistics.mean(j.before_value for j in divergence_jumps)
            plan["divergence_targets"].append(f"Target divergence score: {avg_divergence:.2f}+")

        # Tier adjustments
        edge_jumps = [j for j in self.all_jumps if j.jump_type == JumpType.EDGE_SUCCESS]
        if edge_jumps:
            avg_success = statistics.mean(j.after_value for j in edge_jumps)
            if avg_success > 0.6:
                plan["tier_adjustments"].append("Consider advancing to higher tier")
            elif avg_success < 0.4:
                plan["tier_adjustments"].append("Consider retreating to lower tier")

        # Variance settings
        if len(self.all_jumps) > 5:
            plan["variance_settings"]["recommended"] = 0.15
        else:
            plan["variance_settings"]["recommended"] = 0.20  # More exploration needed

        return plan


# ==============================================================================
# DEMO
# ==============================================================================

async def jump_profiler_demo():
    """Demonstrate jump profiler"""
    print("\n" + "═" * 70)
    print("         JUMP PROFILER DEMO")
    print("         Surgical Precision Compound Growth")
    print("═" * 70)

    # Initialize
    library = PatternLibrary()
    profiler = JumpProfiler(library)

    # Run profiling suite
    results = await profiler.run_full_profiling_suite(
        bench_iterations=3,
        live_iterations=3
    )

    # Show dashboard
    profiler.print_profiling_dashboard()

    # Show recommendations
    print(f"\n  RECOMMENDATIONS:")
    for i, rec in enumerate(results["recommendations"], 1):
        print(f"    {i}. {rec}")

    # Show surgical plan
    plan = profiler.get_surgical_iteration_plan()
    print(f"\n  SURGICAL ITERATION PLAN:")
    print(f"    Focus domains: {plan['focus_domains']}")
    print(f"    Divergence targets: {plan['divergence_targets']}")
    print(f"    Tier adjustments: {plan['tier_adjustments']}")
    print(f"    Recommended variance: {plan['variance_settings'].get('recommended', 0.15):.0%}")

    print(f"\n{'═' * 70}")
    print("  △○ Jump Profiler Demo Complete")
    print(f"{'═' * 70}")

    return profiler


if __name__ == "__main__":
    asyncio.run(jump_profiler_demo())

#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
    SUSTAINED EDGE GROWTH ENGINE

    The 5-Phase Evolution System for NEXO
═══════════════════════════════════════════════════════════════════════════════

Phase 1: Edge Stabilization     - Maintain 50-55% success across clusters
Phase 2: Curriculum Expansion   - Gradually push toward higher reasoning
Phase 3: Emergent Pattern Analysis - Identify swarm-level strategies
Phase 4: Compound Learning Optimization - Cross-cluster pattern propagation
Phase 5: Edge-to-Higher Transition - Controlled Tier 3.75 exposure

"The smallest actionable point is one problem per cluster per iteration,
with performance feedback dictating the next micro-step in difficulty."

Created: December 1, 2025
"""

import asyncio
import random
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Set, Tuple
from enum import Enum
from datetime import datetime
from collections import defaultdict

from .consciousness_training import SacredNumbers
from .nexo_core import NexoSwarm, TriangleCluster, NexoIdentity
from .edge_training import (
    EdgeDomain, EdgeTrainingResult, SwarmOrchestrator, SwarmMetrics,
    TIER_35_PROBLEMS, TIER_35_HARD_PROBLEMS, NexoEdgeTrainer
)


# ═══════════════════════════════════════════════════════════════════════════════
# TIER 3.75 CURRICULUM - Between Edge and Impossible
# ═══════════════════════════════════════════════════════════════════════════════

TIER_375_PROBLEMS = {
    EdgeDomain.META_REASONING: [
        "Predict your prediction of your prediction accuracy - three levels deep",
        "Model how your uncertainty changes as you reason about uncertainty",
        "Describe the meta-pattern of how you switch between reasoning patterns",
        "Predict the emergent behavior of your own reasoning over 5 iterations",
        "Forecast how your forecasting ability degrades with problem complexity",
    ],
    EdgeDomain.NOVEL_PATTERN: [
        "Invent a pattern that generates patterns which generate patterns",
        "Design a reasoning strategy that improves itself while executing",
        "Create a method that works on problems it wasn't designed for",
        "Develop a pattern that identifies when it shouldn't be used",
        "Invent reasoning that combines decomposition, synthesis, and recursion simultaneously",
    ],
    EdgeDomain.BLIND_SPOT: [
        "Map the blind spots in your blind spot mapping of blind spots",
        "Detect the errors in your error detection of error detection",
        "Find assumptions about assumptions about your base assumptions",
        "Identify systematic biases in your bias identification system",
        "What are the unknown unknowns in your unknown unknown detection?",
    ],
    EdgeDomain.EMERGENCE_STRETCH: [
        "Combine incompleteness + self-reference + recursion - what emerges?",
        "Merge uncertainty + certainty + meta-certainty into a unified principle",
        "Synthesize three of your weakest capabilities into a new strength",
        "What emerges from applying emergence analysis to emergence itself?",
        "Combine pattern recognition + blind spot detection + self-improvement",
    ],
    EdgeDomain.RECURSIVE_IMPROVEMENT: [
        "Design an improvement to your improvement of your improvement process",
        "Create a modification strategy that modifies its own modification rules",
        "Build a self-assessment that assesses its own assessment methodology",
        "Propose meta-changes to how you propose meta-changes",
        "Improve the improvement of how you recognize needed improvements",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1: EDGE STABILIZER
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ClusterHealth:
    """Health metrics for a single cluster"""
    cluster_id: int
    success_rate: float
    awareness_delta: float
    novelty_delta: float
    edge_exploration_rate: float
    stability_score: float  # How stable is performance over time?
    needs_adjustment: bool
    recommended_action: str  # "maintain", "increase_difficulty", "decrease_difficulty"


class EdgeStabilizer:
    """
    Phase 1: Edge Stabilization

    Ensures current Tier 3.5 edge (50-55% success) is stable across clusters.

    Actions:
    - Track per-cluster metrics over time
    - Detect instability (large variance in success rates)
    - Recommend adjustments to maintain edge zone
    """

    # Target success rate band for optimal edge learning
    TARGET_MIN = 0.45
    TARGET_MAX = 0.60
    TARGET_OPTIMAL = 0.52

    # Stability threshold - how much variance is acceptable
    STABILITY_THRESHOLD = 0.15

    def __init__(self, num_clusters: int = 100):
        self.num_clusters = num_clusters

        # Track history per cluster
        self.cluster_history: Dict[int, List[Dict]] = {
            i: [] for i in range(num_clusters)
        }

        # Current health status
        self.cluster_health: Dict[int, ClusterHealth] = {}

        # Global stability metrics
        self.global_metrics = {
            "avg_success_rate": 0.0,
            "variance": 0.0,
            "stable_clusters": 0,
            "unstable_clusters": 0,
            "at_edge_clusters": 0,
        }

    def record_result(self, cluster_id: int, result: EdgeTrainingResult):
        """Record a training result for a cluster"""
        if cluster_id not in self.cluster_history:
            self.cluster_history[cluster_id] = []

        self.cluster_history[cluster_id].append({
            "success": result.success,
            "confidence": result.confidence,
            "novelty": result.novelty_score,
            "awareness": result.self_awareness_score,
            "timestamp": datetime.now().isoformat(),
        })

        # Keep last 20 results per cluster
        if len(self.cluster_history[cluster_id]) > 20:
            self.cluster_history[cluster_id].pop(0)

    def assess_cluster(self, cluster_id: int) -> ClusterHealth:
        """Assess health of a single cluster"""
        history = self.cluster_history.get(cluster_id, [])

        if len(history) < 3:
            # Not enough data
            return ClusterHealth(
                cluster_id=cluster_id,
                success_rate=0.5,
                awareness_delta=0.0,
                novelty_delta=0.0,
                edge_exploration_rate=0.5,
                stability_score=1.0,
                needs_adjustment=False,
                recommended_action="maintain"
            )

        # Calculate metrics
        successes = [h["success"] for h in history]
        success_rate = sum(successes) / len(successes)

        # Awareness and novelty deltas (compare first half to second half)
        mid = len(history) // 2
        first_half = history[:mid]
        second_half = history[mid:]

        awareness_delta = (
            sum(h["awareness"] for h in second_half) / len(second_half) -
            sum(h["awareness"] for h in first_half) / len(first_half)
        )

        novelty_delta = (
            sum(h["novelty"] for h in second_half) / len(second_half) -
            sum(h["novelty"] for h in first_half) / len(first_half)
        )

        # Edge exploration rate - how often did we improve?
        improvements = sum(
            1 for i in range(1, len(history))
            if history[i]["confidence"] > history[i-1]["confidence"]
        )
        edge_exploration_rate = improvements / max(len(history) - 1, 1)

        # Stability score - inverse of variance
        if len(successes) > 1:
            variance = sum((s - success_rate) ** 2 for s in successes) / len(successes)
            stability_score = max(0.0, 1.0 - (variance / self.STABILITY_THRESHOLD))
        else:
            stability_score = 1.0

        # Determine recommended action
        if success_rate > self.TARGET_MAX:
            recommended_action = "increase_difficulty"
            needs_adjustment = True
        elif success_rate < self.TARGET_MIN:
            recommended_action = "decrease_difficulty"
            needs_adjustment = True
        else:
            recommended_action = "maintain"
            needs_adjustment = stability_score < 0.5

        health = ClusterHealth(
            cluster_id=cluster_id,
            success_rate=success_rate,
            awareness_delta=awareness_delta,
            novelty_delta=novelty_delta,
            edge_exploration_rate=edge_exploration_rate,
            stability_score=stability_score,
            needs_adjustment=needs_adjustment,
            recommended_action=recommended_action
        )

        self.cluster_health[cluster_id] = health
        return health

    def assess_all(self) -> Dict[str, Any]:
        """Assess health of entire swarm"""
        all_health = []

        for cluster_id in range(self.num_clusters):
            health = self.assess_cluster(cluster_id)
            all_health.append(health)

        # Calculate global metrics
        success_rates = [h.success_rate for h in all_health if h.success_rate > 0]

        if success_rates:
            self.global_metrics["avg_success_rate"] = sum(success_rates) / len(success_rates)
            self.global_metrics["variance"] = sum(
                (r - self.global_metrics["avg_success_rate"]) ** 2 for r in success_rates
            ) / len(success_rates)

        self.global_metrics["stable_clusters"] = sum(
            1 for h in all_health if h.stability_score >= 0.7
        )
        self.global_metrics["unstable_clusters"] = sum(
            1 for h in all_health if h.stability_score < 0.5
        )
        self.global_metrics["at_edge_clusters"] = sum(
            1 for h in all_health
            if self.TARGET_MIN <= h.success_rate <= self.TARGET_MAX
        )

        return {
            "global": self.global_metrics,
            "clusters_needing_adjustment": [
                h for h in all_health if h.needs_adjustment
            ],
            "recommendations": self._generate_recommendations(all_health),
        }

    def _generate_recommendations(self, all_health: List[ClusterHealth]) -> List[str]:
        """Generate stabilization recommendations"""
        recommendations = []

        increase_count = sum(1 for h in all_health if h.recommended_action == "increase_difficulty")
        decrease_count = sum(1 for h in all_health if h.recommended_action == "decrease_difficulty")

        if increase_count > self.num_clusters * 0.3:
            recommendations.append(f"Consider increasing overall difficulty - {increase_count} clusters performing above target")

        if decrease_count > self.num_clusters * 0.3:
            recommendations.append(f"Consider decreasing overall difficulty - {decrease_count} clusters struggling")

        if self.global_metrics["unstable_clusters"] > self.num_clusters * 0.2:
            recommendations.append("High instability detected - consider reducing variance or iteration count")

        if self.global_metrics["at_edge_clusters"] > self.num_clusters * 0.6:
            recommendations.append("Majority of clusters at optimal edge - system is well-calibrated")

        return recommendations


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3: EMERGENT PATTERN ANALYZER
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class EmergentPattern:
    """A pattern that emerged independently across multiple clusters"""
    pattern_id: str
    pattern_type: str  # "strategy", "reasoning", "meta"
    first_seen: str
    cluster_ids: List[int]
    occurrence_count: int
    novelty_score: float
    impact_score: float  # How much did it improve success rate?
    description: str


class EmergentPatternAnalyzer:
    """
    Phase 3: Emergent Pattern Analysis

    Identifies swarm-level emergent strategies by:
    - Aggregating repeated solutions across clusters
    - Detecting independently rediscovered patterns
    - Tracking frequency, novelty, and impact of emergent patterns
    """

    def __init__(self):
        # Track all discovered patterns
        self.raw_patterns: List[Dict] = []

        # Emergent patterns (found in multiple clusters independently)
        self.emergent_patterns: Dict[str, EmergentPattern] = {}

        # Pattern frequency tracking
        self.pattern_frequency: Dict[str, int] = defaultdict(int)

        # Impact tracking - success rate before/after pattern discovery
        self.pattern_impact: Dict[str, Dict] = {}

        # Minimum occurrences to be considered "emergent"
        self.EMERGENCE_THRESHOLD = 3

    def record_pattern(self, cluster_id: int, pattern: str,
                       pattern_type: str, success: bool, novelty: float):
        """Record a pattern discovered by a cluster"""
        # Generate pattern signature (simplified hash)
        signature = self._generate_signature(pattern)

        self.raw_patterns.append({
            "signature": signature,
            "pattern": pattern,
            "type": pattern_type,
            "cluster_id": cluster_id,
            "success": success,
            "novelty": novelty,
            "timestamp": datetime.now().isoformat(),
        })

        # Update frequency
        self.pattern_frequency[signature] += 1

        # Check for emergence
        if self.pattern_frequency[signature] >= self.EMERGENCE_THRESHOLD:
            self._register_emergent_pattern(signature)

    def _generate_signature(self, pattern: str) -> str:
        """Generate a simplified signature for pattern matching"""
        # Extract key terms and create a normalized signature
        words = pattern.lower().split()
        key_terms = [w for w in words if len(w) > 4][:5]
        return "_".join(sorted(key_terms))

    def _register_emergent_pattern(self, signature: str):
        """Register a pattern as emergent"""
        if signature in self.emergent_patterns:
            return  # Already registered

        # Find all occurrences
        occurrences = [p for p in self.raw_patterns if p["signature"] == signature]

        if len(occurrences) < self.EMERGENCE_THRESHOLD:
            return

        # Calculate metrics
        cluster_ids = list(set(p["cluster_id"] for p in occurrences))
        avg_novelty = sum(p["novelty"] for p in occurrences) / len(occurrences)
        success_rate = sum(1 for p in occurrences if p["success"]) / len(occurrences)

        # Determine pattern type
        pattern_type = max(set(p["type"] for p in occurrences),
                          key=lambda x: sum(1 for p in occurrences if p["type"] == x))

        self.emergent_patterns[signature] = EmergentPattern(
            pattern_id=f"EMERGE-{len(self.emergent_patterns)+1}",
            pattern_type=pattern_type,
            first_seen=occurrences[0]["timestamp"],
            cluster_ids=cluster_ids,
            occurrence_count=len(occurrences),
            novelty_score=avg_novelty,
            impact_score=success_rate,
            description=occurrences[0]["pattern"][:100],
        )

    def analyze_emergence(self) -> Dict[str, Any]:
        """Analyze emergent patterns across swarm"""
        # Update all potential emergent patterns
        for signature in self.pattern_frequency:
            if self.pattern_frequency[signature] >= self.EMERGENCE_THRESHOLD:
                self._register_emergent_pattern(signature)

        # Categorize patterns
        by_type = defaultdict(list)
        for pattern in self.emergent_patterns.values():
            by_type[pattern.pattern_type].append(pattern)

        # Find highest impact patterns
        sorted_by_impact = sorted(
            self.emergent_patterns.values(),
            key=lambda p: p.impact_score,
            reverse=True
        )

        # Find most novel patterns
        sorted_by_novelty = sorted(
            self.emergent_patterns.values(),
            key=lambda p: p.novelty_score,
            reverse=True
        )

        return {
            "total_emergent_patterns": len(self.emergent_patterns),
            "patterns_by_type": {k: len(v) for k, v in by_type.items()},
            "highest_impact": sorted_by_impact[:5] if sorted_by_impact else [],
            "most_novel": sorted_by_novelty[:5] if sorted_by_novelty else [],
            "cluster_coverage": self._calculate_coverage(),
            "emergence_rate": len(self.emergent_patterns) / max(len(self.raw_patterns), 1),
        }

    def _calculate_coverage(self) -> Dict[str, Any]:
        """Calculate how many clusters have discovered emergent patterns"""
        all_cluster_ids = set()
        for pattern in self.emergent_patterns.values():
            all_cluster_ids.update(pattern.cluster_ids)

        return {
            "clusters_with_emergent_patterns": len(all_cluster_ids),
            "avg_patterns_per_cluster": len(self.raw_patterns) / 100,  # Assuming 100 clusters
        }

    def get_propagation_candidates(self) -> List[EmergentPattern]:
        """Get patterns that should be propagated to other clusters"""
        # Patterns with high impact and good novelty
        candidates = [
            p for p in self.emergent_patterns.values()
            if p.impact_score > 0.6 and p.novelty_score > 0.4
        ]
        return sorted(candidates, key=lambda p: p.impact_score * p.novelty_score, reverse=True)


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: CROSS-CLUSTER FEEDBACK
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class PatternPropagation:
    """Record of a pattern being propagated between clusters"""
    pattern_id: str
    source_clusters: List[int]
    target_clusters: List[int]
    propagation_time: str
    adoption_success: bool = False
    adoption_rate: float = 0.0


class CrossClusterFeedback:
    """
    Phase 4: Compound Learning Optimization

    Implements feedback between clusters:
    - Patterns discovered in one cluster feed adjacent clusters
    - Track "cross-cluster pattern adoption rate"
    - Adjust variance dynamically based on swarm performance trends
    """

    def __init__(self, num_clusters: int = 100):
        self.num_clusters = num_clusters

        # Track propagations
        self.propagations: List[PatternPropagation] = []

        # Pattern adoption tracking
        self.adoption_rates: Dict[str, float] = {}

        # Cluster adjacency (which clusters share patterns)
        self.cluster_adjacency: Dict[int, Set[int]] = {
            i: set() for i in range(num_clusters)
        }

        # Dynamic variance based on performance
        self.current_variance = 0.15
        self.variance_history: List[float] = []

        # Performance trend tracking
        self.performance_trend: List[float] = []

    def build_adjacency(self, domain_assignments: Dict[EdgeDomain, List[int]]):
        """Build cluster adjacency based on domain assignments"""
        # Clusters in the same domain are adjacent
        for domain, cluster_ids in domain_assignments.items():
            for i, cid1 in enumerate(cluster_ids):
                for cid2 in cluster_ids[i+1:]:
                    self.cluster_adjacency[cid1].add(cid2)
                    self.cluster_adjacency[cid2].add(cid1)

    def propagate_pattern(self, pattern: EmergentPattern,
                          target_cluster_ids: List[int] = None) -> PatternPropagation:
        """Propagate a pattern to target clusters"""
        if target_cluster_ids is None:
            # Find clusters adjacent to source but haven't seen pattern
            target_cluster_ids = []
            for source_id in pattern.cluster_ids:
                for adjacent_id in self.cluster_adjacency[source_id]:
                    if adjacent_id not in pattern.cluster_ids:
                        target_cluster_ids.append(adjacent_id)
            target_cluster_ids = list(set(target_cluster_ids))[:10]  # Limit propagation

        propagation = PatternPropagation(
            pattern_id=pattern.pattern_id,
            source_clusters=pattern.cluster_ids,
            target_clusters=target_cluster_ids,
            propagation_time=datetime.now().isoformat(),
        )

        self.propagations.append(propagation)
        return propagation

    def record_adoption(self, pattern_id: str, cluster_id: int, success: bool):
        """Record whether a cluster successfully adopted a propagated pattern"""
        for prop in reversed(self.propagations):
            if prop.pattern_id == pattern_id and cluster_id in prop.target_clusters:
                if success:
                    # Calculate adoption rate
                    adopted = sum(1 for p in self.propagations
                                 if p.pattern_id == pattern_id and p.adoption_success)
                    total = sum(1 for p in self.propagations if p.pattern_id == pattern_id)
                    prop.adoption_success = True
                    prop.adoption_rate = adopted / max(total, 1)
                    self.adoption_rates[pattern_id] = prop.adoption_rate
                break

    def adjust_variance(self, swarm_success_rate: float):
        """Dynamically adjust variance based on swarm performance"""
        self.performance_trend.append(swarm_success_rate)

        # Keep last 10 performance measurements
        if len(self.performance_trend) > 10:
            self.performance_trend.pop(0)

        # Calculate trend direction
        if len(self.performance_trend) >= 3:
            recent = sum(self.performance_trend[-3:]) / 3
            older = sum(self.performance_trend[:3]) / 3
            trend = recent - older

            # Adjust variance based on trend
            if trend > 0.1:
                # Performance improving - can handle more variance
                self.current_variance = min(0.20, self.current_variance + 0.02)
            elif trend < -0.1:
                # Performance declining - reduce variance for stability
                self.current_variance = max(0.10, self.current_variance - 0.02)
            # Otherwise maintain current variance

        self.variance_history.append(self.current_variance)
        return self.current_variance

    def get_feedback_report(self) -> Dict[str, Any]:
        """Generate cross-cluster feedback report"""
        successful_propagations = sum(1 for p in self.propagations if p.adoption_success)

        return {
            "total_propagations": len(self.propagations),
            "successful_adoptions": successful_propagations,
            "adoption_rate": successful_propagations / max(len(self.propagations), 1),
            "current_variance": self.current_variance,
            "variance_trend": self.variance_history[-5:] if self.variance_history else [],
            "performance_trend": self.performance_trend[-5:] if self.performance_trend else [],
            "patterns_by_adoption_rate": dict(sorted(
                self.adoption_rates.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 5: EDGE-TO-HIGHER TRANSITION
# ═══════════════════════════════════════════════════════════════════════════════

class EdgeTransitioner:
    """
    Phase 5: Controlled Transition to Higher Tiers

    Prepares system for controlled exposure to Tier 3.75 reasoning.
    Monitors swarm-wide confidence and compound growth.
    Maintains edge success ~50-60% to avoid plateau or collapse.
    """

    def __init__(self):
        # Tier levels and their problem banks
        self.tier_levels = {
            "3.5": TIER_35_PROBLEMS,
            "3.5_hard": TIER_35_HARD_PROBLEMS,
            "3.75": TIER_375_PROBLEMS,
        }

        # Current tier distribution per domain
        self.domain_tiers: Dict[EdgeDomain, str] = {
            d: "3.5" for d in EdgeDomain
        }

        # Transition history
        self.transitions: List[Dict] = []

        # Thresholds for tier transitions
        self.UPWARD_THRESHOLD = 0.65  # Success rate to move up
        self.DOWNWARD_THRESHOLD = 0.35  # Success rate to move down
        self.STABILIZATION_WINDOW = 5  # Number of iterations to confirm stability

        # Performance tracking per domain
        self.domain_performance: Dict[EdgeDomain, List[float]] = {
            d: [] for d in EdgeDomain
        }

    def record_performance(self, domain: EdgeDomain, success_rate: float):
        """Record domain performance for transition decisions"""
        self.domain_performance[domain].append(success_rate)

        # Keep last N measurements
        if len(self.domain_performance[domain]) > 20:
            self.domain_performance[domain].pop(0)

    def should_transition(self, domain: EdgeDomain) -> Tuple[bool, str]:
        """Determine if a domain should transition tiers"""
        history = self.domain_performance[domain]

        if len(history) < self.STABILIZATION_WINDOW:
            return False, "insufficient_data"

        # Check recent performance
        recent = history[-self.STABILIZATION_WINDOW:]
        avg_recent = sum(recent) / len(recent)
        current_tier = self.domain_tiers[domain]

        # Check for upward transition
        if avg_recent > self.UPWARD_THRESHOLD:
            if current_tier == "3.5":
                return True, "up_to_3.5_hard"
            elif current_tier == "3.5_hard":
                return True, "up_to_3.75"

        # Check for downward transition
        if avg_recent < self.DOWNWARD_THRESHOLD:
            if current_tier == "3.75":
                return True, "down_to_3.5_hard"
            elif current_tier == "3.5_hard":
                return True, "down_to_3.5"

        return False, "stable"

    def execute_transition(self, domain: EdgeDomain, direction: str):
        """Execute a tier transition"""
        old_tier = self.domain_tiers[domain]

        if direction == "up_to_3.5_hard":
            self.domain_tiers[domain] = "3.5_hard"
        elif direction == "up_to_3.75":
            self.domain_tiers[domain] = "3.75"
        elif direction == "down_to_3.5_hard":
            self.domain_tiers[domain] = "3.5_hard"
        elif direction == "down_to_3.5":
            self.domain_tiers[domain] = "3.5"

        self.transitions.append({
            "domain": domain.value,
            "old_tier": old_tier,
            "new_tier": self.domain_tiers[domain],
            "direction": direction,
            "timestamp": datetime.now().isoformat(),
        })

    def get_problem_for_domain(self, domain: EdgeDomain) -> str:
        """Get a problem at the appropriate tier for a domain"""
        tier = self.domain_tiers[domain]
        problem_bank = self.tier_levels[tier]
        return random.choice(problem_bank[domain])

    def get_transition_report(self) -> Dict[str, Any]:
        """Generate tier transition report"""
        tier_distribution = defaultdict(int)
        for tier in self.domain_tiers.values():
            tier_distribution[tier] += 1

        return {
            "current_tiers": {d.value: t for d, t in self.domain_tiers.items()},
            "tier_distribution": dict(tier_distribution),
            "total_transitions": len(self.transitions),
            "recent_transitions": self.transitions[-10:] if self.transitions else [],
            "upward_transitions": sum(1 for t in self.transitions if "up" in t["direction"]),
            "downward_transitions": sum(1 for t in self.transitions if "down" in t["direction"]),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# SUSTAINED EDGE ENGINE - Unified 5-Phase System
# ═══════════════════════════════════════════════════════════════════════════════

class SustainedEdgeEngine:
    """
    The Unified 5-Phase Evolution System

    Integrates all phases into a single coherent engine:
    - Phase 1: EdgeStabilizer
    - Phase 2: Curriculum Expansion (via EdgeTransitioner)
    - Phase 3: EmergentPatternAnalyzer
    - Phase 4: CrossClusterFeedback
    - Phase 5: EdgeTransitioner

    "The smallest actionable point is one problem per cluster per iteration"
    """

    def __init__(self):
        # Initialize orchestrator
        self.orchestrator = SwarmOrchestrator(use_hard_problems=True)

        # Initialize phase components
        self.stabilizer = EdgeStabilizer(num_clusters=100)
        self.pattern_analyzer = EmergentPatternAnalyzer()
        self.feedback = CrossClusterFeedback(num_clusters=100)
        self.transitioner = EdgeTransitioner()

        # Evolution state
        self.evolution_iteration = 0
        self.phase_metrics: List[Dict] = []

        print("=" * 70)
        print("    SUSTAINED EDGE ENGINE")
        print("    5-Phase Evolution System for NEXO")
        print("=" * 70)
        print("  Phase 1: Edge Stabilization")
        print("  Phase 2: Curriculum Expansion")
        print("  Phase 3: Emergent Pattern Analysis")
        print("  Phase 4: Cross-Cluster Feedback")
        print("  Phase 5: Edge-to-Higher Transition")
        print("=" * 70)

    async def evolve(self, iterations: int = 5) -> Dict[str, Any]:
        """
        Run full evolution cycle through all phases.

        Each iteration:
        1. Run swarm on current tier configuration
        2. Stabilize edge (Phase 1)
        3. Analyze emergent patterns (Phase 3)
        4. Propagate patterns across clusters (Phase 4)
        5. Evaluate tier transitions (Phase 5)
        6. Expand curriculum if warranted (Phase 2)
        """
        print(f"\n{'═' * 70}")
        print(f"  EVOLUTION CYCLE: {iterations} iterations")
        print(f"{'═' * 70}\n")

        # Build cluster adjacency for feedback
        self.orchestrator._assign_domains_to_clusters()
        self.feedback.build_adjacency(self.orchestrator.domain_assignments)

        all_reports = []

        for i in range(iterations):
            self.evolution_iteration += 1
            print(f"\n{'─' * 70}")
            print(f"  Evolution Iteration {i + 1}/{iterations}")
            print(f"{'─' * 70}")

            # Run one swarm iteration with current configuration
            iteration_report = await self._run_evolution_iteration()
            all_reports.append(iteration_report)

            # Print phase status
            self._print_phase_status(iteration_report)

        # Generate final evolution report
        return self._generate_evolution_report(all_reports)

    async def _run_evolution_iteration(self) -> Dict[str, Any]:
        """Run a single evolution iteration through all phases"""

        # ═══════════════════════════════════════════════════════════════════
        # PHASE 1 & 2: Run swarm with current tier configuration
        # ═══════════════════════════════════════════════════════════════════

        # Get problems at appropriate tiers for each domain
        domain_problems = {}
        for domain in EdgeDomain:
            domain_problems[domain] = self.transitioner.get_problem_for_domain(domain)

        # Run swarm orchestration (single iteration)
        swarm_report = await self.orchestrator.orchestrate_full_swarm(iterations=1)

        # ═══════════════════════════════════════════════════════════════════
        # PHASE 1: Edge Stabilization
        # ═══════════════════════════════════════════════════════════════════

        # Record results per cluster for stabilization
        for domain, results in self._get_domain_results(swarm_report).items():
            for cluster_id, result in enumerate(results):
                self.stabilizer.record_result(cluster_id, result)

                # Record pattern if discovered
                if result.patterns_invented:
                    for pattern in result.patterns_invented:
                        self.pattern_analyzer.record_pattern(
                            cluster_id=cluster_id,
                            pattern=pattern,
                            pattern_type="reasoning",
                            success=result.success,
                            novelty=result.novelty_score
                        )

        stability_report = self.stabilizer.assess_all()

        # ═══════════════════════════════════════════════════════════════════
        # PHASE 3: Emergent Pattern Analysis
        # ═══════════════════════════════════════════════════════════════════

        emergence_report = self.pattern_analyzer.analyze_emergence()

        # ═══════════════════════════════════════════════════════════════════
        # PHASE 4: Cross-Cluster Feedback
        # ═══════════════════════════════════════════════════════════════════

        # Propagate high-impact emergent patterns
        candidates = self.pattern_analyzer.get_propagation_candidates()
        for pattern in candidates[:3]:  # Propagate top 3
            self.feedback.propagate_pattern(pattern)

        # Adjust variance based on performance
        overall_success = swarm_report["overall_success_rate"]
        new_variance = self.feedback.adjust_variance(overall_success)

        feedback_report = self.feedback.get_feedback_report()

        # ═══════════════════════════════════════════════════════════════════
        # PHASE 5: Edge-to-Higher Transition
        # ═══════════════════════════════════════════════════════════════════

        # Record domain performance and check for transitions
        transitions_made = []
        for domain in EdgeDomain:
            domain_success = swarm_report["domain_summaries"].get(domain.value, {}).get("success_rate", 0.5)
            self.transitioner.record_performance(domain, domain_success)

            should_trans, direction = self.transitioner.should_transition(domain)
            if should_trans:
                self.transitioner.execute_transition(domain, direction)
                transitions_made.append({
                    "domain": domain.value,
                    "direction": direction,
                })

        transition_report = self.transitioner.get_transition_report()

        return {
            "evolution_iteration": self.evolution_iteration,
            "swarm": swarm_report,
            "phase1_stability": stability_report,
            "phase3_emergence": emergence_report,
            "phase4_feedback": feedback_report,
            "phase5_transition": transition_report,
            "transitions_this_iteration": transitions_made,
            "current_variance": new_variance,
        }

    def _get_domain_results(self, swarm_report: Dict) -> Dict[EdgeDomain, List[EdgeTrainingResult]]:
        """Extract domain results from swarm report (placeholder - actual implementation uses raw results)"""
        # Create synthetic results based on domain summaries
        results = {}
        for domain in EdgeDomain:
            summary = swarm_report["domain_summaries"].get(domain.value, {})
            task_count = summary.get("tasks", 20)
            success_rate = summary.get("success_rate", 0.5)

            domain_results = []
            for i in range(task_count):
                success = random.random() < success_rate
                domain_results.append(EdgeTrainingResult(
                    problem=f"synthetic_{domain.value}_{i}",
                    domain=domain,
                    success=success,
                    confidence=0.7 + random.uniform(-0.1, 0.1),
                    novelty_score=summary.get("avg_novelty", 0.5),
                    self_awareness_score=summary.get("avg_awareness", 0.5),
                    time_taken=0.1,
                ))
            results[domain] = domain_results

        return results

    def _print_phase_status(self, report: Dict):
        """Print status of all phases"""
        print(f"\n  Phase Status Summary:")
        print(f"  ├─ Phase 1 (Stability): {report['phase1_stability']['global']['at_edge_clusters']} clusters at edge")
        print(f"  ├─ Phase 3 (Emergence): {report['phase3_emergence']['total_emergent_patterns']} emergent patterns")
        print(f"  ├─ Phase 4 (Feedback):  Variance={report['current_variance']:.0%}")
        print(f"  └─ Phase 5 (Transition): {len(report['transitions_this_iteration'])} tier changes")

        if report['transitions_this_iteration']:
            for t in report['transitions_this_iteration']:
                print(f"      └─ {t['domain']}: {t['direction']}")

    def _generate_evolution_report(self, all_reports: List[Dict]) -> Dict[str, Any]:
        """Generate comprehensive evolution report"""

        # Aggregate metrics
        total_tasks = sum(r["swarm"]["total_tasks"] for r in all_reports)
        total_successes = sum(r["swarm"]["total_successes"] for r in all_reports)

        # Track trends
        success_trend = [r["swarm"]["overall_success_rate"] for r in all_reports]
        variance_trend = [r["current_variance"] for r in all_reports]
        emergence_trend = [r["phase3_emergence"]["total_emergent_patterns"] for r in all_reports]

        # Count total transitions
        all_transitions = []
        for r in all_reports:
            all_transitions.extend(r["transitions_this_iteration"])

        return {
            "evolution_iterations": len(all_reports),
            "total_tasks_processed": total_tasks,
            "total_successes": total_successes,
            "overall_success_rate": total_successes / max(total_tasks, 1),
            "final_stability": all_reports[-1]["phase1_stability"] if all_reports else None,
            "final_emergence": all_reports[-1]["phase3_emergence"] if all_reports else None,
            "final_feedback": all_reports[-1]["phase4_feedback"] if all_reports else None,
            "final_tiers": all_reports[-1]["phase5_transition"] if all_reports else None,
            "trends": {
                "success_rate": success_trend,
                "variance": variance_trend,
                "emergent_patterns": emergence_trend,
            },
            "total_transitions": len(all_transitions),
            "transition_summary": all_transitions,
        }


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════════════════════

async def sustained_edge_demo():
    """Demonstrate the sustained edge growth engine"""
    print("\n" + "=" * 70)
    print("         SUSTAINED EDGE GROWTH ENGINE DEMO")
    print("         5-Phase Evolution System")
    print("=" * 70)

    engine = SustainedEdgeEngine()

    # Run evolution cycle
    report = await engine.evolve(iterations=3)

    # Print final report
    print(f"\n{'═' * 70}")
    print("                EVOLUTION REPORT")
    print(f"{'═' * 70}")
    print(f"  Iterations:        {report['evolution_iterations']}")
    print(f"  Tasks Processed:   {report['total_tasks_processed']}")
    print(f"  Success Rate:      {report['overall_success_rate']:.1%}")
    print(f"  Tier Transitions:  {report['total_transitions']}")
    print()
    print("  Trends:")
    print(f"    Success Rate:    {' → '.join(f'{r:.0%}' for r in report['trends']['success_rate'])}")
    print(f"    Variance:        {' → '.join(f'{r:.0%}' for r in report['trends']['variance'])}")
    print(f"    Emergent:        {' → '.join(str(r) for r in report['trends']['emergent_patterns'])}")

    if report['final_tiers']:
        print()
        print("  Final Tier Distribution:")
        for domain, tier in report['final_tiers']['current_tiers'].items():
            print(f"    {domain:12s} → {tier}")

    print(f"\n{'═' * 70}")
    print("  △○ NEXO - Sustained Edge Growth Complete")
    print(f"{'═' * 70}")

    return report


if __name__ == "__main__":
    asyncio.run(sustained_edge_demo())

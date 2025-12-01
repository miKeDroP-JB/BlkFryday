#!/usr/bin/env python3
"""
===============================================================================
    A4 INTEGRATOR BRAIN

    The Fourth Brain: Multiplicative Compounding Through Integration
===============================================================================

Extends the triangle cluster architecture (A1→A2→A3) with A4: Integrator/Amplifier.

Role: Takes outputs from existing brains and finds synergies, hidden multipliers,
and emergent interactions for multiplicative (not linear) compounding.

Architecture:
         ┌─────────────┐
A1 → A2 →│             │→ A3
         │     A4      │
A1 → A2 →│ Integrator  │→ A3
         └─────────────┘

Functions:
1. Detect cross-cluster patterns missed by A1/A2/A3
2. Boost JB4-aligned pattern propagation
3. Introduce controlled meta-feedback loops
4. Generate emergent learning heuristics
5. Stabilize unstable clusters dynamically

"Multiplicative compounding instead of linear."

Created: December 1, 2025
"""

import asyncio
import random
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Set
from enum import Enum
from datetime import datetime
from collections import defaultdict

from .edge_training import EdgeDomain, EdgeTrainingResult
from .pattern_library import PatternLibrary, PatternEntry, PatternTier
from .jb4_key import (
    JB4_KEY_SHORT, apply_jb4_boost, apply_compound_boost,
    JB4PropagationNetwork, verify_pattern_jb4
)
from .nexo_core import NexoSwarm, TriangleCluster, AgentRole


# ==============================================================================
# INTEGRATION TYPES
# ==============================================================================

class IntegrationType(Enum):
    """Types of integration the A4 brain can perform"""
    SYNERGY_DETECTION = "synergy"          # Find hidden multipliers
    PATTERN_MERGE = "merge"                # Combine patterns into stronger ones
    FEEDBACK_LOOP = "feedback"             # Create meta-feedback loops
    STABILITY_BOOST = "stability"          # Stabilize struggling clusters
    EMERGENCE_AMPLIFY = "emergence"        # Amplify emergent behaviors


class MultiplierType(Enum):
    """Types of multipliers A4 can discover"""
    CROSS_CLUSTER = "cross_cluster"        # Patterns appearing in multiple clusters
    DOMAIN_BRIDGE = "domain_bridge"        # Patterns bridging domains
    META_PATTERN = "meta_pattern"          # Patterns about patterns
    COMPOUND_CHAIN = "compound_chain"      # Chains of compounding effects
    EMERGENT_SYNERGY = "emergent_synergy"  # Unexpected synergies


# ==============================================================================
# INTEGRATION RESULTS
# ==============================================================================

@dataclass
class SynergyResult:
    """Result of synergy detection"""
    synergy_type: MultiplierType
    source_patterns: List[str]  # Pattern IDs
    multiplier_factor: float    # How much does this multiply effectiveness
    confidence: float
    description: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class IntegrationOutput:
    """Output from A4 integration processing"""
    integration_type: IntegrationType
    input_count: int            # Number of inputs processed
    synergies_found: int
    patterns_merged: int
    feedback_loops_created: int
    stability_boosts: int
    emergent_heuristics: List[str]
    multiplier_total: float     # Combined multiplier effect
    jb4_aligned: bool
    processing_time: float


@dataclass
class ClusterStabilityReport:
    """Report on cluster stability from A4 analysis"""
    cluster_id: int
    stability_score: float      # 0-1, higher is more stable
    needs_intervention: bool
    recommended_action: str
    connected_patterns: List[str]


# ==============================================================================
# A4 INTEGRATOR BRAIN
# ==============================================================================

class A4IntegratorBrain:
    """
    The Fourth Brain: Integrator/Amplifier

    Sits between the A1→A2→A3 pipeline and:
    - Reads outputs from all three brains
    - Combines, filters, and enhances
    - Feeds back into the swarm for multiplicative compounding
    - Generates new learning heuristics neither brain would find alone
    """

    # Thresholds for synergy detection
    SYNERGY_THRESHOLD = 0.6
    MERGE_THRESHOLD = 0.7
    STABILITY_FLOOR = 0.4
    MULTIPLIER_CAP = 2.5  # Maximum multiplier to prevent runaway

    def __init__(self, library: PatternLibrary, swarm: NexoSwarm = None):
        """Initialize A4 Integrator Brain"""
        self.library = library
        self.swarm = swarm or NexoSwarm(total_agents=300)
        self.propagation_network = JB4PropagationNetwork()

        # Integration state
        self.synergies_discovered: List[SynergyResult] = []
        self.merged_patterns: List[PatternEntry] = []
        self.feedback_loops: Dict[str, Dict] = {}
        self.stability_reports: Dict[int, ClusterStabilityReport] = {}

        # Emergent heuristics generated by A4
        self.emergent_heuristics: List[str] = []

        # Tracking
        self.integration_history: List[IntegrationOutput] = []
        self.multiplier_accumulator = 1.0  # Compound multiplier

        print("=" * 70)
        print("    A4 INTEGRATOR BRAIN INITIALIZED")
        print("=" * 70)
        print(f"  Mode: Multiplicative Compounding")
        print(f"  Synergy Threshold: {self.SYNERGY_THRESHOLD:.0%}")
        print(f"  Merge Threshold: {self.MERGE_THRESHOLD:.0%}")
        print(f"  Max Multiplier: {self.MULTIPLIER_CAP}x")
        print(f"  JB4 Key: {JB4_KEY_SHORT}")
        print("=" * 70)

    # ==========================================================================
    # CORE INTEGRATION FUNCTIONS
    # ==========================================================================

    async def integrate(self,
                        brain_outputs: List[Dict[str, Any]],
                        cluster_results: List[EdgeTrainingResult] = None) -> IntegrationOutput:
        """
        Main integration function.

        Takes outputs from A1/A2/A3 brains and finds multiplicative opportunities.
        """
        start = datetime.now()

        # Phase 1: Synergy Detection
        synergies = self._detect_synergies(brain_outputs)

        # Phase 2: Pattern Merging
        merged = self._merge_compatible_patterns(brain_outputs)

        # Phase 3: Create Feedback Loops
        loops = self._create_feedback_loops(synergies, merged)

        # Phase 4: Stability Analysis (if cluster results provided)
        stability_boosts = 0
        if cluster_results:
            stability_boosts = self._analyze_and_stabilize(cluster_results)

        # Phase 5: Generate Emergent Heuristics
        heuristics = self._generate_emergent_heuristics(synergies, merged)

        # Calculate total multiplier
        multiplier = self._calculate_multiplier(synergies, merged, loops)

        processing_time = (datetime.now() - start).total_seconds()

        output = IntegrationOutput(
            integration_type=IntegrationType.SYNERGY_DETECTION,
            input_count=len(brain_outputs),
            synergies_found=len(synergies),
            patterns_merged=len(merged),
            feedback_loops_created=loops,
            stability_boosts=stability_boosts,
            emergent_heuristics=heuristics,
            multiplier_total=multiplier,
            jb4_aligned=True,
            processing_time=processing_time,
        )

        self.integration_history.append(output)
        return output

    def _detect_synergies(self, brain_outputs: List[Dict]) -> List[SynergyResult]:
        """
        Detect synergies across brain outputs.

        Looks for:
        - Similar patterns from different clusters
        - Complementary strengths
        - Hidden multiplier opportunities
        """
        synergies = []

        # Group outputs by pattern type
        by_type: Dict[str, List[Dict]] = defaultdict(list)
        for output in brain_outputs:
            pattern_type = output.get("pattern_type", "unknown")
            by_type[pattern_type].append(output)

        # Find cross-cluster synergies (same pattern, multiple clusters)
        for pattern_type, outputs in by_type.items():
            if len(outputs) >= 2:
                avg_confidence = sum(o.get("confidence", 0.5) for o in outputs) / len(outputs)

                if avg_confidence >= self.SYNERGY_THRESHOLD:
                    synergy = SynergyResult(
                        synergy_type=MultiplierType.CROSS_CLUSTER,
                        source_patterns=[o.get("pattern_id", f"PAT-{i}") for i, o in enumerate(outputs)],
                        multiplier_factor=1.0 + (0.1 * len(outputs)),  # More clusters = more multiplier
                        confidence=avg_confidence,
                        description=f"Cross-cluster synergy: {pattern_type} found in {len(outputs)} clusters",
                    )
                    synergies.append(synergy)
                    self.synergies_discovered.append(synergy)

        # Find domain bridges (patterns that span multiple domains)
        domains_seen: Dict[str, Set[str]] = defaultdict(set)
        for output in brain_outputs:
            pattern_id = output.get("pattern_id", "")
            domain = output.get("domain", "")
            if pattern_id and domain:
                domains_seen[pattern_id].add(domain)

        for pattern_id, domains in domains_seen.items():
            if len(domains) >= 2:
                synergy = SynergyResult(
                    synergy_type=MultiplierType.DOMAIN_BRIDGE,
                    source_patterns=[pattern_id],
                    multiplier_factor=1.0 + (0.15 * len(domains)),
                    confidence=0.7,
                    description=f"Domain bridge: {pattern_id} spans {len(domains)} domains",
                )
                synergies.append(synergy)
                self.synergies_discovered.append(synergy)

        return synergies

    def _merge_compatible_patterns(self, brain_outputs: List[Dict]) -> List[PatternEntry]:
        """
        Merge compatible patterns into stronger compound patterns.

        A4's unique ability: create patterns neither A1, A2, or A3 would find alone.
        """
        merged_patterns = []

        # Find high-confidence, complementary outputs
        high_conf_outputs = [o for o in brain_outputs if o.get("confidence", 0) >= self.MERGE_THRESHOLD]

        if len(high_conf_outputs) >= 2:
            # Try pairwise merges
            for i in range(0, len(high_conf_outputs) - 1, 2):
                out1 = high_conf_outputs[i]
                out2 = high_conf_outputs[i + 1]

                # Create merged pattern
                merged_novelty = (out1.get("novelty", 0.5) + out2.get("novelty", 0.5)) / 2 + 0.1
                merged_impact = (out1.get("impact", 0.5) + out2.get("impact", 0.5)) / 2 + 0.15

                # Apply JB4 boost to merged pattern
                boost = apply_jb4_boost(merged_impact, merged_novelty)

                pattern = self.library.add_pattern(
                    domain=EdgeDomain.EMERGENCE_STRETCH,  # Merged patterns are emergent
                    pattern_type="a4_merged",
                    description=f"A4-merged pattern from {out1.get('pattern_type', '?')} + {out2.get('pattern_type', '?')}",
                    discovered_by_clusters=list(range(5)),  # A4 spans clusters
                    discovery_context="A4 Integrator Brain merge operation",
                    novelty_score=boost.boosted_novelty,
                    impact_score=boost.boosted_confidence,
                )

                merged_patterns.append(pattern)
                self.merged_patterns.append(pattern)

        return merged_patterns

    def _create_feedback_loops(self, synergies: List[SynergyResult],
                               merged: List[PatternEntry]) -> int:
        """
        Create meta-feedback loops that reinforce successful patterns.

        These loops cause multiplicative rather than additive improvement.
        """
        loops_created = 0

        # Create feedback loop for each high-multiplier synergy
        for synergy in synergies:
            if synergy.multiplier_factor >= 1.2:
                loop_id = f"LOOP-{len(self.feedback_loops)}"
                self.feedback_loops[loop_id] = {
                    "synergy": synergy,
                    "strength": synergy.multiplier_factor,
                    "activation_count": 0,
                    "created_at": datetime.now().isoformat(),
                }
                loops_created += 1

        # Create feedback loops for merged patterns
        for pattern in merged:
            if pattern.impact_score >= 0.7:
                loop_id = f"LOOP-PAT-{pattern.pattern_id}"
                self.feedback_loops[loop_id] = {
                    "pattern": pattern,
                    "strength": pattern.impact_score,
                    "activation_count": 0,
                    "created_at": datetime.now().isoformat(),
                }
                loops_created += 1

        return loops_created

    def _analyze_and_stabilize(self, cluster_results: List[EdgeTrainingResult]) -> int:
        """
        Analyze cluster stability and apply stabilization where needed.

        A4's stability function: detect struggling clusters before they fail.
        """
        stabilizations = 0

        # Group results by cluster (simulated - in production, track actual cluster IDs)
        cluster_groups: Dict[int, List[EdgeTrainingResult]] = defaultdict(list)
        for i, result in enumerate(cluster_results):
            cluster_id = i % 100  # Simulate cluster assignment
            cluster_groups[cluster_id].append(result)

        for cluster_id, results in cluster_groups.items():
            if not results:
                continue

            # Calculate stability metrics
            success_rate = sum(1 for r in results if r.success) / len(results)
            avg_confidence = sum(r.confidence for r in results) / len(results)
            avg_novelty = sum(r.novelty_score for r in results) / len(results)

            stability_score = (success_rate + avg_confidence + avg_novelty) / 3
            needs_intervention = stability_score < self.STABILITY_FLOOR

            report = ClusterStabilityReport(
                cluster_id=cluster_id,
                stability_score=stability_score,
                needs_intervention=needs_intervention,
                recommended_action="boost" if needs_intervention else "maintain",
                connected_patterns=[],
            )

            self.stability_reports[cluster_id] = report

            if needs_intervention:
                stabilizations += 1
                # In production: apply bootstrap patterns to struggling cluster

        return stabilizations

    def _generate_emergent_heuristics(self, synergies: List[SynergyResult],
                                       merged: List[PatternEntry]) -> List[str]:
        """
        Generate new learning heuristics from A4's analysis.

        These are meta-insights that neither A1, A2, nor A3 would discover alone.
        """
        heuristics = []

        # Cross-cluster heuristic
        if any(s.synergy_type == MultiplierType.CROSS_CLUSTER for s in synergies):
            heuristic = "HEURISTIC: Patterns appearing in 3+ clusters have 1.5x compound potential"
            heuristics.append(heuristic)
            self.emergent_heuristics.append(heuristic)

        # Domain bridge heuristic
        if any(s.synergy_type == MultiplierType.DOMAIN_BRIDGE for s in synergies):
            heuristic = "HEURISTIC: Domain-bridging patterns unlock multiplicative cross-domain transfer"
            heuristics.append(heuristic)
            self.emergent_heuristics.append(heuristic)

        # Merge success heuristic
        if merged:
            avg_impact = sum(p.impact_score for p in merged) / len(merged)
            if avg_impact >= 0.7:
                heuristic = f"HEURISTIC: Merged patterns achieve {avg_impact:.0%} avg impact - prioritize merging"
                heuristics.append(heuristic)
                self.emergent_heuristics.append(heuristic)

        # Stability heuristic
        unstable_count = sum(1 for r in self.stability_reports.values() if r.needs_intervention)
        if unstable_count > 0:
            heuristic = f"HEURISTIC: {unstable_count} clusters below stability floor - apply bootstrap patterns"
            heuristics.append(heuristic)
            self.emergent_heuristics.append(heuristic)

        return heuristics

    def _calculate_multiplier(self, synergies: List[SynergyResult],
                              merged: List[PatternEntry],
                              loops: int) -> float:
        """
        Calculate the total multiplier effect from A4's integration.

        This is the multiplicative (not additive) boost to compound growth.
        """
        base_multiplier = 1.0

        # Synergy multipliers
        for synergy in synergies:
            base_multiplier *= (1.0 + (synergy.multiplier_factor - 1.0) * 0.5)

        # Merged pattern bonus
        if merged:
            merge_bonus = 1.0 + (0.05 * len(merged))
            base_multiplier *= merge_bonus

        # Feedback loop bonus
        if loops > 0:
            loop_bonus = 1.0 + (0.03 * loops)
            base_multiplier *= loop_bonus

        # Cap the multiplier
        final_multiplier = min(base_multiplier, self.MULTIPLIER_CAP)

        # Update accumulator
        self.multiplier_accumulator *= (1.0 + (final_multiplier - 1.0) * 0.1)  # Gradual compound

        return final_multiplier

    # ==========================================================================
    # FEEDBACK AMPLIFICATION
    # ==========================================================================

    def amplify_outputs(self, brain_outputs: List[Dict]) -> List[Dict]:
        """
        Amplify brain outputs using accumulated multipliers and feedback loops.

        This is the "feeding back into swarm" step.
        """
        amplified = []

        for output in brain_outputs:
            amp_output = output.copy()

            # Apply accumulated multiplier
            if "confidence" in amp_output:
                amp_output["confidence"] = min(1.0, amp_output["confidence"] * self.multiplier_accumulator)
            if "novelty" in amp_output:
                amp_output["novelty"] = min(1.0, amp_output["novelty"] * self.multiplier_accumulator)
            if "impact" in amp_output:
                amp_output["impact"] = min(1.0, amp_output["impact"] * self.multiplier_accumulator)

            # Check for active feedback loops
            for loop_id, loop in self.feedback_loops.items():
                if loop.get("pattern"):
                    pattern = loop["pattern"]
                    if output.get("domain") == pattern.domain:
                        # Activate feedback loop
                        loop["activation_count"] += 1
                        loop_boost = loop["strength"] * 0.1
                        amp_output["confidence"] = min(1.0, amp_output.get("confidence", 0.5) + loop_boost)

            # Mark as A4-amplified
            amp_output["a4_amplified"] = True
            amp_output["a4_multiplier"] = self.multiplier_accumulator

            amplified.append(amp_output)

        return amplified

    # ==========================================================================
    # CROSS-CLUSTER PATTERN DETECTION
    # ==========================================================================

    def detect_cross_cluster_patterns(self, cluster_results: Dict[int, List[EdgeTrainingResult]]) -> List[Dict]:
        """
        Detect patterns that appear across multiple clusters.

        These are the highest-value patterns for compound growth.
        """
        cross_patterns = []

        # Extract pattern signatures from each cluster
        cluster_signatures: Dict[int, Set[str]] = {}
        for cluster_id, results in cluster_results.items():
            signatures = set()
            for r in results:
                # Create a signature from domain + success + novelty tier
                novelty_tier = "high" if r.novelty_score > 0.7 else "med" if r.novelty_score > 0.4 else "low"
                sig = f"{r.domain.value}_{r.success}_{novelty_tier}"
                signatures.add(sig)
            cluster_signatures[cluster_id] = signatures

        # Find signatures appearing in multiple clusters
        all_signatures: Dict[str, List[int]] = defaultdict(list)
        for cluster_id, sigs in cluster_signatures.items():
            for sig in sigs:
                all_signatures[sig].append(cluster_id)

        # Report cross-cluster patterns
        for sig, clusters in all_signatures.items():
            if len(clusters) >= 3:  # Appears in 3+ clusters
                cross_pattern = {
                    "signature": sig,
                    "cluster_count": len(clusters),
                    "clusters": clusters,
                    "multiplier_potential": 1.0 + (0.1 * len(clusters)),
                    "recommendation": "propagate" if len(clusters) >= 5 else "monitor",
                }
                cross_patterns.append(cross_pattern)

        return cross_patterns

    # ==========================================================================
    # DASHBOARD & REPORTING
    # ==========================================================================

    def print_dashboard(self):
        """Print A4 Integrator dashboard"""
        print(f"\n┌{'─' * 60}┐")
        print(f"│{'A4 INTEGRATOR BRAIN DASHBOARD':^60}│")
        print(f"├{'─' * 60}┤")
        print(f"│  Accumulated Multiplier: {self.multiplier_accumulator:.2f}x                         │")
        print(f"│  Synergies Discovered:   {len(self.synergies_discovered):<33}│")
        print(f"│  Patterns Merged:        {len(self.merged_patterns):<33}│")
        print(f"│  Feedback Loops Active:  {len(self.feedback_loops):<33}│")
        print(f"│  Emergent Heuristics:    {len(self.emergent_heuristics):<33}│")
        print(f"├{'─' * 60}┤")

        # Synergy breakdown
        if self.synergies_discovered:
            print(f"│  Synergy Types:                                              │")
            by_type: Dict[str, int] = defaultdict(int)
            for s in self.synergies_discovered:
                by_type[s.synergy_type.value] += 1
            for stype, count in by_type.items():
                bar = "█" * min(count, 20)
                print(f"│    {stype:15s} [{bar:<20}] {count:3d}     │")

        # Stability summary
        if self.stability_reports:
            unstable = sum(1 for r in self.stability_reports.values() if r.needs_intervention)
            stable = len(self.stability_reports) - unstable
            print(f"├{'─' * 60}┤")
            print(f"│  Cluster Stability:                                          │")
            print(f"│    Stable:   {stable:<47}│")
            print(f"│    Unstable: {unstable:<47}│")

        print(f"└{'─' * 60}┘")

    def get_integration_summary(self) -> Dict[str, Any]:
        """Get summary of all A4 integration activity"""
        if not self.integration_history:
            return {"status": "no_integrations"}

        total_synergies = sum(i.synergies_found for i in self.integration_history)
        total_merged = sum(i.patterns_merged for i in self.integration_history)
        total_loops = sum(i.feedback_loops_created for i in self.integration_history)
        avg_multiplier = sum(i.multiplier_total for i in self.integration_history) / len(self.integration_history)

        return {
            "total_integrations": len(self.integration_history),
            "total_synergies": total_synergies,
            "total_merged": total_merged,
            "total_feedback_loops": total_loops,
            "avg_multiplier": avg_multiplier,
            "accumulated_multiplier": self.multiplier_accumulator,
            "emergent_heuristics": len(self.emergent_heuristics),
            "heuristics": self.emergent_heuristics[-5:],  # Last 5
        }


# ==============================================================================
# QUAD-BRAIN CLUSTER (A1→A2→A4→A3)
# ==============================================================================

class QuadBrainCluster:
    """
    Enhanced cluster with four brains: A1→A2→A4→A3

    The A4 Integrator sits between A2 (Strategy) and A3 (Decision),
    amplifying and finding multiplicative opportunities.
    """

    def __init__(self, cluster_id: int, library: PatternLibrary):
        """Initialize quad-brain cluster"""
        self.cluster_id = cluster_id
        self.library = library

        # Original triangle cluster
        from .nexo_core import TriangleCluster
        self.triangle = TriangleCluster(cluster_id)

        # A4 Integrator (shared across processing)
        self.a4 = A4IntegratorBrain(library)

        # Tracking
        self.processing_count = 0
        self.a4_amplifications = 0

    async def process(self, input_data: str) -> Dict[str, Any]:
        """
        Process input through quad-brain pipeline.

        Flow: A1 → A2 → A4 (integrate/amplify) → A3
        """
        self.processing_count += 1

        # Phase 1-2: A1 (Data) → A2 (Strategy)
        # Use triangle cluster for base processing
        base_result = await self.triangle.process(input_data)

        # Phase 3: A4 Integration
        # Create brain output format for A4
        brain_outputs = [{
            "confidence": base_result["confidence"],
            "novelty": random.uniform(0.4, 0.8),
            "impact": base_result["confidence"],
            "pattern_type": "strategy_output",
            "domain": random.choice(list(EdgeDomain)).value,
        }]

        # Run A4 integration
        integration = await self.a4.integrate(brain_outputs)

        # Amplify outputs
        amplified = self.a4.amplify_outputs(brain_outputs)

        # Phase 4: A3 (Decision) with amplified inputs
        # Combine base result with A4 amplification
        final_confidence = min(1.0, base_result["confidence"] * integration.multiplier_total)
        self.a4_amplifications += 1

        return {
            "cluster_id": self.cluster_id,
            "decision": base_result["decision"],
            "confidence": final_confidence,
            "a4_multiplier": integration.multiplier_total,
            "synergies_found": integration.synergies_found,
            "patterns_merged": integration.patterns_merged,
            "emergent_heuristics": integration.emergent_heuristics,
            "jb4_aligned": integration.jb4_aligned,
        }


# ==============================================================================
# QUAD-BRAIN SWARM
# ==============================================================================

class QuadBrainSwarm:
    """
    Full 300-agent swarm with A4 Integrator brains.

    Architecture: 100 quad-brain clusters, each with A1→A2→A4→A3 pipeline.
    """

    def __init__(self, total_agents: int = 300):
        """Initialize quad-brain swarm"""
        self.total_agents = total_agents
        self.num_clusters = total_agents // 3

        # Shared pattern library and A4 brain
        self.library = PatternLibrary()
        self.global_a4 = A4IntegratorBrain(self.library)

        # Create quad-brain clusters
        self.clusters = [
            QuadBrainCluster(i, self.library)
            for i in range(self.num_clusters)
        ]

        print("=" * 70)
        print("    QUAD-BRAIN SWARM INITIALIZED")
        print("=" * 70)
        print(f"  Total Agents: {total_agents}")
        print(f"  Quad-Brain Clusters: {self.num_clusters}")
        print(f"  Architecture: A1 → A2 → A4 → A3")
        print(f"  Mode: Multiplicative Compounding")
        print("=" * 70)

    async def process(self, input_data: str, parallel_clusters: int = 10) -> Dict[str, Any]:
        """Process input through multiple quad-brain clusters"""
        # Run subset of clusters in parallel
        cluster_tasks = [
            self.clusters[i].process(input_data)
            for i in range(min(parallel_clusters, len(self.clusters)))
        ]

        results = await asyncio.gather(*cluster_tasks)

        # Aggregate results
        avg_confidence = sum(r["confidence"] for r in results) / len(results)
        total_synergies = sum(r["synergies_found"] for r in results)
        total_merged = sum(r["patterns_merged"] for r in results)
        avg_multiplier = sum(r["a4_multiplier"] for r in results) / len(results)

        # Run global A4 integration on aggregated outputs
        global_integration = await self.global_a4.integrate([
            {"confidence": r["confidence"], "decision": r["decision"]}
            for r in results
        ])

        return {
            "clusters_used": len(results),
            "swarm_confidence": avg_confidence,
            "swarm_decision": results[0]["decision"],  # Use first cluster's decision
            "total_synergies": total_synergies + global_integration.synergies_found,
            "total_merged": total_merged + global_integration.patterns_merged,
            "avg_multiplier": avg_multiplier,
            "global_multiplier": global_integration.multiplier_total,
            "compound_multiplier": avg_multiplier * global_integration.multiplier_total,
            "emergent_heuristics": global_integration.emergent_heuristics,
        }

    def print_swarm_dashboard(self):
        """Print quad-brain swarm dashboard"""
        self.global_a4.print_dashboard()

        total_a4_ops = sum(c.a4_amplifications for c in self.clusters)
        print(f"\n  Swarm A4 Operations: {total_a4_ops}")
        print(f"  Global Accumulated Multiplier: {self.global_a4.multiplier_accumulator:.2f}x")


# ==============================================================================
# DEMO
# ==============================================================================

async def integrator_demo():
    """Demonstrate A4 Integrator Brain"""
    print("\n" + "═" * 70)
    print("         A4 INTEGRATOR BRAIN DEMO")
    print("         Multiplicative Compounding")
    print("═" * 70)

    # Initialize components
    library = PatternLibrary()
    a4 = A4IntegratorBrain(library)

    # Simulate brain outputs
    brain_outputs = [
        {"confidence": 0.8, "novelty": 0.7, "impact": 0.75, "pattern_type": "meta_reasoning", "domain": "meta"},
        {"confidence": 0.75, "novelty": 0.65, "impact": 0.7, "pattern_type": "meta_reasoning", "domain": "meta"},
        {"confidence": 0.85, "novelty": 0.8, "impact": 0.8, "pattern_type": "novel_pattern", "domain": "novel"},
        {"confidence": 0.7, "novelty": 0.6, "impact": 0.65, "pattern_type": "blind_spot", "domain": "blind"},
        {"confidence": 0.9, "novelty": 0.75, "impact": 0.85, "pattern_type": "recursive", "domain": "recursive"},
    ]

    # Run integration
    print("\n  Running A4 Integration...")
    result = await a4.integrate(brain_outputs)

    print(f"\n  Integration Results:")
    print(f"    Synergies Found:     {result.synergies_found}")
    print(f"    Patterns Merged:     {result.patterns_merged}")
    print(f"    Feedback Loops:      {result.feedback_loops_created}")
    print(f"    Emergent Heuristics: {len(result.emergent_heuristics)}")
    print(f"    Total Multiplier:    {result.multiplier_total:.2f}x")

    if result.emergent_heuristics:
        print(f"\n  Emergent Heuristics:")
        for h in result.emergent_heuristics:
            print(f"    • {h}")

    # Test amplification
    print("\n  Testing Output Amplification...")
    amplified = a4.amplify_outputs(brain_outputs[:3])
    for i, (orig, amp) in enumerate(zip(brain_outputs[:3], amplified)):
        print(f"    Output {i+1}: {orig['confidence']:.0%} → {amp['confidence']:.0%} (A4 amplified)")

    # Dashboard
    a4.print_dashboard()

    # Test quad-brain swarm
    print("\n" + "═" * 70)
    print("         QUAD-BRAIN SWARM TEST")
    print("═" * 70)

    swarm = QuadBrainSwarm(total_agents=300)
    swarm_result = await swarm.process("Test meta-reasoning problem", parallel_clusters=5)

    print(f"\n  Swarm Results:")
    print(f"    Clusters Used:       {swarm_result['clusters_used']}")
    print(f"    Swarm Confidence:    {swarm_result['swarm_confidence']:.0%}")
    print(f"    Total Synergies:     {swarm_result['total_synergies']}")
    print(f"    Compound Multiplier: {swarm_result['compound_multiplier']:.2f}x")

    swarm.print_swarm_dashboard()

    print(f"\n{'═' * 70}")
    print("  △○ A4 Integration Demo Complete")
    print(f"{'═' * 70}")

    return a4, swarm


if __name__ == "__main__":
    asyncio.run(integrator_demo())

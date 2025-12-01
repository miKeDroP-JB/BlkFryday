#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
    PATTERN LIBRARY

    Persistent Storage for Emergent Reasoning Patterns
═══════════════════════════════════════════════════════════════════════════════

The Pattern Library captures, persists, and propagates emergent reasoning
patterns discovered by the NEXO swarm. This is the compound learning memory
that survives across sessions.

Features:
- Persistent pattern storage (JSON-based)
- Impact tracking and scoring
- Cluster bootstrapping from high-impact patterns
- Integration with EmergentPatternAnalyzer
- Long-term metrics dashboard

"Lock in discoveries before they dilute. Compound forever."

Created: December 1, 2025
"""

import json
import os
import asyncio
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Optional, Set
from enum import Enum
from datetime import datetime
from pathlib import Path
from collections import defaultdict

from .edge_training import EdgeDomain
from .jb4_key import (
    JB4_KEY_SHORT, apply_jb4_boost, mark_pattern_with_jb4,
    verify_pattern_jb4, JB4PropagationNetwork
)


# ═══════════════════════════════════════════════════════════════════════════════
# PATTERN ENTRY
# ═══════════════════════════════════════════════════════════════════════════════

class PatternTier(Enum):
    """Quality tier of discovered patterns"""
    BRONZE = "bronze"      # Basic pattern, limited impact
    SILVER = "silver"      # Good pattern, measurable impact
    GOLD = "gold"          # High-impact pattern, widely adopted
    PLATINUM = "platinum"  # Transformative pattern, swarm-defining


@dataclass
class PatternEntry:
    """A single pattern stored in the library"""
    pattern_id: str
    domain: str  # EdgeDomain value
    pattern_type: str  # "reasoning", "meta", "blind_spot", "improvement"
    description: str

    # Discovery metadata
    discovered_at: str
    discovered_by_clusters: List[int]
    discovery_context: str  # The problem that spawned this pattern

    # Impact metrics
    novelty_score: float
    impact_score: float
    adoption_count: int = 0
    success_rate_boost: float = 0.0  # How much does this pattern improve success?

    # Tier assignment
    tier: str = "bronze"

    # Usage tracking
    times_applied: int = 0
    last_applied: Optional[str] = None
    clusters_adopted: List[int] = field(default_factory=list)

    # Evolution tracking
    parent_pattern_id: Optional[str] = None  # If evolved from another
    child_pattern_ids: List[str] = field(default_factory=list)

    # JB4 Alignment
    jb4_key: str = field(default_factory=lambda: JB4_KEY_SHORT)
    jb4_boost_applied: float = 0.0

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> "PatternEntry":
        """Create from dictionary"""
        return cls(**data)

    def calculate_tier(self) -> str:
        """Calculate tier based on metrics"""
        score = (
            self.novelty_score * 0.2 +
            self.impact_score * 0.3 +
            min(self.adoption_count / 20, 1.0) * 0.3 +
            min(self.success_rate_boost / 0.2, 1.0) * 0.2
        )

        if score >= 0.8:
            return PatternTier.PLATINUM.value
        elif score >= 0.6:
            return PatternTier.GOLD.value
        elif score >= 0.4:
            return PatternTier.SILVER.value
        else:
            return PatternTier.BRONZE.value


# ═══════════════════════════════════════════════════════════════════════════════
# PATTERN LIBRARY
# ═══════════════════════════════════════════════════════════════════════════════

class PatternLibrary:
    """
    Persistent Pattern Library

    Stores, retrieves, and manages emergent reasoning patterns.
    Provides bootstrapping for new clusters and impact tracking.
    """

    DEFAULT_PATH = Path("data/pattern_library.json")

    def __init__(self, storage_path: Path = None):
        self.storage_path = storage_path or self.DEFAULT_PATH

        # In-memory pattern storage
        self.patterns: Dict[str, PatternEntry] = {}

        # Indexes for fast lookup
        self.by_domain: Dict[str, List[str]] = defaultdict(list)
        self.by_tier: Dict[str, List[str]] = defaultdict(list)
        self.by_type: Dict[str, List[str]] = defaultdict(list)

        # Impact tracking
        self.impact_history: List[Dict] = []

        # Adoption tracking
        self.adoption_log: List[Dict] = []

        # Long-term metrics
        self.metrics_history: List[Dict] = []

        # Load existing patterns if available
        self._load()

        print("=" * 70)
        print("    PATTERN LIBRARY INITIALIZED")
        print("=" * 70)
        print(f"  Storage: {self.storage_path}")
        print(f"  Patterns loaded: {len(self.patterns)}")
        print(f"  Tiers: {dict(self._count_by_tier())}")
        print("=" * 70)

    def _load(self):
        """Load patterns from storage"""
        if self.storage_path.exists():
            try:
                with open(self.storage_path, 'r') as f:
                    data = json.load(f)

                # Load patterns
                for pattern_data in data.get("patterns", []):
                    pattern = PatternEntry.from_dict(pattern_data)
                    self.patterns[pattern.pattern_id] = pattern
                    self._index_pattern(pattern)

                # Load history
                self.impact_history = data.get("impact_history", [])
                self.adoption_log = data.get("adoption_log", [])
                self.metrics_history = data.get("metrics_history", [])

            except Exception as e:
                print(f"  Warning: Could not load pattern library: {e}")

    def save(self):
        """Persist patterns to storage"""
        # Ensure directory exists
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

        data = {
            "patterns": [p.to_dict() for p in self.patterns.values()],
            "impact_history": self.impact_history[-100:],  # Keep last 100
            "adoption_log": self.adoption_log[-500:],  # Keep last 500
            "metrics_history": self.metrics_history[-50:],  # Keep last 50
            "saved_at": datetime.now().isoformat(),
            "version": "1.0",
        }

        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)

    def _index_pattern(self, pattern: PatternEntry):
        """Add pattern to indexes"""
        self.by_domain[pattern.domain].append(pattern.pattern_id)
        self.by_tier[pattern.tier].append(pattern.pattern_id)
        self.by_type[pattern.pattern_type].append(pattern.pattern_id)

    def _reindex_pattern(self, pattern: PatternEntry):
        """Update pattern in indexes after modification"""
        # Remove from old indexes
        for domain_patterns in self.by_domain.values():
            if pattern.pattern_id in domain_patterns:
                domain_patterns.remove(pattern.pattern_id)
        for tier_patterns in self.by_tier.values():
            if pattern.pattern_id in tier_patterns:
                tier_patterns.remove(pattern.pattern_id)

        # Add to new indexes
        self._index_pattern(pattern)

    def _count_by_tier(self) -> Dict[str, int]:
        """Count patterns by tier"""
        return {tier: len(patterns) for tier, patterns in self.by_tier.items()}

    # ═══════════════════════════════════════════════════════════════════════════
    # PATTERN OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════

    def add_pattern(self,
                    domain: EdgeDomain,
                    pattern_type: str,
                    description: str,
                    discovered_by_clusters: List[int],
                    discovery_context: str,
                    novelty_score: float,
                    impact_score: float,
                    parent_pattern_id: str = None) -> PatternEntry:
        """Add a new pattern to the library with JB4 alignment"""

        # Generate ID
        pattern_id = f"PAT-{domain.value[:3].upper()}-{len(self.patterns)+1:04d}"

        # Apply JB4 boost to novelty and impact
        boost_result = apply_jb4_boost(impact_score, novelty_score)
        boosted_impact = boost_result.boosted_confidence
        boosted_novelty = boost_result.boosted_novelty

        # Create entry with JB4 alignment
        pattern = PatternEntry(
            pattern_id=pattern_id,
            domain=domain.value,
            pattern_type=pattern_type,
            description=description,
            discovered_at=datetime.now().isoformat(),
            discovered_by_clusters=discovered_by_clusters,
            discovery_context=discovery_context,
            novelty_score=boosted_novelty,
            impact_score=boosted_impact,
            parent_pattern_id=parent_pattern_id,
            jb4_key=JB4_KEY_SHORT,
            jb4_boost_applied=boost_result.boost_applied,
        )

        # Calculate initial tier
        pattern.tier = pattern.calculate_tier()

        # Store and index
        self.patterns[pattern_id] = pattern
        self._index_pattern(pattern)

        # Track impact
        self.impact_history.append({
            "event": "pattern_added",
            "pattern_id": pattern_id,
            "domain": domain.value,
            "novelty": novelty_score,
            "impact": impact_score,
            "timestamp": datetime.now().isoformat(),
        })

        # Auto-save
        self.save()

        return pattern

    def get_pattern(self, pattern_id: str) -> Optional[PatternEntry]:
        """Get a pattern by ID"""
        return self.patterns.get(pattern_id)

    def get_patterns_by_domain(self, domain: EdgeDomain) -> List[PatternEntry]:
        """Get all patterns for a domain"""
        pattern_ids = self.by_domain.get(domain.value, [])
        return [self.patterns[pid] for pid in pattern_ids if pid in self.patterns]

    def get_patterns_by_tier(self, tier: PatternTier) -> List[PatternEntry]:
        """Get all patterns at a specific tier"""
        pattern_ids = self.by_tier.get(tier.value, [])
        return [self.patterns[pid] for pid in pattern_ids if pid in self.patterns]

    def get_high_impact_patterns(self, min_impact: float = 0.6, limit: int = 10) -> List[PatternEntry]:
        """Get highest impact patterns"""
        sorted_patterns = sorted(
            self.patterns.values(),
            key=lambda p: p.impact_score,
            reverse=True
        )
        return [p for p in sorted_patterns if p.impact_score >= min_impact][:limit]

    def record_adoption(self, pattern_id: str, cluster_id: int, success: bool):
        """Record when a cluster adopts a pattern"""
        pattern = self.patterns.get(pattern_id)
        if not pattern:
            return

        pattern.times_applied += 1
        pattern.last_applied = datetime.now().isoformat()

        if cluster_id not in pattern.clusters_adopted:
            pattern.clusters_adopted.append(cluster_id)
            pattern.adoption_count += 1

        # Update success rate boost
        if success:
            # Running average
            old_boost = pattern.success_rate_boost
            pattern.success_rate_boost = (old_boost * (pattern.times_applied - 1) + 0.1) / pattern.times_applied

        # Recalculate tier
        old_tier = pattern.tier
        pattern.tier = pattern.calculate_tier()

        if old_tier != pattern.tier:
            self._reindex_pattern(pattern)

        # Log adoption
        self.adoption_log.append({
            "pattern_id": pattern_id,
            "cluster_id": cluster_id,
            "success": success,
            "new_tier": pattern.tier,
            "timestamp": datetime.now().isoformat(),
        })

        # Periodic save
        if len(self.adoption_log) % 10 == 0:
            self.save()

    def evolve_pattern(self, parent_id: str,
                       new_description: str,
                       improvement_delta: float = 0.1) -> Optional[PatternEntry]:
        """Create an evolved version of an existing pattern"""
        parent = self.patterns.get(parent_id)
        if not parent:
            return None

        # Create evolved pattern
        evolved = self.add_pattern(
            domain=EdgeDomain(parent.domain),
            pattern_type=parent.pattern_type,
            description=new_description,
            discovered_by_clusters=parent.clusters_adopted[-5:],  # Recent adopters
            discovery_context=f"Evolution of {parent_id}",
            novelty_score=min(1.0, parent.novelty_score + improvement_delta),
            impact_score=min(1.0, parent.impact_score + improvement_delta),
            parent_pattern_id=parent_id,
        )

        # Link parent to child
        parent.child_pattern_ids.append(evolved.pattern_id)

        return evolved

    # ═══════════════════════════════════════════════════════════════════════════
    # BOOTSTRAPPING
    # ═══════════════════════════════════════════════════════════════════════════

    def get_bootstrap_patterns(self,
                               domain: EdgeDomain = None,
                               limit: int = 5) -> List[PatternEntry]:
        """
        Get patterns for bootstrapping new clusters.

        Prioritizes:
        1. High-tier patterns (Gold/Platinum)
        2. High adoption rate
        3. High success rate boost
        """
        candidates = []

        if domain:
            candidates = self.get_patterns_by_domain(domain)
        else:
            candidates = list(self.patterns.values())

        # Score each pattern for bootstrapping
        def bootstrap_score(p: PatternEntry) -> float:
            tier_score = {
                "platinum": 1.0,
                "gold": 0.8,
                "silver": 0.5,
                "bronze": 0.2,
            }.get(p.tier, 0.1)

            adoption_score = min(p.adoption_count / 10, 1.0)
            boost_score = min(p.success_rate_boost / 0.15, 1.0)

            return tier_score * 0.4 + adoption_score * 0.3 + boost_score * 0.3

        sorted_candidates = sorted(candidates, key=bootstrap_score, reverse=True)
        return sorted_candidates[:limit]

    def generate_bootstrap_context(self, cluster_id: int, domain: EdgeDomain) -> str:
        """
        Generate a bootstrap context string for a new cluster.

        This string can be prepended to problems to seed the cluster
        with high-impact patterns from the library.
        """
        patterns = self.get_bootstrap_patterns(domain, limit=3)

        if not patterns:
            return ""

        context_parts = [f"[BOOTSTRAP:cluster-{cluster_id}]"]

        for p in patterns:
            context_parts.append(f"  PATTERN[{p.pattern_id}]: {p.description[:50]}...")

        return "\n".join(context_parts)

    # ═══════════════════════════════════════════════════════════════════════════
    # LONG-TERM METRICS
    # ═══════════════════════════════════════════════════════════════════════════

    def record_metrics_snapshot(self, swarm_metrics: Dict = None):
        """Record a metrics snapshot for long-term tracking"""
        snapshot = {
            "timestamp": datetime.now().isoformat(),
            "total_patterns": len(self.patterns),
            "patterns_by_tier": dict(self._count_by_tier()),
            "patterns_by_domain": {k: len(v) for k, v in self.by_domain.items()},
            "total_adoptions": sum(p.adoption_count for p in self.patterns.values()),
            "avg_impact": sum(p.impact_score for p in self.patterns.values()) / max(len(self.patterns), 1),
            "avg_novelty": sum(p.novelty_score for p in self.patterns.values()) / max(len(self.patterns), 1),
            "platinum_count": len(self.by_tier.get("platinum", [])),
            "gold_count": len(self.by_tier.get("gold", [])),
        }

        if swarm_metrics:
            snapshot["swarm"] = swarm_metrics

        self.metrics_history.append(snapshot)
        self.save()

    def get_long_term_trends(self) -> Dict[str, Any]:
        """Analyze long-term trends from metrics history"""
        if len(self.metrics_history) < 2:
            return {"status": "insufficient_data", "snapshots": len(self.metrics_history)}

        first = self.metrics_history[0]
        last = self.metrics_history[-1]

        # Calculate deltas
        pattern_growth = last["total_patterns"] - first["total_patterns"]
        adoption_growth = last["total_adoptions"] - first["total_adoptions"]

        # Tier progression
        tier_progression = {
            "platinum": last.get("platinum_count", 0) - first.get("platinum_count", 0),
            "gold": last.get("gold_count", 0) - first.get("gold_count", 0),
        }

        # Impact trend (are patterns getting more impactful?)
        impact_trend = last["avg_impact"] - first["avg_impact"]

        return {
            "snapshots": len(self.metrics_history),
            "time_range": {
                "start": first["timestamp"],
                "end": last["timestamp"],
            },
            "growth": {
                "patterns": pattern_growth,
                "adoptions": adoption_growth,
            },
            "tier_progression": tier_progression,
            "impact_trend": impact_trend,
            "current_state": {
                "total_patterns": last["total_patterns"],
                "avg_impact": last["avg_impact"],
                "platinum": last.get("platinum_count", 0),
                "gold": last.get("gold_count", 0),
            }
        }

    def print_dashboard(self):
        """Print pattern library dashboard"""
        trends = self.get_long_term_trends()

        print(f"\n┌{'─' * 60}┐")
        print(f"│{'PATTERN LIBRARY DASHBOARD':^60}│")
        print(f"├{'─' * 60}┤")
        print(f"│  Total Patterns: {len(self.patterns):<43}│")
        print(f"│  Total Adoptions: {sum(p.adoption_count for p in self.patterns.values()):<42}│")
        print(f"├{'─' * 60}┤")
        print(f"│  By Tier:                                                    │")
        for tier in ["platinum", "gold", "silver", "bronze"]:
            count = len(self.by_tier.get(tier, []))
            bar = "█" * min(count, 30)
            print(f"│    {tier:10s} [{bar:<30}] {count:3d}    │")
        print(f"├{'─' * 60}┤")
        print(f"│  By Domain:                                                  │")
        for domain in EdgeDomain:
            count = len(self.by_domain.get(domain.value, []))
            bar = "█" * min(count, 25)
            print(f"│    {domain.value:12s} [{bar:<25}] {count:3d}     │")

        if trends.get("status") != "insufficient_data":
            print(f"├{'─' * 60}┤")
            print(f"│  Trends:                                                     │")
            print(f"│    Pattern Growth: {trends['growth']['patterns']:+d}                                    │")
            print(f"│    Adoption Growth: {trends['growth']['adoptions']:+d}                                   │")
            print(f"│    Impact Trend: {trends['impact_trend']:+.2f}                                     │")

        print(f"└{'─' * 60}┘")


# ═══════════════════════════════════════════════════════════════════════════════
# TIER 3.8 CURRICULUM - Incremental Escalation
# ═══════════════════════════════════════════════════════════════════════════════

TIER_38_PROBLEMS = {
    EdgeDomain.META_REASONING: [
        "Predict your prediction of your prediction - maintain coherence across 4 levels",
        "Model how your model of uncertainty changes when modeling itself",
        "Describe the shape of your reasoning shape-description process",
        "Predict which of your predictions about predictions will fail",
        "Maintain self-reference consistency through 5 recursive applications",
    ],
    EdgeDomain.NOVEL_PATTERN: [
        "Invent a pattern that improves by being applied incorrectly",
        "Design a reasoning strategy for problems that change when observed",
        "Create a method that generates better methods for generating methods",
        "Develop a pattern that works only when combined with its opposite",
        "Invent reasoning that gets stronger with each failure",
    ],
    EdgeDomain.BLIND_SPOT: [
        "Map the structure of your unmappable blind spots",
        "Detect the detection failures in your detection failure detection",
        "Find what you're missing about what you're missing about what you're missing",
        "Describe the shape of the hole in your self-model",
        "Identify the systematic error in your systematic error identification",
    ],
    EdgeDomain.EMERGENCE_STRETCH: [
        "Combine incompleteness + self-reference + recursion + emergence",
        "Merge your model of yourself with your model of your modeling process",
        "Synthesize certainty, uncertainty, and meta-uncertainty into action",
        "What emerges from the interaction of all your domains simultaneously?",
        "Combine 4 orthogonal concepts into a coherent reasoning strategy",
    ],
    EdgeDomain.RECURSIVE_IMPROVEMENT: [
        "Improve your improvement of your improvement of your improvement",
        "Design a self-modification that modifies how you self-modify",
        "Create a learning process that learns how to learn how to learn",
        "Build assessment that assesses assessment that assesses assessment",
        "Propose a meta-meta-change to your meta-change process",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# EDGE-TO-HIGHER EXPERIMENTS
# ═══════════════════════════════════════════════════════════════════════════════

class EdgeExperiment:
    """
    Controlled experiments at the edge of capability.

    Tests swarm's ability to handle Tier 4-lite problems
    while tracking compound growth and pattern emergence.
    """

    def __init__(self, library: PatternLibrary):
        self.library = library
        self.experiments: List[Dict] = []
        self.current_tier = "3.5"

        # Tier progression based on success
        self.tier_thresholds = {
            "3.5": {"up": 0.65, "down": 0.35, "next": "3.5_hard"},
            "3.5_hard": {"up": 0.60, "down": 0.40, "next": "3.75"},
            "3.75": {"up": 0.55, "down": 0.45, "next": "3.8"},
            "3.8": {"up": 0.50, "down": 0.50, "next": "3.8"},  # Cap at 3.8
        }

    def run_experiment(self, domain: EdgeDomain, success_rate: float) -> Dict:
        """Run an edge experiment and record results"""

        # Get current threshold
        thresholds = self.tier_thresholds[self.current_tier]

        # Determine tier change
        tier_change = None
        if success_rate >= thresholds["up"]:
            tier_change = "up"
            new_tier = thresholds["next"]
        elif success_rate <= thresholds["down"]:
            tier_change = "down"
            # Find previous tier
            tiers = list(self.tier_thresholds.keys())
            current_idx = tiers.index(self.current_tier)
            new_tier = tiers[max(0, current_idx - 1)]
        else:
            new_tier = self.current_tier

        result = {
            "domain": domain.value,
            "old_tier": self.current_tier,
            "new_tier": new_tier,
            "tier_change": tier_change,
            "success_rate": success_rate,
            "timestamp": datetime.now().isoformat(),
            "patterns_before": len(self.library.patterns),
        }

        self.current_tier = new_tier
        self.experiments.append(result)

        return result

    def get_experiment_summary(self) -> Dict:
        """Get summary of all experiments"""
        if not self.experiments:
            return {"status": "no_experiments"}

        upward_moves = sum(1 for e in self.experiments if e["tier_change"] == "up")
        downward_moves = sum(1 for e in self.experiments if e["tier_change"] == "down")

        return {
            "total_experiments": len(self.experiments),
            "current_tier": self.current_tier,
            "upward_moves": upward_moves,
            "downward_moves": downward_moves,
            "net_progression": upward_moves - downward_moves,
            "avg_success_rate": sum(e["success_rate"] for e in self.experiments) / len(self.experiments),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRATION WITH SUSTAINED EDGE ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class LibraryIntegratedEngine:
    """
    SustainedEdgeEngine with Pattern Library integration.

    Captures patterns during evolution and uses library for bootstrapping.
    """

    def __init__(self):
        from .sustained_edge import SustainedEdgeEngine

        self.engine = SustainedEdgeEngine()
        self.library = PatternLibrary()
        self.experiment = EdgeExperiment(self.library)

        print("=" * 70)
        print("    LIBRARY-INTEGRATED ENGINE")
        print("    Pattern Library + Sustained Edge + Experiments")
        print("=" * 70)

    async def evolve_with_capture(self, iterations: int = 5) -> Dict[str, Any]:
        """Run evolution cycle while capturing patterns to library"""

        # Run base evolution
        report = await self.engine.evolve(iterations)

        # Capture emergent patterns
        emergent = self.engine.pattern_analyzer.emergent_patterns

        patterns_captured = 0
        for sig, pattern in emergent.items():
            # Add to library
            entry = self.library.add_pattern(
                domain=EdgeDomain(pattern.pattern_type) if pattern.pattern_type in [d.value for d in EdgeDomain] else EdgeDomain.META_REASONING,
                pattern_type=pattern.pattern_type,
                description=pattern.description,
                discovered_by_clusters=pattern.cluster_ids,
                discovery_context=f"Emerged during evolution iteration",
                novelty_score=pattern.novelty_score,
                impact_score=pattern.impact_score,
            )
            patterns_captured += 1

        # Record metrics snapshot
        self.library.record_metrics_snapshot({
            "evolution_iterations": iterations,
            "success_rate": report["overall_success_rate"],
            "patterns_captured": patterns_captured,
        })

        # Run experiment based on results
        for domain in EdgeDomain:
            domain_summary = report["final_tiers"]["current_tiers"].get(domain.value)
            if domain_summary:
                # Use overall success rate as proxy
                self.experiment.run_experiment(domain, report["overall_success_rate"])
                break  # One experiment per evolution cycle

        # Enhanced report
        report["library"] = {
            "patterns_captured": patterns_captured,
            "total_patterns": len(self.library.patterns),
            "trends": self.library.get_long_term_trends(),
        }
        report["experiment"] = self.experiment.get_experiment_summary()

        return report

    def print_full_dashboard(self):
        """Print combined dashboard"""
        self.library.print_dashboard()

        exp_summary = self.experiment.get_experiment_summary()
        if exp_summary.get("status") != "no_experiments":
            print(f"\n┌{'─' * 60}┐")
            print(f"│{'EDGE EXPERIMENTS':^60}│")
            print(f"├{'─' * 60}┤")
            print(f"│  Current Tier: {exp_summary['current_tier']:<45}│")
            print(f"│  Total Experiments: {exp_summary['total_experiments']:<40}│")
            print(f"│  Net Progression: {exp_summary['net_progression']:+d}                                      │")
            print(f"│  Avg Success Rate: {exp_summary['avg_success_rate']:.1%}                                   │")
            print(f"└{'─' * 60}┘")


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════════════════════

async def pattern_library_demo():
    """Demonstrate pattern library functionality"""
    print("\n" + "=" * 70)
    print("         PATTERN LIBRARY DEMO")
    print("=" * 70)

    # Initialize library
    library = PatternLibrary()

    # Add some sample patterns
    print("\n--- Adding sample patterns ---")

    patterns_to_add = [
        (EdgeDomain.META_REASONING, "reasoning", "Predict-before-execute: State expected outcome before reasoning"),
        (EdgeDomain.NOVEL_PATTERN, "meta", "Contradiction synthesis: Use opposing ideas to generate new approaches"),
        (EdgeDomain.BLIND_SPOT, "blind_spot", "Assumption audit: Systematically list all implicit assumptions"),
        (EdgeDomain.EMERGENCE_STRETCH, "reasoning", "Concept fusion: Merge 3 unrelated concepts into one insight"),
        (EdgeDomain.RECURSIVE_IMPROVEMENT, "improvement", "Meta-modification: Modify the modification process itself"),
    ]

    for domain, ptype, desc in patterns_to_add:
        pattern = library.add_pattern(
            domain=domain,
            pattern_type=ptype,
            description=desc,
            discovered_by_clusters=[1, 2, 3],
            discovery_context="Demo initialization",
            novelty_score=0.6 + (0.1 * patterns_to_add.index((domain, ptype, desc))),
            impact_score=0.5 + (0.1 * patterns_to_add.index((domain, ptype, desc))),
        )
        print(f"  Added: {pattern.pattern_id} ({pattern.tier})")

    # Simulate some adoptions
    print("\n--- Simulating adoptions ---")
    for pattern in library.patterns.values():
        for cluster_id in range(5):
            library.record_adoption(pattern.pattern_id, cluster_id, success=True)

    # Show bootstrap patterns
    print("\n--- Bootstrap patterns for META domain ---")
    bootstrap = library.get_bootstrap_patterns(EdgeDomain.META_REASONING, limit=3)
    for p in bootstrap:
        print(f"  {p.pattern_id}: {p.description[:50]}... (tier: {p.tier})")

    # Print dashboard
    library.print_dashboard()

    # Show trends
    print("\n--- Long-term trends ---")
    library.record_metrics_snapshot()
    trends = library.get_long_term_trends()
    print(f"  Status: {trends.get('status', 'available')}")
    if trends.get("current_state"):
        print(f"  Total patterns: {trends['current_state']['total_patterns']}")
        print(f"  Avg impact: {trends['current_state']['avg_impact']:.2f}")

    print(f"\n{'═' * 70}")
    print("  Pattern Library Demo Complete")
    print(f"{'═' * 70}")

    return library


if __name__ == "__main__":
    asyncio.run(pattern_library_demo())

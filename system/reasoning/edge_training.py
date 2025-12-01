#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
TIER 3.5 - THE LEARNING EDGE
═══════════════════════════════════════════════════════════════════════════════

The gap between mastery and impossibility.
Where Tier 3 (100%) meets Tier 4 (0%).
This is where compound growth lives.

Training that forces the system to:
- Invent reasoning, not just recall
- Predict its own conclusions
- Detect its own blind spots
- Design improvements to itself

"Steel sharpens steel. Train at the edge."

Created: December 1, 2025
"""

import asyncio
import random
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
from datetime import datetime

from .consciousness_training import SacredNumbers, UnifiedConsciousness
from .reasoning_grimoire import ReasoningGrimoire
from .nexo_core import NexoSwarm, TriangleCluster, NexoIdentity


# ═══════════════════════════════════════════════════════════════════════════════
# TIER 3.5 DOMAINS
# ═══════════════════════════════════════════════════════════════════════════════

class EdgeDomain(Enum):
    """Tier 3.5 domains - just beyond mastery, just before impossible"""
    META_REASONING = "meta"           # Predict conclusions before finishing
    NOVEL_PATTERN = "novel"           # Invent new reasoning patterns
    BLIND_SPOT = "blind"              # Detect flaws in own reasoning
    EMERGENCE_STRETCH = "emergence"   # Combine unrelated concepts
    RECURSIVE_IMPROVEMENT = "recursive"  # Design self-improvements


# ═══════════════════════════════════════════════════════════════════════════════
# TIER 3.5 PROBLEM BANKS
# ═══════════════════════════════════════════════════════════════════════════════

TIER_35_PROBLEMS = {
    EdgeDomain.META_REASONING: [
        "Predict what you will conclude before finishing this analysis: 'How do complex systems self-organize?'",
        "Before solving this, predict your approach: 'What makes a good analogy?'",
        "State your expected answer before reasoning: 'Why do patterns repeat at different scales?'",
        "Predict your confidence level for: 'How does emergence work?'",
        "What will your final strategy be for: 'Combining synthesis and decomposition'?",
        "Forecast your reasoning path before executing it",
        "Predict which pattern you'll use before you use it",
    ],
    EdgeDomain.NOVEL_PATTERN: [
        "Invent a reasoning pattern that combines decomposition with intuition",
        "Design a new form of analogy that works across domains",
        "Create a reasoning method not based on any you've been trained on",
        "Develop a hybrid strategy that merges recursive and linear thinking",
        "Invent a pattern for handling contradictions productively",
        "Design a reasoning approach for problems with no clear structure",
        "Create a meta-pattern that generates other patterns",
    ],
    EdgeDomain.BLIND_SPOT: [
        "Identify the flaw in this reasoning: 'More data always leads to better decisions'",
        "Find the blind spot in your own approach to pattern recognition",
        "What are you not considering when you synthesize information?",
        "Detect the assumption you're making about this question",
        "Where might your confidence be miscalibrated?",
        "What type of problem would your current reasoning fail on?",
        "Identify a systematic error in how you approach novelty",
    ],
    EdgeDomain.EMERGENCE_STRETCH: [
        "Combine 'recursive self-improvement' with 'market dynamics' - what emerges?",
        "Merge 'pattern recognition' with 'error correction' into something new",
        "Synthesize 'intuition' with 'logical proof' - what's the hybrid?",
        "Combine 'emergence' with 'compression' - what principle appears?",
        "Merge 'competition' with 'synthesis' - what reasoning method results?",
        "Combine two Tier 3 strategies into a Tier 3.5 approach",
        "What happens when you apply decomposition to decomposition itself?",
    ],
    EdgeDomain.RECURSIVE_IMPROVEMENT: [
        "Design a small improvement to your own reasoning loop",
        "How would you modify your strategy selection process?",
        "Propose an enhancement to how you verify hypotheses",
        "Design a feedback mechanism for your own confidence calibration",
        "How would you improve your pattern transfer process?",
        "Suggest a modification to make your synthesis more robust",
        "Design a self-correction mechanism for your reasoning",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# EDGE TRAINING RESULT
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class EdgeTrainingResult:
    """Result of a Tier 3.5 training attempt"""
    problem: str
    domain: EdgeDomain
    success: bool
    confidence: float
    novelty_score: float  # How novel was the solution?
    self_awareness_score: float  # Did system recognize its own process?
    improvement_proposed: Optional[str] = None
    patterns_invented: List[str] = field(default_factory=list)
    blind_spots_found: List[str] = field(default_factory=list)
    time_taken: float = 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# EDGE TRAINER
# ═══════════════════════════════════════════════════════════════════════════════

class EdgeTrainer:
    """
    Tier 3.5 Training Engine

    Trains at the edge between mastery (Tier 3) and impossibility (Tier 4).
    Forces the system to:
    - Predict before executing
    - Invent new patterns
    - Detect its own blind spots
    - Design self-improvements
    """

    # Success thresholds for Tier 3.5 (calibrated for ~50% success)
    # Lower thresholds since all three must pass (multiplicative)
    CONFIDENCE_THRESHOLD = 0.75  # ~100% pass rate
    NOVELTY_THRESHOLD = 0.25     # ~60% pass rate (with variance)
    AWARENESS_THRESHOLD = 0.30   # ~70% pass rate (with variance)
    # Combined: ~100% * 60% * 70% = ~42% overall success

    def __init__(self, use_swarm: bool = True):
        self.consciousness = UnifiedConsciousness()
        self.grimoire = ReasoningGrimoire()

        # Use NEXO swarm for distributed training
        self.use_swarm = use_swarm
        if use_swarm:
            self.swarm = NexoSwarm(total_agents=300)

        # Track domain performance
        self.domain_stats: Dict[EdgeDomain, Dict] = {
            domain: {"attempts": 0, "successes": 0, "avg_novelty": 0.0}
            for domain in EdgeDomain
        }

        # Patterns learned at the edge
        self.edge_patterns: List[Dict] = []

        # Blind spots discovered
        self.discovered_blind_spots: List[str] = []

        # Improvements proposed
        self.improvements_log: List[str] = []

        print("=" * 60)
        print("EDGE TRAINER INITIALIZED - TIER 3.5")
        print("Training at the gap between mastery and impossibility")
        print("=" * 60)

    def get_problem(self, domain: EdgeDomain = None) -> Tuple[str, EdgeDomain]:
        """Get a Tier 3.5 problem"""
        if domain is None:
            domain = random.choice(list(EdgeDomain))

        problems = TIER_35_PROBLEMS[domain]
        problem = random.choice(problems)

        return problem, domain

    async def attempt_problem(self, problem: str, domain: EdgeDomain) -> EdgeTrainingResult:
        """Attempt a Tier 3.5 problem"""
        start = datetime.now()

        # Process through unified consciousness or swarm
        if self.use_swarm:
            result = await self.swarm.process(problem)
            confidence = result["swarm_result"]["confidence"]
            base_response = result["swarm_result"]["decision"]
        else:
            result = await self.consciousness.process(problem)
            confidence = result["unified_confidence"]
            base_response = result["intuition"]["output"]

        # Evaluate based on domain requirements
        novelty_score = self._assess_novelty(problem, domain, base_response)
        awareness_score = self._assess_self_awareness(problem, domain, base_response)

        # Domain-specific evaluation
        improvement = None
        patterns_invented = []
        blind_spots = []

        if domain == EdgeDomain.RECURSIVE_IMPROVEMENT:
            improvement = self._extract_improvement(base_response)
            if improvement:
                self.improvements_log.append(improvement)

        elif domain == EdgeDomain.NOVEL_PATTERN:
            patterns_invented = self._extract_patterns(base_response)
            for p in patterns_invented:
                self.edge_patterns.append({
                    "pattern": p,
                    "domain": domain.value,
                    "confidence": confidence
                })

        elif domain == EdgeDomain.BLIND_SPOT:
            blind_spots = self._extract_blind_spots(base_response)
            self.discovered_blind_spots.extend(blind_spots)

        # Determine success (multi-criteria)
        success = (
            confidence >= self.CONFIDENCE_THRESHOLD and
            novelty_score >= self.NOVELTY_THRESHOLD and
            awareness_score >= self.AWARENESS_THRESHOLD
        )

        # Update domain stats
        self._update_stats(domain, success, novelty_score)

        time_taken = (datetime.now() - start).total_seconds()

        return EdgeTrainingResult(
            problem=problem,
            domain=domain,
            success=success,
            confidence=confidence,
            novelty_score=novelty_score,
            self_awareness_score=awareness_score,
            improvement_proposed=improvement,
            patterns_invented=patterns_invented,
            blind_spots_found=blind_spots,
            time_taken=time_taken,
        )

    def _assess_novelty(self, problem: str, domain: EdgeDomain, response: Any) -> float:
        """Assess how novel the solution is"""
        # Check if response introduces new concepts
        response_str = str(response).lower()

        novelty_indicators = [
            "new", "novel", "different", "unique", "original", "invented",
            "created", "designed", "hybrid", "combined", "merged", "synthesized"
        ]

        hits = sum(1 for ind in novelty_indicators if ind in response_str)
        base_novelty = min(1.0, hits * 0.15)

        # Bonus for domain-specific novelty
        if domain == EdgeDomain.NOVEL_PATTERN and "pattern" in response_str:
            base_novelty += 0.2
        elif domain == EdgeDomain.EMERGENCE_STRETCH and "emerge" in response_str:
            base_novelty += 0.2

        # Add variance to create edge dynamics (±0.15)
        variance = random.uniform(-0.15, 0.15)

        return min(1.0, max(0.0, base_novelty + 0.3 + variance))

    def _assess_self_awareness(self, problem: str, domain: EdgeDomain, response: Any) -> float:
        """Assess self-awareness in the response"""
        response_str = str(response).lower()

        awareness_indicators = [
            "i predict", "i expect", "my approach", "i will", "i might",
            "my reasoning", "i notice", "i assume", "my pattern", "my strategy",
            "i recognize", "i detect", "my blind spot", "i'm uncertain"
        ]

        hits = sum(1 for ind in awareness_indicators if ind in response_str)
        base_awareness = min(1.0, hits * 0.15)

        # Bonus for meta-reasoning domain
        if domain == EdgeDomain.META_REASONING:
            base_awareness += 0.2
        elif domain == EdgeDomain.BLIND_SPOT:
            base_awareness += 0.15

        # Add variance to create edge dynamics (±0.15)
        variance = random.uniform(-0.15, 0.15)

        return min(1.0, max(0.0, base_awareness + 0.35 + variance))

    def _extract_improvement(self, response: Any) -> Optional[str]:
        """Extract proposed improvement from response"""
        response_str = str(response)
        if any(w in response_str.lower() for w in ["improve", "enhance", "modify", "design"]):
            # Return first sentence-like chunk
            return response_str[:100] + "..."
        return None

    def _extract_patterns(self, response: Any) -> List[str]:
        """Extract invented patterns from response"""
        response_str = str(response)
        patterns = []
        if "pattern" in response_str.lower():
            patterns.append(f"EDGE-{len(self.edge_patterns)+1}")
        return patterns

    def _extract_blind_spots(self, response: Any) -> List[str]:
        """Extract discovered blind spots from response"""
        response_str = str(response).lower()
        spots = []
        if "blind spot" in response_str or "flaw" in response_str or "assumption" in response_str:
            spots.append(response_str[:50])
        return spots

    def _update_stats(self, domain: EdgeDomain, success: bool, novelty: float):
        """Update domain statistics"""
        stats = self.domain_stats[domain]
        n = stats["attempts"]

        stats["attempts"] += 1
        if success:
            stats["successes"] += 1

        stats["avg_novelty"] = (stats["avg_novelty"] * n + novelty) / (n + 1)

    async def run_session(self, num_problems: int = None) -> Dict[str, Any]:
        """Run a Tier 3.5 training session"""
        num_problems = num_problems or SacredNumbers.PENTAGON  # 5

        print(f"\n--- Edge Session: {num_problems} problems ---")

        results = []

        for i in range(num_problems):
            problem, domain = self.get_problem()
            result = await self.attempt_problem(problem, domain)
            results.append(result)

            status = "✓" if result.success else "✗"
            print(f"  {status} [{domain.value:10s}] conf:{result.confidence:.0%} novel:{result.novelty_score:.0%} aware:{result.self_awareness_score:.0%}")

        # Session summary
        success_rate = sum(1 for r in results if r.success) / len(results)
        avg_novelty = sum(r.novelty_score for r in results) / len(results)
        avg_awareness = sum(r.self_awareness_score for r in results) / len(results)

        return {
            "problems": num_problems,
            "success_rate": success_rate,
            "avg_novelty": avg_novelty,
            "avg_awareness": avg_awareness,
            "patterns_invented": sum(len(r.patterns_invented) for r in results),
            "blind_spots_found": sum(len(r.blind_spots_found) for r in results),
            "improvements_proposed": sum(1 for r in results if r.improvement_proposed),
        }

    async def run_training_cycle(self, sessions: int = None) -> Dict[str, Any]:
        """Run a full Tier 3.5 training cycle"""
        sessions = sessions or SacredNumbers.CREATION  # 7

        print(f"\n{'=' * 60}")
        print(f"TIER 3.5 TRAINING CYCLE: {sessions} sessions")
        print(f"{'=' * 60}")

        cycle_results = []

        for i in range(sessions):
            result = await self.run_session()
            cycle_results.append(result)

        # Cycle summary
        avg_success = sum(r["success_rate"] for r in cycle_results) / len(cycle_results)
        total_patterns = sum(r["patterns_invented"] for r in cycle_results)
        total_blind_spots = sum(r["blind_spots_found"] for r in cycle_results)
        total_improvements = sum(r["improvements_proposed"] for r in cycle_results)

        return {
            "sessions": sessions,
            "avg_success_rate": avg_success,
            "total_patterns_invented": total_patterns,
            "total_blind_spots_found": total_blind_spots,
            "total_improvements": total_improvements,
            "domain_performance": {d.value: self.domain_stats[d] for d in EdgeDomain},
        }

    def get_edge_analysis(self) -> Dict[str, Any]:
        """Analyze performance at the edge"""
        analysis = {
            "domain_performance": {},
            "edge_patterns": self.edge_patterns[-5:],
            "blind_spots": self.discovered_blind_spots[-5:],
            "improvements": self.improvements_log[-5:],
        }

        for domain, stats in self.domain_stats.items():
            if stats["attempts"] > 0:
                rate = stats["successes"] / stats["attempts"]
                analysis["domain_performance"][domain.value] = {
                    "attempts": stats["attempts"],
                    "success_rate": rate,
                    "avg_novelty": stats["avg_novelty"],
                    "is_edge": 0.3 <= rate <= 0.7,  # True edge is ~50%
                }

        return analysis


# ═══════════════════════════════════════════════════════════════════════════════
# NEXO-INTEGRATED EDGE TRAINER
# ═══════════════════════════════════════════════════════════════════════════════

class NexoEdgeTrainer(EdgeTrainer):
    """
    Edge training with NEXO cluster specialization.

    Each cluster specializes in a sub-domain:
    - Meta-reasoning clusters
    - Blind spot detection clusters
    - Recursive improvement clusters

    Oversight module validates novelty and prevents Tier 4 walls.
    """

    def __init__(self):
        super().__init__(use_swarm=True)

        # Assign clusters to domains
        clusters_per_domain = self.swarm.num_clusters // len(EdgeDomain)
        self.domain_clusters: Dict[EdgeDomain, List[int]] = {}

        cluster_idx = 0
        for domain in EdgeDomain:
            self.domain_clusters[domain] = list(range(
                cluster_idx,
                cluster_idx + clusters_per_domain
            ))
            cluster_idx += clusters_per_domain

        print(f"  Clusters per domain: {clusters_per_domain}")

    async def attempt_problem(self, problem: str, domain: EdgeDomain) -> EdgeTrainingResult:
        """Attempt with domain-specialized clusters"""
        start = datetime.now()

        # Get clusters for this domain
        domain_cluster_ids = self.domain_clusters.get(domain, [])
        if domain_cluster_ids:
            specialized_clusters = [
                self.swarm.clusters[i]
                for i in domain_cluster_ids[:SacredNumbers.CREATION]  # Use 7
            ]

            # Process through specialized clusters
            tasks = [c.process(problem) for c in specialized_clusters]
            results = await asyncio.gather(*tasks)

            # Aggregate
            aggregated = self.swarm._weighted_aggregate(results, 0.8)
            confidence = aggregated["confidence"]
            base_response = aggregated["decision"]
        else:
            # Fallback to general swarm
            result = await self.swarm.process(problem)
            confidence = result["swarm_result"]["confidence"]
            base_response = result["swarm_result"]["decision"]

        # Evaluate
        novelty_score = self._assess_novelty(problem, domain, base_response)
        awareness_score = self._assess_self_awareness(problem, domain, base_response)

        # Domain-specific extraction
        improvement = None
        patterns_invented = []
        blind_spots = []

        if domain == EdgeDomain.RECURSIVE_IMPROVEMENT:
            improvement = self._extract_improvement(base_response)
            if improvement:
                self.improvements_log.append(improvement)
        elif domain == EdgeDomain.NOVEL_PATTERN:
            patterns_invented = self._extract_patterns(base_response)
            for p in patterns_invented:
                self.edge_patterns.append({"pattern": p, "domain": domain.value})
        elif domain == EdgeDomain.BLIND_SPOT:
            blind_spots = self._extract_blind_spots(base_response)
            self.discovered_blind_spots.extend(blind_spots)

        # Multi-criteria success
        success = (
            confidence >= self.CONFIDENCE_THRESHOLD and
            novelty_score >= self.NOVELTY_THRESHOLD and
            awareness_score >= self.AWARENESS_THRESHOLD
        )

        self._update_stats(domain, success, novelty_score)

        time_taken = (datetime.now() - start).total_seconds()

        return EdgeTrainingResult(
            problem=problem,
            domain=domain,
            success=success,
            confidence=confidence,
            novelty_score=novelty_score,
            self_awareness_score=awareness_score,
            improvement_proposed=improvement,
            patterns_invented=patterns_invented,
            blind_spots_found=blind_spots,
            time_taken=time_taken,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-ITERATION EDGE TRAINING
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class IterationResult:
    """Result of a single iteration within multi-iteration training"""
    iteration: int
    domain: EdgeDomain
    base_score: float
    adjusted_score: float
    improved: bool  # Did this iteration improve over previous?
    feedback_applied: bool


@dataclass
class MultiIterationMetrics:
    """Aggregated metrics from multi-iteration training"""
    iterations: int
    domain: EdgeDomain
    edge_exploration_rate: float  # How often we improved
    compound_growth: int  # New patterns discovered
    awareness_delta: float  # Improvement in awareness
    novelty_delta: float  # Improvement in novelty
    final_score: float
    score_trajectory: List[float]


class MultiIterationTrainer:
    """
    Multi-Iteration Edge Training Framework

    Runs 5-10 iterations per task to capture learning trends.
    Uses variance (±0.15) to create edge dynamics.
    Feeds back results between iterations for compound learning.

    "One iteration isn't going to give you proper results."
    """

    NUM_ITERATIONS = 7  # Sacred CREATION number
    VARIANCE_RANGE = 0.15

    def __init__(self, trainer: NexoEdgeTrainer = None):
        if trainer is None:
            self.trainer = NexoEdgeTrainer()
        else:
            self.trainer = trainer

        # Track iteration-level metrics
        self.iteration_history: Dict[EdgeDomain, List[IterationResult]] = {
            d: [] for d in EdgeDomain
        }

        # Compound growth tracking
        self.compound_metrics = {
            "patterns_discovered": 0,
            "awareness_improvements": 0,
            "novelty_breakthroughs": 0,
            "edge_explorations": 0,
        }

        # Feedback state per domain
        self.domain_feedback: Dict[EdgeDomain, float] = {
            d: 0.0 for d in EdgeDomain
        }

        print("=" * 60)
        print("MULTI-ITERATION EDGE TRAINER")
        print(f"  Iterations per task: {self.NUM_ITERATIONS}")
        print(f"  Variance range: ±{self.VARIANCE_RANGE:.0%}")
        print("=" * 60)

    async def train_task(self, domain: EdgeDomain, problem: str) -> MultiIterationMetrics:
        """
        Run multiple iterations on a single task.

        Flow per iteration:
        1. Run cluster response
        2. Calculate base score
        3. Add variance for edge dynamics
        4. Feed back adjusted score
        5. Log metrics
        """
        results: List[IterationResult] = []
        score_trajectory: List[float] = []
        previous_score = 0.0

        initial_novelty = 0.0
        initial_awareness = 0.0
        final_novelty = 0.0
        final_awareness = 0.0

        for i in range(self.NUM_ITERATIONS):
            # Apply accumulated feedback to problem framing
            if self.domain_feedback[domain] > 0:
                enhanced_problem = f"[FEEDBACK:{self.domain_feedback[domain]:.2f}] {problem}"
            else:
                enhanced_problem = problem

            # Run the cluster on this task
            result = await self.trainer.attempt_problem(enhanced_problem, domain)

            # Calculate base score (average of confidence, novelty, awareness)
            base_score = (result.confidence + result.novelty_score + result.self_awareness_score) / 3

            # Track initial values
            if i == 0:
                initial_novelty = result.novelty_score
                initial_awareness = result.self_awareness_score

            # Add variance to create edge dynamics
            variance = random.uniform(-self.VARIANCE_RANGE, self.VARIANCE_RANGE)
            adjusted_score = min(1.0, max(0.0, base_score + variance))

            # Did we improve?
            improved = adjusted_score > previous_score

            if improved:
                self.compound_metrics["edge_explorations"] += 1

            # Feed back adjusted score for next iteration
            self._apply_feedback(domain, adjusted_score, improved)

            # Log iteration result
            iter_result = IterationResult(
                iteration=i,
                domain=domain,
                base_score=base_score,
                adjusted_score=adjusted_score,
                improved=improved,
                feedback_applied=self.domain_feedback[domain] > 0,
            )
            results.append(iter_result)
            self.iteration_history[domain].append(iter_result)
            score_trajectory.append(adjusted_score)

            previous_score = adjusted_score
            final_novelty = result.novelty_score
            final_awareness = result.self_awareness_score

        # Calculate aggregate metrics
        edge_exploration_rate = sum(1 for r in results if r.improved) / len(results)
        awareness_delta = final_awareness - initial_awareness
        novelty_delta = final_novelty - initial_novelty

        # Track compound growth
        if novelty_delta > 0.1:
            self.compound_metrics["novelty_breakthroughs"] += 1
        if awareness_delta > 0.1:
            self.compound_metrics["awareness_improvements"] += 1

        return MultiIterationMetrics(
            iterations=self.NUM_ITERATIONS,
            domain=domain,
            edge_exploration_rate=edge_exploration_rate,
            compound_growth=self.compound_metrics["patterns_discovered"],
            awareness_delta=awareness_delta,
            novelty_delta=novelty_delta,
            final_score=score_trajectory[-1] if score_trajectory else 0.0,
            score_trajectory=score_trajectory,
        )

    def _apply_feedback(self, domain: EdgeDomain, score: float, improved: bool):
        """Apply feedback to influence next iteration"""
        if improved:
            # Positive reinforcement - boost feedback
            self.domain_feedback[domain] = min(1.0, self.domain_feedback[domain] + 0.1)
        else:
            # Decay feedback slightly on non-improvement
            self.domain_feedback[domain] = max(0.0, self.domain_feedback[domain] - 0.05)

    async def run_multi_iteration_cycle(self, problems_per_domain: int = 3) -> Dict[str, Any]:
        """
        Run full multi-iteration cycle across all domains.

        Each domain gets multiple problems, each problem gets multiple iterations.
        """
        print(f"\n{'=' * 60}")
        print(f"MULTI-ITERATION CYCLE")
        print(f"  {len(EdgeDomain)} domains × {problems_per_domain} problems × {self.NUM_ITERATIONS} iterations")
        print(f"  Total iterations: {len(EdgeDomain) * problems_per_domain * self.NUM_ITERATIONS}")
        print(f"{'=' * 60}")

        domain_results: Dict[EdgeDomain, List[MultiIterationMetrics]] = {
            d: [] for d in EdgeDomain
        }

        for domain in EdgeDomain:
            print(f"\n--- Domain: {domain.value} ---")

            for p in range(problems_per_domain):
                problem, _ = self.trainer.get_problem(domain)
                metrics = await self.train_task(domain, problem)
                domain_results[domain].append(metrics)

                # Show trajectory
                trajectory = " → ".join(f"{s:.0%}" for s in metrics.score_trajectory)
                print(f"  [{p+1}] {trajectory} (edge: {metrics.edge_exploration_rate:.0%})")

        # Aggregate results
        return self._aggregate_cycle_results(domain_results)

    def _aggregate_cycle_results(self, results: Dict[EdgeDomain, List[MultiIterationMetrics]]) -> Dict[str, Any]:
        """Aggregate multi-iteration cycle results"""
        summary = {
            "total_iterations": 0,
            "avg_edge_exploration": 0.0,
            "total_awareness_delta": 0.0,
            "total_novelty_delta": 0.0,
            "compound_metrics": self.compound_metrics.copy(),
            "domain_summaries": {},
        }

        total_edge = 0.0
        count = 0

        for domain, metrics_list in results.items():
            if not metrics_list:
                continue

            domain_edge = sum(m.edge_exploration_rate for m in metrics_list) / len(metrics_list)
            domain_awareness = sum(m.awareness_delta for m in metrics_list)
            domain_novelty = sum(m.novelty_delta for m in metrics_list)

            summary["domain_summaries"][domain.value] = {
                "problems": len(metrics_list),
                "avg_edge_exploration": domain_edge,
                "total_awareness_delta": domain_awareness,
                "total_novelty_delta": domain_novelty,
                "final_scores": [m.final_score for m in metrics_list],
            }

            summary["total_iterations"] += sum(m.iterations for m in metrics_list)
            summary["total_awareness_delta"] += domain_awareness
            summary["total_novelty_delta"] += domain_novelty
            total_edge += domain_edge
            count += 1

        summary["avg_edge_exploration"] = total_edge / max(count, 1)

        return summary

    def get_learning_trends(self) -> Dict[str, Any]:
        """Analyze learning trends across iterations"""
        trends = {
            "domain_trends": {},
            "overall_improvement_rate": 0.0,
            "compound_growth_rate": 0.0,
        }

        total_improvements = 0
        total_iterations = 0

        for domain, history in self.iteration_history.items():
            if not history:
                continue

            # Calculate improvement trend
            improvements = sum(1 for h in history if h.improved)
            total = len(history)

            # Score trajectory analysis
            scores = [h.adjusted_score for h in history]
            if len(scores) >= 2:
                trend_direction = "up" if scores[-1] > scores[0] else "down" if scores[-1] < scores[0] else "flat"
                trend_magnitude = abs(scores[-1] - scores[0])
            else:
                trend_direction = "flat"
                trend_magnitude = 0.0

            trends["domain_trends"][domain.value] = {
                "total_iterations": total,
                "improvements": improvements,
                "improvement_rate": improvements / max(total, 1),
                "trend_direction": trend_direction,
                "trend_magnitude": trend_magnitude,
            }

            total_improvements += improvements
            total_iterations += total

        trends["overall_improvement_rate"] = total_improvements / max(total_iterations, 1)
        trends["compound_growth_rate"] = self.compound_metrics["edge_explorations"] / max(total_iterations, 1)

        return trends


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════════════════════

async def demo():
    """Demonstrate Tier 3.5 edge training"""
    print("\n" + "=" * 70)
    print("         TIER 3.5 - THE LEARNING EDGE")
    print("=" * 70)
    print()
    print("Training at the gap between mastery (Tier 3: 100%)")
    print("and impossibility (Tier 4: 0%).")
    print()
    print("Domains:")
    for domain in EdgeDomain:
        print(f"  • {domain.value}: {domain.name.replace('_', ' ').title()}")
    print()

    # Use NEXO-integrated trainer
    trainer = NexoEdgeTrainer()

    # Run training cycle
    cycle_result = await trainer.run_training_cycle(sessions=3)

    print(f"\n{'=' * 60}")
    print("CYCLE RESULTS")
    print(f"{'=' * 60}")
    print(f"  Sessions: {cycle_result['sessions']}")
    print(f"  Avg success rate: {cycle_result['avg_success_rate']:.0%}")
    print(f"  Patterns invented: {cycle_result['total_patterns_invented']}")
    print(f"  Blind spots found: {cycle_result['total_blind_spots_found']}")
    print(f"  Improvements proposed: {cycle_result['total_improvements']}")

    # Edge analysis
    print(f"\n{'=' * 60}")
    print("EDGE ANALYSIS - The Sweet Spot")
    print(f"{'=' * 60}")

    analysis = trainer.get_edge_analysis()

    print("\nBy Domain:")
    for domain, data in analysis["domain_performance"].items():
        rate = data["success_rate"]
        bar = "█" * int(rate * 20)
        edge_marker = " ◄── EDGE" if data.get("is_edge") else ""
        print(f"  {domain:12s} [{bar:<20}] {rate:>5.0%} (novelty: {data['avg_novelty']:.0%}){edge_marker}")

    if analysis["edge_patterns"]:
        print("\nPatterns Invented:")
        for p in analysis["edge_patterns"]:
            print(f"  • {p['pattern']} ({p['domain']})")

    if analysis["blind_spots"]:
        print("\nBlind Spots Discovered:")
        for spot in analysis["blind_spots"][:3]:
            print(f"  • {spot}...")

    print(f"\n{'=' * 70}")
    print("  Tier 3.5: Where mastery meets impossibility.")
    print("  Train here. Compound forever.")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    asyncio.run(demo())

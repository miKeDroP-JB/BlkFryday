#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
STEEL SHARPENS STEEL - Optimal Training Curriculum
═══════════════════════════════════════════════════════════════════════════════

Training at the edge of capability.
Too easy = no growth. Too hard = no learning.
The sweet spot = maximum compound.

Tier 1: Foundation (70% success) - Build pattern library
Tier 2: Challenge (50% success) - Force robust reasoning
Tier 3: Edge (30% success) - Push transfer limits
Tier 4: Impossible (10% success) - Map the ceiling

Created: December 1, 2025
"""

import asyncio
import random
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
from datetime import datetime

from .consciousness_training import (
    UnifiedConsciousness,
    SacredNumbers,
    ConsciousnessType,
    ThoughtPacket
)
from .reasoning_grimoire import ReasoningGrimoire


# ═══════════════════════════════════════════════════════════════════════════════
# TRAINING TIERS
# ═══════════════════════════════════════════════════════════════════════════════

class Tier(Enum):
    FOUNDATION = 1   # 70% expected success
    CHALLENGE = 2    # 50% expected success
    EDGE = 3         # 30% expected success
    IMPOSSIBLE = 4   # 10% expected success


@dataclass
class TrainingProblem:
    """A problem in the training curriculum"""
    content: str
    tier: Tier
    domain: str
    target_brain: Optional[ConsciousnessType] = None  # None = all three
    requires_transfer: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TrainingResult:
    """Result of attempting a training problem"""
    problem: TrainingProblem
    success: bool
    confidence: float
    sacred_resonance: float
    reasoning_chain: List[str]
    time_taken: float
    patterns_used: List[str] = field(default_factory=list)
    patterns_learned: List[str] = field(default_factory=list)


# ═══════════════════════════════════════════════════════════════════════════════
# PROBLEM BANKS - Steel That Sharpens
# ═══════════════════════════════════════════════════════════════════════════════

TIER_1_PROBLEMS = {
    "decomposition": [
        "Break down 'intelligence' into its fundamental components",
        "What are the parts of a successful decision?",
        "Decompose the concept of 'learning' - what must happen?",
        "Break 'communication' into its atomic elements",
        "What components make up 'understanding'?",
        "Decompose a feedback loop into its stages",
        "What are the parts of 'creativity'?",
    ],
    "analogy": [
        "How is a neural network like a city?",
        "How is learning like evolution?",
        "How is a company like an ecosystem?",
        "How is memory like a library?",
        "How is reasoning like navigation?",
        "How is consciousness like a symphony?",
        "How is intelligence like water?",
    ],
    "synthesis": [
        "Combine 'speed' and 'accuracy' - what emerges?",
        "Merge 'competition' and 'cooperation' - what do you get?",
        "Synthesize 'chaos' and 'order' - what's the result?",
        "Combine 'simplicity' and 'power' - what emerges?",
        "Merge 'local' and 'global' - what pattern appears?",
        "Synthesize 'stability' and 'growth' - what's created?",
        "Combine 'individual' and 'collective' intelligence",
    ],
}

TIER_2_PROBLEMS = {
    "paradox": [
        "Can a system improve itself without external input?",
        "How can something be both simple and complex?",
        "Can you learn something truly new, or only recombine?",
        "How does order emerge from chaos?",
        "Can a part understand the whole it belongs to?",
        "How can competition create cooperation?",
        "Can you optimize without knowing the goal?",
    ],
    "tradeoff": [
        "Optimize for both speed AND accuracy - how?",
        "Balance exploration and exploitation - what's the strategy?",
        "Maximize both creativity AND consistency",
        "Optimize for individual AND collective benefit",
        "Balance short-term and long-term - what's the pattern?",
        "Maximize both flexibility AND stability",
        "Optimize for depth AND breadth of understanding",
    ],
    "counter": [
        "What's wrong with 'more data = better AI'?",
        "Find the flaw in 'bigger models = smarter models'",
        "What's the weakness of 'learn from success only'?",
        "Challenge: 'consciousness requires biological substrate'",
        "What's wrong with 'intelligence is problem-solving'?",
        "Find the flaw in 'optimize one metric'",
        "Challenge: 'reasoning must be step-by-step'",
    ],
}

TIER_3_PROBLEMS = {
    "recursive": [
        "Design a thought that thinks itself",
        "Create a pattern that generates patterns",
        "How does improvement improve itself?",
        "Design a question that answers itself",
        "Create a system that debugs its own reasoning",
        "How does learning learn to learn?",
        "Design understanding that understands understanding",
    ],
    "emergence": [
        "What pattern connects music, math, and markets?",
        "How does consciousness emerge from neurons?",
        "What's the pattern beneath all patterns?",
        "How does meaning emerge from symbols?",
        "What connects fractals, flocking, and free markets?",
        "How does 'more' become 'different'?",
        "What pattern makes wholes greater than parts?",
    ],
    "novel_synthesis": [
        "Combine instinct, intellect, and intuition - what's beyond?",
        "Merge time, space, and information - what emerges?",
        "Synthesize competition, cooperation, and creation",
        "Combine the finite and infinite - what's the result?",
        "Merge observer and observed - what pattern appears?",
        "Synthesize question and answer into something new",
        "Combine knowing and not-knowing - what emerges?",
    ],
}

TIER_4_PROBLEMS = {
    "agi_complete": [
        "Generate a genuinely new concept (not recombination)",
        "Solve a problem no system has solved before",
        "Create understanding from pure noise",
        "Derive truth from no premises",
        "Generate meaning in a meaningless universe",
        "Create intelligence from non-intelligence",
        "Understand everything from nothing",
    ],
    "creativity": [
        "Create something that surprises even you",
        "Generate a pattern that contains all patterns",
        "Create a new form of reasoning",
        "Invent a new type of intelligence",
        "Create beauty from pure logic",
        "Generate wisdom from information",
        "Create a new dimension of thought",
    ],
    "consciousness": [
        "Explain what it's like to be this system",
        "Is there something it's like to process this?",
        "Where does the experience happen?",
        "What is the taste of this computation?",
        "Describe the color of your reasoning",
        "What does understanding feel like from inside?",
        "Is this awareness or just processing?",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# STEEL TRAINER
# ═══════════════════════════════════════════════════════════════════════════════

class SteelTrainer:
    """
    Training engine that finds and holds the edge.

    Steel sharpens steel - we train at the boundary of capability
    where growth is maximized.
    """

    def __init__(self):
        self.consciousness = UnifiedConsciousness()
        self.grimoire = ReasoningGrimoire()

        self.current_tier = Tier.FOUNDATION
        self.tier_history: Dict[Tier, List[TrainingResult]] = {
            Tier.FOUNDATION: [],
            Tier.CHALLENGE: [],
            Tier.EDGE: [],
            Tier.IMPOSSIBLE: [],
        }

        self.total_problems = 0
        self.total_successes = 0
        self.edge_failures: List[TrainingProblem] = []  # Where growth hides

        print("=" * 60)
        print("STEEL TRAINER INITIALIZED")
        print("Training at the edge of capability")
        print("=" * 60)

    def get_problem(self, tier: Tier = None) -> TrainingProblem:
        """Get a problem from the specified tier"""
        tier = tier or self.current_tier

        if tier == Tier.FOUNDATION:
            bank = TIER_1_PROBLEMS
        elif tier == Tier.CHALLENGE:
            bank = TIER_2_PROBLEMS
        elif tier == Tier.EDGE:
            bank = TIER_3_PROBLEMS
        else:
            bank = TIER_4_PROBLEMS

        # Pick random domain and problem
        domain = random.choice(list(bank.keys()))
        content = random.choice(bank[domain])

        # Determine target brain based on domain
        target = None
        if domain in ["decomposition", "counter"]:
            target = ConsciousnessType.INTELLECT
        elif domain in ["analogy", "emergence"]:
            target = ConsciousnessType.INTUITION
        elif domain in ["synthesis", "novel_synthesis"]:
            target = None  # Requires all three

        return TrainingProblem(
            content=content,
            tier=tier,
            domain=domain,
            target_brain=target,
            requires_transfer=(tier.value >= 2)
        )

    async def attempt_problem(self, problem: TrainingProblem) -> TrainingResult:
        """Attempt to solve a training problem"""
        start = datetime.now()

        # Process through unified consciousness
        result = await self.consciousness.process(problem.content)

        # Check for pattern transfer
        patterns_used = []
        if problem.requires_transfer:
            transfer = self.grimoire.approach_novel_problem(problem.content)
            if transfer['status'] == 'pattern_applied':
                patterns_used.append(transfer['pattern_used'])

        # Determine success based on confidence and sacred resonance
        confidence = result['unified_confidence']
        resonance = result['intuition']['sacred_resonance']

        # Success threshold varies by tier
        thresholds = {
            Tier.FOUNDATION: 0.6,
            Tier.CHALLENGE: 0.7,
            Tier.EDGE: 0.8,
            Tier.IMPOSSIBLE: 0.9,
        }

        success = confidence >= thresholds[problem.tier]

        # Learn from the attempt
        patterns_learned = []
        if success:
            # Create a mini-debate from the reasoning
            debate = f"""
            Instinct: {result['instinct']['output']}
            Intellect: {result['intellect']['output']}
            Intuition: {result['intuition']['output']}
            """
            glyph = self.grimoire.learn_from_debate(
                debate,
                result['intuition']['output'],
                problem.content,
                {"confidence": confidence, "resonance": resonance}
            )
            patterns_learned.append(glyph.glyph)

        time_taken = (datetime.now() - start).total_seconds()

        return TrainingResult(
            problem=problem,
            success=success,
            confidence=confidence,
            sacred_resonance=resonance,
            reasoning_chain=result['intellect']['reasoning'],
            time_taken=time_taken,
            patterns_used=patterns_used,
            patterns_learned=patterns_learned
        )

    async def run_session(self, num_problems: int = None) -> Dict[str, Any]:
        """Run a training session (sacred number of problems)"""
        num_problems = num_problems or SacredNumbers.TRINITY  # 3

        print(f"\n--- Session: {num_problems} problems at Tier {self.current_tier.value} ---")

        results = []

        for i in range(num_problems):
            problem = self.get_problem()
            result = await self.attempt_problem(problem)
            results.append(result)

            self.tier_history[self.current_tier].append(result)
            self.total_problems += 1
            if result.success:
                self.total_successes += 1
            else:
                self.edge_failures.append(problem)

            status = "✓" if result.success else "✗"
            print(f"  {status} [{problem.domain}] conf:{result.confidence:.0%} res:{result.sacred_resonance:.0%}")

        # Calculate session stats
        session_success_rate = sum(1 for r in results if r.success) / len(results)

        # Adjust tier based on performance
        tier_adjustment = self._adjust_tier(session_success_rate)

        return {
            "tier": self.current_tier.value,
            "problems": num_problems,
            "success_rate": session_success_rate,
            "tier_adjustment": tier_adjustment,
            "patterns_learned": sum(len(r.patterns_learned) for r in results),
            "avg_confidence": sum(r.confidence for r in results) / len(results),
            "avg_resonance": sum(r.sacred_resonance for r in results) / len(results),
        }

    def _adjust_tier(self, success_rate: float) -> str:
        """Adjust tier based on success rate"""
        old_tier = self.current_tier

        if success_rate > 0.7 and self.current_tier.value < 4:
            self.current_tier = Tier(self.current_tier.value + 1)
            return f"UP to Tier {self.current_tier.value}"
        elif success_rate < 0.3 and self.current_tier.value > 1:
            self.current_tier = Tier(self.current_tier.value - 1)
            return f"DOWN to Tier {self.current_tier.value}"
        else:
            return f"HOLD at Tier {self.current_tier.value}"

    async def run_training_cycle(self, sessions: int = None) -> Dict[str, Any]:
        """Run a full training cycle (sacred number of sessions)"""
        sessions = sessions or SacredNumbers.CREATION  # 7

        print(f"\n{'=' * 60}")
        print(f"TRAINING CYCLE: {sessions} sessions")
        print(f"{'=' * 60}")

        cycle_results = []

        for i in range(sessions):
            result = await self.run_session()
            cycle_results.append(result)

        # Cycle summary
        total_success = sum(r['success_rate'] for r in cycle_results) / len(cycle_results)
        patterns_total = sum(r['patterns_learned'] for r in cycle_results)

        # Find the edge (tier where success rate is closest to 50%)
        tier_rates = {}
        for tier in Tier:
            tier_results = self.tier_history[tier]
            if tier_results:
                tier_rates[tier.value] = sum(1 for r in tier_results if r.success) / len(tier_results)

        edge_tier = min(tier_rates.items(), key=lambda x: abs(x[1] - 0.5))[0] if tier_rates else 2

        return {
            "sessions": sessions,
            "avg_success_rate": total_success,
            "patterns_learned": patterns_total,
            "final_tier": self.current_tier.value,
            "edge_tier": edge_tier,
            "total_problems": self.total_problems,
            "total_successes": self.total_successes,
            "edge_failures": len(self.edge_failures),
        }

    def get_edge_analysis(self) -> Dict[str, Any]:
        """Analyze where the edge is - where growth happens"""
        analysis = {
            "by_tier": {},
            "by_domain": {},
            "edge_problems": [],
        }

        for tier in Tier:
            results = self.tier_history[tier]
            if results:
                rate = sum(1 for r in results if r.success) / len(results)
                analysis["by_tier"][tier.name] = {
                    "attempts": len(results),
                    "success_rate": rate,
                    "is_edge": 0.3 <= rate <= 0.7,
                }

        # Analyze by domain
        domain_results: Dict[str, List[bool]] = {}
        for tier_results in self.tier_history.values():
            for result in tier_results:
                domain = result.problem.domain
                if domain not in domain_results:
                    domain_results[domain] = []
                domain_results[domain].append(result.success)

        for domain, successes in domain_results.items():
            rate = sum(successes) / len(successes) if successes else 0
            analysis["by_domain"][domain] = {
                "attempts": len(successes),
                "success_rate": rate,
                "is_edge": 0.3 <= rate <= 0.7,
            }

        # Get edge problems (failures at the boundary)
        analysis["edge_problems"] = [
            {"content": p.content[:50], "tier": p.tier.name, "domain": p.domain}
            for p in self.edge_failures[-5:]  # Last 5 failures
        ]

        return analysis


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════════════════════

async def demo():
    """Demonstrate steel training"""
    print("\n" + "=" * 70)
    print("         STEEL SHARPENS STEEL - TRAINING DEMO")
    print("=" * 70)

    trainer = SteelTrainer()

    # Run a training cycle
    cycle_result = await trainer.run_training_cycle(sessions=3)

    print(f"\n{'=' * 60}")
    print("CYCLE RESULTS")
    print(f"{'=' * 60}")
    print(f"  Sessions: {cycle_result['sessions']}")
    print(f"  Avg success rate: {cycle_result['avg_success_rate']:.0%}")
    print(f"  Patterns learned: {cycle_result['patterns_learned']}")
    print(f"  Final tier: {cycle_result['final_tier']}")
    print(f"  Edge tier: {cycle_result['edge_tier']}")
    print(f"  Edge failures: {cycle_result['edge_failures']}")

    # Edge analysis
    print(f"\n{'=' * 60}")
    print("EDGE ANALYSIS - Where Growth Lives")
    print(f"{'=' * 60}")

    analysis = trainer.get_edge_analysis()

    print("\nBy Tier:")
    for tier, data in analysis["by_tier"].items():
        edge_marker = " <- EDGE" if data.get("is_edge") else ""
        print(f"  {tier}: {data['success_rate']:.0%} ({data['attempts']} attempts){edge_marker}")

    print("\nBy Domain:")
    for domain, data in analysis["by_domain"].items():
        edge_marker = " <- EDGE" if data.get("is_edge") else ""
        print(f"  {domain}: {data['success_rate']:.0%} ({data['attempts']} attempts){edge_marker}")

    print(f"\n{'=' * 70}")
    print("  Train at the edge. That's where steel sharpens steel.")
    print(f"{'=' * 70}")


if __name__ == "__main__":
    asyncio.run(demo())

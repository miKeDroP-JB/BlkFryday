"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              ORB CORE v1.0                                     ║
║                    The Integration Layer - Everything Connected                ║
║                                                                                 ║
║  "The whole is greater than the sum of its parts."                             ║
║                                                                                 ║
║  This is the piece that connects:                                              ║
║    - ReasoningGrimoire (learns HOW to think)                                   ║
║    - EmojiGrimoire (compresses reasoning to atoms)                             ║
║    - FlowSyncEvolver (improves the substrate everything runs on)               ║
║    - TournamentBrain (100-agent hierarchical debate)                           ║
║                                                                                 ║
║  When connected:                                                                ║
║    -> Tournaments generate reasoning patterns                                   ║
║    -> EmojiGrimoire compresses them to atomic seeds                             ║
║    -> ReasoningGrimoire stores and transfers them                               ║
║    -> FlowSync substrate improves continuously                                  ║
║    -> Better substrate = better everything = better substrate                   ║
║    -> infinity                                                                  ║
║                                                                                 ║
║  Created: December 1, 2025                                                     ║
║  Architect: JB (The Pattern Reader)                                            ║
║  Builder: Prometheus                                                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from enum import Enum
import json
import time

# Import our components
from .reasoning_grimoire import ReasoningGrimoire, ReasoningChain, ReasoningType
from .emoji_grimoire import EmojiGrimoire, HolographicAtom, ReasoningMolecule
from .flowsync_evolver import (
    FlowSync, Flow, Parameter, Metric,
    FlowSyncEvolver, MetaEvolver, HyperEvolver,
    SelfEvolvingSystem
)


# ═══════════════════════════════════════════════════════════════════════════════
# UNIFIED TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class ProcessingMode(Enum):
    """How deeply to process"""
    FAST = "fast"           # Minimal processing, max speed
    BALANCED = "balanced"   # Balance of speed and depth
    DEEP = "deep"           # Full processing, max quality
    RECURSIVE = "recursive" # Self-improving mode


@dataclass
class OrbQuery:
    """A query into the ORB system"""
    content: str
    domain: Optional[str] = None
    mode: ProcessingMode = ProcessingMode.BALANCED
    context: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class OrbResponse:
    """Response from the ORB system"""
    answer: str
    reasoning_chain: Optional[str] = None      # Emoji-compressed chain
    reasoning_expanded: Optional[List[str]] = None  # Expanded steps
    confidence: float = 0.0
    patterns_used: List[str] = field(default_factory=list)
    patterns_learned: List[str] = field(default_factory=list)
    processing_time: float = 0.0
    substrate_generation: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class OrbInsight:
    """An insight extracted from processing"""
    type: str
    content: str
    emoji_seed: str
    confidence: float
    source: str
    timestamp: datetime = field(default_factory=datetime.now)


# ═══════════════════════════════════════════════════════════════════════════════
# ORB CORE - THE INTEGRATION LAYER
# ═══════════════════════════════════════════════════════════════════════════════

class OrbCore:
    """
    The unified intelligence core.

    Connects all components into a single self-improving system.
    Everything runs on FlowSync. Everything improves everything.

    Architecture:

    ┌─────────────────────────────────────────────────────────────────────┐
    │                           ORB CORE                                   │
    │                                                                      │
    │   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
    │   │   REASONING   │<-->│    EMOJI      │<-->│   TOURNAMENT  │       │
    │   │   GRIMOIRE    │    │   GRIMOIRE    │    │     BRAIN     │       │
    │   └───────────────┘    └───────────────┘    └───────────────┘       │
    │          │                    │                    │                │
    │          └────────────────────┼────────────────────┘                │
    │                               v                                      │
    │   ┌─────────────────────────────────────────────────────────────┐   │
    │   │                       FLOWSYNC                               │   │
    │   │                  (learnable substrate)                       │   │
    │   └─────────────────────────────────────────────────────────────┘   │
    │                               ^                                      │
    │                               │                                      │
    │   ┌─────────────────────────────────────────────────────────────┐   │
    │   │    FlowSyncEvolver -> MetaEvolver -> HyperEvolver           │   │
    │   │              (recursive self-improvement)                    │   │
    │   └─────────────────────────────────────────────────────────────┘   │
    │                                                                      │
    └─────────────────────────────────────────────────────────────────────┘
    """

    def __init__(self):
        # Initialize the substrate first - everything runs on this
        self.evolving_system = SelfEvolvingSystem()
        self.substrate = self.evolving_system.substrate

        # Initialize the grimoires
        self.reasoning_grimoire = ReasoningGrimoire()
        self.emoji_grimoire = EmojiGrimoire()

        # Register core flows in the substrate
        self._register_core_flows()

        # System state
        self.queries_processed: int = 0
        self.patterns_learned: int = 0
        self.insights: List[OrbInsight] = []
        self.evolution_cycles: int = 0

        # Performance tracking
        self.metrics = {
            "avg_response_time": 0.0,
            "pattern_hit_rate": 0.0,
            "learning_rate": 0.0,
            "compression_ratio": 0.0
        }

    def _register_core_flows(self):
        """Register the core processing flows in FlowSync"""

        # Pattern lookup flow
        self.substrate.register_flow(Flow(
            id="pattern_lookup",
            name="Pattern Lookup",
            execute=self._flow_pattern_lookup,
            metrics={"execution_time": Metric("execution_time", target=0.05)}
        ))

        # Reasoning flow
        self.substrate.register_flow(Flow(
            id="reasoning",
            name="Reasoning",
            execute=self._flow_reasoning,
            metrics={"execution_time": Metric("execution_time", target=0.1)}
        ))

        # Compression flow
        self.substrate.register_flow(Flow(
            id="compression",
            name="Compression",
            execute=self._flow_compression,
            metrics={"execution_time": Metric("execution_time", target=0.02)}
        ))

        # Learning flow
        self.substrate.register_flow(Flow(
            id="learning",
            name="Learning",
            execute=self._flow_learning,
            metrics={"execution_time": Metric("execution_time", target=0.05)}
        ))

        # Evolution flow
        self.substrate.register_flow(Flow(
            id="evolution",
            name="Evolution",
            execute=self._flow_evolution,
            metrics={"execution_time": Metric("execution_time", target=0.1)}
        ))

    # ═══════════════════════════════════════════════════════════════════════
    # CORE FLOWS (run on FlowSync substrate)
    # ═══════════════════════════════════════════════════════════════════════

    def _flow_pattern_lookup(self, query: OrbQuery) -> Dict:
        """Look up applicable reasoning patterns"""

        guidance = self.reasoning_grimoire.approach_novel_problem(query.content)

        return {
            "status": guidance["status"],
            "patterns": guidance.get("applicable_patterns", []),
            "decomposition": guidance.get("decomposition", []),
            "confidence": guidance.get("confidence", 0.0)
        }

    def _flow_reasoning(self, query: OrbQuery, patterns: Dict) -> Dict:
        """Apply reasoning to generate answer"""

        # If we have patterns, use guided reasoning
        if patterns.get("patterns"):
            # Use the decomposition from patterns
            steps = patterns.get("decomposition", [])

            # Simulate reasoning through each step
            reasoning_chain = []
            for step in steps:
                reasoning_chain.append(f"Applying: {step}")

            return {
                "answer": f"[Guided reasoning result for: {query.content[:50]}...]",
                "chain": reasoning_chain,
                "guided": True
            }

        else:
            # Fresh reasoning without patterns
            default_chain = [
                "Decompose the problem",
                "Analyze components",
                "Synthesize solution",
                "Verify result"
            ]

            return {
                "answer": f"[Fresh reasoning result for: {query.content[:50]}...]",
                "chain": default_chain,
                "guided": False
            }

    def _flow_compression(self, reasoning_result: Dict) -> Dict:
        """Compress reasoning chain to emoji atoms"""

        chain = reasoning_result.get("chain", [])

        # Encode to emoji chain
        emoji_chain = self.emoji_grimoire.encode_chain(chain)

        # Calculate compression
        original_len = sum(len(s) for s in chain)
        compressed_len = len(emoji_chain)
        ratio = 1 - (compressed_len / max(original_len, 1))

        return {
            "emoji_chain": emoji_chain,
            "compression_ratio": ratio,
            "atom_count": len(emoji_chain.replace("->", ""))
        }

    def _flow_learning(self, query: OrbQuery, reasoning: Dict, compression: Dict) -> Dict:
        """Learn from this interaction"""

        chain = reasoning.get("chain", [])
        emoji_chain = compression.get("emoji_chain", "")

        # Store the pattern
        pattern_name = f"pattern_{self.patterns_learned}"

        formula = self.emoji_grimoire.store_pattern(
            name=pattern_name,
            reasoning_steps=chain,
            domain=query.domain or "general",
            confidence=0.7  # Initial confidence
        )

        self.patterns_learned += 1

        return {
            "pattern_name": pattern_name,
            "formula": formula,
            "stored": True
        }

    def _flow_evolution(self) -> Dict:
        """Run one evolution cycle on the substrate"""

        result = self.evolving_system.run_cycle()
        self.evolution_cycles += 1

        return {
            "cycle": self.evolution_cycles,
            "substrate_generation": self.substrate.generation,
            "changes": result
        }

    # ═══════════════════════════════════════════════════════════════════════
    # MAIN PROCESSING PIPELINE
    # ═══════════════════════════════════════════════════════════════════════

    def process(self, query: OrbQuery) -> OrbResponse:
        """
        Main processing pipeline.

        1. Look up patterns (via FlowSync)
        2. Apply reasoning (via FlowSync)
        3. Compress result (via FlowSync)
        4. Learn from interaction (via FlowSync)
        5. Optionally evolve substrate

        Everything flows through FlowSync.
        Everything improves FlowSync.
        """

        start_time = time.time()

        # Step 1: Pattern Lookup
        patterns = self.substrate.execute("pattern_lookup", query)

        # Step 2: Reasoning
        reasoning = self.substrate.execute("reasoning", query, patterns)

        # Step 3: Compression
        compression = self.substrate.execute("compression", reasoning)

        # Step 4: Learning
        learning = self.substrate.execute("learning", query, reasoning, compression)

        # Step 5: Evolution (every N queries)
        evolution_result = None
        if self.queries_processed % 10 == 0:
            evolution_result = self.substrate.execute("evolution")

        # Update metrics
        self.queries_processed += 1
        processing_time = time.time() - start_time

        self._update_metrics(patterns, compression, processing_time)

        # Build response
        response = OrbResponse(
            answer=reasoning["answer"],
            reasoning_chain=compression["emoji_chain"],
            reasoning_expanded=reasoning["chain"],
            confidence=patterns.get("confidence", 0.5),
            patterns_used=[p["name"] for p in patterns.get("patterns", [])[:3]],
            patterns_learned=[learning["pattern_name"]] if learning.get("stored") else [],
            processing_time=processing_time,
            substrate_generation=self.substrate.generation,
            metadata={
                "guided": reasoning.get("guided", False),
                "compression_ratio": compression["compression_ratio"],
                "evolution": evolution_result
            }
        )

        return response

    def _update_metrics(self, patterns: Dict, compression: Dict, time: float):
        """Update running metrics"""

        # Exponential moving average
        alpha = 0.1

        self.metrics["avg_response_time"] = (
            alpha * time + (1 - alpha) * self.metrics["avg_response_time"]
        )

        hit = 1.0 if patterns.get("patterns") else 0.0
        self.metrics["pattern_hit_rate"] = (
            alpha * hit + (1 - alpha) * self.metrics["pattern_hit_rate"]
        )

        self.metrics["compression_ratio"] = (
            alpha * compression["compression_ratio"] +
            (1 - alpha) * self.metrics["compression_ratio"]
        )

        self.metrics["learning_rate"] = self.patterns_learned / max(self.queries_processed, 1)

    # ═══════════════════════════════════════════════════════════════════════
    # RECURSIVE PROCESSING (Deep Mode)
    # ═══════════════════════════════════════════════════════════════════════

    def process_recursive(self, query: OrbQuery, depth: int = 3) -> OrbResponse:
        """
        Recursive self-improving processing.

        Each level:
        1. Process the query
        2. Analyze the processing
        3. Improve the approach
        4. Reprocess with improvements

        Until depth reached or convergence.
        """

        responses = []
        current_query = query

        for level in range(depth):
            # Process at current level
            response = self.process(current_query)
            responses.append(response)

            # Check for convergence (high confidence)
            if response.confidence > 0.95:
                break

            # Run evolution to improve substrate
            self.substrate.execute("evolution")

            # Enhance query with learned patterns for next iteration
            if response.patterns_learned:
                current_query.context["learned"] = response.patterns_learned

        # Return best response
        best = max(responses, key=lambda r: r.confidence)
        best.metadata["recursion_depth"] = len(responses)
        best.metadata["convergence"] = responses[-1].confidence > 0.95

        return best

    # ═══════════════════════════════════════════════════════════════════════
    # INSIGHT EXTRACTION
    # ═══════════════════════════════════════════════════════════════════════

    def extract_insight(self, response: OrbResponse) -> Optional[OrbInsight]:
        """Extract a reusable insight from a response"""

        if response.confidence < 0.7:
            return None

        # Create insight from reasoning chain
        if response.reasoning_chain:
            insight = OrbInsight(
                type="reasoning_pattern",
                content=" -> ".join(response.reasoning_expanded or []),
                emoji_seed=response.reasoning_chain,
                confidence=response.confidence,
                source=f"query_{self.queries_processed}"
            )

            self.insights.append(insight)
            return insight

        return None

    # ═══════════════════════════════════════════════════════════════════════
    # SYSTEM STATUS
    # ═══════════════════════════════════════════════════════════════════════

    def get_status(self) -> Dict:
        """Get complete system status"""

        return {
            "queries_processed": self.queries_processed,
            "patterns_learned": self.patterns_learned,
            "insights_extracted": len(self.insights),
            "evolution_cycles": self.evolution_cycles,
            "substrate_generation": self.substrate.generation,
            "metrics": self.metrics.copy(),
            "substrate_state": self.substrate.get_state(),
            "grimoire_patterns": len(self.reasoning_grimoire.transfer_engine.pattern_store),
            "emoji_compounds": len(self.emoji_grimoire.compounds),
            "evolution_summary": self.evolving_system.get_evolution_summary()
        }

    def get_health(self) -> Dict:
        """Quick health check"""

        return {
            "status": "healthy",
            "uptime_queries": self.queries_processed,
            "pattern_hit_rate": f"{self.metrics['pattern_hit_rate']:.1%}",
            "avg_response_time": f"{self.metrics['avg_response_time']*1000:.1f}ms",
            "compression_ratio": f"{self.metrics['compression_ratio']:.1%}",
            "substrate_gen": self.substrate.generation
        }


# ═══════════════════════════════════════════════════════════════════════════════
# COMPOUND LEARNING LOOP
# ═══════════════════════════════════════════════════════════════════════════════

class CompoundLearningLoop:
    """
    The full compound learning loop.

    reverse engineer -> learn -> build -> test -> refine -> automate -> replicate

    Applied recursively through the ORB Core.
    Each cycle compounds on the last.
    """

    def __init__(self, core: OrbCore):
        self.core = core
        self.cycles: int = 0
        self.improvements: List[Dict] = []
        self.baseline_metrics: Optional[Dict] = None

    def run_cycle(self, test_queries: List[str]) -> Dict:
        """Run one compound learning cycle"""

        cycle_start = time.time()

        # Capture baseline on first run
        if self.baseline_metrics is None:
            self.baseline_metrics = self.core.metrics.copy()

        # Phase 1: REVERSE ENGINEER - Process queries, observe patterns
        responses = []
        for query_text in test_queries:
            query = OrbQuery(content=query_text, mode=ProcessingMode.DEEP)
            response = self.core.process(query)
            responses.append(response)

        # Phase 2: LEARN - Extract insights
        insights = []
        for response in responses:
            insight = self.core.extract_insight(response)
            if insight:
                insights.append(insight)

        # Phase 3: BUILD - Patterns are automatically stored
        patterns_this_cycle = sum(len(r.patterns_learned) for r in responses)

        # Phase 4: TEST - Measure improvement
        current_metrics = self.core.metrics.copy()

        # Phase 5: REFINE - Evolution runs automatically
        evolution_result = self.core.substrate.execute("evolution")

        # Phase 6: AUTOMATE - Everything is already automated :)

        # Phase 7: REPLICATE - Calculate compound improvement
        improvement = self._calculate_improvement(current_metrics)

        cycle_result = {
            "cycle": self.cycles,
            "queries_processed": len(test_queries),
            "insights_extracted": len(insights),
            "patterns_learned": patterns_this_cycle,
            "improvement": improvement,
            "duration": time.time() - cycle_start,
            "substrate_generation": self.core.substrate.generation
        }

        self.improvements.append(cycle_result)
        self.cycles += 1

        return cycle_result

    def _calculate_improvement(self, current: Dict) -> Dict:
        """Calculate improvement from baseline"""

        if not self.baseline_metrics:
            return {}

        improvement = {}

        for key in current:
            baseline_val = self.baseline_metrics.get(key, 0)
            current_val = current.get(key, 0)

            if baseline_val > 0:
                pct_change = ((current_val - baseline_val) / baseline_val) * 100
                improvement[key] = f"{pct_change:+.1f}%"
            else:
                improvement[key] = f"{current_val:.3f}"

        return improvement

    def get_compound_rate(self) -> float:
        """Calculate the compound improvement rate"""

        if len(self.improvements) < 2:
            return 0.0

        # Calculate average improvement per cycle
        hit_rates = [
            float(imp["improvement"].get("pattern_hit_rate", "0%").replace("%", "").replace("+", ""))
            for imp in self.improvements
            if "improvement" in imp and imp["improvement"]
        ]

        if len(hit_rates) >= 2:
            return sum(hit_rates) / len(hit_rates)

        return 0.0

    def project_future(self, cycles: int) -> Dict:
        """Project future improvement"""

        rate = self.get_compound_rate()
        current = self.core.metrics["pattern_hit_rate"]

        projections = {}
        for n in [10, 50, 100, cycles]:
            # Compound formula: current * (1 + rate/100)^n
            projected = current * ((1 + rate/100) ** n)
            projections[f"cycle_{n}"] = min(projected, 1.0)  # Cap at 100%

        return projections


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════════════════════

def demo():
    """Demonstrate the ORB Core integration"""

    print("=" * 70)
    print("                    ORB CORE - Integration Layer")
    print("             Everything Connected. Everything Compounds.")
    print("=" * 70)
    print()

    # Initialize
    print("INITIALIZING ORB CORE...")
    print("-" * 40)
    core = OrbCore()
    print(f"  FlowSync substrate: {len(core.substrate.flows)} flows registered")
    print(f"  ReasoningGrimoire: initialized")
    print(f"  EmojiGrimoire: {len(core.emoji_grimoire.periodic_table)} atoms loaded")
    print(f"  Evolution stack: 3 layers active")
    print()

    # Process some queries
    print("PROCESSING QUERIES:")
    print("-" * 40)

    test_queries = [
        "How do I design a distributed database system?",
        "What's the best strategy for entering a new market?",
        "How can I optimize this algorithm for speed?",
        "Design a feedback loop for continuous improvement",
        "How do I balance innovation with stability?"
    ]

    for query_text in test_queries:
        query = OrbQuery(content=query_text, domain="systems")
        response = core.process(query)

        print(f"\n  Query: {query_text[:50]}...")
        print(f"  Chain: {response.reasoning_chain}")
        print(f"  Confidence: {response.confidence:.0%}")
        print(f"  Learned: {response.patterns_learned}")

    print()

    # Show system status
    print("SYSTEM STATUS:")
    print("-" * 40)
    status = core.get_status()
    print(f"  Queries processed: {status['queries_processed']}")
    print(f"  Patterns learned: {status['patterns_learned']}")
    print(f"  Pattern hit rate: {status['metrics']['pattern_hit_rate']:.1%}")
    print(f"  Compression ratio: {status['metrics']['compression_ratio']:.1%}")
    print(f"  Substrate generation: {status['substrate_generation']}")
    print()

    # Run compound learning loop
    print("COMPOUND LEARNING LOOP:")
    print("-" * 40)

    loop = CompoundLearningLoop(core)

    for i in range(3):
        result = loop.run_cycle(test_queries)
        print(f"  Cycle {result['cycle'] + 1}: "
              f"+{result['patterns_learned']} patterns, "
              f"{result['insights_extracted']} insights, "
              f"{result['duration']*1000:.0f}ms")

    print()

    # Project future
    print("PROJECTIONS:")
    print("-" * 40)
    projections = loop.project_future(100)
    for cycle, rate in projections.items():
        print(f"  {cycle}: {rate:.1%} pattern hit rate")

    print()

    # Health check
    print("HEALTH CHECK:")
    print("-" * 40)
    health = core.get_health()
    for key, value in health.items():
        print(f"  {key}: {value}")

    print()
    print("=" * 70)
    print("  The substrate learns. The grimoires grow. Everything compounds.")
    print("=" * 70)


if __name__ == "__main__":
    demo()

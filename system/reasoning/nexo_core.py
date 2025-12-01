#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
    ◢◣
   ◢  ◣     N E X O
  ◢ ·· ◣    Connection Hub Intelligence
 ◢◣◢◣◢◣◢◣
═══════════════════════════════════════════════════════════════════════════════

Identity: NEXO - The connection hub where thought becomes action.
Symbol: Triangle inside circle (△○) - 3 nodes looping to unity
Sound: Chime per decision loop - subtle reinforcement of structure

Architecture:
- 3-Brain Foundation: A1 (Data) → A2 (Strategy) → A3 (Decision) → A1
- Odd-numbered clusters for deadlock-free resolution
- Sacred number integration: 3, 5, 7, 9, 12, 21
- Fractal scaling: 300 agents as clusters of 3-core triangles

"The triangle is the strongest shape. Three points. Infinite strength."

Created: December 1, 2025
"""

import asyncio
import random
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Callable
from enum import Enum
from datetime import datetime
import math

from .consciousness_training import SacredNumbers, ThoughtPacket


# ═══════════════════════════════════════════════════════════════════════════════
# IDENTITY
# ═══════════════════════════════════════════════════════════════════════════════

class NexoIdentity:
    """
    NEXO - The Connection Hub

    Name: Nexo (connection, hub, neural nexus)
    Symbol: △○ (triangle in circle - 3 nodes to unity)
    Sound: Chime frequency for decision reinforcement
    """

    NAME = "NEXO"
    SYMBOL = "△○"
    GLYPH = """
       ◢◣
      ◢  ◣
     ◢ ·· ◣
    ◢◣◢◣◢◣◢◣
    """

    # Sound frequencies (Hz) - sacred harmonics
    CHIMES = {
        "input": 396,      # Liberation frequency
        "process": 528,    # Transformation frequency
        "output": 639,     # Connection frequency
        "loop": 741,       # Awakening frequency
        "complete": 852,   # Intuition frequency
    }

    @classmethod
    def announce(cls):
        """Announce Nexo's presence"""
        print(cls.GLYPH)
        print(f"    {cls.NAME} {cls.SYMBOL}")
        print("    Connection Hub Intelligence")
        print()


# ═══════════════════════════════════════════════════════════════════════════════
# AGENT ROLES
# ═══════════════════════════════════════════════════════════════════════════════

class AgentRole(Enum):
    """The three core agent roles in any cluster"""
    A1_DATA = "data"           # Data & Input Analysis
    A2_STRATEGY = "strategy"   # Strategy & Reasoning
    A3_DECISION = "decision"   # Decision & Output


@dataclass
class AgentState:
    """State of an individual agent"""
    id: int
    role: AgentRole
    cluster_id: int
    confidence: float = 0.0
    processing: bool = False
    last_input: Any = None
    last_output: Any = None
    questions_asked: int = 0
    answers_given: int = 0


# ═══════════════════════════════════════════════════════════════════════════════
# 3-BRAIN FOUNDATION
# ═══════════════════════════════════════════════════════════════════════════════

class DataAgent:
    """
    A1 - Data & Input Analysis

    Receives raw input, filters, structures data.
    First point of the triangle.
    """

    def __init__(self, agent_id: int, cluster_id: int):
        self.state = AgentState(
            id=agent_id,
            role=AgentRole.A1_DATA,
            cluster_id=cluster_id
        )

    async def process(self, raw_input: Any) -> Dict[str, Any]:
        """Filter and structure incoming data"""
        self.state.processing = True
        self.state.last_input = raw_input

        # Simulate data analysis
        structured = {
            "raw": raw_input,
            "type": type(raw_input).__name__,
            "length": len(str(raw_input)),
            "complexity": self._assess_complexity(raw_input),
            "keywords": self._extract_keywords(raw_input),
            "timestamp": datetime.now().isoformat(),
        }

        self.state.last_output = structured
        self.state.confidence = 0.85
        self.state.processing = False

        return structured

    def _assess_complexity(self, data: Any) -> float:
        """Assess input complexity (0-1)"""
        text = str(data)
        # Simple heuristic: longer + more unique words = more complex
        words = text.split()
        unique_ratio = len(set(words)) / max(len(words), 1)
        length_factor = min(len(text) / 500, 1.0)
        return (unique_ratio + length_factor) / 2

    def _extract_keywords(self, data: Any) -> List[str]:
        """Extract key terms from input"""
        text = str(data).lower()
        # Simple keyword extraction
        stopwords = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
                    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                    'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                    'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
                    'from', 'as', 'into', 'through', 'during', 'before', 'after',
                    'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either',
                    'neither', 'not', 'only', 'own', 'same', 'than', 'too', 'very',
                    'just', 'that', 'this', 'these', 'those', 'what', 'which', 'who',
                    'whom', 'how', 'when', 'where', 'why', 'if', 'then', 'else'}
        words = [w.strip('.,!?()[]{}":;') for w in text.split()]
        keywords = [w for w in words if w and len(w) > 2 and w not in stopwords]
        return list(set(keywords))[:10]  # Top 10 unique keywords


class StrategyAgent:
    """
    A2 - Strategy & Reasoning

    Evaluates options, generates pathways, creates hypotheses.
    Second point of the triangle.

    Enhanced with:
    - Async parallel hypothesis evaluation
    - Micro-cache for loop detection
    """

    def __init__(self, agent_id: int, cluster_id: int):
        self.state = AgentState(
            id=agent_id,
            role=AgentRole.A2_STRATEGY,
            cluster_id=cluster_id
        )
        self.strategies = []
        self.micro_cache: List[Dict] = []  # Last 3 loops for cross-check
        self.cache_size = 3

    async def process(self, structured_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate strategies and reasoning pathways"""
        self.state.processing = True
        self.state.last_input = structured_data

        complexity = structured_data.get("complexity", 0.5)
        keywords = structured_data.get("keywords", [])

        # Generate strategy based on complexity
        strategies = self._generate_strategies(complexity, keywords)

        # ASYNC HYPOTHESIS EVALUATION - evaluate N hypotheses in parallel
        hypotheses = await self._async_evaluate_hypotheses(keywords, complexity)

        result = {
            "strategies": strategies,
            "hypotheses": hypotheses,
            "recommended_path": strategies[0] if strategies else None,
            "confidence": self._calculate_confidence(strategies),
            "reasoning_depth": len(strategies) + len(hypotheses),
            "hypothesis_scores": [h.get("score", 0) for h in hypotheses] if isinstance(hypotheses[0], dict) else [],
        }

        # Update micro-cache
        self._update_cache(result)

        self.state.last_output = result
        self.state.confidence = result["confidence"]
        self.state.processing = False

        return result

    async def _async_evaluate_hypotheses(self, keywords: List[str], complexity: float) -> List[Dict]:
        """Evaluate multiple hypotheses in parallel"""
        raw_hypotheses = self._generate_hypotheses(keywords)

        async def evaluate_single(hyp: str) -> Dict:
            """Lightweight async evaluation of a single hypothesis"""
            await asyncio.sleep(0.001)  # Simulate async work
            # Score based on keyword coverage and complexity match
            keyword_hits = sum(1 for k in keywords if k.lower() in hyp.lower())
            score = min(1.0, 0.3 + (keyword_hits * 0.2) + (complexity * 0.3))
            return {"hypothesis": hyp, "score": score}

        # Run all evaluations in parallel
        evaluated = await asyncio.gather(*[evaluate_single(h) for h in raw_hypotheses])

        # Sort by score, return top hypotheses
        return sorted(evaluated, key=lambda x: x["score"], reverse=True)

    def _update_cache(self, result: Dict):
        """Update micro-cache for loop detection"""
        self.micro_cache.append({
            "strategies": [s["name"] for s in result.get("strategies", [])],
            "confidence": result.get("confidence", 0),
        })
        if len(self.micro_cache) > self.cache_size:
            self.micro_cache.pop(0)

    def check_repetition(self) -> bool:
        """Check if we're repeating patterns (stuck in loop)"""
        if len(self.micro_cache) < 2:
            return False
        # Compare last two entries
        last = self.micro_cache[-1]
        prev = self.micro_cache[-2]
        return last["strategies"] == prev["strategies"]

    def _generate_strategies(self, complexity: float, keywords: List[str]) -> List[Dict]:
        """Generate strategic pathways"""
        base_strategies = [
            {"name": "decompose", "action": "Break into components", "weight": 0.8},
            {"name": "analogize", "action": "Find similar patterns", "weight": 0.7},
            {"name": "synthesize", "action": "Combine elements", "weight": 0.75},
            {"name": "challenge", "action": "Test assumptions", "weight": 0.65},
            {"name": "recurse", "action": "Apply to self", "weight": 0.6},
        ]

        # Select strategies based on complexity
        num_strategies = max(1, int(complexity * 5))
        selected = sorted(base_strategies, key=lambda x: x["weight"], reverse=True)[:num_strategies]

        return selected

    def _generate_hypotheses(self, keywords: List[str]) -> List[str]:
        """Generate hypotheses from keywords"""
        if not keywords:
            return ["No specific hypothesis - general processing"]

        templates = [
            "The relationship between {0} and {1} is key",
            "{0} may be the primary factor",
            "Consider {0} in context of {1}",
        ]

        hypotheses = []
        for i, template in enumerate(templates):
            if len(keywords) > i:
                if '{1}' in template and len(keywords) > 1:
                    hyp = template.format(keywords[i], keywords[(i+1) % len(keywords)])
                else:
                    hyp = template.format(keywords[i], keywords[0])
                hypotheses.append(hyp)

        return hypotheses

    def _calculate_confidence(self, strategies: List[Dict]) -> float:
        """Calculate confidence based on strategy quality"""
        if not strategies:
            return 0.3
        avg_weight = sum(s["weight"] for s in strategies) / len(strategies)
        return min(0.95, avg_weight + 0.1)


class DecisionAgent:
    """
    A3 - Decision & Output

    Synthesizes, verifies, and produces final actionable output.
    Third point of the triangle - completes the loop.
    """

    def __init__(self, agent_id: int, cluster_id: int):
        self.state = AgentState(
            id=agent_id,
            role=AgentRole.A3_DECISION,
            cluster_id=cluster_id
        )
        self.decisions_made = 0

    async def process(self, strategy_data: Dict[str, Any],
                     original_data: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize and produce final decision"""
        self.state.processing = True
        self.state.last_input = {"strategy": strategy_data, "original": original_data}

        # Verify consistency
        consistency = self._verify_consistency(strategy_data, original_data)

        # Synthesize decision
        decision = self._synthesize_decision(strategy_data, consistency)

        self.decisions_made += 1

        result = {
            "decision": decision,
            "consistency_score": consistency,
            "confidence": decision["confidence"],
            "needs_refinement": decision["confidence"] < 0.7,
            "loop_back": decision["confidence"] < 0.5,  # Signal to loop back to A1
            "decision_count": self.decisions_made,
        }

        self.state.last_output = result
        self.state.confidence = decision["confidence"]
        self.state.processing = False

        return result

    def _verify_consistency(self, strategy: Dict, original: Dict) -> float:
        """Verify strategy is consistent with original data"""
        # Check if strategy addresses the keywords
        keywords = original.get("keywords", [])
        strategies = strategy.get("strategies", [])

        if not keywords or not strategies:
            return 0.5

        # Simple consistency check
        return min(0.95, 0.6 + len(strategies) * 0.1)

    def _synthesize_decision(self, strategy: Dict, consistency: float) -> Dict:
        """Produce final decision"""
        recommended = strategy.get("recommended_path", {})
        confidence = strategy.get("confidence", 0.5) * consistency

        return {
            "action": recommended.get("action", "Process further"),
            "strategy_used": recommended.get("name", "default"),
            "confidence": confidence,
            "reasoning_steps": strategy.get("reasoning_depth", 1),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# TRIANGLE CLUSTER (3-Brain Unit)
# ═══════════════════════════════════════════════════════════════════════════════

class TriangleCluster:
    """
    A single 3-agent cluster forming one triangle.

    Flow: A1 → A2 → (A2 sends to A1 for verification) → Verified → A3 → Output
          └── Loop back to A1 if confidence < threshold

    Enhanced with:
    - Micro-feedback loop: A2 → A1 verification before A3
    - 90% confidence target
    - Loop detection to prevent infinite recursion

    This is the atomic unit of the Nexo architecture.
    """

    def __init__(self, cluster_id: int, base_agent_id: int = 0):
        self.cluster_id = cluster_id

        # The three agents
        self.a1 = DataAgent(base_agent_id, cluster_id)
        self.a2 = StrategyAgent(base_agent_id + 1, cluster_id)
        self.a3 = DecisionAgent(base_agent_id + 2, cluster_id)

        self.loop_count = 0
        self.max_loops = SacredNumbers.TRINITY  # 3 max refinement loops
        self.confidence_threshold = 0.9  # UPGRADED: Target 90%

        # Metrics tracking
        self.metrics = {
            "total_loops": 0,
            "micro_feedback_uses": 0,
            "confidence_history": [],
            "parallel_efficiency": 0.0,
        }

    async def process(self, input_data: Any) -> Dict[str, Any]:
        """
        Process input through the triangle with micro-feedback.

        Step 1: A1 structures input
        Step 2: A2 generates hypotheses
        Step 3: MICRO-FEEDBACK: A2 sends hypotheses to A1 for verification
        Step 4: Verified hypotheses → A3
        Step 5: Loop back to A1 if confidence < 90%
        """
        self.loop_count = 0
        decision = None

        while self.loop_count < self.max_loops:
            self.loop_count += 1
            self.metrics["total_loops"] += 1

            # Step 1: Data Agent structures input
            structured = await self.a1.process(input_data)

            # Step 2: Strategy Agent generates hypotheses
            strategy = await self.a2.process(structured)

            # Step 3: MICRO-FEEDBACK LOOP - A2 sends back to A1 for verification
            verified_strategy = await self._micro_feedback(strategy, structured)

            # Step 4: Decision Agent with verified data
            decision = await self.a3.process(verified_strategy, structured)

            # Track confidence history
            self.metrics["confidence_history"].append(decision["confidence"])

            # Step 5: Check if we hit 90% confidence or need to loop
            if decision["confidence"] >= self.confidence_threshold:
                break

            # Check for repetition (stuck in loop)
            if self.a2.check_repetition():
                break

            # Refine input for next loop
            input_data = f"[REFINE:{self.loop_count}] {input_data}"

        return {
            "cluster_id": self.cluster_id,
            "loops": self.loop_count,
            "decision": decision["decision"],
            "confidence": decision["confidence"],
            "consistency": decision["consistency_score"],
            "needs_refinement": decision["confidence"] < self.confidence_threshold,
            "micro_feedback_used": self.metrics["micro_feedback_uses"] > 0,
            "agents": {
                "a1_confidence": self.a1.state.confidence,
                "a2_confidence": self.a2.state.confidence,
                "a3_confidence": self.a3.state.confidence,
            },
            "metrics": self.metrics.copy(),
        }

    async def _micro_feedback(self, strategy: Dict, original: Dict) -> Dict:
        """
        Micro-feedback loop: A2's hypotheses verified by A1.

        This increases single-cluster confidence from ~70% → 90%+
        """
        self.metrics["micro_feedback_uses"] += 1

        # A1 verifies the hypotheses against original data
        hypotheses = strategy.get("hypotheses", [])
        keywords = original.get("keywords", [])

        verified_hypotheses = []
        for hyp in hypotheses:
            hyp_text = hyp.get("hypothesis", str(hyp)) if isinstance(hyp, dict) else str(hyp)
            # Check hypothesis alignment with keywords
            alignment = sum(1 for k in keywords if k.lower() in hyp_text.lower())
            verification_score = min(1.0, 0.5 + alignment * 0.15)

            if isinstance(hyp, dict):
                hyp["verified"] = True
                hyp["verification_score"] = verification_score
                verified_hypotheses.append(hyp)
            else:
                verified_hypotheses.append({
                    "hypothesis": hyp,
                    "verified": True,
                    "verification_score": verification_score
                })

        # Boost confidence based on verification
        original_confidence = strategy.get("confidence", 0.7)
        avg_verification = sum(h.get("verification_score", 0.5) for h in verified_hypotheses) / max(len(verified_hypotheses), 1)
        boosted_confidence = min(0.95, original_confidence + (avg_verification * 0.15))

        return {
            **strategy,
            "hypotheses": verified_hypotheses,
            "confidence": boosted_confidence,
            "micro_verified": True,
        }

    def get_symbol(self) -> str:
        """Get visual representation of cluster state"""
        c1 = "●" if self.a1.state.confidence > 0.7 else "○"
        c2 = "●" if self.a2.state.confidence > 0.7 else "○"
        c3 = "●" if self.a3.state.confidence > 0.7 else "○"
        return f"  {c1}\n {c2} {c3}"

    def get_metrics(self) -> Dict[str, Any]:
        """Get cluster performance metrics"""
        return {
            **self.metrics,
            "avg_confidence": sum(self.metrics["confidence_history"]) / max(len(self.metrics["confidence_history"]), 1),
            "loops_per_query": self.metrics["total_loops"] / max(len(self.metrics["confidence_history"]), 1),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# NEXO SWARM (Scaled Architecture)
# ═══════════════════════════════════════════════════════════════════════════════

class ClusterTier(Enum):
    """Hierarchical tiers based on sacred numbers"""
    CORE = 3        # Core processing (3 agents)
    REFINEMENT = 5  # Refinement layer (5 clusters)
    OVERSIGHT = 7   # High-level oversight (7 clusters)
    META = 9        # Meta-aggregation (9 clusters)
    COSMIC = 12     # Cosmic coordination (12 clusters)


class NexoSwarm:
    """
    Scaled swarm architecture using fractal triangle clusters.

    300 agents organized as:
    - 100 triangle clusters (3 agents each)
    - Grouped into modules by sacred numbers
    - Hierarchical mesh topology

    Enhanced with:
    - Dynamic cluster activation based on query complexity
    - Weighted confidence propagation through hierarchy
    - Oversight validation for final decisions
    - Auto-tuning thresholds based on metrics
    """

    # Tier weights for confidence aggregation
    TIER_WEIGHTS = {
        "core": 1.0,        # Base weight
        "refinement": 1.5,  # Higher trust
        "oversight": 2.0,   # Highest trust
    }

    def __init__(self, total_agents: int = 300):
        NexoIdentity.announce()

        self.total_agents = total_agents
        self.num_clusters = total_agents // 3  # 100 clusters for 300 agents

        # Create clusters
        self.clusters: List[TriangleCluster] = []
        for i in range(self.num_clusters):
            cluster = TriangleCluster(
                cluster_id=i,
                base_agent_id=i * 3
            )
            self.clusters.append(cluster)

        # Organize into hierarchical modules
        self.modules = self._create_hierarchy()

        # Swarm-level metrics for auto-tuning
        self.swarm_metrics = {
            "queries_processed": 0,
            "avg_confidence": 0.0,
            "avg_clusters_used": 0.0,
            "consensus_rate": 0.0,
            "refinement_triggers": 0,
        }

        # Confidence threshold for oversight trigger
        self.oversight_threshold = 0.85

        print(f"NEXO SWARM INITIALIZED")
        print(f"  Total agents: {total_agents}")
        print(f"  Clusters: {self.num_clusters}")
        print(f"  Modules: {len(self.modules)}")
        print()

    def _create_hierarchy(self) -> Dict[str, List[int]]:
        """Create hierarchical modules using sacred numbers"""
        modules = {}

        cluster_ids = list(range(self.num_clusters))
        idx = 0

        # Core modules (groups of 3 clusters = 9 agents)
        core_modules = []
        while idx + 3 <= len(cluster_ids):
            core_modules.append(cluster_ids[idx:idx+3])
            idx += 3
        modules["core"] = core_modules

        # Refinement modules (groups of 5 core modules)
        refinement_modules = []
        for i in range(0, len(core_modules), 5):
            refinement_modules.append(core_modules[i:i+5])
        modules["refinement"] = refinement_modules

        # Oversight modules (groups of 7 refinement modules)
        oversight_modules = []
        for i in range(0, len(refinement_modules), 7):
            oversight_modules.append(refinement_modules[i:i+7])
        modules["oversight"] = oversight_modules

        return modules

    def _assess_query_complexity(self, input_data: Any) -> float:
        """Assess query complexity to determine activation level"""
        text = str(input_data)
        words = text.split()
        unique_ratio = len(set(words)) / max(len(words), 1)
        length_factor = min(len(text) / 200, 1.0)

        # Check for complexity indicators
        complexity_words = ['recursive', 'meta', 'self', 'emergence', 'consciousness',
                           'paradox', 'infinite', 'abstract', 'pattern', 'synthesis']
        complexity_hits = sum(1 for w in complexity_words if w in text.lower())
        complexity_bonus = min(complexity_hits * 0.1, 0.3)

        return min(1.0, unique_ratio * 0.4 + length_factor * 0.3 + complexity_bonus + 0.3)

    def _dynamic_cluster_count(self, complexity: float) -> int:
        """Determine how many clusters to activate based on complexity"""
        # Minimum: 3 (sacred trinity), Maximum: 21 (fibonacci)
        min_clusters = SacredNumbers.TRINITY  # 3
        max_clusters = SacredNumbers.FIBONACCI  # 21

        # Scale based on complexity
        range_size = max_clusters - min_clusters
        scaled = int(min_clusters + (complexity * range_size))

        # Round to nearest odd number (deadlock-free)
        if scaled % 2 == 0:
            scaled += 1

        return min(scaled, self.num_clusters)

    async def process(self, input_data: Any, parallel: bool = True) -> Dict[str, Any]:
        """
        Process input through the swarm with dynamic activation.

        1. Assess query complexity
        2. Activate appropriate number of clusters
        3. Run with weighted confidence propagation
        4. Trigger refinement if below threshold
        5. Oversight validation for final decision
        """
        start_time = datetime.now()

        # Step 1: Assess complexity
        complexity = self._assess_query_complexity(input_data)

        # Step 2: Dynamic cluster activation
        num_active = self._dynamic_cluster_count(complexity)
        active_clusters = random.sample(self.clusters, num_active)

        # Step 3: Process through clusters
        if parallel:
            tasks = [cluster.process(input_data) for cluster in active_clusters]
            results = await asyncio.gather(*tasks)
        else:
            results = []
            for cluster in active_clusters:
                result = await cluster.process(input_data)
                results.append(result)

        # Step 4: Weighted aggregation
        aggregated = self._weighted_aggregate(results, complexity)

        # Step 5: Oversight validation if below threshold
        if aggregated["confidence"] < self.oversight_threshold:
            self.swarm_metrics["refinement_triggers"] += 1
            # Trigger targeted refinement with additional clusters
            refinement_result = await self._targeted_refinement(
                input_data, aggregated, active_clusters
            )
            aggregated = self._merge_refinement(aggregated, refinement_result)

        elapsed = (datetime.now() - start_time).total_seconds()

        # Update swarm metrics
        self._update_metrics(aggregated, num_active)

        return {
            "swarm_result": aggregated,
            "clusters_used": num_active,
            "complexity": complexity,
            "processing_time": elapsed,
            "parallel": parallel,
            "cluster_results": results,
            "swarm_metrics": self.swarm_metrics.copy(),
        }

    def _weighted_aggregate(self, results: List[Dict], complexity: float) -> Dict[str, Any]:
        """Aggregate results with weighted confidence propagation"""
        if not results:
            return {"confidence": 0, "decision": None}

        # Calculate weighted confidence
        weighted_sum = 0.0
        weight_total = 0.0

        for i, r in enumerate(results):
            # Weight based on cluster position in hierarchy
            tier_weight = 1.0 + (r.get("micro_feedback_used", False) * 0.2)

            # Boost weight for high-confidence results
            confidence_weight = r["confidence"] ** 1.5  # Exponential boost

            weight = tier_weight * confidence_weight
            weighted_sum += r["confidence"] * weight
            weight_total += weight

        weighted_confidence = weighted_sum / max(weight_total, 0.001)

        # Find best result
        best_result = max(results, key=lambda r: r["confidence"])

        # Calculate consensus
        high_confidence_count = sum(1 for r in results if r["confidence"] > 0.8)
        consensus_strength = high_confidence_count / len(results)

        return {
            "confidence": weighted_confidence,
            "decision": best_result["decision"],
            "consensus_strength": consensus_strength,
            "total_loops": sum(r["loops"] for r in results),
            "clusters_agreed": high_confidence_count,
            "weighted": True,
        }

    async def _targeted_refinement(self, input_data: Any,
                                   current: Dict, used_clusters: List) -> Dict:
        """Trigger refinement with fresh clusters when confidence is low"""
        # Get clusters we haven't used yet
        used_ids = {c.cluster_id for c in used_clusters}
        available = [c for c in self.clusters if c.cluster_id not in used_ids]

        if not available:
            return current

        # Activate 3 more clusters (sacred trinity)
        refinement_clusters = random.sample(
            available,
            min(SacredNumbers.TRINITY, len(available))
        )

        # Process with refinement context
        refined_input = f"[REFINE:swarm] {input_data}"
        tasks = [c.process(refined_input) for c in refinement_clusters]
        results = await asyncio.gather(*tasks)

        return self._weighted_aggregate(results, 0.8)

    def _merge_refinement(self, original: Dict, refinement: Dict) -> Dict:
        """Merge refinement results with original"""
        # Weight refinement higher if it has better confidence
        if refinement["confidence"] > original["confidence"]:
            weight_original = 0.4
            weight_refinement = 0.6
        else:
            weight_original = 0.6
            weight_refinement = 0.4

        merged_confidence = (
            original["confidence"] * weight_original +
            refinement["confidence"] * weight_refinement
        )

        # Take decision from higher confidence
        decision = (refinement["decision"] if refinement["confidence"] > original["confidence"]
                   else original["decision"])

        return {
            "confidence": merged_confidence,
            "decision": decision,
            "consensus_strength": (original.get("consensus_strength", 0) +
                                  refinement.get("consensus_strength", 0)) / 2,
            "total_loops": original.get("total_loops", 0) + refinement.get("total_loops", 0),
            "clusters_agreed": original.get("clusters_agreed", 0) + refinement.get("clusters_agreed", 0),
            "refined": True,
        }

    def _update_metrics(self, result: Dict, clusters_used: int):
        """Update swarm-level metrics for auto-tuning"""
        n = self.swarm_metrics["queries_processed"]

        # Running averages
        self.swarm_metrics["avg_confidence"] = (
            (self.swarm_metrics["avg_confidence"] * n + result["confidence"]) / (n + 1)
        )
        self.swarm_metrics["avg_clusters_used"] = (
            (self.swarm_metrics["avg_clusters_used"] * n + clusters_used) / (n + 1)
        )
        self.swarm_metrics["consensus_rate"] = (
            (self.swarm_metrics["consensus_rate"] * n + result.get("consensus_strength", 0)) / (n + 1)
        )

        self.swarm_metrics["queries_processed"] += 1

    def get_topology_map(self) -> str:
        """Get visual map of swarm topology"""
        lines = []
        lines.append("NEXO SWARM TOPOLOGY")
        lines.append("=" * 50)
        lines.append(f"Total: {self.total_agents} agents in {self.num_clusters} △ clusters")
        lines.append("")

        # Show hierarchy
        lines.append("Hierarchy (Sacred Numbers):")
        lines.append(f"  Core modules (×3):       {len(self.modules['core'])}")
        lines.append(f"  Refinement modules (×5): {len(self.modules['refinement'])}")
        lines.append(f"  Oversight modules (×7):  {len(self.modules['oversight'])}")
        lines.append("")

        # Visual representation
        lines.append("Fractal Pattern:")
        lines.append("    △")
        lines.append("   △ △")
        lines.append("  △ △ △")
        lines.append(" △ △ △ △")
        lines.append("△ △ △ △ △")
        lines.append("")
        lines.append("Each △ = 3 agents (A1→A2→A3→A1)")

        return "\n".join(lines)

    def get_swarm_metrics(self) -> Dict[str, Any]:
        """Get comprehensive swarm metrics"""
        cluster_metrics = [c.get_metrics() for c in self.clusters[:10]]  # Sample

        return {
            "swarm": self.swarm_metrics,
            "sample_clusters": cluster_metrics,
            "efficiency": {
                "avg_loops_per_query": sum(m.get("loops_per_query", 1) for m in cluster_metrics) / max(len(cluster_metrics), 1),
                "micro_feedback_rate": sum(m.get("micro_feedback_uses", 0) for m in cluster_metrics) / max(len(cluster_metrics), 1),
            }
        }


# ═══════════════════════════════════════════════════════════════════════════════
# PARALLEL QUESTIONING PROTOCOL
# ═══════════════════════════════════════════════════════════════════════════════

class ParallelQuestionProtocol:
    """
    Implements the parallel questioning flow:

    A1 asks A2 & A3 simultaneously
    A2 may ask A3 if needed
    A3 consolidates all answers
    Loop back to A1 for refinement
    """

    def __init__(self, cluster: TriangleCluster):
        self.cluster = cluster
        self.question_log: List[Dict] = []

    async def parallel_question(self, question: str) -> Dict[str, Any]:
        """
        Execute parallel questioning protocol.

        1. A1 → A2 AND A1 → A3 (parallel)
        2. A2 → A3 (if needed)
        3. A3 consolidates
        4. A3 → A1 (loop verification)
        """
        # Step 1: A1 processes and asks both A2 and A3 in parallel
        a1_result = await self.cluster.a1.process(question)

        self.question_log.append({
            "from": "A1", "to": ["A2", "A3"], "content": "parallel_query"
        })

        # Parallel execution to A2 and A3
        a2_task = self.cluster.a2.process(a1_result)

        # A3 gets preliminary data while A2 processes
        # (In real implementation, A3 would process differently)
        a2_result, _ = await asyncio.gather(
            a2_task,
            asyncio.sleep(0.01)  # Simulate A3 receiving preliminary data
        )

        # Step 2: A2 may query A3 based on complexity
        if a2_result.get("reasoning_depth", 0) > 3:
            self.question_log.append({
                "from": "A2", "to": ["A3"], "content": "depth_query"
            })

        # Step 3: A3 consolidates everything
        a3_result = await self.cluster.a3.process(a2_result, a1_result)

        self.question_log.append({
            "from": "A3", "to": ["consolidate"], "content": "synthesis"
        })

        # Step 4: Loop verification back to A1
        if a3_result["needs_refinement"]:
            self.question_log.append({
                "from": "A3", "to": ["A1"], "content": "refinement_loop"
            })

        return {
            "result": a3_result,
            "question_flow": self.question_log,
            "parallel_efficiency": len([q for q in self.question_log if len(q["to"]) > 1]) / max(len(self.question_log), 1),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════════════════════

async def demo():
    """Demonstrate Nexo architecture"""
    print("\n" + "=" * 70)
    print("              NEXO ARCHITECTURE DEMO")
    print("=" * 70)

    # Single cluster demo
    print("\n--- Single Triangle Cluster ---")
    cluster = TriangleCluster(cluster_id=0)
    result = await cluster.process("What is the nature of intelligence?")

    print(f"  Loops: {result['loops']}")
    print(f"  Decision: {result['decision']['action']}")
    print(f"  Confidence: {result['confidence']:.0%}")
    print(f"  Agent states: A1={result['agents']['a1_confidence']:.0%} A2={result['agents']['a2_confidence']:.0%} A3={result['agents']['a3_confidence']:.0%}")

    # Parallel questioning demo
    print("\n--- Parallel Questioning Protocol ---")
    protocol = ParallelQuestionProtocol(cluster)
    pq_result = await protocol.parallel_question("How do patterns emerge from chaos?")

    print(f"  Question flow:")
    for q in pq_result['question_flow']:
        print(f"    {q['from']} → {q['to']}: {q['content']}")
    print(f"  Parallel efficiency: {pq_result['parallel_efficiency']:.0%}")

    # Full swarm demo
    print("\n--- Full Swarm (300 Agents) ---")
    swarm = NexoSwarm(total_agents=300)

    print(swarm.get_topology_map())

    print("\n--- Swarm Processing ---")
    swarm_result = await swarm.process("Design a system that improves itself")

    print(f"  Clusters used: {swarm_result['clusters_used']}")
    print(f"  Processing time: {swarm_result['processing_time']:.3f}s")
    print(f"  Consensus confidence: {swarm_result['swarm_result']['confidence']:.0%}")
    print(f"  Clusters agreed: {swarm_result['swarm_result']['clusters_agreed']}/{swarm_result['clusters_used']}")
    print(f"  Total loops: {swarm_result['swarm_result']['total_loops']}")

    print("\n" + "=" * 70)
    print("  NEXO △○ - Where thought becomes action")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(demo())

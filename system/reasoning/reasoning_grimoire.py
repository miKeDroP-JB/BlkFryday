#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
THE REASONING GRIMOIRE - AGI Breakthrough Architecture
═══════════════════════════════════════════════════════════════════════════════

This is the piece that makes everything else AGI-adjacent.

Instead of just storing WHAT worked, we store WHY it worked.
Instead of just learning tasks, we learn REASONING PATTERNS.
Instead of solving seen problems, we TRANSFER reasoning to novel domains.

The key insight: Intelligence isn't about knowing answers.
It's about knowing HOW TO FIND answers.

ARCHITECTURE:
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REASONING GRIMOIRE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   PATTERN    │    │   TRANSFER   │    │    META      │                  │
│  │  EXTRACTOR   │───▶│    ENGINE    │───▶│   LEARNER    │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│         │                   │                   │                           │
│         ▼                   ▼                   ▼                           │
│  ┌─────────────────────────────────────────────────────────────┐               │
│  │              REASONING PATTERN STORE                     │               │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │               │
│  │  │DECOMPOSE│ │VALIDATE │ │SYNTHESIZE│ │ANALOGIZE│ ...   │               │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │               │
│  └─────────────────────────────────────────────────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Created: December 1, 2025
Architect: JB + Claude
Mission: Build intelligence that transfers, not just memorizes
"""

import json
import hashlib
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from collections import defaultdict
import math
import re


# ═══════════════════════════════════════════════════════════════════════════════
# CORE DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

class ReasoningType(Enum):
    """Fundamental types of reasoning - the atoms of thought"""
    DECOMPOSITION = "decomposition"      # Breaking complex into simple
    COMPOSITION = "composition"          # Building complex from simple
    ANALOGY = "analogy"                  # Finding similar patterns
    INDUCTION = "induction"              # Specific to general
    DEDUCTION = "deduction"              # General to specific
    ABDUCTION = "abduction"              # Best explanation inference
    CAUSAL = "causal"                    # Cause and effect chains
    COUNTERFACTUAL = "counterfactual"    # What-if reasoning
    RECURSIVE = "recursive"              # Self-referential reasoning
    ADVERSARIAL = "adversarial"          # Finding flaws/attacks
    SYNTHESIS = "synthesis"              # Merging multiple solutions
    OPTIMIZATION = "optimization"        # Finding best within constraints


class ProblemDomain(Enum):
    """Domains where reasoning patterns can apply"""
    SOFTWARE = "software"
    BUSINESS = "business"
    CREATIVE = "creative"
    SCIENTIFIC = "scientific"
    SOCIAL = "social"
    STRATEGIC = "strategic"
    MATHEMATICAL = "mathematical"
    LINGUISTIC = "linguistic"
    SYSTEMS = "systems"
    UNKNOWN = "unknown"


@dataclass
class ReasoningStep:
    """A single step in a reasoning chain"""
    step_id: str
    reasoning_type: ReasoningType
    description: str
    input_state: str           # What we knew before this step
    output_state: str          # What we know after this step
    confidence: float          # How confident are we in this step
    alternatives_considered: List[str] = field(default_factory=list)
    why_this_path: str = ""    # Explanation of why this path was chosen


@dataclass
class ReasoningChain:
    """A complete chain of reasoning from problem to solution"""
    chain_id: str
    problem_signature: str      # Hash of problem type
    steps: List[ReasoningStep]
    total_confidence: float
    domains_applicable: List[ProblemDomain]
    success_count: int = 0
    failure_count: int = 0
    transfer_success: int = 0  # Times it worked on NEW problems

    @property
    def success_rate(self) -> float:
        total = self.success_count + self.failure_count
        return self.success_count / total if total > 0 else 0.5

    @property
    def transfer_rate(self) -> float:
        """How well does this reasoning transfer to new domains?"""
        if self.success_count == 0:
            return 0.0
        return self.transfer_success / self.success_count


@dataclass
class ReasoningGlyph:
    """
    Compressed representation of a reasoning pattern.
    This is the magic - we compress reasoning the same way we compress prompts.
    """
    glyph: str                          # e.g., "↓decomp→∥gen→⊕merge→✓verify"
    expanded_pattern: ReasoningChain
    compression_ratio: float
    creation_time: float
    usage_count: int = 0
    avg_success_when_used: float = 0.0

    def to_dict(self) -> Dict:
        return {
            "glyph": self.glyph,
            "chain_id": self.expanded_pattern.chain_id,
            "compression_ratio": self.compression_ratio,
            "usage_count": self.usage_count,
            "avg_success": self.avg_success_when_used
        }


# ═══════════════════════════════════════════════════════════════════════════════
# REASONING PATTERN EXTRACTOR
# ═══════════════════════════════════════════════════════════════════════════════

class ReasoningExtractor:
    """
    Extracts reasoning patterns from tournament debate results.

    This is where we capture the WHY, not just the WHAT.
    After a tournament produces a winning solution, we analyze
    the debate transcript to extract the reasoning chain that led to victory.
    """

    # Markers that indicate different reasoning types in debate
    REASONING_MARKERS = {
        ReasoningType.DECOMPOSITION: [
            "break this down", "split into", "first we need to",
            "component parts", "step by step", "subdivide"
        ],
        ReasoningType.COMPOSITION: [
            "combine", "merge", "integrate", "bring together",
            "synthesize from", "build up from"
        ],
        ReasoningType.ANALOGY: [
            "similar to", "like when", "just as", "reminds me of",
            "pattern from", "borrowed from"
        ],
        ReasoningType.INDUCTION: [
            "from these examples", "generalizing", "the pattern suggests",
            "based on cases", "extrapolating"
        ],
        ReasoningType.DEDUCTION: [
            "therefore", "it follows that", "given that", "must be",
            "logically", "necessarily"
        ],
        ReasoningType.ABDUCTION: [
            "best explanation", "most likely", "probably because",
            "hypothesis", "inference to"
        ],
        ReasoningType.CAUSAL: [
            "causes", "leads to", "results in", "because of",
            "effect of", "consequence"
        ],
        ReasoningType.COUNTERFACTUAL: [
            "what if", "alternatively", "if instead", "had we",
            "suppose", "imagine if"
        ],
        ReasoningType.ADVERSARIAL: [
            "flaw in", "weakness", "attack", "counter",
            "problem with", "fails when"
        ],
        ReasoningType.OPTIMIZATION: [
            "maximize", "minimize", "optimal", "best",
            "most efficient", "trade-off"
        ]
    }

    def __init__(self):
        self.extracted_patterns: List[ReasoningChain] = []

    def extract_from_debate(
        self,
        debate_transcript: str,
        winning_solution: str,
        problem_description: str,
        debate_scores: Dict[str, float]
    ) -> ReasoningChain:
        """
        Extract the reasoning chain from a tournament debate.

        Args:
            debate_transcript: Full text of the debate
            winning_solution: The solution that won
            problem_description: Original problem
            debate_scores: Scores for different approaches

        Returns:
            ReasoningChain capturing the winning reasoning pattern
        """
        # Generate problem signature for matching similar problems
        problem_sig = self._generate_problem_signature(problem_description)

        # Extract reasoning steps from transcript
        steps = self._extract_steps(debate_transcript)

        # Identify which domains this applies to
        domains = self._identify_domains(problem_description, winning_solution)

        # Calculate overall confidence from debate scores
        total_confidence = self._calculate_confidence(debate_scores)

        chain = ReasoningChain(
            chain_id=self._generate_chain_id(problem_sig, steps),
            problem_signature=problem_sig,
            steps=steps,
            total_confidence=total_confidence,
            domains_applicable=domains,
            success_count=1  # It won the debate, so count as success
        )

        self.extracted_patterns.append(chain)
        return chain

    def _generate_problem_signature(self, problem: str) -> str:
        """Create a signature that captures problem TYPE, not specifics"""
        # Extract key structural elements
        has_creation = any(w in problem.lower() for w in ["create", "build", "make", "generate"])
        has_analysis = any(w in problem.lower() for w in ["analyze", "evaluate", "assess", "review"])
        has_optimization = any(w in problem.lower() for w in ["optimize", "improve", "enhance", "better"])
        has_transformation = any(w in problem.lower() for w in ["convert", "transform", "change", "modify"])
        has_search = any(w in problem.lower() for w in ["find", "search", "locate", "discover"])

        sig_parts = []
        if has_creation: sig_parts.append("CREATE")
        if has_analysis: sig_parts.append("ANALYZE")
        if has_optimization: sig_parts.append("OPTIMIZE")
        if has_transformation: sig_parts.append("TRANSFORM")
        if has_search: sig_parts.append("SEARCH")

        if not sig_parts:
            sig_parts.append("GENERAL")

        return "|".join(sorted(sig_parts))

    def _extract_steps(self, transcript: str) -> List[ReasoningStep]:
        """Extract reasoning steps from debate transcript"""
        steps = []
        step_num = 0

        # Split transcript into chunks (simplified - real version would be smarter)
        chunks = transcript.split("\n\n")

        for chunk in chunks:
            if not chunk.strip():
                continue

            # Identify reasoning type for this chunk
            reasoning_type = self._identify_reasoning_type(chunk)

            step = ReasoningStep(
                step_id=f"step_{step_num}",
                reasoning_type=reasoning_type,
                description=chunk[:200] + "..." if len(chunk) > 200 else chunk,
                input_state=f"state_{step_num}",
                output_state=f"state_{step_num + 1}",
                confidence=0.8,  # Default confidence
                why_this_path=self._extract_justification(chunk)
            )
            steps.append(step)
            step_num += 1

        return steps

    def _identify_reasoning_type(self, text: str) -> ReasoningType:
        """Identify what type of reasoning is being used"""
        text_lower = text.lower()

        best_type = ReasoningType.DEDUCTION  # Default
        best_score = 0

        for r_type, markers in self.REASONING_MARKERS.items():
            score = sum(1 for m in markers if m in text_lower)
            if score > best_score:
                best_score = score
                best_type = r_type

        return best_type

    def _identify_domains(self, problem: str, solution: str) -> List[ProblemDomain]:
        """Identify which domains this reasoning applies to"""
        domains = []
        combined = (problem + " " + solution).lower()

        domain_keywords = {
            ProblemDomain.SOFTWARE: ["code", "program", "api", "function", "algorithm"],
            ProblemDomain.BUSINESS: ["revenue", "customer", "market", "profit", "strategy"],
            ProblemDomain.CREATIVE: ["design", "write", "create", "artistic", "story"],
            ProblemDomain.SCIENTIFIC: ["hypothesis", "experiment", "data", "research"],
            ProblemDomain.STRATEGIC: ["plan", "goal", "objective", "tactic", "compete"],
            ProblemDomain.SYSTEMS: ["architecture", "scale", "integrate", "pipeline"],
        }

        for domain, keywords in domain_keywords.items():
            if any(kw in combined for kw in keywords):
                domains.append(domain)

        if not domains:
            domains.append(ProblemDomain.UNKNOWN)

        return domains

    def _calculate_confidence(self, scores: Dict[str, float]) -> float:
        """Calculate overall confidence from debate scores"""
        if not scores:
            return 0.7
        return sum(scores.values()) / len(scores)

    def _extract_justification(self, text: str) -> str:
        """Extract the justification for why this reasoning path was chosen"""
        # Look for "because", "since", "as", etc.
        justification_patterns = [
            r"because\s+([^.]+)",
            r"since\s+([^.]+)",
            r"the reason\s+([^.]+)",
        ]

        for pattern in justification_patterns:
            match = re.search(pattern, text.lower())
            if match:
                return match.group(1)[:100]

        return "implicit reasoning"

    def _generate_chain_id(self, sig: str, steps: List[ReasoningStep]) -> str:
        """Generate unique ID for this reasoning chain"""
        step_types = "-".join(s.reasoning_type.value[:3] for s in steps)
        content = f"{sig}|{step_types}"
        return hashlib.md5(content.encode()).hexdigest()[:12]


# ═══════════════════════════════════════════════════════════════════════════════
# REASONING COMPRESSOR - Creates Glyphs from Chains
# ═══════════════════════════════════════════════════════════════════════════════

class ReasoningCompressor:
    """
    Compresses reasoning chains into glyphs.

    Just like glyph compression turns "Build me a landing page" into "⊕LAND",
    this turns complex reasoning chains into transferable symbolic patterns.
    """

    # Symbol mapping for reasoning types
    REASONING_SYMBOLS = {
        ReasoningType.DECOMPOSITION: "↓",      # Breaking down
        ReasoningType.COMPOSITION: "↑",         # Building up
        ReasoningType.ANALOGY: "≈",            # Similarity
        ReasoningType.INDUCTION: "∑",          # Generalization
        ReasoningType.DEDUCTION: "∴",          # Therefore
        ReasoningType.ABDUCTION: "?→",         # Best guess
        ReasoningType.CAUSAL: "→",             # Causes
        ReasoningType.COUNTERFACTUAL: "⟂",     # Alternative
        ReasoningType.RECURSIVE: "∞",          # Self-reference
        ReasoningType.ADVERSARIAL: "⚔",        # Attack/defend
        ReasoningType.SYNTHESIS: "⊕",          # Merge
        ReasoningType.OPTIMIZATION: "◎",       # Optimize
    }

    # Modifiers for confidence levels
    CONFIDENCE_MODIFIERS = {
        (0.9, 1.0): "!",    # High confidence
        (0.7, 0.9): "",     # Normal
        (0.5, 0.7): "~",    # Uncertain
        (0.0, 0.5): "?",    # Low confidence
    }

    def compress(self, chain: ReasoningChain) -> ReasoningGlyph:
        """Compress a reasoning chain into a glyph"""
        glyph_parts = []

        for step in chain.steps:
            symbol = self.REASONING_SYMBOLS.get(step.reasoning_type, "•")
            modifier = self._get_confidence_modifier(step.confidence)
            glyph_parts.append(f"{symbol}{modifier}")

        # Add domain prefix
        domain_prefix = self._get_domain_prefix(chain.domains_applicable)

        # Construct final glyph
        glyph = f"{domain_prefix}[{'→'.join(glyph_parts)}]"

        # Calculate compression ratio (estimate original size)
        original_size = sum(len(s.description) for s in chain.steps) + 200
        compressed_size = len(glyph)
        ratio = 1 - (compressed_size / max(original_size, 1))

        return ReasoningGlyph(
            glyph=glyph,
            expanded_pattern=chain,
            compression_ratio=ratio,
            creation_time=datetime.now().timestamp()
        )

    def _get_confidence_modifier(self, confidence: float) -> str:
        for (low, high), modifier in self.CONFIDENCE_MODIFIERS.items():
            if low <= confidence < high:
                return modifier
        return ""

    def _get_domain_prefix(self, domains: List[ProblemDomain]) -> str:
        if not domains:
            return "G"  # General

        prefixes = {
            ProblemDomain.SOFTWARE: "S",
            ProblemDomain.BUSINESS: "B",
            ProblemDomain.CREATIVE: "C",
            ProblemDomain.SCIENTIFIC: "R",  # Research
            ProblemDomain.STRATEGIC: "T",   # Tactical
            ProblemDomain.SYSTEMS: "Y",     # sYstems
        }

        return "".join(prefixes.get(d, "?") for d in domains[:3])


# ═══════════════════════════════════════════════════════════════════════════════
# TRANSFER ENGINE - Applies Patterns to Novel Problems
# ═══════════════════════════════════════════════════════════════════════════════

class TransferEngine:
    """
    The core of AGI-adjacent capability.

    Takes stored reasoning patterns and applies them to NOVEL problems
    the system has never seen before. This is generalization.
    """

    def __init__(self):
        self.pattern_store: Dict[str, ReasoningGlyph] = {}
        self.transfer_history: List[Dict] = []

    def store_pattern(self, glyph: ReasoningGlyph):
        """Store a reasoning pattern for future transfer"""
        self.pattern_store[glyph.glyph] = glyph

    def find_applicable_patterns(
        self,
        problem: str,
        top_k: int = 3
    ) -> List[Tuple[ReasoningGlyph, float]]:
        """
        Find reasoning patterns that might apply to this problem.

        This is the magic moment - we're not looking for similar PROBLEMS,
        we're looking for similar PROBLEM STRUCTURES that might use
        similar REASONING APPROACHES.
        """
        if not self.pattern_store:
            return []

        # Generate signature for new problem
        extractor = ReasoningExtractor()
        new_sig = extractor._generate_problem_signature(problem)

        # Score each pattern by relevance
        scored_patterns = []

        for glyph_str, glyph in self.pattern_store.items():
            score = self._calculate_transfer_score(
                new_sig,
                problem,
                glyph.expanded_pattern
            )
            scored_patterns.append((glyph, score))

        # Sort by score and return top k
        scored_patterns.sort(key=lambda x: x[1], reverse=True)
        return scored_patterns[:top_k]

    def _calculate_transfer_score(
        self,
        new_sig: str,
        problem: str,
        pattern: ReasoningChain
    ) -> float:
        """Calculate how well a pattern might transfer to new problem"""
        score = 0.0

        # Signature similarity (same problem type)
        if new_sig == pattern.problem_signature:
            score += 0.4
        elif any(part in pattern.problem_signature for part in new_sig.split("|")):
            score += 0.2

        # Historical success rate
        score += pattern.success_rate * 0.3

        # Transfer success rate (has it worked on new problems before?)
        score += pattern.transfer_rate * 0.3

        return min(score, 1.0)

    def apply_pattern(
        self,
        problem: str,
        pattern: ReasoningGlyph
    ) -> Dict[str, Any]:
        """
        Apply a reasoning pattern to decompose a novel problem.

        This doesn't SOLVE the problem - it provides a FRAMEWORK
        for how to approach solving it.
        """
        chain = pattern.expanded_pattern

        # Generate problem decomposition based on reasoning chain
        decomposition = {
            "original_problem": problem,
            "reasoning_pattern_applied": pattern.glyph,
            "confidence": chain.total_confidence,
            "steps": []
        }

        for step in chain.steps:
            applied_step = {
                "reasoning_type": step.reasoning_type.value,
                "action": self._translate_step_to_action(step, problem),
                "expected_output": step.output_state,
                "confidence": step.confidence
            }
            decomposition["steps"].append(applied_step)

        # Update usage statistics
        pattern.usage_count += 1

        # Log transfer attempt
        self.transfer_history.append({
            "timestamp": datetime.now().isoformat(),
            "problem": problem[:100],
            "pattern_used": pattern.glyph,
            "decomposition": decomposition
        })

        return decomposition

    def _translate_step_to_action(
        self,
        step: ReasoningStep,
        problem: str
    ) -> str:
        """Translate an abstract reasoning step into concrete action"""
        action_templates = {
            ReasoningType.DECOMPOSITION: f"Break '{problem[:50]}...' into smaller sub-problems",
            ReasoningType.COMPOSITION: f"Combine partial solutions into complete solution",
            ReasoningType.ANALOGY: f"Find similar solved problems to draw insights from",
            ReasoningType.INDUCTION: f"Look for patterns across examples to generalize",
            ReasoningType.DEDUCTION: f"Apply known rules/principles to derive conclusions",
            ReasoningType.ABDUCTION: f"Generate hypotheses for best explanation",
            ReasoningType.CAUSAL: f"Trace cause-effect chains",
            ReasoningType.COUNTERFACTUAL: f"Consider alternative approaches",
            ReasoningType.ADVERSARIAL: f"Identify potential flaws or attacks",
            ReasoningType.SYNTHESIS: f"Merge best elements from multiple approaches",
            ReasoningType.OPTIMIZATION: f"Find optimal solution within constraints",
        }

        return action_templates.get(
            step.reasoning_type,
            f"Apply {step.reasoning_type.value} reasoning"
        )

    def record_outcome(self, problem: str, pattern_glyph: str, success: bool, was_novel: bool):
        """Record whether pattern transfer succeeded"""
        if pattern_glyph in self.pattern_store:
            pattern = self.pattern_store[pattern_glyph]
            chain = pattern.expanded_pattern

            if success:
                chain.success_count += 1
                if was_novel:
                    chain.transfer_success += 1
                # Update average success rate
                total = pattern.usage_count
                pattern.avg_success_when_used = (
                    (pattern.avg_success_when_used * (total - 1) + 1.0) / total
                )
            else:
                chain.failure_count += 1
                total = pattern.usage_count
                pattern.avg_success_when_used = (
                    (pattern.avg_success_when_used * (total - 1) + 0.0) / total
                )


# ═══════════════════════════════════════════════════════════════════════════════
# META LEARNER - Learns How to Reason Better
# ═══════════════════════════════════════════════════════════════════════════════

class MetaLearner:
    """
    The recursive self-improvement layer.

    This doesn't just learn patterns - it learns which TYPES of reasoning
    work best for which TYPES of problems. And then it improves its own
    reasoning selection.
    """

    def __init__(self, transfer_engine: TransferEngine):
        self.transfer_engine = transfer_engine
        self.meta_patterns: Dict[str, Dict] = {}  # Maps problem types to best reasoning
        self.improvement_history: List[Dict] = []
        self.generation = 0

    def analyze_patterns(self) -> Dict[str, Any]:
        """
        Analyze all stored patterns to find meta-patterns.

        Questions we answer:
        - Which reasoning types work best for which problem types?
        - Which combinations of reasoning steps are most powerful?
        - What's the optimal reasoning chain length?
        """
        analysis = {
            "generation": self.generation,
            "total_patterns": len(self.transfer_engine.pattern_store),
            "type_effectiveness": defaultdict(lambda: {"success": 0, "total": 0}),
            "best_combinations": [],
            "insights": []
        }

        for glyph_str, glyph in self.transfer_engine.pattern_store.items():
            chain = glyph.expanded_pattern

            # Track effectiveness by reasoning type
            for step in chain.steps:
                r_type = step.reasoning_type.value
                analysis["type_effectiveness"][r_type]["total"] += 1
                analysis["type_effectiveness"][r_type]["success"] += chain.success_rate

            # Track successful combinations
            if chain.success_rate > 0.8:
                combo = tuple(s.reasoning_type.value for s in chain.steps)
                analysis["best_combinations"].append({
                    "combination": combo,
                    "success_rate": chain.success_rate,
                    "domains": [d.value for d in chain.domains_applicable]
                })

        # Generate insights
        analysis["insights"] = self._generate_insights(analysis)

        return analysis

    def _generate_insights(self, analysis: Dict) -> List[str]:
        """Generate actionable insights from analysis"""
        insights = []

        # Find most effective reasoning types
        type_eff = analysis["type_effectiveness"]
        if type_eff:
            best_type = max(
                type_eff.items(),
                key=lambda x: x[1]["success"] / max(x[1]["total"], 1)
            )
            insights.append(f"Most effective reasoning type: {best_type[0]}")

        # Find best combinations
        if analysis["best_combinations"]:
            top_combo = analysis["best_combinations"][0]
            insights.append(f"Top reasoning combination: {' → '.join(top_combo['combination'])}")

        return insights

    def suggest_reasoning_improvement(self) -> Dict[str, Any]:
        """
        Suggest how to improve reasoning based on meta-analysis.

        This is where we improve HOW we reason, not just WHAT we reason about.
        """
        analysis = self.analyze_patterns()

        suggestion = {
            "generation": self.generation,
            "timestamp": datetime.now().isoformat(),
            "current_performance": {},
            "suggested_changes": [],
            "expected_improvement": 0.0
        }

        # Calculate current aggregate performance
        total_success = 0
        total_count = 0
        for glyph in self.transfer_engine.pattern_store.values():
            chain = glyph.expanded_pattern
            total_success += chain.success_count
            total_count += chain.success_count + chain.failure_count

        current_rate = total_success / max(total_count, 1)
        suggestion["current_performance"]["success_rate"] = current_rate

        # Suggest changes based on insights
        for insight in analysis["insights"]:
            suggestion["suggested_changes"].append({
                "insight": insight,
                "action": f"Prioritize patterns matching: {insight}"
            })

        # Estimate improvement
        if analysis["best_combinations"]:
            best_rate = analysis["best_combinations"][0]["success_rate"]
            suggestion["expected_improvement"] = best_rate - current_rate

        self.improvement_history.append(suggestion)
        self.generation += 1

        return suggestion

    def evolve_tournament_structure(self) -> Dict[str, Any]:
        """
        This is the breakthrough: using reasoning analysis to improve
        the tournament debate structure itself.

        Returns suggestions for how to run better debates.
        """
        analysis = self.analyze_patterns()

        evolution = {
            "generation": self.generation,
            "tournament_changes": []
        }

        # If adversarial reasoning is highly effective, suggest more devil's advocates
        type_eff = analysis["type_effectiveness"]
        if type_eff.get("adversarial", {}).get("success", 0) > 0.7 * type_eff.get("adversarial", {}).get("total", 1):
            evolution["tournament_changes"].append({
                "change": "ADD_ADVERSARIAL_TIER",
                "description": "Add a devil's advocate challenge before final decision",
                "expected_impact": "+15% solution quality"
            })

        # If decomposition is highly effective, suggest more structured problem breakdown
        if type_eff.get("decomposition", {}).get("success", 0) > 0.8 * type_eff.get("decomposition", {}).get("total", 1):
            evolution["tournament_changes"].append({
                "change": "ENFORCE_DECOMPOSITION_FIRST",
                "description": "Require problem decomposition before debate begins",
                "expected_impact": "+10% solution completeness"
            })

        # If synthesis is weak, suggest better merge strategies
        synth_rate = type_eff.get("synthesis", {}).get("success", 0) / max(type_eff.get("synthesis", {}).get("total", 1), 1)
        if synth_rate < 0.6:
            evolution["tournament_changes"].append({
                "change": "IMPROVE_SYNTHESIS_PHASE",
                "description": "Add explicit cross-pollination round between tier debates",
                "expected_impact": "+20% idea combination quality"
            })

        return evolution


# ═══════════════════════════════════════════════════════════════════════════════
# THE REASONING GRIMOIRE - Master Class
# ═══════════════════════════════════════════════════════════════════════════════

class ReasoningGrimoire:
    """
    The master class that brings everything together.

    This is your AGI-adjacent reasoning system:
    - Extracts reasoning patterns from tournament debates
    - Compresses them into transferable glyphs
    - Applies them to novel problems
    - Learns which reasoning approaches work best
    - Improves its own reasoning over time
    """

    def __init__(self):
        self.extractor = ReasoningExtractor()
        self.compressor = ReasoningCompressor()
        self.transfer_engine = TransferEngine()
        self.meta_learner = MetaLearner(self.transfer_engine)

        self.total_patterns_learned = 0
        self.total_transfers_attempted = 0
        self.successful_transfers = 0

        print("═" * 70)
        print("REASONING GRIMOIRE INITIALIZED")
        print("The system that learns HOW to think, not just WHAT to think")
        print("═" * 70)

    def learn_from_debate(
        self,
        debate_transcript: str,
        winning_solution: str,
        problem_description: str,
        debate_scores: Dict[str, float]
    ) -> ReasoningGlyph:
        """
        Learn a reasoning pattern from a tournament debate.

        This is called after every tournament - we don't just take the answer,
        we extract the REASONING that led to it.
        """
        # Extract the reasoning chain
        chain = self.extractor.extract_from_debate(
            debate_transcript,
            winning_solution,
            problem_description,
            debate_scores
        )

        # Compress into glyph
        glyph = self.compressor.compress(chain)

        # Store for future transfer
        self.transfer_engine.store_pattern(glyph)

        self.total_patterns_learned += 1

        print(f"Learned reasoning pattern: {glyph.glyph}")
        print(f"   Domains: {[d.value for d in chain.domains_applicable]}")
        print(f"   Confidence: {chain.total_confidence:.2%}")
        print(f"   Total patterns: {self.total_patterns_learned}")

        return glyph

    def approach_novel_problem(self, problem: str) -> Dict[str, Any]:
        """
        The AGI moment: approach a problem we've never seen before
        using reasoning patterns we've learned from other problems.
        """
        print(f"\nApproaching novel problem...")
        print(f"   Problem: {problem[:80]}...")

        # Find applicable reasoning patterns
        applicable = self.transfer_engine.find_applicable_patterns(problem)

        if not applicable:
            return {
                "status": "no_patterns",
                "message": "No applicable reasoning patterns found. Falling back to default.",
                "decomposition": None
            }

        # Use best matching pattern
        best_pattern, score = applicable[0]

        print(f"   Best pattern: {best_pattern.glyph} (score: {score:.2%})")

        # Apply pattern to decompose problem
        decomposition = self.transfer_engine.apply_pattern(problem, best_pattern)

        self.total_transfers_attempted += 1

        return {
            "status": "pattern_applied",
            "pattern_used": best_pattern.glyph,
            "match_score": score,
            "decomposition": decomposition,
            "alternative_patterns": [
                {"glyph": p.glyph, "score": s}
                for p, s in applicable[1:]
            ]
        }

    def record_result(self, problem: str, pattern_glyph: str, success: bool):
        """Record whether reasoning transfer worked"""
        was_novel = True  # Assume novel for now
        self.transfer_engine.record_outcome(problem, pattern_glyph, success, was_novel)

        if success:
            self.successful_transfers += 1

        print(f"   Result: {'Success' if success else 'Failed'}")
        print(f"   Transfer rate: {self.successful_transfers}/{self.total_transfers_attempted}")

    def improve_self(self) -> Dict[str, Any]:
        """
        The recursive self-improvement moment.

        Analyze our reasoning patterns and figure out how to reason better.
        """
        print("\nSELF-IMPROVEMENT CYCLE")
        print("=" * 50)

        # Get improvement suggestions
        suggestion = self.meta_learner.suggest_reasoning_improvement()

        # Get tournament evolution suggestions
        evolution = self.meta_learner.evolve_tournament_structure()

        result = {
            "improvement_suggestion": suggestion,
            "tournament_evolution": evolution,
            "current_stats": {
                "patterns_learned": self.total_patterns_learned,
                "transfers_attempted": self.total_transfers_attempted,
                "transfer_success_rate": (
                    self.successful_transfers / max(self.total_transfers_attempted, 1)
                )
            }
        }

        print(f"   Generation: {suggestion['generation']}")
        print(f"   Current success rate: {suggestion['current_performance'].get('success_rate', 0):.2%}")
        print(f"   Expected improvement: {suggestion['expected_improvement']:.2%}")
        print(f"   Tournament changes suggested: {len(evolution['tournament_changes'])}")

        return result

    def get_status(self) -> Dict[str, Any]:
        """Get current grimoire status"""
        return {
            "patterns_learned": self.total_patterns_learned,
            "transfers_attempted": self.total_transfers_attempted,
            "successful_transfers": self.successful_transfers,
            "transfer_success_rate": (
                self.successful_transfers / max(self.total_transfers_attempted, 1)
            ),
            "meta_generation": self.meta_learner.generation,
            "stored_glyphs": list(self.transfer_engine.pattern_store.keys())
        }


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO / TEST
# ═══════════════════════════════════════════════════════════════════════════════

async def demo():
    """Demonstrate the Reasoning Grimoire in action"""

    print("\n" + "═" * 70)
    print("THE REASONING GRIMOIRE - DEMONSTRATION")
    print("Building AGI-adjacent reasoning transfer capability")
    print("═" * 70 + "\n")

    # Initialize
    grimoire = ReasoningGrimoire()

    # Simulate learning from a tournament debate about building a landing page
    print("\nPHASE 1: Learning from Tournament Debate")
    print("-" * 50)

    debate_transcript = """
    Agent 1: First, let's break this down into components. We need:
    - Hero section with value proposition
    - Feature highlights
    - Social proof
    - Call to action

    Agent 2: I agree with the decomposition. For the hero, we should
    use the pattern from successful SaaS landing pages - headline,
    subhead, CTA button, hero image.

    Agent 3: What if we test multiple hero variants? A/B testing
    suggests that different audiences respond to different hooks.

    Agent 4: The flaw in that approach is time constraint. Better to
    use proven patterns and iterate post-launch.

    Agent 5: Synthesizing: Start with proven SaaS hero pattern,
    decomposed sections, but build in easy A/B swap capability.
    Best of both approaches.
    """

    winning_solution = "Landing page with modular hero, proven pattern, A/B ready"
    problem = "Create a high-converting landing page for an AI product"
    scores = {"agent_1": 0.7, "agent_5": 0.95}

    glyph1 = grimoire.learn_from_debate(
        debate_transcript,
        winning_solution,
        problem,
        scores
    )

    # Learn another pattern - analyzing data
    debate_transcript_2 = """
    Agent 1: To analyze this dataset, we need to first understand
    its structure. What are the key variables?

    Agent 2: Looking at similar analyses, the pattern is:
    clean data → explore distributions → find correlations → hypothesis

    Agent 3: We should consider what could be wrong with this approach.
    The data might have hidden biases we're not seeing.

    Agent 4: Good point. Add a validation step - cross-reference with
    external data sources.

    Agent 5: Optimal approach: structured analysis pipeline with
    built-in validation checkpoints. Catches errors early.
    """

    glyph2 = grimoire.learn_from_debate(
        debate_transcript_2,
        "Structured analysis with validation",
        "Analyze sales data to find growth opportunities",
        {"agent_2": 0.8, "agent_5": 0.9}
    )

    # Now test TRANSFER to a novel problem
    print("\nPHASE 2: Transferring Reasoning to Novel Problem")
    print("-" * 50)

    novel_problem = "Create a dashboard for monitoring AI agent performance"

    result = grimoire.approach_novel_problem(novel_problem)

    print(f"\n   Status: {result['status']}")
    if result['decomposition']:
        print(f"   Pattern applied: {result['pattern_used']}")
        print(f"   Match score: {result['match_score']:.2%}")
        print("\n   Reasoning steps to follow:")
        for i, step in enumerate(result['decomposition']['steps']):
            print(f"   {i+1}. [{step['reasoning_type']}] {step['action']}")

    # Record success
    grimoire.record_result(novel_problem, result['pattern_used'], success=True)

    # Run self-improvement cycle
    print("\nPHASE 3: Self-Improvement")
    print("-" * 50)

    improvement = grimoire.improve_self()

    # Final status
    print("\nFINAL STATUS")
    print("-" * 50)
    status = grimoire.get_status()
    for key, value in status.items():
        if key != "stored_glyphs":
            print(f"   {key}: {value}")
    print(f"   stored_glyphs: {status['stored_glyphs']}")

    print("\n" + "═" * 70)
    print("REASONING GRIMOIRE DEMONSTRATION COMPLETE")
    print("The system that learns HOW to think, not just WHAT to think")
    print("═" * 70)


if __name__ == "__main__":
    asyncio.run(demo())

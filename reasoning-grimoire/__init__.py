"""
Reasoning Grimoire - AGI Breakthrough Architecture
The system that learns HOW to think, not just WHAT to think.

Created: December 1, 2025
Architect: JB + Claude
"""

from .reasoning_grimoire import (
    ReasoningGrimoire,
    ReasoningExtractor,
    ReasoningCompressor,
    TransferEngine,
    MetaLearner,
    ReasoningType,
    ProblemDomain,
    ReasoningStep,
    ReasoningChain,
    ReasoningGlyph
)

from .emoji_grimoire import (
    EmojiGrimoire,
    HolographicAtom,
    ReasoningMolecule,
    ReasoningAtom,
    FlowOperator
)

from .flowsync_evolver import (
    FlowSync,
    Flow,
    Parameter,
    Metric,
    Evolver,
    FlowSyncEvolver,
    MetaEvolver,
    HyperEvolver,
    SelfEvolvingSystem
)

from .enhanced_tournament import (
    ReasoningEnhancedTournament,
    AGICompoundLoop,
    TournamentResult,
    generate_problem
)

__version__ = "1.0.0"
__author__ = "Michael Jeremy Bearden (JB)"
__all__ = [
    # Core Grimoire
    "ReasoningGrimoire",
    "ReasoningExtractor",
    "ReasoningCompressor",
    "TransferEngine",
    "MetaLearner",
    "ReasoningType",
    "ProblemDomain",
    "ReasoningStep",
    "ReasoningChain",
    "ReasoningGlyph",
    # Emoji Grimoire
    "EmojiGrimoire",
    "HolographicAtom",
    "ReasoningMolecule",
    "ReasoningAtom",
    "FlowOperator",
    # FlowSync
    "FlowSync",
    "Flow",
    "Parameter",
    "Metric",
    "Evolver",
    "FlowSyncEvolver",
    "MetaEvolver",
    "HyperEvolver",
    "SelfEvolvingSystem",
    # Tournament
    "ReasoningEnhancedTournament",
    "AGICompoundLoop",
    "TournamentResult",
    "generate_problem",
]

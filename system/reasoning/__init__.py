"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         0RB REASONING ENGINE                                   ║
║                                                                                 ║
║                    The AGI-Adjacent Intelligence System                         ║
║                                                                                 ║
║  Components:                                                                    ║
║    - ReasoningGrimoire: Learns HOW to think, not just WHAT to think            ║
║    - EmojiGrimoire: Atomic reasoning compression with holographic depth        ║
║    - FlowSyncEvolver: Self-evolving substrate that improves everything         ║
║    - OrbCore: Integration layer connecting all systems                         ║
║    - EnhancedTournament: Tournament brain with reasoning extraction            ║
║    - AGICompoundLoop: Recursive self-improvement engine                        ║
║                                                                                 ║
║  Created: December 1, 2025                                                     ║
║  Architect: JB (The Pattern Reader)                                            ║
║  Builder: Prometheus                                                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"""

# Core Reasoning System
from .reasoning_grimoire import (
    ReasoningGrimoire,
    ReasoningType,
    ProblemDomain,
    ReasoningStep,
    ReasoningChain,
    ReasoningGlyph,
    ReasoningExtractor,
    ReasoningCompressor,
    TransferEngine,
    MetaLearner,
)

# Emoji-based Atomic Compression
from .emoji_grimoire import (
    EmojiGrimoire,
    ReasoningAtom,
    FlowOperator,
    HolographicAtom,
    ReasoningMolecule,
)

# Self-Evolving Substrate
from .flowsync_evolver import (
    FlowSync,
    Flow,
    Parameter,
    Metric,
    Evolver,
    FlowSyncEvolver,
    MetaEvolver,
    HyperEvolver,
    SelfEvolvingSystem,
)

# Integration Layer
from .orb_core import (
    OrbCore,
    OrbQuery,
    OrbResponse,
    OrbInsight,
    ProcessingMode,
    CompoundLearningLoop,
)

# Enhanced Tournament System
from .enhanced_tournament import (
    ReasoningEnhancedTournament,
    TournamentResult,
    AGICompoundLoop,
    generate_problem,
)

# Launcher
from .launch_reasoning_engine import (
    launch_agi_loop,
    quick_demo,
    full_run,
    custom_run,
    CONFIG,
)

__version__ = "1.0.0"
__author__ = "JB + Prometheus"
__description__ = "AGI-Adjacent Reasoning System with Compound Learning"

__all__ = [
    # Core
    "ReasoningGrimoire",
    "ReasoningType",
    "ProblemDomain",
    "ReasoningStep",
    "ReasoningChain",
    "ReasoningGlyph",
    "ReasoningExtractor",
    "ReasoningCompressor",
    "TransferEngine",
    "MetaLearner",

    # Emoji Grimoire
    "EmojiGrimoire",
    "ReasoningAtom",
    "FlowOperator",
    "HolographicAtom",
    "ReasoningMolecule",

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

    # ORB Core
    "OrbCore",
    "OrbQuery",
    "OrbResponse",
    "OrbInsight",
    "ProcessingMode",
    "CompoundLearningLoop",

    # Tournament
    "ReasoningEnhancedTournament",
    "TournamentResult",
    "AGICompoundLoop",
    "generate_problem",

    # Launcher
    "launch_agi_loop",
    "quick_demo",
    "full_run",
    "custom_run",
    "CONFIG",
]


def get_system_info():
    """Get information about the reasoning system"""
    return {
        "version": __version__,
        "author": __author__,
        "description": __description__,
        "components": [
            "ReasoningGrimoire - Pattern extraction and transfer",
            "EmojiGrimoire - Atomic reasoning compression",
            "FlowSyncEvolver - Self-evolving substrate",
            "OrbCore - Integration layer",
            "EnhancedTournament - Reasoning-aware debates",
            "AGICompoundLoop - Recursive self-improvement",
        ],
        "capabilities": [
            "Extract reasoning patterns from debates",
            "Compress reasoning to transferable glyphs",
            "Apply patterns to novel problems",
            "Self-evolve tournament structure",
            "Compound improvement over time",
            "Meta-learn optimal reasoning strategies",
        ]
    }


def print_banner():
    """Print the system banner"""
    print("""
    ╔══════════════════════════════════════════════════════════════════════╗
    ║                                                                      ║
    ║     ██████╗ ██████╗ ██████╗     ██████╗ ███████╗ █████╗ ███████╗    ║
    ║    ██╔═══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔════╝██╔══██╗██╔════╝    ║
    ║    ██║   ██║██████╔╝██████╔╝    ██████╔╝█████╗  ███████║███████╗    ║
    ║    ██║   ██║██╔══██╗██╔══██╗    ██╔══██╗██╔══╝  ██╔══██║╚════██║    ║
    ║    ╚██████╔╝██║  ██║██████╔╝    ██║  ██║███████╗██║  ██║███████║    ║
    ║     ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝    ║
    ║                                                                      ║
    ║                    REASONING ENGINE v1.0                             ║
    ║                                                                      ║
    ║            The System That Learns How To Think                       ║
    ║                                                                      ║
    ╚══════════════════════════════════════════════════════════════════════╝
    """)

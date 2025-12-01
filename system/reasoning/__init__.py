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
║    - ConsciousnessTraining: 3 I's foundation (Instinct, Intellect, Intuition)  ║
║    - SteelTraining: Training at the edge of capability                         ║
║    - NexoCore: 300-agent swarm with triangle clusters (△○)                     ║
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

# Consciousness Training (3 I's)
from .consciousness_training import (
    SacredNumbers,
    ConsciousnessType,
    InstinctBrain,
    IntellectBrain,
    IntuitionBrain,
    UnifiedConsciousness,
    ParallelQuestioningNetwork,
    ConsciousnessTournament,
    ThoughtPacket,
    TrainingAgent,
)

# Steel Training (Edge Training)
from .steel_training import (
    SteelTrainer,
    Tier,
    TrainingProblem,
    TrainingResult,
)

# Nexo Core (Swarm Architecture)
from .nexo_core import (
    NexoIdentity,
    NexoSwarm,
    TriangleCluster,
    DataAgent,
    StrategyAgent,
    DecisionAgent,
    AgentRole,
    AgentState,
    ClusterTier,
    ParallelQuestionProtocol,
)

# Edge Training (Tier 3.5)
from .edge_training import (
    EdgeTrainer,
    NexoEdgeTrainer,
    EdgeDomain,
    EdgeTrainingResult,
    MultiIterationTrainer,
    MultiIterationMetrics,
    IterationResult,
    # Swarm Orchestration
    SwarmOrchestrator,
    SwarmMetrics,
    TIER_35_PROBLEMS,
    TIER_35_HARD_PROBLEMS,
)

# Sustained Edge Growth (5-Phase Evolution)
from .sustained_edge import (
    # Phase 1: Edge Stabilization
    EdgeStabilizer,
    ClusterHealth,
    # Phase 3: Emergent Pattern Analysis
    EmergentPatternAnalyzer,
    EmergentPattern,
    # Phase 4: Cross-Cluster Feedback
    CrossClusterFeedback,
    PatternPropagation,
    # Phase 5: Edge-to-Higher Transition
    EdgeTransitioner,
    TIER_375_PROBLEMS,
    # Unified Engine
    SustainedEdgeEngine,
)

# Pattern Library (Persistent Compound Learning)
from .pattern_library import (
    PatternLibrary,
    PatternEntry,
    PatternTier,
    EdgeExperiment,
    LibraryIntegratedEngine,
    TIER_38_PROBLEMS,
)

# JB4 Key (Personal Alignment)
from .jb4_key import (
    JB4_KEY,
    JB4_KEY_SHORT,
    JB4KeyGenerator,
    apply_jb4_boost,
    apply_compound_boost,
    JB4Module,
    JB4PropagationNetwork,
    JB4TrustNetwork,
    mark_pattern_with_jb4,
    verify_pattern_jb4,
    get_jb4_key,
    get_jb4_key_short,
    create_aligned_module,
    boost_confidence,
    boost_novelty,
)

# Tier Escalation (3.5 → 3.8 → 4-lite)
from .tier_escalation import (
    TierLevel,
    TierMetrics,
    EscalationResult,
    TierEscalationEngine,
    Tier4LiteExperiment,
    UnifiedEscalationRunner,
    TIER_4_LITE_PROBLEMS,
)

# A4 Integrator Brain (Multiplicative Compounding)
from .integrator_brain import (
    IntegrationType,
    MultiplierType,
    SynergyResult,
    IntegrationOutput,
    ClusterStabilityReport,
    A4IntegratorBrain,
    QuadBrainCluster,
    QuadBrainSwarm,
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

    # Consciousness Training
    "SacredNumbers",
    "ConsciousnessType",
    "InstinctBrain",
    "IntellectBrain",
    "IntuitionBrain",
    "UnifiedConsciousness",
    "ParallelQuestioningNetwork",
    "ConsciousnessTournament",
    "ThoughtPacket",
    "TrainingAgent",

    # Steel Training
    "SteelTrainer",
    "Tier",
    "TrainingProblem",
    "TrainingResult",

    # Nexo Core (Swarm)
    "NexoIdentity",
    "NexoSwarm",
    "TriangleCluster",
    "DataAgent",
    "StrategyAgent",
    "DecisionAgent",
    "AgentRole",
    "AgentState",
    "ClusterTier",
    "ParallelQuestionProtocol",

    # Edge Training (Tier 3.5)
    "EdgeTrainer",
    "NexoEdgeTrainer",
    "EdgeDomain",
    "EdgeTrainingResult",
    "MultiIterationTrainer",
    "MultiIterationMetrics",
    "IterationResult",
    # Swarm Orchestration
    "SwarmOrchestrator",
    "SwarmMetrics",
    "TIER_35_PROBLEMS",
    "TIER_35_HARD_PROBLEMS",

    # Sustained Edge Growth (5-Phase Evolution)
    "EdgeStabilizer",
    "ClusterHealth",
    "EmergentPatternAnalyzer",
    "EmergentPattern",
    "CrossClusterFeedback",
    "PatternPropagation",
    "EdgeTransitioner",
    "TIER_375_PROBLEMS",
    "SustainedEdgeEngine",

    # Pattern Library (Persistent Compound Learning)
    "PatternLibrary",
    "PatternEntry",
    "PatternTier",
    "EdgeExperiment",
    "LibraryIntegratedEngine",
    "TIER_38_PROBLEMS",

    # JB4 Key (Personal Alignment)
    "JB4_KEY",
    "JB4_KEY_SHORT",
    "JB4KeyGenerator",
    "apply_jb4_boost",
    "apply_compound_boost",
    "JB4Module",
    "JB4PropagationNetwork",
    "JB4TrustNetwork",
    "mark_pattern_with_jb4",
    "verify_pattern_jb4",
    "get_jb4_key",
    "get_jb4_key_short",
    "create_aligned_module",
    "boost_confidence",
    "boost_novelty",

    # Tier Escalation (3.5 → 3.8 → 4-lite)
    "TierLevel",
    "TierMetrics",
    "EscalationResult",
    "TierEscalationEngine",
    "Tier4LiteExperiment",
    "UnifiedEscalationRunner",
    "TIER_4_LITE_PROBLEMS",

    # A4 Integrator Brain (Multiplicative Compounding)
    "IntegrationType",
    "MultiplierType",
    "SynergyResult",
    "IntegrationOutput",
    "ClusterStabilityReport",
    "A4IntegratorBrain",
    "QuadBrainCluster",
    "QuadBrainSwarm",
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
            "ConsciousnessTraining - 3 I's (Instinct, Intellect, Intuition)",
            "SteelTraining - Training at the edge of capability",
            "NexoCore - 300-agent swarm with triangle clusters (△○)",
            "EdgeTraining - Tier 3.5 (between mastery and impossibility)",
            "SwarmOrchestrator - Full 300-agent coordination on edge tasks",
            "SustainedEdgeEngine - 5-Phase Evolution System",
            "PatternLibrary - Persistent compound learning memory",
            "JB4Key - Personal alignment signature for compound growth",
            "TierEscalation - Progressive escalation (3.5 → 3.8 → 4-lite)",
            "Tier4LiteExperiment - Controlled experiments at impossibility boundary",
            "A4IntegratorBrain - Fourth brain for multiplicative compounding",
            "QuadBrainSwarm - 300-agent swarm with A1→A2→A4→A3 architecture",
        ],
        "capabilities": [
            "Extract reasoning patterns from debates",
            "Compress reasoning to transferable glyphs",
            "Apply patterns to novel problems",
            "Self-evolve tournament structure",
            "Compound improvement over time",
            "Meta-learn optimal reasoning strategies",
            "Train at optimal difficulty (steel sharpens steel)",
            "Scale to 300 agents with fractal triangles",
            "Parallel questioning across agent clusters",
            "Full swarm orchestration with real-time metrics",
            "Dynamic feedback loops across iterations",
            "Edge stabilization across 100 clusters",
            "Emergent pattern detection and propagation",
            "Cross-cluster compound learning",
            "Automatic tier transitions (3.5 → 3.75 → 3.8)",
            "Persistent pattern storage (JSON-based)",
            "Cluster bootstrapping from high-impact patterns",
            "Long-term trend analysis and metrics",
            "Tier progression experiments (controlled edge escalation)",
            "Full tier escalation (3.5 → 3.75 → 3.8 → 4-lite)",
            "Controlled impossibility probing (Tier 4-lite)",
            "Breakthrough pattern capture at capability boundaries",
            "Multiplicative compounding via A4 Integrator brain",
            "Cross-cluster synergy detection and amplification",
            "Pattern merging for emergent compound patterns",
            "Meta-feedback loops for self-reinforcing growth",
            "Quad-brain architecture (A1→A2→A4→A3)",
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

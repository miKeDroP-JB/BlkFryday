"""
═══════════════════════════════════════════════════════════════════════════════
FRACTAL MEMORY ENGINE - NEXO SPINE
═══════════════════════════════════════════════════════════════════════════════

A self-sustaining, multi-avatar memory engine that captures, processes, evolves,
and surfaces human-AI interactions without losing fidelity or context.

Architecture:
    MEMORY ENGINE (SPINE)
    │
    ├─ SCHEMA LAYER (Static)      → Data models and structure
    ├─ CAPTURE ENGINE (EARS)      → Signal extraction from interactions
    ├─ PROCESS ENGINE (BRAIN)     → Inference, conflict resolution, weighting
    ├─ SURFACE ENGINE (VOICE)     → Context retrieval and prompt injection
    ├─ EVOLVE ENGINE (GROWTH)     → Pattern promotion, pruning, confidence decay
    ├─ CALIBRATE ENGINE (MIRROR)  → Auto-confirmation loop
    ├─ PERSIST ENGINE (STORE)     → Firestore + Edge KV
    └─ TRANSFER ENGINE (BRIDGE)   → Cross-avatar memory routing

Created: December 2, 2025
"""

from .schema import *
from .capture import CaptureEngine
from .process import ProcessEngine
from .surface import SurfaceEngine
from .evolve import EvolveEngine
from .calibrate import CalibrateEngine
from .persist import PersistEngine
from .transfer import TransferEngine
from .spine import MemorySpine

__version__ = "1.0.0"
__all__ = [
    "MemorySpine",
    "CaptureEngine",
    "ProcessEngine",
    "SurfaceEngine",
    "EvolveEngine",
    "CalibrateEngine",
    "PersistEngine",
    "TransferEngine",
]

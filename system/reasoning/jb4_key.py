#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
    JB4 KEY

    Personal Alignment Signature for NEXO Swarm
═══════════════════════════════════════════════════════════════════════════════

The JB4 Key is an alignment marker embedded into every module, cluster, and
pattern in the NEXO swarm. It serves as:

1. Identity marker - proves origin and alignment
2. Compound boost - patterns carrying the key get 5-10% boost
3. Propagation verification - only key-aligned patterns propagate
4. Trust network - clusters with matching keys form stronger connections

"The key unlocks compound growth. Embed it everywhere."

Created: December 1, 2025
Architect: JB (The Pattern Reader)
"""

import hashlib
import random
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════════
# JB4 KEY GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

class JB4KeyGenerator:
    """
    Generates unique JB4 keys for swarm instances.

    Key format: JB4::<swarm_id> → SHA256 hash
    """

    PREFIX = "JB4"
    VERSION = "4.0"

    @classmethod
    def generate(cls, swarm_id: str) -> str:
        """Generate a JB4-aligned key for a swarm instance"""
        base = f"{cls.PREFIX}::{swarm_id}::v{cls.VERSION}"
        return hashlib.sha256(base.encode()).hexdigest()

    @classmethod
    def generate_short(cls, swarm_id: str) -> str:
        """Generate shortened key (first 16 chars)"""
        full_key = cls.generate(swarm_id)
        return full_key[:16]

    @classmethod
    def verify(cls, key: str, swarm_id: str) -> bool:
        """Verify a key matches a swarm ID"""
        expected = cls.generate(swarm_id)
        return key == expected or key == expected[:16]


# ═══════════════════════════════════════════════════════════════════════════════
# NEXO SWARM IDENTITY
# ═══════════════════════════════════════════════════════════════════════════════

# Primary NEXO swarm identifier
NEXO_SWARM_ID = "NEXO_SWARM_001"

# Generate the master JB4 key for NEXO
JB4_KEY = JB4KeyGenerator.generate(NEXO_SWARM_ID)
JB4_KEY_SHORT = JB4KeyGenerator.generate_short(NEXO_SWARM_ID)


# ═══════════════════════════════════════════════════════════════════════════════
# JB4 BOOST SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

class BoostType(Enum):
    """Types of JB4 boosts available"""
    CONFIDENCE = "confidence"
    NOVELTY = "novelty"
    AWARENESS = "awareness"
    COMPOUND = "compound"


@dataclass
class JB4BoostResult:
    """Result of applying JB4 boost"""
    original_confidence: float
    original_novelty: float
    boosted_confidence: float
    boosted_novelty: float
    boost_applied: float
    key_verified: bool


def apply_jb4_boost(base_confidence: float,
                    base_novelty: float,
                    key: str = None,
                    boost_range: Tuple[float, float] = (0.05, 0.10)) -> JB4BoostResult:
    """
    Apply JB4 alignment boost to confidence and novelty scores.

    Modules/patterns carrying the JB4 key receive a 5-10% compound learning boost.

    Args:
        base_confidence: Original confidence score
        base_novelty: Original novelty score
        key: JB4 key to verify (uses master key if None)
        boost_range: Min/max boost range (default 5-10%)

    Returns:
        JB4BoostResult with boosted values
    """
    # Verify key alignment
    key_verified = False
    if key is None:
        key_verified = True  # Internal call, trusted
    elif key == JB4_KEY or key == JB4_KEY_SHORT:
        key_verified = True
    elif JB4KeyGenerator.verify(key, NEXO_SWARM_ID):
        key_verified = True

    # Calculate boost
    if key_verified:
        confidence_boost = random.uniform(*boost_range)
        novelty_boost = random.uniform(*boost_range)
    else:
        # No boost for unverified keys
        confidence_boost = 0.0
        novelty_boost = 0.0

    boosted_confidence = min(1.0, base_confidence + confidence_boost)
    boosted_novelty = min(1.0, base_novelty + novelty_boost)

    return JB4BoostResult(
        original_confidence=base_confidence,
        original_novelty=base_novelty,
        boosted_confidence=boosted_confidence,
        boosted_novelty=boosted_novelty,
        boost_applied=(confidence_boost + novelty_boost) / 2,
        key_verified=key_verified,
    )


def apply_compound_boost(metrics: Dict[str, float],
                         key: str = None) -> Dict[str, float]:
    """
    Apply JB4 boost to a dictionary of metrics.

    Args:
        metrics: Dictionary of metric_name -> score
        key: JB4 key to verify

    Returns:
        Dictionary with boosted metrics
    """
    # Verify key
    key_verified = (key is None or
                    key == JB4_KEY or
                    key == JB4_KEY_SHORT or
                    JB4KeyGenerator.verify(key, NEXO_SWARM_ID))

    if not key_verified:
        return metrics.copy()

    boosted = {}
    for metric_name, value in metrics.items():
        boost = random.uniform(0.05, 0.10)
        boosted[metric_name] = min(1.0, value + boost)

    return boosted


# ═══════════════════════════════════════════════════════════════════════════════
# JB4 MODULE WRAPPER
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class JB4Module:
    """
    A JB4-aligned module wrapper.

    Any swarm component wrapped in JB4Module receives:
    - Automatic key embedding
    - Compound boost on processing
    - Propagation verification
    """
    module_id: str
    domain: str
    key: str = field(default_factory=lambda: JB4_KEY_SHORT)
    base_confidence: float = 0.5
    base_novelty: float = 0.5
    base_awareness: float = 0.5

    # Tracking
    tasks_processed: int = 0
    total_boost_applied: float = 0.0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def process_task(self, task: Any) -> Dict[str, Any]:
        """Process a task with JB4 boost applied"""
        self.tasks_processed += 1

        # Apply JB4 boost
        boost_result = apply_jb4_boost(
            self.base_confidence,
            self.base_novelty,
            key=self.key
        )

        # Update base metrics with boosted values
        self.base_confidence = boost_result.boosted_confidence
        self.base_novelty = boost_result.boosted_novelty
        self.total_boost_applied += boost_result.boost_applied

        return {
            "module_id": self.module_id,
            "domain": self.domain,
            "confidence": self.base_confidence,
            "novelty": self.base_novelty,
            "awareness": self.base_awareness,
            "JB4_KEY": self.key,
            "boost_applied": boost_result.boost_applied,
            "key_verified": boost_result.key_verified,
        }

    def receive_pattern(self, pattern: Dict) -> bool:
        """Receive a pattern from another module"""
        # Verify pattern has valid JB4 key
        pattern_key = pattern.get("JB4_KEY")
        if pattern_key != self.key and pattern_key != JB4_KEY_SHORT:
            return False  # Reject unaligned patterns

        # Apply pattern boost
        if "confidence" in pattern:
            self.base_confidence = min(1.0, self.base_confidence + 0.02)
        if "novelty" in pattern:
            self.base_novelty = min(1.0, self.base_novelty + 0.02)

        return True


# ═══════════════════════════════════════════════════════════════════════════════
# JB4 PATTERN MARKER
# ═══════════════════════════════════════════════════════════════════════════════

def mark_pattern_with_jb4(pattern: Dict) -> Dict:
    """
    Mark a pattern with JB4 key for propagation.

    Patterns marked with JB4:
    - Get priority in propagation
    - Receive compound boost on adoption
    - Form trust connections between clusters
    """
    pattern["JB4_KEY"] = JB4_KEY_SHORT
    pattern["JB4_MARKED_AT"] = datetime.now().isoformat()
    pattern["JB4_VERSION"] = JB4KeyGenerator.VERSION
    return pattern


def verify_pattern_jb4(pattern: Dict) -> bool:
    """Verify a pattern has valid JB4 marking"""
    pattern_key = pattern.get("JB4_KEY")
    if not pattern_key:
        return False
    return pattern_key == JB4_KEY or pattern_key == JB4_KEY_SHORT


# ═══════════════════════════════════════════════════════════════════════════════
# JB4 PROPAGATION SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

class JB4PropagationNetwork:
    """
    Network for propagating JB4-aligned patterns between modules.

    Only patterns with verified JB4 keys propagate successfully.
    """

    def __init__(self):
        self.propagation_log: List[Dict] = []
        self.successful_propagations = 0
        self.rejected_propagations = 0

    def propagate_pattern(self, pattern: Dict, source_module: JB4Module,
                          target_module: JB4Module) -> bool:
        """
        Propagate a pattern from source to target module.

        Returns True if propagation succeeded.
        """
        # Verify pattern has JB4 key
        if not verify_pattern_jb4(pattern):
            self.rejected_propagations += 1
            self._log_propagation(pattern, source_module, target_module, success=False,
                                 reason="missing_jb4_key")
            return False

        # Verify source module alignment
        if source_module.key != JB4_KEY_SHORT:
            self.rejected_propagations += 1
            self._log_propagation(pattern, source_module, target_module, success=False,
                                 reason="source_not_aligned")
            return False

        # Apply JB4 boost to pattern before propagation
        boost_result = apply_jb4_boost(
            pattern.get("confidence", 0.5),
            pattern.get("novelty", 0.5),
            key=pattern.get("JB4_KEY")
        )

        # Update pattern with boosted values
        pattern["confidence"] = boost_result.boosted_confidence
        pattern["novelty"] = boost_result.boosted_novelty
        pattern["propagation_boost"] = boost_result.boost_applied

        # Target module receives pattern
        success = target_module.receive_pattern(pattern)

        if success:
            self.successful_propagations += 1
        else:
            self.rejected_propagations += 1

        self._log_propagation(pattern, source_module, target_module, success=success)
        return success

    def _log_propagation(self, pattern: Dict, source: JB4Module,
                         target: JB4Module, success: bool, reason: str = None):
        """Log a propagation attempt"""
        self.propagation_log.append({
            "pattern_id": pattern.get("pattern_id", "unknown"),
            "source_module": source.module_id,
            "target_module": target.module_id,
            "success": success,
            "reason": reason,
            "timestamp": datetime.now().isoformat(),
        })

    def get_stats(self) -> Dict[str, Any]:
        """Get propagation statistics"""
        total = self.successful_propagations + self.rejected_propagations
        return {
            "total_attempts": total,
            "successful": self.successful_propagations,
            "rejected": self.rejected_propagations,
            "success_rate": self.successful_propagations / max(total, 1),
        }


# ═══════════════════════════════════════════════════════════════════════════════
# JB4 TRUST NETWORK
# ═══════════════════════════════════════════════════════════════════════════════

class JB4TrustNetwork:
    """
    Trust network between JB4-aligned modules.

    Modules with matching JB4 keys form stronger trust connections,
    leading to:
    - Faster pattern propagation
    - Higher confidence in shared patterns
    - Compound learning acceleration
    """

    def __init__(self):
        self.trust_scores: Dict[Tuple[str, str], float] = {}
        self.connection_count = 0

    def establish_trust(self, module_a: JB4Module, module_b: JB4Module) -> float:
        """Establish trust connection between two modules"""
        # Base trust from key alignment
        if module_a.key == module_b.key:
            base_trust = 0.8
        elif verify_pattern_jb4({"JB4_KEY": module_a.key}) and verify_pattern_jb4({"JB4_KEY": module_b.key}):
            base_trust = 0.6
        else:
            base_trust = 0.2

        # Store bidirectional trust
        key_pair = (module_a.module_id, module_b.module_id)
        self.trust_scores[key_pair] = base_trust
        self.trust_scores[(module_b.module_id, module_a.module_id)] = base_trust
        self.connection_count += 1

        return base_trust

    def get_trust(self, module_a_id: str, module_b_id: str) -> float:
        """Get trust score between two modules"""
        return self.trust_scores.get((module_a_id, module_b_id), 0.0)

    def boost_by_trust(self, value: float, module_a_id: str, module_b_id: str) -> float:
        """Boost a value based on trust between modules"""
        trust = self.get_trust(module_a_id, module_b_id)
        return min(1.0, value * (1 + trust * 0.1))


# ═══════════════════════════════════════════════════════════════════════════════
# CONVENIENCE FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_jb4_key() -> str:
    """Get the master JB4 key"""
    return JB4_KEY


def get_jb4_key_short() -> str:
    """Get the shortened JB4 key"""
    return JB4_KEY_SHORT


def create_aligned_module(module_id: str, domain: str) -> JB4Module:
    """Create a new JB4-aligned module"""
    return JB4Module(module_id=module_id, domain=domain)


def boost_confidence(confidence: float, key: str = None) -> float:
    """Quick confidence boost with JB4"""
    result = apply_jb4_boost(confidence, 0.5, key)
    return result.boosted_confidence


def boost_novelty(novelty: float, key: str = None) -> float:
    """Quick novelty boost with JB4"""
    result = apply_jb4_boost(0.5, novelty, key)
    return result.boosted_novelty


# ═══════════════════════════════════════════════════════════════════════════════
# DEMO
# ═══════════════════════════════════════════════════════════════════════════════

def demo():
    """Demonstrate JB4 Key functionality"""
    print("\n" + "=" * 70)
    print("         JB4 KEY SYSTEM DEMO")
    print("=" * 70)

    print(f"\n  NEXO Swarm ID: {NEXO_SWARM_ID}")
    print(f"  JB4 Key (full): {JB4_KEY[:32]}...")
    print(f"  JB4 Key (short): {JB4_KEY_SHORT}")

    # Create modules
    print("\n--- Creating JB4-Aligned Modules ---")
    module_a = create_aligned_module("MOD-001", "meta_reasoning")
    module_b = create_aligned_module("MOD-002", "novel_pattern")

    print(f"  Module A: {module_a.module_id} (key: {module_a.key})")
    print(f"  Module B: {module_b.module_id} (key: {module_b.key})")

    # Process tasks with boost
    print("\n--- Processing Tasks with JB4 Boost ---")
    for i in range(3):
        result = module_a.process_task(f"task_{i}")
        print(f"  Task {i}: conf={result['confidence']:.2f} novel={result['novelty']:.2f} boost={result['boost_applied']:.2f}")

    # Create and propagate pattern
    print("\n--- Pattern Propagation ---")
    pattern = {
        "pattern_id": "PAT-001",
        "description": "Meta-reasoning shortcut",
        "confidence": 0.6,
        "novelty": 0.5,
    }
    pattern = mark_pattern_with_jb4(pattern)
    print(f"  Pattern marked with JB4: {pattern['JB4_KEY']}")

    network = JB4PropagationNetwork()
    success = network.propagate_pattern(pattern, module_a, module_b)
    print(f"  Propagation success: {success}")
    print(f"  Boosted confidence: {pattern['confidence']:.2f}")
    print(f"  Boosted novelty: {pattern['novelty']:.2f}")

    # Trust network
    print("\n--- Trust Network ---")
    trust_net = JB4TrustNetwork()
    trust = trust_net.establish_trust(module_a, module_b)
    print(f"  Trust between A↔B: {trust:.2f}")

    boosted_value = trust_net.boost_by_trust(0.7, module_a.module_id, module_b.module_id)
    print(f"  Value 0.7 boosted by trust: {boosted_value:.2f}")

    # Stats
    print("\n--- Propagation Stats ---")
    stats = network.get_stats()
    print(f"  Total attempts: {stats['total_attempts']}")
    print(f"  Success rate: {stats['success_rate']:.0%}")

    print(f"\n{'═' * 70}")
    print("  JB4 Key: Alignment marker for compound growth")
    print(f"{'═' * 70}")


if __name__ == "__main__":
    demo()

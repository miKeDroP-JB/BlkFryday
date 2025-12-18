#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
PATTERN LEARNER - Learn from successful solves
═══════════════════════════════════════════════════════════════════════════════

Records successful patterns and uses them to improve future solving:
- Tracks which transforms work for which feature signatures
- Prioritizes hypotheses based on past success
- Evolves pattern confidence over time
"""

import json
import hashlib
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from pathlib import Path


@dataclass
class LearnedPattern:
    """A pattern learned from successful solving"""
    pattern_id: str
    transforms: List[Tuple[str, Dict]]  # List of (transform_name, params)
    feature_signature: str  # Hash of relevant features
    success_count: int = 1
    fail_count: int = 0
    avg_confidence: float = 0.5
    first_seen: str = field(default_factory=lambda: datetime.now().isoformat())
    last_used: str = field(default_factory=lambda: datetime.now().isoformat())

    @property
    def success_rate(self) -> float:
        total = self.success_count + self.fail_count
        return self.success_count / total if total > 0 else 0.5

    @property
    def priority_score(self) -> float:
        """Score for prioritizing this pattern"""
        # Higher score = try this pattern earlier
        recency_bonus = 0.1 if self._is_recent() else 0
        return self.success_rate * self.avg_confidence + recency_bonus

    def _is_recent(self) -> bool:
        """Check if pattern was used recently"""
        try:
            last = datetime.fromisoformat(self.last_used)
            delta = datetime.now() - last
            return delta.days < 7
        except:
            return False


class PatternLearner:
    """
    Learns patterns from successful ARC puzzle solutions.

    Workflow:
    1. Extract feature signature from puzzle
    2. Look up patterns that worked for similar signatures
    3. Prioritize those hypotheses
    4. Record success/failure after solving
    """

    def __init__(self, storage_path: str = "data/learned_patterns.json"):
        self.storage_path = Path(storage_path)
        self.patterns: Dict[str, LearnedPattern] = {}
        self.feature_index: Dict[str, List[str]] = {}  # signature -> pattern_ids
        self._load()

    def _load(self):
        """Load patterns from storage"""
        if self.storage_path.exists():
            try:
                with open(self.storage_path) as f:
                    data = json.load(f)
                    for p in data.get('patterns', []):
                        pattern = LearnedPattern(
                            pattern_id=p['pattern_id'],
                            transforms=[(t[0], t[1]) for t in p['transforms']],
                            feature_signature=p['feature_signature'],
                            success_count=p.get('success_count', 1),
                            fail_count=p.get('fail_count', 0),
                            avg_confidence=p.get('avg_confidence', 0.5),
                            first_seen=p.get('first_seen', datetime.now().isoformat()),
                            last_used=p.get('last_used', datetime.now().isoformat())
                        )
                        self.patterns[pattern.pattern_id] = pattern

                        # Index by signature
                        sig = pattern.feature_signature
                        if sig not in self.feature_index:
                            self.feature_index[sig] = []
                        self.feature_index[sig].append(pattern.pattern_id)

                print(f"Loaded {len(self.patterns)} learned patterns")
            except Exception as e:
                print(f"Could not load patterns: {e}")

    def _save(self):
        """Save patterns to storage"""
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            'patterns': [
                {
                    'pattern_id': p.pattern_id,
                    'transforms': p.transforms,
                    'feature_signature': p.feature_signature,
                    'success_count': p.success_count,
                    'fail_count': p.fail_count,
                    'avg_confidence': p.avg_confidence,
                    'first_seen': p.first_seen,
                    'last_used': p.last_used
                }
                for p in self.patterns.values()
            ],
            'updated': datetime.now().isoformat()
        }
        with open(self.storage_path, 'w') as f:
            json.dump(data, f, indent=2)

    def compute_signature(self, features: Dict) -> str:
        """Compute a signature from features for pattern matching"""
        # Extract key features that indicate what transform might work
        key_features = {
            'shape_change': features.get('shape_change', 'same'),
            'color_change': len(features.get('colors_added', [])) > 0 or len(features.get('colors_removed', [])) > 0,
            'scale_factor': features.get('scale_factor', 1),
            'is_tiled': features.get('is_tiled') is not None,
            'object_count_change': features.get('output_object_count', 0) - features.get('input_object_count', 0),
        }

        # Create hash
        sig_str = json.dumps(key_features, sort_keys=True)
        return hashlib.md5(sig_str.encode()).hexdigest()[:12]

    def get_prioritized_transforms(self, features: Dict) -> List[Tuple[List[Tuple], float]]:
        """Get transforms prioritized by past success for given features"""
        signature = self.compute_signature(features)

        prioritized = []

        # Look up patterns with matching signature
        pattern_ids = self.feature_index.get(signature, [])

        for pid in pattern_ids:
            pattern = self.patterns.get(pid)
            if pattern:
                prioritized.append((pattern.transforms, pattern.priority_score))

        # Also include similar signatures (fuzzy match)
        for sig, pids in self.feature_index.items():
            if sig != signature and self._signatures_similar(signature, sig):
                for pid in pids:
                    pattern = self.patterns.get(pid)
                    if pattern:
                        # Lower priority for fuzzy matches
                        prioritized.append((pattern.transforms, pattern.priority_score * 0.7))

        # Sort by priority
        prioritized.sort(key=lambda x: -x[1])

        return prioritized

    def _signatures_similar(self, sig1: str, sig2: str) -> bool:
        """Check if two signatures are similar enough"""
        # Simple: share at least half the characters
        common = sum(1 for a, b in zip(sig1, sig2) if a == b)
        return common >= len(sig1) // 2

    def record_success(self, transforms: List[Tuple], features: Dict, confidence: float):
        """Record a successful pattern"""
        signature = self.compute_signature(features)
        pattern_id = self._make_pattern_id(transforms, signature)

        if pattern_id in self.patterns:
            # Update existing
            pattern = self.patterns[pattern_id]
            pattern.success_count += 1
            pattern.avg_confidence = (pattern.avg_confidence * (pattern.success_count - 1) + confidence) / pattern.success_count
            pattern.last_used = datetime.now().isoformat()
        else:
            # Create new
            pattern = LearnedPattern(
                pattern_id=pattern_id,
                transforms=transforms,
                feature_signature=signature,
                success_count=1,
                avg_confidence=confidence
            )
            self.patterns[pattern_id] = pattern

            if signature not in self.feature_index:
                self.feature_index[signature] = []
            self.feature_index[signature].append(pattern_id)

        self._save()

    def record_failure(self, transforms: List[Tuple], features: Dict):
        """Record a failed pattern attempt"""
        signature = self.compute_signature(features)
        pattern_id = self._make_pattern_id(transforms, signature)

        if pattern_id in self.patterns:
            self.patterns[pattern_id].fail_count += 1
            self._save()

    def _make_pattern_id(self, transforms: List[Tuple], signature: str) -> str:
        """Create unique ID for a pattern"""
        transform_str = str(transforms)
        return hashlib.md5(f"{signature}_{transform_str}".encode()).hexdigest()[:16]

    def get_stats(self) -> Dict:
        """Get learning statistics"""
        if not self.patterns:
            return {'total_patterns': 0}

        success_rates = [p.success_rate for p in self.patterns.values()]
        avg_success = sum(success_rates) / len(success_rates)

        return {
            'total_patterns': len(self.patterns),
            'total_signatures': len(self.feature_index),
            'avg_success_rate': avg_success,
            'top_patterns': sorted(
                [(p.pattern_id, p.success_rate, p.transforms[0][0] if p.transforms else 'none')
                 for p in self.patterns.values()],
                key=lambda x: -x[1]
            )[:5]
        }


def test_pattern_learner():
    """Test the pattern learner"""
    print("Testing Pattern Learner...")

    learner = PatternLearner(storage_path="/tmp/test_patterns.json")

    # Simulate some learning
    features1 = {
        'shape_change': 'same',
        'colors_added': [],
        'colors_removed': [],
        'scale_factor': 1,
        'is_tiled': None,
        'input_object_count': 1,
        'output_object_count': 1
    }

    transforms1 = [('rotate_90', {})]

    # Record success
    learner.record_success(transforms1, features1, 0.9)
    learner.record_success(transforms1, features1, 0.85)

    # Check prioritization
    prioritized = learner.get_prioritized_transforms(features1)
    print(f"Prioritized transforms: {len(prioritized)}")

    # Check stats
    stats = learner.get_stats()
    print(f"Stats: {stats}")

    print("✓ Pattern Learner test complete")

    return learner


if __name__ == "__main__":
    test_pattern_learner()

"""
═══════════════════════════════════════════════════════════════════════════════
EVOLVE ENGINE (GROWTH) - Pattern Evolution & Maintenance
═══════════════════════════════════════════════════════════════════════════════

Responsible for:
- recalc_confidences() - Recalculate all confidence scores
- prune_ghost_entries() - Remove stale/irrelevant entries
- promote_repeated_patterns() - Strengthen frequently observed patterns
"""

import math
from typing import Dict, List, Tuple, Optional, Set
from datetime import datetime, timedelta
from dataclasses import dataclass

from .schema import (
    UserMemoryState, KnowledgeEntry, Pattern, Goal, GoalStatus,
    NarrativeEvent, LexiconEntry, Metadata, ConfidenceLevel
)


# ═══════════════════════════════════════════════════════════════════════════════
# EVOLUTION STATS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class EvolutionStats:
    """Statistics from an evolution cycle"""
    entries_decayed: int = 0
    entries_pruned: int = 0
    patterns_promoted: int = 0
    patterns_demoted: int = 0
    goals_completed: int = 0
    goals_stale: int = 0
    conflicts_detected: int = 0
    total_entries: int = 0
    average_confidence: float = 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# EVOLVE ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class EvolveEngine:
    """
    Handles memory evolution over time.
    Runs periodically to maintain memory health.
    """

    def __init__(self,
                 decay_lambda: float = 0.05,
                 prune_threshold: float = 0.1,
                 pattern_promote_threshold: float = 0.7,
                 pattern_demote_threshold: float = 0.2):
        """
        Args:
            decay_lambda: Daily decay rate
            prune_threshold: Weight below which entries are pruned
            pattern_promote_threshold: Strength above which patterns are promoted
            pattern_demote_threshold: Strength below which patterns are demoted
        """
        self.decay_lambda = decay_lambda
        self.prune_threshold = prune_threshold
        self.pattern_promote_threshold = pattern_promote_threshold
        self.pattern_demote_threshold = pattern_demote_threshold

    def evolve(self, memory: UserMemoryState,
              days_elapsed: float = 1.0) -> Tuple[UserMemoryState, EvolutionStats]:
        """
        Run full evolution cycle on memory state.

        Args:
            memory: Current memory state
            days_elapsed: Time since last evolution

        Returns:
            Tuple of (updated_memory, stats)
        """
        stats = EvolutionStats()

        # 1. Recalculate confidences with decay
        memory, decay_count = self._recalc_confidences(memory, days_elapsed)
        stats.entries_decayed = decay_count

        # 2. Prune ghost entries
        memory, prune_count = self._prune_ghost_entries(memory)
        stats.entries_pruned = prune_count

        # 3. Promote/demote patterns
        memory, promoted, demoted = self._evolve_patterns(memory)
        stats.patterns_promoted = promoted
        stats.patterns_demoted = demoted

        # 4. Update goal statuses
        memory, completed, stale = self._evolve_goals(memory)
        stats.goals_completed = completed
        stats.goals_stale = stale

        # 5. Detect conflicts
        conflicts = self._detect_conflicts(memory)
        stats.conflicts_detected = len(conflicts)

        # 6. Compute final stats
        stats.total_entries = (
            len(memory.knowledge) +
            len(memory.patterns) +
            len(memory.goals) +
            len(memory.lexicon)
        )
        stats.average_confidence = self._compute_average_confidence(memory)

        return memory, stats

    def _recalc_confidences(self, memory: UserMemoryState,
                           days_elapsed: float) -> Tuple[UserMemoryState, int]:
        """Apply time decay to all entries"""
        decay_factor = math.exp(-self.decay_lambda * days_elapsed)
        count = 0

        # Decay knowledge
        for entry in memory.knowledge.values():
            old_decay = entry.metadata.decay_index
            entry.metadata.decay_index *= decay_factor
            if entry.metadata.decay_index < old_decay:
                count += 1

        # Decay patterns
        for pattern in memory.patterns.values():
            pattern.decay(factor=decay_factor)
            count += 1

        # Decay lexicon
        for entry in memory.lexicon.values():
            entry.metadata.decay_index *= decay_factor

        return memory, count

    def _prune_ghost_entries(self, memory: UserMemoryState) -> Tuple[UserMemoryState, int]:
        """Remove entries below threshold"""
        count = 0

        # Prune knowledge
        to_remove = []
        for entry_id, entry in memory.knowledge.items():
            weight = entry.metadata.compute_weight(self.decay_lambda)
            if weight < self.prune_threshold:
                to_remove.append(entry_id)

        for entry_id in to_remove:
            del memory.knowledge[entry_id]
            count += 1

        # Prune patterns (but keep if frequently observed)
        to_remove = []
        for pattern_id, pattern in memory.patterns.items():
            if pattern.strength < self.prune_threshold and pattern.frequency < 3:
                to_remove.append(pattern_id)

        for pattern_id in to_remove:
            del memory.patterns[pattern_id]
            count += 1

        # Prune lexicon
        to_remove = []
        for term, entry in memory.lexicon.items():
            weight = entry.metadata.compute_weight(self.decay_lambda)
            if weight < self.prune_threshold and entry.frequency < 2:
                to_remove.append(term)

        for term in to_remove:
            del memory.lexicon[term]
            count += 1

        # Trim narrative (keep last 100)
        if len(memory.narrative) > 100:
            removed = len(memory.narrative) - 100
            memory.narrative = memory.narrative[-100:]
            count += removed

        return memory, count

    def _evolve_patterns(self, memory: UserMemoryState) -> Tuple[UserMemoryState, int, int]:
        """Promote strong patterns, demote weak ones"""
        promoted = 0
        demoted = 0

        for pattern in memory.patterns.values():
            if pattern.strength >= self.pattern_promote_threshold:
                # Promote: increase confidence
                pattern.metadata.confidence = min(1.0, pattern.metadata.confidence + 0.1)
                promoted += 1
            elif pattern.strength <= self.pattern_demote_threshold:
                # Demote: decrease confidence
                pattern.metadata.confidence = max(0.1, pattern.metadata.confidence - 0.1)
                demoted += 1

        return memory, promoted, demoted

    def _evolve_goals(self, memory: UserMemoryState) -> Tuple[UserMemoryState, int, int]:
        """Update goal statuses based on progress and time"""
        completed = 0
        stale = 0
        now = datetime.utcnow()

        for goal in memory.goals.values():
            if goal.status != GoalStatus.ACTIVE:
                continue

            # Check completion
            if goal.progress >= 1.0:
                goal.status = GoalStatus.COMPLETED
                goal.completed_at = now
                completed += 1
                continue

            # Check deadline
            if goal.deadline and now > goal.deadline:
                # Past deadline with low progress
                if goal.progress < 0.5:
                    goal.status = GoalStatus.PAUSED
                    stale += 1

            # Check staleness (no progress in 30 days)
            if goal.metadata.last_accessed:
                days_since_access = (now - goal.metadata.last_accessed).days
                if days_since_access > 30 and goal.progress < 0.1:
                    stale += 1
                    goal.metadata.decay_index *= 0.5

        return memory, completed, stale

    def _detect_conflicts(self, memory: UserMemoryState) -> List[Tuple[str, str]]:
        """Detect conflicting knowledge entries"""
        conflicts = []

        entries = list(memory.knowledge.items())
        for i, (id1, entry1) in enumerate(entries):
            for id2, entry2 in entries[i+1:]:
                if self._entries_conflict(entry1, entry2):
                    conflicts.append((id1, id2))

        return conflicts

    def _entries_conflict(self, entry1: KnowledgeEntry, entry2: KnowledgeEntry) -> bool:
        """Check if two entries conflict"""
        # Same topic with different values
        if entry1.topic.lower() == entry2.topic.lower():
            if entry1.value != entry2.value:
                return True

        # Explicit contradiction markers
        if entry1.entry_id in entry2.contradicts or entry2.entry_id in entry1.contradicts:
            return True

        return False

    def _compute_average_confidence(self, memory: UserMemoryState) -> float:
        """Compute average confidence across all entries"""
        confidences = []

        for entry in memory.knowledge.values():
            confidences.append(entry.metadata.confidence)

        for pattern in memory.patterns.values():
            confidences.append(pattern.metadata.confidence)

        if not confidences:
            return 0.0

        return sum(confidences) / len(confidences)

    def compact_narrative(self, memory: UserMemoryState,
                         max_events: int = 50) -> UserMemoryState:
        """
        Compact narrative by merging similar events and keeping significant ones.
        """
        if len(memory.narrative) <= max_events:
            return memory

        # Sort by significance
        events = sorted(memory.narrative, key=lambda e: -e.significance)

        # Keep top events
        kept = events[:max_events]

        # Re-sort by timestamp
        kept.sort(key=lambda e: e.timestamp)

        memory.narrative = kept
        return memory

    def merge_similar_knowledge(self, memory: UserMemoryState) -> UserMemoryState:
        """
        Merge knowledge entries with similar topics.
        """
        # Group by topic
        topic_groups: Dict[str, List[KnowledgeEntry]] = {}

        for entry in memory.knowledge.values():
            topic_key = entry.topic.lower().strip()
            if topic_key not in topic_groups:
                topic_groups[topic_key] = []
            topic_groups[topic_key].append(entry)

        # Merge groups with multiple entries
        merged_knowledge = {}

        for topic, entries in topic_groups.items():
            if len(entries) == 1:
                merged_knowledge[entries[0].entry_id] = entries[0]
            else:
                # Merge: keep highest confidence, combine values if lists
                best = max(entries, key=lambda e: e.metadata.confidence)

                if all(isinstance(e.value, list) for e in entries):
                    # Combine list values
                    combined = []
                    for e in entries:
                        combined.extend(e.value)
                    best.value = list(set(combined))

                # Update supports
                best.supports = [e.entry_id for e in entries if e.entry_id != best.entry_id]

                merged_knowledge[best.entry_id] = best

        memory.knowledge = merged_knowledge
        return memory


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEDULED EVOLUTION
# ═══════════════════════════════════════════════════════════════════════════════

class ScheduledEvolver:
    """
    Manages scheduled evolution cycles.
    Tracks last evolution time and runs when needed.
    """

    def __init__(self, evolve_engine: EvolveEngine,
                 min_interval_hours: float = 1.0):
        self.engine = evolve_engine
        self.min_interval = timedelta(hours=min_interval_hours)
        self.last_evolution: Dict[str, datetime] = {}

    def should_evolve(self, user_id: str) -> bool:
        """Check if evolution is needed for user"""
        if user_id not in self.last_evolution:
            return True

        elapsed = datetime.utcnow() - self.last_evolution[user_id]
        return elapsed >= self.min_interval

    def evolve_if_needed(self, user_id: str,
                        memory: UserMemoryState) -> Tuple[UserMemoryState, Optional[EvolutionStats]]:
        """Run evolution if enough time has passed"""
        if not self.should_evolve(user_id):
            return memory, None

        # Calculate days since last evolution
        if user_id in self.last_evolution:
            days = (datetime.utcnow() - self.last_evolution[user_id]).total_seconds() / 86400
        else:
            days = 1.0

        # Run evolution
        memory, stats = self.engine.evolve(memory, days_elapsed=days)

        # Update timestamp
        self.last_evolution[user_id] = datetime.utcnow()

        return memory, stats

    def force_evolve(self, user_id: str,
                    memory: UserMemoryState,
                    days: float = 1.0) -> Tuple[UserMemoryState, EvolutionStats]:
        """Force an evolution cycle"""
        memory, stats = self.engine.evolve(memory, days_elapsed=days)
        self.last_evolution[user_id] = datetime.utcnow()
        return memory, stats

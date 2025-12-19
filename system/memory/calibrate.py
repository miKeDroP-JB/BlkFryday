"""
═══════════════════════════════════════════════════════════════════════════════
CALIBRATE ENGINE (MIRROR) - Auto-Confirmation Loop
═══════════════════════════════════════════════════════════════════════════════

Handles:
- auto_confirmation_loop(low_confidence | contradictions | shifts)
- Silent validation of uncertain entries
- Behavior shift detection
- Confidence calibration
"""

from typing import Dict, List, Optional, Tuple, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

from .schema import (
    UserMemoryState, KnowledgeEntry, Pattern, OperatingStyle,
    ResonanceState, ResonanceMode, Metadata, ConfidenceLevel
)


# ═══════════════════════════════════════════════════════════════════════════════
# CALIBRATION TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class CalibrationType(Enum):
    LOW_CONFIDENCE = "low_confidence"
    CONTRADICTION = "contradiction"
    BEHAVIOR_SHIFT = "behavior_shift"
    STALE_DATA = "stale_data"
    PATTERN_DRIFT = "pattern_drift"


@dataclass
class CalibrationItem:
    """An item requiring calibration"""
    item_id: str
    item_type: str              # knowledge, pattern, style, goal
    calibration_type: CalibrationType
    current_value: any
    suggested_action: str       # confirm, revise, delete, merge
    confidence: float
    evidence: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    resolved: bool = False
    resolution: Optional[str] = None


@dataclass
class CalibrationResult:
    """Result of a calibration cycle"""
    items_checked: int = 0
    items_flagged: int = 0
    auto_resolved: int = 0
    needs_review: int = 0
    items: List[CalibrationItem] = field(default_factory=list)


# ═══════════════════════════════════════════════════════════════════════════════
# CALIBRATE ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class CalibrateEngine:
    """
    Auto-calibration engine.
    Detects and resolves data quality issues silently.
    """

    def __init__(self,
                 low_confidence_threshold: float = 0.4,
                 stale_days_threshold: int = 30,
                 behavior_shift_threshold: float = 0.3):
        """
        Args:
            low_confidence_threshold: Flag entries below this
            stale_days_threshold: Flag entries older than this
            behavior_shift_threshold: Magnitude of change to flag
        """
        self.low_confidence_threshold = low_confidence_threshold
        self.stale_days_threshold = stale_days_threshold
        self.behavior_shift_threshold = behavior_shift_threshold

        self.pending_calibrations: Dict[str, List[CalibrationItem]] = {}
        self.calibration_history: List[CalibrationResult] = []

    def calibrate(self, memory: UserMemoryState) -> Tuple[UserMemoryState, CalibrationResult]:
        """
        Run full calibration cycle.

        Returns:
            Tuple of (updated_memory, calibration_result)
        """
        result = CalibrationResult()
        items = []

        # Check low-confidence entries
        low_conf_items = self._check_low_confidence(memory)
        items.extend(low_conf_items)

        # Check contradictions
        contradiction_items = self._check_contradictions(memory)
        items.extend(contradiction_items)

        # Check behavior shifts
        shift_items = self._check_behavior_shifts(memory)
        items.extend(shift_items)

        # Check stale data
        stale_items = self._check_stale_data(memory)
        items.extend(stale_items)

        # Check pattern drift
        drift_items = self._check_pattern_drift(memory)
        items.extend(drift_items)

        result.items_checked = (
            len(memory.knowledge) +
            len(memory.patterns) +
            len(memory.goals)
        )
        result.items_flagged = len(items)
        result.items = items

        # Auto-resolve what we can
        memory, auto_resolved = self._auto_resolve(memory, items)
        result.auto_resolved = auto_resolved
        result.needs_review = len([i for i in items if not i.resolved])

        # Store pending for later review
        self.pending_calibrations[memory.user_id] = [i for i in items if not i.resolved]

        # Track history
        self.calibration_history.append(result)

        return memory, result

    def _check_low_confidence(self, memory: UserMemoryState) -> List[CalibrationItem]:
        """Find entries with low confidence"""
        items = []

        for entry_id, entry in memory.knowledge.items():
            if entry.metadata.confidence < self.low_confidence_threshold:
                items.append(CalibrationItem(
                    item_id=entry_id,
                    item_type="knowledge",
                    calibration_type=CalibrationType.LOW_CONFIDENCE,
                    current_value=entry.value,
                    suggested_action="confirm",
                    confidence=entry.metadata.confidence,
                    evidence=[f"Confidence {entry.metadata.confidence:.2f} below threshold"]
                ))

        for pattern_id, pattern in memory.patterns.items():
            if pattern.metadata.confidence < self.low_confidence_threshold:
                items.append(CalibrationItem(
                    item_id=pattern_id,
                    item_type="pattern",
                    calibration_type=CalibrationType.LOW_CONFIDENCE,
                    current_value=pattern.description,
                    suggested_action="confirm",
                    confidence=pattern.metadata.confidence,
                    evidence=[f"Pattern strength {pattern.strength:.2f}"]
                ))

        return items

    def _check_contradictions(self, memory: UserMemoryState) -> List[CalibrationItem]:
        """Find contradicting entries"""
        items = []

        # Check knowledge contradictions
        entries = list(memory.knowledge.items())
        for i, (id1, entry1) in enumerate(entries):
            for id2, entry2 in entries[i+1:]:
                if entry1.topic.lower() == entry2.topic.lower() and entry1.value != entry2.value:
                    items.append(CalibrationItem(
                        item_id=f"{id1}|{id2}",
                        item_type="knowledge_pair",
                        calibration_type=CalibrationType.CONTRADICTION,
                        current_value={"entry1": entry1.value, "entry2": entry2.value},
                        suggested_action="merge",
                        confidence=min(entry1.metadata.confidence, entry2.metadata.confidence),
                        evidence=[
                            f"Topic '{entry1.topic}' has conflicting values",
                            f"Value 1: {entry1.value}",
                            f"Value 2: {entry2.value}"
                        ]
                    ))

        return items

    def _check_behavior_shifts(self, memory: UserMemoryState) -> List[CalibrationItem]:
        """Detect sudden behavior changes"""
        items = []

        if not memory.resonance or len(memory.resonance.mode_history) < 5:
            return items

        # Analyze mode transitions
        recent_modes = [h['to_mode'] for h in memory.resonance.mode_history[-10:]]
        mode_counts = {}
        for mode in recent_modes:
            mode_counts[mode] = mode_counts.get(mode, 0) + 1

        # Check for dominant shift
        total = len(recent_modes)
        for mode, count in mode_counts.items():
            if count / total > 0.7 and mode != memory.resonance.current_mode.value:
                items.append(CalibrationItem(
                    item_id="resonance_shift",
                    item_type="resonance",
                    calibration_type=CalibrationType.BEHAVIOR_SHIFT,
                    current_value=memory.resonance.current_mode.value,
                    suggested_action="revise",
                    confidence=count / total,
                    evidence=[
                        f"Recent mode distribution: {mode_counts}",
                        f"Dominant mode: {mode} ({count}/{total})"
                    ]
                ))

        return items

    def _check_stale_data(self, memory: UserMemoryState) -> List[CalibrationItem]:
        """Find stale entries"""
        items = []
        now = datetime.utcnow()
        threshold = timedelta(days=self.stale_days_threshold)

        for entry_id, entry in memory.knowledge.items():
            age = now - entry.metadata.timestamp
            if age > threshold and entry.metadata.access_count < 2:
                items.append(CalibrationItem(
                    item_id=entry_id,
                    item_type="knowledge",
                    calibration_type=CalibrationType.STALE_DATA,
                    current_value=entry.value,
                    suggested_action="delete",
                    confidence=0.6,
                    evidence=[
                        f"Entry is {age.days} days old",
                        f"Only accessed {entry.metadata.access_count} times"
                    ]
                ))

        return items

    def _check_pattern_drift(self, memory: UserMemoryState) -> List[CalibrationItem]:
        """Check for patterns that no longer match behavior"""
        items = []

        for pattern_id, pattern in memory.patterns.items():
            # Check if pattern hasn't been reinforced recently
            days_since_seen = (datetime.utcnow() - pattern.last_seen).days
            if days_since_seen > 14 and pattern.strength < 0.5:
                items.append(CalibrationItem(
                    item_id=pattern_id,
                    item_type="pattern",
                    calibration_type=CalibrationType.PATTERN_DRIFT,
                    current_value=pattern.description,
                    suggested_action="delete",
                    confidence=0.5,
                    evidence=[
                        f"Pattern not observed for {days_since_seen} days",
                        f"Current strength: {pattern.strength:.2f}"
                    ]
                ))

        return items

    def _auto_resolve(self, memory: UserMemoryState,
                     items: List[CalibrationItem]) -> Tuple[UserMemoryState, int]:
        """Automatically resolve clear-cut cases"""
        resolved = 0

        for item in items:
            if item.calibration_type == CalibrationType.STALE_DATA:
                # Auto-delete very stale, low-value entries
                if item.confidence < 0.3:
                    if item.item_type == "knowledge" and item.item_id in memory.knowledge:
                        del memory.knowledge[item.item_id]
                        item.resolved = True
                        item.resolution = "auto_deleted"
                        resolved += 1
                    elif item.item_type == "pattern" and item.item_id in memory.patterns:
                        del memory.patterns[item.item_id]
                        item.resolved = True
                        item.resolution = "auto_deleted"
                        resolved += 1

            elif item.calibration_type == CalibrationType.PATTERN_DRIFT:
                # Auto-delete drifted patterns with very low strength
                if item.item_id in memory.patterns:
                    pattern = memory.patterns[item.item_id]
                    if pattern.strength < 0.2 and pattern.frequency < 3:
                        del memory.patterns[item.item_id]
                        item.resolved = True
                        item.resolution = "auto_deleted"
                        resolved += 1

            elif item.calibration_type == CalibrationType.LOW_CONFIDENCE:
                # Boost confidence slightly if entry has been accessed
                if item.item_type == "knowledge" and item.item_id in memory.knowledge:
                    entry = memory.knowledge[item.item_id]
                    if entry.metadata.access_count >= 3:
                        entry.metadata.confidence = min(1.0, entry.metadata.confidence + 0.1)
                        item.resolved = True
                        item.resolution = "auto_boosted"
                        resolved += 1

        return memory, resolved

    def get_pending_calibrations(self, user_id: str) -> List[CalibrationItem]:
        """Get pending calibration items for a user"""
        return self.pending_calibrations.get(user_id, [])

    def resolve_calibration(self, user_id: str, item_id: str,
                           action: str, memory: UserMemoryState) -> UserMemoryState:
        """
        Manually resolve a calibration item.

        Args:
            user_id: User identifier
            item_id: Calibration item ID
            action: 'confirm', 'delete', 'revise', 'ignore'
            memory: Current memory state
        """
        pending = self.pending_calibrations.get(user_id, [])

        for item in pending:
            if item.item_id == item_id:
                if action == "confirm":
                    # Boost confidence
                    if item.item_type == "knowledge" and item.item_id in memory.knowledge:
                        memory.knowledge[item.item_id].metadata.confidence = 0.9
                        memory.knowledge[item.item_id].metadata.source = "user_stated"
                    elif item.item_type == "pattern" and item.item_id in memory.patterns:
                        memory.patterns[item.item_id].metadata.confidence = 0.9

                elif action == "delete":
                    if item.item_type == "knowledge" and item.item_id in memory.knowledge:
                        del memory.knowledge[item.item_id]
                    elif item.item_type == "pattern" and item.item_id in memory.patterns:
                        del memory.patterns[item.item_id]

                elif action == "ignore":
                    pass  # Do nothing, just mark resolved

                item.resolved = True
                item.resolution = f"manual_{action}"
                break

        # Update pending list
        self.pending_calibrations[user_id] = [i for i in pending if not i.resolved]

        return memory

    def generate_confirmation_prompt(self, item: CalibrationItem) -> str:
        """Generate a subtle confirmation prompt for an item"""
        if item.calibration_type == CalibrationType.LOW_CONFIDENCE:
            return f"Just to confirm - {item.current_value}?"

        elif item.calibration_type == CalibrationType.CONTRADICTION:
            values = item.current_value
            return f"I have two notes about this - which is more accurate: {values['entry1']} or {values['entry2']}?"

        elif item.calibration_type == CalibrationType.BEHAVIOR_SHIFT:
            return "I've noticed some changes in our interactions. Everything good?"

        return "Let me know if anything I've noted is off."

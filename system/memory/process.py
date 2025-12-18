"""
═══════════════════════════════════════════════════════════════════════════════
PROCESS ENGINE (BRAIN STEM) - Inference & Conflict Resolution
═══════════════════════════════════════════════════════════════════════════════

Core processing pipeline:
- rule_engine → fast-path inference
- llm_inference → high-level context reasoning (optional)
- contradiction_resolver → resolves conflicts
- confidence_weighter → decay & recency weighting
- schema_mapper → stores insights in memory

Handles the transformation from raw signals to structured knowledge.
"""

import math
import hashlib
from typing import Dict, List, Any, Optional, Tuple, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict

from .schema import (
    RawSignal, KnowledgeEntry, Pattern, PatternType, Goal, GoalStatus,
    OperatingStyle, Tone, Pace, ResonanceMode, ResonanceState,
    Metadata, ConfidenceLevel, UserMemoryState, NarrativeEvent
)


# ═══════════════════════════════════════════════════════════════════════════════
# RULE ENGINE - Fast Path Inference
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class InferenceRule:
    """A single inference rule"""
    rule_id: str
    name: str
    condition: Callable[[RawSignal, UserMemoryState], bool]
    action: Callable[[RawSignal, UserMemoryState], Dict]
    priority: int = 5  # 1-10, higher = evaluated first
    confidence_boost: float = 0.0  # Added to base confidence


class RuleEngine:
    """
    Fast-path inference using predefined rules.
    No LLM calls - pure pattern matching and logic.
    """

    def __init__(self):
        self.rules: List[InferenceRule] = []
        self._register_default_rules()

    def _register_default_rules(self):
        """Register built-in inference rules"""

        # Rule: High friction + question = confusion/need help
        self.register_rule(InferenceRule(
            rule_id="friction_help",
            name="Friction indicates need for help",
            condition=lambda s, m: s.friction_level > 0.5 and 'question' in s.intent_signals,
            action=lambda s, m: {
                'type': 'resonance_update',
                'mode': ResonanceMode.FRICTION,
                'trigger': 'high_friction_question',
                'confidence': 0.75
            },
            priority=8
        ))

        # Rule: Multiple exclamation + high energy = flow state
        self.register_rule(InferenceRule(
            rule_id="flow_detection",
            name="Detect flow state from energy",
            condition=lambda s, m: s.energy_level > 0.8 and s.friction_level < 0.2,
            action=lambda s, m: {
                'type': 'resonance_update',
                'mode': ResonanceMode.FLOW,
                'trigger': 'high_energy_low_friction',
                'confidence': 0.8
            },
            priority=8
        ))

        # Rule: Direct tone + command intent = wants action
        self.register_rule(InferenceRule(
            rule_id="action_oriented",
            name="User wants action",
            condition=lambda s, m: s.tone_detected == Tone.DIRECT and 'command' in s.intent_signals,
            action=lambda s, m: {
                'type': 'style_inference',
                'attribute': 'pace',
                'value': Pace.RAPID,
                'confidence': 0.7
            },
            priority=6
        ))

        # Rule: Gratitude = positive feedback loop
        self.register_rule(InferenceRule(
            rule_id="gratitude_feedback",
            name="Gratitude indicates satisfaction",
            condition=lambda s, m: 'gratitude' in s.emotional_markers,
            action=lambda s, m: {
                'type': 'narrative_event',
                'event_type': 'positive_interaction',
                'significance': 0.6,
                'valence': 0.8
            },
            priority=5
        ))

        # Rule: Repeated topic = goal inference
        self.register_rule(InferenceRule(
            rule_id="topic_goal",
            name="Repeated topic may indicate goal",
            condition=lambda s, m: len(s.topics_mentioned) > 0 and self._topic_repeated(s, m),
            action=lambda s, m: {
                'type': 'goal_inference',
                'topic': s.topics_mentioned[0],
                'confidence': 0.5
            },
            priority=4
        ))

        # Rule: Exploration intent = curiosity mode
        self.register_rule(InferenceRule(
            rule_id="curiosity_mode",
            name="Exploration indicates curiosity",
            condition=lambda s, m: 'exploration' in s.intent_signals or 'curiosity' in s.emotional_markers,
            action=lambda s, m: {
                'type': 'resonance_update',
                'mode': ResonanceMode.CURIOUS,
                'trigger': 'exploration_intent',
                'confidence': 0.7
            },
            priority=6
        ))

        # Rule: Formal tone = adjust formality
        self.register_rule(InferenceRule(
            rule_id="formality_match",
            name="Match user formality",
            condition=lambda s, m: s.tone_detected == Tone.FORMAL,
            action=lambda s, m: {
                'type': 'style_inference',
                'attribute': 'formality_level',
                'value': 0.8,
                'confidence': 0.65
            },
            priority=5
        ))

        # Rule: Casual tone = relax formality
        self.register_rule(InferenceRule(
            rule_id="casual_match",
            name="Match casual tone",
            condition=lambda s, m: s.tone_detected == Tone.CASUAL,
            action=lambda s, m: {
                'type': 'style_inference',
                'attribute': 'formality_level',
                'value': 0.2,
                'confidence': 0.65
            },
            priority=5
        ))

    def _topic_repeated(self, signal: RawSignal, memory: UserMemoryState) -> bool:
        """Check if topic was mentioned before"""
        if not signal.topics_mentioned:
            return False

        topic = signal.topics_mentioned[0].lower()

        # Check in existing knowledge
        for entry in memory.knowledge.values():
            if topic in entry.topic.lower():
                return True

        # Check in patterns
        for pattern in memory.patterns.values():
            if topic in pattern.description.lower():
                return True

        return False

    def register_rule(self, rule: InferenceRule):
        """Register a new inference rule"""
        self.rules.append(rule)
        self.rules.sort(key=lambda r: -r.priority)

    def evaluate(self, signal: RawSignal, memory: UserMemoryState) -> List[Dict]:
        """
        Evaluate all rules against signal and memory state.

        Returns list of inferred actions/updates.
        """
        results = []

        for rule in self.rules:
            try:
                if rule.condition(signal, memory):
                    action = rule.action(signal, memory)
                    action['rule_id'] = rule.rule_id
                    action['rule_name'] = rule.name
                    results.append(action)
            except Exception:
                continue  # Skip failed rules

        return results


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRADICTION RESOLVER
# ═══════════════════════════════════════════════════════════════════════════════

class ContradictionResolver:
    """
    Resolves conflicts between memory entries.
    Uses recency, confidence, and source hierarchy.
    """

    # Source hierarchy (higher = more authoritative)
    SOURCE_HIERARCHY = {
        'user_stated': 1.0,      # User explicitly said it
        'capture': 0.8,          # Directly captured from interaction
        'inference': 0.6,        # Rule-based inference
        'llm_inference': 0.5,    # LLM-generated
        'system': 0.4,           # System default
    }

    def __init__(self):
        self.conflict_log: List[Dict] = []

    def detect_conflicts(self, new_entry: KnowledgeEntry,
                        existing: Dict[str, KnowledgeEntry]) -> List[Tuple[str, KnowledgeEntry]]:
        """
        Find entries that might conflict with new entry.

        Returns list of (entry_id, entry) tuples.
        """
        conflicts = []

        for entry_id, entry in existing.items():
            if self._is_conflicting(new_entry, entry):
                conflicts.append((entry_id, entry))

        return conflicts

    def _is_conflicting(self, entry1: KnowledgeEntry, entry2: KnowledgeEntry) -> bool:
        """Check if two entries conflict"""
        # Same topic with different values
        if entry1.topic.lower() == entry2.topic.lower():
            if entry1.value != entry2.value:
                return True

        # Check explicit contradiction markers
        if entry1.entry_id in entry2.contradicts or entry2.entry_id in entry1.contradicts:
            return True

        return False

    def resolve(self, new_entry: KnowledgeEntry,
                conflicts: List[Tuple[str, KnowledgeEntry]]) -> Dict:
        """
        Resolve conflicts and determine winning entry.

        Returns resolution dict with:
        - winner: KnowledgeEntry to keep
        - action: 'keep_new', 'keep_old', 'merge', 'flag_review'
        - updates: List of updates to make
        """
        if not conflicts:
            return {
                'winner': new_entry,
                'action': 'keep_new',
                'updates': []
            }

        # Score all entries
        new_score = self._score_entry(new_entry)
        conflict_scores = [(cid, entry, self._score_entry(entry))
                          for cid, entry in conflicts]

        # Find highest scoring conflict
        best_conflict = max(conflict_scores, key=lambda x: x[2])

        # Decision logic
        if new_score > best_conflict[2] * 1.2:  # New entry significantly better
            return {
                'winner': new_entry,
                'action': 'keep_new',
                'updates': [
                    {'action': 'deprecate', 'entry_id': cid}
                    for cid, _, _ in conflict_scores
                ]
            }
        elif best_conflict[2] > new_score * 1.2:  # Existing significantly better
            return {
                'winner': best_conflict[1],
                'action': 'keep_old',
                'updates': []
            }
        else:  # Close call - try to merge or flag
            merged = self._attempt_merge(new_entry, best_conflict[1])
            if merged:
                return {
                    'winner': merged,
                    'action': 'merge',
                    'updates': [
                        {'action': 'replace', 'entry_id': best_conflict[0], 'entry': merged}
                    ]
                }
            else:
                # Flag for review
                self.conflict_log.append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'new_entry': new_entry.to_dict(),
                    'conflict_entry': best_conflict[1].to_dict(),
                    'scores': {'new': new_score, 'existing': best_conflict[2]}
                })
                return {
                    'winner': None,
                    'action': 'flag_review',
                    'updates': []
                }

    def _score_entry(self, entry: KnowledgeEntry) -> float:
        """Score an entry based on confidence, recency, and source"""
        source_weight = self.SOURCE_HIERARCHY.get(entry.metadata.source, 0.5)
        recency = entry.metadata.compute_weight()
        confidence = entry.metadata.confidence

        return source_weight * 0.4 + recency * 0.3 + confidence * 0.3

    def _attempt_merge(self, entry1: KnowledgeEntry, entry2: KnowledgeEntry) -> Optional[KnowledgeEntry]:
        """Attempt to merge two conflicting entries"""
        # Only merge if same topic and values can be reconciled
        if entry1.topic.lower() != entry2.topic.lower():
            return None

        # If values are lists, try to combine
        if isinstance(entry1.value, list) and isinstance(entry2.value, list):
            merged_value = list(set(entry1.value + entry2.value))
            return KnowledgeEntry(
                topic=entry1.topic,
                value=merged_value,
                context=f"Merged from multiple sources",
                supports=[entry1.entry_id, entry2.entry_id],
                metadata=Metadata(
                    confidence=max(entry1.metadata.confidence, entry2.metadata.confidence),
                    source="merge"
                )
            )

        # If one is more specific, keep the specific one
        if isinstance(entry1.value, str) and isinstance(entry2.value, str):
            if entry1.value in entry2.value:
                return entry2
            if entry2.value in entry1.value:
                return entry1

        return None


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIDENCE WEIGHTER
# ═══════════════════════════════════════════════════════════════════════════════

class ConfidenceWeighter:
    """
    Manages confidence scoring and decay.
    Implements time-based decay and reinforcement.
    """

    def __init__(self, lambda_decay: float = 0.05):
        self.lambda_decay = lambda_decay  # Decay rate per day

    def compute_weight(self, entry: KnowledgeEntry) -> float:
        """Compute current weight for an entry"""
        return entry.metadata.compute_weight(self.lambda_decay)

    def apply_decay(self, entries: Dict[str, KnowledgeEntry],
                   days_elapsed: float = 1.0) -> Dict[str, KnowledgeEntry]:
        """
        Apply time decay to all entries.

        Returns updated entries.
        """
        decay_factor = math.exp(-self.lambda_decay * days_elapsed)

        for entry in entries.values():
            entry.metadata.decay_index *= decay_factor

        return entries

    def reinforce(self, entry: KnowledgeEntry, boost: float = 0.1) -> KnowledgeEntry:
        """Reinforce an entry (e.g., when referenced or confirmed)"""
        entry.metadata.confidence = min(1.0, entry.metadata.confidence + boost)
        entry.metadata.decay_index = min(1.0, entry.metadata.decay_index + boost)
        entry.metadata.access_count += 1
        entry.metadata.last_accessed = datetime.utcnow()
        return entry

    def should_prune(self, entry: KnowledgeEntry, threshold: float = 0.1) -> bool:
        """Determine if entry should be pruned"""
        weight = self.compute_weight(entry)
        return weight < threshold


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEMA MAPPER
# ═══════════════════════════════════════════════════════════════════════════════

class SchemaMapper:
    """
    Maps processed insights to memory schema.
    Handles the actual storage of inferences.
    """

    def __init__(self, persist_engine=None):
        self.persist = persist_engine

    def apply_inference(self, inference: Dict, memory: UserMemoryState) -> UserMemoryState:
        """
        Apply an inference result to memory state.

        Args:
            inference: Dict with type and data
            memory: Current memory state

        Returns:
            Updated memory state
        """
        inf_type = inference.get('type')

        if inf_type == 'resonance_update':
            memory.resonance.update_mode(
                inference['mode'],
                trigger=inference.get('trigger')
            )

        elif inf_type == 'style_inference':
            attr = inference['attribute']
            value = inference['value']

            if attr == 'pace':
                memory.operating_style.pace = value
            elif attr == 'tone':
                memory.operating_style.tone = value
            elif attr == 'formality_level':
                memory.operating_style.formality_level = value
            elif attr == 'verbosity_preference':
                memory.operating_style.verbosity_preference = value

            memory.operating_style.metadata.timestamp = datetime.utcnow()

        elif inf_type == 'knowledge_entry':
            entry = inference.get('entry')
            if entry:
                memory.knowledge[entry.entry_id] = entry

        elif inf_type == 'goal_inference':
            topic = inference.get('topic', '')
            if topic and topic not in [g.description for g in memory.goals.values()]:
                goal = Goal(
                    description=f"Interest in: {topic}",
                    priority=3,
                    related_topics=[topic],
                    metadata=Metadata(
                        confidence=inference.get('confidence', 0.5),
                        source='inference'
                    )
                )
                memory.goals[goal.goal_id] = goal

        elif inf_type == 'pattern_entry':
            pattern = inference.get('pattern')
            if pattern:
                memory.patterns[pattern.pattern_id] = pattern

        elif inf_type == 'narrative_event':
            event = NarrativeEvent(
                event_type=inference.get('event_type', 'interaction'),
                content=inference.get('content', ''),
                significance=inference.get('significance', 0.5),
                emotional_valence=inference.get('valence', 0.0)
            )
            memory.narrative.append(event)

            # Keep narrative bounded
            if len(memory.narrative) > 100:
                memory.narrative = memory.narrative[-100:]

        # Persist if available
        if self.persist:
            self.persist.store_memory_state(memory)

        return memory


# ═══════════════════════════════════════════════════════════════════════════════
# PROCESS ENGINE - Main Orchestrator
# ═══════════════════════════════════════════════════════════════════════════════

class ProcessEngine:
    """
    Main processing engine.
    Orchestrates rule engine, conflict resolution, weighting, and mapping.
    """

    def __init__(self, persist_engine=None, llm_client=None):
        self.rule_engine = RuleEngine()
        self.resolver = ContradictionResolver()
        self.weighter = ConfidenceWeighter()
        self.mapper = SchemaMapper(persist_engine)
        self.llm_client = llm_client
        self.persist = persist_engine

    def process_signal(self, signal: RawSignal, memory: UserMemoryState) -> UserMemoryState:
        """
        Full processing pipeline for a signal.

        1. Rule engine inference
        2. Optional LLM inference
        3. Conflict resolution
        4. Confidence weighting
        5. Schema mapping

        Returns updated memory state.
        """
        # Step 1: Rule engine (fast path)
        inferences = self.rule_engine.evaluate(signal, memory)

        # Step 2: LLM inference (optional, for complex cases)
        if self.llm_client and self._needs_llm_inference(signal, inferences):
            llm_inferences = self._llm_inference(signal, memory)
            inferences.extend(llm_inferences)

        # Step 3: Process each inference
        for inference in inferences:
            # Conflict resolution for knowledge entries
            if inference.get('type') == 'knowledge_entry':
                entry = inference.get('entry')
                if entry:
                    conflicts = self.resolver.detect_conflicts(entry, memory.knowledge)
                    resolution = self.resolver.resolve(entry, conflicts)

                    if resolution['action'] == 'keep_new':
                        inference['entry'] = resolution['winner']
                    elif resolution['action'] == 'keep_old':
                        continue  # Skip this inference
                    elif resolution['action'] == 'merge':
                        inference['entry'] = resolution['winner']
                    elif resolution['action'] == 'flag_review':
                        # Store for later review
                        continue

            # Apply confidence weighting
            if 'entry' in inference and hasattr(inference['entry'], 'metadata'):
                base_confidence = inference.get('confidence', 0.5)
                inference['entry'].metadata.confidence = base_confidence

            # Map to schema
            memory = self.mapper.apply_inference(inference, memory)

        return memory

    def process_batch(self, signals: List[RawSignal], memory: UserMemoryState) -> UserMemoryState:
        """Process a batch of signals"""
        for signal in signals:
            memory = self.process_signal(signal, memory)
        return memory

    def _needs_llm_inference(self, signal: RawSignal, current_inferences: List[Dict]) -> bool:
        """Determine if LLM inference is needed"""
        # Use LLM if:
        # 1. No rules matched
        # 2. High friction with no clear resolution
        # 3. Complex multi-topic message

        if not current_inferences:
            return True

        if signal.friction_level > 0.7 and not any(
            i.get('type') == 'resonance_update' for i in current_inferences
        ):
            return True

        if len(signal.topics_mentioned) > 3:
            return True

        return False

    def _llm_inference(self, signal: RawSignal, memory: UserMemoryState) -> List[Dict]:
        """
        Use LLM for complex inference.
        Placeholder - implement with actual LLM client.
        """
        if not self.llm_client:
            return []

        # This would be the LLM call
        # For now, return empty
        return []

    def recalculate_all_weights(self, memory: UserMemoryState,
                                days_elapsed: float = 1.0) -> UserMemoryState:
        """Recalculate all weights after time passage"""
        memory.knowledge = self.weighter.apply_decay(memory.knowledge, days_elapsed)

        # Also decay patterns
        for pattern in memory.patterns.values():
            pattern.decay(factor=math.exp(-0.02 * days_elapsed))

        return memory

    def get_conflict_log(self) -> List[Dict]:
        """Get log of unresolved conflicts"""
        return self.resolver.conflict_log

    def register_custom_rule(self, rule: InferenceRule):
        """Register a custom inference rule"""
        self.rule_engine.register_rule(rule)

"""
═══════════════════════════════════════════════════════════════════════════════
SCHEMA LAYER - Static Data Models
═══════════════════════════════════════════════════════════════════════════════

Firestore Schema:
    /users/{user_id}/profile
    /users/{user_id}/operating_style
    /users/{user_id}/knowledge
    /users/{user_id}/goals
    /users/{user_id}/artifacts/{artifact_id}
    /users/{user_id}/avatars/{avatar_name}
    /users/{user_id}/patterns
    /users/{user_id}/resonance
    /users/{user_id}/narrative
    /users/{user_id}/lexicon
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Set
from datetime import datetime
from enum import Enum
import uuid
import math


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class Tone(Enum):
    DIRECT = "direct"
    WARM = "warm"
    ANALYTICAL = "analytical"
    PLAYFUL = "playful"
    FORMAL = "formal"
    CASUAL = "casual"


class Pace(Enum):
    RAPID = "rapid"
    MEASURED = "measured"
    DELIBERATE = "deliberate"
    ADAPTIVE = "adaptive"


class ResonanceMode(Enum):
    FLOW = "flow"           # Deep engagement state
    FRICTION = "friction"   # Resistance detected
    NEUTRAL = "neutral"     # Baseline interaction
    CURIOUS = "curious"     # Exploration mode
    CLOSURE = "closure"     # Completion-seeking


class PatternType(Enum):
    BEHAVIORAL = "behavioral"
    LINGUISTIC = "linguistic"
    TEMPORAL = "temporal"
    EMOTIONAL = "emotional"
    TOPICAL = "topical"


class GoalStatus(Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class ArtifactType(Enum):
    CODE = "code"
    DOCUMENT = "document"
    IMAGE = "image"
    AUDIO = "audio"
    CONFIG = "config"
    DATA = "data"


class ConfidenceLevel(Enum):
    CERTAIN = 0.95      # Multiple confirmations
    HIGH = 0.80         # Strong signals
    MEDIUM = 0.60       # Reasonable inference
    LOW = 0.40          # Weak signals
    SPECULATIVE = 0.20  # Pattern-based guess


# ═══════════════════════════════════════════════════════════════════════════════
# BASE METADATA
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Metadata:
    """Universal metadata for all memory entries"""
    timestamp: datetime = field(default_factory=datetime.utcnow)
    source: str = "inference"           # capture | inference | user_stated | system
    confidence: float = 0.6
    decay_index: float = 1.0            # 1.0 = fresh, decays over time
    relevance_tags: List[str] = field(default_factory=list)
    version: int = 1
    last_accessed: Optional[datetime] = None
    access_count: int = 0

    def compute_weight(self, lambda_decay: float = 0.05) -> float:
        """Compute time-weighted importance score"""
        days_since = (datetime.utcnow() - self.timestamp).days
        recency_weight = math.exp(-lambda_decay * days_since)
        access_boost = min(1.0, self.access_count * 0.05)
        return self.confidence * self.decay_index * recency_weight * (1 + access_boost)

    def to_dict(self) -> Dict:
        return {
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "confidence": self.confidence,
            "decay_index": self.decay_index,
            "relevance_tags": self.relevance_tags,
            "version": self.version,
            "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
            "access_count": self.access_count
        }

    @staticmethod
    def from_dict(data: Dict) -> 'Metadata':
        return Metadata(
            timestamp=datetime.fromisoformat(data.get("timestamp", datetime.utcnow().isoformat())),
            source=data.get("source", "inference"),
            confidence=data.get("confidence", 0.6),
            decay_index=data.get("decay_index", 1.0),
            relevance_tags=data.get("relevance_tags", []),
            version=data.get("version", 1),
            last_accessed=datetime.fromisoformat(data["last_accessed"]) if data.get("last_accessed") else None,
            access_count=data.get("access_count", 0)
        )


# ═══════════════════════════════════════════════════════════════════════════════
# PROFILE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Profile:
    """Core user identity"""
    user_id: str
    name: Optional[str] = None
    dob: Optional[str] = None
    timezone: str = "UTC"
    locale: str = "en-US"
    preferences: Dict[str, Any] = field(default_factory=dict)
    metadata: Metadata = field(default_factory=Metadata)

    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "name": self.name,
            "dob": self.dob,
            "timezone": self.timezone,
            "locale": self.locale,
            "preferences": self.preferences,
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'Profile':
        return Profile(
            user_id=data["user_id"],
            name=data.get("name"),
            dob=data.get("dob"),
            timezone=data.get("timezone", "UTC"),
            locale=data.get("locale", "en-US"),
            preferences=data.get("preferences", {}),
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# OPERATING STYLE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class OperatingStyle:
    """How the user prefers to interact"""
    user_id: str
    pace: Pace = Pace.ADAPTIVE
    tone: Tone = Tone.DIRECT
    friction_triggers: List[str] = field(default_factory=list)   # Things that cause resistance
    flow_triggers: List[str] = field(default_factory=list)       # Things that engage deeply
    verbosity_preference: float = 0.5                            # 0 = terse, 1 = elaborate
    formality_level: float = 0.5                                 # 0 = casual, 1 = formal
    challenge_tolerance: float = 0.5                             # 0 = avoid pushback, 1 = welcome debate
    humor_affinity: float = 0.5                                  # 0 = serious, 1 = playful
    metadata: Metadata = field(default_factory=Metadata)

    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "pace": self.pace.value,
            "tone": self.tone.value,
            "friction_triggers": self.friction_triggers,
            "flow_triggers": self.flow_triggers,
            "verbosity_preference": self.verbosity_preference,
            "formality_level": self.formality_level,
            "challenge_tolerance": self.challenge_tolerance,
            "humor_affinity": self.humor_affinity,
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'OperatingStyle':
        return OperatingStyle(
            user_id=data["user_id"],
            pace=Pace(data.get("pace", "adaptive")),
            tone=Tone(data.get("tone", "direct")),
            friction_triggers=data.get("friction_triggers", []),
            flow_triggers=data.get("flow_triggers", []),
            verbosity_preference=data.get("verbosity_preference", 0.5),
            formality_level=data.get("formality_level", 0.5),
            challenge_tolerance=data.get("challenge_tolerance", 0.5),
            humor_affinity=data.get("humor_affinity", 0.5),
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# KNOWLEDGE ENTRY
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class KnowledgeEntry:
    """A discrete piece of knowledge about the user"""
    entry_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    topic: str = ""
    value: Any = None
    context: str = ""                           # Where/when this was learned
    contradicts: List[str] = field(default_factory=list)  # IDs of conflicting entries
    supports: List[str] = field(default_factory=list)     # IDs of supporting entries
    metadata: Metadata = field(default_factory=Metadata)

    def to_dict(self) -> Dict:
        return {
            "entry_id": self.entry_id,
            "topic": self.topic,
            "value": self.value,
            "context": self.context,
            "contradicts": self.contradicts,
            "supports": self.supports,
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'KnowledgeEntry':
        return KnowledgeEntry(
            entry_id=data.get("entry_id", str(uuid.uuid4())),
            topic=data.get("topic", ""),
            value=data.get("value"),
            context=data.get("context", ""),
            contradicts=data.get("contradicts", []),
            supports=data.get("supports", []),
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# GOAL
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Goal:
    """A user objective being tracked"""
    goal_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    description: str = ""
    priority: int = 5                           # 1-10, higher = more important
    status: GoalStatus = GoalStatus.ACTIVE
    progress: float = 0.0                       # 0.0 - 1.0
    milestones: List[Dict] = field(default_factory=list)
    blockers: List[str] = field(default_factory=list)
    related_topics: List[str] = field(default_factory=list)
    deadline: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    metadata: Metadata = field(default_factory=Metadata)

    def to_dict(self) -> Dict:
        return {
            "goal_id": self.goal_id,
            "description": self.description,
            "priority": self.priority,
            "status": self.status.value,
            "progress": self.progress,
            "milestones": self.milestones,
            "blockers": self.blockers,
            "related_topics": self.related_topics,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'Goal':
        return Goal(
            goal_id=data.get("goal_id", str(uuid.uuid4())),
            description=data.get("description", ""),
            priority=data.get("priority", 5),
            status=GoalStatus(data.get("status", "active")),
            progress=data.get("progress", 0.0),
            milestones=data.get("milestones", []),
            blockers=data.get("blockers", []),
            related_topics=data.get("related_topics", []),
            deadline=datetime.fromisoformat(data["deadline"]) if data.get("deadline") else None,
            created_at=datetime.fromisoformat(data.get("created_at", datetime.utcnow().isoformat())),
            completed_at=datetime.fromisoformat(data["completed_at"]) if data.get("completed_at") else None,
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# ARTIFACT
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Artifact:
    """A stored piece of content or work product"""
    artifact_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    artifact_type: ArtifactType = ArtifactType.DOCUMENT
    title: str = ""
    content: Any = None                         # Actual content or reference
    content_hash: Optional[str] = None          # For deduplication
    storage_path: Optional[str] = None          # External storage reference
    related_goals: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Metadata = field(default_factory=Metadata)

    def to_dict(self) -> Dict:
        return {
            "artifact_id": self.artifact_id,
            "artifact_type": self.artifact_type.value,
            "title": self.title,
            "content": self.content,
            "content_hash": self.content_hash,
            "storage_path": self.storage_path,
            "related_goals": self.related_goals,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'Artifact':
        return Artifact(
            artifact_id=data.get("artifact_id", str(uuid.uuid4())),
            artifact_type=ArtifactType(data.get("artifact_type", "document")),
            title=data.get("title", ""),
            content=data.get("content"),
            content_hash=data.get("content_hash"),
            storage_path=data.get("storage_path"),
            related_goals=data.get("related_goals", []),
            created_at=datetime.fromisoformat(data.get("created_at", datetime.utcnow().isoformat())),
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# AVATAR
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Avatar:
    """A persona/interface for memory access"""
    avatar_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    description: str = ""
    persona_prompt: str = ""                    # System prompt modifier
    memory_filter: List[str] = field(default_factory=list)  # Which memory collections to access
    tone_override: Optional[Tone] = None
    pace_override: Optional[Pace] = None
    active: bool = True
    last_active: datetime = field(default_factory=datetime.utcnow)
    session_count: int = 0
    metadata: Metadata = field(default_factory=Metadata)

    def to_dict(self) -> Dict:
        return {
            "avatar_id": self.avatar_id,
            "name": self.name,
            "description": self.description,
            "persona_prompt": self.persona_prompt,
            "memory_filter": self.memory_filter,
            "tone_override": self.tone_override.value if self.tone_override else None,
            "pace_override": self.pace_override.value if self.pace_override else None,
            "active": self.active,
            "last_active": self.last_active.isoformat(),
            "session_count": self.session_count,
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'Avatar':
        return Avatar(
            avatar_id=data.get("avatar_id", str(uuid.uuid4())),
            name=data.get("name", ""),
            description=data.get("description", ""),
            persona_prompt=data.get("persona_prompt", ""),
            memory_filter=data.get("memory_filter", []),
            tone_override=Tone(data["tone_override"]) if data.get("tone_override") else None,
            pace_override=Pace(data["pace_override"]) if data.get("pace_override") else None,
            active=data.get("active", True),
            last_active=datetime.fromisoformat(data.get("last_active", datetime.utcnow().isoformat())),
            session_count=data.get("session_count", 0),
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# PATTERN
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Pattern:
    """A detected behavioral/interaction pattern"""
    pattern_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    pattern_type: PatternType = PatternType.BEHAVIORAL
    description: str = ""
    trigger_conditions: List[str] = field(default_factory=list)
    response_tendency: str = ""
    frequency: int = 1                          # Times observed
    strength: float = 0.5                       # 0.0 - 1.0, higher = more consistent
    examples: List[Dict] = field(default_factory=list)
    first_seen: datetime = field(default_factory=datetime.utcnow)
    last_seen: datetime = field(default_factory=datetime.utcnow)
    metadata: Metadata = field(default_factory=Metadata)

    def reinforce(self, example: Dict = None):
        """Strengthen pattern on re-observation"""
        self.frequency += 1
        self.last_seen = datetime.utcnow()
        self.strength = min(1.0, self.strength + 0.1 * (1 - self.strength))
        if example:
            self.examples.append(example)
            if len(self.examples) > 10:
                self.examples = self.examples[-10:]  # Keep last 10

    def decay(self, factor: float = 0.95):
        """Weaken pattern over time"""
        self.strength *= factor
        self.metadata.decay_index *= factor

    def to_dict(self) -> Dict:
        return {
            "pattern_id": self.pattern_id,
            "pattern_type": self.pattern_type.value,
            "description": self.description,
            "trigger_conditions": self.trigger_conditions,
            "response_tendency": self.response_tendency,
            "frequency": self.frequency,
            "strength": self.strength,
            "examples": self.examples,
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'Pattern':
        return Pattern(
            pattern_id=data.get("pattern_id", str(uuid.uuid4())),
            pattern_type=PatternType(data.get("pattern_type", "behavioral")),
            description=data.get("description", ""),
            trigger_conditions=data.get("trigger_conditions", []),
            response_tendency=data.get("response_tendency", ""),
            frequency=data.get("frequency", 1),
            strength=data.get("strength", 0.5),
            examples=data.get("examples", []),
            first_seen=datetime.fromisoformat(data.get("first_seen", datetime.utcnow().isoformat())),
            last_seen=datetime.fromisoformat(data.get("last_seen", datetime.utcnow().isoformat())),
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# RESONANCE STATE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ResonanceState:
    """Current interaction mode/state"""
    user_id: str
    current_mode: ResonanceMode = ResonanceMode.NEUTRAL
    mode_history: List[Dict] = field(default_factory=list)  # Recent mode transitions
    thresholds: Dict[str, float] = field(default_factory=lambda: {
        "flow_threshold": 0.7,
        "friction_threshold": 0.3,
        "curiosity_threshold": 0.6,
        "closure_threshold": 0.8
    })
    current_energy: float = 0.5                 # 0 = depleted, 1 = high energy
    current_engagement: float = 0.5             # 0 = disengaged, 1 = deep focus
    last_trigger: Optional[str] = None
    last_trigger_time: Optional[datetime] = None
    metadata: Metadata = field(default_factory=Metadata)

    def update_mode(self, new_mode: ResonanceMode, trigger: str = None):
        """Transition to new resonance mode"""
        self.mode_history.append({
            "from_mode": self.current_mode.value,
            "to_mode": new_mode.value,
            "timestamp": datetime.utcnow().isoformat(),
            "trigger": trigger
        })
        if len(self.mode_history) > 20:
            self.mode_history = self.mode_history[-20:]

        self.current_mode = new_mode
        self.last_trigger = trigger
        self.last_trigger_time = datetime.utcnow()

    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "current_mode": self.current_mode.value,
            "mode_history": self.mode_history,
            "thresholds": self.thresholds,
            "current_energy": self.current_energy,
            "current_engagement": self.current_engagement,
            "last_trigger": self.last_trigger,
            "last_trigger_time": self.last_trigger_time.isoformat() if self.last_trigger_time else None,
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'ResonanceState':
        return ResonanceState(
            user_id=data["user_id"],
            current_mode=ResonanceMode(data.get("current_mode", "neutral")),
            mode_history=data.get("mode_history", []),
            thresholds=data.get("thresholds", {}),
            current_energy=data.get("current_energy", 0.5),
            current_engagement=data.get("current_engagement", 0.5),
            last_trigger=data.get("last_trigger"),
            last_trigger_time=datetime.fromisoformat(data["last_trigger_time"]) if data.get("last_trigger_time") else None,
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# NARRATIVE EVENT
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class NarrativeEvent:
    """A temporal event in the user's story"""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = ""                        # milestone | setback | insight | decision | interaction
    content: str = ""
    significance: float = 0.5                   # 0.0 - 1.0, higher = more important
    related_goals: List[str] = field(default_factory=list)
    related_patterns: List[str] = field(default_factory=list)
    emotional_valence: float = 0.0              # -1.0 = negative, 1.0 = positive
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Metadata = field(default_factory=Metadata)

    def to_dict(self) -> Dict:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "content": self.content,
            "significance": self.significance,
            "related_goals": self.related_goals,
            "related_patterns": self.related_patterns,
            "emotional_valence": self.emotional_valence,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'NarrativeEvent':
        return NarrativeEvent(
            event_id=data.get("event_id", str(uuid.uuid4())),
            event_type=data.get("event_type", ""),
            content=data.get("content", ""),
            significance=data.get("significance", 0.5),
            related_goals=data.get("related_goals", []),
            related_patterns=data.get("related_patterns", []),
            emotional_valence=data.get("emotional_valence", 0.0),
            timestamp=datetime.fromisoformat(data.get("timestamp", datetime.utcnow().isoformat())),
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# LEXICON ENTRY
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class LexiconEntry:
    """User-specific terminology and language patterns"""
    term: str
    definition: str = ""
    usage_examples: List[str] = field(default_factory=list)
    context_tags: List[str] = field(default_factory=list)
    frequency: int = 1
    first_seen: datetime = field(default_factory=datetime.utcnow)
    last_seen: datetime = field(default_factory=datetime.utcnow)
    metadata: Metadata = field(default_factory=Metadata)

    def to_dict(self) -> Dict:
        return {
            "term": self.term,
            "definition": self.definition,
            "usage_examples": self.usage_examples,
            "context_tags": self.context_tags,
            "frequency": self.frequency,
            "first_seen": self.first_seen.isoformat(),
            "last_seen": self.last_seen.isoformat(),
            "metadata": self.metadata.to_dict()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'LexiconEntry':
        return LexiconEntry(
            term=data["term"],
            definition=data.get("definition", ""),
            usage_examples=data.get("usage_examples", []),
            context_tags=data.get("context_tags", []),
            frequency=data.get("frequency", 1),
            first_seen=datetime.fromisoformat(data.get("first_seen", datetime.utcnow().isoformat())),
            last_seen=datetime.fromisoformat(data.get("last_seen", datetime.utcnow().isoformat())),
            metadata=Metadata.from_dict(data.get("metadata", {}))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# RAW SIGNAL
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class RawSignal:
    """Extracted signal from a message/interaction"""
    signal_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source_message: str = ""
    energy_level: float = 0.5                   # 0 = low, 1 = high
    friction_level: float = 0.0                 # 0 = none, 1 = high resistance
    tone_detected: Tone = Tone.DIRECT
    topics_mentioned: List[str] = field(default_factory=list)
    entities_detected: List[Dict] = field(default_factory=list)
    intent_signals: List[str] = field(default_factory=list)
    emotional_markers: Dict[str, float] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict:
        return {
            "signal_id": self.signal_id,
            "source_message": self.source_message,
            "energy_level": self.energy_level,
            "friction_level": self.friction_level,
            "tone_detected": self.tone_detected.value,
            "topics_mentioned": self.topics_mentioned,
            "entities_detected": self.entities_detected,
            "intent_signals": self.intent_signals,
            "emotional_markers": self.emotional_markers,
            "timestamp": self.timestamp.isoformat()
        }

    @staticmethod
    def from_dict(data: Dict) -> 'RawSignal':
        return RawSignal(
            signal_id=data.get("signal_id", str(uuid.uuid4())),
            source_message=data.get("source_message", ""),
            energy_level=data.get("energy_level", 0.5),
            friction_level=data.get("friction_level", 0.0),
            tone_detected=Tone(data.get("tone_detected", "direct")),
            topics_mentioned=data.get("topics_mentioned", []),
            entities_detected=data.get("entities_detected", []),
            intent_signals=data.get("intent_signals", []),
            emotional_markers=data.get("emotional_markers", {}),
            timestamp=datetime.fromisoformat(data.get("timestamp", datetime.utcnow().isoformat()))
        )


# ═══════════════════════════════════════════════════════════════════════════════
# SESSION SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class SessionSummary:
    """Summary of an interaction session"""
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    avatar_id: Optional[str] = None
    start_time: datetime = field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    message_count: int = 0
    topics_covered: List[str] = field(default_factory=list)
    goals_progressed: List[str] = field(default_factory=list)
    patterns_detected: List[str] = field(default_factory=list)
    average_energy: float = 0.5
    dominant_mode: ResonanceMode = ResonanceMode.NEUTRAL
    key_insights: List[str] = field(default_factory=list)
    artifacts_created: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "avatar_id": self.avatar_id,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "message_count": self.message_count,
            "topics_covered": self.topics_covered,
            "goals_progressed": self.goals_progressed,
            "patterns_detected": self.patterns_detected,
            "average_energy": self.average_energy,
            "dominant_mode": self.dominant_mode.value,
            "key_insights": self.key_insights,
            "artifacts_created": self.artifacts_created
        }

    @staticmethod
    def from_dict(data: Dict) -> 'SessionSummary':
        return SessionSummary(
            session_id=data.get("session_id", str(uuid.uuid4())),
            user_id=data.get("user_id", ""),
            avatar_id=data.get("avatar_id"),
            start_time=datetime.fromisoformat(data.get("start_time", datetime.utcnow().isoformat())),
            end_time=datetime.fromisoformat(data["end_time"]) if data.get("end_time") else None,
            message_count=data.get("message_count", 0),
            topics_covered=data.get("topics_covered", []),
            goals_progressed=data.get("goals_progressed", []),
            patterns_detected=data.get("patterns_detected", []),
            average_energy=data.get("average_energy", 0.5),
            dominant_mode=ResonanceMode(data.get("dominant_mode", "neutral")),
            key_insights=data.get("key_insights", []),
            artifacts_created=data.get("artifacts_created", [])
        )


# ═══════════════════════════════════════════════════════════════════════════════
# FULL USER MEMORY STATE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class UserMemoryState:
    """Complete memory state for a user"""
    user_id: str
    profile: Profile = None
    operating_style: OperatingStyle = None
    knowledge: Dict[str, KnowledgeEntry] = field(default_factory=dict)
    goals: Dict[str, Goal] = field(default_factory=dict)
    artifacts: Dict[str, Artifact] = field(default_factory=dict)
    avatars: Dict[str, Avatar] = field(default_factory=dict)
    patterns: Dict[str, Pattern] = field(default_factory=dict)
    resonance: ResonanceState = None
    narrative: List[NarrativeEvent] = field(default_factory=list)
    lexicon: Dict[str, LexiconEntry] = field(default_factory=dict)

    def __post_init__(self):
        if self.profile is None:
            self.profile = Profile(user_id=self.user_id)
        if self.operating_style is None:
            self.operating_style = OperatingStyle(user_id=self.user_id)
        if self.resonance is None:
            self.resonance = ResonanceState(user_id=self.user_id)

    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "profile": self.profile.to_dict() if self.profile else None,
            "operating_style": self.operating_style.to_dict() if self.operating_style else None,
            "knowledge": {k: v.to_dict() for k, v in self.knowledge.items()},
            "goals": {k: v.to_dict() for k, v in self.goals.items()},
            "artifacts": {k: v.to_dict() for k, v in self.artifacts.items()},
            "avatars": {k: v.to_dict() for k, v in self.avatars.items()},
            "patterns": {k: v.to_dict() for k, v in self.patterns.items()},
            "resonance": self.resonance.to_dict() if self.resonance else None,
            "narrative": [e.to_dict() for e in self.narrative],
            "lexicon": {k: v.to_dict() for k, v in self.lexicon.items()}
        }

    @staticmethod
    def from_dict(data: Dict) -> 'UserMemoryState':
        state = UserMemoryState(user_id=data["user_id"])

        if data.get("profile"):
            state.profile = Profile.from_dict(data["profile"])
        if data.get("operating_style"):
            state.operating_style = OperatingStyle.from_dict(data["operating_style"])
        if data.get("knowledge"):
            state.knowledge = {k: KnowledgeEntry.from_dict(v) for k, v in data["knowledge"].items()}
        if data.get("goals"):
            state.goals = {k: Goal.from_dict(v) for k, v in data["goals"].items()}
        if data.get("artifacts"):
            state.artifacts = {k: Artifact.from_dict(v) for k, v in data["artifacts"].items()}
        if data.get("avatars"):
            state.avatars = {k: Avatar.from_dict(v) for k, v in data["avatars"].items()}
        if data.get("patterns"):
            state.patterns = {k: Pattern.from_dict(v) for k, v in data["patterns"].items()}
        if data.get("resonance"):
            state.resonance = ResonanceState.from_dict(data["resonance"])
        if data.get("narrative"):
            state.narrative = [NarrativeEvent.from_dict(e) for e in data["narrative"]]
        if data.get("lexicon"):
            state.lexicon = {k: LexiconEntry.from_dict(v) for k, v in data["lexicon"].items()}

        return state

"""
Avatar Layer - THE MASKS
Phase 12: Avatar model and filter profile management

Avatars inherit memory without duplicating it through filter profiles
"""
from datetime import datetime
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field
from enum import Enum

from .firestore_client import get_firestore_client
from .edge_kv_client import kv_get, kv_put, kv_delete


class AvatarType(str, Enum):
    """Pre-defined avatar archetypes"""
    BUSINESS = "business"
    SALES = "sales"
    PLAY = "play"
    MENTOR = "mentor"
    BUILDER = "builder"
    CUSTOM = "custom"


@dataclass
class FilterProfile:
    """
    Defines what memory collections an avatar can see.
    Inheritance without duplication.
    """
    allowed_collections: List[str] = field(default_factory=list)
    blocked_collections: List[str] = field(default_factory=list)
    allowed_patterns: List[str] = field(default_factory=list)  # Regex patterns
    confidence_threshold: float = 0.3
    max_snippets: int = 10
    include_meta: bool = False


@dataclass
class ToneMap:
    """Tone adjustments for avatar voice"""
    base_tone: str = "direct"
    formality: str = "casual"
    pace: str = "normal"
    verbosity: str = "concise"
    emoji_level: str = "none"  # none, minimal, moderate, heavy
    style_notes: List[str] = field(default_factory=list)


@dataclass
class ResonanceThresholds:
    """When avatar should feel resonance with user"""
    pattern_match_threshold: float = 0.6
    emotion_trigger_threshold: float = 0.7
    callback_frequency: int = 5  # messages before callback
    highlight_keywords: List[str] = field(default_factory=list)


@dataclass
class RelationshipState:
    """Tracks avatar's relationship with user"""
    trust_level: float = 0.5
    familiarity: float = 0.0
    interaction_count: int = 0
    last_interaction: Optional[str] = None
    memorable_moments: List[str] = field(default_factory=list)
    growth_notes: List[str] = field(default_factory=list)


@dataclass
class AvatarConfig:
    """
    Complete avatar configuration.
    Stored at /users/{user_id}/avatars/{avatar_name}
    """
    name: str
    avatar_type: AvatarType = AvatarType.CUSTOM
    persona_profile: Dict[str, Any] = field(default_factory=dict)
    filter_profile: FilterProfile = field(default_factory=FilterProfile)
    tone_map: ToneMap = field(default_factory=ToneMap)
    preferences: Dict[str, Any] = field(default_factory=dict)
    relationship_state: RelationshipState = field(default_factory=RelationshipState)
    resonance_thresholds: ResonanceThresholds = field(default_factory=ResonanceThresholds)
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


# Pre-defined filter profiles by avatar type
DEFAULT_FILTER_PROFILES: Dict[AvatarType, FilterProfile] = {
    AvatarType.BUSINESS: FilterProfile(
        allowed_collections=["operating_style", "goals", "artifacts", "knowledge"],
        blocked_collections=["narrative", "rituals", "play"],
        confidence_threshold=0.5,
        max_snippets=8,
    ),
    AvatarType.SALES: FilterProfile(
        allowed_collections=["friction_triggers", "pace", "flow_patterns", "preferences"],
        blocked_collections=["deep_knowledge", "meta_state"],
        confidence_threshold=0.4,
        max_snippets=10,
    ),
    AvatarType.PLAY: FilterProfile(
        allowed_collections=["lexicon", "rituals", "narrative", "preferences"],
        blocked_collections=["business", "goals", "artifacts"],
        confidence_threshold=0.3,
        max_snippets=15,
    ),
    AvatarType.MENTOR: FilterProfile(
        allowed_collections=["mastery_thresholds", "growth_arcs", "knowledge", "goals"],
        blocked_collections=["play", "rituals"],
        confidence_threshold=0.4,
        max_snippets=12,
    ),
    AvatarType.BUILDER: FilterProfile(
        allowed_collections=["*"],  # Everything
        blocked_collections=[],
        confidence_threshold=0.2,
        max_snippets=20,
        include_meta=True,  # Can see meta-state
    ),
}

DEFAULT_TONE_MAPS: Dict[AvatarType, ToneMap] = {
    AvatarType.BUSINESS: ToneMap(
        base_tone="professional",
        formality="formal",
        pace="efficient",
        verbosity="concise",
    ),
    AvatarType.SALES: ToneMap(
        base_tone="persuasive",
        formality="casual",
        pace="dynamic",
        verbosity="balanced",
    ),
    AvatarType.PLAY: ToneMap(
        base_tone="playful",
        formality="casual",
        pace="relaxed",
        verbosity="expressive",
        emoji_level="moderate",
    ),
    AvatarType.MENTOR: ToneMap(
        base_tone="supportive",
        formality="warm",
        pace="patient",
        verbosity="thorough",
    ),
    AvatarType.BUILDER: ToneMap(
        base_tone="direct",
        formality="casual",
        pace="fast",
        verbosity="concise",
    ),
}


class AvatarManager:
    """
    Manages avatar configurations and memory routing.
    """

    def __init__(self):
        self.db = get_firestore_client()

    def create_avatar(
        self,
        user_id: str,
        name: str,
        avatar_type: AvatarType = AvatarType.CUSTOM,
        custom_config: Optional[Dict[str, Any]] = None,
    ) -> AvatarConfig:
        """Create a new avatar for user"""

        # Start with defaults for type
        filter_profile = DEFAULT_FILTER_PROFILES.get(avatar_type, FilterProfile())
        tone_map = DEFAULT_TONE_MAPS.get(avatar_type, ToneMap())

        config = AvatarConfig(
            name=name,
            avatar_type=avatar_type,
            filter_profile=filter_profile,
            tone_map=tone_map,
        )

        # Apply custom overrides
        if custom_config:
            if "persona_profile" in custom_config:
                config.persona_profile = custom_config["persona_profile"]
            if "preferences" in custom_config:
                config.preferences = custom_config["preferences"]
            if "filter_profile" in custom_config:
                fp = custom_config["filter_profile"]
                config.filter_profile = FilterProfile(**fp)
            if "tone_map" in custom_config:
                tm = custom_config["tone_map"]
                config.tone_map = ToneMap(**tm)

        # Save to Firestore
        self._save_avatar(user_id, config)

        return config

    def get_avatar(self, user_id: str, avatar_name: str) -> Optional[AvatarConfig]:
        """Get avatar configuration"""
        # Try cache first
        cached = kv_get(f"avatar:{user_id}:{avatar_name}")
        if cached:
            import json
            return self._dict_to_config(json.loads(cached))

        # Load from Firestore
        doc = (
            self.db.collection("users")
            .document(user_id)
            .collection("avatars")
            .document(avatar_name)
            .get()
        )

        if not doc.exists:
            return None

        config = self._dict_to_config(doc.to_dict())

        # Cache it
        import json
        kv_put(f"avatar:{user_id}:{avatar_name}", json.dumps(self._config_to_dict(config)), ttl=3600)

        return config

    def update_avatar(
        self,
        user_id: str,
        avatar_name: str,
        updates: Dict[str, Any],
    ) -> Optional[AvatarConfig]:
        """Update avatar configuration"""
        config = self.get_avatar(user_id, avatar_name)
        if not config:
            return None

        # Apply updates
        for key, value in updates.items():
            if hasattr(config, key):
                setattr(config, key, value)

        config.updated_at = datetime.utcnow().isoformat()

        # Save
        self._save_avatar(user_id, config)

        # Invalidate cache
        kv_delete(f"avatar:{user_id}:{avatar_name}")

        return config

    def delete_avatar(self, user_id: str, avatar_name: str) -> bool:
        """Delete avatar"""
        try:
            self.db.collection("users").document(user_id).collection("avatars").document(avatar_name).delete()
            kv_delete(f"avatar:{user_id}:{avatar_name}")
            return True
        except Exception:
            return False

    def list_avatars(self, user_id: str) -> List[AvatarConfig]:
        """List all avatars for user"""
        docs = (
            self.db.collection("users")
            .document(user_id)
            .collection("avatars")
            .stream()
        )

        return [self._dict_to_config(doc.to_dict()) for doc in docs]

    def get_filtered_memory(
        self,
        user_id: str,
        avatar_name: str,
        max_snippets: Optional[int] = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get memory filtered by avatar's filter profile.
        This is the key method - inheritance without duplication.
        """
        config = self.get_avatar(user_id, avatar_name)
        if not config:
            config = AvatarConfig(name=avatar_name)  # Use defaults

        fp = config.filter_profile
        max_items = max_snippets or fp.max_snippets

        result: Dict[str, List[Dict[str, Any]]] = {}
        allowed = fp.allowed_collections

        # Handle wildcard
        if "*" in allowed:
            allowed = ["knowledge", "lexicon", "patterns", "goals", "operating_style", "preferences", "narrative"]

        for collection in allowed:
            if collection in fp.blocked_collections:
                continue

            try:
                docs = (
                    self.db.collection("users")
                    .document(user_id)
                    .collection(collection)
                    .limit(max_items)
                    .stream()
                )

                items = []
                for doc in docs:
                    data = doc.to_dict()
                    meta = data.get("_meta", {})
                    confidence = meta.get("confidence", 0.5)

                    # Apply confidence threshold
                    if confidence >= fp.confidence_threshold:
                        if not fp.include_meta:
                            data.pop("_meta", None)
                        items.append({"id": doc.id, **data})

                if items:
                    result[collection] = items

            except Exception as e:
                pass  # Collection doesn't exist

        return result

    def update_relationship(
        self,
        user_id: str,
        avatar_name: str,
        interaction_type: str = "message",
        memorable: bool = False,
        note: Optional[str] = None,
    ):
        """Update avatar's relationship state after interaction"""
        config = self.get_avatar(user_id, avatar_name)
        if not config:
            return

        rs = config.relationship_state
        rs.interaction_count += 1
        rs.last_interaction = datetime.utcnow().isoformat()

        # Increase familiarity over time
        rs.familiarity = min(1.0, rs.familiarity + 0.01)

        if memorable and note:
            rs.memorable_moments.append(note)
            rs.trust_level = min(1.0, rs.trust_level + 0.05)

        config.relationship_state = rs
        self._save_avatar(user_id, config)

    def _save_avatar(self, user_id: str, config: AvatarConfig):
        """Save avatar to Firestore"""
        data = self._config_to_dict(config)
        (
            self.db.collection("users")
            .document(user_id)
            .collection("avatars")
            .document(config.name)
            .set(data)
        )

    def _config_to_dict(self, config: AvatarConfig) -> Dict[str, Any]:
        """Convert config to dict for storage"""
        return {
            "name": config.name,
            "avatar_type": config.avatar_type.value if isinstance(config.avatar_type, AvatarType) else config.avatar_type,
            "persona_profile": config.persona_profile,
            "filter_profile": {
                "allowed_collections": config.filter_profile.allowed_collections,
                "blocked_collections": config.filter_profile.blocked_collections,
                "allowed_patterns": config.filter_profile.allowed_patterns,
                "confidence_threshold": config.filter_profile.confidence_threshold,
                "max_snippets": config.filter_profile.max_snippets,
                "include_meta": config.filter_profile.include_meta,
            },
            "tone_map": {
                "base_tone": config.tone_map.base_tone,
                "formality": config.tone_map.formality,
                "pace": config.tone_map.pace,
                "verbosity": config.tone_map.verbosity,
                "emoji_level": config.tone_map.emoji_level,
                "style_notes": config.tone_map.style_notes,
            },
            "preferences": config.preferences,
            "relationship_state": {
                "trust_level": config.relationship_state.trust_level,
                "familiarity": config.relationship_state.familiarity,
                "interaction_count": config.relationship_state.interaction_count,
                "last_interaction": config.relationship_state.last_interaction,
                "memorable_moments": config.relationship_state.memorable_moments,
                "growth_notes": config.relationship_state.growth_notes,
            },
            "resonance_thresholds": {
                "pattern_match_threshold": config.resonance_thresholds.pattern_match_threshold,
                "emotion_trigger_threshold": config.resonance_thresholds.emotion_trigger_threshold,
                "callback_frequency": config.resonance_thresholds.callback_frequency,
                "highlight_keywords": config.resonance_thresholds.highlight_keywords,
            },
            "created_at": config.created_at,
            "updated_at": config.updated_at,
        }

    def _dict_to_config(self, data: Dict[str, Any]) -> AvatarConfig:
        """Convert dict to config"""
        fp_data = data.get("filter_profile", {})
        tm_data = data.get("tone_map", {})
        rs_data = data.get("relationship_state", {})
        rt_data = data.get("resonance_thresholds", {})

        return AvatarConfig(
            name=data.get("name", "default"),
            avatar_type=AvatarType(data.get("avatar_type", "custom")),
            persona_profile=data.get("persona_profile", {}),
            filter_profile=FilterProfile(
                allowed_collections=fp_data.get("allowed_collections", []),
                blocked_collections=fp_data.get("blocked_collections", []),
                allowed_patterns=fp_data.get("allowed_patterns", []),
                confidence_threshold=fp_data.get("confidence_threshold", 0.3),
                max_snippets=fp_data.get("max_snippets", 10),
                include_meta=fp_data.get("include_meta", False),
            ),
            tone_map=ToneMap(
                base_tone=tm_data.get("base_tone", "direct"),
                formality=tm_data.get("formality", "casual"),
                pace=tm_data.get("pace", "normal"),
                verbosity=tm_data.get("verbosity", "concise"),
                emoji_level=tm_data.get("emoji_level", "none"),
                style_notes=tm_data.get("style_notes", []),
            ),
            preferences=data.get("preferences", {}),
            relationship_state=RelationshipState(
                trust_level=rs_data.get("trust_level", 0.5),
                familiarity=rs_data.get("familiarity", 0.0),
                interaction_count=rs_data.get("interaction_count", 0),
                last_interaction=rs_data.get("last_interaction"),
                memorable_moments=rs_data.get("memorable_moments", []),
                growth_notes=rs_data.get("growth_notes", []),
            ),
            resonance_thresholds=ResonanceThresholds(
                pattern_match_threshold=rt_data.get("pattern_match_threshold", 0.6),
                emotion_trigger_threshold=rt_data.get("emotion_trigger_threshold", 0.7),
                callback_frequency=rt_data.get("callback_frequency", 5),
                highlight_keywords=rt_data.get("highlight_keywords", []),
            ),
            created_at=data.get("created_at", datetime.utcnow().isoformat()),
            updated_at=data.get("updated_at", datetime.utcnow().isoformat()),
        )


# Singleton instance
_avatar_manager: Optional[AvatarManager] = None


def get_avatar_manager() -> AvatarManager:
    global _avatar_manager
    if _avatar_manager is None:
        _avatar_manager = AvatarManager()
    return _avatar_manager

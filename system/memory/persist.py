"""
═══════════════════════════════════════════════════════════════════════════════
PERSIST ENGINE (STORE) - Storage Layer
═══════════════════════════════════════════════════════════════════════════════

Handles:
- Firestore storage (primary)
- Edge KV caching (fast reads)
- Version control (timestamps, confidence, decay_index)
"""

import json
import hashlib
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from abc import ABC, abstractmethod
from dataclasses import dataclass

from .schema import (
    UserMemoryState, Profile, OperatingStyle, KnowledgeEntry, Goal,
    Artifact, Avatar, Pattern, ResonanceState, NarrativeEvent,
    LexiconEntry, RawSignal, SessionSummary, Metadata
)


# ═══════════════════════════════════════════════════════════════════════════════
# STORAGE INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

class StorageBackend(ABC):
    """Abstract storage backend interface"""

    @abstractmethod
    def get(self, key: str) -> Optional[Dict]:
        pass

    @abstractmethod
    def set(self, key: str, value: Dict, ttl: int = None) -> bool:
        pass

    @abstractmethod
    def delete(self, key: str) -> bool:
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        pass

    @abstractmethod
    def list_keys(self, prefix: str) -> List[str]:
        pass


# ═══════════════════════════════════════════════════════════════════════════════
# IN-MEMORY BACKEND (Development/Testing)
# ═══════════════════════════════════════════════════════════════════════════════

class InMemoryBackend(StorageBackend):
    """In-memory storage for development"""

    def __init__(self):
        self.store: Dict[str, Dict] = {}
        self.expiry: Dict[str, datetime] = {}

    def get(self, key: str) -> Optional[Dict]:
        # Check expiry
        if key in self.expiry:
            if datetime.utcnow() > self.expiry[key]:
                del self.store[key]
                del self.expiry[key]
                return None

        return self.store.get(key)

    def set(self, key: str, value: Dict, ttl: int = None) -> bool:
        self.store[key] = value
        if ttl:
            self.expiry[key] = datetime.utcnow() + timedelta(seconds=ttl)
        return True

    def delete(self, key: str) -> bool:
        if key in self.store:
            del self.store[key]
            if key in self.expiry:
                del self.expiry[key]
            return True
        return False

    def exists(self, key: str) -> bool:
        return key in self.store

    def list_keys(self, prefix: str) -> List[str]:
        return [k for k in self.store.keys() if k.startswith(prefix)]


# ═══════════════════════════════════════════════════════════════════════════════
# FIRESTORE-LIKE BACKEND (Production Placeholder)
# ═══════════════════════════════════════════════════════════════════════════════

class FirestoreBackend(StorageBackend):
    """
    Firestore storage backend.
    Placeholder - implement with actual Firestore client.
    """

    def __init__(self, project_id: str = None, credentials: Any = None):
        self.project_id = project_id
        self.credentials = credentials
        self._client = None
        self._fallback = InMemoryBackend()  # Fallback for when Firestore unavailable

    def _get_client(self):
        """Lazy load Firestore client"""
        if self._client is None:
            try:
                from google.cloud import firestore
                self._client = firestore.Client(
                    project=self.project_id,
                    credentials=self.credentials
                )
            except ImportError:
                return None
        return self._client

    def get(self, key: str) -> Optional[Dict]:
        client = self._get_client()
        if client is None:
            return self._fallback.get(key)

        try:
            doc_ref = self._key_to_ref(key)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception:
            return self._fallback.get(key)

    def set(self, key: str, value: Dict, ttl: int = None) -> bool:
        client = self._get_client()
        if client is None:
            return self._fallback.set(key, value, ttl)

        try:
            doc_ref = self._key_to_ref(key)
            value['_updated_at'] = datetime.utcnow().isoformat()
            if ttl:
                value['_expires_at'] = (datetime.utcnow() + timedelta(seconds=ttl)).isoformat()
            doc_ref.set(value)
            return True
        except Exception:
            return self._fallback.set(key, value, ttl)

    def delete(self, key: str) -> bool:
        client = self._get_client()
        if client is None:
            return self._fallback.delete(key)

        try:
            doc_ref = self._key_to_ref(key)
            doc_ref.delete()
            return True
        except Exception:
            return self._fallback.delete(key)

    def exists(self, key: str) -> bool:
        client = self._get_client()
        if client is None:
            return self._fallback.exists(key)

        try:
            doc_ref = self._key_to_ref(key)
            doc = doc_ref.get()
            return doc.exists
        except Exception:
            return self._fallback.exists(key)

    def list_keys(self, prefix: str) -> List[str]:
        client = self._get_client()
        if client is None:
            return self._fallback.list_keys(prefix)

        try:
            # Parse prefix to collection path
            parts = prefix.split('/')
            collection = self._client.collection(parts[0])
            docs = collection.stream()
            return [f"{parts[0]}/{doc.id}" for doc in docs]
        except Exception:
            return self._fallback.list_keys(prefix)

    def _key_to_ref(self, key: str):
        """Convert key path to Firestore document reference"""
        parts = key.strip('/').split('/')
        ref = self._client

        for i, part in enumerate(parts):
            if i % 2 == 0:
                ref = ref.collection(part)
            else:
                ref = ref.document(part)

        return ref


# ═══════════════════════════════════════════════════════════════════════════════
# EDGE KV CACHE
# ═══════════════════════════════════════════════════════════════════════════════

class EdgeKVCache:
    """
    Edge Key-Value cache layer for fast reads.
    Sits in front of Firestore for hot data.
    """

    def __init__(self, backend: StorageBackend = None, default_ttl: int = 900):
        """
        Args:
            backend: Storage backend for cache (in-memory by default)
            default_ttl: Default TTL in seconds (15 minutes)
        """
        self.backend = backend or InMemoryBackend()
        self.default_ttl = default_ttl
        self.cache_prefix = "_cache:"

    def get(self, key: str) -> Optional[Dict]:
        """Get from cache"""
        cache_key = f"{self.cache_prefix}{key}"
        return self.backend.get(cache_key)

    def set(self, key: str, value: Dict, ttl: int = None) -> bool:
        """Set in cache with TTL"""
        cache_key = f"{self.cache_prefix}{key}"
        return self.backend.set(cache_key, value, ttl or self.default_ttl)

    def invalidate(self, key: str) -> bool:
        """Invalidate cache entry"""
        cache_key = f"{self.cache_prefix}{key}"
        return self.backend.delete(cache_key)

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        cache_pattern = f"{self.cache_prefix}{pattern}"
        keys = self.backend.list_keys(cache_pattern)
        count = 0
        for key in keys:
            if self.backend.delete(key):
                count += 1
        return count


# ═══════════════════════════════════════════════════════════════════════════════
# PERSIST ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class PersistEngine:
    """
    Main persistence engine.
    Orchestrates Firestore and Edge KV for optimal performance.
    """

    def __init__(self,
                 primary_backend: StorageBackend = None,
                 cache: EdgeKVCache = None):
        """
        Args:
            primary_backend: Primary storage (Firestore)
            cache: Cache layer (Edge KV)
        """
        self.primary = primary_backend or InMemoryBackend()
        self.cache = cache or EdgeKVCache()

        # Collections to cache at edge (hot data)
        self.cached_collections = {'profile', 'operating_style', 'lexicon', 'resonance'}

    # ─────────────────────────────────────────────────────────────────────────
    # MEMORY STATE OPERATIONS
    # ─────────────────────────────────────────────────────────────────────────

    def load_memory_state(self, user_id: str) -> UserMemoryState:
        """Load complete memory state for a user"""
        state = UserMemoryState(user_id=user_id)

        # Load each component
        state.profile = self._load_profile(user_id)
        state.operating_style = self._load_operating_style(user_id)
        state.knowledge = self._load_knowledge(user_id)
        state.goals = self._load_goals(user_id)
        state.artifacts = self._load_artifacts(user_id)
        state.avatars = self._load_avatars(user_id)
        state.patterns = self._load_patterns(user_id)
        state.resonance = self._load_resonance(user_id)
        state.narrative = self._load_narrative(user_id)
        state.lexicon = self._load_lexicon(user_id)

        return state

    def store_memory_state(self, state: UserMemoryState) -> bool:
        """Store complete memory state"""
        user_id = state.user_id

        try:
            if state.profile:
                self._store_profile(user_id, state.profile)
            if state.operating_style:
                self._store_operating_style(user_id, state.operating_style)
            self._store_knowledge(user_id, state.knowledge)
            self._store_goals(user_id, state.goals)
            self._store_patterns(user_id, state.patterns)
            if state.resonance:
                self._store_resonance(user_id, state.resonance)
            self._store_narrative(user_id, state.narrative)
            self._store_lexicon(user_id, state.lexicon)
            return True
        except Exception:
            return False

    # ─────────────────────────────────────────────────────────────────────────
    # COMPONENT LOADERS
    # ─────────────────────────────────────────────────────────────────────────

    def _load_profile(self, user_id: str) -> Optional[Profile]:
        key = f"users/{user_id}/profile"

        # Try cache first
        if 'profile' in self.cached_collections:
            cached = self.cache.get(key)
            if cached:
                return Profile.from_dict(cached)

        # Load from primary
        data = self.primary.get(key)
        if data:
            profile = Profile.from_dict(data)
            self.cache.set(key, data)
            return profile

        return Profile(user_id=user_id)

    def _load_operating_style(self, user_id: str) -> Optional[OperatingStyle]:
        key = f"users/{user_id}/operating_style"

        if 'operating_style' in self.cached_collections:
            cached = self.cache.get(key)
            if cached:
                return OperatingStyle.from_dict(cached)

        data = self.primary.get(key)
        if data:
            style = OperatingStyle.from_dict(data)
            self.cache.set(key, data)
            return style

        return OperatingStyle(user_id=user_id)

    def _load_knowledge(self, user_id: str) -> Dict[str, KnowledgeEntry]:
        key = f"users/{user_id}/knowledge"
        data = self.primary.get(key)
        if data and 'entries' in data:
            return {k: KnowledgeEntry.from_dict(v) for k, v in data['entries'].items()}
        return {}

    def _load_goals(self, user_id: str) -> Dict[str, Goal]:
        key = f"users/{user_id}/goals"
        data = self.primary.get(key)
        if data and 'goals' in data:
            return {k: Goal.from_dict(v) for k, v in data['goals'].items()}
        return {}

    def _load_artifacts(self, user_id: str) -> Dict[str, Artifact]:
        key = f"users/{user_id}/artifacts"
        data = self.primary.get(key)
        if data and 'artifacts' in data:
            return {k: Artifact.from_dict(v) for k, v in data['artifacts'].items()}
        return {}

    def _load_avatars(self, user_id: str) -> Dict[str, Avatar]:
        key = f"users/{user_id}/avatars"
        data = self.primary.get(key)
        if data and 'avatars' in data:
            return {k: Avatar.from_dict(v) for k, v in data['avatars'].items()}
        return {}

    def _load_patterns(self, user_id: str) -> Dict[str, Pattern]:
        key = f"users/{user_id}/patterns"
        data = self.primary.get(key)
        if data and 'patterns' in data:
            return {k: Pattern.from_dict(v) for k, v in data['patterns'].items()}
        return {}

    def _load_resonance(self, user_id: str) -> Optional[ResonanceState]:
        key = f"users/{user_id}/resonance"

        if 'resonance' in self.cached_collections:
            cached = self.cache.get(key)
            if cached:
                return ResonanceState.from_dict(cached)

        data = self.primary.get(key)
        if data:
            state = ResonanceState.from_dict(data)
            self.cache.set(key, data)
            return state

        return ResonanceState(user_id=user_id)

    def _load_narrative(self, user_id: str) -> List[NarrativeEvent]:
        key = f"users/{user_id}/narrative"
        data = self.primary.get(key)
        if data and 'events' in data:
            return [NarrativeEvent.from_dict(e) for e in data['events']]
        return []

    def _load_lexicon(self, user_id: str) -> Dict[str, LexiconEntry]:
        key = f"users/{user_id}/lexicon"

        if 'lexicon' in self.cached_collections:
            cached = self.cache.get(key)
            if cached and 'terms' in cached:
                return {k: LexiconEntry.from_dict(v) for k, v in cached['terms'].items()}

        data = self.primary.get(key)
        if data and 'terms' in data:
            lexicon = {k: LexiconEntry.from_dict(v) for k, v in data['terms'].items()}
            self.cache.set(key, data)
            return lexicon

        return {}

    # ─────────────────────────────────────────────────────────────────────────
    # COMPONENT STORERS
    # ─────────────────────────────────────────────────────────────────────────

    def _store_profile(self, user_id: str, profile: Profile):
        key = f"users/{user_id}/profile"
        data = profile.to_dict()
        self.primary.set(key, data)
        if 'profile' in self.cached_collections:
            self.cache.invalidate(key)

    def _store_operating_style(self, user_id: str, style: OperatingStyle):
        key = f"users/{user_id}/operating_style"
        data = style.to_dict()
        self.primary.set(key, data)
        if 'operating_style' in self.cached_collections:
            self.cache.invalidate(key)

    def _store_knowledge(self, user_id: str, knowledge: Dict[str, KnowledgeEntry]):
        key = f"users/{user_id}/knowledge"
        data = {'entries': {k: v.to_dict() for k, v in knowledge.items()}}
        self.primary.set(key, data)

    def _store_goals(self, user_id: str, goals: Dict[str, Goal]):
        key = f"users/{user_id}/goals"
        data = {'goals': {k: v.to_dict() for k, v in goals.items()}}
        self.primary.set(key, data)

    def _store_patterns(self, user_id: str, patterns: Dict[str, Pattern]):
        key = f"users/{user_id}/patterns"
        data = {'patterns': {k: v.to_dict() for k, v in patterns.items()}}
        self.primary.set(key, data)

    def _store_resonance(self, user_id: str, resonance: ResonanceState):
        key = f"users/{user_id}/resonance"
        data = resonance.to_dict()
        self.primary.set(key, data)
        if 'resonance' in self.cached_collections:
            self.cache.invalidate(key)

    def _store_narrative(self, user_id: str, narrative: List[NarrativeEvent]):
        key = f"users/{user_id}/narrative"
        data = {'events': [e.to_dict() for e in narrative]}
        self.primary.set(key, data)

    def _store_lexicon(self, user_id: str, lexicon: Dict[str, LexiconEntry]):
        key = f"users/{user_id}/lexicon"
        data = {'terms': {k: v.to_dict() for k, v in lexicon.items()}}
        self.primary.set(key, data)
        if 'lexicon' in self.cached_collections:
            self.cache.invalidate(key)

    # ─────────────────────────────────────────────────────────────────────────
    # SIGNAL & SESSION STORAGE
    # ─────────────────────────────────────────────────────────────────────────

    def store_signal(self, user_id: str, signal: RawSignal):
        """Store a raw signal (append to list)"""
        key = f"users/{user_id}/signals/{signal.signal_id}"
        self.primary.set(key, signal.to_dict())

    def store_session(self, user_id: str, session: SessionSummary):
        """Store a session summary"""
        key = f"users/{user_id}/sessions/{session.session_id}"
        self.primary.set(key, session.to_dict())

    def load_recent_signals(self, user_id: str, limit: int = 50) -> List[RawSignal]:
        """Load recent signals"""
        keys = self.primary.list_keys(f"users/{user_id}/signals/")
        signals = []
        for key in sorted(keys, reverse=True)[:limit]:
            data = self.primary.get(key)
            if data:
                signals.append(RawSignal.from_dict(data))
        return signals

    def load_recent_sessions(self, user_id: str, limit: int = 10) -> List[SessionSummary]:
        """Load recent sessions"""
        keys = self.primary.list_keys(f"users/{user_id}/sessions/")
        sessions = []
        for key in sorted(keys, reverse=True)[:limit]:
            data = self.primary.get(key)
            if data:
                sessions.append(SessionSummary.from_dict(data))
        return sessions

    # ─────────────────────────────────────────────────────────────────────────
    # UTILITIES
    # ─────────────────────────────────────────────────────────────────────────

    def delete_user(self, user_id: str) -> bool:
        """Delete all data for a user"""
        keys = self.primary.list_keys(f"users/{user_id}/")
        for key in keys:
            self.primary.delete(key)
            self.cache.invalidate(key)
        return True

    def export_user_data(self, user_id: str) -> Dict:
        """Export all user data as JSON-serializable dict"""
        state = self.load_memory_state(user_id)
        return state.to_dict()

    def import_user_data(self, user_id: str, data: Dict) -> bool:
        """Import user data from dict"""
        state = UserMemoryState.from_dict(data)
        state.user_id = user_id  # Ensure correct user ID
        return self.store_memory_state(state)

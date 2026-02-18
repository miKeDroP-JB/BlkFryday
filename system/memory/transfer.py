"""
═══════════════════════════════════════════════════════════════════════════════
TRANSFER ENGINE (BRIDGE) - Cross-Avatar Memory Routing
═══════════════════════════════════════════════════════════════════════════════

Handles:
- memory_router - Routes memory to appropriate avatars
- avatar_filter_profiles - Defines what each avatar can access
- persona-adjusted injection - Modifies context for persona fit
"""

from typing import Dict, List, Any, Optional, Set
from datetime import datetime
from dataclasses import dataclass, field
from copy import deepcopy

from .schema import (
    UserMemoryState, Avatar, KnowledgeEntry, Goal, Pattern, Artifact,
    OperatingStyle, Tone, Pace, ResonanceState, NarrativeEvent, LexiconEntry
)


# ═══════════════════════════════════════════════════════════════════════════════
# AVATAR FILTER PROFILES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class AvatarFilterProfile:
    """Defines memory access profile for an avatar"""
    avatar_name: str
    allowed_collections: Set[str] = field(default_factory=set)
    blocked_topics: Set[str] = field(default_factory=set)
    tone_override: Optional[Tone] = None
    pace_override: Optional[Pace] = None
    context_weight_modifiers: Dict[str, float] = field(default_factory=dict)
    inject_persona_context: bool = True

    @staticmethod
    def business_profile(name: str = "business") -> 'AvatarFilterProfile':
        """Standard business avatar profile"""
        return AvatarFilterProfile(
            avatar_name=name,
            allowed_collections={
                'profile', 'operating_style', 'goals', 'artifacts',
                'patterns', 'lexicon'
            },
            blocked_topics={'personal', 'health', 'family'},
            tone_override=Tone.FORMAL,
            pace_override=Pace.RAPID,
            context_weight_modifiers={
                'goals': 1.5,
                'artifacts': 1.3,
                'knowledge': 0.8
            }
        )

    @staticmethod
    def creative_profile(name: str = "creative") -> 'AvatarFilterProfile':
        """Creative/playful avatar profile"""
        return AvatarFilterProfile(
            avatar_name=name,
            allowed_collections={
                'profile', 'operating_style', 'knowledge', 'narrative',
                'lexicon', 'patterns'
            },
            tone_override=Tone.PLAYFUL,
            pace_override=Pace.ADAPTIVE,
            context_weight_modifiers={
                'narrative': 1.5,
                'lexicon': 1.2
            }
        )

    @staticmethod
    def assistant_profile(name: str = "assistant") -> 'AvatarFilterProfile':
        """General assistant profile - full access"""
        return AvatarFilterProfile(
            avatar_name=name,
            allowed_collections={
                'profile', 'operating_style', 'knowledge', 'goals',
                'artifacts', 'avatars', 'patterns', 'resonance',
                'narrative', 'lexicon'
            },
            tone_override=None,  # Match user preference
            pace_override=None
        )

    @staticmethod
    def sales_profile(name: str = "sales") -> 'AvatarFilterProfile':
        """Sales-focused avatar profile"""
        return AvatarFilterProfile(
            avatar_name=name,
            allowed_collections={
                'profile', 'operating_style', 'goals', 'patterns'
            },
            tone_override=Tone.WARM,
            pace_override=Pace.ADAPTIVE,
            context_weight_modifiers={
                'operating_style': 2.0,  # Heavy focus on communication style
                'patterns': 1.5
            }
        )


# ═══════════════════════════════════════════════════════════════════════════════
# MEMORY ROUTER
# ═══════════════════════════════════════════════════════════════════════════════

class MemoryRouter:
    """Routes memory access based on avatar context"""

    def __init__(self):
        self.profiles: Dict[str, AvatarFilterProfile] = {}
        self._register_default_profiles()

    def _register_default_profiles(self):
        """Register default avatar profiles"""
        self.register_profile(AvatarFilterProfile.business_profile())
        self.register_profile(AvatarFilterProfile.creative_profile())
        self.register_profile(AvatarFilterProfile.assistant_profile())
        self.register_profile(AvatarFilterProfile.sales_profile())

    def register_profile(self, profile: AvatarFilterProfile):
        """Register an avatar filter profile"""
        self.profiles[profile.avatar_name] = profile

    def get_profile(self, avatar_name: str) -> Optional[AvatarFilterProfile]:
        """Get profile for an avatar"""
        return self.profiles.get(avatar_name)

    def route_memory(self, memory: UserMemoryState,
                    avatar_name: str) -> UserMemoryState:
        """
        Route memory through avatar filter.

        Args:
            memory: Full user memory state
            avatar_name: Avatar to filter for

        Returns:
            Filtered memory state
        """
        profile = self.profiles.get(avatar_name)
        if profile is None:
            # No profile = full access
            return memory

        return self._apply_filter(memory, profile)

    def _apply_filter(self, memory: UserMemoryState,
                     profile: AvatarFilterProfile) -> UserMemoryState:
        """Apply filter profile to memory state"""
        filtered = UserMemoryState(user_id=memory.user_id)

        allowed = profile.allowed_collections

        # Always include profile
        filtered.profile = memory.profile

        # Filter collections
        if 'operating_style' in allowed:
            filtered.operating_style = self._filter_style(memory.operating_style, profile)
        else:
            filtered.operating_style = OperatingStyle(user_id=memory.user_id)

        if 'knowledge' in allowed:
            filtered.knowledge = self._filter_knowledge(memory.knowledge, profile)

        if 'goals' in allowed:
            filtered.goals = memory.goals

        if 'artifacts' in allowed:
            filtered.artifacts = memory.artifacts

        if 'avatars' in allowed:
            filtered.avatars = memory.avatars

        if 'patterns' in allowed:
            filtered.patterns = self._filter_patterns(memory.patterns, profile)

        if 'resonance' in allowed:
            filtered.resonance = memory.resonance
        else:
            filtered.resonance = ResonanceState(user_id=memory.user_id)

        if 'narrative' in allowed:
            filtered.narrative = self._filter_narrative(memory.narrative, profile)

        if 'lexicon' in allowed:
            filtered.lexicon = memory.lexicon

        return filtered

    def _filter_style(self, style: OperatingStyle,
                     profile: AvatarFilterProfile) -> OperatingStyle:
        """Apply profile overrides to operating style"""
        filtered = deepcopy(style)

        if profile.tone_override:
            filtered.tone = profile.tone_override
        if profile.pace_override:
            filtered.pace = profile.pace_override

        return filtered

    def _filter_knowledge(self, knowledge: Dict[str, KnowledgeEntry],
                         profile: AvatarFilterProfile) -> Dict[str, KnowledgeEntry]:
        """Filter knowledge by blocked topics"""
        if not profile.blocked_topics:
            return knowledge

        filtered = {}
        for entry_id, entry in knowledge.items():
            topic_lower = entry.topic.lower()
            if not any(blocked in topic_lower for blocked in profile.blocked_topics):
                filtered[entry_id] = entry

        return filtered

    def _filter_patterns(self, patterns: Dict[str, Pattern],
                        profile: AvatarFilterProfile) -> Dict[str, Pattern]:
        """Filter patterns by blocked topics"""
        if not profile.blocked_topics:
            return patterns

        filtered = {}
        for pattern_id, pattern in patterns.items():
            desc_lower = pattern.description.lower()
            if not any(blocked in desc_lower for blocked in profile.blocked_topics):
                filtered[pattern_id] = pattern

        return filtered

    def _filter_narrative(self, narrative: List[NarrativeEvent],
                         profile: AvatarFilterProfile) -> List[NarrativeEvent]:
        """Filter narrative events"""
        if not profile.blocked_topics:
            return narrative

        filtered = []
        for event in narrative:
            content_lower = event.content.lower()
            if not any(blocked in content_lower for blocked in profile.blocked_topics):
                filtered.append(event)

        return filtered


# ═══════════════════════════════════════════════════════════════════════════════
# TRANSFER ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class TransferEngine:
    """
    Main transfer engine.
    Handles cross-avatar memory routing and persona adjustment.
    """

    def __init__(self):
        self.router = MemoryRouter()
        self.transfer_log: List[Dict] = []

    def transfer(self, memory: UserMemoryState,
                source_avatar: Optional[str],
                target_avatar: str) -> UserMemoryState:
        """
        Transfer memory context between avatars.

        Args:
            memory: Current memory state
            source_avatar: Source avatar (or None for full memory)
            target_avatar: Target avatar

        Returns:
            Memory state filtered for target avatar
        """
        # Log transfer
        self.transfer_log.append({
            'timestamp': datetime.utcnow().isoformat(),
            'user_id': memory.user_id,
            'source': source_avatar,
            'target': target_avatar
        })

        # Route through target filter
        filtered = self.router.route_memory(memory, target_avatar)

        return filtered

    def get_avatar_context(self, memory: UserMemoryState,
                          avatar_name: str) -> Dict:
        """
        Get context specifically formatted for an avatar.

        Returns dict with:
        - memory: Filtered memory state
        - persona_prompt: Additional persona instructions
        - weight_modifiers: How to weight different context types
        """
        filtered = self.router.route_memory(memory, avatar_name)
        profile = self.router.get_profile(avatar_name)

        context = {
            'memory': filtered,
            'persona_prompt': self._build_persona_prompt(profile),
            'weight_modifiers': profile.context_weight_modifiers if profile else {}
        }

        return context

    def _build_persona_prompt(self, profile: Optional[AvatarFilterProfile]) -> str:
        """Build persona-specific prompt instructions"""
        if profile is None:
            return ""

        instructions = []

        if profile.tone_override:
            tone_instructions = {
                Tone.DIRECT: "Be direct and concise. No fluff.",
                Tone.WARM: "Be warm and supportive. Show empathy.",
                Tone.ANALYTICAL: "Be thorough and data-driven. Explain reasoning.",
                Tone.PLAYFUL: "Be playful and creative. Embrace humor.",
                Tone.FORMAL: "Maintain professional formality. Be precise.",
                Tone.CASUAL: "Be casual and relaxed. Like talking to a friend."
            }
            instructions.append(tone_instructions.get(profile.tone_override, ""))

        if profile.pace_override:
            pace_instructions = {
                Pace.RAPID: "Get to the point quickly. User values efficiency.",
                Pace.MEASURED: "Take a measured approach. Balance speed and depth.",
                Pace.DELIBERATE: "Be thorough. User appreciates comprehensive responses.",
                Pace.ADAPTIVE: "Match the user's energy and pace."
            }
            instructions.append(pace_instructions.get(profile.pace_override, ""))

        if profile.blocked_topics:
            instructions.append(f"Avoid discussing: {', '.join(profile.blocked_topics)}")

        return " ".join(instructions)

    def sync_across_avatars(self, memory: UserMemoryState,
                           update: Dict,
                           source_avatar: str) -> Dict[str, List[str]]:
        """
        Propagate an update across all avatars.

        Args:
            memory: Current memory state
            update: The update to propagate
            source_avatar: Avatar that generated the update

        Returns:
            Dict mapping avatar names to list of applied updates
        """
        propagation_results = {}

        for avatar_name, profile in self.router.profiles.items():
            if avatar_name == source_avatar:
                continue

            applicable_updates = []

            # Check if update type is allowed for this avatar
            update_type = update.get('type', '')

            if update_type == 'knowledge_entry':
                if 'knowledge' in profile.allowed_collections:
                    entry = update.get('entry')
                    if entry and not any(blocked in entry.topic.lower()
                                        for blocked in profile.blocked_topics):
                        applicable_updates.append(f"knowledge:{entry.topic}")

            elif update_type == 'goal_update':
                if 'goals' in profile.allowed_collections:
                    applicable_updates.append(f"goal:{update.get('goal_id', 'unknown')}")

            elif update_type == 'pattern_entry':
                if 'patterns' in profile.allowed_collections:
                    applicable_updates.append(f"pattern:{update.get('pattern_id', 'unknown')}")

            propagation_results[avatar_name] = applicable_updates

        return propagation_results

    def register_avatar_profile(self, profile: AvatarFilterProfile):
        """Register a new avatar profile"""
        self.router.register_profile(profile)

    def create_avatar_from_template(self, name: str,
                                   template: str) -> AvatarFilterProfile:
        """
        Create a new avatar profile from a template.

        Templates: 'business', 'creative', 'assistant', 'sales'
        """
        templates = {
            'business': AvatarFilterProfile.business_profile,
            'creative': AvatarFilterProfile.creative_profile,
            'assistant': AvatarFilterProfile.assistant_profile,
            'sales': AvatarFilterProfile.sales_profile
        }

        factory = templates.get(template, AvatarFilterProfile.assistant_profile)
        profile = factory(name)

        self.register_avatar_profile(profile)
        return profile

    def get_transfer_log(self, user_id: str = None,
                        limit: int = 100) -> List[Dict]:
        """Get recent transfer log entries"""
        logs = self.transfer_log
        if user_id:
            logs = [l for l in logs if l.get('user_id') == user_id]
        return logs[-limit:]


# ═══════════════════════════════════════════════════════════════════════════════
# DELTA PATCHING
# ═══════════════════════════════════════════════════════════════════════════════

class MemoryDeltaPatcher:
    """
    Handles delta updates between memory states.
    Allows selective syncing without full state transfer.
    """

    @staticmethod
    def compute_delta(old_state: UserMemoryState,
                     new_state: UserMemoryState) -> Dict:
        """
        Compute the difference between two memory states.

        Returns delta dict with additions, modifications, deletions.
        """
        delta = {
            'knowledge': {
                'added': {},
                'modified': {},
                'deleted': []
            },
            'goals': {
                'added': {},
                'modified': {},
                'deleted': []
            },
            'patterns': {
                'added': {},
                'modified': {},
                'deleted': []
            },
            'lexicon': {
                'added': {},
                'modified': {},
                'deleted': []
            }
        }

        # Knowledge delta
        old_knowledge_ids = set(old_state.knowledge.keys())
        new_knowledge_ids = set(new_state.knowledge.keys())

        for kid in new_knowledge_ids - old_knowledge_ids:
            delta['knowledge']['added'][kid] = new_state.knowledge[kid]

        for kid in old_knowledge_ids - new_knowledge_ids:
            delta['knowledge']['deleted'].append(kid)

        for kid in old_knowledge_ids & new_knowledge_ids:
            if old_state.knowledge[kid].to_dict() != new_state.knowledge[kid].to_dict():
                delta['knowledge']['modified'][kid] = new_state.knowledge[kid]

        # Goals delta
        old_goal_ids = set(old_state.goals.keys())
        new_goal_ids = set(new_state.goals.keys())

        for gid in new_goal_ids - old_goal_ids:
            delta['goals']['added'][gid] = new_state.goals[gid]

        for gid in old_goal_ids - new_goal_ids:
            delta['goals']['deleted'].append(gid)

        for gid in old_goal_ids & new_goal_ids:
            if old_state.goals[gid].to_dict() != new_state.goals[gid].to_dict():
                delta['goals']['modified'][gid] = new_state.goals[gid]

        # Patterns delta
        old_pattern_ids = set(old_state.patterns.keys())
        new_pattern_ids = set(new_state.patterns.keys())

        for pid in new_pattern_ids - old_pattern_ids:
            delta['patterns']['added'][pid] = new_state.patterns[pid]

        for pid in old_pattern_ids - new_pattern_ids:
            delta['patterns']['deleted'].append(pid)

        # Lexicon delta
        old_terms = set(old_state.lexicon.keys())
        new_terms = set(new_state.lexicon.keys())

        for term in new_terms - old_terms:
            delta['lexicon']['added'][term] = new_state.lexicon[term]

        for term in old_terms - new_terms:
            delta['lexicon']['deleted'].append(term)

        return delta

    @staticmethod
    def apply_delta(state: UserMemoryState, delta: Dict) -> UserMemoryState:
        """Apply a delta to a memory state"""
        # Apply knowledge changes
        for kid, entry in delta['knowledge'].get('added', {}).items():
            state.knowledge[kid] = entry
        for kid, entry in delta['knowledge'].get('modified', {}).items():
            state.knowledge[kid] = entry
        for kid in delta['knowledge'].get('deleted', []):
            if kid in state.knowledge:
                del state.knowledge[kid]

        # Apply goal changes
        for gid, goal in delta['goals'].get('added', {}).items():
            state.goals[gid] = goal
        for gid, goal in delta['goals'].get('modified', {}).items():
            state.goals[gid] = goal
        for gid in delta['goals'].get('deleted', []):
            if gid in state.goals:
                del state.goals[gid]

        # Apply pattern changes
        for pid, pattern in delta['patterns'].get('added', {}).items():
            state.patterns[pid] = pattern
        for pid in delta['patterns'].get('deleted', []):
            if pid in state.patterns:
                del state.patterns[pid]

        # Apply lexicon changes
        for term, entry in delta['lexicon'].get('added', {}).items():
            state.lexicon[term] = entry
        for term in delta['lexicon'].get('deleted', []):
            if term in state.lexicon:
                del state.lexicon[term]

        return state

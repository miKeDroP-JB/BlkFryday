"""
═══════════════════════════════════════════════════════════════════════════════
SURFACE ENGINE (VOICE) - Context Retrieval & Prompt Injection
═══════════════════════════════════════════════════════════════════════════════

Responsible for:
- retrieve_memory(user_state, context, avatar)
- filter_context
- inject_into_prompt
- tone_match
- resonance_check
- proactive_triggers
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, field

from .schema import (
    UserMemoryState, Avatar, KnowledgeEntry, Goal, Pattern, ResonanceMode,
    OperatingStyle, Tone, Pace, LexiconEntry, NarrativeEvent, Metadata
)


# ═══════════════════════════════════════════════════════════════════════════════
# CONTEXT SNIPPET
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ContextSnippet:
    """A piece of context to inject into prompts"""
    content: str
    category: str              # knowledge, goal, pattern, style, narrative
    relevance: float           # 0.0 - 1.0
    priority: int = 5          # 1-10, higher = more important
    source_id: Optional[str] = None

    def format_for_prompt(self) -> str:
        """Format for injection into system prompt"""
        return f"[{self.category.upper()}] {self.content}"


@dataclass
class ToneProfile:
    """Computed tone settings for response generation"""
    base_tone: Tone = Tone.DIRECT
    formality: float = 0.5
    verbosity: float = 0.5
    pace: Pace = Pace.ADAPTIVE
    humor_allowed: bool = False
    challenge_allowed: bool = False
    warmth_level: float = 0.5

    def to_instruction(self) -> str:
        """Convert to prompt instruction"""
        instructions = []

        tone_map = {
            Tone.DIRECT: "Be direct and concise.",
            Tone.WARM: "Be warm and supportive.",
            Tone.ANALYTICAL: "Be thorough and analytical.",
            Tone.PLAYFUL: "Be playful and light.",
            Tone.FORMAL: "Maintain professional formality.",
            Tone.CASUAL: "Be casual and relaxed.",
        }
        instructions.append(tone_map.get(self.base_tone, ""))

        if self.formality > 0.7:
            instructions.append("Use formal language.")
        elif self.formality < 0.3:
            instructions.append("Use casual language.")

        if self.verbosity > 0.7:
            instructions.append("Provide detailed explanations.")
        elif self.verbosity < 0.3:
            instructions.append("Keep responses brief.")

        if self.pace == Pace.RAPID:
            instructions.append("Get to the point quickly.")
        elif self.pace == Pace.DELIBERATE:
            instructions.append("Take time to explain thoroughly.")

        if self.humor_allowed:
            instructions.append("Humor is welcome.")

        if not self.challenge_allowed:
            instructions.append("Avoid pushback unless necessary.")

        return " ".join(instructions)


# ═══════════════════════════════════════════════════════════════════════════════
# PROACTIVE TRIGGER
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ProactiveTrigger:
    """A trigger for proactive system behavior"""
    trigger_id: str
    trigger_type: str          # reminder, suggestion, check_in, celebration
    content: str
    priority: int = 5
    conditions_met: bool = False
    related_goal: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# SURFACE ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class SurfaceEngine:
    """
    Context retrieval and prompt injection engine.
    Prepares memory context for LLM consumption.
    """

    def __init__(self, max_context_tokens: int = 2000):
        self.max_tokens = max_context_tokens
        self.avg_chars_per_token = 4

    def retrieve_memory(self, memory: UserMemoryState,
                       current_message: str,
                       avatar: Optional[Avatar] = None) -> Dict:
        """
        Retrieve relevant memory context for current interaction.

        Returns:
            Dict with context_snippets, tone_profile, resonance_mode, triggers
        """
        # Filter by avatar if specified
        if avatar:
            memory = self._filter_by_avatar(memory, avatar)

        # Get relevant snippets
        snippets = self._gather_snippets(memory, current_message)

        # Compute tone profile
        tone = self._compute_tone(memory, avatar)

        # Check resonance
        resonance = self._check_resonance(memory, current_message)

        # Get proactive triggers
        triggers = self._get_proactive_triggers(memory, current_message)

        return {
            'context_snippets': snippets,
            'tone_profile': tone,
            'resonance_mode': resonance,
            'proactive_triggers': triggers
        }

    def inject_into_prompt(self, base_prompt: str,
                          context: Dict,
                          max_injection_chars: int = None) -> str:
        """
        Inject memory context into a base prompt.

        Args:
            base_prompt: Original system prompt
            context: Output from retrieve_memory()
            max_injection_chars: Max characters to inject

        Returns:
            Enhanced prompt with memory context
        """
        max_chars = max_injection_chars or (self.max_tokens * self.avg_chars_per_token)

        snippets = context.get('context_snippets', [])
        tone = context.get('tone_profile')
        resonance = context.get('resonance_mode', ResonanceMode.NEUTRAL)

        # Build injection
        injection_parts = []

        # Add tone instructions
        if tone:
            injection_parts.append(f"## Communication Style\n{tone.to_instruction()}")

        # Add resonance context
        resonance_instructions = {
            ResonanceMode.FLOW: "User is highly engaged. Maintain momentum.",
            ResonanceMode.FRICTION: "User may be experiencing difficulty. Be supportive and clear.",
            ResonanceMode.CURIOUS: "User is exploring. Encourage discovery.",
            ResonanceMode.CLOSURE: "User is seeking completion. Help wrap up efficiently.",
            ResonanceMode.NEUTRAL: ""
        }
        if resonance != ResonanceMode.NEUTRAL:
            injection_parts.append(f"## Current State\n{resonance_instructions[resonance]}")

        # Add context snippets (sorted by priority and relevance)
        if snippets:
            snippets.sort(key=lambda s: (-s.priority, -s.relevance))
            snippet_text = "\n".join(s.format_for_prompt() for s in snippets[:10])
            injection_parts.append(f"## User Context\n{snippet_text}")

        # Add proactive triggers
        triggers = context.get('proactive_triggers', [])
        active_triggers = [t for t in triggers if t.conditions_met]
        if active_triggers:
            trigger_text = "\n".join(f"- {t.content}" for t in active_triggers[:3])
            injection_parts.append(f"## Consider Mentioning\n{trigger_text}")

        # Combine and truncate
        injection = "\n\n".join(injection_parts)
        if len(injection) > max_chars:
            injection = injection[:max_chars] + "..."

        # Insert into prompt
        if injection:
            return f"{base_prompt}\n\n---\n{injection}\n---"
        return base_prompt

    def _filter_by_avatar(self, memory: UserMemoryState, avatar: Avatar) -> UserMemoryState:
        """Filter memory by avatar's access profile"""
        if not avatar.memory_filter:
            return memory  # No filter = full access

        # Create filtered copy
        filtered = UserMemoryState(user_id=memory.user_id)
        filtered.profile = memory.profile
        filtered.resonance = memory.resonance

        filter_set = set(avatar.memory_filter)

        if 'operating_style' in filter_set:
            filtered.operating_style = memory.operating_style
        if 'knowledge' in filter_set:
            filtered.knowledge = memory.knowledge
        if 'goals' in filter_set:
            filtered.goals = memory.goals
        if 'artifacts' in filter_set:
            filtered.artifacts = memory.artifacts
        if 'patterns' in filter_set:
            filtered.patterns = memory.patterns
        if 'narrative' in filter_set:
            filtered.narrative = memory.narrative
        if 'lexicon' in filter_set:
            filtered.lexicon = memory.lexicon

        return filtered

    def _gather_snippets(self, memory: UserMemoryState,
                        current_message: str) -> List[ContextSnippet]:
        """Gather relevant context snippets"""
        snippets = []
        message_lower = current_message.lower()
        message_words = set(message_lower.split())

        # Profile snippets
        if memory.profile and memory.profile.name:
            snippets.append(ContextSnippet(
                content=f"User's name is {memory.profile.name}",
                category="profile",
                relevance=0.9,
                priority=8
            ))

        # Knowledge snippets (relevance-filtered)
        for entry_id, entry in memory.knowledge.items():
            relevance = self._compute_relevance(entry.topic, entry.value, message_words)
            if relevance > 0.3:
                snippets.append(ContextSnippet(
                    content=f"{entry.topic}: {entry.value}",
                    category="knowledge",
                    relevance=relevance,
                    priority=6,
                    source_id=entry_id
                ))

        # Active goals
        for goal_id, goal in memory.goals.items():
            if goal.status.value == 'active':
                relevance = self._compute_relevance(goal.description, '', message_words)
                snippets.append(ContextSnippet(
                    content=f"Active goal: {goal.description} ({goal.progress*100:.0f}% complete)",
                    category="goal",
                    relevance=max(0.5, relevance),
                    priority=7,
                    source_id=goal_id
                ))

        # Strong patterns
        for pattern_id, pattern in memory.patterns.items():
            if pattern.strength > 0.6:
                snippets.append(ContextSnippet(
                    content=pattern.response_tendency,
                    category="pattern",
                    relevance=pattern.strength,
                    priority=5,
                    source_id=pattern_id
                ))

        # Recent narrative events
        recent_events = [e for e in memory.narrative
                        if (datetime.utcnow() - e.timestamp).days < 7]
        for event in recent_events[-3:]:
            snippets.append(ContextSnippet(
                content=f"Recent: {event.content}",
                category="narrative",
                relevance=event.significance,
                priority=4,
                source_id=event.event_id
            ))

        # Lexicon (for message-specific terms)
        for term, entry in memory.lexicon.items():
            if term.lower() in message_lower:
                snippets.append(ContextSnippet(
                    content=f"'{term}' means: {entry.definition}",
                    category="lexicon",
                    relevance=0.9,
                    priority=8
                ))

        return snippets

    def _compute_relevance(self, topic: str, value: Any,
                          message_words: set) -> float:
        """Compute relevance of a memory entry to current message"""
        topic_lower = topic.lower()
        value_str = str(value).lower() if value else ""

        topic_words = set(topic_lower.split())
        value_words = set(value_str.split())

        # Word overlap
        topic_overlap = len(topic_words & message_words)
        value_overlap = len(value_words & message_words)

        total_overlap = topic_overlap * 2 + value_overlap  # Topic match weighted higher
        max_possible = len(topic_words) * 2 + len(value_words)

        if max_possible == 0:
            return 0.1

        return min(1.0, total_overlap / max_possible + 0.1)

    def _compute_tone(self, memory: UserMemoryState,
                     avatar: Optional[Avatar] = None) -> ToneProfile:
        """Compute appropriate tone profile"""
        style = memory.operating_style

        profile = ToneProfile(
            base_tone=style.tone if style else Tone.DIRECT,
            formality=style.formality_level if style else 0.5,
            verbosity=style.verbosity_preference if style else 0.5,
            pace=style.pace if style else Pace.ADAPTIVE,
            humor_allowed=style.humor_affinity > 0.5 if style else False,
            challenge_allowed=style.challenge_tolerance > 0.5 if style else False,
            warmth_level=0.5
        )

        # Avatar overrides
        if avatar:
            if avatar.tone_override:
                profile.base_tone = avatar.tone_override
            if avatar.pace_override:
                profile.pace = avatar.pace_override

        # Resonance adjustments
        if memory.resonance:
            if memory.resonance.current_mode == ResonanceMode.FRICTION:
                profile.warmth_level = 0.8
                profile.challenge_allowed = False
            elif memory.resonance.current_mode == ResonanceMode.FLOW:
                profile.warmth_level = 0.6

        return profile

    def _check_resonance(self, memory: UserMemoryState,
                        current_message: str) -> ResonanceMode:
        """Check and update resonance mode"""
        if not memory.resonance:
            return ResonanceMode.NEUTRAL

        return memory.resonance.current_mode

    def _get_proactive_triggers(self, memory: UserMemoryState,
                               current_message: str) -> List[ProactiveTrigger]:
        """Get proactive triggers based on current state"""
        triggers = []

        # Goal progress triggers
        for goal_id, goal in memory.goals.items():
            if goal.status.value == 'active':
                if goal.progress > 0.9:
                    triggers.append(ProactiveTrigger(
                        trigger_id=f"goal_near_complete_{goal_id}",
                        trigger_type="celebration",
                        content=f"User is close to completing: {goal.description}",
                        priority=7,
                        conditions_met=True,
                        related_goal=goal_id
                    ))
                elif goal.deadline:
                    days_left = (goal.deadline - datetime.utcnow()).days
                    if 0 < days_left < 3:
                        triggers.append(ProactiveTrigger(
                            trigger_id=f"goal_deadline_{goal_id}",
                            trigger_type="reminder",
                            content=f"Deadline approaching for: {goal.description}",
                            priority=8,
                            conditions_met=True,
                            related_goal=goal_id
                        ))

        # Pattern-based triggers
        for pattern in memory.patterns.values():
            if pattern.pattern_type.value == 'temporal':
                triggers.append(ProactiveTrigger(
                    trigger_id=f"pattern_{pattern.pattern_id}",
                    trigger_type="suggestion",
                    content=pattern.response_tendency,
                    priority=5,
                    conditions_met=pattern.strength > 0.7
                ))

        return triggers

    def format_memory_summary(self, memory: UserMemoryState) -> str:
        """Generate a human-readable memory summary"""
        lines = []

        lines.append(f"## Memory Summary for {memory.user_id}")
        lines.append("")

        # Profile
        if memory.profile and memory.profile.name:
            lines.append(f"**Name:** {memory.profile.name}")

        # Style
        if memory.operating_style:
            lines.append(f"**Communication Style:** {memory.operating_style.tone.value}, "
                        f"{memory.operating_style.pace.value}")

        # Knowledge count
        lines.append(f"**Knowledge Entries:** {len(memory.knowledge)}")

        # Active goals
        active_goals = [g for g in memory.goals.values() if g.status.value == 'active']
        lines.append(f"**Active Goals:** {len(active_goals)}")

        # Patterns
        strong_patterns = [p for p in memory.patterns.values() if p.strength > 0.5]
        lines.append(f"**Strong Patterns:** {len(strong_patterns)}")

        # Resonance
        if memory.resonance:
            lines.append(f"**Current Mode:** {memory.resonance.current_mode.value}")

        return "\n".join(lines)

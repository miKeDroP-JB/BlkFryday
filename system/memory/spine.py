"""
═══════════════════════════════════════════════════════════════════════════════
MEMORY SPINE - Master Orchestrator
═══════════════════════════════════════════════════════════════════════════════

The central nervous system of the Fractal Memory Engine.
Orchestrates all engines in the continuous processing loop:

User Message
     ↓
Capture Engine → raw_signals
     ↓
Process Engine → insights
     ↓
Memory Graph Update
     ↓
Surface Engine → inject context into LLM
     ↓
Resonance Engine → style/tone adjustments
     ↓
LLM Response
     ↓
Evolve Engine → update patterns, prune, promote
     ↓
Narrative Engine → log temporal arcs
     ↓
Loop continues
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, field

from .schema import (
    UserMemoryState, RawSignal, SessionSummary, Avatar,
    KnowledgeEntry, Pattern, NarrativeEvent, ResonanceMode
)
from .capture import CaptureEngine, BatchCaptureProcessor
from .process import ProcessEngine
from .surface import SurfaceEngine, ContextSnippet, ToneProfile
from .evolve import EvolveEngine, ScheduledEvolver, EvolutionStats
from .calibrate import CalibrateEngine, CalibrationResult
from .persist import PersistEngine, InMemoryBackend, EdgeKVCache
from .transfer import TransferEngine, AvatarFilterProfile


# ═══════════════════════════════════════════════════════════════════════════════
# PIPELINE RESULT
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class PipelineResult:
    """Result from running the memory pipeline"""
    signal: RawSignal
    memory_updated: bool
    context_for_llm: Dict
    evolution_stats: Optional[EvolutionStats] = None
    calibration_result: Optional[CalibrationResult] = None
    insights_generated: int = 0
    processing_time_ms: float = 0.0


@dataclass
class SessionEndResult:
    """Result from ending a session"""
    session_summary: SessionSummary
    patterns_detected: List[Pattern]
    knowledge_extracted: List[KnowledgeEntry]
    narrative_events: List[NarrativeEvent]


# ═══════════════════════════════════════════════════════════════════════════════
# MEMORY SPINE
# ═══════════════════════════════════════════════════════════════════════════════

class MemorySpine:
    """
    The central orchestrator for the Fractal Memory Engine.

    Usage:
        spine = MemorySpine()

        # Process a message
        result = spine.process_message(user_id, message, avatar_name)

        # Get context for LLM
        context = result.context_for_llm

        # Inject into prompt
        enhanced_prompt = spine.inject_context(base_prompt, context)

        # End session
        end_result = spine.end_session(user_id)
    """

    def __init__(self,
                 persist_backend=None,
                 llm_client=None,
                 auto_evolve: bool = True,
                 auto_calibrate: bool = True):
        """
        Initialize the Memory Spine.

        Args:
            persist_backend: Storage backend (default: in-memory)
            llm_client: Optional LLM client for advanced inference
            auto_evolve: Automatically run evolution cycles
            auto_calibrate: Automatically run calibration cycles
        """
        # Initialize storage
        self.persist = PersistEngine(
            primary_backend=persist_backend or InMemoryBackend(),
            cache=EdgeKVCache()
        )

        # Initialize engines
        self.capture = CaptureEngine(persist_engine=self.persist)
        self.process = ProcessEngine(persist_engine=self.persist, llm_client=llm_client)
        self.surface = SurfaceEngine()
        self.evolve = EvolveEngine()
        self.calibrate = CalibrateEngine()
        self.transfer = TransferEngine()

        # Scheduled evolver
        self.evolver = ScheduledEvolver(self.evolve) if auto_evolve else None

        # Settings
        self.auto_calibrate = auto_calibrate

        # In-memory state cache
        self._memory_cache: Dict[str, UserMemoryState] = {}

        # Session tracking
        self._active_sessions: Dict[str, datetime] = {}

    # ─────────────────────────────────────────────────────────────────────────
    # MAIN PIPELINE
    # ─────────────────────────────────────────────────────────────────────────

    def process_message(self, user_id: str, message: str,
                       avatar_name: str = None,
                       context: Dict = None) -> PipelineResult:
        """
        Process a user message through the full pipeline.

        Args:
            user_id: User identifier
            message: Raw message text
            avatar_name: Optional avatar context
            context: Additional context (session, metadata, etc.)

        Returns:
            PipelineResult with all processing outcomes
        """
        start_time = datetime.utcnow()
        context = context or {}

        # Track session
        if user_id not in self._active_sessions:
            self._active_sessions[user_id] = start_time

        # 1. Load or get cached memory state
        memory = self._get_memory(user_id)

        # 2. CAPTURE: Extract signals from message
        signal = self.capture.capture_message(user_id, message, context)

        # 3. PROCESS: Generate insights from signal
        memory = self.process.process_signal(signal, memory)

        # 4. Extract additional knowledge and patterns
        knowledge = self.capture.extract_knowledge(signal, context)
        for entry in knowledge:
            if entry.entry_id not in memory.knowledge:
                memory.knowledge[entry.entry_id] = entry

        lexicon = self.capture.extract_lexicon(signal)
        for entry in lexicon:
            if entry.term not in memory.lexicon:
                memory.lexicon[entry.term] = entry

        # 5. EVOLVE: Run evolution if needed
        evolution_stats = None
        if self.evolver:
            memory, evolution_stats = self.evolver.evolve_if_needed(user_id, memory)

        # 6. CALIBRATE: Run calibration if needed
        calibration_result = None
        if self.auto_calibrate:
            memory, calibration_result = self.calibrate.calibrate(memory)

        # 7. TRANSFER: Apply avatar filter if specified
        avatar = None
        if avatar_name:
            avatar = memory.avatars.get(avatar_name)
            if avatar:
                avatar.last_active = datetime.utcnow()
                avatar.session_count += 1

        # 8. SURFACE: Prepare context for LLM
        llm_context = self.surface.retrieve_memory(memory, message, avatar)

        # 9. Save updated memory
        self._save_memory(user_id, memory)

        # Calculate processing time
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

        return PipelineResult(
            signal=signal,
            memory_updated=True,
            context_for_llm=llm_context,
            evolution_stats=evolution_stats,
            calibration_result=calibration_result,
            insights_generated=len(knowledge),
            processing_time_ms=processing_time
        )

    def inject_context(self, base_prompt: str, context: Dict,
                      max_chars: int = None) -> str:
        """
        Inject memory context into a base prompt.

        Args:
            base_prompt: Original system prompt
            context: Context from process_message().context_for_llm
            max_chars: Max characters to inject

        Returns:
            Enhanced prompt with memory context
        """
        return self.surface.inject_into_prompt(base_prompt, context, max_chars)

    def end_session(self, user_id: str,
                   avatar_name: str = None) -> SessionEndResult:
        """
        End a user session and capture summary.

        Args:
            user_id: User identifier
            avatar_name: Optional avatar context

        Returns:
            SessionEndResult with summary and extracted items
        """
        # Capture session summary
        summary = self.capture.capture_session(user_id, avatar_name)

        # Get memory
        memory = self._get_memory(user_id)

        # Detect patterns from session signals
        recent_signals = self.persist.load_recent_signals(user_id, limit=20)
        pattern = self.capture.capture_pattern(user_id, recent_signals)
        patterns_detected = [pattern] if pattern else []

        # Add pattern to memory
        if pattern:
            memory.patterns[pattern.pattern_id] = pattern

        # Create narrative event for session
        if summary.message_count > 0:
            event = NarrativeEvent(
                event_type="session",
                content=f"Session with {summary.message_count} messages. "
                       f"Topics: {', '.join(summary.topics_covered[:3]) if summary.topics_covered else 'general'}",
                significance=min(0.8, summary.message_count * 0.05),
                emotional_valence=0.5 if summary.dominant_mode == ResonanceMode.FLOW else 0.0
            )
            memory.narrative.append(event)

        # Extract knowledge from session insights
        knowledge_extracted = []
        for insight in summary.key_insights:
            entry = KnowledgeEntry(
                topic="session_insight",
                value=insight,
                context=f"Session {summary.session_id}"
            )
            knowledge_extracted.append(entry)

        # Save memory
        self._save_memory(user_id, memory)

        # Clear session tracking
        if user_id in self._active_sessions:
            del self._active_sessions[user_id]

        return SessionEndResult(
            session_summary=summary,
            patterns_detected=patterns_detected,
            knowledge_extracted=knowledge_extracted,
            narrative_events=[event] if summary.message_count > 0 else []
        )

    # ─────────────────────────────────────────────────────────────────────────
    # MEMORY MANAGEMENT
    # ─────────────────────────────────────────────────────────────────────────

    def _get_memory(self, user_id: str) -> UserMemoryState:
        """Get memory state, using cache if available"""
        if user_id in self._memory_cache:
            return self._memory_cache[user_id]

        memory = self.persist.load_memory_state(user_id)
        self._memory_cache[user_id] = memory
        return memory

    def _save_memory(self, user_id: str, memory: UserMemoryState):
        """Save memory state and update cache"""
        self._memory_cache[user_id] = memory
        self.persist.store_memory_state(memory)

    def get_memory_state(self, user_id: str) -> UserMemoryState:
        """Public method to get memory state"""
        return self._get_memory(user_id)

    def update_memory(self, user_id: str, updates: Dict) -> UserMemoryState:
        """
        Apply updates to memory state.

        Args:
            user_id: User identifier
            updates: Dict of updates to apply

        Returns:
            Updated memory state
        """
        memory = self._get_memory(user_id)

        # Apply updates
        if 'profile' in updates:
            for key, value in updates['profile'].items():
                setattr(memory.profile, key, value)

        if 'operating_style' in updates:
            for key, value in updates['operating_style'].items():
                setattr(memory.operating_style, key, value)

        if 'knowledge' in updates:
            for entry in updates['knowledge']:
                if isinstance(entry, KnowledgeEntry):
                    memory.knowledge[entry.entry_id] = entry
                elif isinstance(entry, dict):
                    ke = KnowledgeEntry.from_dict(entry)
                    memory.knowledge[ke.entry_id] = ke

        if 'goals' in updates:
            for goal in updates['goals']:
                from .schema import Goal
                if isinstance(goal, Goal):
                    memory.goals[goal.goal_id] = goal
                elif isinstance(goal, dict):
                    g = Goal.from_dict(goal)
                    memory.goals[g.goal_id] = g

        self._save_memory(user_id, memory)
        return memory

    def clear_memory(self, user_id: str):
        """Clear all memory for a user"""
        if user_id in self._memory_cache:
            del self._memory_cache[user_id]
        self.persist.delete_user(user_id)

    # ─────────────────────────────────────────────────────────────────────────
    # AVATAR MANAGEMENT
    # ─────────────────────────────────────────────────────────────────────────

    def create_avatar(self, user_id: str, name: str,
                     template: str = "assistant",
                     persona_prompt: str = "") -> Avatar:
        """
        Create a new avatar for a user.

        Args:
            user_id: User identifier
            name: Avatar name
            template: Template type (business, creative, assistant, sales)
            persona_prompt: Custom persona prompt

        Returns:
            Created Avatar
        """
        memory = self._get_memory(user_id)

        # Create avatar filter profile
        profile = self.transfer.create_avatar_from_template(name, template)

        # Create avatar
        avatar = Avatar(
            name=name,
            description=f"{template.capitalize()} avatar",
            persona_prompt=persona_prompt,
            memory_filter=list(profile.allowed_collections),
            tone_override=profile.tone_override,
            pace_override=profile.pace_override
        )

        memory.avatars[name] = avatar
        self._save_memory(user_id, memory)

        return avatar

    def get_avatar_context(self, user_id: str,
                          avatar_name: str) -> Dict:
        """Get memory context filtered for an avatar"""
        memory = self._get_memory(user_id)
        return self.transfer.get_avatar_context(memory, avatar_name)

    # ─────────────────────────────────────────────────────────────────────────
    # CALIBRATION
    # ─────────────────────────────────────────────────────────────────────────

    def get_pending_calibrations(self, user_id: str) -> List:
        """Get pending calibration items for a user"""
        return self.calibrate.get_pending_calibrations(user_id)

    def resolve_calibration(self, user_id: str,
                           item_id: str,
                           action: str) -> UserMemoryState:
        """
        Resolve a calibration item.

        Args:
            user_id: User identifier
            item_id: Calibration item ID
            action: 'confirm', 'delete', 'revise', 'ignore'

        Returns:
            Updated memory state
        """
        memory = self._get_memory(user_id)
        memory = self.calibrate.resolve_calibration(user_id, item_id, action, memory)
        self._save_memory(user_id, memory)
        return memory

    # ─────────────────────────────────────────────────────────────────────────
    # UTILITIES
    # ─────────────────────────────────────────────────────────────────────────

    def export_user_data(self, user_id: str) -> Dict:
        """Export all user data as JSON-serializable dict"""
        return self.persist.export_user_data(user_id)

    def import_user_data(self, user_id: str, data: Dict) -> bool:
        """Import user data from dict"""
        success = self.persist.import_user_data(user_id, data)
        if success and user_id in self._memory_cache:
            del self._memory_cache[user_id]
        return success

    def get_memory_summary(self, user_id: str) -> str:
        """Get human-readable memory summary"""
        memory = self._get_memory(user_id)
        return self.surface.format_memory_summary(memory)

    def force_evolution(self, user_id: str,
                       days: float = 1.0) -> EvolutionStats:
        """Force an evolution cycle"""
        memory = self._get_memory(user_id)
        memory, stats = self.evolve.evolve(memory, days_elapsed=days)
        self._save_memory(user_id, memory)
        return stats

    def get_active_sessions(self) -> Dict[str, datetime]:
        """Get currently active sessions"""
        return self._active_sessions.copy()


# ═══════════════════════════════════════════════════════════════════════════════
# QUICK START FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def create_spine(persist_backend=None, llm_client=None) -> MemorySpine:
    """Create and return a configured MemorySpine instance"""
    return MemorySpine(
        persist_backend=persist_backend,
        llm_client=llm_client,
        auto_evolve=True,
        auto_calibrate=True
    )


def quick_test():
    """Quick test of the Memory Spine"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗██████╗  █████╗  ██████╗████████╗ █████╗ ██╗                       ║
║   ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██║                       ║
║   █████╗  ██████╔╝███████║██║        ██║   ███████║██║                       ║
║   ██╔══╝  ██╔══██╗██╔══██║██║        ██║   ██╔══██║██║                       ║
║   ██║     ██║  ██║██║  ██║╚██████╗   ██║   ██║  ██║███████╗                  ║
║   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝                  ║
║                                                                              ║
║                    MEMORY ENGINE TEST                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    spine = create_spine()
    user_id = "test_user_001"

    # Test messages
    messages = [
        "Hey! I'm really excited to get started on this project.",
        "My name is Alex and I work at TechCorp.",
        "I prefer quick, direct communication. No fluff please!",
        "I'm working on building an AI system for customer service.",
        "This is frustrating - why isn't this working?",
        "Oh wait, I figured it out! That's awesome!",
        "By 'spike' I mean a quick proof-of-concept prototype.",
    ]

    print("Processing messages...\n")

    for i, msg in enumerate(messages):
        print(f"[{i+1}] User: {msg[:50]}...")
        result = spine.process_message(user_id, msg)
        print(f"    → Signal: energy={result.signal.energy_level:.2f}, "
              f"friction={result.signal.friction_level:.2f}, "
              f"tone={result.signal.tone_detected.value}")
        print(f"    → Insights: {result.insights_generated}, "
              f"Time: {result.processing_time_ms:.1f}ms")
        print()

    # End session
    print("Ending session...")
    end_result = spine.end_session(user_id)
    print(f"Session Summary: {end_result.session_summary.message_count} messages")
    print(f"Patterns Detected: {len(end_result.patterns_detected)}")
    print(f"Knowledge Extracted: {len(end_result.knowledge_extracted)}")

    # Show memory summary
    print("\n" + "=" * 60)
    print(spine.get_memory_summary(user_id))

    # Show memory state
    memory = spine.get_memory_state(user_id)
    print(f"\nKnowledge Entries: {len(memory.knowledge)}")
    print(f"Patterns: {len(memory.patterns)}")
    print(f"Lexicon Terms: {len(memory.lexicon)}")
    print(f"Narrative Events: {len(memory.narrative)}")

    print("\n✓ Memory Spine test complete!")

    return spine, user_id


if __name__ == "__main__":
    quick_test()

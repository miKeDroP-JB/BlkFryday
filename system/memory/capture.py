"""
═══════════════════════════════════════════════════════════════════════════════
CAPTURE ENGINE (EARS) - Signal Extraction
═══════════════════════════════════════════════════════════════════════════════

Extracts signals from user interactions:
- capture_message → raw_signals
- capture_session → session_summary
- capture_patterns → evolving_patterns

Uses regex + lightweight NLP for fast-path extraction.
Falls back to LLM for complex inference.
"""

import re
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from dataclasses import dataclass, field

from .schema import (
    RawSignal, SessionSummary, Pattern, PatternType, Tone, ResonanceMode,
    KnowledgeEntry, LexiconEntry, NarrativeEvent, Metadata, ConfidenceLevel
)


# ═══════════════════════════════════════════════════════════════════════════════
# SIGNAL EXTRACTORS
# ═══════════════════════════════════════════════════════════════════════════════

class ToneDetector:
    """Detect communication tone from text"""

    # Tone marker patterns
    PATTERNS = {
        Tone.DIRECT: [
            r'\b(do|make|build|create|fix|solve|handle)\b',
            r'\b(now|immediately|asap|quickly)\b',
            r'^[A-Z][^.?!]*[.!]$',  # Short declarative
        ],
        Tone.WARM: [
            r'\b(please|thank|appreciate|grateful|love|enjoy)\b',
            r'\b(hope|wish|feel|care)\b',
            r'[!]{1,2}$',
        ],
        Tone.ANALYTICAL: [
            r'\b(analyze|compare|evaluate|assess|consider|examine)\b',
            r'\b(because|therefore|however|although|whereas)\b',
            r'\b(data|statistics|metrics|evidence|research)\b',
        ],
        Tone.PLAYFUL: [
            r'\b(haha|lol|lmao|rofl)\b',
            r'[😀-🙏]',  # Emoji range
            r'\b(fun|funny|silly|crazy|wild)\b',
        ],
        Tone.FORMAL: [
            r'\b(hereby|pursuant|regarding|concerning|respectively)\b',
            r'\b(shall|would|could you kindly)\b',
            r'^(Dear|To whom|Attention)\b',
        ],
        Tone.CASUAL: [
            r'\b(hey|yo|sup|cool|awesome|dude|bro)\b',
            r'\b(gonna|wanna|gotta|kinda|sorta)\b',
            r'[.]{3,}',  # Trailing dots
        ],
    }

    @classmethod
    def detect(cls, text: str) -> Tuple[Tone, float]:
        """Detect tone and confidence"""
        scores = {}

        for tone, patterns in cls.PATTERNS.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text, re.IGNORECASE))
                score += matches

            scores[tone] = score

        if not any(scores.values()):
            return Tone.DIRECT, 0.5

        best_tone = max(scores, key=scores.get)
        total = sum(scores.values())
        confidence = scores[best_tone] / total if total > 0 else 0.5

        return best_tone, min(0.95, confidence)


class EnergyDetector:
    """Detect energy level from text"""

    HIGH_ENERGY_MARKERS = [
        r'[!]{2,}',
        r'[A-Z]{3,}',  # CAPS
        r'\b(amazing|incredible|awesome|excited|pumped|stoked)\b',
        r'\b(urgent|critical|asap|now|immediately)\b',
        r'\b(love|brilliant|fantastic|perfect)\b',
    ]

    LOW_ENERGY_MARKERS = [
        r'\b(tired|exhausted|drained|overwhelmed)\b',
        r'\b(meh|okay|fine|whatever)\b',
        r'\b(struggling|difficult|hard|tough)\b',
        r'[.]{3,}',
        r'^.{1,20}$',  # Very short messages
    ]

    @classmethod
    def detect(cls, text: str) -> float:
        """Detect energy level 0.0-1.0"""
        high_count = sum(
            len(re.findall(p, text, re.IGNORECASE))
            for p in cls.HIGH_ENERGY_MARKERS
        )
        low_count = sum(
            len(re.findall(p, text, re.IGNORECASE))
            for p in cls.LOW_ENERGY_MARKERS
        )

        if high_count + low_count == 0:
            return 0.5

        return min(1.0, max(0.0, 0.5 + (high_count - low_count) * 0.1))


class FrictionDetector:
    """Detect resistance/friction in text"""

    FRICTION_MARKERS = [
        r'\b(but|however|although|except|unless)\b',
        r'\b(no|not|never|none|nothing)\b',
        r'\b(can\'t|won\'t|don\'t|shouldn\'t|couldn\'t)\b',
        r'\b(problem|issue|concern|worry|trouble)\b',
        r'\b(frustrated|annoyed|confused|stuck)\b',
        r'\b(why|how come)\b.*\?',
        r'\?{2,}',
    ]

    FLOW_MARKERS = [
        r'\b(yes|yeah|yep|sure|absolutely|definitely)\b',
        r'\b(great|perfect|exactly|right)\b',
        r'\b(let\'s|let me|I\'ll|we can)\b',
        r'\b(understand|got it|makes sense|clear)\b',
    ]

    @classmethod
    def detect(cls, text: str) -> float:
        """Detect friction level 0.0-1.0"""
        friction_count = sum(
            len(re.findall(p, text, re.IGNORECASE))
            for p in cls.FRICTION_MARKERS
        )
        flow_count = sum(
            len(re.findall(p, text, re.IGNORECASE))
            for p in cls.FLOW_MARKERS
        )

        total = friction_count + flow_count
        if total == 0:
            return 0.1

        return friction_count / total


class TopicExtractor:
    """Extract topics from text"""

    # Common topic indicators
    TOPIC_PATTERNS = [
        r'(?:about|regarding|concerning|on)\s+(\w+(?:\s+\w+)?)',
        r'(?:the|a|an)\s+(\w+(?:\s+\w+)?)\s+(?:is|are|was|were)',
        r'(\w+(?:\s+\w+)?)\s+(?:project|system|feature|module|component)',
    ]

    # Stop words to filter
    STOP_WORDS = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
        'would', 'could', 'should', 'may', 'might', 'must', 'can',
        'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
        'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where',
        'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
        'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
        'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also'
    }

    @classmethod
    def extract(cls, text: str) -> List[str]:
        """Extract topic mentions from text"""
        topics = []

        # Pattern-based extraction
        for pattern in cls.TOPIC_PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            topics.extend(matches)

        # N-gram extraction (2-3 word phrases with capital letters)
        capital_phrases = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b', text)
        topics.extend(capital_phrases)

        # Filter and clean
        cleaned = []
        for topic in topics:
            words = topic.lower().split()
            filtered = [w for w in words if w not in cls.STOP_WORDS and len(w) > 2]
            if filtered:
                cleaned.append(' '.join(filtered))

        return list(set(cleaned))


class EntityExtractor:
    """Extract named entities from text"""

    ENTITY_PATTERNS = {
        'person': r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b',
        'email': r'\b[\w.-]+@[\w.-]+\.\w+\b',
        'url': r'https?://[^\s]+',
        'date': r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
        'time': r'\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b',
        'money': r'\$[\d,]+(?:\.\d{2})?',
        'percentage': r'\b\d+(?:\.\d+)?%\b',
        'number': r'\b\d+(?:,\d{3})*(?:\.\d+)?\b',
        'file': r'\b[\w-]+\.\w{2,4}\b',
        'code_ref': r'`[^`]+`',
    }

    @classmethod
    def extract(cls, text: str) -> List[Dict]:
        """Extract entities with type and value"""
        entities = []

        for entity_type, pattern in cls.ENTITY_PATTERNS.items():
            matches = re.findall(pattern, text)
            for match in matches:
                entities.append({
                    'type': entity_type,
                    'value': match,
                    'confidence': 0.8
                })

        return entities


class IntentExtractor:
    """Extract user intent signals"""

    INTENT_PATTERNS = {
        'request': [
            r'\b(can you|could you|would you|please)\b',
            r'\b(I need|I want|I\'d like)\b',
            r'\b(help me|show me|tell me|give me)\b',
        ],
        'question': [
            r'\?$',
            r'\b(what|why|how|when|where|who|which)\b.*\?',
            r'\b(is it|are there|do you|can I)\b',
        ],
        'statement': [
            r'^[A-Z][^?]*\.$',
            r'\b(I think|I believe|I feel|In my opinion)\b',
        ],
        'command': [
            r'^(Do|Make|Build|Create|Fix|Run|Stop|Start)\b',
            r'\b(immediately|now|asap)\b',
        ],
        'feedback': [
            r'\b(good|great|bad|terrible|love|hate)\b',
            r'\b(works|doesn\'t work|broken|perfect)\b',
        ],
        'exploration': [
            r'\b(maybe|perhaps|possibly|what if|wonder)\b',
            r'\b(explore|consider|think about|look into)\b',
        ],
    }

    @classmethod
    def extract(cls, text: str) -> List[str]:
        """Extract intent signals"""
        intents = []

        for intent_type, patterns in cls.INTENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    intents.append(intent_type)
                    break

        return list(set(intents)) if intents else ['statement']


class EmotionalMarkerExtractor:
    """Extract emotional markers from text"""

    EMOTION_PATTERNS = {
        'joy': [r'\b(happy|excited|thrilled|delighted|glad)\b', r'[😊😀🎉]'],
        'frustration': [r'\b(frustrated|annoyed|irritated|angry)\b', r'[😤😠]'],
        'confusion': [r'\b(confused|unclear|lost|puzzled)\b', r'[🤔😕]'],
        'confidence': [r'\b(sure|certain|confident|definitely)\b', r'[💪👍]'],
        'uncertainty': [r'\b(maybe|perhaps|possibly|not sure)\b', r'[🤷]'],
        'urgency': [r'\b(urgent|asap|immediately|critical)\b', r'[🚨⚠️]'],
        'gratitude': [r'\b(thanks|thank you|appreciate|grateful)\b', r'[🙏❤️]'],
        'curiosity': [r'\b(wonder|curious|interested|intrigued)\b', r'[🧐]'],
    }

    @classmethod
    def extract(cls, text: str) -> Dict[str, float]:
        """Extract emotional markers with intensity"""
        markers = {}

        for emotion, patterns in cls.EMOTION_PATTERNS.items():
            count = sum(
                len(re.findall(p, text, re.IGNORECASE))
                for p in patterns
            )
            if count > 0:
                markers[emotion] = min(1.0, count * 0.3)

        return markers


# ═══════════════════════════════════════════════════════════════════════════════
# CAPTURE ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class CaptureEngine:
    """
    Main signal capture engine.
    Extracts structured signals from raw user interactions.
    """

    def __init__(self, persist_engine=None):
        self.persist = persist_engine
        self.tone_detector = ToneDetector()
        self.energy_detector = EnergyDetector()
        self.friction_detector = FrictionDetector()
        self.topic_extractor = TopicExtractor()
        self.entity_extractor = EntityExtractor()
        self.intent_extractor = IntentExtractor()
        self.emotion_extractor = EmotionalMarkerExtractor()

        # Session state
        self.current_session: Optional[SessionSummary] = None
        self.message_buffer: List[RawSignal] = []

    def capture_message(self, user_id: str, message: str, context: Dict = None) -> RawSignal:
        """
        Extract signals from a single message.

        Args:
            user_id: User identifier
            message: Raw message text
            context: Optional context (avatar, session, etc.)

        Returns:
            RawSignal with extracted features
        """
        context = context or {}

        # Extract all signals
        tone, tone_confidence = self.tone_detector.detect(message)
        energy = self.energy_detector.detect(message)
        friction = self.friction_detector.detect(message)
        topics = self.topic_extractor.extract(message)
        entities = self.entity_extractor.extract(message)
        intents = self.intent_extractor.extract(message)
        emotions = self.emotion_extractor.extract(message)

        # Build signal
        signal = RawSignal(
            source_message=message,
            energy_level=energy,
            friction_level=friction,
            tone_detected=tone,
            topics_mentioned=topics,
            entities_detected=entities,
            intent_signals=intents,
            emotional_markers=emotions,
            timestamp=datetime.utcnow()
        )

        # Buffer for session
        self.message_buffer.append(signal)

        # Persist if engine available
        if self.persist:
            self.persist.store_signal(user_id, signal)

        return signal

    def capture_session(self, user_id: str, avatar_id: str = None) -> SessionSummary:
        """
        Summarize and capture the current session.

        Args:
            user_id: User identifier
            avatar_id: Optional avatar identifier

        Returns:
            SessionSummary of the interaction
        """
        if not self.message_buffer:
            return SessionSummary(user_id=user_id, avatar_id=avatar_id)

        # Aggregate signals
        all_topics = []
        all_patterns = []
        total_energy = 0
        mode_counts = {}

        for signal in self.message_buffer:
            all_topics.extend(signal.topics_mentioned)
            total_energy += signal.energy_level

            # Determine mode from signal
            mode = self._signal_to_mode(signal)
            mode_counts[mode] = mode_counts.get(mode, 0) + 1

        # Find dominant mode
        dominant_mode = max(mode_counts, key=mode_counts.get) if mode_counts else ResonanceMode.NEUTRAL

        summary = SessionSummary(
            user_id=user_id,
            avatar_id=avatar_id,
            start_time=self.message_buffer[0].timestamp,
            end_time=datetime.utcnow(),
            message_count=len(self.message_buffer),
            topics_covered=list(set(all_topics)),
            patterns_detected=all_patterns,
            average_energy=total_energy / len(self.message_buffer),
            dominant_mode=dominant_mode,
            key_insights=self._extract_insights(self.message_buffer)
        )

        # Clear buffer
        self.message_buffer = []

        # Persist if engine available
        if self.persist:
            self.persist.store_session(user_id, summary)

        return summary

    def capture_pattern(self, user_id: str, signals: List[RawSignal]) -> Optional[Pattern]:
        """
        Detect emerging patterns from signal history.

        Args:
            user_id: User identifier
            signals: List of signals to analyze

        Returns:
            Pattern if detected, None otherwise
        """
        if len(signals) < 3:
            return None

        # Analyze tone consistency
        tones = [s.tone_detected for s in signals]
        if len(set(tones)) == 1:
            # Consistent tone pattern
            return Pattern(
                pattern_type=PatternType.LINGUISTIC,
                description=f"Consistent {tones[0].value} tone in communication",
                trigger_conditions=["any_interaction"],
                response_tendency=f"Prefers {tones[0].value} responses",
                frequency=len(signals),
                strength=0.7,
                metadata=Metadata(confidence=0.7, source="capture")
            )

        # Analyze energy patterns
        energies = [s.energy_level for s in signals]
        avg_energy = sum(energies) / len(energies)
        if all(e > 0.7 for e in energies):
            return Pattern(
                pattern_type=PatternType.BEHAVIORAL,
                description="Consistently high energy interaction style",
                trigger_conditions=["engagement"],
                response_tendency="Match high energy",
                frequency=len(signals),
                strength=0.8,
                metadata=Metadata(confidence=0.75, source="capture")
            )

        # Analyze topic patterns
        all_topics = []
        for s in signals:
            all_topics.extend(s.topics_mentioned)

        if all_topics:
            from collections import Counter
            topic_counts = Counter(all_topics)
            most_common = topic_counts.most_common(1)
            if most_common and most_common[0][1] >= 3:
                return Pattern(
                    pattern_type=PatternType.TOPICAL,
                    description=f"Recurring focus on: {most_common[0][0]}",
                    trigger_conditions=[f"topic:{most_common[0][0]}"],
                    response_tendency="Deep interest in this topic",
                    frequency=most_common[0][1],
                    strength=0.6,
                    metadata=Metadata(confidence=0.65, source="capture")
                )

        return None

    def extract_knowledge(self, signal: RawSignal, context: Dict = None) -> List[KnowledgeEntry]:
        """
        Extract potential knowledge entries from a signal.

        Args:
            signal: RawSignal to analyze
            context: Additional context

        Returns:
            List of potential KnowledgeEntry objects
        """
        entries = []

        # Extract from entities
        for entity in signal.entities_detected:
            if entity['type'] in ['person', 'email', 'file']:
                entries.append(KnowledgeEntry(
                    topic=entity['type'],
                    value=entity['value'],
                    context=signal.source_message[:100],
                    metadata=Metadata(
                        confidence=entity.get('confidence', 0.7),
                        source="capture"
                    )
                ))

        # Extract from explicit statements
        statement_patterns = [
            (r"I (?:am|'m) (?:a |an )?(\w+(?:\s+\w+)?)", "identity"),
            (r"I work (?:at|for|in) (\w+(?:\s+\w+)?)", "work"),
            (r"I live (?:in|at) (\w+(?:\s+\w+)?)", "location"),
            (r"My (\w+) is (\w+(?:\s+\w+)?)", "attribute"),
            (r"I (?:like|love|enjoy|prefer) (\w+(?:\s+\w+)?)", "preference"),
            (r"I (?:hate|dislike|avoid) (\w+(?:\s+\w+)?)", "aversion"),
        ]

        for pattern, topic in statement_patterns:
            matches = re.findall(pattern, signal.source_message, re.IGNORECASE)
            for match in matches:
                value = match if isinstance(match, str) else ' '.join(match)
                entries.append(KnowledgeEntry(
                    topic=topic,
                    value=value,
                    context=signal.source_message[:100],
                    metadata=Metadata(
                        confidence=0.8,  # Direct statement = high confidence
                        source="user_stated"
                    )
                ))

        return entries

    def extract_lexicon(self, signal: RawSignal) -> List[LexiconEntry]:
        """
        Extract potential lexicon entries (user-specific terms).

        Args:
            signal: RawSignal to analyze

        Returns:
            List of potential LexiconEntry objects
        """
        entries = []

        # Look for quoted terms
        quoted = re.findall(r'"([^"]+)"', signal.source_message)
        quoted.extend(re.findall(r"'([^']+)'", signal.source_message))

        for term in quoted:
            if len(term.split()) <= 3:  # Max 3 words
                entries.append(LexiconEntry(
                    term=term,
                    usage_examples=[signal.source_message[:200]],
                    context_tags=signal.topics_mentioned[:3]
                ))

        # Look for defined terms ("X means Y", "by X I mean Y")
        definition_patterns = [
            r'(?:"?(\w+(?:\s+\w+)?)"?\s+means?\s+(.+?))[.!?]',
            r'by\s+"?(\w+(?:\s+\w+)?)"?\s+I mean\s+(.+?)[.!?]',
        ]

        for pattern in definition_patterns:
            matches = re.findall(pattern, signal.source_message, re.IGNORECASE)
            for term, definition in matches:
                entries.append(LexiconEntry(
                    term=term.strip(),
                    definition=definition.strip(),
                    usage_examples=[signal.source_message[:200]]
                ))

        return entries

    def _signal_to_mode(self, signal: RawSignal) -> ResonanceMode:
        """Convert signal features to resonance mode"""
        if signal.friction_level > 0.6:
            return ResonanceMode.FRICTION
        if signal.energy_level > 0.7 and signal.friction_level < 0.3:
            return ResonanceMode.FLOW
        if 'exploration' in signal.intent_signals or 'curiosity' in signal.emotional_markers:
            return ResonanceMode.CURIOUS
        if 'request' in signal.intent_signals and signal.energy_level < 0.4:
            return ResonanceMode.CLOSURE
        return ResonanceMode.NEUTRAL

    def _extract_insights(self, signals: List[RawSignal]) -> List[str]:
        """Extract key insights from signal buffer"""
        insights = []

        # Identify high-friction moments
        high_friction = [s for s in signals if s.friction_level > 0.6]
        if high_friction:
            insights.append(f"Encountered {len(high_friction)} friction point(s)")

        # Identify topic shifts
        topics_sequence = [set(s.topics_mentioned) for s in signals if s.topics_mentioned]
        if len(topics_sequence) > 1:
            shifts = sum(1 for i in range(1, len(topics_sequence))
                        if topics_sequence[i] != topics_sequence[i-1])
            if shifts > 2:
                insights.append(f"Session had {shifts} topic shifts")

        # Identify emotional trajectory
        emotions_start = signals[0].emotional_markers if signals else {}
        emotions_end = signals[-1].emotional_markers if signals else {}

        if 'frustration' in emotions_start and 'joy' in emotions_end:
            insights.append("Emotional trajectory: frustration → satisfaction")
        elif 'confusion' in emotions_start and 'confidence' in emotions_end:
            insights.append("Emotional trajectory: confusion → clarity")

        return insights


# ═══════════════════════════════════════════════════════════════════════════════
# BATCH CAPTURE
# ═══════════════════════════════════════════════════════════════════════════════

class BatchCaptureProcessor:
    """Process multiple messages in batch for efficiency"""

    def __init__(self, capture_engine: CaptureEngine):
        self.engine = capture_engine

    def process_batch(self, user_id: str, messages: List[str]) -> List[RawSignal]:
        """Process a batch of messages"""
        return [self.engine.capture_message(user_id, msg) for msg in messages]

    def analyze_conversation(self, user_id: str, messages: List[str]) -> Dict:
        """
        Analyze a full conversation for patterns and insights.

        Returns comprehensive analysis including:
        - Signals for each message
        - Detected patterns
        - Knowledge extractions
        - Lexicon entries
        - Session summary
        """
        signals = self.process_batch(user_id, messages)

        # Aggregate extractions
        all_knowledge = []
        all_lexicon = []

        for signal in signals:
            all_knowledge.extend(self.engine.extract_knowledge(signal))
            all_lexicon.extend(self.engine.extract_lexicon(signal))

        # Detect patterns
        pattern = self.engine.capture_pattern(user_id, signals)

        # Build summary
        summary = self.engine.capture_session(user_id)

        return {
            'signals': signals,
            'knowledge': all_knowledge,
            'lexicon': all_lexicon,
            'pattern': pattern,
            'summary': summary
        }

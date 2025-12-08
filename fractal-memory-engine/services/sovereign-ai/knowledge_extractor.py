"""
===============================================================================
KNOWLEDGE EXTRACTOR - "THE MEMORY HARVESTER"

Extracts knowledge from the Fractal Memory Engine for sovereign AI training.
Converts memories, agent interactions, and patterns into training data.

Sources:
- Memory Crystals (long-term memories)
- Agent Memory (interactions & learning)
- Ritual Logs (scheduled behaviors)
- Intent Patterns (user intents & resolutions)
- Voice Transcripts (conversations)

THE BRIDGE BETWEEN MEMORY AND LEARNING.
===============================================================================
"""

import asyncio
import json
import logging
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Any, Generator
import hashlib
import glob

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===============================================================================
# CONFIGURATION
# ===============================================================================

class KnowledgeSource(str, Enum):
    MEMORY_CRYSTAL = "memory_crystal"     # Long-term persistent memories
    AGENT_MEMORY = "agent_memory"         # Agent interactions & learnings
    RITUAL_LOG = "ritual_log"             # Ritual executions & outcomes
    INTENT_PATTERN = "intent_pattern"     # User intent resolutions
    VOICE_TRANSCRIPT = "voice_transcript" # Voice conversation logs
    CONVERSATION = "conversation"         # General conversation history
    SYSTEM_LOG = "system_log"            # System events & responses


class QualityTier(str, Enum):
    GOLD = "gold"       # Verified, high-quality interactions
    SILVER = "silver"   # Good quality, needs review
    BRONZE = "bronze"   # Usable but lower quality


@dataclass
class ExtractedKnowledge:
    """A single piece of extracted knowledge"""
    id: str
    source: KnowledgeSource
    quality: QualityTier
    timestamp: datetime

    # Core content
    instruction: str
    input_text: str
    output_text: str

    # Metadata
    avatar: Optional[str] = None
    user_id: Optional[str] = None
    context_tags: List[str] = field(default_factory=list)
    confidence_score: float = 0.0

    # Lineage
    original_file: Optional[str] = None
    extraction_method: str = ""


@dataclass
class ExtractionConfig:
    """Configuration for knowledge extraction"""
    memory_path: str = "../memory"
    agent_memory_path: str = "../../system/agents"
    conversation_path: str = "./knowledge_store/conversations"
    output_path: str = "./knowledge_store/extracted"

    min_quality_score: float = 0.5
    max_age_days: int = 365
    include_system_prompts: bool = True
    deduplicate: bool = True
    enrich_metadata: bool = True


# ===============================================================================
# KNOWLEDGE EXTRACTOR
# ===============================================================================

class KnowledgeExtractor:
    """
    Extracts and transforms knowledge from the Fractal Memory Engine
    into training-ready formats.
    """

    def __init__(self, config: Optional[ExtractionConfig] = None):
        self.config = config or ExtractionConfig()
        self.extracted: List[ExtractedKnowledge] = []
        self.seen_hashes: set = set()

        # Ensure output directories exist
        os.makedirs(self.config.output_path, exist_ok=True)
        os.makedirs(f"{self.config.output_path}/by_source", exist_ok=True)
        os.makedirs(f"{self.config.output_path}/by_quality", exist_ok=True)
        os.makedirs(f"{self.config.output_path}/by_avatar", exist_ok=True)

    def _generate_id(self, content: str) -> str:
        """Generate unique ID for knowledge entry"""
        return hashlib.md5(content.encode()).hexdigest()[:16]

    def _compute_hash(self, instruction: str, input_text: str, output_text: str) -> str:
        """Compute deduplication hash"""
        combined = f"{instruction}|{input_text}|{output_text}"
        return hashlib.sha256(combined.encode()).hexdigest()

    def _is_duplicate(self, instruction: str, input_text: str, output_text: str) -> bool:
        """Check if knowledge entry is a duplicate"""
        if not self.config.deduplicate:
            return False
        hash_val = self._compute_hash(instruction, input_text, output_text)
        if hash_val in self.seen_hashes:
            return True
        self.seen_hashes.add(hash_val)
        return False

    def _assess_quality(self, knowledge: ExtractedKnowledge) -> QualityTier:
        """Assess quality tier of extracted knowledge"""
        score = 0.0

        # Length checks
        if len(knowledge.output_text) > 100:
            score += 0.2
        if len(knowledge.output_text) > 500:
            score += 0.1
        if len(knowledge.input_text) > 20:
            score += 0.1

        # Structural checks
        if knowledge.instruction and knowledge.instruction != "You are a helpful AI assistant.":
            score += 0.15

        # Has context/metadata
        if knowledge.avatar:
            score += 0.1
        if knowledge.context_tags:
            score += 0.1
        if knowledge.user_id:
            score += 0.05

        # Not too short
        if len(knowledge.output_text) < 20:
            score -= 0.3

        # Not just acknowledgment
        low_quality_patterns = [
            r"^(ok|okay|sure|yes|no|got it|understood)\.?$",
            r"^I (understand|see|got it)\.?$",
        ]
        for pattern in low_quality_patterns:
            if re.match(pattern, knowledge.output_text.lower().strip()):
                score -= 0.4

        knowledge.confidence_score = max(0.0, min(1.0, score))

        if score >= 0.6:
            return QualityTier.GOLD
        elif score >= 0.4:
            return QualityTier.SILVER
        return QualityTier.BRONZE

    # ─────────────────────────────────────────────────────────────────────────
    # Source Extractors
    # ─────────────────────────────────────────────────────────────────────────

    async def extract_from_conversations(self) -> List[ExtractedKnowledge]:
        """Extract from stored conversation logs"""
        extracted = []
        conv_path = Path(self.config.conversation_path)

        if not conv_path.exists():
            logger.warning(f"Conversation path not found: {conv_path}")
            return extracted

        for json_file in conv_path.glob("*.json"):
            try:
                with open(json_file, 'r') as f:
                    data = json.load(f)

                # Extract conversation structure
                messages = data.get("messages", [])
                response = data.get("response", "")

                if not messages or not response:
                    continue

                # Build instruction/input/output
                instruction = ""
                input_text = ""

                for msg in messages:
                    role = msg.get("role", "")
                    content = msg.get("content", "")

                    if role == "system":
                        instruction = content
                    elif role == "user":
                        input_text = content

                if not input_text or not response:
                    continue

                if self._is_duplicate(instruction, input_text, response):
                    continue

                knowledge = ExtractedKnowledge(
                    id=self._generate_id(f"{input_text}{response}"),
                    source=KnowledgeSource.CONVERSATION,
                    quality=QualityTier.SILVER,  # Will be reassessed
                    timestamp=datetime.fromisoformat(data.get("timestamp", datetime.now().isoformat())),
                    instruction=instruction or "You are a helpful AI assistant.",
                    input_text=input_text,
                    output_text=response,
                    avatar=data.get("avatar"),
                    user_id=data.get("user_id"),
                    context_tags=data.get("metadata", {}).get("tags", []),
                    original_file=str(json_file),
                    extraction_method="conversation_log"
                )

                knowledge.quality = self._assess_quality(knowledge)

                if knowledge.confidence_score >= self.config.min_quality_score:
                    extracted.append(knowledge)

            except Exception as e:
                logger.warning(f"Error extracting from {json_file}: {e}")

        logger.info(f"Extracted {len(extracted)} entries from conversations")
        return extracted

    async def extract_from_agent_memory(self) -> List[ExtractedKnowledge]:
        """Extract from agent memory systems"""
        extracted = []
        agent_path = Path(self.config.agent_memory_path)

        if not agent_path.exists():
            logger.warning(f"Agent memory path not found: {agent_path}")
            return extracted

        # Look for agent memory files
        memory_patterns = [
            "**/*Memory*.js",
            "**/*memory*.json",
            "**/agent_state*.json",
            "**/learning_*.json"
        ]

        for pattern in memory_patterns:
            for mem_file in agent_path.glob(pattern):
                try:
                    # Skip non-data files
                    if mem_file.suffix == '.js':
                        # Parse JS for embedded learning data
                        content = mem_file.read_text()
                        # Extract patterns from comments and data structures
                        await self._extract_from_js_memory(content, mem_file, extracted)
                    elif mem_file.suffix == '.json':
                        with open(mem_file, 'r') as f:
                            data = json.load(f)
                        await self._extract_from_json_memory(data, mem_file, extracted)

                except Exception as e:
                    logger.warning(f"Error extracting from {mem_file}: {e}")

        logger.info(f"Extracted {len(extracted)} entries from agent memory")
        return extracted

    async def _extract_from_js_memory(
        self,
        content: str,
        source_file: Path,
        extracted: List[ExtractedKnowledge]
    ):
        """Extract learning patterns from JS memory files"""
        # Extract patterns from class documentation and examples

        # Find pattern definitions
        pattern_regex = r'/\*\*\s*\n\s*\*\s*Pattern:\s*(.+?)\n\s*\*\s*Input:\s*(.+?)\n\s*\*\s*Output:\s*(.+?)\n'
        for match in re.finditer(pattern_regex, content, re.MULTILINE):
            pattern_name, input_ex, output_ex = match.groups()

            if self._is_duplicate("Learn this pattern:", input_ex, output_ex):
                continue

            knowledge = ExtractedKnowledge(
                id=self._generate_id(f"pattern_{pattern_name}"),
                source=KnowledgeSource.AGENT_MEMORY,
                quality=QualityTier.GOLD,  # Patterns are high quality
                timestamp=datetime.now(),
                instruction=f"Learn this pattern: {pattern_name}",
                input_text=input_ex.strip(),
                output_text=output_ex.strip(),
                context_tags=["agent_pattern", pattern_name.lower()],
                original_file=str(source_file),
                extraction_method="js_pattern_extraction"
            )

            if knowledge.confidence_score >= self.config.min_quality_score:
                extracted.append(knowledge)

    async def _extract_from_json_memory(
        self,
        data: Dict,
        source_file: Path,
        extracted: List[ExtractedKnowledge]
    ):
        """Extract knowledge from JSON memory structures"""

        # Handle different memory formats
        if "interactions" in data:
            for interaction in data["interactions"]:
                await self._process_interaction(interaction, source_file, extracted)

        if "learnings" in data:
            for learning in data["learnings"]:
                await self._process_learning(learning, source_file, extracted)

        if "decisions" in data:
            for decision in data["decisions"]:
                await self._process_decision(decision, source_file, extracted)

    async def _process_interaction(
        self,
        interaction: Dict,
        source_file: Path,
        extracted: List[ExtractedKnowledge]
    ):
        """Process a single interaction record"""
        input_text = interaction.get("input", interaction.get("query", ""))
        output_text = interaction.get("output", interaction.get("response", ""))

        if not input_text or not output_text:
            return

        if self._is_duplicate("", input_text, output_text):
            return

        knowledge = ExtractedKnowledge(
            id=self._generate_id(f"int_{input_text[:50]}"),
            source=KnowledgeSource.AGENT_MEMORY,
            quality=QualityTier.SILVER,
            timestamp=datetime.fromisoformat(
                interaction.get("timestamp", datetime.now().isoformat())
            ),
            instruction=interaction.get("context", ""),
            input_text=input_text,
            output_text=output_text,
            avatar=interaction.get("agent"),
            context_tags=interaction.get("tags", []),
            original_file=str(source_file),
            extraction_method="interaction_extraction"
        )

        knowledge.quality = self._assess_quality(knowledge)
        if knowledge.confidence_score >= self.config.min_quality_score:
            extracted.append(knowledge)

    async def _process_learning(
        self,
        learning: Dict,
        source_file: Path,
        extracted: List[ExtractedKnowledge]
    ):
        """Process a learning record"""
        concept = learning.get("concept", "")
        explanation = learning.get("explanation", learning.get("definition", ""))

        if not concept or not explanation:
            return

        if self._is_duplicate("Define this concept:", concept, explanation):
            return

        knowledge = ExtractedKnowledge(
            id=self._generate_id(f"learn_{concept}"),
            source=KnowledgeSource.AGENT_MEMORY,
            quality=QualityTier.GOLD,
            timestamp=datetime.now(),
            instruction="Define this concept:",
            input_text=concept,
            output_text=explanation,
            context_tags=["learning", "concept"],
            original_file=str(source_file),
            extraction_method="learning_extraction"
        )

        knowledge.quality = self._assess_quality(knowledge)
        if knowledge.confidence_score >= self.config.min_quality_score:
            extracted.append(knowledge)

    async def _process_decision(
        self,
        decision: Dict,
        source_file: Path,
        extracted: List[ExtractedKnowledge]
    ):
        """Process a decision record"""
        context = decision.get("context", "")
        choice = decision.get("choice", decision.get("decision", ""))
        reasoning = decision.get("reasoning", "")

        if not context or not choice:
            return

        output = choice
        if reasoning:
            output = f"{choice}\n\nReasoning: {reasoning}"

        if self._is_duplicate("Make a decision:", context, output):
            return

        knowledge = ExtractedKnowledge(
            id=self._generate_id(f"dec_{context[:50]}"),
            source=KnowledgeSource.AGENT_MEMORY,
            quality=QualityTier.GOLD,
            timestamp=datetime.now(),
            instruction="Make a decision based on this context:",
            input_text=context,
            output_text=output,
            context_tags=["decision", "reasoning"],
            original_file=str(source_file),
            extraction_method="decision_extraction"
        )

        knowledge.quality = self._assess_quality(knowledge)
        if knowledge.confidence_score >= self.config.min_quality_score:
            extracted.append(knowledge)

    async def extract_from_ritual_logs(self) -> List[ExtractedKnowledge]:
        """Extract from ritual execution logs"""
        extracted = []

        # Look for ritual logs
        ritual_paths = [
            Path("../ritual-engine/logs"),
            Path("./knowledge_store/rituals"),
            Path("../../core/ritual_logs")
        ]

        for ritual_path in ritual_paths:
            if not ritual_path.exists():
                continue

            for log_file in ritual_path.glob("*.json"):
                try:
                    with open(log_file, 'r') as f:
                        data = json.load(f)

                    ritual_name = data.get("ritual_name", "")
                    trigger = data.get("trigger", {})
                    outcome = data.get("outcome", {})

                    if not ritual_name or not outcome:
                        continue

                    input_text = f"Execute ritual: {ritual_name}"
                    if trigger:
                        input_text += f"\nTrigger: {json.dumps(trigger)}"

                    output_text = f"Ritual completed: {json.dumps(outcome)}"

                    if self._is_duplicate("Execute a scheduled ritual:", input_text, output_text):
                        continue

                    knowledge = ExtractedKnowledge(
                        id=self._generate_id(f"ritual_{ritual_name}"),
                        source=KnowledgeSource.RITUAL_LOG,
                        quality=QualityTier.SILVER,
                        timestamp=datetime.fromisoformat(
                            data.get("executed_at", datetime.now().isoformat())
                        ),
                        instruction="Execute a scheduled ritual:",
                        input_text=input_text,
                        output_text=output_text,
                        context_tags=["ritual", ritual_name],
                        original_file=str(log_file),
                        extraction_method="ritual_log_extraction"
                    )

                    knowledge.quality = self._assess_quality(knowledge)
                    if knowledge.confidence_score >= self.config.min_quality_score:
                        extracted.append(knowledge)

                except Exception as e:
                    logger.warning(f"Error extracting from {log_file}: {e}")

        logger.info(f"Extracted {len(extracted)} entries from ritual logs")
        return extracted

    async def extract_from_intent_patterns(self) -> List[ExtractedKnowledge]:
        """Extract from intent recognition patterns"""
        extracted = []

        intent_paths = [
            Path("../../connectors/intent-grid/patterns"),
            Path("./knowledge_store/intents"),
        ]

        for intent_path in intent_paths:
            if not intent_path.exists():
                continue

            for pattern_file in intent_path.glob("*.json"):
                try:
                    with open(pattern_file, 'r') as f:
                        data = json.load(f)

                    patterns = data.get("patterns", [data])

                    for pattern in patterns:
                        intent = pattern.get("intent", "")
                        examples = pattern.get("examples", [])
                        resolution = pattern.get("resolution", pattern.get("action", ""))

                        for example in examples:
                            if self._is_duplicate(
                                f"Recognize intent: {intent}",
                                example,
                                resolution
                            ):
                                continue

                            knowledge = ExtractedKnowledge(
                                id=self._generate_id(f"intent_{example[:30]}"),
                                source=KnowledgeSource.INTENT_PATTERN,
                                quality=QualityTier.GOLD,
                                timestamp=datetime.now(),
                                instruction=f"Recognize this user intent: {intent}",
                                input_text=example,
                                output_text=resolution,
                                context_tags=["intent", intent],
                                original_file=str(pattern_file),
                                extraction_method="intent_pattern_extraction"
                            )

                            knowledge.quality = self._assess_quality(knowledge)
                            if knowledge.confidence_score >= self.config.min_quality_score:
                                extracted.append(knowledge)

                except Exception as e:
                    logger.warning(f"Error extracting from {pattern_file}: {e}")

        logger.info(f"Extracted {len(extracted)} entries from intent patterns")
        return extracted

    # ─────────────────────────────────────────────────────────────────────────
    # Main Extraction Pipeline
    # ─────────────────────────────────────────────────────────────────────────

    async def extract_all(self) -> List[ExtractedKnowledge]:
        """Run full extraction pipeline"""
        logger.info("=" * 60)
        logger.info("KNOWLEDGE EXTRACTOR - Starting extraction pipeline")
        logger.info("=" * 60)

        all_extracted = []

        # Run all extractors
        extractors = [
            ("Conversations", self.extract_from_conversations),
            ("Agent Memory", self.extract_from_agent_memory),
            ("Ritual Logs", self.extract_from_ritual_logs),
            ("Intent Patterns", self.extract_from_intent_patterns),
        ]

        for name, extractor in extractors:
            logger.info(f"Extracting from {name}...")
            try:
                entries = await extractor()
                all_extracted.extend(entries)
                logger.info(f"  -> {len(entries)} entries")
            except Exception as e:
                logger.error(f"Error in {name} extractor: {e}")

        self.extracted = all_extracted

        logger.info("-" * 60)
        logger.info(f"Total extracted: {len(all_extracted)} knowledge entries")

        # Generate stats
        by_source = {}
        by_quality = {}
        by_avatar = {}

        for entry in all_extracted:
            by_source[entry.source.value] = by_source.get(entry.source.value, 0) + 1
            by_quality[entry.quality.value] = by_quality.get(entry.quality.value, 0) + 1
            avatar = entry.avatar or "unknown"
            by_avatar[avatar] = by_avatar.get(avatar, 0) + 1

        logger.info(f"By source: {by_source}")
        logger.info(f"By quality: {by_quality}")
        logger.info(f"By avatar: {by_avatar}")

        return all_extracted

    def save_extracted(self, format: str = "all") -> Dict[str, str]:
        """Save extracted knowledge to files"""
        output_files = {}
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if format in ["all", "alpaca"]:
            alpaca_data = self._to_alpaca_format()
            path = f"{self.config.output_path}/alpaca_{timestamp}.json"
            with open(path, 'w') as f:
                json.dump(alpaca_data, f, indent=2)
            output_files["alpaca"] = path

        if format in ["all", "chatml"]:
            chatml_data = self._to_chatml_format()
            path = f"{self.config.output_path}/chatml_{timestamp}.json"
            with open(path, 'w') as f:
                json.dump(chatml_data, f, indent=2)
            output_files["chatml"] = path

        if format in ["all", "sharegpt"]:
            sharegpt_data = self._to_sharegpt_format()
            path = f"{self.config.output_path}/sharegpt_{timestamp}.json"
            with open(path, 'w') as f:
                json.dump(sharegpt_data, f, indent=2)
            output_files["sharegpt"] = path

        # Save by quality tier
        for quality in QualityTier:
            tier_data = [
                self._entry_to_alpaca(e)
                for e in self.extracted
                if e.quality == quality
            ]
            if tier_data:
                path = f"{self.config.output_path}/by_quality/{quality.value}_{timestamp}.json"
                with open(path, 'w') as f:
                    json.dump(tier_data, f, indent=2)
                output_files[f"quality_{quality.value}"] = path

        logger.info(f"Saved {len(output_files)} output files")
        return output_files

    def _entry_to_alpaca(self, entry: ExtractedKnowledge) -> Dict:
        """Convert entry to Alpaca format"""
        return {
            "instruction": entry.instruction,
            "input": entry.input_text,
            "output": entry.output_text,
            "metadata": {
                "source": entry.source.value,
                "quality": entry.quality.value,
                "avatar": entry.avatar,
                "tags": entry.context_tags,
                "confidence": entry.confidence_score
            }
        }

    def _to_alpaca_format(self) -> List[Dict]:
        """Convert all entries to Alpaca format"""
        return [self._entry_to_alpaca(e) for e in self.extracted]

    def _to_chatml_format(self) -> List[Dict]:
        """Convert all entries to ChatML format"""
        chatml_data = []

        for entry in self.extracted:
            conversation = []

            if entry.instruction:
                conversation.append({
                    "role": "system",
                    "content": entry.instruction
                })

            conversation.append({
                "role": "user",
                "content": entry.input_text
            })

            conversation.append({
                "role": "assistant",
                "content": entry.output_text
            })

            chatml_data.append({
                "conversations": conversation,
                "metadata": {
                    "source": entry.source.value,
                    "quality": entry.quality.value
                }
            })

        return chatml_data

    def _to_sharegpt_format(self) -> List[Dict]:
        """Convert all entries to ShareGPT format"""
        sharegpt_data = []

        for entry in self.extracted:
            conversations = []

            if entry.instruction:
                conversations.append({
                    "from": "system",
                    "value": entry.instruction
                })

            conversations.append({
                "from": "human",
                "value": entry.input_text
            })

            conversations.append({
                "from": "gpt",
                "value": entry.output_text
            })

            sharegpt_data.append({
                "conversations": conversations,
                "id": entry.id
            })

        return sharegpt_data

    def get_stats(self) -> Dict[str, Any]:
        """Get extraction statistics"""
        if not self.extracted:
            return {"total": 0, "message": "No extractions yet"}

        by_source = {}
        by_quality = {}
        avg_confidence = 0.0

        for entry in self.extracted:
            by_source[entry.source.value] = by_source.get(entry.source.value, 0) + 1
            by_quality[entry.quality.value] = by_quality.get(entry.quality.value, 0) + 1
            avg_confidence += entry.confidence_score

        avg_confidence /= len(self.extracted)

        return {
            "total": len(self.extracted),
            "by_source": by_source,
            "by_quality": by_quality,
            "avg_confidence": round(avg_confidence, 3),
            "unique_avatars": len(set(e.avatar for e in self.extracted if e.avatar)),
            "unique_tags": len(set(tag for e in self.extracted for tag in e.context_tags))
        }


# ===============================================================================
# CLI Interface
# ===============================================================================

async def main():
    """CLI entrypoint for knowledge extraction"""
    import argparse

    parser = argparse.ArgumentParser(description="Extract knowledge from Fractal Memory Engine")
    parser.add_argument("--output", "-o", default="./knowledge_store/extracted", help="Output directory")
    parser.add_argument("--format", "-f", choices=["alpaca", "chatml", "sharegpt", "all"], default="all")
    parser.add_argument("--min-quality", type=float, default=0.5, help="Minimum quality score (0-1)")
    parser.add_argument("--source", help="Extract from specific source only")

    args = parser.parse_args()

    config = ExtractionConfig(
        output_path=args.output,
        min_quality_score=args.min_quality
    )

    extractor = KnowledgeExtractor(config)

    await extractor.extract_all()
    output_files = extractor.save_extracted(format=args.format)

    print("\n" + "=" * 60)
    print("EXTRACTION COMPLETE")
    print("=" * 60)
    print(f"Total entries: {len(extractor.extracted)}")
    print(f"Output files: {list(output_files.keys())}")
    print(f"Stats: {extractor.get_stats()}")


if __name__ == "__main__":
    asyncio.run(main())

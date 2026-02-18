"""
LLM Client - Multi-provider adapter with fusion support
Supports OpenAI, Anthropic, and local models
"""
import os
import json
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"


@dataclass
class LLMResponse:
    provider: str
    model: str
    content: str
    confidence: float
    tokens_used: int
    latency_ms: float
    raw_response: Optional[Dict] = None


# Prompt templates
PROMPTS = {
    "process_signals": """You are the Fractal Memory Processor.
Input: a JSON array 'signals' each with text, energy, friction, tone, extras.
Output: a JSON array of objects with format:
{{"location": "dot.path", "value": "extracted_value", "confidence": 0.0-1.0}}

Focus on stable user traits:
- operating_style.* (pace, tone, communication_style)
- lexicon.* (frequently used words, phrases)
- goals.* (stated objectives, priorities)
- preferences.* (likes, dislikes, habits)

Only output valid JSON array. No explanations.""",

    "calibration": """You are the silent calibrator.
Input: an insight item to verify.
Output: JSON with format:
{{"value": "confirmed_or_corrected_value", "confidence": 0.0-1.0, "reasoning": "brief note"}}

Be conservative. Only increase confidence if the insight is clearly valid.
Only output valid JSON. No explanations.""",

    "contradiction_resolver": """You are the contradiction resolver.
Input: Two conflicting insights about the same location.
Output: JSON with format:
{{"resolved_value": "the correct value", "confidence": 0.0-1.0, "reasoning": "why this value wins"}}

Consider recency, source reliability, and logical consistency.
Only output valid JSON. No explanations.""",
}


class LLMClient:
    """Multi-provider LLM client with fallback and fusion support"""

    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        self._openai_client = None
        self._anthropic_client = None

    def _get_openai_client(self):
        if self._openai_client is None and self.openai_key:
            try:
                import openai
                openai.api_key = self.openai_key
                self._openai_client = openai
            except ImportError:
                logger.warning("openai package not installed")
        return self._openai_client

    def _get_anthropic_client(self):
        if self._anthropic_client is None and self.anthropic_key:
            try:
                import anthropic
                self._anthropic_client = anthropic.Anthropic(api_key=self.anthropic_key)
            except ImportError:
                logger.warning("anthropic package not installed")
        return self._anthropic_client

    def call_openai(
        self,
        system: str,
        user: str,
        model: str = "gpt-4o-mini",
        max_tokens: int = 1000,
        temperature: float = 0.3,
    ) -> Optional[LLMResponse]:
        import time
        client = self._get_openai_client()
        if not client:
            return None

        start = time.time()
        try:
            response = client.ChatCompletion.create(
                model=model,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            latency = (time.time() - start) * 1000

            content = response.choices[0].message.content
            tokens = response.usage.total_tokens

            return LLMResponse(
                provider="openai",
                model=model,
                content=content,
                confidence=0.85,  # Base confidence for OpenAI
                tokens_used=tokens,
                latency_ms=latency,
                raw_response=response,
            )
        except Exception as e:
            logger.error(f"OpenAI call failed: {e}")
            return None

    def call_anthropic(
        self,
        system: str,
        user: str,
        model: str = "claude-3-haiku-20240307",
        max_tokens: int = 1000,
        temperature: float = 0.3,
    ) -> Optional[LLMResponse]:
        import time
        client = self._get_anthropic_client()
        if not client:
            return None

        start = time.time()
        try:
            response = client.messages.create(
                model=model,
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            latency = (time.time() - start) * 1000

            content = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens

            return LLMResponse(
                provider="anthropic",
                model=model,
                content=content,
                confidence=0.9,  # Base confidence for Anthropic
                tokens_used=tokens,
                latency_ms=latency,
            )
        except Exception as e:
            logger.error(f"Anthropic call failed: {e}")
            return None

    def call(
        self,
        prompt_name: str,
        payload: Dict[str, Any],
        provider: Optional[LLMProvider] = None,
        model: Optional[str] = None,
    ) -> Optional[List[Dict]]:
        """
        Call LLM with named prompt template.
        Returns parsed JSON list or None on failure.
        """
        system = PROMPTS.get(prompt_name, PROMPTS["process_signals"])
        user = json.dumps(payload, default=str)

        # Try providers in order
        response = None

        if provider == LLMProvider.OPENAI or (provider is None and self.openai_key):
            response = self.call_openai(system, user, model=model or "gpt-4o-mini")

        if response is None and (provider == LLMProvider.ANTHROPIC or provider is None):
            response = self.call_anthropic(system, user, model=model or "claude-3-haiku-20240307")

        if response is None:
            logger.error("All LLM providers failed")
            return None

        # Parse JSON from response
        try:
            # Try to extract JSON from response
            content = response.content.strip()
            # Handle markdown code blocks
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            parsed = json.loads(content)
            if isinstance(parsed, dict):
                parsed = [parsed]
            return parsed
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.debug(f"Raw response: {response.content}")
            return None

    def fuse_responses(
        self,
        responses: List[LLMResponse],
        method: str = "weighted",
    ) -> Optional[List[Dict]]:
        """
        Fuse multiple LLM responses using confidence weighting.
        Methods: weighted, majority, highest
        """
        if not responses:
            return None

        if len(responses) == 1:
            try:
                return json.loads(responses[0].content)
            except:
                return None

        # Parse all responses
        parsed_responses = []
        for r in responses:
            try:
                content = r.content.strip()
                if content.startswith("```"):
                    content = content.split("```")[1]
                    if content.startswith("json"):
                        content = content[4:]
                parsed = json.loads(content)
                if isinstance(parsed, dict):
                    parsed = [parsed]
                parsed_responses.append((parsed, r.confidence))
            except:
                continue

        if not parsed_responses:
            return None

        if method == "highest":
            # Return response with highest confidence
            best = max(parsed_responses, key=lambda x: x[1])
            return best[0]

        elif method == "majority":
            # Vote on each insight location
            location_votes: Dict[str, List[tuple]] = {}
            for insights, conf in parsed_responses:
                for ins in insights:
                    loc = ins.get("location", "")
                    if loc not in location_votes:
                        location_votes[loc] = []
                    location_votes[loc].append((ins, conf))

            # Pick highest confidence per location
            result = []
            for loc, votes in location_votes.items():
                best = max(votes, key=lambda x: x[1])
                result.append(best[0])
            return result

        else:  # weighted
            # Weighted average of confidences
            location_insights: Dict[str, Dict] = {}
            location_weights: Dict[str, float] = {}

            for insights, conf in parsed_responses:
                for ins in insights:
                    loc = ins.get("location", "")
                    if loc not in location_insights:
                        location_insights[loc] = ins
                        location_weights[loc] = conf
                    else:
                        # Weight by confidence
                        if conf > location_weights[loc]:
                            location_insights[loc] = ins
                            location_weights[loc] = conf

            return list(location_insights.values())


# Singleton
_llm_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client


def llm_call(prompt_name: str, payload: Dict[str, Any]) -> Optional[List[Dict]]:
    """Convenience function for LLM calls"""
    return get_llm_client().call(prompt_name, payload)

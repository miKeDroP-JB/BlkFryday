"""
Fractal Memory Engine - Shared Pydantic Models
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ToneType(str, Enum):
    AGGRESSIVE = "aggressive"
    CURIOUS = "curious"
    DIRECT = "direct"
    PLAYFUL = "playful"
    FORMAL = "formal"
    CASUAL = "casual"


class SourceType(str, Enum):
    USER = "user"
    LLM = "llm"
    RULE = "rule"
    LLM_RULE = "llm+rule"
    MANUAL = "manual"
    CALIBRATION = "calibration"
    EXTERNAL = "external"


class Meta(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: SourceType = SourceType.LLM
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    decay_index: float = Field(default=1.0, ge=0.0)
    version: int = Field(default=1, ge=1)
    tags: List[str] = Field(default_factory=list)
    needs_calibration: bool = False


class RawSignal(BaseModel):
    user_id: str
    message_id: Optional[str] = None
    text: str
    energy: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    friction: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    tone: Optional[ToneType] = None
    extras: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Insight(BaseModel):
    location: str  # dot-path like "profile.pace" or "operating_style.tone"
    value: Any
    confidence: float = Field(ge=0.0, le=1.0)
    meta: Optional[Meta] = None


class CapturePayload(BaseModel):
    user_id: str
    message: str
    message_id: Optional[str] = None
    session_id: Optional[str] = None
    avatar_id: Optional[str] = None
    extras: Dict[str, Any] = Field(default_factory=dict)


class ProcessPayload(BaseModel):
    user_id: str
    raw_signals: List[Dict[str, Any]]
    avatar_id: Optional[str] = None


class SurfaceRequest(BaseModel):
    user_state: Dict[str, Any]
    current_avatar: str = "default"
    current_message: str = ""
    max_snippets: int = 10


class SurfaceResponse(BaseModel):
    context_snippets: List[Dict[str, Any]]
    tone_profile: Dict[str, str]
    resonance_mode: bool
    avatar_transforms: Dict[str, Any] = Field(default_factory=dict)


class AvatarProfile(BaseModel):
    name: str
    allowed_collections: List[str] = Field(
        default_factory=lambda: ["knowledge", "lexicon", "goals"]
    )
    transforms: Dict[str, Any] = Field(default_factory=dict)
    tone_override: Optional[ToneType] = None
    filter_rules: Dict[str, Any] = Field(default_factory=dict)


class CalibrationItem(BaseModel):
    doc_id: str
    collection: str
    current_value: Any
    current_confidence: float
    suggested_value: Optional[Any] = None
    suggested_confidence: Optional[float] = None
    llm_reasoning: Optional[str] = None
    status: str = "pending"  # pending, confirmed, rejected, escalated


class DecayConfig(BaseModel):
    """Per-user decay configuration"""
    user_id: str
    base_lambda: float = 0.05
    knowledge_lambda: float = 0.01  # 30 day half-life
    lexicon_lambda: float = 0.04   # 7 day half-life
    behavior_lambda: float = 0.1   # 2 day half-life
    context_lambda: float = 0.5    # 4 hour half-life
    volatility_threshold: int = 3  # flips before increasing lambda
    last_tuned: datetime = Field(default_factory=datetime.utcnow)

"""
Fractal Memory Engine - Shared Module
"""
from .models import (
    Meta,
    RawSignal,
    Insight,
    CapturePayload,
    ProcessPayload,
    SurfaceRequest,
    SurfaceResponse,
    AvatarProfile,
    CalibrationItem,
    DecayConfig,
    ToneType,
    SourceType,
)
from .firestore_client import get_firestore_client
from .edge_kv_client import kv_get, kv_put, kv_delete, get_kv_client
from .llm_client import llm_call, get_llm_client, LLMResponse, LLMProvider
from .persist import (
    persist_insight,
    persist_batch,
    persist_to_collection,
    delete_insight,
    get_user_data,
    get_collection_data,
)

__all__ = [
    # Models
    "Meta",
    "RawSignal",
    "Insight",
    "CapturePayload",
    "ProcessPayload",
    "SurfaceRequest",
    "SurfaceResponse",
    "AvatarProfile",
    "CalibrationItem",
    "DecayConfig",
    "ToneType",
    "SourceType",
    # Clients
    "get_firestore_client",
    "kv_get",
    "kv_put",
    "kv_delete",
    "get_kv_client",
    "llm_call",
    "get_llm_client",
    "LLMResponse",
    "LLMProvider",
    # Persist
    "persist_insight",
    "persist_batch",
    "persist_to_collection",
    "delete_insight",
    "get_user_data",
    "get_collection_data",
]

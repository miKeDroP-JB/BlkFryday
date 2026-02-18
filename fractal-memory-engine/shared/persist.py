"""
Persist Engine - Centralized write layer with versioning and metadata
All writes go through here to enforce schema consistency
"""
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from .firestore_client import get_firestore_client
from .edge_kv_client import kv_put, kv_delete
from .models import Meta, SourceType

logger = logging.getLogger(__name__)


def persist_insight(
    user_id: str,
    path: str,
    value: Any,
    source: SourceType = SourceType.LLM,
    confidence: float = 0.5,
    tags: Optional[list] = None,
    invalidate_cache: bool = True,
) -> bool:
    """
    Persist an insight with proper metadata.

    Args:
        user_id: User identifier
        path: Dot-notation path (e.g., "profile.pace" or "operating_style.tone")
        value: The value to store
        source: Where this insight came from
        confidence: Confidence score 0-1
        tags: Optional tags for categorization
        invalidate_cache: Whether to invalidate edge KV cache

    Returns:
        True if successful
    """
    db = get_firestore_client()

    try:
        # Build metadata
        meta = Meta(
            timestamp=datetime.utcnow(),
            source=source,
            confidence=confidence,
            decay_index=1.0,
            version=1,
            tags=tags or [],
        )

        # Get existing doc to check version
        doc_ref = db.collection("users").document(user_id)
        existing = doc_ref.get().to_dict() or {}

        # Check if path exists and increment version
        existing_meta = existing.get(f"{path}_meta", {})
        if existing_meta:
            meta.version = existing_meta.get("version", 0) + 1

        # Build update payload
        update = {
            path: value,
            f"{path}_meta": meta.dict(),
        }

        # Write with merge
        doc_ref.set(update, merge=True)

        logger.info(f"Persisted {path} for user {user_id} (v{meta.version}, conf={confidence})")

        # Invalidate cache if needed
        if invalidate_cache:
            _invalidate_user_cache(user_id, path)

        return True

    except Exception as e:
        logger.error(f"Failed to persist {path} for {user_id}: {e}")
        return False


def persist_batch(
    user_id: str,
    insights: list[Dict[str, Any]],
    source: SourceType = SourceType.LLM,
    invalidate_cache: bool = True,
) -> int:
    """
    Persist multiple insights in batch.

    Args:
        user_id: User identifier
        insights: List of {"location": "path", "value": any, "confidence": float}
        source: Source type for all insights
        invalidate_cache: Whether to invalidate cache after

    Returns:
        Number of successfully persisted insights
    """
    db = get_firestore_client()
    success_count = 0

    try:
        # Get existing doc
        doc_ref = db.collection("users").document(user_id)
        existing = doc_ref.get().to_dict() or {}

        update = {}

        for insight in insights:
            path = insight.get("location", "")
            value = insight.get("value")
            confidence = insight.get("confidence", 0.5)

            if not path:
                continue

            # Build metadata
            existing_meta = existing.get(f"{path}_meta", {})
            version = existing_meta.get("version", 0) + 1

            meta = Meta(
                timestamp=datetime.utcnow(),
                source=source,
                confidence=confidence,
                decay_index=1.0,
                version=version,
                tags=insight.get("tags", []),
            )

            update[path] = value
            update[f"{path}_meta"] = meta.dict()
            success_count += 1

        if update:
            doc_ref.set(update, merge=True)
            logger.info(f"Batch persisted {success_count} insights for {user_id}")

        if invalidate_cache:
            _invalidate_user_cache(user_id)

    except Exception as e:
        logger.error(f"Batch persist failed for {user_id}: {e}")

    return success_count


def persist_to_collection(
    user_id: str,
    collection: str,
    doc_id: str,
    data: Dict[str, Any],
    source: SourceType = SourceType.LLM,
    confidence: float = 0.5,
) -> bool:
    """
    Persist to a subcollection (e.g., patterns, narrative, knowledge).
    """
    db = get_firestore_client()

    try:
        meta = Meta(
            timestamp=datetime.utcnow(),
            source=source,
            confidence=confidence,
        )

        doc_ref = (
            db.collection("users")
            .document(user_id)
            .collection(collection)
            .document(doc_id)
        )

        # Merge meta into data
        data["_meta"] = meta.dict()
        doc_ref.set(data, merge=True)

        logger.info(f"Persisted to {collection}/{doc_id} for {user_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to persist to {collection}/{doc_id}: {e}")
        return False


def delete_insight(user_id: str, path: str) -> bool:
    """Delete an insight and its metadata."""
    db = get_firestore_client()

    try:
        doc_ref = db.collection("users").document(user_id)
        # Firestore doesn't support deleting nested fields easily
        # So we set them to None
        doc_ref.set({path: None, f"{path}_meta": None}, merge=True)

        _invalidate_user_cache(user_id, path)
        logger.info(f"Deleted {path} for {user_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to delete {path} for {user_id}: {e}")
        return False


def _invalidate_user_cache(user_id: str, path: Optional[str] = None):
    """Invalidate edge KV cache for user."""
    try:
        # Always invalidate main profile cache
        kv_delete(f"profile:{user_id}")

        # If specific path, invalidate that too
        if path:
            collection = path.split(".")[0]
            kv_delete(f"{collection}:{user_id}")

        logger.debug(f"Invalidated cache for {user_id}")
    except Exception as e:
        logger.warning(f"Cache invalidation failed: {e}")


def get_user_data(user_id: str) -> Dict[str, Any]:
    """Get all user data from Firestore."""
    db = get_firestore_client()
    doc = db.collection("users").document(user_id).get()
    return doc.to_dict() or {}


def get_collection_data(user_id: str, collection: str, limit: int = 100) -> list[Dict]:
    """Get documents from a user's subcollection."""
    db = get_firestore_client()
    docs = (
        db.collection("users")
        .document(user_id)
        .collection(collection)
        .limit(limit)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]

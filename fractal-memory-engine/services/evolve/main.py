"""
Evolve Engine - Cloud Function
Periodic recalculation of confidence, pruning, and promotion

Runs hourly via Cloud Scheduler or Kubernetes CronJob
"""
import math
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.firestore_client import get_firestore_client
from shared.models import DecayConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Default decay constants
DEFAULT_LAMBDA = 0.05  # ~14 day half-life
PRUNE_THRESHOLD = 0.05  # Remove below 5% confidence
PROMOTE_THRESHOLD = 3   # Minimum occurrences to promote


def get_decay_config(db, user_id: str) -> DecayConfig:
    """Get user-specific decay configuration."""
    try:
        doc = (
            db.collection("users")
            .document(user_id)
            .collection("config")
            .document("decay")
            .get()
        )
        if doc.exists:
            return DecayConfig(**doc.to_dict())
    except Exception as e:
        logger.warning(f"Failed to get decay config for {user_id}: {e}")

    return DecayConfig(user_id=user_id)


def recalc_confidences(db, user_id: str, decay_config: DecayConfig) -> int:
    """
    Recalculate confidence scores using exponential decay.
    w(t) = w₀ * e^(-λt)
    """
    updated = 0

    try:
        # Get all user data
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            return 0

        data = user_doc.to_dict()
        updates = {}

        for key, value in data.items():
            if key.endswith("_meta"):
                continue

            meta_key = f"{key}_meta"
            meta = data.get(meta_key, {})

            if not meta:
                continue

            # Get last seen timestamp
            timestamp = meta.get("timestamp")
            if not timestamp:
                continue

            # Handle different timestamp formats
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                except:
                    continue
            elif hasattr(timestamp, "timestamp"):
                # Firestore timestamp
                timestamp = datetime.fromtimestamp(timestamp.timestamp())

            # Calculate days since last update
            days = (datetime.utcnow() - timestamp).days

            # Get appropriate lambda based on pattern type
            pattern_type = key.split(".")[0]
            if pattern_type == "knowledge":
                lam = decay_config.knowledge_lambda
            elif pattern_type == "lexicon":
                lam = decay_config.lexicon_lambda
            elif pattern_type in ("behavior", "operating_style"):
                lam = decay_config.behavior_lambda
            elif pattern_type == "context":
                lam = decay_config.context_lambda
            else:
                lam = decay_config.base_lambda

            # Apply decay: new_conf = old_conf * e^(-λ*days)
            old_conf = meta.get("confidence", 0.5)
            new_conf = old_conf * math.exp(-lam * days)

            # Update if changed significantly
            if abs(new_conf - old_conf) > 0.01:
                updates[f"{meta_key}.confidence"] = new_conf
                updates[f"{meta_key}.decay_index"] = math.exp(-lam * days)
                updated += 1

        if updates:
            db.collection("users").document(user_id).set(updates, merge=True)
            logger.info(f"Updated {updated} confidence scores for {user_id}")

    except Exception as e:
        logger.error(f"Confidence recalc failed for {user_id}: {e}")

    return updated


def prune_ghost_entries(db, user_id: str) -> int:
    """
    Remove entries with confidence below threshold.
    """
    pruned = 0

    try:
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            return 0

        data = user_doc.to_dict()
        to_delete = []

        for key, value in data.items():
            if key.endswith("_meta"):
                continue

            meta_key = f"{key}_meta"
            meta = data.get(meta_key, {})

            confidence = meta.get("confidence", 0.5)
            if confidence < PRUNE_THRESHOLD:
                to_delete.append(key)
                to_delete.append(meta_key)
                pruned += 1

        if to_delete:
            # Set deleted fields to None (Firestore delete)
            updates = {k: None for k in to_delete}
            db.collection("users").document(user_id).set(updates, merge=True)
            logger.info(f"Pruned {pruned} ghost entries for {user_id}")

    except Exception as e:
        logger.error(f"Prune failed for {user_id}: {e}")

    return pruned


def promote_repeated_patterns(db, user_id: str) -> int:
    """
    Scan narrative/raw_signals for repeated patterns and promote to permanent storage.
    """
    promoted = 0

    try:
        # Get raw signals from last 7 days
        signals = (
            db.collection("users")
            .document(user_id)
            .collection("raw_signals")
            .limit(100)
            .stream()
        )

        # Count term frequency
        term_counts: Dict[str, int] = {}
        tone_counts: Dict[str, int] = {}

        for signal in signals:
            data = signal.to_dict()
            text = data.get("text", "")
            tone = data.get("tone", "")

            # Count words
            for word in text.lower().split():
                if len(word) > 4 and word.isalpha():
                    term_counts[word] = term_counts.get(word, 0) + 1

            # Count tones
            if tone:
                tone_counts[tone] = tone_counts.get(tone, 0) + 1

        # Promote frequent terms to lexicon
        for term, count in term_counts.items():
            if count >= PROMOTE_THRESHOLD:
                db.collection("users").document(user_id).set({
                    f"lexicon.frequent.{term}": count,
                    f"lexicon.frequent.{term}_meta": {
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": "evolve:promotion",
                        "confidence": min(0.9, count / 10),
                        "version": 1,
                    }
                }, merge=True)
                promoted += 1

        # Promote dominant tone
        if tone_counts:
            dominant_tone = max(tone_counts.items(), key=lambda x: x[1])
            if dominant_tone[1] >= PROMOTE_THRESHOLD:
                db.collection("users").document(user_id).set({
                    "operating_style.dominant_tone": dominant_tone[0],
                    "operating_style.dominant_tone_meta": {
                        "timestamp": datetime.utcnow().isoformat(),
                        "source": "evolve:promotion",
                        "confidence": min(0.9, dominant_tone[1] / 10),
                        "version": 1,
                    }
                }, merge=True)
                promoted += 1

        if promoted:
            logger.info(f"Promoted {promoted} patterns for {user_id}")

    except Exception as e:
        logger.error(f"Promotion failed for {user_id}: {e}")

    return promoted


def tune_lambda(db, user_id: str) -> Optional[float]:
    """
    Auto-tune lambda based on pattern volatility.
    If patterns flip > threshold times in window, increase lambda.
    """
    try:
        config = get_decay_config(db, user_id)

        # Check pattern version history for volatility
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            return None

        data = user_doc.to_dict()
        high_version_count = 0

        for key, value in data.items():
            if key.endswith("_meta"):
                meta = value
                version = meta.get("version", 1)
                if version >= config.volatility_threshold:
                    high_version_count += 1

        # Adjust lambda based on volatility
        if high_version_count >= 5:
            # High volatility - increase lambda (faster decay)
            new_lambda = min(0.2, config.base_lambda * 1.2)
        elif high_version_count <= 1:
            # Low volatility - decrease lambda (slower decay)
            new_lambda = max(0.01, config.base_lambda * 0.9)
        else:
            return config.base_lambda

        # Save updated config
        db.collection("users").document(user_id).collection("config").document("decay").set({
            "base_lambda": new_lambda,
            "last_tuned": datetime.utcnow().isoformat(),
        }, merge=True)

        logger.info(f"Tuned lambda for {user_id}: {config.base_lambda:.4f} -> {new_lambda:.4f}")
        return new_lambda

    except Exception as e:
        logger.error(f"Lambda tuning failed for {user_id}: {e}")
        return None


def evolve_user(db, user_id: str) -> Dict[str, int]:
    """Run full evolution cycle for a user."""
    decay_config = get_decay_config(db, user_id)

    return {
        "confidence_updates": recalc_confidences(db, user_id, decay_config),
        "pruned": prune_ghost_entries(db, user_id),
        "promoted": promote_repeated_patterns(db, user_id),
        "lambda_tuned": 1 if tune_lambda(db, user_id) else 0,
    }


def main(event=None, context=None):
    """
    Cloud Function entry point.
    Triggered by Cloud Scheduler.
    """
    db = get_firestore_client()

    total_stats = {
        "users_processed": 0,
        "confidence_updates": 0,
        "pruned": 0,
        "promoted": 0,
    }

    try:
        # Get all users (paginate in production)
        users = db.collection("users").limit(1000).stream()

        for user in users:
            user_id = user.id
            stats = evolve_user(db, user_id)

            total_stats["users_processed"] += 1
            total_stats["confidence_updates"] += stats["confidence_updates"]
            total_stats["pruned"] += stats["pruned"]
            total_stats["promoted"] += stats["promoted"]

        logger.info(f"Evolution complete: {total_stats}")
        return total_stats

    except Exception as e:
        logger.error(f"Evolution failed: {e}")
        raise


# For local testing
if __name__ == "__main__":
    result = main()
    print(f"Evolution result: {result}")

"""
Calibration Engine - Cloud Function
Quiet-checks low-confidence items and does internal confirmations

Runs as background worker, no user-visible interruptions unless opt-in
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.firestore_client import get_firestore_client
from shared.llm_client import llm_call
from shared.models import CalibrationItem, SourceType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Calibration thresholds
LOW_CONFIDENCE_THRESHOLD = 0.4
HIGH_CONFIDENCE_THRESHOLD = 0.7
CALIBRATION_COOLDOWN_DAYS = 7
MAX_CALIBRATIONS_PER_RUN = 50


def find_low_confidence_items(db, user_id: str) -> List[CalibrationItem]:
    """Find items that need calibration."""
    items = []

    try:
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            return items

        data = user_doc.to_dict()
        cooldown_date = datetime.utcnow() - timedelta(days=CALIBRATION_COOLDOWN_DAYS)

        for key, value in data.items():
            if key.endswith("_meta"):
                continue

            meta_key = f"{key}_meta"
            meta = data.get(meta_key, {})

            if not meta:
                continue

            confidence = meta.get("confidence", 0.5)
            last_calibrated = meta.get("last_calibrated")

            # Skip if recently calibrated
            if last_calibrated:
                if isinstance(last_calibrated, str):
                    try:
                        last_cal_dt = datetime.fromisoformat(last_calibrated.replace("Z", "+00:00"))
                        if last_cal_dt > cooldown_date:
                            continue
                    except:
                        pass

            # Include if low confidence
            if confidence < LOW_CONFIDENCE_THRESHOLD:
                items.append(CalibrationItem(
                    doc_id=key,
                    collection="root",
                    current_value=value,
                    current_confidence=confidence,
                ))

        # Also check subcollections
        for coll_name in ["knowledge", "lexicon", "patterns"]:
            try:
                coll = (
                    db.collection("users")
                    .document(user_id)
                    .collection(coll_name)
                    .stream()
                )

                for doc in coll:
                    doc_data = doc.to_dict()
                    meta = doc_data.get("_meta", {})
                    confidence = meta.get("confidence", 0.5)

                    if confidence < LOW_CONFIDENCE_THRESHOLD:
                        items.append(CalibrationItem(
                            doc_id=doc.id,
                            collection=coll_name,
                            current_value=doc_data,
                            current_confidence=confidence,
                        ))

            except Exception as e:
                logger.warning(f"Failed to check {coll_name}: {e}")

    except Exception as e:
        logger.error(f"Find low confidence failed for {user_id}: {e}")

    return items[:MAX_CALIBRATIONS_PER_RUN]


def calibrate_item(item: CalibrationItem) -> CalibrationItem:
    """Use LLM to calibrate/verify an item."""
    try:
        result = llm_call("calibration", {
            "item": {
                "location": f"{item.collection}/{item.doc_id}",
                "value": item.current_value,
                "confidence": item.current_confidence,
            }
        })

        if result and len(result) > 0:
            calibration = result[0]
            item.suggested_value = calibration.get("value")
            item.suggested_confidence = calibration.get("confidence", item.current_confidence)
            item.llm_reasoning = calibration.get("reasoning", "")

            if item.suggested_confidence >= HIGH_CONFIDENCE_THRESHOLD:
                item.status = "confirmed"
            elif item.suggested_confidence < 0.2:
                item.status = "rejected"
            else:
                item.status = "needs_review"
        else:
            item.status = "llm_failed"

    except Exception as e:
        logger.error(f"Calibration failed for {item.doc_id}: {e}")
        item.status = "error"

    return item


def apply_calibration(db, user_id: str, item: CalibrationItem) -> bool:
    """Apply calibration result to Firestore."""
    try:
        if item.status == "confirmed" and item.suggested_confidence:
            # Update confidence
            if item.collection == "root":
                db.collection("users").document(user_id).set({
                    f"{item.doc_id}_meta.confidence": item.suggested_confidence,
                    f"{item.doc_id}_meta.last_calibrated": datetime.utcnow().isoformat(),
                    f"{item.doc_id}_meta.source": "calibration",
                }, merge=True)
            else:
                db.collection("users").document(user_id).collection(item.collection).document(item.doc_id).set({
                    "_meta.confidence": item.suggested_confidence,
                    "_meta.last_calibrated": datetime.utcnow().isoformat(),
                    "_meta.source": "calibration",
                }, merge=True)

            logger.info(f"Applied calibration to {item.collection}/{item.doc_id}: {item.current_confidence:.2f} -> {item.suggested_confidence:.2f}")
            return True

        elif item.status == "rejected":
            # Mark for deletion or manual review
            if item.collection == "root":
                db.collection("users").document(user_id).set({
                    f"{item.doc_id}_meta.needs_calibration": True,
                    f"{item.doc_id}_meta.calibration_status": "rejected",
                    f"{item.doc_id}_meta.last_calibrated": datetime.utcnow().isoformat(),
                }, merge=True)
            else:
                db.collection("users").document(user_id).collection(item.collection).document(item.doc_id).set({
                    "_meta.needs_calibration": True,
                    "_meta.calibration_status": "rejected",
                    "_meta.last_calibrated": datetime.utcnow().isoformat(),
                }, merge=True)

            logger.info(f"Rejected item {item.collection}/{item.doc_id}")
            return True

        elif item.status == "needs_review":
            # Flag for manual/user review (quiet)
            if item.collection == "root":
                db.collection("users").document(user_id).set({
                    f"{item.doc_id}_meta.needs_calibration": True,
                    f"{item.doc_id}_meta.calibration_status": "pending_review",
                    f"{item.doc_id}_meta.last_calibrated": datetime.utcnow().isoformat(),
                }, merge=True)

            logger.info(f"Flagged for review: {item.collection}/{item.doc_id}")
            return True

    except Exception as e:
        logger.error(f"Apply calibration failed: {e}")

    return False


def calibrate_user(db, user_id: str) -> Dict[str, int]:
    """Run calibration for a single user."""
    stats = {
        "found": 0,
        "confirmed": 0,
        "rejected": 0,
        "needs_review": 0,
        "errors": 0,
    }

    items = find_low_confidence_items(db, user_id)
    stats["found"] = len(items)

    for item in items:
        calibrated = calibrate_item(item)

        if calibrated.status == "confirmed":
            stats["confirmed"] += 1
        elif calibrated.status == "rejected":
            stats["rejected"] += 1
        elif calibrated.status == "needs_review":
            stats["needs_review"] += 1
        else:
            stats["errors"] += 1

        apply_calibration(db, user_id, calibrated)

    return stats


def main(event=None, context=None):
    """
    Cloud Function entry point.
    Triggered by Cloud Scheduler or Pub/Sub.
    """
    db = get_firestore_client()

    total_stats = {
        "users_processed": 0,
        "items_found": 0,
        "confirmed": 0,
        "rejected": 0,
        "needs_review": 0,
        "errors": 0,
    }

    try:
        # Get users with pending calibration items
        users = db.collection("users").limit(100).stream()

        for user in users:
            user_id = user.id
            stats = calibrate_user(db, user_id)

            total_stats["users_processed"] += 1
            total_stats["items_found"] += stats["found"]
            total_stats["confirmed"] += stats["confirmed"]
            total_stats["rejected"] += stats["rejected"]
            total_stats["needs_review"] += stats["needs_review"]
            total_stats["errors"] += stats["errors"]

        logger.info(f"Calibration complete: {total_stats}")
        return total_stats

    except Exception as e:
        logger.error(f"Calibration run failed: {e}")
        raise


# For local testing
if __name__ == "__main__":
    result = main()
    print(f"Calibration result: {result}")

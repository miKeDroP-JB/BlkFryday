"""
Capture Service - FastAPI
Receives user messages, extracts raw signals, stores them
"""
import re
import uuid
import logging
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.models import CapturePayload, RawSignal, ToneType
from shared.firestore_client import get_firestore_client
from shared.edge_kv_client import kv_put
from shared.persist import get_user_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fractal Memory - Capture Service",
    description="Captures user messages and extracts raw signals",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Signal extraction patterns
NEGATIVE_WORDS = re.compile(
    r"\b(no|not|can't|won't|hate|bad|fuck|shit|damn|never|terrible|awful|worst)\b",
    re.IGNORECASE,
)
POSITIVE_WORDS = re.compile(
    r"\b(yes|love|great|awesome|amazing|perfect|best|excellent|fantastic)\b",
    re.IGNORECASE,
)
QUESTION_PATTERN = re.compile(r"\?")
EXCLAIM_PATTERN = re.compile(r"!")


def estimate_energy(text: str) -> float:
    """Estimate message energy (0-1) based on punctuation and word count."""
    exclaim_count = len(EXCLAIM_PATTERN.findall(text))
    word_count = len(text.split())
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)

    # Energy formula: exclamations + word density + caps
    energy = (exclaim_count * 0.15) + (word_count / 100) + (caps_ratio * 0.5)
    return min(1.0, max(0.0, energy))


def estimate_friction(text: str) -> float:
    """Estimate friction/resistance (0-1) based on negative words and questions."""
    negative_count = len(NEGATIVE_WORDS.findall(text))
    question_count = len(QUESTION_PATTERN.findall(text))

    # Friction formula: negative words + questions
    friction = (negative_count * 0.2) + (question_count * 0.15)
    return min(1.0, max(0.0, friction))


def estimate_tone(text: str) -> ToneType:
    """Estimate message tone based on text characteristics."""
    # All caps = aggressive
    if text.isupper() and len(text) > 5:
        return ToneType.AGGRESSIVE

    # Questions = curious
    if QUESTION_PATTERN.search(text):
        return ToneType.CURIOUS

    # Lots of exclamations = playful/excited
    if len(EXCLAIM_PATTERN.findall(text)) >= 2:
        return ToneType.PLAYFUL

    # Positive sentiment = casual
    if len(POSITIVE_WORDS.findall(text)) > len(NEGATIVE_WORDS.findall(text)):
        return ToneType.CASUAL

    # Default = direct
    return ToneType.DIRECT


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "capture", "timestamp": datetime.utcnow().isoformat()}


@app.post("/capture/message")
async def capture_message(payload: CapturePayload):
    """
    Capture a user message and extract raw signals.

    - Extracts energy, friction, tone signals
    - Stores raw signal in Firestore
    - Updates edge KV cache with user profile
    """
    try:
        db = get_firestore_client()

        # Extract signals
        energy = estimate_energy(payload.message)
        friction = estimate_friction(payload.message)
        tone = estimate_tone(payload.message)

        # Build raw signal
        raw_signal = RawSignal(
            user_id=payload.user_id,
            message_id=payload.message_id or str(uuid.uuid4()),
            text=payload.message,
            energy=energy,
            friction=friction,
            tone=tone,
            extras={
                "session_id": payload.session_id,
                "avatar_id": payload.avatar_id,
                **payload.extras,
            },
            timestamp=datetime.utcnow(),
        )

        # Store raw signal in Firestore
        signal_ref = (
            db.collection("users")
            .document(payload.user_id)
            .collection("raw_signals")
        )
        signal_ref.add(raw_signal.dict())

        # Update edge KV cache with profile summary
        profile = get_user_data(payload.user_id)
        if profile:
            # Cache lightweight profile summary
            profile_summary = {
                "user_id": payload.user_id,
                "last_seen": datetime.utcnow().isoformat(),
                "pace": profile.get("profile.pace"),
                "tone": profile.get("operating_style.tone"),
            }
            kv_put(f"profile:{payload.user_id}", str(profile_summary), ttl=3600)

        logger.info(f"Captured message for {payload.user_id}: energy={energy:.2f}, friction={friction:.2f}, tone={tone}")

        return {
            "status": "ok",
            "message_id": raw_signal.message_id,
            "signals": {
                "energy": energy,
                "friction": friction,
                "tone": tone.value,
            },
        }

    except Exception as e:
        logger.error(f"Capture failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/capture/batch")
async def capture_batch(payloads: list[CapturePayload]):
    """Capture multiple messages in batch."""
    results = []
    for payload in payloads:
        try:
            result = await capture_message(payload)
            results.append({"user_id": payload.user_id, **result})
        except Exception as e:
            results.append({"user_id": payload.user_id, "status": "error", "error": str(e)})

    return {"results": results, "total": len(results)}


@app.get("/capture/signals/{user_id}")
async def get_recent_signals(user_id: str, limit: int = 20):
    """Get recent raw signals for a user."""
    try:
        db = get_firestore_client()
        signals = (
            db.collection("users")
            .document(user_id)
            .collection("raw_signals")
            .limit(limit)
            .stream()
        )

        return {
            "user_id": user_id,
            "signals": [s.to_dict() for s in signals],
        }

    except Exception as e:
        logger.error(f"Failed to get signals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

"""
Surface Service - FastAPI
Prepares context snippets and tone profile for LLM calls
"""
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.models import SurfaceRequest, SurfaceResponse, AvatarProfile
from shared.firestore_client import get_firestore_client
from shared.edge_kv_client import kv_get
from shared.persist import get_user_data, get_collection_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fractal Memory - Surface Service",
    description="Surfaces context and tone for LLM prompt construction",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_avatar_profile(db, user_id: str, avatar_name: str) -> AvatarProfile:
    """Get avatar profile or return default."""
    try:
        doc = (
            db.collection("users")
            .document(user_id)
            .collection("avatars")
            .document(avatar_name)
            .get()
        )
        if doc.exists:
            data = doc.to_dict()
            return AvatarProfile(**data)
    except Exception as e:
        logger.warning(f"Failed to get avatar profile: {e}")

    # Return default
    return AvatarProfile(name=avatar_name)


def retrieve_snippets(
    db,
    user_id: str,
    avatar_profile: AvatarProfile,
    max_snippets: int = 10,
) -> List[Dict[str, Any]]:
    """
    Retrieve context snippets filtered by avatar permissions.
    """
    snippets = []
    allowed = avatar_profile.allowed_collections

    for collection in allowed:
        try:
            docs = (
                db.collection("users")
                .document(user_id)
                .collection(collection)
                .limit(max_snippets // len(allowed))
                .stream()
            )

            for doc in docs:
                data = doc.to_dict()
                # Filter by confidence if meta present
                meta = data.get("_meta", {})
                confidence = meta.get("confidence", 0.5)

                if confidence >= 0.3:  # Minimum confidence threshold
                    snippets.append({
                        "collection": collection,
                        "id": doc.id,
                        "data": data,
                        "confidence": confidence,
                    })

        except Exception as e:
            logger.warning(f"Failed to retrieve from {collection}: {e}")

    # Sort by confidence descending
    snippets.sort(key=lambda x: x.get("confidence", 0), reverse=True)
    return snippets[:max_snippets]


def build_tone_profile(user_data: Dict[str, Any], avatar_profile: AvatarProfile) -> Dict[str, str]:
    """Build tone profile from user data and avatar settings."""
    profile = {
        "preferred_tone": "direct",
        "pace": "normal",
        "formality": "casual",
        "verbosity": "concise",
    }

    # Override with user operating style
    if "operating_style.tone" in user_data:
        profile["preferred_tone"] = user_data["operating_style.tone"]
    if "profile.pace" in user_data:
        profile["pace"] = user_data["profile.pace"]
    if "operating_style.formality" in user_data:
        profile["formality"] = user_data["operating_style.formality"]

    # Avatar can override tone
    if avatar_profile.tone_override:
        profile["preferred_tone"] = avatar_profile.tone_override.value

    return profile


def check_resonance(snippets: List[Dict], current_message: str) -> bool:
    """
    Check if current message resonates with stored memory.
    Returns True if significant overlap detected.
    """
    if not snippets or not current_message:
        return False

    # Build tag set from snippets
    tags = set()
    for snippet in snippets:
        data = snippet.get("data", {})
        meta = data.get("_meta", {})
        for tag in meta.get("tags", []):
            tags.add(tag.lower())

        # Also add key terms from data
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 3:
                tags.add(value.lower())

    # Check message words against tags
    message_words = set(current_message.lower().split())
    overlap = tags.intersection(message_words)

    return len(overlap) >= 2


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "surface", "timestamp": datetime.utcnow().isoformat()}


@app.post("/surface/context", response_model=SurfaceResponse)
async def surface_context(request: SurfaceRequest):
    """
    Surface context and tone for LLM prompt construction.

    1. Try edge KV for cached profile
    2. Fetch operating_style from Firestore
    3. Get avatar filter profile
    4. Retrieve snippets according to avatar permissions
    5. Build tone profile
    6. Check resonance mode
    """
    try:
        db = get_firestore_client()
        user_id = request.user_state.get("user_id")

        if not user_id:
            raise HTTPException(status_code=400, detail="user_id required in user_state")

        # Step 1: Try edge KV cache
        profile_cached = kv_get(f"profile:{user_id}")
        if profile_cached:
            logger.debug(f"Cache hit for profile:{user_id}")

        # Step 2: Get full user data
        user_data = get_user_data(user_id)

        # Step 3: Get avatar profile
        avatar_profile = get_avatar_profile(db, user_id, request.current_avatar)

        # Step 4: Retrieve snippets
        snippets = retrieve_snippets(
            db,
            user_id,
            avatar_profile,
            max_snippets=request.max_snippets,
        )

        # Step 5: Build tone profile
        tone_profile = build_tone_profile(user_data, avatar_profile)

        # Step 6: Check resonance
        resonance = check_resonance(snippets, request.current_message)

        return SurfaceResponse(
            context_snippets=snippets,
            tone_profile=tone_profile,
            resonance_mode=resonance,
            avatar_transforms=avatar_profile.transforms,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Surface context failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/surface/route_memory")
async def route_memory(user_id: str, avatar_name: str):
    """
    Route memory for avatar without copying.
    Returns references and filter masks.
    """
    try:
        db = get_firestore_client()
        avatar_profile = get_avatar_profile(db, user_id, avatar_name)

        # Build overlay with pointers only
        overlay = {
            "avatar": avatar_name,
            "allowed_collections": avatar_profile.allowed_collections,
            "transforms": avatar_profile.transforms,
            "filter_rules": avatar_profile.filter_rules,
            "memory_refs": {},
        }

        # Add collection references (not copies)
        for coll in avatar_profile.allowed_collections:
            overlay["memory_refs"][coll] = f"/users/{user_id}/{coll}"

        return overlay

    except Exception as e:
        logger.error(f"Route memory failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/surface/quick_profile/{user_id}")
async def quick_profile(user_id: str):
    """Get quick profile from cache or Firestore."""
    try:
        # Try cache first
        cached = kv_get(f"profile:{user_id}")
        if cached:
            return {"source": "cache", "profile": cached}

        # Fall back to Firestore
        user_data = get_user_data(user_id)
        profile = {
            "pace": user_data.get("profile.pace", "normal"),
            "tone": user_data.get("operating_style.tone", "direct"),
            "last_seen": datetime.utcnow().isoformat(),
        }

        return {"source": "firestore", "profile": profile}

    except Exception as e:
        logger.error(f"Quick profile failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)

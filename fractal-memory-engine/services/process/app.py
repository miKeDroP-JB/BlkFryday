"""
Process Service - FastAPI
Receives raw signals, runs rule engine + LLM fusion, writes insights
"""
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

from shared.models import ProcessPayload, SourceType
from shared.firestore_client import get_firestore_client
from shared.llm_client import llm_call
from shared.persist import persist_batch, persist_to_collection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Fractal Memory - Process Service",
    description="Processes raw signals through rules and LLM fusion",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Rule Engine
def run_rule_engine(raw_signals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Apply deterministic rules to extract insights from signals.
    Fast, no LLM needed.
    """
    insights = []

    for signal in raw_signals:
        energy = signal.get("energy", 0)
        friction = signal.get("friction", 0)
        tone = signal.get("tone", "direct")
        text = signal.get("text", "")

        # Energy-based rules
        if energy > 0.8:
            insights.append({
                "location": "profile.pace",
                "value": "fast",
                "confidence": 0.85,
                "source": "rule:high_energy",
            })
        elif energy < 0.2:
            insights.append({
                "location": "profile.pace",
                "value": "measured",
                "confidence": 0.7,
                "source": "rule:low_energy",
            })

        # Friction-based rules
        if friction > 0.5:
            insights.append({
                "location": "operating_style.friction_triggers",
                "value": "sensitivity_detected",
                "confidence": 0.75,
                "source": "rule:high_friction",
            })

        # Tone-based rules
        if tone == "aggressive":
            insights.append({
                "location": "operating_style.communication_style",
                "value": "direct_confrontational",
                "confidence": 0.8,
                "source": "rule:aggressive_tone",
            })
        elif tone == "curious":
            insights.append({
                "location": "operating_style.learning_mode",
                "value": "inquiry_driven",
                "confidence": 0.7,
                "source": "rule:curious_tone",
            })

        # Lexicon extraction (simple word frequency)
        words = text.lower().split()
        for word in words:
            if len(word) > 6 and word.isalpha():
                insights.append({
                    "location": f"lexicon.terms.{word}",
                    "value": 1,
                    "confidence": 0.5,
                    "source": "rule:lexicon_extract",
                })

    return insights


def merge_insights(
    rule_insights: List[Dict],
    llm_insights: List[Dict],
) -> List[Dict]:
    """
    Merge rule-based and LLM insights with conflict resolution.
    Higher confidence wins at same location.
    """
    location_map: Dict[str, Dict] = {}

    # Add rule insights first
    for insight in rule_insights:
        loc = insight.get("location", "")
        if loc:
            location_map[loc] = insight

    # LLM insights override if higher confidence
    for insight in llm_insights:
        loc = insight.get("location", "")
        if not loc:
            continue

        existing = location_map.get(loc)
        if not existing or insight.get("confidence", 0) > existing.get("confidence", 0):
            location_map[loc] = insight

    return list(location_map.values())


def resolve_contradictions(insights: List[Dict]) -> List[Dict]:
    """
    Detect and resolve contradictory insights.
    Uses confidence weighting and recency.
    """
    # Group by location prefix
    groups: Dict[str, List[Dict]] = {}

    for insight in insights:
        loc = insight.get("location", "")
        prefix = loc.split(".")[0] if "." in loc else loc
        if prefix not in groups:
            groups[prefix] = []
        groups[prefix].append(insight)

    # Check for contradictions within groups
    resolved = []
    for prefix, group in groups.items():
        if len(group) <= 1:
            resolved.extend(group)
            continue

        # Sort by confidence descending
        sorted_group = sorted(group, key=lambda x: x.get("confidence", 0), reverse=True)

        # Keep highest confidence, flag others if significantly different values
        best = sorted_group[0]
        resolved.append(best)

        for other in sorted_group[1:]:
            if other.get("value") != best.get("value"):
                # Log potential contradiction
                logger.warning(f"Contradiction at {prefix}: {best['value']} vs {other['value']}")
            # Still include if different location path
            if other.get("location") != best.get("location"):
                resolved.append(other)

    return resolved


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "process", "timestamp": datetime.utcnow().isoformat()}


@app.post("/process/ingest_raw")
async def ingest_raw(payload: ProcessPayload):
    """
    Process raw signals through rule engine and LLM fusion.

    1. Run rule engine for deterministic insights
    2. Call LLM for deeper pattern extraction
    3. Merge and resolve contradictions
    4. Persist with versioning
    """
    try:
        raw_signals = payload.raw_signals

        if not raw_signals:
            return {"status": "ok", "merged_count": 0, "message": "No signals to process"}

        # Step 1: Rule engine
        rule_insights = run_rule_engine(raw_signals)
        logger.info(f"Rule engine extracted {len(rule_insights)} insights")

        # Step 2: LLM inference
        llm_insights = []
        try:
            llm_result = llm_call("process_signals", {"signals": raw_signals})
            if llm_result:
                llm_insights = llm_result
                logger.info(f"LLM extracted {len(llm_insights)} insights")
        except Exception as e:
            logger.warning(f"LLM call failed, proceeding with rules only: {e}")

        # Step 3: Merge
        merged = merge_insights(rule_insights, llm_insights)
        logger.info(f"Merged to {len(merged)} insights")

        # Step 4: Resolve contradictions
        resolved = resolve_contradictions(merged)
        logger.info(f"After contradiction resolution: {len(resolved)} insights")

        # Step 5: Persist
        persisted = persist_batch(
            user_id=payload.user_id,
            insights=resolved,
            source=SourceType.LLM_RULE,
        )

        return {
            "status": "ok",
            "rule_count": len(rule_insights),
            "llm_count": len(llm_insights),
            "merged_count": len(merged),
            "persisted_count": persisted,
        }

    except Exception as e:
        logger.error(f"Process failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/rules_only")
async def process_rules_only(payload: ProcessPayload):
    """Process signals with rules only (no LLM call)."""
    try:
        rule_insights = run_rule_engine(payload.raw_signals)
        resolved = resolve_contradictions(rule_insights)

        persisted = persist_batch(
            user_id=payload.user_id,
            insights=resolved,
            source=SourceType.RULE,
        )

        return {
            "status": "ok",
            "rule_count": len(rule_insights),
            "persisted_count": persisted,
        }

    except Exception as e:
        logger.error(f"Rules-only process failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/llm_only")
async def process_llm_only(payload: ProcessPayload):
    """Process signals with LLM only (no rules)."""
    try:
        llm_result = llm_call("process_signals", {"signals": payload.raw_signals})
        llm_insights = llm_result or []

        persisted = persist_batch(
            user_id=payload.user_id,
            insights=llm_insights,
            source=SourceType.LLM,
        )

        return {
            "status": "ok",
            "llm_count": len(llm_insights),
            "persisted_count": persisted,
        }

    except Exception as e:
        logger.error(f"LLM-only process failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

"""
Unit tests for the rule engine
"""
import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

import pytest


def test_energy_rule():
    """Test high energy detection."""
    from services.process.app import run_rule_engine

    signals = [{"text": "Amazing!!!", "energy": 0.9, "friction": 0.1, "tone": "playful"}]
    insights = run_rule_engine(signals)

    # Should detect fast pace from high energy
    pace_insights = [i for i in insights if i.get("location") == "profile.pace"]
    assert len(pace_insights) > 0
    assert pace_insights[0]["value"] == "fast"


def test_friction_rule():
    """Test friction detection."""
    from services.process.app import run_rule_engine

    signals = [{"text": "This won't work, hate it", "energy": 0.3, "friction": 0.7, "tone": "aggressive"}]
    insights = run_rule_engine(signals)

    # Should detect friction triggers
    friction_insights = [i for i in insights if "friction" in i.get("location", "")]
    assert len(friction_insights) > 0


def test_tone_rule():
    """Test tone-based rules."""
    from services.process.app import run_rule_engine

    signals = [{"text": "What is this?", "energy": 0.3, "friction": 0.2, "tone": "curious"}]
    insights = run_rule_engine(signals)

    # Should detect inquiry-driven learning mode
    learning_insights = [i for i in insights if "learning_mode" in i.get("location", "")]
    assert len(learning_insights) > 0


def test_lexicon_extraction():
    """Test lexicon term extraction."""
    from services.process.app import run_rule_engine

    signals = [{"text": "Building revolutionary infrastructure today", "energy": 0.5, "friction": 0.1, "tone": "direct"}]
    insights = run_rule_engine(signals)

    # Should extract long words to lexicon
    lexicon_insights = [i for i in insights if "lexicon" in i.get("location", "")]
    assert len(lexicon_insights) > 0


def test_merge_insights():
    """Test insight merging."""
    from services.process.app import merge_insights

    rule_insights = [
        {"location": "profile.pace", "value": "fast", "confidence": 0.7},
        {"location": "tone.default", "value": "direct", "confidence": 0.6},
    ]
    llm_insights = [
        {"location": "profile.pace", "value": "measured", "confidence": 0.9},  # Higher confidence
        {"location": "goals.primary", "value": "growth", "confidence": 0.8},
    ]

    merged = merge_insights(rule_insights, llm_insights)

    # LLM should win on profile.pace (higher confidence)
    pace = next((i for i in merged if i["location"] == "profile.pace"), None)
    assert pace is not None
    assert pace["value"] == "measured"

    # Both unique insights should be present
    assert any(i["location"] == "tone.default" for i in merged)
    assert any(i["location"] == "goals.primary" for i in merged)


def test_contradiction_resolution():
    """Test contradiction resolution."""
    from services.process.app import resolve_contradictions

    insights = [
        {"location": "profile.pace", "value": "fast", "confidence": 0.9},
        {"location": "profile.energy", "value": "high", "confidence": 0.8},
        {"location": "profile.pace", "value": "slow", "confidence": 0.3},  # Contradiction
    ]

    resolved = resolve_contradictions(insights)

    # Should keep highest confidence for same location
    pace_insights = [i for i in resolved if i["location"] == "profile.pace"]
    assert len(pace_insights) == 1
    assert pace_insights[0]["value"] == "fast"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

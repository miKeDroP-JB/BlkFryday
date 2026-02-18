"""
Unit tests for the capture service
"""
import sys
sys.path.insert(0, "/home/user/BlkFryday/fractal-memory-engine")

import pytest


def test_estimate_energy_high():
    """Test high energy detection."""
    from services.capture.app import estimate_energy

    # Exclamations and caps should boost energy
    assert estimate_energy("THIS IS AMAZING!!!") > 0.5
    assert estimate_energy("Wow! Great! Awesome!") > 0.3


def test_estimate_energy_low():
    """Test low energy detection."""
    from services.capture.app import estimate_energy

    # Short, quiet messages should have low energy
    assert estimate_energy("ok") < 0.2
    assert estimate_energy("fine") < 0.2


def test_estimate_friction_high():
    """Test high friction detection."""
    from services.capture.app import estimate_friction

    # Negative words and questions should boost friction
    assert estimate_friction("Why won't this work? I hate it!") > 0.4
    assert estimate_friction("No, that's not right") > 0.2


def test_estimate_friction_low():
    """Test low friction detection."""
    from services.capture.app import estimate_friction

    # Positive statements should have low friction
    assert estimate_friction("This is great") < 0.2
    assert estimate_friction("Love it") < 0.2


def test_estimate_tone_aggressive():
    """Test aggressive tone detection."""
    from services.capture.app import estimate_tone
    from shared.models import ToneType

    assert estimate_tone("THIS IS UNACCEPTABLE") == ToneType.AGGRESSIVE


def test_estimate_tone_curious():
    """Test curious tone detection."""
    from services.capture.app import estimate_tone
    from shared.models import ToneType

    assert estimate_tone("What is this? How does it work?") == ToneType.CURIOUS


def test_estimate_tone_playful():
    """Test playful tone detection."""
    from services.capture.app import estimate_tone
    from shared.models import ToneType

    assert estimate_tone("This is awesome!! Let's go!!") == ToneType.PLAYFUL


def test_estimate_tone_direct():
    """Test direct tone detection."""
    from services.capture.app import estimate_tone
    from shared.models import ToneType

    assert estimate_tone("Deploy the service") == ToneType.DIRECT


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

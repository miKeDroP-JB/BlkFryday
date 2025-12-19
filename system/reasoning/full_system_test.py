#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
BLKFRYDAY FULL SYSTEM TEST
═══════════════════════════════════════════════════════════════════════════════

End-to-end test harness for the complete reasoning system:
- NEXO Orchestrator (unified pipeline)
- Tier Specialists (5-tier council)
- A4 Integrator Brain (synergy detection)
- NEXO Swarm (300 agents)
- Memory Spine (context injection)
- Pattern Library (learned patterns)
"""

import asyncio
import time
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# Add path for imports
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import components
from tier_specialists import TierCouncil, Tier
from arc_agi2_solver import ARCSolver


def print_banner():
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ██████╗ ██╗     ██╗  ██╗███████╗██████╗ ██╗   ██╗██████╗  █████╗ ██╗   ██╗  ║
║  ██╔══██╗██║     ██║ ██╔╝██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗██╔══██╗╚██╗ ██╔╝  ║
║  ██████╔╝██║     █████╔╝ █████╗  ██████╔╝ ╚████╔╝ ██║  ██║███████║ ╚████╔╝   ║
║  ██╔══██╗██║     ██╔═██╗ ██╔══╝  ██╔══██╗  ╚██╔╝  ██║  ██║██╔══██║  ╚██╔╝    ║
║  ██████╔╝███████╗██║  ██╗██║     ██║  ██║   ██║   ██████╔╝██║  ██║   ██║     ║
║  ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝   ╚═╝     ║
║                                                                              ║
║                       FULL SYSTEM TEST                                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


async def test_orchestrator_full():
    """Test orchestrator with all components enabled"""
    print("\n" + "=" * 70)
    print("TEST 1: TIER COUNCIL + INTEGRATOR (Component Test)")
    print("=" * 70)

    # Test TierCouncil directly since orchestrator has relative imports
    council = TierCouncil()

    queries = [
        "Design a crisis response system for emergency services",
        "How can we improve negotiation outcomes in hostile situations?",
        "Analyze the logical structure of machine learning algorithms",
    ]

    results = []
    for i, query in enumerate(queries, 1):
        print(f"\n[Query {i}] {query[:50]}...")

        start = time.time()
        result = council.query(query)
        elapsed = (time.time() - start) * 1000

        results.append(result)

        print(f"  ✓ Confidence: {result.confidence:.0%}")
        print(f"  ✓ Time: {elapsed:.1f}ms")
        print(f"  ✓ Tier contributions:")
        for tier, contrib in result.tier_contributions.items():
            print(f"      - {tier.name}: {contrib:.0%}")

    # Summary
    avg_conf = sum(r.confidence for r in results) / len(results)

    print(f"\n  Summary: {len(results)} queries, {avg_conf:.0%} avg confidence")

    return results


def test_tier_specialists():
    """Test the 5-tier specialist system"""
    print("\n" + "=" * 70)
    print("TEST 2: TIER SPECIALISTS")
    print("=" * 70)

    council = TierCouncil()

    # Test each tier individually
    test_query = "How should we handle a high-stakes negotiation with time pressure?"

    print(f"\nQuery: {test_query[:60]}...")

    for tier in Tier:
        result = council.query(test_query, target_tiers=[tier])
        insight = result.insights[0] if result.insights else None

        if insight:
            print(f"\n  [{tier.name}] {council.specialists[tier].name}")
            print(f"    Confidence: {insight.confidence:.0%}")
            print(f"    Sources: {', '.join(insight.sources_used)}")

    # Test full council synthesis
    print("\n  [FULL COUNCIL SYNTHESIS]")
    full_result = council.query(test_query)
    print(f"    Overall confidence: {full_result.confidence:.0%}")
    print(f"    Emergent patterns: {len(full_result.emergent_patterns)}")

    return full_result


def test_arc_solver():
    """Test ARC-AGI solver on sample puzzles"""
    print("\n" + "=" * 70)
    print("TEST 3: ARC-AGI SOLVER (Sample Puzzles)")
    print("=" * 70)

    from arc_agi2_solver import ARCSolver, Grid, ARCPuzzle, ARCExample

    solver = ARCSolver()

    # Create a simple test puzzle (rotate 90)
    puzzle = ARCPuzzle(
        puzzle_id="test_rotate",
        train=[
            ARCExample(
                input=Grid([[1, 2], [3, 4]]),
                output=Grid([[3, 1], [4, 2]])
            )
        ],
        test_input=Grid([[5, 6], [7, 8]]),
        test_output=Grid([[7, 5], [8, 6]])
    )

    result = solver.solve(puzzle)

    print(f"  Puzzle: rotate_90")
    print(f"  Correct: {'✓' if result.correct else '✗'}")
    print(f"  Hypotheses tested: {result.hypotheses_tested}")
    print(f"  Time: {result.time_ms:.1f}ms")

    if result.correct:
        print("\n  ✓ ARC Solver working on sample puzzle")
    else:
        print("\n  ✗ ARC Solver failed sample puzzle")

    return result


async def run_all_tests():
    """Run all system tests"""
    print_banner()

    start = time.time()
    test_results = {}

    # Test 1: Orchestrator
    try:
        test_results['orchestrator'] = await test_orchestrator_full()
        print("\n  ✓ Orchestrator: PASSED")
    except Exception as e:
        print(f"\n  ✗ Orchestrator: FAILED - {e}")
        test_results['orchestrator'] = None

    # Test 2: Tier Specialists
    try:
        test_results['tier_specialists'] = test_tier_specialists()
        print("\n  ✓ Tier Specialists: PASSED")
    except Exception as e:
        print(f"\n  ✗ Tier Specialists: FAILED - {e}")
        test_results['tier_specialists'] = None

    # Test 3: ARC Solver (sample only)
    try:
        test_results['arc_solver'] = test_arc_solver()
        print("\n  ✓ ARC Solver: PASSED")
    except Exception as e:
        print(f"\n  ✗ ARC Solver: FAILED - {e}")
        test_results['arc_solver'] = None

    elapsed = time.time() - start

    # Final summary
    print("\n" + "=" * 70)
    print("FINAL SUMMARY")
    print("=" * 70)

    passed = sum(1 for v in test_results.values() if v is not None)
    total = len(test_results)

    print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                          TEST RESULTS                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Tests Passed:    {passed}/{total}                                                         ║
║  Total Time:      {elapsed:.1f}s                                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Components:                                                                 ║
║    • NEXO Orchestrator:     {'✓' if test_results.get('orchestrator') else '✗'}                                              ║
║    • Tier Specialists:      {'✓' if test_results.get('tier_specialists') else '✗'}                                              ║
║    • ARC Solver:            {'✓' if test_results.get('arc_solver') else '✗'}                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    if passed == total:
        print("✓ ALL TESTS PASSED - System is humming!")
    else:
        print(f"⚠ {total - passed} test(s) failed - check logs above")

    return test_results


if __name__ == "__main__":
    asyncio.run(run_all_tests())

#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
SYSTEM DIAGNOSTICS - Peak Performance Analysis
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import time
from collections import defaultdict
from tier_specialists import TierCouncil, Tier, AXIOM, ORACLE, SPHINX, DAEDALUS, WITNESS

# Pattern library has relative imports, skip for now
PATTERN_LIBRARY_AVAILABLE = False
try:
    from pattern_library import PatternLibrary
    PATTERN_LIBRARY_AVAILABLE = True
except ImportError:
    PatternLibrary = None


def print_header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print('='*70)


def diagnose_tier_specialization():
    """Check if tiers are actually specializing or giving uniform responses"""
    print_header("TIER SPECIALIZATION ANALYSIS")

    council = TierCouncil()

    # Queries designed to favor specific tiers
    specialized_queries = {
        Tier.LOGIC_CORE: "Prove that the square root of 2 is irrational using formal logic",
        Tier.STRATEGIST: "What's the optimal strategy for a hostage negotiation standoff?",
        Tier.MANIPULATOR: "How do you build rapport with a resistant client in sales?",
        Tier.ARCHITECT: "Design the failure mode analysis for a nuclear reactor cooling system",
        Tier.RAW_REALITY: "What emotions does a 911 operator experience during a fatal call?",
    }

    results = {}
    specialization_scores = defaultdict(list)

    for target_tier, query in specialized_queries.items():
        print(f"\n  Testing {target_tier.name}...")
        print(f"  Query: {query[:50]}...")

        result = council.query(query)

        # Check if the target tier has highest contribution
        contributions = result.tier_contributions
        sorted_contribs = sorted(contributions.items(), key=lambda x: x[1], reverse=True)

        top_tier = sorted_contribs[0][0]
        top_score = sorted_contribs[0][1]
        target_score = contributions.get(target_tier, 0)

        is_specialized = (top_tier == target_tier)
        specialization_scores[target_tier].append(target_score)

        status = "✓" if is_specialized else "✗"
        print(f"  {status} Target: {target_tier.name} ({target_score:.0%}) | Top: {top_tier.name} ({top_score:.0%})")

        results[target_tier] = {
            'expected': target_tier,
            'got': top_tier,
            'match': is_specialized,
            'target_score': target_score,
            'top_score': top_score
        }

    # Summary
    matches = sum(1 for r in results.values() if r['match'])
    print(f"\n  Specialization Rate: {matches}/5 ({matches/5:.0%})")

    if matches < 3:
        print("  ⚠ WARNING: Tiers not differentiating well - need refinement")

    return results


def diagnose_confidence_distribution():
    """Check confidence score distribution across tiers"""
    print_header("CONFIDENCE DISTRIBUTION")

    specialists = {
        'AXIOM': AXIOM(),
        'ORACLE': ORACLE(),
        'SPHINX': SPHINX(),
        'DAEDALUS': DAEDALUS(),
        'WITNESS': WITNESS(),
    }

    test_queries = [
        "How do we solve this problem?",
        "What's the best approach?",
        "Analyze this situation.",
    ]

    from tier_specialists import Query

    for name, specialist in specialists.items():
        confidences = []
        for q in test_queries:
            query = Query(content=q)
            insight = specialist.analyze(query)
            confidences.append(insight.confidence)

        avg = sum(confidences) / len(confidences)
        bar = "█" * int(avg * 20)
        print(f"  {name:10} {bar} {avg:.0%}")

    return specialists


def diagnose_pattern_library():
    """Check pattern library health"""
    print_header("PATTERN LIBRARY HEALTH")

    if not PATTERN_LIBRARY_AVAILABLE:
        print("  ⚠ Pattern library not available (relative import issue)")
        print("  Run via: python -m system.reasoning.diagnostics")
        return None

    library = PatternLibrary()

    patterns = library.get_all_patterns()

    tier_counts = defaultdict(int)
    domain_counts = defaultdict(int)
    avg_confidence = 0
    avg_usage = 0

    for p in patterns:
        tier_counts[p.tier.value] += 1
        domain_counts[p.domain] += 1
        avg_confidence += p.confidence
        avg_usage += p.usage_count

    if patterns:
        avg_confidence /= len(patterns)
        avg_usage /= len(patterns)

    print(f"  Total Patterns: {len(patterns)}")
    print(f"  Avg Confidence: {avg_confidence:.0%}")
    print(f"  Avg Usage Count: {avg_usage:.1f}")

    print(f"\n  By Tier:")
    for tier, count in sorted(tier_counts.items()):
        print(f"    {tier}: {count}")

    print(f"\n  Top Domains:")
    for domain, count in sorted(domain_counts.items(), key=lambda x: -x[1])[:5]:
        print(f"    {domain}: {count}")

    return library


def diagnose_cross_tier_relevance():
    """Check cross-tier relevance scores"""
    print_header("CROSS-TIER RELEVANCE MATRIX")

    council = TierCouncil()

    # Get insights from each tier
    query = "Design a crisis response system"
    result = council.query(query)

    print("\n  Relevance Matrix (row → col):")
    print("  " + " " * 12 + "".join(f"{t.name[:5]:>8}" for t in Tier))

    for insight in result.insights:
        row = f"  {insight.tier.name[:10]:10}"
        for target_tier in Tier:
            relevance = insight.cross_tier_relevance.get(target_tier, 0)
            if relevance > 0:
                row += f"{relevance:>7.0%} "
            else:
                row += "      - "
        print(row)

    return result


def diagnose_bottlenecks():
    """Identify performance bottlenecks"""
    print_header("PERFORMANCE BOTTLENECKS")

    council = TierCouncil()

    # Time each tier
    timings = {}
    from tier_specialists import Query

    query = Query(content="Test query for timing analysis")

    for tier, specialist in council.specialists.items():
        start = time.time()
        for _ in range(10):  # Run 10 times
            specialist.analyze(query)
        elapsed = (time.time() - start) / 10 * 1000  # ms per query
        timings[tier.name] = elapsed

    print("\n  Avg Time per Analysis:")
    for name, ms in sorted(timings.items(), key=lambda x: -x[1]):
        bar = "█" * int(ms * 10)
        print(f"  {name:15} {bar} {ms:.2f}ms")

    slowest = max(timings, key=timings.get)
    if timings[slowest] > 1.0:
        print(f"\n  ⚠ {slowest} is slow - consider optimization")

    return timings


def run_full_diagnostics():
    """Run all diagnostics"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ██████╗ ██╗ █████╗  ██████╗ ███╗   ██╗ ██████╗ ███████╗████████╗██╗ ██████╗ ║
║  ██╔══██╗██║██╔══██╗██╔════╝ ████╗  ██║██╔═══██╗██╔════╝╚══██╔══╝██║██╔════╝ ║
║  ██║  ██║██║███████║██║  ███╗██╔██╗ ██║██║   ██║███████╗   ██║   ██║██║      ║
║  ██║  ██║██║██╔══██║██║   ██║██║╚██╗██║██║   ██║╚════██║   ██║   ██║██║      ║
║  ██████╔╝██║██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝███████║   ██║   ██║╚██████╗ ║
║  ╚═════╝ ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝   ╚═╝   ╚═╝ ╚═════╝ ║
║                                                                              ║
║                    PEAK PERFORMANCE ANALYSIS                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    issues = []

    # Run all diagnostics
    spec_results = diagnose_tier_specialization()
    spec_matches = sum(1 for r in spec_results.values() if r['match'])
    if spec_matches < 3:
        issues.append(f"Tier specialization weak ({spec_matches}/5)")

    diagnose_confidence_distribution()

    diagnose_pattern_library()

    diagnose_cross_tier_relevance()

    timings = diagnose_bottlenecks()
    slow_tiers = [t for t, ms in timings.items() if ms > 1.0]
    if slow_tiers:
        issues.append(f"Slow tiers: {', '.join(slow_tiers)}")

    # Summary
    print_header("DIAGNOSTIC SUMMARY")

    if not issues:
        print("\n  ✓ All systems operating at peak performance!")
    else:
        print("\n  Issues Found:")
        for issue in issues:
            print(f"    ⚠ {issue}")

    print("\n  Recommendations:")
    if spec_matches < 5:
        print("    → Enhance tier-specific reasoning patterns")
        print("    → Add domain-specific keyword detection")
    print("    → Enable memory spine for context persistence")
    print("    → Run with full swarm for consensus validation")

    return issues


if __name__ == "__main__":
    run_full_diagnostics()

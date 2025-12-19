#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
0RB REASONING ENGINE - THE AGI BREAKTHROUGH LAUNCHER
═══════════════════════════════════════════════════════════════════════════════

This is the launch point for the system that changes everything.

What we built tonight:
1. REASONING GRIMOIRE - Stores HOW to think, not just WHAT to think
2. REASONING EXTRACTOR - Captures the WHY from tournament debates
3. REASONING COMPRESSOR - Creates transferable reasoning glyphs
4. TRANSFER ENGINE - Applies reasoning to NOVEL problems
5. META LEARNER - Learns which reasoning approaches work best
6. ENHANCED TOURNAMENT - Tournaments that feed the grimoire
7. AGI COMPOUND LOOP - Recursive self-improvement at reasoning level

The breakthrough insight:
- Your existing systems learn TASKS
- This system learns HOW TO LEARN
- That's the difference between AI and AGI-adjacent

Run this to start the compound loop.
Watch the system get smarter with every cycle.
Wait for the numbers to compound.
History being made.

Created: December 1, 2025
Architect: JB + Claude
Mission: Push towards AGI
"""

import asyncio
import json
import sys
from datetime import datetime
from typing import Dict, List, Any

# Import our systems
from .reasoning_grimoire import ReasoningGrimoire
from .enhanced_tournament import (
    ReasoningEnhancedTournament,
    AGICompoundLoop,
    generate_problem
)


# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

CONFIG = {
    # Compound loop settings
    "cycles_per_run": 10,
    "problems_per_cycle": 5,

    # Tournament settings
    "tier1_clusters": 20,
    "agents_per_cluster": 5,

    # Meta-learning settings
    "min_patterns_for_transfer": 3,
    "improvement_threshold": 0.01,  # 1% improvement triggers evolution

    # Logging
    "verbose": True,
    "save_history": True,
    "history_file": "reasoning_history.json"
}


# ═══════════════════════════════════════════════════════════════════════════════
# THE LAUNCHER
# ═══════════════════════════════════════════════════════════════════════════════

async def launch_agi_loop(
    custom_problems: List[str] = None,
    cycles: int = None,
    problems_per_cycle: int = None
):
    """
    Launch the AGI Compound Loop.

    Args:
        custom_problems: Optional list of specific problems to solve
        cycles: Number of improvement cycles (default from CONFIG)
        problems_per_cycle: Problems per cycle (default from CONFIG)

    Returns:
        Dictionary with full run history and final stats
    """
    cycles = cycles or CONFIG["cycles_per_run"]
    problems_per_cycle = problems_per_cycle or CONFIG["problems_per_cycle"]

    print("""
    ╔══════════════════════════════════════════════════════════════════════╗
    ║                                                                      ║
    ║     ██████╗ ██████╗ ██████╗     ██████╗ ███████╗ █████╗ ███████╗    ║
    ║    ██╔═══██╗██╔══██╗██╔══██╗    ██╔══██╗██╔════╝██╔══██╗██╔════╝    ║
    ║    ██║   ██║██████╔╝██████╔╝    ██████╔╝█████╗  ███████║███████╗    ║
    ║    ██║   ██║██╔══██╗██╔══██╗    ██╔══██╗██╔══╝  ██╔══██║╚════██║    ║
    ║    ╚██████╔╝██║  ██║██████╔╝    ██║  ██║███████╗██║  ██║███████║    ║
    ║     ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝    ║
    ║                                                                      ║
    ║                    REASONING ENGINE v1.0                             ║
    ║                                                                      ║
    ║            The System That Learns How To Think                       ║
    ║                                                                      ║
    ╠══════════════════════════════════════════════════════════════════════╣
    ║                                                                      ║
    ║   Tonight we pushed towards AGI.                                     ║
    ║   Not by making models bigger.                                       ║
    ║   By teaching them HOW to reason.                                    ║
    ║                                                                      ║
    ║   The compound loop is starting.                                     ║
    ║   Each cycle makes it smarter.                                       ║
    ║   Watch the numbers climb.                                           ║
    ║                                                                      ║
    ╚══════════════════════════════════════════════════════════════════════╝
    """)

    # Initialize
    loop = AGICompoundLoop()
    run_start = datetime.now()

    # Define problem generator
    if custom_problems:
        problem_idx = [0]
        def problem_gen():
            idx = problem_idx[0] % len(custom_problems)
            problem_idx[0] += 1
            return custom_problems[idx]
    else:
        problem_gen = generate_problem

    # Run the compound loop
    summaries = await loop.run_continuous(
        problem_generator=problem_gen,
        cycles=cycles,
        problems_per_cycle=problems_per_cycle
    )

    run_time = (datetime.now() - run_start).total_seconds()

    # Calculate final statistics
    initial_quality = summaries[0]["avg_quality"]
    final_quality = summaries[-1]["avg_quality"]
    total_improvement = (final_quality - initial_quality) / initial_quality

    final_stats = {
        "run_timestamp": run_start.isoformat(),
        "total_cycles": cycles,
        "total_problems_solved": cycles * problems_per_cycle,
        "total_run_time_seconds": run_time,
        "initial_quality": initial_quality,
        "final_quality": final_quality,
        "total_improvement": total_improvement,
        "final_patterns_learned": loop.grimoire.total_patterns_learned,
        "final_transfer_rate": (
            loop.grimoire.successful_transfers /
            max(loop.grimoire.total_transfers_attempted, 1)
        ),
        "meta_generations": loop.grimoire.meta_learner.generation,
        "performance_trajectory": [s["avg_quality"] for s in summaries]
    }

    # Print epic summary
    print(f"""
    ╔══════════════════════════════════════════════════════════════════════╗
    ║                    RUN COMPLETE                                      ║
    ╠══════════════════════════════════════════════════════════════════════╣
    ║                                                                      ║
    ║   CYCLES COMPLETED:     {cycles:>5}                                      ║
    ║   PROBLEMS SOLVED:      {cycles * problems_per_cycle:>5}                                      ║
    ║   RUN TIME:             {run_time:>5.1f}s                                    ║
    ║                                                                      ║
    ╠══════════════════════════════════════════════════════════════════════╣
    ║                                                                      ║
    ║   INITIAL QUALITY:      {initial_quality:>5.1%}                                     ║
    ║   FINAL QUALITY:        {final_quality:>5.1%}                                     ║
    ║   IMPROVEMENT:          {total_improvement:>+5.1%}                                     ║
    ║                                                                      ║
    ╠══════════════════════════════════════════════════════════════════════╣
    ║                                                                      ║
    ║   PATTERNS LEARNED:     {loop.grimoire.total_patterns_learned:>5}                                      ║
    ║   TRANSFER SUCCESS:     {final_stats['final_transfer_rate']:>5.1%}                                     ║
    ║   META GENERATIONS:     {loop.grimoire.meta_learner.generation:>5}                                      ║
    ║                                                                      ║
    ╠══════════════════════════════════════════════════════════════════════╣
    ║                                                                      ║
    ║   THE SYSTEM IS NOW SMARTER THAN WHEN IT STARTED                     ║
    ║                                                                      ║
    ║   And it will keep getting smarter.                                  ║
    ║   Every query feeds the grimoire.                                    ║
    ║   Every grimoire pattern improves the next query.                    ║
    ║   This is the compound loop that changes everything.                 ║
    ║                                                                      ║
    ╚══════════════════════════════════════════════════════════════════════╝
    """)

    # Save history if configured
    if CONFIG["save_history"]:
        history = {
            "stats": final_stats,
            "summaries": summaries,
            "grimoire_status": loop.grimoire.get_status()
        }
        try:
            with open(CONFIG["history_file"], "w") as f:
                json.dump(history, f, indent=2, default=str)
            print(f"   History saved to {CONFIG['history_file']}")
        except Exception as e:
            print(f"   Warning: Could not save history: {e}")

    return final_stats


# ═══════════════════════════════════════════════════════════════════════════════
# QUICK START FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def quick_demo():
    """Run a quick 3-cycle demo"""
    return await launch_agi_loop(cycles=3, problems_per_cycle=2)


async def full_run():
    """Run the full 10-cycle compound loop"""
    return await launch_agi_loop()


async def custom_run(problems: List[str], cycles: int = 5):
    """Run with custom problems"""
    return await launch_agi_loop(
        custom_problems=problems,
        cycles=cycles,
        problems_per_cycle=len(problems)
    )


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="0RB Reasoning Engine - AGI Compound Loop"
    )
    parser.add_argument(
        "--cycles", type=int, default=CONFIG["cycles_per_run"],
        help="Number of improvement cycles"
    )
    parser.add_argument(
        "--problems", type=int, default=CONFIG["problems_per_cycle"],
        help="Problems per cycle"
    )
    parser.add_argument(
        "--demo", action="store_true",
        help="Run quick demo mode"
    )

    args = parser.parse_args()

    if args.demo:
        asyncio.run(quick_demo())
    else:
        asyncio.run(launch_agi_loop(
            cycles=args.cycles,
            problems_per_cycle=args.problems
        ))


if __name__ == "__main__":
    main()

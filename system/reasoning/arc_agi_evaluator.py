"""
═══════════════════════════════════════════════════════════════════════════════
ARC-AGI OFFICIAL BENCHMARK EVALUATOR
═══════════════════════════════════════════════════════════════════════════════

Runs our solver against the official ARC-AGI evaluation dataset.
No cheating - real puzzles, real evaluation.
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import sys

# Import our solver - add path if needed
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from arc_agi2_solver import Grid, ARCSolver, ARCPuzzle, ARCExample


@dataclass
class EvalResult:
    puzzle_id: str
    correct: bool
    predicted: Optional[List[List[int]]]
    expected: List[List[int]]
    num_train_examples: int
    hypothesis_used: Optional[str]
    time_ms: float


def load_arc_puzzle(filepath: str) -> Dict:
    """Load a puzzle from JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)


def convert_to_solver_format(puzzle_data: Dict, puzzle_id: str) -> ARCPuzzle:
    """Convert ARC JSON format to our solver's format"""
    train_examples = []

    for train_ex in puzzle_data['train']:
        train_examples.append(ARCExample(
            input=Grid(train_ex['input']),
            output=Grid(train_ex['output'])
        ))

    # Use first test case
    test_case = puzzle_data['test'][0]
    test_input = Grid(test_case['input'])
    test_output = Grid(test_case['output']) if 'output' in test_case else None

    return ARCPuzzle(
        puzzle_id=puzzle_id,
        train=train_examples,
        test_input=test_input,
        test_output=test_output
    )


def evaluate_single_puzzle(solver: ARCSolver, filepath: str) -> EvalResult:
    """Evaluate solver on a single puzzle"""
    start = datetime.now()
    puzzle_id = Path(filepath).stem

    try:
        puzzle_data = load_arc_puzzle(filepath)
        puzzle = convert_to_solver_format(puzzle_data, puzzle_id)

        # Run solver
        result = solver.solve(puzzle)

        # Check correctness
        expected = puzzle_data['test'][0]['output']

        if result.predicted_output is not None:
            pred_list = result.predicted_output.data
            # Handle both list and numpy array comparisons
            try:
                if hasattr(pred_list, 'tolist'):
                    pred_list = pred_list.tolist()
                correct = pred_list == expected
            except ValueError:
                # Numpy array comparison issue
                correct = False
        else:
            pred_list = None
            correct = False

        elapsed = (datetime.now() - start).total_seconds() * 1000

        return EvalResult(
            puzzle_id=puzzle_id,
            correct=correct,
            predicted=pred_list,
            expected=expected,
            num_train_examples=len(puzzle_data['train']),
            hypothesis_used=str(result.hypothesis) if result.hypothesis else None,
            time_ms=elapsed
        )

    except Exception as e:
        import traceback
        elapsed = (datetime.now() - start).total_seconds() * 1000
        return EvalResult(
            puzzle_id=puzzle_id,
            correct=False,
            predicted=None,
            expected=[],
            num_train_examples=0,
            hypothesis_used=f"ERROR: {str(e)}\n{traceback.format_exc()}",
            time_ms=elapsed
        )


def run_evaluation(data_dir: str, limit: Optional[int] = None, verbose: bool = True) -> Tuple[List[EvalResult], Dict]:
    """Run full evaluation on ARC-AGI dataset"""

    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ARC-AGI OFFICIAL BENCHMARK EVALUATION                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    solver = ARCSolver()
    results = []

    # Get all puzzle files
    puzzle_files = sorted(Path(data_dir).glob("*.json"))
    total = len(puzzle_files)

    if limit:
        puzzle_files = puzzle_files[:limit]
        print(f"Running on {limit}/{total} puzzles (limited)")
    else:
        print(f"Running on all {total} puzzles")

    print("=" * 70)

    correct_count = 0

    for i, filepath in enumerate(puzzle_files):
        result = evaluate_single_puzzle(solver, str(filepath))
        results.append(result)

        if result.correct:
            correct_count += 1
            status = "✓"
        else:
            status = "✗"

        if verbose:
            pct = (i + 1) / len(puzzle_files) * 100
            running_acc = correct_count / (i + 1) * 100
            print(f"[{i+1:3d}/{len(puzzle_files)}] {status} {result.puzzle_id} "
                  f"({result.time_ms:.0f}ms) | Running: {running_acc:.1f}%")
        elif (i + 1) % 50 == 0:
            print(f"Progress: {i+1}/{len(puzzle_files)} ({correct_count} correct so far)")

    # Calculate stats
    total_evaluated = len(results)
    accuracy = correct_count / total_evaluated * 100 if total_evaluated > 0 else 0
    avg_time = sum(r.time_ms for r in results) / len(results) if results else 0

    stats = {
        'total_puzzles': total_evaluated,
        'correct': correct_count,
        'accuracy': accuracy,
        'avg_time_ms': avg_time,
    }

    # Print summary
    print("\n" + "=" * 70)
    print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                              FINAL RESULTS                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Puzzles Evaluated: {total_evaluated:>4}                                                   ║
║  Correct:           {correct_count:>4}                                                   ║
║  Accuracy:          {accuracy:>5.1f}%                                                  ║
║  Avg Time/Puzzle:   {avg_time:>6.1f}ms                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    # Comparison context
    print("""
CONTEXT (ARC-AGI-2 Public Leaderboard):
  • Gemini 3 Deep Think:  ~45%
  • GPT-5:                ~10%
  • Claude Opus 4:        ~9%
  • Human average:        ~85%
    """)

    return results, stats


def analyze_failures(results: List[EvalResult], top_n: int = 10):
    """Analyze what types of puzzles we're failing"""
    failures = [r for r in results if not r.correct]

    print(f"\n{'='*70}")
    print(f"FAILURE ANALYSIS ({len(failures)} failures)")
    print('='*70)

    for r in failures[:top_n]:
        print(f"\n{r.puzzle_id}:")
        print(f"  Train examples: {r.num_train_examples}")
        print(f"  Hypothesis: {r.hypothesis_used}")
        if r.predicted:
            print(f"  Predicted shape: {len(r.predicted)}x{len(r.predicted[0]) if r.predicted else 0}")
        print(f"  Expected shape: {len(r.expected)}x{len(r.expected[0]) if r.expected else 0}")


if __name__ == "__main__":
    # Default paths
    EVAL_DIR = "/tmp/ARC-AGI/data/evaluation"
    TRAIN_DIR = "/tmp/ARC-AGI/data/training"

    # Parse args
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--dir', default=EVAL_DIR, help='Path to puzzle directory')
    parser.add_argument('--limit', type=int, default=None, help='Limit number of puzzles')
    parser.add_argument('--quiet', action='store_true', help='Less verbose output')
    parser.add_argument('--training', action='store_true', help='Use training set instead')
    args = parser.parse_args()

    data_dir = TRAIN_DIR if args.training else args.dir

    results, stats = run_evaluation(data_dir, limit=args.limit, verbose=not args.quiet)
    analyze_failures(results)

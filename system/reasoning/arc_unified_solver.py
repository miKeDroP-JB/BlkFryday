#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ARC UNIFIED SOLVER - All Components Working Together
═══════════════════════════════════════════════════════════════════════════════

Integrates:
- DSL primitives for object manipulation
- Abstraction extraction for pattern discovery
- Program synthesis for rule learning
- Reasoning Grimoire for chain storage
- Pattern learner for hypothesis prioritization

"The whole is greater than the sum of its parts."
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple
import time
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from arc_dsl import DSLProgram, DSLExecutor, ObjectExtractor
from arc_abstractions import AbstractionExtractor, GridAbstractions
from arc_synthesizer import ProgramSynthesizer, SynthesisResult, DifferenceAnalyzer

# Try to import existing components
try:
    from reasoning_grimoire import ReasoningGrimoire as Grimoire
    GRIMOIRE_AVAILABLE = True
except ImportError:
    Grimoire = None
    GRIMOIRE_AVAILABLE = False

try:
    from pattern_learner import PatternLearner
    PATTERN_LEARNER_AVAILABLE = True
except ImportError:
    PatternLearner = None
    PATTERN_LEARNER_AVAILABLE = False


# ═══════════════════════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class ARCExample:
    """A training example"""
    input: np.ndarray
    output: np.ndarray


@dataclass
class ARCPuzzle:
    """An ARC puzzle"""
    puzzle_id: str
    train: List[ARCExample]
    test_input: np.ndarray
    test_output: Optional[np.ndarray] = None


@dataclass
class UnifiedSolveResult:
    """Result from the unified solver"""
    puzzle_id: str
    success: bool
    predicted_output: Optional[np.ndarray]
    correct: bool
    method: str  # Which method succeeded
    program: Optional[DSLProgram]
    confidence: float
    time_ms: float
    details: Dict[str, Any] = field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════════════════════
# UNIFIED SOLVER
# ═══════════════════════════════════════════════════════════════════════════════

class ARCUnifiedSolver:
    """
    Unified ARC solver that combines all components.

    Solving strategy (in order of priority):
    1. Check Grimoire for known solutions
    2. Try program synthesis on abstractions
    3. Fall back to transform enumeration
    4. Record successful solutions to Grimoire
    """

    def __init__(self, use_grimoire: bool = True, use_learner: bool = True):
        self.synthesizer = ProgramSynthesizer()
        self.executor = DSLExecutor()

        # Initialize grimoire
        self.use_grimoire = use_grimoire and GRIMOIRE_AVAILABLE
        if self.use_grimoire:
            self.grimoire = Grimoire()
        else:
            self.grimoire = None

        # Initialize pattern learner
        self.use_learner = use_learner and PATTERN_LEARNER_AVAILABLE
        if self.use_learner:
            self.learner = PatternLearner()
        else:
            self.learner = None

        self.stats = {
            'puzzles_attempted': 0,
            'puzzles_solved': 0,
            'solved_by_grimoire': 0,
            'solved_by_synthesis': 0,
            'solved_by_enumeration': 0
        }

    def solve(self, puzzle: ARCPuzzle) -> UnifiedSolveResult:
        """
        Solve an ARC puzzle using all available methods.
        """
        start_time = time.time()
        self.stats['puzzles_attempted'] += 1

        # Extract features for grimoire lookup
        features = self._extract_puzzle_features(puzzle)

        # Strategy 1: Check grimoire for known solutions
        if self.grimoire:
            grimoire_result = self._try_grimoire(puzzle, features)
            if grimoire_result and grimoire_result.success:
                self.stats['solved_by_grimoire'] += 1
                return grimoire_result

        # Strategy 2: Program synthesis
        synthesis_result = self._try_synthesis(puzzle)
        if synthesis_result and synthesis_result.success:
            self.stats['solved_by_synthesis'] += 1
            self.stats['puzzles_solved'] += 1

            # Record to grimoire
            if self.grimoire and synthesis_result.program:
                self._record_to_grimoire(puzzle, synthesis_result, features)

            return synthesis_result

        # Strategy 3: Enumeration fallback (use existing solver)
        enum_result = self._try_enumeration(puzzle)
        if enum_result and enum_result.success:
            self.stats['solved_by_enumeration'] += 1
            self.stats['puzzles_solved'] += 1
            return enum_result

        # Failed
        elapsed = (time.time() - start_time) * 1000
        return UnifiedSolveResult(
            puzzle_id=puzzle.puzzle_id,
            success=False,
            predicted_output=None,
            correct=False,
            method='none',
            program=None,
            confidence=0.0,
            time_ms=elapsed
        )

    def _extract_puzzle_features(self, puzzle: ARCPuzzle) -> Dict:
        """Extract features for grimoire matching"""
        features = {'puzzle_id': puzzle.puzzle_id}

        if puzzle.train:
            inp = puzzle.train[0].input
            out = puzzle.train[0].output

            features['input_shape'] = inp.shape
            features['output_shape'] = out.shape
            features['shape_change'] = 'same' if inp.shape == out.shape else 'different'

            # Analyze difference
            diff = DifferenceAnalyzer.analyze(inp, out)
            features['has_color_change'] = bool(diff.colors_changed)
            features['has_scale'] = diff.scale_factor is not None
            features['has_symmetry_added'] = bool(diff.symmetry_added)

            # Extract abstractions
            inp_abs = AbstractionExtractor.extract(inp)
            features['input_object_count'] = len(inp_abs.objects)
            features['input_has_symmetry'] = any(
                s.symmetry_type.name != 'NONE' for s in inp_abs.symmetries
            )

        return features

    def _try_grimoire(self, puzzle: ARCPuzzle, features: Dict) -> Optional[UnifiedSolveResult]:
        """Try to find solution in grimoire"""
        if not self.grimoire:
            return None

        # Look up similar chains
        similar = self.grimoire.consult(features)
        if not similar:
            return None

        # Try each similar chain
        for chain, score in similar[:3]:
            try:
                # Apply chain's program
                program = self._chain_to_program(chain)
                if program:
                    # Test on training examples
                    all_match = True
                    for example in puzzle.train:
                        result = self.executor.execute(example.input, program)
                        if not np.array_equal(result, example.output):
                            all_match = False
                            break

                    if all_match:
                        # Apply to test
                        predicted = self.executor.execute(puzzle.test_input, program)
                        correct = False
                        if puzzle.test_output is not None:
                            correct = np.array_equal(predicted, puzzle.test_output)

                        return UnifiedSolveResult(
                            puzzle_id=puzzle.puzzle_id,
                            success=True,
                            predicted_output=predicted,
                            correct=correct,
                            method='grimoire',
                            program=program,
                            confidence=score,
                            time_ms=0,
                            details={'chain_id': chain.chain_id if hasattr(chain, 'chain_id') else 'unknown'}
                        )
            except Exception:
                continue

        return None

    def _chain_to_program(self, chain) -> Optional[DSLProgram]:
        """Convert a grimoire chain to a DSL program"""
        # This would need to be implemented based on how chains are stored
        return None

    def _try_synthesis(self, puzzle: ARCPuzzle) -> Optional[UnifiedSolveResult]:
        """Try program synthesis"""
        start_time = time.time()

        # Convert examples for synthesizer
        examples = [(ex.input, ex.output) for ex in puzzle.train]

        # Run synthesis
        result = self.synthesizer.synthesize_from_examples(examples, max_programs=500)

        if result.success and result.program:
            # Apply to test input
            try:
                predicted = self.executor.execute(puzzle.test_input, result.program)
                correct = False
                if puzzle.test_output is not None:
                    correct = np.array_equal(predicted, puzzle.test_output)

                elapsed = (time.time() - start_time) * 1000
                return UnifiedSolveResult(
                    puzzle_id=puzzle.puzzle_id,
                    success=True,
                    predicted_output=predicted,
                    correct=correct,
                    method='synthesis',
                    program=result.program,
                    confidence=0.9,
                    time_ms=elapsed,
                    details={'programs_tested': result.programs_tested}
                )
            except Exception:
                pass

        return None

    def _try_enumeration(self, puzzle: ARCPuzzle) -> Optional[UnifiedSolveResult]:
        """Fall back to enumeration"""
        # Import existing solver
        try:
            from arc_agi2_solver import ARCSolver as LegacySolver, ARCPuzzle as LegacyPuzzle, ARCExample as LegacyExample
            from arc_agi2_solver import Grid

            # Convert puzzle
            legacy_examples = []
            for ex in puzzle.train:
                legacy_examples.append(LegacyExample(
                    input=Grid(ex.input),
                    output=Grid(ex.output)
                ))

            legacy_puzzle = LegacyPuzzle(
                puzzle_id=puzzle.puzzle_id,
                train=legacy_examples,
                test_input=Grid(puzzle.test_input),
                test_output=Grid(puzzle.test_output) if puzzle.test_output is not None else None
            )

            solver = LegacySolver(use_learning=self.use_learner)
            result = solver.solve(legacy_puzzle)

            if result.predicted_output:
                return UnifiedSolveResult(
                    puzzle_id=puzzle.puzzle_id,
                    success=True,
                    predicted_output=result.predicted_output.data if hasattr(result.predicted_output, 'data') else result.predicted_output,
                    correct=result.correct,
                    method='enumeration',
                    program=None,
                    confidence=result.hypothesis.confidence if result.hypothesis else 0.5,
                    time_ms=result.time_ms,
                    details={'hypothesis': str(result.hypothesis) if result.hypothesis else None}
                )
        except Exception as e:
            pass

        return None

    def _record_to_grimoire(self, puzzle: ARCPuzzle, result: UnifiedSolveResult, features: Dict):
        """Record successful solution to grimoire"""
        if not self.grimoire or not result.program:
            return

        # Create reasoning chain
        steps = []
        for i, instr in enumerate(result.program.instructions):
            steps.append({
                'step_id': i,
                'tier': 'DSL',
                'operation': str(instr.op.name),
                'confidence': 0.9,
                'justification': f"DSL operation: {instr}"
            })

        try:
            self.grimoire.record_chain(
                problem_type='arc_puzzle',
                problem_signature=features,
                steps=steps,
                success=result.correct,
                confidence=result.confidence
            )
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════════════════════

def test_unified_solver():
    """Test the unified solver"""
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ARC UNIFIED SOLVER TEST                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    solver = ARCUnifiedSolver(use_grimoire=False, use_learner=False)

    # Test 1: Rotation puzzle
    print("[Test 1] Rotation puzzle...")
    puzzle1 = ARCPuzzle(
        puzzle_id="rotate_90",
        train=[
            ARCExample(
                input=np.array([[1, 2], [3, 4]]),
                output=np.array([[3, 1], [4, 2]])
            ),
            ARCExample(
                input=np.array([[5, 6], [7, 8]]),
                output=np.array([[7, 5], [8, 6]])
            ),
        ],
        test_input=np.array([[1, 0], [0, 1]]),
        test_output=np.array([[0, 1], [1, 0]])
    )

    result1 = solver.solve(puzzle1)
    print(f"  Success: {result1.success}")
    print(f"  Method: {result1.method}")
    print(f"  Correct: {result1.correct}")
    if result1.program:
        print(f"  Program: {result1.program}")

    # Test 2: Flip puzzle
    print("\n[Test 2] Horizontal flip puzzle...")
    puzzle2 = ARCPuzzle(
        puzzle_id="flip_h",
        train=[
            ARCExample(
                input=np.array([[1, 2, 3], [4, 5, 6]]),
                output=np.array([[3, 2, 1], [6, 5, 4]])
            ),
        ],
        test_input=np.array([[7, 8], [9, 0]]),
        test_output=np.array([[8, 7], [0, 9]])
    )

    result2 = solver.solve(puzzle2)
    print(f"  Success: {result2.success}")
    print(f"  Method: {result2.method}")
    print(f"  Correct: {result2.correct}")

    # Test 3: Color change puzzle
    print("\n[Test 3] Color change puzzle...")
    puzzle3 = ARCPuzzle(
        puzzle_id="recolor",
        train=[
            ARCExample(
                input=np.array([[1, 0, 1], [0, 1, 0]]),
                output=np.array([[3, 0, 3], [0, 3, 0]])
            ),
        ],
        test_input=np.array([[1, 1], [1, 0]]),
        test_output=np.array([[3, 3], [3, 0]])
    )

    result3 = solver.solve(puzzle3)
    print(f"  Success: {result3.success}")
    print(f"  Method: {result3.method}")
    print(f"  Correct: {result3.correct}")

    # Summary
    print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                           RESULTS                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Puzzles Attempted:  {solver.stats['puzzles_attempted']}                                                        ║
║  Puzzles Solved:     {solver.stats['puzzles_solved']}                                                        ║
║  By Synthesis:       {solver.stats['solved_by_synthesis']}                                                        ║
║  By Enumeration:     {solver.stats['solved_by_enumeration']}                                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)

    return solver


if __name__ == "__main__":
    test_unified_solver()

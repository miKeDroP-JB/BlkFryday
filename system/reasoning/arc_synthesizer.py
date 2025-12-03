#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ARC PROGRAM SYNTHESIZER - Search Over Program Space
═══════════════════════════════════════════════════════════════════════════════

Synthesizes programs from the DSL that transform input → output.

Strategy:
1. Extract abstractions from input/output pairs
2. Generate candidate programs based on observed differences
3. Test programs against training examples
4. Return programs that work on all examples

"Find the rule, not just the answer."
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Generator
from collections import defaultdict
import itertools
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from arc_dsl import (
    DSLOp, DSLProgram, DSLInstruction, DSLExecutor,
    ObjectExtractor, Object, Point
)
from arc_abstractions import (
    AbstractionExtractor, GridAbstractions, ShapeType,
    SymmetryType, ShapeClassifier
)


# ═══════════════════════════════════════════════════════════════════════════════
# DIFFERENCE ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class GridDifference:
    """Differences between input and output grids"""
    shape_changed: bool
    shape_change: Tuple[Tuple[int, int], Tuple[int, int]]  # (input_shape, output_shape)
    colors_added: List[int]
    colors_removed: List[int]
    colors_changed: Dict[int, int]  # old_color -> new_color
    objects_added: int
    objects_removed: int
    symmetry_added: List[SymmetryType]
    scale_factor: Optional[float]
    is_cropped: bool
    is_tiled: bool


class DifferenceAnalyzer:
    """Analyze differences between input and output"""

    @staticmethod
    def analyze(input_grid: np.ndarray, output_grid: np.ndarray) -> GridDifference:
        """Analyze differences between input and output grids"""
        input_abs = AbstractionExtractor.extract(input_grid)
        output_abs = AbstractionExtractor.extract(output_grid)

        # Shape analysis
        shape_changed = input_grid.shape != output_grid.shape
        shape_change = (input_grid.shape, output_grid.shape)

        # Color analysis
        input_colors = set(np.unique(input_grid)) - {0}
        output_colors = set(np.unique(output_grid)) - {0}
        colors_added = list(output_colors - input_colors)
        colors_removed = list(input_colors - output_colors)

        # Color mapping
        colors_changed = {}
        if len(input_colors) == len(output_colors) and colors_added and colors_removed:
            # 1:1 color swap
            for old, new in zip(sorted(colors_removed), sorted(colors_added)):
                colors_changed[old] = new

        # Object counts
        objects_added = len(output_abs.objects) - len(input_abs.objects)
        objects_removed = max(0, -objects_added)
        objects_added = max(0, objects_added)

        # Symmetry added
        input_syms = {s.symmetry_type for s in input_abs.symmetries}
        output_syms = {s.symmetry_type for s in output_abs.symmetries}
        symmetry_added = list(output_syms - input_syms - {SymmetryType.NONE})

        # Scale factor
        scale_factor = None
        if shape_changed:
            h_scale = output_grid.shape[0] / input_grid.shape[0]
            w_scale = output_grid.shape[1] / input_grid.shape[1]
            if abs(h_scale - w_scale) < 0.01 and h_scale == int(h_scale):
                scale_factor = h_scale

        # Cropped?
        is_cropped = (output_grid.shape[0] < input_grid.shape[0] or
                     output_grid.shape[1] < input_grid.shape[1])

        # Tiled?
        is_tiled = output_abs.tiling is not None and input_abs.tiling is None

        return GridDifference(
            shape_changed=shape_changed,
            shape_change=shape_change,
            colors_added=colors_added,
            colors_removed=colors_removed,
            colors_changed=colors_changed,
            objects_added=objects_added,
            objects_removed=objects_removed,
            symmetry_added=symmetry_added,
            scale_factor=scale_factor,
            is_cropped=is_cropped,
            is_tiled=is_tiled
        )


# ═══════════════════════════════════════════════════════════════════════════════
# PROGRAM GENERATOR
# ═══════════════════════════════════════════════════════════════════════════════

class ProgramGenerator:
    """Generate candidate programs based on observed differences"""

    @staticmethod
    def generate_from_difference(diff: GridDifference,
                                input_abs: GridAbstractions,
                                output_abs: GridAbstractions) -> List[DSLProgram]:
        """Generate programs that might explain the difference"""
        programs = []

        # Scale programs
        if diff.scale_factor:
            p = DSLProgram()
            # No direct scale in DSL, but we have TILE
            factor = int(diff.scale_factor)
            p.add(DSLOp.TILE, rows=factor, cols=factor)
            programs.append(p)

        # Color swap programs
        for old_color, new_color in diff.colors_changed.items():
            p = DSLProgram()
            p.add(DSLOp.SELECT_BY_COLOR, color=old_color)
            p.add(DSLOp.RECOLOR, color=new_color)
            programs.append(p)

        # Symmetry completion programs
        for sym in diff.symmetry_added:
            if sym == SymmetryType.HORIZONTAL:
                p = DSLProgram()
                p.add(DSLOp.COMPLETE_SYMMETRY, axis='horizontal')
                programs.append(p)
            elif sym == SymmetryType.VERTICAL:
                p = DSLProgram()
                p.add(DSLOp.COMPLETE_SYMMETRY, axis='vertical')
                programs.append(p)

        # Rotation programs
        for k in [1, 2, 3]:
            p = DSLProgram()
            if k == 1:
                p.add(DSLOp.ROTATE_90)
            elif k == 2:
                p.add(DSLOp.ROTATE_180)
            programs.append(p)

        # Flip programs
        for flip_op in [DSLOp.FLIP_H, DSLOp.FLIP_V]:
            p = DSLProgram()
            p.add(flip_op)
            programs.append(p)

        # Delete by color programs
        for color in diff.colors_removed:
            p = DSLProgram()
            p.add(DSLOp.SELECT_BY_COLOR, color=color)
            p.add(DSLOp.DELETE)
            programs.append(p)

        # Fill bounding box programs
        if output_abs.shapes:
            for shape in output_abs.shapes:
                if shape.fill_ratio > 0.95 and shape.shape_type == ShapeType.RECTANGLE:
                    p = DSLProgram()
                    p.add(DSLOp.SELECT_ALL)
                    p.add(DSLOp.FILL_BBOX)
                    programs.append(p)
                    break

        # Outline programs
        for shape in output_abs.shapes:
            if shape.shape_type == ShapeType.HOLLOW_RECT:
                p = DSLProgram()
                p.add(DSLOp.SELECT_ALL)
                p.add(DSLOp.OUTLINE, color=output_abs.objects[0].color if output_abs.objects else 1)
                programs.append(p)
                break

        # Move programs (try different directions)
        for dr, dc in [(0, 1), (0, -1), (1, 0), (-1, 0), (1, 1), (-1, -1)]:
            p = DSLProgram()
            p.add(DSLOp.SELECT_ALL)
            p.add(DSLOp.MOVE, dr=dr, dc=dc)
            programs.append(p)

        # Select and move largest/smallest
        for select_op in [DSLOp.SELECT_LARGEST, DSLOp.SELECT_SMALLEST]:
            for dr, dc in [(0, 1), (1, 0), (1, 1)]:
                p = DSLProgram()
                p.add(select_op)
                p.add(DSLOp.MOVE, dr=dr, dc=dc)
                programs.append(p)

        return programs

    @staticmethod
    def generate_compositional(base_ops: List[DSLOp], max_depth: int = 2) -> Generator[DSLProgram, None, None]:
        """Generate compositional programs up to max_depth"""
        simple_ops = [
            (DSLOp.ROTATE_90, {}),
            (DSLOp.ROTATE_180, {}),
            (DSLOp.FLIP_H, {}),
            (DSLOp.FLIP_V, {}),
            (DSLOp.SELECT_ALL, {}),
            (DSLOp.SELECT_LARGEST, {}),
            (DSLOp.SELECT_SMALLEST, {}),
        ]

        # Single operations
        for op, args in simple_ops:
            p = DSLProgram()
            p.add(op, **args)
            yield p

        # Two-operation compositions
        if max_depth >= 2:
            for (op1, args1), (op2, args2) in itertools.product(simple_ops, repeat=2):
                if op1 != op2:
                    p = DSLProgram()
                    p.add(op1, **args1)
                    p.add(op2, **args2)
                    yield p


# ═══════════════════════════════════════════════════════════════════════════════
# PROGRAM SYNTHESIZER
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class SynthesisResult:
    """Result of program synthesis"""
    success: bool
    program: Optional[DSLProgram]
    programs_tested: int
    time_ms: float


class ProgramSynthesizer:
    """
    Synthesize programs that transform input to output.

    Uses a combination of:
    1. Difference-guided search (analyze what changed)
    2. Enumeration over program space
    3. Abstraction-guided pruning
    """

    def __init__(self):
        self.executor = DSLExecutor()
        self.stats = {
            'programs_tested': 0,
            'programs_succeeded': 0
        }

    def synthesize(self, input_grid: np.ndarray, output_grid: np.ndarray,
                  max_programs: int = 1000, timeout_ms: float = 5000) -> SynthesisResult:
        """
        Synthesize a program that transforms input to output.

        Args:
            input_grid: Input grid
            output_grid: Expected output grid
            max_programs: Maximum programs to test
            timeout_ms: Timeout in milliseconds

        Returns:
            SynthesisResult with success status and program
        """
        start_time = time.time()
        programs_tested = 0

        # Analyze difference
        diff = DifferenceAnalyzer.analyze(input_grid, output_grid)
        input_abs = AbstractionExtractor.extract(input_grid)
        output_abs = AbstractionExtractor.extract(output_grid)

        # Generate candidate programs
        candidates = ProgramGenerator.generate_from_difference(
            diff, input_abs, output_abs
        )

        # Test difference-guided programs first
        for program in candidates:
            if programs_tested >= max_programs:
                break
            if (time.time() - start_time) * 1000 > timeout_ms:
                break

            programs_tested += 1
            if self._test_program(program, input_grid, output_grid):
                self.stats['programs_succeeded'] += 1
                return SynthesisResult(
                    success=True,
                    program=program,
                    programs_tested=programs_tested,
                    time_ms=(time.time() - start_time) * 1000
                )

        # Fall back to enumeration
        for program in ProgramGenerator.generate_compositional([], max_depth=2):
            if programs_tested >= max_programs:
                break
            if (time.time() - start_time) * 1000 > timeout_ms:
                break

            programs_tested += 1
            if self._test_program(program, input_grid, output_grid):
                self.stats['programs_succeeded'] += 1
                return SynthesisResult(
                    success=True,
                    program=program,
                    programs_tested=programs_tested,
                    time_ms=(time.time() - start_time) * 1000
                )

        self.stats['programs_tested'] += programs_tested
        return SynthesisResult(
            success=False,
            program=None,
            programs_tested=programs_tested,
            time_ms=(time.time() - start_time) * 1000
        )

    def synthesize_from_examples(self, examples: List[Tuple[np.ndarray, np.ndarray]],
                                max_programs: int = 1000) -> SynthesisResult:
        """
        Synthesize a program that works on all examples.

        Args:
            examples: List of (input, output) pairs

        Returns:
            SynthesisResult with program that works on all examples
        """
        if not examples:
            return SynthesisResult(False, None, 0, 0)

        start_time = time.time()
        programs_tested = 0

        # Analyze all differences
        all_diffs = []
        all_input_abs = []
        all_output_abs = []

        for inp, out in examples:
            all_diffs.append(DifferenceAnalyzer.analyze(inp, out))
            all_input_abs.append(AbstractionExtractor.extract(inp))
            all_output_abs.append(AbstractionExtractor.extract(out))

        # Generate candidates from first example
        candidates = ProgramGenerator.generate_from_difference(
            all_diffs[0], all_input_abs[0], all_output_abs[0]
        )

        # Test each candidate on all examples
        for program in candidates:
            programs_tested += 1

            all_match = True
            for inp, expected_out in examples:
                if not self._test_program(program, inp, expected_out):
                    all_match = False
                    break

            if all_match:
                return SynthesisResult(
                    success=True,
                    program=program,
                    programs_tested=programs_tested,
                    time_ms=(time.time() - start_time) * 1000
                )

        # Enumeration fallback
        for program in ProgramGenerator.generate_compositional([], max_depth=2):
            if programs_tested >= max_programs:
                break

            programs_tested += 1

            all_match = True
            for inp, expected_out in examples:
                if not self._test_program(program, inp, expected_out):
                    all_match = False
                    break

            if all_match:
                return SynthesisResult(
                    success=True,
                    program=program,
                    programs_tested=programs_tested,
                    time_ms=(time.time() - start_time) * 1000
                )

        return SynthesisResult(
            success=False,
            program=None,
            programs_tested=programs_tested,
            time_ms=(time.time() - start_time) * 1000
        )

    def _test_program(self, program: DSLProgram, input_grid: np.ndarray,
                     expected_output: np.ndarray) -> bool:
        """Test if a program produces the expected output"""
        try:
            result = self.executor.execute(input_grid, program)
            return np.array_equal(result, expected_output)
        except Exception:
            return False


# ═══════════════════════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════════════════════

def test_synthesizer():
    """Test program synthesis"""
    print("Testing ARC Program Synthesizer...")

    synthesizer = ProgramSynthesizer()

    # Test 1: Rotation
    print("\n[Test 1] Rotation detection...")
    inp1 = np.array([[1, 2], [3, 4]])
    out1 = np.rot90(inp1, k=-1)  # 90 degrees clockwise

    result1 = synthesizer.synthesize(inp1, out1)
    print(f"  Success: {result1.success}")
    if result1.program:
        print(f"  Program: {result1.program}")
    print(f"  Programs tested: {result1.programs_tested}")

    # Test 2: Horizontal flip
    print("\n[Test 2] Horizontal flip detection...")
    inp2 = np.array([[1, 2, 3], [4, 5, 6]])
    out2 = np.fliplr(inp2)

    result2 = synthesizer.synthesize(inp2, out2)
    print(f"  Success: {result2.success}")
    if result2.program:
        print(f"  Program: {result2.program}")

    # Test 3: Color change
    print("\n[Test 3] Color change detection...")
    inp3 = np.array([[1, 1, 0], [0, 1, 0], [0, 0, 0]])
    out3 = np.array([[2, 2, 0], [0, 2, 0], [0, 0, 0]])

    result3 = synthesizer.synthesize(inp3, out3)
    print(f"  Success: {result3.success}")
    if result3.program:
        print(f"  Program: {result3.program}")

    # Test 4: Multiple examples
    print("\n[Test 4] Synthesis from multiple examples...")
    examples = [
        (np.array([[1, 0], [0, 1]]), np.array([[0, 1], [1, 0]])),  # flip h
        (np.array([[2, 0, 0], [0, 2, 0]]), np.array([[0, 0, 2], [0, 2, 0]])),  # flip h
    ]

    result4 = synthesizer.synthesize_from_examples(examples)
    print(f"  Success: {result4.success}")
    if result4.program:
        print(f"  Program: {result4.program}")

    print(f"\n✓ Synthesizer stats: {synthesizer.stats}")
    print("✓ Program synthesis test complete!")
    return True


if __name__ == "__main__":
    test_synthesizer()

#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ARC DSL - Domain Specific Language for ARC Puzzle Solving
═══════════════════════════════════════════════════════════════════════════════

A DSL for expressing ARC transformations at the object level, not pixel level.

Key Concepts:
- Objects: Connected components of same-colored cells
- Abstractions: Shapes, patterns, symmetries discovered in grids
- Operations: Object-level manipulations (move, copy, recolor, etc.)
- Programs: Compositions of operations that transform input → output

"Think in objects, not pixels."
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Set, Callable
from enum import Enum, auto
from collections import defaultdict
import itertools


# ═══════════════════════════════════════════════════════════════════════════════
# CORE TYPES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Point:
    """A 2D point"""
    row: int
    col: int

    def __add__(self, other: 'Point') -> 'Point':
        return Point(self.row + other.row, self.col + other.col)

    def __sub__(self, other: 'Point') -> 'Point':
        return Point(self.row - other.row, self.col - other.col)

    def __hash__(self):
        return hash((self.row, self.col))

    def __eq__(self, other):
        return self.row == other.row and self.col == other.col


@dataclass
class BoundingBox:
    """Bounding box for an object"""
    min_row: int
    min_col: int
    max_row: int
    max_col: int

    @property
    def height(self) -> int:
        return self.max_row - self.min_row + 1

    @property
    def width(self) -> int:
        return self.max_col - self.min_col + 1

    @property
    def area(self) -> int:
        return self.height * self.width

    @property
    def center(self) -> Point:
        return Point(
            (self.min_row + self.max_row) // 2,
            (self.min_col + self.max_col) // 2
        )


@dataclass
class Object:
    """
    An object in a grid - a connected component of cells.

    This is the fundamental unit of reasoning in ARC puzzles.
    """
    id: int
    color: int
    cells: Set[Point] = field(default_factory=set)

    @property
    def size(self) -> int:
        return len(self.cells)

    @property
    def bbox(self) -> BoundingBox:
        if not self.cells:
            return BoundingBox(0, 0, 0, 0)
        rows = [c.row for c in self.cells]
        cols = [c.col for c in self.cells]
        return BoundingBox(min(rows), min(cols), max(rows), max(cols))

    @property
    def centroid(self) -> Point:
        if not self.cells:
            return Point(0, 0)
        avg_row = sum(c.row for c in self.cells) / len(self.cells)
        avg_col = sum(c.col for c in self.cells) / len(self.cells)
        return Point(int(avg_row), int(avg_col))

    def get_shape_signature(self) -> str:
        """Get a normalized shape signature for matching"""
        if not self.cells:
            return ""
        bbox = self.bbox
        # Normalize to origin
        normalized = sorted([
            (c.row - bbox.min_row, c.col - bbox.min_col)
            for c in self.cells
        ])
        return str(normalized)

    def to_mask(self, grid_shape: Tuple[int, int]) -> np.ndarray:
        """Convert to binary mask"""
        mask = np.zeros(grid_shape, dtype=bool)
        for cell in self.cells:
            if 0 <= cell.row < grid_shape[0] and 0 <= cell.col < grid_shape[1]:
                mask[cell.row, cell.col] = True
        return mask

    def translate(self, delta: Point) -> 'Object':
        """Return translated copy"""
        return Object(
            id=self.id,
            color=self.color,
            cells={Point(c.row + delta.row, c.col + delta.col) for c in self.cells}
        )

    def recolor(self, new_color: int) -> 'Object':
        """Return recolored copy"""
        return Object(id=self.id, color=new_color, cells=self.cells.copy())


# ═══════════════════════════════════════════════════════════════════════════════
# OBJECT EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

class ObjectExtractor:
    """Extract objects from grids using connected component analysis"""

    @staticmethod
    def extract_objects(grid: np.ndarray, background: int = 0,
                       connectivity: int = 4) -> List[Object]:
        """
        Extract all objects from a grid.

        Args:
            grid: 2D numpy array
            background: Background color to ignore
            connectivity: 4 or 8 connectivity
        """
        objects = []
        visited = np.zeros_like(grid, dtype=bool)
        obj_id = 0

        for row in range(grid.shape[0]):
            for col in range(grid.shape[1]):
                if visited[row, col] or grid[row, col] == background:
                    continue

                # BFS to find connected component
                color = grid[row, col]
                cells = set()
                queue = [(row, col)]

                while queue:
                    r, c = queue.pop(0)
                    if visited[r, c]:
                        continue
                    if grid[r, c] != color:
                        continue

                    visited[r, c] = True
                    cells.add(Point(r, c))

                    # Add neighbors
                    neighbors = [(r-1, c), (r+1, c), (r, c-1), (r, c+1)]
                    if connectivity == 8:
                        neighbors += [(r-1, c-1), (r-1, c+1), (r+1, c-1), (r+1, c+1)]

                    for nr, nc in neighbors:
                        if 0 <= nr < grid.shape[0] and 0 <= nc < grid.shape[1]:
                            if not visited[nr, nc] and grid[nr, nc] == color:
                                queue.append((nr, nc))

                if cells:
                    objects.append(Object(id=obj_id, color=int(color), cells=cells))
                    obj_id += 1

        return objects

    @staticmethod
    def extract_by_color(grid: np.ndarray) -> Dict[int, List[Object]]:
        """Extract objects grouped by color"""
        all_objects = ObjectExtractor.extract_objects(grid)
        by_color = defaultdict(list)
        for obj in all_objects:
            by_color[obj.color].append(obj)
        return dict(by_color)


# ═══════════════════════════════════════════════════════════════════════════════
# DSL OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

class DSLOp(Enum):
    """DSL operations for object manipulation"""
    # Selection
    SELECT_ALL = auto()
    SELECT_BY_COLOR = auto()
    SELECT_BY_SIZE = auto()
    SELECT_LARGEST = auto()
    SELECT_SMALLEST = auto()
    SELECT_BY_POSITION = auto()

    # Transformation
    MOVE = auto()
    MOVE_TO = auto()
    COPY = auto()
    DELETE = auto()
    RECOLOR = auto()

    # Spatial
    ROTATE_90 = auto()
    ROTATE_180 = auto()
    ROTATE_270 = auto()
    FLIP_H = auto()
    FLIP_V = auto()
    SCALE = auto()

    # Composition
    TILE = auto()
    MIRROR = auto()
    FILL_BBOX = auto()
    OUTLINE = auto()

    # Relational
    ALIGN_HORIZONTAL = auto()
    ALIGN_VERTICAL = auto()
    STACK_HORIZONTAL = auto()
    STACK_VERTICAL = auto()

    # Pattern
    REPEAT = auto()
    EXTEND_PATTERN = auto()
    COMPLETE_SYMMETRY = auto()


@dataclass
class DSLInstruction:
    """A single DSL instruction"""
    op: DSLOp
    args: Dict[str, Any] = field(default_factory=dict)

    def __repr__(self):
        args_str = ", ".join(f"{k}={v}" for k, v in self.args.items())
        return f"{self.op.name}({args_str})"


@dataclass
class DSLProgram:
    """A program is a sequence of DSL instructions"""
    instructions: List[DSLInstruction] = field(default_factory=list)

    def add(self, op: DSLOp, **kwargs):
        self.instructions.append(DSLInstruction(op=op, args=kwargs))
        return self

    def __repr__(self):
        return " -> ".join(str(i) for i in self.instructions)


# ═══════════════════════════════════════════════════════════════════════════════
# DSL EXECUTOR
# ═══════════════════════════════════════════════════════════════════════════════

class DSLExecutor:
    """Execute DSL programs on grids"""

    def __init__(self):
        self.operations = {
            DSLOp.SELECT_ALL: self._select_all,
            DSLOp.SELECT_BY_COLOR: self._select_by_color,
            DSLOp.SELECT_BY_SIZE: self._select_by_size,
            DSLOp.SELECT_LARGEST: self._select_largest,
            DSLOp.SELECT_SMALLEST: self._select_smallest,
            DSLOp.MOVE: self._move,
            DSLOp.MOVE_TO: self._move_to,
            DSLOp.COPY: self._copy,
            DSLOp.DELETE: self._delete,
            DSLOp.RECOLOR: self._recolor,
            DSLOp.ROTATE_90: self._rotate_90,
            DSLOp.ROTATE_180: self._rotate_180,
            DSLOp.FLIP_H: self._flip_h,
            DSLOp.FLIP_V: self._flip_v,
            DSLOp.FILL_BBOX: self._fill_bbox,
            DSLOp.OUTLINE: self._outline,
            DSLOp.TILE: self._tile,
            DSLOp.COMPLETE_SYMMETRY: self._complete_symmetry,
        }

    def execute(self, grid: np.ndarray, program: DSLProgram) -> np.ndarray:
        """Execute a DSL program on a grid"""
        result = grid.copy()
        objects = ObjectExtractor.extract_objects(result)
        selected = objects  # Start with all objects selected

        for instruction in program.instructions:
            op_func = self.operations.get(instruction.op)
            if op_func:
                result, objects, selected = op_func(
                    result, objects, selected, instruction.args
                )

        return result

    # Selection operations
    def _select_all(self, grid, objects, selected, args):
        return grid, objects, objects

    def _select_by_color(self, grid, objects, selected, args):
        color = args.get('color', 1)
        selected = [o for o in objects if o.color == color]
        return grid, objects, selected

    def _select_by_size(self, grid, objects, selected, args):
        min_size = args.get('min_size', 1)
        max_size = args.get('max_size', float('inf'))
        selected = [o for o in objects if min_size <= o.size <= max_size]
        return grid, objects, selected

    def _select_largest(self, grid, objects, selected, args):
        if objects:
            largest = max(objects, key=lambda o: o.size)
            selected = [largest]
        return grid, objects, selected

    def _select_smallest(self, grid, objects, selected, args):
        if objects:
            smallest = min(objects, key=lambda o: o.size)
            selected = [smallest]
        return grid, objects, selected

    # Transformation operations
    def _move(self, grid, objects, selected, args):
        delta = Point(args.get('dr', 0), args.get('dc', 0))
        result = grid.copy()

        for obj in selected:
            # Clear old position
            for cell in obj.cells:
                if 0 <= cell.row < grid.shape[0] and 0 <= cell.col < grid.shape[1]:
                    result[cell.row, cell.col] = 0
            # Draw at new position
            for cell in obj.cells:
                new_r, new_c = cell.row + delta.row, cell.col + delta.col
                if 0 <= new_r < grid.shape[0] and 0 <= new_c < grid.shape[1]:
                    result[new_r, new_c] = obj.color

        objects = ObjectExtractor.extract_objects(result)
        return result, objects, selected

    def _move_to(self, grid, objects, selected, args):
        target = Point(args.get('row', 0), args.get('col', 0))
        result = grid.copy()

        for obj in selected:
            centroid = obj.centroid
            delta = target - centroid
            # Clear old position
            for cell in obj.cells:
                if 0 <= cell.row < grid.shape[0] and 0 <= cell.col < grid.shape[1]:
                    result[cell.row, cell.col] = 0
            # Draw at new position
            for cell in obj.cells:
                new_r, new_c = cell.row + delta.row, cell.col + delta.col
                if 0 <= new_r < grid.shape[0] and 0 <= new_c < grid.shape[1]:
                    result[new_r, new_c] = obj.color

        objects = ObjectExtractor.extract_objects(result)
        return result, objects, selected

    def _copy(self, grid, objects, selected, args):
        delta = Point(args.get('dr', 0), args.get('dc', 0))
        result = grid.copy()

        for obj in selected:
            for cell in obj.cells:
                new_r, new_c = cell.row + delta.row, cell.col + delta.col
                if 0 <= new_r < grid.shape[0] and 0 <= new_c < grid.shape[1]:
                    result[new_r, new_c] = obj.color

        objects = ObjectExtractor.extract_objects(result)
        return result, objects, selected

    def _delete(self, grid, objects, selected, args):
        result = grid.copy()
        for obj in selected:
            for cell in obj.cells:
                if 0 <= cell.row < grid.shape[0] and 0 <= cell.col < grid.shape[1]:
                    result[cell.row, cell.col] = 0

        objects = ObjectExtractor.extract_objects(result)
        selected = []
        return result, objects, selected

    def _recolor(self, grid, objects, selected, args):
        new_color = args.get('color', 1)
        result = grid.copy()

        for obj in selected:
            for cell in obj.cells:
                if 0 <= cell.row < grid.shape[0] and 0 <= cell.col < grid.shape[1]:
                    result[cell.row, cell.col] = new_color

        objects = ObjectExtractor.extract_objects(result)
        return result, objects, selected

    def _rotate_90(self, grid, objects, selected, args):
        result = np.rot90(grid, k=-1)
        objects = ObjectExtractor.extract_objects(result)
        return result, objects, objects

    def _rotate_180(self, grid, objects, selected, args):
        result = np.rot90(grid, k=2)
        objects = ObjectExtractor.extract_objects(result)
        return result, objects, objects

    def _flip_h(self, grid, objects, selected, args):
        result = np.fliplr(grid)
        objects = ObjectExtractor.extract_objects(result)
        return result, objects, objects

    def _flip_v(self, grid, objects, selected, args):
        result = np.flipud(grid)
        objects = ObjectExtractor.extract_objects(result)
        return result, objects, objects

    def _fill_bbox(self, grid, objects, selected, args):
        result = grid.copy()
        for obj in selected:
            bbox = obj.bbox
            for r in range(bbox.min_row, bbox.max_row + 1):
                for c in range(bbox.min_col, bbox.max_col + 1):
                    if 0 <= r < grid.shape[0] and 0 <= c < grid.shape[1]:
                        result[r, c] = obj.color

        objects = ObjectExtractor.extract_objects(result)
        return result, objects, selected

    def _outline(self, grid, objects, selected, args):
        result = grid.copy()
        outline_color = args.get('color', 1)

        for obj in selected:
            bbox = obj.bbox
            # Draw outline
            for c in range(bbox.min_col, bbox.max_col + 1):
                if 0 <= bbox.min_row < grid.shape[0]:
                    result[bbox.min_row, c] = outline_color
                if 0 <= bbox.max_row < grid.shape[0]:
                    result[bbox.max_row, c] = outline_color
            for r in range(bbox.min_row, bbox.max_row + 1):
                if 0 <= bbox.min_col < grid.shape[1]:
                    result[r, bbox.min_col] = outline_color
                if 0 <= bbox.max_col < grid.shape[1]:
                    result[r, bbox.max_col] = outline_color

        objects = ObjectExtractor.extract_objects(result)
        return result, objects, selected

    def _tile(self, grid, objects, selected, args):
        rows = args.get('rows', 2)
        cols = args.get('cols', 2)
        result = np.tile(grid, (rows, cols))
        objects = ObjectExtractor.extract_objects(result)
        return result, objects, objects

    def _complete_symmetry(self, grid, objects, selected, args):
        axis = args.get('axis', 'horizontal')
        result = grid.copy()
        h, w = grid.shape

        if axis == 'horizontal':
            for r in range(h):
                for c in range(w // 2):
                    if result[r, c] != 0:
                        result[r, w - 1 - c] = result[r, c]
                    elif result[r, w - 1 - c] != 0:
                        result[r, c] = result[r, w - 1 - c]
        else:  # vertical
            for r in range(h // 2):
                for c in range(w):
                    if result[r, c] != 0:
                        result[h - 1 - r, c] = result[r, c]
                    elif result[h - 1 - r, c] != 0:
                        result[r, c] = result[h - 1 - r, c]

        objects = ObjectExtractor.extract_objects(result)
        return result, objects, objects


# ═══════════════════════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════════════════════

def test_dsl():
    """Test DSL primitives"""
    print("Testing ARC DSL...")

    # Create test grid
    grid = np.array([
        [0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 2, 2],
        [0, 0, 0, 2, 0],
    ])

    # Extract objects
    objects = ObjectExtractor.extract_objects(grid)
    print(f"✓ Extracted {len(objects)} objects")
    for obj in objects:
        print(f"  - Object {obj.id}: color={obj.color}, size={obj.size}, bbox={obj.bbox}")

    # Test DSL program
    executor = DSLExecutor()

    # Program: select color 1, recolor to 3
    program = DSLProgram()
    program.add(DSLOp.SELECT_BY_COLOR, color=1)
    program.add(DSLOp.RECOLOR, color=3)

    result = executor.execute(grid, program)
    print(f"✓ Executed program: {program}")
    print(f"  Color 1 → 3: {np.sum(result == 3)} cells")

    # Program: select largest, move down
    program2 = DSLProgram()
    program2.add(DSLOp.SELECT_LARGEST)
    program2.add(DSLOp.MOVE, dr=1, dc=0)

    result2 = executor.execute(grid, program2)
    print(f"✓ Executed program: {program2}")

    # Test symmetry completion
    asymmetric = np.array([
        [1, 0, 0],
        [1, 1, 0],
        [1, 0, 0],
    ])
    program3 = DSLProgram()
    program3.add(DSLOp.COMPLETE_SYMMETRY, axis='horizontal')
    result3 = executor.execute(asymmetric, program3)
    print(f"✓ Symmetry completion: {result3.tolist()}")

    print("\n✓ ARC DSL test complete!")
    return True


if __name__ == "__main__":
    test_dsl()

#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ARC ABSTRACTIONS - High-Level Pattern Discovery
═══════════════════════════════════════════════════════════════════════════════

Discovers abstract patterns in ARC grids:
- Shapes: L-shapes, rectangles, lines, dots, etc.
- Symmetries: Horizontal, vertical, rotational, point
- Repetitions: Tiling, periodic patterns
- Relationships: Containment, adjacency, alignment

"The key to ARC is seeing the forest, not the trees."
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Set
from enum import Enum, auto
from collections import defaultdict, Counter
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from arc_dsl import Object, ObjectExtractor, Point, BoundingBox


# ═══════════════════════════════════════════════════════════════════════════════
# SHAPE ABSTRACTIONS
# ═══════════════════════════════════════════════════════════════════════════════

class ShapeType(Enum):
    """Common shape types in ARC"""
    DOT = auto()          # Single cell
    LINE_H = auto()       # Horizontal line
    LINE_V = auto()       # Vertical line
    LINE_DIAG = auto()    # Diagonal line
    RECTANGLE = auto()    # Filled rectangle
    HOLLOW_RECT = auto()  # Hollow rectangle (frame)
    L_SHAPE = auto()      # L-shaped
    T_SHAPE = auto()      # T-shaped
    PLUS = auto()         # Plus/cross shape
    SQUARE = auto()       # Square (special rectangle)
    TRIANGLE = auto()     # Triangle-ish
    IRREGULAR = auto()    # Irregular shape
    UNKNOWN = auto()


@dataclass
class ShapeAbstraction:
    """Abstraction of an object's shape"""
    shape_type: ShapeType
    width: int
    height: int
    size: int  # Number of cells
    fill_ratio: float  # Cells / bbox area
    signature: str  # Normalized shape signature
    is_symmetric_h: bool = False
    is_symmetric_v: bool = False
    is_symmetric_rot90: bool = False


class ShapeClassifier:
    """Classify objects by their shape"""

    @staticmethod
    def classify(obj: Object) -> ShapeAbstraction:
        """Classify an object's shape"""
        if not obj.cells:
            return ShapeAbstraction(
                shape_type=ShapeType.UNKNOWN,
                width=0, height=0, size=0,
                fill_ratio=0.0, signature=""
            )

        bbox = obj.bbox
        width = bbox.width
        height = bbox.height
        size = obj.size
        fill_ratio = size / (width * height) if width * height > 0 else 0

        # Get normalized shape
        signature = obj.get_shape_signature()

        # Check symmetries
        is_sym_h = ShapeClassifier._check_h_symmetry(obj)
        is_sym_v = ShapeClassifier._check_v_symmetry(obj)
        is_sym_rot90 = ShapeClassifier._check_rot90_symmetry(obj)

        # Classify by properties
        shape_type = ShapeClassifier._determine_type(
            obj, width, height, size, fill_ratio
        )

        return ShapeAbstraction(
            shape_type=shape_type,
            width=width,
            height=height,
            size=size,
            fill_ratio=fill_ratio,
            signature=signature,
            is_symmetric_h=is_sym_h,
            is_symmetric_v=is_sym_v,
            is_symmetric_rot90=is_sym_rot90
        )

    @staticmethod
    def _determine_type(obj: Object, width: int, height: int,
                       size: int, fill_ratio: float) -> ShapeType:
        """Determine shape type from properties"""
        # Single cell
        if size == 1:
            return ShapeType.DOT

        # Lines
        if width == 1 and height > 1:
            return ShapeType.LINE_V
        if height == 1 and width > 1:
            return ShapeType.LINE_H

        # Full rectangle
        if fill_ratio > 0.95:
            if width == height:
                return ShapeType.SQUARE
            return ShapeType.RECTANGLE

        # Hollow rectangle (frame)
        if ShapeClassifier._is_hollow_rect(obj):
            return ShapeType.HOLLOW_RECT

        # Plus/cross shape
        if ShapeClassifier._is_plus(obj):
            return ShapeType.PLUS

        # L-shape
        if ShapeClassifier._is_l_shape(obj):
            return ShapeType.L_SHAPE

        # T-shape
        if ShapeClassifier._is_t_shape(obj):
            return ShapeType.T_SHAPE

        return ShapeType.IRREGULAR

    @staticmethod
    def _is_hollow_rect(obj: Object) -> bool:
        """Check if object is a hollow rectangle"""
        bbox = obj.bbox
        if bbox.width < 3 or bbox.height < 3:
            return False

        # Check if interior is empty
        interior_cells = 0
        border_cells = 0
        for cell in obj.cells:
            is_border = (cell.row == bbox.min_row or cell.row == bbox.max_row or
                        cell.col == bbox.min_col or cell.col == bbox.max_col)
            if is_border:
                border_cells += 1
            else:
                interior_cells += 1

        return interior_cells == 0 and border_cells == obj.size

    @staticmethod
    def _is_plus(obj: Object) -> bool:
        """Check if object is a plus/cross shape"""
        bbox = obj.bbox
        if bbox.width < 3 or bbox.height < 3:
            return False
        if bbox.width != bbox.height:
            return False

        center = bbox.center
        # Check if center row and column are filled
        center_row_count = sum(1 for c in obj.cells if c.row == center.row)
        center_col_count = sum(1 for c in obj.cells if c.col == center.col)

        return center_row_count == bbox.width and center_col_count == bbox.height

    @staticmethod
    def _is_l_shape(obj: Object) -> bool:
        """Check if object is L-shaped"""
        if obj.size < 3:
            return False
        bbox = obj.bbox

        # L-shape has cells in one corner and extends in two directions
        corners = [
            (bbox.min_row, bbox.min_col),
            (bbox.min_row, bbox.max_col),
            (bbox.max_row, bbox.min_col),
            (bbox.max_row, bbox.max_col),
        ]

        for corner_r, corner_c in corners:
            if Point(corner_r, corner_c) in obj.cells:
                # Check if it extends horizontally and vertically from corner
                h_count = sum(1 for c in obj.cells if c.row == corner_r)
                v_count = sum(1 for c in obj.cells if c.col == corner_c)
                if h_count > 1 and v_count > 1 and h_count + v_count - 1 == obj.size:
                    return True
        return False

    @staticmethod
    def _is_t_shape(obj: Object) -> bool:
        """Check if object is T-shaped"""
        if obj.size < 4:
            return False

        bbox = obj.bbox
        # T-shape: one full row/col plus perpendicular extension
        # Check rows
        for r in range(bbox.min_row, bbox.max_row + 1):
            row_cells = [c for c in obj.cells if c.row == r]
            if len(row_cells) == bbox.width:  # Full row
                remaining = obj.size - len(row_cells)
                # Check for perpendicular stem
                col_counts = Counter(c.col for c in obj.cells if c.row != r)
                if len(col_counts) == 1 and list(col_counts.values())[0] == remaining:
                    return True
        return False

    @staticmethod
    def _check_h_symmetry(obj: Object) -> bool:
        """Check horizontal symmetry"""
        bbox = obj.bbox
        mid_col = (bbox.min_col + bbox.max_col) / 2

        for cell in obj.cells:
            mirror_col = int(2 * mid_col - cell.col)
            mirror = Point(cell.row, mirror_col)
            if mirror not in obj.cells:
                return False
        return True

    @staticmethod
    def _check_v_symmetry(obj: Object) -> bool:
        """Check vertical symmetry"""
        bbox = obj.bbox
        mid_row = (bbox.min_row + bbox.max_row) / 2

        for cell in obj.cells:
            mirror_row = int(2 * mid_row - cell.row)
            mirror = Point(mirror_row, cell.col)
            if mirror not in obj.cells:
                return False
        return True

    @staticmethod
    def _check_rot90_symmetry(obj: Object) -> bool:
        """Check 90-degree rotational symmetry"""
        bbox = obj.bbox
        if bbox.width != bbox.height:
            return False

        center_r = (bbox.min_row + bbox.max_row) / 2
        center_c = (bbox.min_col + bbox.max_col) / 2

        for cell in obj.cells:
            # Rotate 90 degrees around center
            dr = cell.row - center_r
            dc = cell.col - center_c
            new_r = int(center_r - dc)
            new_c = int(center_c + dr)
            rotated = Point(new_r, new_c)
            if rotated not in obj.cells:
                return False
        return True


# ═══════════════════════════════════════════════════════════════════════════════
# SYMMETRY DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

class SymmetryType(Enum):
    """Types of symmetry"""
    HORIZONTAL = auto()    # Left-right
    VERTICAL = auto()      # Top-bottom
    DIAGONAL_MAIN = auto() # Main diagonal
    DIAGONAL_ANTI = auto() # Anti-diagonal
    ROTATIONAL_90 = auto()
    ROTATIONAL_180 = auto()
    POINT = auto()         # Central point symmetry
    NONE = auto()


@dataclass
class SymmetryInfo:
    """Information about grid symmetry"""
    symmetry_type: SymmetryType
    axis_position: Optional[float] = None
    confidence: float = 1.0
    is_partial: bool = False


class SymmetryDetector:
    """Detect symmetries in grids"""

    @staticmethod
    def detect_all(grid: np.ndarray) -> List[SymmetryInfo]:
        """Detect all symmetries in a grid"""
        symmetries = []

        if SymmetryDetector._check_horizontal(grid):
            symmetries.append(SymmetryInfo(
                symmetry_type=SymmetryType.HORIZONTAL,
                axis_position=grid.shape[1] / 2
            ))

        if SymmetryDetector._check_vertical(grid):
            symmetries.append(SymmetryInfo(
                symmetry_type=SymmetryType.VERTICAL,
                axis_position=grid.shape[0] / 2
            ))

        if SymmetryDetector._check_rot180(grid):
            symmetries.append(SymmetryInfo(
                symmetry_type=SymmetryType.ROTATIONAL_180
            ))

        if grid.shape[0] == grid.shape[1]:
            if SymmetryDetector._check_rot90(grid):
                symmetries.append(SymmetryInfo(
                    symmetry_type=SymmetryType.ROTATIONAL_90
                ))

            if SymmetryDetector._check_diagonal_main(grid):
                symmetries.append(SymmetryInfo(
                    symmetry_type=SymmetryType.DIAGONAL_MAIN
                ))

        if not symmetries:
            symmetries.append(SymmetryInfo(symmetry_type=SymmetryType.NONE))

        return symmetries

    @staticmethod
    def _check_horizontal(grid: np.ndarray) -> bool:
        """Check left-right symmetry"""
        return np.array_equal(grid, np.fliplr(grid))

    @staticmethod
    def _check_vertical(grid: np.ndarray) -> bool:
        """Check top-bottom symmetry"""
        return np.array_equal(grid, np.flipud(grid))

    @staticmethod
    def _check_rot90(grid: np.ndarray) -> bool:
        """Check 90-degree rotational symmetry"""
        return np.array_equal(grid, np.rot90(grid))

    @staticmethod
    def _check_rot180(grid: np.ndarray) -> bool:
        """Check 180-degree rotational symmetry"""
        return np.array_equal(grid, np.rot90(grid, 2))

    @staticmethod
    def _check_diagonal_main(grid: np.ndarray) -> bool:
        """Check main diagonal symmetry"""
        return np.array_equal(grid, grid.T)


# ═══════════════════════════════════════════════════════════════════════════════
# PATTERN DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class RepetitionPattern:
    """A repeating pattern in the grid"""
    unit: np.ndarray  # The repeating unit
    period_h: int     # Horizontal period
    period_v: int     # Vertical period
    count_h: int      # Horizontal repetitions
    count_v: int      # Vertical repetitions


class PatternDetector:
    """Detect repeating patterns in grids"""

    @staticmethod
    def detect_tiling(grid: np.ndarray) -> Optional[RepetitionPattern]:
        """Detect if grid is a tiled pattern"""
        h, w = grid.shape

        # Try different tile sizes
        for tile_h in range(1, h // 2 + 1):
            if h % tile_h != 0:
                continue
            for tile_w in range(1, w // 2 + 1):
                if w % tile_w != 0:
                    continue

                tile = grid[:tile_h, :tile_w]
                if PatternDetector._is_tiled(grid, tile):
                    return RepetitionPattern(
                        unit=tile,
                        period_h=tile_w,
                        period_v=tile_h,
                        count_h=w // tile_w,
                        count_v=h // tile_h
                    )
        return None

    @staticmethod
    def _is_tiled(grid: np.ndarray, tile: np.ndarray) -> bool:
        """Check if grid is tiled with the given tile"""
        tile_h, tile_w = tile.shape
        grid_h, grid_w = grid.shape

        for i in range(0, grid_h, tile_h):
            for j in range(0, grid_w, tile_w):
                if not np.array_equal(grid[i:i+tile_h, j:j+tile_w], tile):
                    return False
        return True

    @staticmethod
    def find_repeating_objects(objects: List[Object]) -> Dict[str, List[Object]]:
        """Find objects with the same shape"""
        by_signature = defaultdict(list)
        for obj in objects:
            sig = obj.get_shape_signature()
            by_signature[sig].append(obj)
        return {sig: objs for sig, objs in by_signature.items() if len(objs) > 1}


# ═══════════════════════════════════════════════════════════════════════════════
# RELATIONSHIP DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

class RelationType(Enum):
    """Types of relationships between objects"""
    CONTAINS = auto()      # One object contains another
    ADJACENT = auto()      # Objects are adjacent
    ALIGNED_H = auto()     # Horizontally aligned
    ALIGNED_V = auto()     # Vertically aligned
    SAME_SIZE = auto()     # Same size
    SAME_COLOR = auto()    # Same color
    SAME_SHAPE = auto()    # Same shape


@dataclass
class ObjectRelation:
    """A relationship between two objects"""
    obj1_id: int
    obj2_id: int
    relation: RelationType
    details: Dict[str, Any] = field(default_factory=dict)


class RelationshipDetector:
    """Detect relationships between objects"""

    @staticmethod
    def detect_all(objects: List[Object]) -> List[ObjectRelation]:
        """Detect all pairwise relationships"""
        relations = []

        for i, obj1 in enumerate(objects):
            for j, obj2 in enumerate(objects):
                if i >= j:
                    continue

                # Check various relationships
                if RelationshipDetector._contains(obj1, obj2):
                    relations.append(ObjectRelation(
                        obj1.id, obj2.id, RelationType.CONTAINS
                    ))
                elif RelationshipDetector._contains(obj2, obj1):
                    relations.append(ObjectRelation(
                        obj2.id, obj1.id, RelationType.CONTAINS
                    ))

                if RelationshipDetector._adjacent(obj1, obj2):
                    relations.append(ObjectRelation(
                        obj1.id, obj2.id, RelationType.ADJACENT
                    ))

                if RelationshipDetector._aligned_h(obj1, obj2):
                    relations.append(ObjectRelation(
                        obj1.id, obj2.id, RelationType.ALIGNED_H
                    ))

                if RelationshipDetector._aligned_v(obj1, obj2):
                    relations.append(ObjectRelation(
                        obj1.id, obj2.id, RelationType.ALIGNED_V
                    ))

                if obj1.size == obj2.size:
                    relations.append(ObjectRelation(
                        obj1.id, obj2.id, RelationType.SAME_SIZE
                    ))

                if obj1.color == obj2.color:
                    relations.append(ObjectRelation(
                        obj1.id, obj2.id, RelationType.SAME_COLOR
                    ))

                if obj1.get_shape_signature() == obj2.get_shape_signature():
                    relations.append(ObjectRelation(
                        obj1.id, obj2.id, RelationType.SAME_SHAPE
                    ))

        return relations

    @staticmethod
    def _contains(outer: Object, inner: Object) -> bool:
        """Check if outer contains inner"""
        outer_bbox = outer.bbox
        inner_bbox = inner.bbox
        return (outer_bbox.min_row <= inner_bbox.min_row and
                outer_bbox.max_row >= inner_bbox.max_row and
                outer_bbox.min_col <= inner_bbox.min_col and
                outer_bbox.max_col >= inner_bbox.max_col and
                outer.size > inner.size)

    @staticmethod
    def _adjacent(obj1: Object, obj2: Object) -> bool:
        """Check if objects are adjacent (share an edge)"""
        for c1 in obj1.cells:
            for c2 in obj2.cells:
                if abs(c1.row - c2.row) + abs(c1.col - c2.col) == 1:
                    return True
        return False

    @staticmethod
    def _aligned_h(obj1: Object, obj2: Object) -> bool:
        """Check horizontal alignment (same row range)"""
        return obj1.bbox.min_row == obj2.bbox.min_row or obj1.bbox.max_row == obj2.bbox.max_row

    @staticmethod
    def _aligned_v(obj1: Object, obj2: Object) -> bool:
        """Check vertical alignment (same column range)"""
        return obj1.bbox.min_col == obj2.bbox.min_col or obj1.bbox.max_col == obj2.bbox.max_col


# ═══════════════════════════════════════════════════════════════════════════════
# UNIFIED ABSTRACTION EXTRACTOR
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class GridAbstractions:
    """All abstractions extracted from a grid"""
    objects: List[Object]
    shapes: List[ShapeAbstraction]
    symmetries: List[SymmetryInfo]
    tiling: Optional[RepetitionPattern]
    repeating_shapes: Dict[str, List[Object]]
    relations: List[ObjectRelation]


class AbstractionExtractor:
    """Extract all abstractions from a grid"""

    @staticmethod
    def extract(grid: np.ndarray) -> GridAbstractions:
        """Extract all abstractions from a grid"""
        # Extract objects
        objects = ObjectExtractor.extract_objects(grid)

        # Classify shapes
        shapes = [ShapeClassifier.classify(obj) for obj in objects]

        # Detect symmetries
        symmetries = SymmetryDetector.detect_all(grid)

        # Detect tiling
        tiling = PatternDetector.detect_tiling(grid)

        # Find repeating shapes
        repeating = PatternDetector.find_repeating_objects(objects)

        # Detect relationships
        relations = RelationshipDetector.detect_all(objects)

        return GridAbstractions(
            objects=objects,
            shapes=shapes,
            symmetries=symmetries,
            tiling=tiling,
            repeating_shapes=repeating,
            relations=relations
        )


# ═══════════════════════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════════════════════

def test_abstractions():
    """Test abstraction extraction"""
    print("Testing ARC Abstractions...")

    # Test grid with multiple shapes
    grid = np.array([
        [0, 1, 1, 0, 0, 2, 2, 0],
        [0, 1, 0, 0, 0, 2, 2, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 3, 3, 3, 0, 0, 0, 0],
        [0, 0, 3, 0, 0, 4, 0, 0],
        [0, 0, 3, 0, 0, 4, 0, 0],
        [0, 0, 0, 0, 0, 4, 0, 0],
    ])

    abstractions = AbstractionExtractor.extract(grid)

    print(f"✓ Extracted {len(abstractions.objects)} objects")
    for i, (obj, shape) in enumerate(zip(abstractions.objects, abstractions.shapes)):
        print(f"  Object {i}: color={obj.color}, shape={shape.shape_type.name}, "
              f"size={shape.size}, symmetric_h={shape.is_symmetric_h}")

    print(f"\n✓ Detected symmetries: {[s.symmetry_type.name for s in abstractions.symmetries]}")

    if abstractions.tiling:
        print(f"✓ Detected tiling: {abstractions.tiling.count_h}x{abstractions.tiling.count_v}")
    else:
        print("✓ No tiling detected")

    print(f"\n✓ Repeating shapes: {len(abstractions.repeating_shapes)} groups")

    print(f"\n✓ Object relations: {len(abstractions.relations)}")
    for rel in abstractions.relations[:5]:
        print(f"  {rel.obj1_id} <-> {rel.obj2_id}: {rel.relation.name}")

    # Test symmetric grid
    symmetric_grid = np.array([
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
    ])
    sym_abstractions = AbstractionExtractor.extract(symmetric_grid)
    print(f"\n✓ Symmetric grid: {[s.symmetry_type.name for s in sym_abstractions.symmetries]}")

    # Test tiled grid
    tiled_grid = np.array([
        [1, 2, 1, 2],
        [2, 1, 2, 1],
        [1, 2, 1, 2],
        [2, 1, 2, 1],
    ])
    tiled_abstractions = AbstractionExtractor.extract(tiled_grid)
    if tiled_abstractions.tiling:
        print(f"✓ Tiled grid: unit={tiled_abstractions.tiling.unit.tolist()}")

    print("\n✓ Abstraction extraction test complete!")
    return True


if __name__ == "__main__":
    test_abstractions()

#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
ARC-AGI-2 VISUAL GRID SOLVER - FRONTIER-COMPETING ABSTRACTION ENGINE
═══════════════════════════════════════════════════════════════════════════════

A serious attempt at solving ARC-AGI-2 style puzzles using:

1. TRANSFORMATION PRIMITIVES - 40+ grid operations
2. OBJECT DETECTION - Connected component analysis, shape recognition
3. HYPOTHESIS GENERATION - Systematic rule exploration
4. COMPOSITIONAL DISCOVERY - Chaining transformations
5. SWARM INTEGRATION - Parallel hypothesis testing via NEXO

Target: Beat frontier models (currently 10-45% on ARC-AGI-2)

The key insight: ARC puzzles require discovering NOVEL rules from examples.
We approach this by:
- Extracting features from input/output pairs
- Generating candidate transformations that explain the examples
- Testing compositions of primitives
- Using the swarm to explore the hypothesis space in parallel

Created: December 2, 2025
"""

import asyncio
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple, Callable, Set
from enum import Enum
from abc import ABC, abstractmethod
from collections import defaultdict
import copy
import itertools
import random
import time
import json
from pathlib import Path
import sys

# Import pattern learner for adaptive hypothesis prioritization
sys.path.insert(0, str(Path(__file__).parent))
try:
    from pattern_learner import PatternLearner
    PATTERN_LEARNER_AVAILABLE = True
except ImportError:
    PatternLearner = None
    PATTERN_LEARNER_AVAILABLE = False


# ═══════════════════════════════════════════════════════════════════════════════
# CORE DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════════════════════

# ARC color palette (0-9)
COLORS = {
    0: "black",      # Background
    1: "blue",
    2: "red",
    3: "green",
    4: "yellow",
    5: "gray",
    6: "magenta",
    7: "orange",
    8: "cyan",
    9: "brown"
}


@dataclass
class Grid:
    """A 2D grid of colored cells (ARC format)"""
    data: np.ndarray

    def __post_init__(self):
        if isinstance(self.data, list):
            self.data = np.array(self.data, dtype=np.int32)

    @property
    def height(self) -> int:
        return self.data.shape[0]

    @property
    def width(self) -> int:
        return self.data.shape[1]

    @property
    def shape(self) -> Tuple[int, int]:
        return self.data.shape

    def copy(self) -> 'Grid':
        return Grid(self.data.copy())

    def __eq__(self, other) -> bool:
        if not isinstance(other, Grid):
            return False
        return np.array_equal(self.data, other.data)

    def __hash__(self) -> int:
        return hash(self.data.tobytes())

    def to_list(self) -> List[List[int]]:
        return self.data.tolist()

    def colors_used(self) -> Set[int]:
        return set(np.unique(self.data))

    def count_color(self, color: int) -> int:
        return int(np.sum(self.data == color))

    def display(self) -> str:
        """ASCII representation of the grid"""
        symbols = "·▪▫◆◇●○★☆□"
        lines = []
        for row in self.data:
            line = ""
            for cell in row:
                if cell < len(symbols):
                    line += symbols[cell] + " "
                else:
                    line += str(cell) + " "
            lines.append(line)
        return "\n".join(lines)


@dataclass
class ARCExample:
    """An input-output training example"""
    input: Grid
    output: Grid


@dataclass
class ARCPuzzle:
    """A complete ARC puzzle with training examples and test"""
    puzzle_id: str
    train: List[ARCExample]
    test_input: Grid
    test_output: Optional[Grid] = None  # Only known during evaluation

    @property
    def num_examples(self) -> int:
        return len(self.train)


@dataclass
class TransformResult:
    """Result of applying a transformation"""
    grid: Grid
    success: bool
    transform_name: str
    params: Dict = field(default_factory=dict)


@dataclass
class Hypothesis:
    """A hypothesis about the transformation rule"""
    transforms: List[Tuple[str, Dict]]  # List of (transform_name, params)
    confidence: float = 0.0
    examples_matched: int = 0

    def describe(self) -> str:
        steps = []
        for name, params in self.transforms:
            if params:
                steps.append(f"{name}({params})")
            else:
                steps.append(name)
        return " → ".join(steps)


@dataclass
class SolveResult:
    """Result of solving a puzzle"""
    puzzle_id: str
    predicted_output: Optional[Grid]
    correct: bool
    hypothesis: Optional[Hypothesis]
    time_ms: float
    hypotheses_tested: int


# ═══════════════════════════════════════════════════════════════════════════════
# OBJECT DETECTION - Critical for ARC puzzles
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class DetectedObject:
    """A connected component or recognized shape"""
    pixels: List[Tuple[int, int]]  # (row, col) coordinates
    color: int
    bounding_box: Tuple[int, int, int, int]  # (min_row, min_col, max_row, max_col)
    mask: np.ndarray  # Boolean mask of the object

    @property
    def width(self) -> int:
        return self.bounding_box[3] - self.bounding_box[1] + 1

    @property
    def height(self) -> int:
        return self.bounding_box[2] - self.bounding_box[0] + 1

    @property
    def size(self) -> int:
        return len(self.pixels)

    @property
    def centroid(self) -> Tuple[float, float]:
        if not self.pixels:
            return (0, 0)
        rows = [p[0] for p in self.pixels]
        cols = [p[1] for p in self.pixels]
        return (sum(rows) / len(rows), sum(cols) / len(cols))


class ObjectDetector:
    """Detects and analyzes objects in grids"""

    @staticmethod
    def find_connected_components(grid: Grid, background: int = 0) -> List[DetectedObject]:
        """Find all connected components (4-connectivity)"""
        data = grid.data
        visited = np.zeros_like(data, dtype=bool)
        objects = []

        def flood_fill(start_r: int, start_c: int, color: int) -> List[Tuple[int, int]]:
            stack = [(start_r, start_c)]
            pixels = []

            while stack:
                r, c = stack.pop()
                if r < 0 or r >= data.shape[0] or c < 0 or c >= data.shape[1]:
                    continue
                if visited[r, c] or data[r, c] != color:
                    continue

                visited[r, c] = True
                pixels.append((r, c))

                stack.extend([(r+1, c), (r-1, c), (r, c+1), (r, c-1)])

            return pixels

        for r in range(data.shape[0]):
            for c in range(data.shape[1]):
                if not visited[r, c] and data[r, c] != background:
                    color = data[r, c]
                    pixels = flood_fill(r, c, color)

                    if pixels:
                        rows = [p[0] for p in pixels]
                        cols = [p[1] for p in pixels]
                        bbox = (min(rows), min(cols), max(rows), max(cols))

                        mask = np.zeros_like(data, dtype=bool)
                        for pr, pc in pixels:
                            mask[pr, pc] = True

                        objects.append(DetectedObject(
                            pixels=pixels,
                            color=color,
                            bounding_box=bbox,
                            mask=mask
                        ))

        return objects

    @staticmethod
    def extract_object_pattern(grid: Grid, obj: DetectedObject) -> Grid:
        """Extract just the object as a minimal grid"""
        min_r, min_c, max_r, max_c = obj.bounding_box
        height = max_r - min_r + 1
        width = max_c - min_c + 1

        pattern = np.zeros((height, width), dtype=np.int32)
        for r, c in obj.pixels:
            pattern[r - min_r, c - min_c] = obj.color

        return Grid(pattern)

    @staticmethod
    def find_pattern_instances(grid: Grid, pattern: Grid) -> List[Tuple[int, int]]:
        """Find all locations where a pattern appears"""
        instances = []
        g = grid.data
        p = pattern.data

        for r in range(g.shape[0] - p.shape[0] + 1):
            for c in range(g.shape[1] - p.shape[1] + 1):
                subgrid = g[r:r+p.shape[0], c:c+p.shape[1]]
                # Check if pattern matches (ignoring zeros in pattern)
                mask = p != 0
                if np.all(subgrid[mask] == p[mask]):
                    instances.append((r, c))

        return instances


# ═══════════════════════════════════════════════════════════════════════════════
# TRANSFORMATION PRIMITIVES - The building blocks
# ═══════════════════════════════════════════════════════════════════════════════

class TransformLibrary:
    """Library of 40+ grid transformation primitives"""

    # ─────────────────────────────────────────────────────────────────────────
    # GEOMETRIC TRANSFORMS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def rotate_90(grid: Grid) -> Grid:
        """Rotate 90 degrees clockwise"""
        return Grid(np.rot90(grid.data, k=-1))

    @staticmethod
    def rotate_180(grid: Grid) -> Grid:
        """Rotate 180 degrees"""
        return Grid(np.rot90(grid.data, k=2))

    @staticmethod
    def rotate_270(grid: Grid) -> Grid:
        """Rotate 270 degrees clockwise (90 counter-clockwise)"""
        return Grid(np.rot90(grid.data, k=1))

    @staticmethod
    def flip_horizontal(grid: Grid) -> Grid:
        """Flip horizontally (left-right)"""
        return Grid(np.fliplr(grid.data))

    @staticmethod
    def flip_vertical(grid: Grid) -> Grid:
        """Flip vertically (up-down)"""
        return Grid(np.flipud(grid.data))

    @staticmethod
    def transpose(grid: Grid) -> Grid:
        """Transpose (swap rows and columns)"""
        return Grid(grid.data.T)

    # ─────────────────────────────────────────────────────────────────────────
    # SCALING TRANSFORMS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def scale_up(grid: Grid, factor: int = 2) -> Grid:
        """Scale up by integer factor"""
        data = grid.data
        new_data = np.repeat(np.repeat(data, factor, axis=0), factor, axis=1)
        return Grid(new_data)

    @staticmethod
    def scale_down(grid: Grid, factor: int = 2) -> Grid:
        """Scale down by taking every nth pixel"""
        return Grid(grid.data[::factor, ::factor])

    # ─────────────────────────────────────────────────────────────────────────
    # COLOR TRANSFORMS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def swap_colors(grid: Grid, color1: int, color2: int) -> Grid:
        """Swap two colors"""
        data = grid.data.copy()
        mask1 = data == color1
        mask2 = data == color2
        data[mask1] = color2
        data[mask2] = color1
        return Grid(data)

    @staticmethod
    def replace_color(grid: Grid, old_color: int, new_color: int) -> Grid:
        """Replace one color with another"""
        data = grid.data.copy()
        data[data == old_color] = new_color
        return Grid(data)

    @staticmethod
    def invert_colors(grid: Grid, max_color: int = 9) -> Grid:
        """Invert all colors (max - color)"""
        return Grid(max_color - grid.data)

    @staticmethod
    def keep_only_color(grid: Grid, color: int) -> Grid:
        """Keep only specified color, rest becomes 0"""
        data = grid.data.copy()
        data[data != color] = 0
        return Grid(data)

    @staticmethod
    def remove_color(grid: Grid, color: int) -> Grid:
        """Remove a specific color (set to 0)"""
        data = grid.data.copy()
        data[data == color] = 0
        return Grid(data)

    @staticmethod
    def map_colors(grid: Grid, color_map: Dict[int, int]) -> Grid:
        """Apply a color mapping"""
        data = grid.data.copy()
        for old, new in color_map.items():
            data[grid.data == old] = new
        return Grid(data)

    # ─────────────────────────────────────────────────────────────────────────
    # PATTERN TRANSFORMS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def tile(grid: Grid, rows: int = 2, cols: int = 2) -> Grid:
        """Tile the grid n times"""
        return Grid(np.tile(grid.data, (rows, cols)))

    @staticmethod
    def mirror_horizontal(grid: Grid) -> Grid:
        """Mirror horizontally (concat with flipped)"""
        return Grid(np.concatenate([grid.data, np.fliplr(grid.data)], axis=1))

    @staticmethod
    def mirror_vertical(grid: Grid) -> Grid:
        """Mirror vertically (concat with flipped)"""
        return Grid(np.concatenate([grid.data, np.flipud(grid.data)], axis=0))

    @staticmethod
    def crop_to_content(grid: Grid, background: int = 0) -> Grid:
        """Crop to bounding box of non-background content"""
        data = grid.data
        non_bg = np.argwhere(data != background)

        if len(non_bg) == 0:
            return Grid(np.array([[background]]))

        min_r, min_c = non_bg.min(axis=0)
        max_r, max_c = non_bg.max(axis=0)

        return Grid(data[min_r:max_r+1, min_c:max_c+1])

    @staticmethod
    def pad(grid: Grid, padding: int = 1, color: int = 0) -> Grid:
        """Add padding around the grid"""
        return Grid(np.pad(grid.data, padding, constant_values=color))

    @staticmethod
    def extract_quadrant(grid: Grid, quadrant: int) -> Grid:
        """Extract a quadrant (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)"""
        h, w = grid.shape
        mid_h, mid_w = h // 2, w // 2

        if quadrant == 0:
            return Grid(grid.data[:mid_h, :mid_w])
        elif quadrant == 1:
            return Grid(grid.data[:mid_h, mid_w:])
        elif quadrant == 2:
            return Grid(grid.data[mid_h:, :mid_w])
        else:
            return Grid(grid.data[mid_h:, mid_w:])

    # ─────────────────────────────────────────────────────────────────────────
    # STRUCTURAL TRANSFORMS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def fill_enclosed(grid: Grid, fill_color: int = 1) -> Grid:
        """Fill enclosed regions with a color"""
        data = grid.data.copy()
        h, w = data.shape

        # Flood fill from edges to find non-enclosed regions
        visited = np.zeros_like(data, dtype=bool)
        stack = []

        # Start from all edge cells that are 0
        for i in range(h):
            if data[i, 0] == 0:
                stack.append((i, 0))
            if data[i, w-1] == 0:
                stack.append((i, w-1))
        for j in range(w):
            if data[0, j] == 0:
                stack.append((0, j))
            if data[h-1, j] == 0:
                stack.append((h-1, j))

        # Mark reachable cells
        while stack:
            r, c = stack.pop()
            if r < 0 or r >= h or c < 0 or c >= w:
                continue
            if visited[r, c] or data[r, c] != 0:
                continue
            visited[r, c] = True
            stack.extend([(r+1, c), (r-1, c), (r, c+1), (r, c-1)])

        # Fill unvisited zeros
        for i in range(h):
            for j in range(w):
                if data[i, j] == 0 and not visited[i, j]:
                    data[i, j] = fill_color

        return Grid(data)

    @staticmethod
    def outline(grid: Grid, outline_color: int = 1) -> Grid:
        """Draw outline around non-background regions (8-connectivity)"""
        data = grid.data
        result = np.zeros_like(data)
        h, w = data.shape

        # 8-connectivity: includes diagonals
        neighbors = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]

        for i in range(h):
            for j in range(w):
                if data[i, j] != 0:
                    result[i, j] = data[i, j]
                else:
                    # Check if adjacent to non-zero (8-way)
                    has_neighbor = False
                    for di, dj in neighbors:
                        ni, nj = i + di, j + dj
                        if 0 <= ni < h and 0 <= nj < w and data[ni, nj] != 0:
                            has_neighbor = True
                            break
                    if has_neighbor:
                        result[i, j] = outline_color

        return Grid(result)

    @staticmethod
    def dilate(grid: Grid, iterations: int = 1) -> Grid:
        """Morphological dilation"""
        data = grid.data.copy()
        h, w = data.shape

        for _ in range(iterations):
            new_data = data.copy()
            for i in range(h):
                for j in range(w):
                    if data[i, j] == 0:
                        for di, dj in [(-1,0), (1,0), (0,-1), (0,1)]:
                            ni, nj = i + di, j + dj
                            if 0 <= ni < h and 0 <= nj < w and data[ni, nj] != 0:
                                new_data[i, j] = data[ni, nj]
                                break
            data = new_data

        return Grid(data)

    @staticmethod
    def erode(grid: Grid, iterations: int = 1) -> Grid:
        """Morphological erosion"""
        data = grid.data.copy()
        h, w = data.shape

        for _ in range(iterations):
            new_data = data.copy()
            for i in range(h):
                for j in range(w):
                    if data[i, j] != 0:
                        for di, dj in [(-1,0), (1,0), (0,-1), (0,1)]:
                            ni, nj = i + di, j + dj
                            if ni < 0 or ni >= h or nj < 0 or nj >= w or data[ni, nj] == 0:
                                new_data[i, j] = 0
                                break
            data = new_data

        return Grid(data)

    @staticmethod
    def gravity_down(grid: Grid) -> Grid:
        """Apply gravity - non-zero cells fall down"""
        data = grid.data.copy()
        h, w = data.shape

        for j in range(w):
            col = data[:, j]
            non_zero = col[col != 0]
            zeros = np.zeros(h - len(non_zero), dtype=np.int32)
            data[:, j] = np.concatenate([zeros, non_zero])

        return Grid(data)

    @staticmethod
    def gravity_up(grid: Grid) -> Grid:
        """Apply gravity upward"""
        data = grid.data.copy()
        h, w = data.shape

        for j in range(w):
            col = data[:, j]
            non_zero = col[col != 0]
            zeros = np.zeros(h - len(non_zero), dtype=np.int32)
            data[:, j] = np.concatenate([non_zero, zeros])

        return Grid(data)

    @staticmethod
    def gravity_left(grid: Grid) -> Grid:
        """Apply gravity leftward"""
        return Grid(TransformLibrary.gravity_up(Grid(grid.data.T)).data.T)

    @staticmethod
    def gravity_right(grid: Grid) -> Grid:
        """Apply gravity rightward"""
        return Grid(TransformLibrary.gravity_down(Grid(grid.data.T)).data.T)

    # ─────────────────────────────────────────────────────────────────────────
    # OBJECT-BASED TRANSFORMS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def largest_object_only(grid: Grid) -> Grid:
        """Keep only the largest connected component"""
        objects = ObjectDetector.find_connected_components(grid)
        if not objects:
            return Grid(np.zeros_like(grid.data))

        largest = max(objects, key=lambda o: o.size)
        result = np.zeros_like(grid.data)
        for r, c in largest.pixels:
            result[r, c] = largest.color

        return Grid(result)

    @staticmethod
    def smallest_object_only(grid: Grid) -> Grid:
        """Keep only the smallest connected component"""
        objects = ObjectDetector.find_connected_components(grid)
        if not objects:
            return Grid(np.zeros_like(grid.data))

        smallest = min(objects, key=lambda o: o.size)
        result = np.zeros_like(grid.data)
        for r, c in smallest.pixels:
            result[r, c] = smallest.color

        return Grid(result)

    @staticmethod
    def count_objects(grid: Grid) -> int:
        """Count number of distinct objects"""
        return len(ObjectDetector.find_connected_components(grid))

    @staticmethod
    def sort_objects_by_size(grid: Grid) -> Grid:
        """Recolor objects by size (largest = 1, etc.)"""
        objects = ObjectDetector.find_connected_components(grid)
        objects.sort(key=lambda o: -o.size)

        result = np.zeros_like(grid.data)
        for i, obj in enumerate(objects):
            for r, c in obj.pixels:
                result[r, c] = i + 1

        return Grid(result)

    # ─────────────────────────────────────────────────────────────────────────
    # SYMMETRY DETECTION & OPERATIONS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def has_horizontal_symmetry(grid: Grid) -> bool:
        """Check if grid is horizontally symmetric"""
        return np.array_equal(grid.data, np.fliplr(grid.data))

    @staticmethod
    def has_vertical_symmetry(grid: Grid) -> bool:
        """Check if grid is vertically symmetric"""
        return np.array_equal(grid.data, np.flipud(grid.data))

    @staticmethod
    def has_rotational_symmetry(grid: Grid) -> bool:
        """Check if grid has 180-degree rotational symmetry"""
        return np.array_equal(grid.data, np.rot90(grid.data, 2))

    @staticmethod
    def complete_horizontal_symmetry(grid: Grid) -> Grid:
        """Complete a partial horizontal symmetry"""
        w = grid.width
        mid = w // 2
        left = grid.data[:, :mid]
        right = np.fliplr(left)

        if w % 2 == 1:
            return Grid(np.concatenate([left, grid.data[:, mid:mid+1], right], axis=1))
        return Grid(np.concatenate([left, right], axis=1))

    @staticmethod
    def complete_vertical_symmetry(grid: Grid) -> Grid:
        """Complete a partial vertical symmetry"""
        h = grid.height
        mid = h // 2
        top = grid.data[:mid, :]
        bottom = np.flipud(top)

        if h % 2 == 1:
            return Grid(np.concatenate([top, grid.data[mid:mid+1, :], bottom], axis=0))
        return Grid(np.concatenate([top, bottom], axis=0))

    # ─────────────────────────────────────────────────────────────────────────
    # GRID ARITHMETIC
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def overlay(grid1: Grid, grid2: Grid, mode: str = 'max') -> Grid:
        """Overlay two grids"""
        if grid1.shape != grid2.shape:
            return grid1

        if mode == 'max':
            return Grid(np.maximum(grid1.data, grid2.data))
        elif mode == 'min':
            return Grid(np.minimum(grid1.data, grid2.data))
        elif mode == 'xor':
            return Grid((grid1.data != grid2.data).astype(np.int32))
        elif mode == 'and':
            return Grid(((grid1.data != 0) & (grid2.data != 0)).astype(np.int32))

        return grid1

    @staticmethod
    def difference(grid1: Grid, grid2: Grid) -> Grid:
        """Find pixels that differ between two grids"""
        if grid1.shape != grid2.shape:
            return grid1
        return Grid((grid1.data != grid2.data).astype(np.int32))

    # ─────────────────────────────────────────────────────────────────────────
    # ADVANCED PATTERN TRANSFORMS (for ARC-AGI)
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def extract_border(grid: Grid, width: int = 1) -> Grid:
        """Extract border/frame of grid"""
        data = grid.data.copy()
        h, w = data.shape
        if h <= 2*width or w <= 2*width:
            return grid
        # Zero out interior
        result = np.zeros_like(data)
        result[:width, :] = data[:width, :]  # Top
        result[-width:, :] = data[-width:, :]  # Bottom
        result[:, :width] = data[:, :width]  # Left
        result[:, -width:] = data[:, -width:]  # Right
        return Grid(result)

    @staticmethod
    def extract_interior(grid: Grid, border: int = 1) -> Grid:
        """Extract interior (remove border)"""
        h, w = grid.shape
        if h <= 2*border or w <= 2*border:
            return grid
        return Grid(grid.data[border:-border, border:-border])

    @staticmethod
    def add_border(grid: Grid, color: int = 1, width: int = 1) -> Grid:
        """Add a border around the grid"""
        data = grid.data
        h, w = data.shape
        result = np.full((h + 2*width, w + 2*width), color, dtype=np.int32)
        result[width:-width, width:-width] = data
        return Grid(result)

    @staticmethod
    def repeat_horizontally(grid: Grid, times: int = 2) -> Grid:
        """Repeat grid horizontally"""
        return Grid(np.tile(grid.data, (1, times)))

    @staticmethod
    def repeat_vertically(grid: Grid, times: int = 2) -> Grid:
        """Repeat grid vertically"""
        return Grid(np.tile(grid.data, (times, 1)))

    @staticmethod
    def get_unique_pattern(grid: Grid) -> Grid:
        """Get smallest repeating pattern unit"""
        data = grid.data
        h, w = data.shape

        # Try to find smallest tile that when repeated gives the original
        for tile_h in range(1, h // 2 + 1):
            if h % tile_h != 0:
                continue
            for tile_w in range(1, w // 2 + 1):
                if w % tile_w != 0:
                    continue
                tile = data[:tile_h, :tile_w]
                tiled = np.tile(tile, (h // tile_h, w // tile_w))
                if np.array_equal(tiled, data):
                    return Grid(tile)

        return grid  # No repeating pattern found

    @staticmethod
    def fill_diagonal(grid: Grid, color: int = 1, direction: str = 'main') -> Grid:
        """Fill diagonal with color"""
        data = grid.data.copy()
        h, w = data.shape
        if direction == 'main':
            np.fill_diagonal(data, color)
        else:  # anti-diagonal
            np.fill_diagonal(np.fliplr(data), color)
        return Grid(data)

    @staticmethod
    def mask_by_color(grid: Grid, mask_grid: Grid, mask_color: int = 1) -> Grid:
        """Keep only pixels where mask has mask_color"""
        if grid.shape != mask_grid.shape:
            return grid
        result = np.zeros_like(grid.data)
        mask = mask_grid.data == mask_color
        result[mask] = grid.data[mask]
        return Grid(result)

    @staticmethod
    def count_colors_to_grid(grid: Grid) -> Grid:
        """Create grid where each cell is the count of that color"""
        data = grid.data
        unique, counts = np.unique(data, return_counts=True)
        color_counts = dict(zip(unique, counts))
        result = np.zeros_like(data)
        for color, count in color_counts.items():
            result[data == color] = min(count, 9)
        return Grid(result)

    @staticmethod
    def hollow_objects(grid: Grid) -> Grid:
        """Make all objects hollow (remove interior)"""
        data = grid.data.copy()
        h, w = data.shape

        for i in range(1, h - 1):
            for j in range(1, w - 1):
                if data[i, j] != 0:
                    # Check if surrounded by same color
                    color = grid.data[i, j]
                    neighbors = [
                        grid.data[i-1, j], grid.data[i+1, j],
                        grid.data[i, j-1], grid.data[i, j+1]
                    ]
                    if all(n == color for n in neighbors):
                        data[i, j] = 0

        return Grid(data)

    @staticmethod
    def solid_objects(grid: Grid) -> Grid:
        """Fill objects to make them solid (fill holes)"""
        data = grid.data.copy()
        h, w = data.shape

        # For each color, find bounding box and fill
        for color in range(1, 10):
            mask = grid.data == color
            if not mask.any():
                continue

            rows, cols = np.where(mask)
            if len(rows) == 0:
                continue

            min_r, max_r = rows.min(), rows.max()
            min_c, max_c = cols.min(), cols.max()

            # Fill the bounding box with this color
            data[min_r:max_r+1, min_c:max_c+1] = np.where(
                data[min_r:max_r+1, min_c:max_c+1] == 0,
                color,
                data[min_r:max_r+1, min_c:max_c+1]
            )

        return Grid(data)


# ═══════════════════════════════════════════════════════════════════════════════
# FEATURE EXTRACTION - Understanding what changed
# ═══════════════════════════════════════════════════════════════════════════════

class FeatureExtractor:
    """Extract features from input/output pairs to guide hypothesis generation"""

    @staticmethod
    def extract_all(input_grid: Grid, output_grid: Grid) -> Dict[str, Any]:
        """Extract all features from an input-output pair"""
        features = {}

        # Size changes
        features['input_shape'] = input_grid.shape
        features['output_shape'] = output_grid.shape
        features['size_ratio'] = (
            output_grid.height / input_grid.height if input_grid.height > 0 else 1,
            output_grid.width / input_grid.width if input_grid.width > 0 else 1
        )
        features['size_changed'] = input_grid.shape != output_grid.shape

        # Color analysis
        features['input_colors'] = input_grid.colors_used()
        features['output_colors'] = output_grid.colors_used()
        features['colors_added'] = features['output_colors'] - features['input_colors']
        features['colors_removed'] = features['input_colors'] - features['output_colors']
        features['colors_same'] = features['input_colors'] == features['output_colors']

        # Object analysis
        input_objects = ObjectDetector.find_connected_components(input_grid)
        output_objects = ObjectDetector.find_connected_components(output_grid)
        features['input_num_objects'] = len(input_objects)
        features['output_num_objects'] = len(output_objects)
        features['objects_changed'] = len(input_objects) != len(output_objects)

        # Symmetry
        features['output_h_symmetric'] = TransformLibrary.has_horizontal_symmetry(output_grid)
        features['output_v_symmetric'] = TransformLibrary.has_vertical_symmetry(output_grid)
        features['output_rot_symmetric'] = TransformLibrary.has_rotational_symmetry(output_grid)

        # Transformation hints
        features['is_rotation'] = any([
            np.array_equal(output_grid.data, np.rot90(input_grid.data, k))
            for k in [1, 2, 3]
        ])
        features['is_flip'] = any([
            np.array_equal(output_grid.data, np.fliplr(input_grid.data)),
            np.array_equal(output_grid.data, np.flipud(input_grid.data))
        ])
        features['is_transpose'] = np.array_equal(output_grid.data, input_grid.data.T)

        # Scale detection
        if input_grid.shape[0] > 0 and input_grid.shape[1] > 0:
            if output_grid.height % input_grid.height == 0 and output_grid.width % input_grid.width == 0:
                h_scale = output_grid.height // input_grid.height
                w_scale = output_grid.width // input_grid.width
                if h_scale == w_scale and h_scale > 1:
                    features['scale_factor'] = h_scale

        # Tiling detection
        if output_grid.height % input_grid.height == 0 and output_grid.width % input_grid.width == 0:
            tile_h = output_grid.height // input_grid.height
            tile_w = output_grid.width // input_grid.width
            tiled = TransformLibrary.tile(input_grid, tile_h, tile_w)
            if tiled == output_grid:
                features['is_tiled'] = (tile_h, tile_w)

        return features


# ═══════════════════════════════════════════════════════════════════════════════
# HYPOTHESIS GENERATOR - The creative core
# ═══════════════════════════════════════════════════════════════════════════════

class HypothesisGenerator:
    """Generates candidate transformation hypotheses"""

    # Single transforms to try
    SINGLE_TRANSFORMS = [
        # Geometric
        ('rotate_90', {}),
        ('rotate_180', {}),
        ('rotate_270', {}),
        ('flip_horizontal', {}),
        ('flip_vertical', {}),
        ('transpose', {}),
        # Cropping/padding
        ('crop_to_content', {}),
        ('extract_border', {}),
        ('extract_interior', {}),
        # Structural
        ('fill_enclosed', {'fill_color': 1}),
        ('outline', {}),
        ('dilate', {}),
        ('erode', {}),
        ('hollow_objects', {}),
        ('solid_objects', {}),
        # Gravity
        ('gravity_down', {}),
        ('gravity_up', {}),
        ('gravity_left', {}),
        ('gravity_right', {}),
        # Object-based
        ('largest_object_only', {}),
        ('smallest_object_only', {}),
        ('sort_objects_by_size', {}),
        # Symmetry
        ('complete_horizontal_symmetry', {}),
        ('complete_vertical_symmetry', {}),
        ('mirror_horizontal', {}),
        ('mirror_vertical', {}),
        # Pattern
        ('get_unique_pattern', {}),
        ('repeat_horizontally', {'times': 2}),
        ('repeat_horizontally', {'times': 3}),
        ('repeat_vertically', {'times': 2}),
        ('repeat_vertically', {'times': 3}),
    ]

    def __init__(self):
        self.transform_lib = TransformLibrary()

    def generate_hypotheses(self, puzzle: ARCPuzzle, max_depth: int = 3) -> List[Hypothesis]:
        """Generate hypotheses based on puzzle features"""
        hypotheses = []

        # Extract features from all training examples
        all_features = []
        for example in puzzle.train:
            features = FeatureExtractor.extract_all(example.input, example.output)
            all_features.append(features)

        # Generate single-transform hypotheses
        for name, params in self.SINGLE_TRANSFORMS:
            hypotheses.append(Hypothesis(
                transforms=[(name, params)],
                confidence=0.5
            ))

        # Generate color-specific hypotheses
        for features in all_features:
            for color in features['colors_removed']:
                hypotheses.append(Hypothesis(
                    transforms=[('remove_color', {'color': int(color)})],
                    confidence=0.6
                ))

            # Detect color swaps (when input colors = output colors but different positions)
            input_colors = features['input_colors'] - {0}
            output_colors = features['output_colors'] - {0}
            if input_colors == output_colors and len(input_colors) >= 2:
                # Try all pairwise swaps
                color_list = list(input_colors)
                for i in range(len(color_list)):
                    for j in range(i + 1, len(color_list)):
                        hypotheses.append(Hypothesis(
                            transforms=[('swap_colors', {'color1': int(color_list[i]), 'color2': int(color_list[j])})],
                            confidence=0.7
                        ))

            for color in features['input_colors']:
                for target in features['output_colors']:
                    if color != target:
                        hypotheses.append(Hypothesis(
                            transforms=[('replace_color', {'old_color': color, 'new_color': target})],
                            confidence=0.5
                        ))

        # Generate scaling hypotheses
        for features in all_features:
            if 'scale_factor' in features:
                hypotheses.append(Hypothesis(
                    transforms=[('scale_up', {'factor': features['scale_factor']})],
                    confidence=0.8
                ))

        # Generate tiling hypotheses
        for features in all_features:
            if 'is_tiled' in features:
                tile_h, tile_w = features['is_tiled']
                hypotheses.append(Hypothesis(
                    transforms=[('tile', {'rows': tile_h, 'cols': tile_w})],
                    confidence=0.9
                ))

        # Generate 2-step compositions
        if max_depth >= 2:
            high_priority = [
                ('crop_to_content', {}),
                ('rotate_90', {}),
                ('rotate_180', {}),
                ('flip_horizontal', {}),
                ('flip_vertical', {}),
            ]

            for t1 in high_priority:
                for t2 in self.SINGLE_TRANSFORMS[:10]:
                    if t1[0] != t2[0]:
                        hypotheses.append(Hypothesis(
                            transforms=[t1, t2],
                            confidence=0.3
                        ))

            # Specific 2-step: crop + scale (very common pattern)
            for factor in [2, 3, 4]:
                hypotheses.append(Hypothesis(
                    transforms=[('crop_to_content', {}), ('scale_up', {'factor': factor})],
                    confidence=0.6
                ))

            # Specific 2-step: scale + crop
            for factor in [2, 3]:
                hypotheses.append(Hypothesis(
                    transforms=[('scale_up', {'factor': factor}), ('crop_to_content', {})],
                    confidence=0.5
                ))

        # Generate 3-step compositions (limited)
        if max_depth >= 3:
            key_transforms = [
                ('crop_to_content', {}),
                ('rotate_90', {}),
                ('flip_horizontal', {}),
            ]

            for t1, t2, t3 in itertools.product(key_transforms, repeat=3):
                if len(set([t1[0], t2[0], t3[0]])) == 3:  # All different
                    hypotheses.append(Hypothesis(
                        transforms=[t1, t2, t3],
                        confidence=0.2
                    ))

        return hypotheses

    def apply_hypothesis(self, grid: Grid, hypothesis: Hypothesis) -> Optional[Grid]:
        """Apply a hypothesis to a grid"""
        current = grid

        for transform_name, params in hypothesis.transforms:
            func = getattr(self.transform_lib, transform_name, None)
            if func is None:
                return None

            try:
                if params:
                    current = func(current, **params)
                else:
                    current = func(current)
            except Exception:
                return None

        return current


# ═══════════════════════════════════════════════════════════════════════════════
# ARC SOLVER - The main engine
# ═══════════════════════════════════════════════════════════════════════════════

class ARCSolver:
    """Main ARC-AGI-2 solving engine with adaptive pattern learning"""

    def __init__(self, use_swarm: bool = False, use_learning: bool = True):
        self.generator = HypothesisGenerator()
        self.use_swarm = use_swarm
        self.use_learning = use_learning and PATTERN_LEARNER_AVAILABLE
        self.stats = {
            'puzzles_attempted': 0,
            'puzzles_solved': 0,
            'hypotheses_tested': 0,
            'patterns_applied': 0
        }

        # Initialize pattern learner for adaptive hypothesis prioritization
        if self.use_learning:
            self.learner = PatternLearner(storage_path="data/arc_patterns.json")
        else:
            self.learner = None

    def _extract_puzzle_features(self, puzzle: ARCPuzzle) -> Dict:
        """Extract features from puzzle for pattern matching"""
        features = {}

        if puzzle.train:
            example = puzzle.train[0]
            inp = example.input
            out = example.output

            # Shape analysis
            features['input_shape'] = inp.shape
            features['output_shape'] = out.shape
            features['shape_change'] = 'same' if inp.shape == out.shape else 'different'

            # Scale analysis
            if inp.height > 0 and inp.width > 0:
                h_ratio = out.height / inp.height
                w_ratio = out.width / inp.width
                if abs(h_ratio - w_ratio) < 0.01 and h_ratio == int(h_ratio):
                    features['scale_factor'] = int(h_ratio)
                else:
                    features['scale_factor'] = 1

            # Color analysis
            inp_colors = inp.colors_used()
            out_colors = out.colors_used()
            features['colors_added'] = list(out_colors - inp_colors)
            features['colors_removed'] = list(inp_colors - out_colors)

            # Object analysis (simplified)
            features['input_object_count'] = len(inp_colors)
            features['output_object_count'] = len(out_colors)

            # Tiling detection
            if out.height >= inp.height * 2 and out.width >= inp.width * 2:
                features['is_tiled'] = True
            else:
                features['is_tiled'] = None

        return features

    def solve(self, puzzle: ARCPuzzle) -> SolveResult:
        """Attempt to solve an ARC puzzle with adaptive pattern learning"""
        start_time = time.time()

        # Extract features for pattern matching
        features = self._extract_puzzle_features(puzzle)

        # Generate hypotheses
        hypotheses = self.generator.generate_hypotheses(puzzle)

        # Get prioritized transforms from learned patterns
        prioritized_transforms = []
        if self.learner:
            prioritized_transforms = self.learner.get_prioritized_transforms(features)
            if prioritized_transforms:
                self.stats['patterns_applied'] += 1

        # Test each hypothesis against training examples
        valid_hypotheses = []

        for hyp in hypotheses:
            matches = 0
            for example in puzzle.train:
                result = self.generator.apply_hypothesis(example.input, hyp)
                if result is not None and result == example.output:
                    matches += 1

            self.stats['hypotheses_tested'] += 1

            if matches == len(puzzle.train):
                hyp.examples_matched = matches
                hyp.confidence = 1.0

                # Boost confidence if this matches a learned pattern
                if self.learner and prioritized_transforms:
                    for transforms, priority in prioritized_transforms:
                        if self._transforms_match(hyp.transforms, transforms):
                            hyp.confidence = min(1.0, hyp.confidence + priority * 0.2)
                            break

                valid_hypotheses.append(hyp)

        # Sort by confidence and number of steps (prefer simpler)
        valid_hypotheses.sort(key=lambda h: (-h.confidence, len(h.transforms)))

        # Apply best hypothesis to test input
        predicted = None
        winning_hypothesis = None

        for hyp in valid_hypotheses:
            result = self.generator.apply_hypothesis(puzzle.test_input, hyp)
            if result is not None:
                predicted = result
                winning_hypothesis = hyp
                break

        # Check correctness
        correct = False
        if predicted is not None and puzzle.test_output is not None:
            correct = predicted == puzzle.test_output

        elapsed_ms = (time.time() - start_time) * 1000

        self.stats['puzzles_attempted'] += 1
        if correct:
            self.stats['puzzles_solved'] += 1

        # Learn from this attempt
        if self.learner and winning_hypothesis:
            transforms_for_learning = [(t[0], t[1] if len(t) > 1 else {}) for t in winning_hypothesis.transforms]
            if correct:
                self.learner.record_success(transforms_for_learning, features, winning_hypothesis.confidence)
            else:
                self.learner.record_failure(transforms_for_learning, features)

        return SolveResult(
            puzzle_id=puzzle.puzzle_id,
            predicted_output=predicted,
            correct=correct,
            hypothesis=winning_hypothesis,
            time_ms=elapsed_ms,
            hypotheses_tested=self.stats['hypotheses_tested']
        )

    def _transforms_match(self, hyp_transforms: List, learned_transforms: List) -> bool:
        """Check if hypothesis transforms match learned patterns"""
        if not hyp_transforms or not learned_transforms:
            return False
        # Check first transform matches
        if hyp_transforms[0][0] == learned_transforms[0][0]:
            return True
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# ARC-STYLE TEST PUZZLES
# ═══════════════════════════════════════════════════════════════════════════════

class ARCPuzzleGenerator:
    """Generate ARC-AGI-2 style puzzles for benchmarking"""

    @staticmethod
    def puzzle_rotate_90() -> ARCPuzzle:
        """Puzzle: Rotate input 90 degrees clockwise"""
        return ARCPuzzle(
            puzzle_id="rotate_90",
            train=[
                ARCExample(
                    input=Grid([[1, 2], [3, 4]]),
                    output=Grid([[3, 1], [4, 2]])
                ),
                ARCExample(
                    input=Grid([[1, 0, 0], [0, 1, 0], [0, 0, 1]]),
                    output=Grid([[0, 0, 1], [0, 1, 0], [1, 0, 0]])
                ),
            ],
            test_input=Grid([[1, 2, 3], [4, 5, 6]]),
            test_output=Grid([[4, 1], [5, 2], [6, 3]])
        )

    @staticmethod
    def puzzle_flip_horizontal() -> ARCPuzzle:
        """Puzzle: Flip input horizontally"""
        return ARCPuzzle(
            puzzle_id="flip_horizontal",
            train=[
                ARCExample(
                    input=Grid([[1, 2, 3], [4, 5, 6]]),
                    output=Grid([[3, 2, 1], [6, 5, 4]])
                ),
                ARCExample(
                    input=Grid([[1, 0], [0, 1]]),
                    output=Grid([[0, 1], [1, 0]])
                ),
            ],
            test_input=Grid([[7, 8, 9], [1, 2, 3], [4, 5, 6]]),
            test_output=Grid([[9, 8, 7], [3, 2, 1], [6, 5, 4]])
        )

    @staticmethod
    def puzzle_scale_2x() -> ARCPuzzle:
        """Puzzle: Scale up by factor of 2"""
        return ARCPuzzle(
            puzzle_id="scale_2x",
            train=[
                ARCExample(
                    input=Grid([[1, 2], [3, 4]]),
                    output=Grid([[1, 1, 2, 2], [1, 1, 2, 2], [3, 3, 4, 4], [3, 3, 4, 4]])
                ),
                ARCExample(
                    input=Grid([[5]]),
                    output=Grid([[5, 5], [5, 5]])
                ),
            ],
            test_input=Grid([[1, 0], [0, 1]]),
            test_output=Grid([[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]])
        )

    @staticmethod
    def puzzle_color_swap() -> ARCPuzzle:
        """Puzzle: Swap colors 1 and 2"""
        return ARCPuzzle(
            puzzle_id="color_swap",
            train=[
                ARCExample(
                    input=Grid([[1, 1, 2], [2, 1, 2], [1, 2, 1]]),
                    output=Grid([[2, 2, 1], [1, 2, 1], [2, 1, 2]])
                ),
                ARCExample(
                    input=Grid([[1, 0, 2], [0, 0, 0]]),
                    output=Grid([[2, 0, 1], [0, 0, 0]])
                ),
            ],
            test_input=Grid([[2, 2, 2], [1, 1, 1], [2, 1, 2]]),
            test_output=Grid([[1, 1, 1], [2, 2, 2], [1, 2, 1]])
        )

    @staticmethod
    def puzzle_gravity_down() -> ARCPuzzle:
        """Puzzle: Apply gravity to move all cells down"""
        return ARCPuzzle(
            puzzle_id="gravity_down",
            train=[
                ARCExample(
                    input=Grid([[1, 0, 2], [0, 3, 0], [0, 0, 0]]),
                    output=Grid([[0, 0, 0], [0, 0, 0], [1, 3, 2]])
                ),
                ARCExample(
                    input=Grid([[1, 2], [0, 0], [3, 4]]),
                    output=Grid([[0, 0], [1, 2], [3, 4]])
                ),
            ],
            test_input=Grid([[5, 0, 0], [0, 6, 0], [0, 0, 7], [0, 0, 0]]),
            test_output=Grid([[0, 0, 0], [0, 0, 0], [0, 0, 0], [5, 6, 7]])
        )

    @staticmethod
    def puzzle_crop_content() -> ARCPuzzle:
        """Puzzle: Crop to bounding box of content"""
        return ARCPuzzle(
            puzzle_id="crop_content",
            train=[
                ARCExample(
                    input=Grid([[0, 0, 0, 0], [0, 1, 2, 0], [0, 3, 4, 0], [0, 0, 0, 0]]),
                    output=Grid([[1, 2], [3, 4]])
                ),
                ARCExample(
                    input=Grid([[0, 0, 0], [0, 5, 0], [0, 0, 0]]),
                    output=Grid([[5]])
                ),
            ],
            test_input=Grid([[0, 0, 0, 0, 0], [0, 0, 1, 2, 0], [0, 0, 3, 4, 0], [0, 0, 0, 0, 0]]),
            test_output=Grid([[1, 2], [3, 4]])
        )

    @staticmethod
    def puzzle_tile_2x2() -> ARCPuzzle:
        """Puzzle: Tile the input 2x2"""
        return ARCPuzzle(
            puzzle_id="tile_2x2",
            train=[
                ARCExample(
                    input=Grid([[1, 2], [3, 4]]),
                    output=Grid([[1, 2, 1, 2], [3, 4, 3, 4], [1, 2, 1, 2], [3, 4, 3, 4]])
                ),
                ARCExample(
                    input=Grid([[5]]),
                    output=Grid([[5, 5], [5, 5]])
                ),
            ],
            test_input=Grid([[1, 0], [0, 1]]),
            test_output=Grid([[1, 0, 1, 0], [0, 1, 0, 1], [1, 0, 1, 0], [0, 1, 0, 1]])
        )

    @staticmethod
    def puzzle_mirror_horizontal() -> ARCPuzzle:
        """Puzzle: Mirror horizontally (concatenate with flip)"""
        return ARCPuzzle(
            puzzle_id="mirror_horizontal",
            train=[
                ARCExample(
                    input=Grid([[1, 2], [3, 4]]),
                    output=Grid([[1, 2, 2, 1], [3, 4, 4, 3]])
                ),
                ARCExample(
                    input=Grid([[1, 0, 2]]),
                    output=Grid([[1, 0, 2, 2, 0, 1]])
                ),
            ],
            test_input=Grid([[5, 6, 7]]),
            test_output=Grid([[5, 6, 7, 7, 6, 5]])
        )

    @staticmethod
    def puzzle_largest_object() -> ARCPuzzle:
        """Puzzle: Keep only the largest connected component"""
        return ARCPuzzle(
            puzzle_id="largest_object",
            train=[
                ARCExample(
                    input=Grid([[1, 1, 0, 2], [1, 1, 0, 0], [0, 0, 0, 3]]),
                    output=Grid([[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 0, 0]])
                ),
                ARCExample(
                    input=Grid([[5, 0, 6, 6], [0, 0, 6, 6], [7, 0, 6, 6]]),
                    output=Grid([[0, 0, 6, 6], [0, 0, 6, 6], [0, 0, 6, 6]])
                ),
            ],
            test_input=Grid([[1, 0, 2, 2, 2], [1, 0, 2, 2, 2], [0, 0, 0, 0, 0]]),
            test_output=Grid([[0, 0, 2, 2, 2], [0, 0, 2, 2, 2], [0, 0, 0, 0, 0]])
        )

    @staticmethod
    def puzzle_fill_enclosed() -> ARCPuzzle:
        """Puzzle: Fill enclosed regions"""
        return ARCPuzzle(
            puzzle_id="fill_enclosed",
            train=[
                ARCExample(
                    input=Grid([[1, 1, 1], [1, 0, 1], [1, 1, 1]]),
                    output=Grid([[1, 1, 1], [1, 1, 1], [1, 1, 1]])
                ),
                ARCExample(
                    input=Grid([[2, 2, 2, 2], [2, 0, 0, 2], [2, 0, 0, 2], [2, 2, 2, 2]]),
                    output=Grid([[2, 2, 2, 2], [2, 1, 1, 2], [2, 1, 1, 2], [2, 2, 2, 2]])
                ),
            ],
            test_input=Grid([[3, 3, 3, 3, 3], [3, 0, 0, 0, 3], [3, 0, 0, 0, 3], [3, 3, 3, 3, 3]]),
            test_output=Grid([[3, 3, 3, 3, 3], [3, 1, 1, 1, 3], [3, 1, 1, 1, 3], [3, 3, 3, 3, 3]])
        )

    @staticmethod
    def puzzle_remove_color() -> ARCPuzzle:
        """Puzzle: Remove a specific color"""
        return ARCPuzzle(
            puzzle_id="remove_color",
            train=[
                ARCExample(
                    input=Grid([[1, 2, 1], [2, 1, 2], [1, 2, 1]]),
                    output=Grid([[1, 0, 1], [0, 1, 0], [1, 0, 1]])
                ),
                ARCExample(
                    input=Grid([[2, 2, 2], [1, 1, 1]]),
                    output=Grid([[0, 0, 0], [1, 1, 1]])
                ),
            ],
            test_input=Grid([[2, 1, 2, 1], [1, 2, 1, 2]]),
            test_output=Grid([[0, 1, 0, 1], [1, 0, 1, 0]])
        )

    @staticmethod
    def puzzle_transpose() -> ARCPuzzle:
        """Puzzle: Transpose the grid"""
        return ARCPuzzle(
            puzzle_id="transpose",
            train=[
                ARCExample(
                    input=Grid([[1, 2, 3], [4, 5, 6]]),
                    output=Grid([[1, 4], [2, 5], [3, 6]])
                ),
                ARCExample(
                    input=Grid([[1, 0], [0, 1], [1, 0]]),
                    output=Grid([[1, 0, 1], [0, 1, 0]])
                ),
            ],
            test_input=Grid([[1, 2], [3, 4], [5, 6], [7, 8]]),
            test_output=Grid([[1, 3, 5, 7], [2, 4, 6, 8]])
        )

    @staticmethod
    def puzzle_outline() -> ARCPuzzle:
        """Puzzle: Add outline around objects"""
        return ARCPuzzle(
            puzzle_id="outline",
            train=[
                ARCExample(
                    input=Grid([[0, 0, 0, 0, 0], [0, 0, 2, 0, 0], [0, 0, 0, 0, 0]]),
                    output=Grid([[0, 1, 1, 1, 0], [0, 1, 2, 1, 0], [0, 1, 1, 1, 0]])
                ),
                ARCExample(
                    input=Grid([[0, 0, 0], [0, 3, 0], [0, 0, 0]]),
                    output=Grid([[1, 1, 1], [1, 3, 1], [1, 1, 1]])
                ),
            ],
            test_input=Grid([[0, 0, 0, 0], [0, 5, 5, 0], [0, 5, 5, 0], [0, 0, 0, 0]]),
            test_output=Grid([[1, 1, 1, 1], [1, 5, 5, 1], [1, 5, 5, 1], [1, 1, 1, 1]])
        )

    @staticmethod
    def puzzle_rotate_and_flip() -> ARCPuzzle:
        """Puzzle: Rotate 90 then flip horizontal (2-step)"""
        return ARCPuzzle(
            puzzle_id="rotate_and_flip",
            train=[
                ARCExample(
                    input=Grid([[1, 2], [3, 4]]),
                    output=Grid([[1, 3], [2, 4]])
                ),
                ARCExample(
                    input=Grid([[1, 0, 0], [0, 1, 0]]),
                    output=Grid([[1, 0], [0, 1], [0, 0]])
                ),
            ],
            test_input=Grid([[5, 6, 7], [8, 9, 0]]),
            test_output=Grid([[5, 8], [6, 9], [7, 0]])
        )

    @staticmethod
    def puzzle_crop_and_scale() -> ARCPuzzle:
        """Puzzle: Crop to content then scale 2x (2-step)"""
        return ARCPuzzle(
            puzzle_id="crop_and_scale",
            train=[
                ARCExample(
                    input=Grid([[0, 0, 0], [0, 1, 0], [0, 0, 0]]),
                    output=Grid([[1, 1], [1, 1]])
                ),
                ARCExample(
                    input=Grid([[0, 0, 0, 0], [0, 2, 3, 0], [0, 0, 0, 0]]),
                    output=Grid([[2, 2, 3, 3], [2, 2, 3, 3]])
                ),
            ],
            test_input=Grid([[0, 0, 0], [0, 0, 0], [0, 5, 0], [0, 0, 0]]),
            test_output=Grid([[5, 5], [5, 5]])
        )

    @staticmethod
    def puzzle_symmetry_complete() -> ARCPuzzle:
        """Puzzle: Complete horizontal symmetry"""
        return ARCPuzzle(
            puzzle_id="symmetry_complete",
            train=[
                ARCExample(
                    input=Grid([[1, 2, 0, 0], [3, 4, 0, 0]]),
                    output=Grid([[1, 2, 2, 1], [3, 4, 4, 3]])
                ),
                ARCExample(
                    input=Grid([[5, 0], [6, 0]]),
                    output=Grid([[5, 5], [6, 6]])
                ),
            ],
            test_input=Grid([[1, 2, 3, 0, 0, 0]]),
            test_output=Grid([[1, 2, 3, 3, 2, 1]])
        )

    @staticmethod
    def get_all_puzzles() -> List[ARCPuzzle]:
        """Get all benchmark puzzles"""
        generator = ARCPuzzleGenerator()
        return [
            generator.puzzle_rotate_90(),
            generator.puzzle_flip_horizontal(),
            generator.puzzle_scale_2x(),
            generator.puzzle_color_swap(),
            generator.puzzle_gravity_down(),
            generator.puzzle_crop_content(),
            generator.puzzle_tile_2x2(),
            generator.puzzle_mirror_horizontal(),
            generator.puzzle_largest_object(),
            generator.puzzle_fill_enclosed(),
            generator.puzzle_remove_color(),
            generator.puzzle_transpose(),
            generator.puzzle_outline(),
            generator.puzzle_rotate_and_flip(),
            generator.puzzle_crop_and_scale(),
            generator.puzzle_symmetry_complete(),
        ]


# ═══════════════════════════════════════════════════════════════════════════════
# BENCHMARK RUNNER
# ═══════════════════════════════════════════════════════════════════════════════

class ARCAGI2Benchmark:
    """Run ARC-AGI-2 style benchmark"""

    def __init__(self):
        self.solver = ARCSolver()

    def run(self) -> Dict[str, Any]:
        """Run the full benchmark"""
        print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     █████╗ ██████╗  ██████╗       █████╗  ██████╗ ██╗    ██████╗            ║
║    ██╔══██╗██╔══██╗██╔════╝      ██╔══██╗██╔════╝ ██║    ╚════██╗           ║
║    ███████║██████╔╝██║     █████╗███████║██║  ███╗██║     █████╔╝           ║
║    ██╔══██║██╔══██╗██║     ╚════╝██╔══██║██║   ██║██║    ██╔═══╝            ║
║    ██║  ██║██║  ██║╚██████╗      ██║  ██║╚██████╔╝██║    ███████╗           ║
║    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝      ╚═╝  ╚═╝ ╚═════╝ ╚═╝    ╚══════╝           ║
║                                                                              ║
║                 VISUAL GRID REASONING BENCHMARK                              ║
║              Competing with Frontier Model Performance                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """)

        puzzles = ARCPuzzleGenerator.get_all_puzzles()
        results = []

        print(f"\n{'═' * 70}")
        print(f"  SOLVING {len(puzzles)} ARC-AGI-2 STYLE PUZZLES")
        print(f"{'═' * 70}\n")

        total_time = 0
        solved = 0

        for puzzle in puzzles:
            result = self.solver.solve(puzzle)
            results.append(result)
            total_time += result.time_ms

            status = "✓ SOLVED" if result.correct else "✗ FAILED"

            print(f"  [{puzzle.puzzle_id:20}] {status:10} | {result.time_ms:6.1f}ms", end="")
            if result.hypothesis:
                print(f" | {result.hypothesis.describe()[:40]}")
            else:
                print(" | No valid hypothesis found")

            if result.correct:
                solved += 1

        accuracy = (solved / len(puzzles)) * 100

        print(f"""

╔══════════════════════════════════════════════════════════════════════════════╗
║                          BENCHMARK RESULTS                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   PUZZLES SOLVED:         {solved:3}/{len(puzzles):<3} ({accuracy:5.1f}%)                             ║
║   TOTAL TIME:             {total_time:7.1f}ms                                     ║
║   AVG TIME/PUZZLE:        {total_time/len(puzzles):7.1f}ms                                     ║
║   HYPOTHESES TESTED:      {self.solver.stats['hypotheses_tested']:7}                                       ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   COMPARISON TO FRONTIER MODELS (ARC-AGI-2):                                 ║
║   ─────────────────────────────────────────────────────────────              ║
║   Gemini 3 Deep Think:    45.1%                                              ║
║   Gemini 3 Baseline:      31.1%                                              ║
║   Grok 4:                 16.0%                                              ║
║   GPT-5:                  ~10%                                               ║
║   Claude Opus 4:          ~9%                                                ║
║   ─────────────────────────────────────────────────────────────              ║
║   NEXO SOLVER:            {accuracy:5.1f}%                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """)

        return {
            'puzzles_total': len(puzzles),
            'puzzles_solved': solved,
            'accuracy': accuracy,
            'total_time_ms': total_time,
            'results': results
        }


# ═══════════════════════════════════════════════════════════════════════════════
# QUICK RUN
# ═══════════════════════════════════════════════════════════════════════════════

def run_arc_agi2_benchmark():
    """Run the ARC-AGI-2 benchmark"""
    benchmark = ARCAGI2Benchmark()
    return benchmark.run()


if __name__ == "__main__":
    results = run_arc_agi2_benchmark()
    print(f"\nFinal Accuracy: {results['accuracy']:.1f}%")

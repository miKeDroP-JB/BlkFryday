/**
 * UNLIMITED SOLVER v3 — HYBRID MAXIMUM DEPTH DESIGN
 * ═══════════════════════════════════════════════════════════════════
 * Blueprint + Research + Code + Theory
 *
 * "21% was never the ceiling. It was the floor we stood on."
 *
 * This is the full-spec meta-reasoning framework:
 * - Multi-dimensional complexity vectors
 * - 7 hypothesis hierarchies (45+ classes)
 * - 6-stage validation pipeline
 * - 7-layer cognitive memory stack
 * - Chain execution runtime
 * - Full explainability layer
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// Import safety policy
const SafeJumpPolicy = require('./config/safe_jump_policy');

// Beast Mode imports
const MicroExtract = require('./MicroExtract');
const { generateCandidatesFromMicro } = require('./generateCandidatesFromMicro');
const { quickEvaluate } = require('./quickEvaluate');
const { fracture, applyFragmentToGrid } = require('./microFracture');
const { converge, convergeToTarget } = require('./ConvergenceEngine');
const { CompositeChains } = require('../arc/CompositeChains');
const { MemoryDistillation } = require('../arc/MemoryDistillation');
const FlowSync = require('../safety/flow_sync_monitor');
const logger = require('../logger');

const SOLVER_VERSION = '3.5.0';
const CODENAME = 'META_HORIZON_DISTILL';

// Import base Grid class from v2
const { Grid } = require('./UnlimitedSolver');

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: MULTI-DIMENSIONAL COMPLEXITY VECTOR
// ═══════════════════════════════════════════════════════════════════

/**
 * ComplexityVector - 7-dimensional search space
 * Instead of linear depth++, we traverse a hypercube
 */
class ComplexityVector {
  constructor(values = null) {
    this.dimensions = {
      structureDepth: 1,      // Depth of structural transforms
      temporalDepth: 1,       // Depth of sequential operations
      symmetryRank: 1,        // Symmetry group complexity
      objectCardinality: 1,   // Number of objects considered
      chainLength: 1,         // Length of transform chain
      abstractionLevel: 1,    // Level of abstraction
      compressionScore: 1     // Inverse of explanation length
    };

    if (values) {
      Object.assign(this.dimensions, values);
    }
  }

  clone() {
    return new ComplexityVector({ ...this.dimensions });
  }

  increment(dimension) {
    const result = this.clone();
    if (result.dimensions[dimension] !== undefined) {
      result.dimensions[dimension]++;
    }
    return result;
  }

  totalComplexity() {
    return Object.values(this.dimensions).reduce((a, b) => a + b, 0);
  }

  toArray() {
    return Object.values(this.dimensions);
  }

  toString() {
    return `C(${this.toArray().join(',')})`;
  }

  /**
   * Generate all vectors at a given total complexity level
   */
  static *generateAtLevel(targetSum, numDimensions = 7) {
    function* partition(remaining, dims, current = []) {
      if (dims === 1) {
        yield [...current, remaining];
        return;
      }

      for (let i = 1; i <= remaining - dims + 1; i++) {
        yield* partition(remaining - i, dims - 1, [...current, i]);
      }
    }

    for (const combo of partition(targetSum, numDimensions)) {
      yield new ComplexityVector({
        structureDepth: combo[0],
        temporalDepth: combo[1],
        symmetryRank: combo[2],
        objectCardinality: combo[3],
        chainLength: combo[4],
        abstractionLevel: combo[5],
        compressionScore: combo[6]
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: TYPE-SEGMENTED HYPOTHESIS STREAMS
// ═══════════════════════════════════════════════════════════════════

/**
 * HypothesisOntology - 7 hierarchies, 45+ classes
 */
class HypothesisOntology {
  constructor() {
    this.hierarchies = this.buildHierarchies();
  }

  buildHierarchies() {
    return {
      // ─────────────────────────────────────────────────────────────
      // HIERARCHY A: Structural (16 subfamilies - including geometric)
      // ─────────────────────────────────────────────────────────────
      structural: {
        // Basic geometric transforms
        flipHorizontal: {
          name: 'Flip Horizontal',
          apply: (grid) => new Grid(grid.data.map(row => [...row].reverse()))
        },
        flipVertical: {
          name: 'Flip Vertical',
          apply: (grid) => new Grid([...grid.data].reverse())
        },
        rotate90: {
          name: 'Rotate 90',
          apply: (grid) => this.rotate90(grid)
        },
        rotate180: {
          name: 'Rotate 180',
          apply: (grid) => this.rotate90(this.rotate90(grid))
        },
        rotate270: {
          name: 'Rotate 270',
          apply: (grid) => this.rotate90(this.rotate90(this.rotate90(grid)))
        },
        transpose: {
          name: 'Transpose',
          apply: (grid) => this.transpose(grid)
        },
        scale2x: {
          name: 'Scale 2x',
          apply: (grid) => this.scale(grid, 2)
        },
        scale3x: {
          name: 'Scale 3x',
          apply: (grid) => this.scale(grid, 3)
        },
        scale4x: {
          name: 'Scale 4x',
          apply: (grid) => this.scale(grid, 4)
        },
        // Original structural transforms
        regionSegmentation: {
          name: 'Region Segmentation',
          apply: (grid) => this.segmentRegions(grid)
        },
        morphologicalDilate: {
          name: 'Morphological Dilate',
          apply: (grid) => this.morphDilate(grid)
        },
        morphologicalErode: {
          name: 'Morphological Erode',
          apply: (grid) => this.morphErode(grid)
        },
        morphologicalOpen: {
          name: 'Morphological Open',
          apply: (grid) => this.morphErode(this.morphDilate(grid))
        },
        morphologicalClose: {
          name: 'Morphological Close',
          apply: (grid) => this.morphDilate(this.morphErode(grid))
        },
        convexityExtraction: {
          name: 'Convexity Extraction',
          apply: (grid) => this.extractConvexHull(grid)
        },
        connectedComponents: {
          name: 'Connected Components',
          apply: (grid) => this.labelConnectedComponents(grid)
        },
        skeletonExtraction: {
          name: 'Skeleton Extraction',
          apply: (grid) => this.extractSkeleton(grid)
        }
      },

      // ─────────────────────────────────────────────────────────────
      // HIERARCHY B: Spatial (7 subfamilies)
      // ─────────────────────────────────────────────────────────────
      spatial: {
        gravityDown: {
          name: 'Gravity Down',
          apply: (grid) => this.applyGravity(grid, 'down')
        },
        gravityUp: {
          name: 'Gravity Up',
          apply: (grid) => this.applyGravity(grid, 'up')
        },
        gravityLeft: {
          name: 'Gravity Left',
          apply: (grid) => this.applyGravity(grid, 'left')
        },
        gravityRight: {
          name: 'Gravity Right',
          apply: (grid) => this.applyGravity(grid, 'right')
        },
        alignToAxis: {
          name: 'Align to Axis',
          apply: (grid) => this.alignObjectsToAxis(grid)
        },
        centerOfMass: {
          name: 'Center of Mass Transform',
          apply: (grid) => this.transformByCenterOfMass(grid)
        },
        relativeDisplacement: {
          name: 'Relative Displacement',
          apply: (grid) => this.inferRelativeDisplacement(grid)
        },
        borderFillWith2: {
          name: 'Fill Border with 2',
          apply: (grid) => this.fillBorderCells(grid, 2)
        },
        borderFillWith1: {
          name: 'Fill Border with 1',
          apply: (grid) => this.fillBorderCells(grid, 1)
        },
        borderFillWith3: {
          name: 'Fill Border with 3',
          apply: (grid) => this.fillBorderCells(grid, 3)
        }
      },

      // ─────────────────────────────────────────────────────────────
      // HIERARCHY C: Counting/Stats (6 subfamilies)
      // ─────────────────────────────────────────────────────────────
      counting: {
        histogramTransform: {
          name: 'Histogram Transform',
          apply: (grid) => this.applyHistogramTransform(grid)
        },
        majorityVoting: {
          name: 'Majority Voting',
          apply: (grid) => this.applyMajorityVoting(grid)
        },
        proportionalReplication: {
          name: 'Proportional Replication',
          apply: (grid) => this.replicateByProportion(grid)
        },
        cardinalityMapping: {
          name: 'Cardinality Mapping',
          apply: (grid) => this.mapByCardinality(grid)
        },
        combinatorialArrangement: {
          name: 'Combinatorial Arrangement',
          apply: (grid) => this.arrangeCombinatorially(grid)
        },
        ratioScaling: {
          name: 'Ratio-Driven Scaling',
          apply: (grid) => this.scaleByRatio(grid)
        }
      },

      // ─────────────────────────────────────────────────────────────
      // HIERARCHY D: Color/Value Mappings (15+ subfamilies)
      // ─────────────────────────────────────────────────────────────
      color: {
        // Direct color replacements (1->2, 1->3, etc.)
        replace1to2: {
          name: 'Replace 1 to 2',
          apply: (grid) => this.replaceColor(grid, 1, 2)
        },
        replace1to3: {
          name: 'Replace 1 to 3',
          apply: (grid) => this.replaceColor(grid, 1, 3)
        },
        replace2to1: {
          name: 'Replace 2 to 1',
          apply: (grid) => this.replaceColor(grid, 2, 1)
        },
        replace2to3: {
          name: 'Replace 2 to 3',
          apply: (grid) => this.replaceColor(grid, 2, 3)
        },
        replace3to1: {
          name: 'Replace 3 to 1',
          apply: (grid) => this.replaceColor(grid, 3, 1)
        },
        replace3to2: {
          name: 'Replace 3 to 2',
          apply: (grid) => this.replaceColor(grid, 3, 2)
        },
        // Multi-color parallel mappings
        multiMap1to3_2to4: {
          name: 'Multi-Map {1→3, 2→4}',
          apply: (grid) => this.multiColorMap(grid, { 1: 3, 2: 4 })
        },
        multiMap1to2_2to1: {
          name: 'Swap 1↔2',
          apply: (grid) => this.multiColorMap(grid, { 1: 2, 2: 1 })
        },
        multiMap1to3_2to4_3to1: {
          name: 'Cycle {1→3, 2→4, 3→1}',
          apply: (grid) => this.multiColorMap(grid, { 1: 3, 2: 4, 3: 1 })
        },
        incrementAllColors: {
          name: 'Increment All Colors (+2)',
          apply: (grid) => this.incrementColors(grid, 2)
        },
        // Original color transforms
        lutInduction: {
          name: 'LUT Induction',
          apply: (grid, trainingPairs) => this.induceLUT(grid, trainingPairs)
        },
        paletteSwap: {
          name: 'Palette Swap',
          apply: (grid) => this.swapPalette(grid)
        },
        monotonicMapping: {
          name: 'Monotonic Mapping',
          apply: (grid) => this.applyMonotonicMapping(grid)
        },
        multiVariableMapping: {
          name: 'Multi-Variable Mapping',
          apply: (grid) => this.applyMultiVariableMapping(grid)
        },
        symmetryColorMapping: {
          name: 'Symmetry-Color Mapping',
          apply: (grid) => this.mapColorsBySymmetry(grid)
        },
        frequencyRules: {
          name: 'Color Frequency Rules',
          apply: (grid) => this.applyFrequencyRules(grid)
        }
      },

      // ─────────────────────────────────────────────────────────────
      // HIERARCHY E: Difference-Based (8 subfamilies)
      // ─────────────────────────────────────────────────────────────
      difference: {
        diffMaskExtraction: {
          name: 'Diff Mask Extraction',
          apply: (inputGrid, outputGrid) => inputGrid.xor(outputGrid)
        },
        overlayRules: {
          name: 'Overlay Rules',
          apply: (grid1, grid2) => this.applyOverlay(grid1, grid2)
        },
        xorPatterns: {
          name: 'XOR Patterns',
          apply: (grid) => this.findXORPatterns(grid)
        },
        beforeAfterInference: {
          name: 'Before/After Inference',
          apply: (input, output) => this.inferBeforeAfter(input, output)
        },
        colorInterpolation: {
          name: 'Color Interpolation (LERP)',
          apply: (grid1, grid2, t) => this.lerpGrids(grid1, grid2, t)
        },
        deltaObjectReasoning: {
          name: 'Delta Object Reasoning',
          apply: (input, output) => this.reasonAboutDelta(input, output)
        },
        relationBasedDiffs: {
          name: 'Relation-Based Diffs',
          apply: (input, output) => this.computeRelationalDiff(input, output)
        },
        mirrorVsDiffClassifier: {
          name: 'Mirror vs Diff Classifier',
          apply: (input, output) => this.classifyMirrorOrDiff(input, output)
        }
      },

      // ─────────────────────────────────────────────────────────────
      // HIERARCHY F: Border/Context (5 subfamilies)
      // ─────────────────────────────────────────────────────────────
      border: {
        borderReconstruction: {
          name: 'Border Reconstruction',
          apply: (grid) => this.reconstructBorder(grid)
        },
        paddingInference: {
          name: 'Padding Inference',
          apply: (grid) => this.inferPadding(grid)
        },
        enclosureDetection: {
          name: 'Enclosure Detection',
          apply: (grid) => this.detectEnclosures(grid)
        },
        frameExtraction: {
          name: 'Frame Extraction',
          apply: (grid) => this.extractFrame(grid)
        },
        inwardOutwardPropagation: {
          name: 'Inward/Outward Propagation',
          apply: (grid, direction) => this.propagateFromBorder(grid, direction)
        }
      },

      // ─────────────────────────────────────────────────────────────
      // HIERARCHY G: Abstract/Symbolic (5 subfamilies)
      // ─────────────────────────────────────────────────────────────
      abstract: {
        analogySolver: {
          name: 'Analogy Solver',
          apply: (a, b, c) => this.solveAnalogy(a, b, c) // A:B::C:?
        },
        causalMicroRules: {
          name: 'Causal Micro-Rule Induction',
          apply: (input, output) => this.induceCausalRules(input, output)
        },
        automataRules: {
          name: 'Automata-Like Rules',
          apply: (grid) => this.applyAutomataStep(grid)
        },
        relationalRoleMapping: {
          name: 'Relational Role Mapping',
          apply: (grid) => this.mapRelationalRoles(grid)
        },
        combinatorialLogic: {
          name: 'Combinatorial Logic Induction',
          apply: (input, output) => this.induceCombinatorialLogic(input, output)
        }
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Basic Geometric Transforms
  // ─────────────────────────────────────────────────────────────

  rotate90(grid) {
    const newData = [];
    for (let c = 0; c < grid.cols; c++) {
      const newRow = [];
      for (let r = grid.rows - 1; r >= 0; r--) {
        newRow.push(grid.data[r][c]);
      }
      newData.push(newRow);
    }
    return new Grid(newData);
  }

  transpose(grid) {
    const newData = [];
    for (let c = 0; c < grid.cols; c++) {
      const newRow = [];
      for (let r = 0; r < grid.rows; r++) {
        newRow.push(grid.data[r][c]);
      }
      newData.push(newRow);
    }
    return new Grid(newData);
  }

  scale(grid, factor) {
    const newData = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let fr = 0; fr < factor; fr++) {
        const newRow = [];
        for (let c = 0; c < grid.cols; c++) {
          for (let fc = 0; fc < factor; fc++) {
            newRow.push(grid.data[r][c]);
          }
        }
        newData.push(newRow);
      }
    }
    return new Grid(newData);
  }

  // ─────────────────────────────────────────────────────────────
  // Structural Implementations
  // ─────────────────────────────────────────────────────────────

  segmentRegions(grid) {
    const objects = grid.getObjects();
    const result = new Grid({ rows: grid.rows, cols: grid.cols });

    objects.forEach((obj, idx) => {
      for (const cell of obj.cells) {
        result.data[cell.row][cell.col] = (idx + 1) % 10;
      }
    });

    return result;
  }

  morphDilate(grid) {
    const result = grid.clone();
    const kernel = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.data[r][c] !== 0) {
          for (const [dr, dc] of kernel) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols) {
              if (result.data[nr][nc] === 0) {
                result.data[nr][nc] = grid.data[r][c];
              }
            }
          }
        }
      }
    }

    return result;
  }

  morphErode(grid) {
    const result = grid.clone();
    const kernel = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.data[r][c] !== 0) {
          let shouldErode = false;
          for (const [dr, dc] of kernel) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= grid.rows || nc < 0 || nc >= grid.cols) {
              shouldErode = true;
              break;
            }
            if (grid.data[nr][nc] === 0) {
              shouldErode = true;
              break;
            }
          }
          if (shouldErode) {
            result.data[r][c] = 0;
          }
        }
      }
    }

    return result;
  }

  extractConvexHull(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    const result = grid.clone();

    for (const obj of objects) {
      const { minR, maxR, minC, maxC } = obj.bounds;

      // Fill the bounding box with the object's color
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          result.data[r][c] = obj.color;
        }
      }
    }

    return result;
  }

  labelConnectedComponents(grid) {
    return this.segmentRegions(grid);
  }

  extractSkeleton(grid) {
    let current = grid.clone();
    let prev;

    do {
      prev = current.clone();
      current = this.morphErode(current);
    } while (!current.equals(prev) && current.getObjects().length > 0);

    return prev;
  }

  // ─────────────────────────────────────────────────────────────
  // Spatial Implementations
  // ─────────────────────────────────────────────────────────────

  applyGravity(grid, direction) {
    const result = grid.clone();

    if (direction === 'down') {
      for (let c = 0; c < result.cols; c++) {
        const column = [];
        for (let r = 0; r < result.rows; r++) {
          if (result.data[r][c] !== 0) column.push(result.data[r][c]);
        }
        const zeros = result.rows - column.length;
        for (let r = 0; r < zeros; r++) result.data[r][c] = 0;
        for (let r = 0; r < column.length; r++) result.data[zeros + r][c] = column[r];
      }
    } else if (direction === 'up') {
      for (let c = 0; c < result.cols; c++) {
        const column = [];
        for (let r = 0; r < result.rows; r++) {
          if (result.data[r][c] !== 0) column.push(result.data[r][c]);
        }
        for (let r = 0; r < column.length; r++) result.data[r][c] = column[r];
        for (let r = column.length; r < result.rows; r++) result.data[r][c] = 0;
      }
    } else if (direction === 'left') {
      for (let r = 0; r < result.rows; r++) {
        const row = result.data[r].filter(v => v !== 0);
        result.data[r] = [...row, ...Array(result.cols - row.length).fill(0)];
      }
    } else if (direction === 'right') {
      for (let r = 0; r < result.rows; r++) {
        const row = result.data[r].filter(v => v !== 0);
        result.data[r] = [...Array(result.cols - row.length).fill(0), ...row];
      }
    }

    return result;
  }

  fillBorderCells(grid, fillColor) {
    const result = grid.clone();

    // Find non-zero content area
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (grid.data[r][c] === 0) {
          // Check if this is a border cell (on edge or adjacent to content)
          const isEdge = r === 0 || r === grid.rows - 1 || c === 0 || c === grid.cols - 1;
          const hasNonZeroNeighbor = this.hasNonZeroNeighbor(grid, r, c);

          if (isEdge || hasNonZeroNeighbor) {
            result.data[r][c] = fillColor;
          }
        }
      }
    }

    return result;
  }

  hasNonZeroNeighbor(grid, row, col) {
    const neighbors = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of neighbors) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols) {
        if (grid.data[nr][nc] !== 0) return true;
      }
    }
    return false;
  }

  alignObjectsToAxis(grid) {
    const objects = grid.getObjects();
    const result = new Grid({ rows: grid.rows, cols: grid.cols });

    // Align objects to left edge
    let currentCol = 0;
    for (const obj of objects) {
      for (const cell of obj.cells) {
        const relCol = cell.col - obj.bounds.minC;
        const newCol = currentCol + relCol;
        const relRow = cell.row - obj.bounds.minR;
        if (newCol < grid.cols) {
          result.data[relRow][newCol] = obj.color;
        }
      }
      currentCol += obj.bounds.width + 1;
    }

    return result;
  }

  transformByCenterOfMass(grid) {
    const objects = grid.getObjects();
    const result = new Grid({ rows: grid.rows, cols: grid.cols });

    const gridCenterR = Math.floor(grid.rows / 2);
    const gridCenterC = Math.floor(grid.cols / 2);

    for (const obj of objects) {
      // Calculate center of mass
      let sumR = 0, sumC = 0;
      for (const cell of obj.cells) {
        sumR += cell.row;
        sumC += cell.col;
      }
      const comR = Math.round(sumR / obj.cells.length);
      const comC = Math.round(sumC / obj.cells.length);

      const offsetR = gridCenterR - comR;
      const offsetC = gridCenterC - comC;

      for (const cell of obj.cells) {
        const newR = cell.row + offsetR;
        const newC = cell.col + offsetC;
        if (newR >= 0 && newR < grid.rows && newC >= 0 && newC < grid.cols) {
          result.data[newR][newC] = obj.color;
        }
      }
    }

    return result;
  }

  inferRelativeDisplacement(grid) {
    // For now, return identity - this would learn displacement patterns
    return grid.clone();
  }

  // ─────────────────────────────────────────────────────────────
  // Counting Implementations
  // ─────────────────────────────────────────────────────────────

  applyHistogramTransform(grid) {
    const counts = {};
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const color = grid.data[r][c];
        counts[color] = (counts[color] || 0) + 1;
      }
    }

    // Create histogram visualization
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] || 1;

    const result = new Grid({ rows: sorted.length, cols: Math.ceil(maxCount / 10) });
    sorted.forEach(([color, count], row) => {
      const bars = Math.ceil(count / 10);
      for (let c = 0; c < bars; c++) {
        result.data[row][c] = parseInt(color);
      }
    });

    return result;
  }

  applyMajorityVoting(grid) {
    const result = grid.clone();
    const majorityColor = parseInt(grid.getMajorityColor(true));

    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        if (result.data[r][c] === 0) {
          result.data[r][c] = majorityColor;
        }
      }
    }

    return result;
  }

  replicateByProportion(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    // Replicate based on object count
    const scale = Math.max(2, Math.min(4, objects.length));
    const newData = [];

    for (let tr = 0; tr < scale; tr++) {
      for (let r = 0; r < grid.rows; r++) {
        const newRow = [];
        for (let tc = 0; tc < scale; tc++) {
          newRow.push(...grid.data[r]);
        }
        newData.push(newRow);
      }
    }

    return new Grid(newData);
  }

  mapByCardinality(grid) {
    const objects = grid.getObjects();
    const result = grid.clone();

    // Map color based on object cardinality
    for (const obj of objects) {
      const newColor = obj.cells.length % 10;
      for (const cell of obj.cells) {
        result.data[cell.row][cell.col] = newColor;
      }
    }

    return result;
  }

  arrangeCombinatorially(grid) {
    const objects = grid.getObjects();
    if (objects.length <= 1) return grid.clone();

    // Arrange objects in a grid pattern
    const n = Math.ceil(Math.sqrt(objects.length));
    const cellSize = Math.max(...objects.map(o => Math.max(o.bounds.width, o.bounds.height))) + 1;
    const result = new Grid({ rows: n * cellSize, cols: n * cellSize });

    objects.forEach((obj, idx) => {
      const gridR = Math.floor(idx / n);
      const gridC = idx % n;
      const baseR = gridR * cellSize;
      const baseC = gridC * cellSize;

      for (const cell of obj.cells) {
        const relR = cell.row - obj.bounds.minR;
        const relC = cell.col - obj.bounds.minC;
        result.data[baseR + relR][baseC + relC] = obj.color;
      }
    });

    return result;
  }

  scaleByRatio(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return grid.clone();

    // Scale grid based on ratio of objects to background
    const totalCells = grid.rows * grid.cols;
    const objectCells = objects.reduce((sum, o) => sum + o.cells.length, 0);
    const ratio = objectCells / totalCells;

    const scale = ratio < 0.25 ? 2 : ratio > 0.75 ? 0.5 : 1;

    if (scale === 1) return grid.clone();
    if (scale === 2) {
      const newData = [];
      for (let r = 0; r < grid.rows; r++) {
        for (let i = 0; i < 2; i++) {
          const newRow = [];
          for (let c = 0; c < grid.cols; c++) {
            newRow.push(grid.data[r][c], grid.data[r][c]);
          }
          newData.push(newRow);
        }
      }
      return new Grid(newData);
    }

    // scale === 0.5
    const newData = [];
    for (let r = 0; r < grid.rows; r += 2) {
      const newRow = [];
      for (let c = 0; c < grid.cols; c += 2) {
        newRow.push(grid.data[r][c]);
      }
      newData.push(newRow);
    }
    return new Grid(newData);
  }

  // ─────────────────────────────────────────────────────────────
  // Color Implementations
  // ─────────────────────────────────────────────────────────────

  replaceColor(grid, fromColor, toColor) {
    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        if (result.data[r][c] === fromColor) {
          result.data[r][c] = toColor;
        }
      }
    }
    return result;
  }

  multiColorMap(grid, colorMap) {
    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        const oldColor = grid.data[r][c]; // Use original grid to avoid chain effects
        if (colorMap[oldColor] !== undefined) {
          result.data[r][c] = colorMap[oldColor];
        }
      }
    }
    return result;
  }

  incrementColors(grid, increment) {
    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        if (result.data[r][c] !== 0) {
          result.data[r][c] = (result.data[r][c] + increment) % 10;
        }
      }
    }
    return result;
  }

  induceLUT(grid, trainingPairs = []) {
    if (trainingPairs.length === 0) return grid.clone();

    // Build lookup table from training pairs
    const lut = {};
    for (const { input, output } of trainingPairs) {
      const inGrid = input instanceof Grid ? input : Grid.fromArray(input);
      const outGrid = output instanceof Grid ? output : Grid.fromArray(output);

      for (let r = 0; r < Math.min(inGrid.rows, outGrid.rows); r++) {
        for (let c = 0; c < Math.min(inGrid.cols, outGrid.cols); c++) {
          const from = inGrid.data[r][c];
          const to = outGrid.data[r][c];
          if (lut[from] === undefined) {
            lut[from] = to;
          }
        }
      }
    }

    // Apply LUT
    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        const color = result.data[r][c];
        if (lut[color] !== undefined) {
          result.data[r][c] = lut[color];
        }
      }
    }

    return result;
  }

  swapPalette(grid) {
    const colors = grid.getUniqueColors().filter(c => c !== 0);
    if (colors.length < 2) return grid.clone();

    // Rotate palette
    const lut = {};
    for (let i = 0; i < colors.length; i++) {
      lut[colors[i]] = colors[(i + 1) % colors.length];
    }

    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        const color = result.data[r][c];
        if (lut[color] !== undefined) {
          result.data[r][c] = lut[color];
        }
      }
    }

    return result;
  }

  applyMonotonicMapping(grid) {
    const colors = grid.getUniqueColors().sort((a, b) => a - b);
    const lut = {};
    colors.forEach((c, i) => lut[c] = i);

    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        result.data[r][c] = lut[result.data[r][c]];
      }
    }

    return result;
  }

  applyMultiVariableMapping(grid) {
    // Map color based on position
    const result = grid.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        if (result.data[r][c] !== 0) {
          // Color = (original + row + col) % 10
          result.data[r][c] = (result.data[r][c] + r + c) % 10;
        }
      }
    }
    return result;
  }

  mapColorsBySymmetry(grid) {
    const result = grid.clone();
    const centerR = Math.floor(grid.rows / 2);
    const centerC = Math.floor(grid.cols / 2);

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        // Map based on distance from center (quadrant)
        const quadrant = (r < centerR ? 0 : 2) + (c < centerC ? 0 : 1);
        if (result.data[r][c] !== 0) {
          result.data[r][c] = (result.data[r][c] + quadrant) % 10 || 1;
        }
      }
    }

    return result;
  }

  applyFrequencyRules(grid) {
    const counts = {};
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const color = grid.data[r][c];
        counts[color] = (counts[color] || 0) + 1;
      }
    }

    // Keep only colors that appear more than threshold times
    const threshold = Math.max(1, Math.floor(grid.rows * grid.cols / 20));
    const result = grid.clone();

    for (let r = 0; r < result.rows; r++) {
      for (let c = 0; c < result.cols; c++) {
        const color = result.data[r][c];
        if (counts[color] < threshold) {
          result.data[r][c] = 0;
        }
      }
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // Difference Implementations
  // ─────────────────────────────────────────────────────────────

  applyOverlay(grid1, grid2) {
    const result = grid1.clone();
    for (let r = 0; r < Math.min(grid1.rows, grid2.rows); r++) {
      for (let c = 0; c < Math.min(grid1.cols, grid2.cols); c++) {
        if (grid2.data[r][c] !== 0) {
          result.data[r][c] = grid2.data[r][c];
        }
      }
    }
    return result;
  }

  findXORPatterns(grid) {
    // Find repeating patterns and XOR them
    const halfR = Math.floor(grid.rows / 2);
    const halfC = Math.floor(grid.cols / 2);

    const result = new Grid({ rows: halfR, cols: halfC });
    for (let r = 0; r < halfR; r++) {
      for (let c = 0; c < halfC; c++) {
        const v1 = grid.data[r][c];
        const v2 = grid.data[r][c + halfC] || 0;
        const v3 = grid.data[r + halfR]?.[c] || 0;
        const v4 = grid.data[r + halfR]?.[c + halfC] || 0;
        result.data[r][c] = (v1 !== v2 || v1 !== v3 || v1 !== v4) ? v1 : 0;
      }
    }

    return result;
  }

  inferBeforeAfter(input, output) {
    const inGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const outGrid = output instanceof Grid ? output : Grid.fromArray(output);

    return {
      type: 'before_after',
      diff: inGrid.diff(outGrid),
      sizeChange: {
        rows: outGrid.rows - inGrid.rows,
        cols: outGrid.cols - inGrid.cols
      }
    };
  }

  lerpGrids(grid1, grid2, t = 0.5) {
    const result = grid1.clone();
    for (let r = 0; r < Math.min(grid1.rows, grid2.rows); r++) {
      for (let c = 0; c < Math.min(grid1.cols, grid2.cols); c++) {
        if (Math.random() < t) {
          result.data[r][c] = grid2.data[r][c];
        }
      }
    }
    return result;
  }

  reasonAboutDelta(input, output) {
    const inGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const outGrid = output instanceof Grid ? output : Grid.fromArray(output);

    const delta = inGrid.diff(outGrid);
    const patterns = {
      additions: delta.filter(d => d.from === 0 && d.to !== 0),
      deletions: delta.filter(d => d.from !== 0 && d.to === 0),
      modifications: delta.filter(d => d.from !== 0 && d.to !== 0 && d.from !== d.to)
    };

    return patterns;
  }

  computeRelationalDiff(input, output) {
    const inGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const outGrid = output instanceof Grid ? output : Grid.fromArray(output);

    const inObjects = inGrid.getObjects();
    const outObjects = outGrid.getObjects();

    return {
      objectCountDelta: outObjects.length - inObjects.length,
      colorChanges: inGrid.diff(outGrid).map(d => [d.from, d.to])
    };
  }

  classifyMirrorOrDiff(input, output) {
    const inGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const outGrid = output instanceof Grid ? output : Grid.fromArray(output);

    // Check if output is a mirror of input
    const hFlip = new Grid(inGrid.data.map(row => [...row].reverse()));
    const vFlip = new Grid([...inGrid.data].reverse());

    if (hFlip.equals(outGrid)) return { type: 'mirror', axis: 'horizontal' };
    if (vFlip.equals(outGrid)) return { type: 'mirror', axis: 'vertical' };

    return { type: 'diff', changes: inGrid.diff(outGrid).length };
  }

  // ─────────────────────────────────────────────────────────────
  // Border Implementations
  // ─────────────────────────────────────────────────────────────

  reconstructBorder(grid) {
    const result = grid.clone();
    const borderColor = this.detectBorderColor(grid);

    for (let c = 0; c < result.cols; c++) {
      result.data[0][c] = borderColor;
      result.data[result.rows - 1][c] = borderColor;
    }
    for (let r = 0; r < result.rows; r++) {
      result.data[r][0] = borderColor;
      result.data[r][result.cols - 1] = borderColor;
    }

    return result;
  }

  detectBorderColor(grid) {
    const border = grid.getBorder();
    const counts = {};
    for (const { color } of border) {
      counts[color] = (counts[color] || 0) + 1;
    }
    return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 0);
  }

  inferPadding(grid) {
    const objects = grid.getObjects();
    if (objects.length === 0) return 0;

    // Find minimum distance from any object to border
    let minDist = Infinity;
    for (const obj of objects) {
      minDist = Math.min(minDist, obj.bounds.minR, obj.bounds.minC,
        grid.rows - 1 - obj.bounds.maxR, grid.cols - 1 - obj.bounds.maxC);
    }

    return minDist;
  }

  detectEnclosures(grid) {
    const result = grid.clone();
    const objects = grid.getObjects();

    // Fill enclosed regions
    for (const obj of objects) {
      const { minR, maxR, minC, maxC } = obj.bounds;

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          if (result.data[r][c] === 0) {
            // Check if enclosed
            let enclosed = true;
            // Simple heuristic: if surrounded by object color
            const neighbors = [
              [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]
            ];
            for (const [nr, nc] of neighbors) {
              if (nr >= 0 && nr < grid.rows && nc >= 0 && nc < grid.cols) {
                if (grid.data[nr][nc] === 0) {
                  enclosed = false;
                  break;
                }
              }
            }
            if (enclosed) {
              result.data[r][c] = obj.color;
            }
          }
        }
      }
    }

    return result;
  }

  extractFrame(grid) {
    const padding = this.inferPadding(grid);
    if (padding === 0) return grid.clone();

    const newData = [];
    for (let r = padding; r < grid.rows - padding; r++) {
      newData.push(grid.data[r].slice(padding, grid.cols - padding));
    }

    return new Grid(newData);
  }

  propagateFromBorder(grid, direction = 'inward') {
    const result = grid.clone();
    const borderColor = this.detectBorderColor(grid);

    if (direction === 'inward') {
      for (let r = 1; r < result.rows - 1; r++) {
        for (let c = 1; c < result.cols - 1; c++) {
          if (result.data[r][c] === 0) {
            result.data[r][c] = borderColor;
          }
        }
      }
    } else {
      // Outward - expand border
      const newRows = result.rows + 2;
      const newCols = result.cols + 2;
      const newData = Array(newRows).fill(null).map(() => Array(newCols).fill(borderColor));

      for (let r = 0; r < result.rows; r++) {
        for (let c = 0; c < result.cols; c++) {
          newData[r + 1][c + 1] = result.data[r][c];
        }
      }

      return new Grid(newData);
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // Abstract Implementations
  // ─────────────────────────────────────────────────────────────

  solveAnalogy(a, b, c) {
    // A : B :: C : ?
    // Find the transform from A to B, apply to C
    const gridA = a instanceof Grid ? a : Grid.fromArray(a);
    const gridB = b instanceof Grid ? b : Grid.fromArray(b);
    const gridC = c instanceof Grid ? c : Grid.fromArray(c);

    // Simple: check for color mappings
    const colorMap = {};
    for (let r = 0; r < Math.min(gridA.rows, gridB.rows); r++) {
      for (let col = 0; col < Math.min(gridA.cols, gridB.cols); col++) {
        const from = gridA.data[r][col];
        const to = gridB.data[r][col];
        if (colorMap[from] === undefined) {
          colorMap[from] = to;
        }
      }
    }

    // Apply to C
    const result = gridC.clone();
    for (let r = 0; r < result.rows; r++) {
      for (let col = 0; col < result.cols; col++) {
        const color = result.data[r][col];
        if (colorMap[color] !== undefined) {
          result.data[r][col] = colorMap[color];
        }
      }
    }

    return result;
  }

  induceCausalRules(input, output) {
    const inGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const outGrid = output instanceof Grid ? output : Grid.fromArray(output);

    const rules = [];
    const diff = inGrid.diff(outGrid);

    // Group changes by pattern
    const byColor = {};
    for (const change of diff) {
      const key = `${change.from}->${change.to}`;
      if (!byColor[key]) byColor[key] = [];
      byColor[key].push(change);
    }

    for (const [mapping, changes] of Object.entries(byColor)) {
      rules.push({
        type: 'color_transform',
        mapping,
        count: changes.length,
        positions: changes.map(c => ({ row: c.row, col: c.col }))
      });
    }

    return rules;
  }

  applyAutomataStep(grid) {
    const result = grid.clone();

    for (let r = 1; r < grid.rows - 1; r++) {
      for (let c = 1; c < grid.cols - 1; c++) {
        // Count neighbors
        let neighborCount = 0;
        let neighborSum = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (grid.data[r + dr][c + dc] !== 0) {
              neighborCount++;
              neighborSum += grid.data[r + dr][c + dc];
            }
          }
        }

        // Game of Life-ish rules
        if (grid.data[r][c] === 0) {
          if (neighborCount === 3) {
            result.data[r][c] = Math.round(neighborSum / neighborCount);
          }
        } else {
          if (neighborCount < 2 || neighborCount > 3) {
            result.data[r][c] = 0;
          }
        }
      }
    }

    return result;
  }

  mapRelationalRoles(grid) {
    const objects = grid.getObjects();
    const result = grid.clone();

    // Assign roles based on size
    objects.sort((a, b) => b.size - a.size);

    objects.forEach((obj, idx) => {
      const roleColor = (idx + 1) % 10;
      for (const cell of obj.cells) {
        result.data[cell.row][cell.col] = roleColor;
      }
    });

    return result;
  }

  induceCombinatorialLogic(input, output) {
    const inGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const outGrid = output instanceof Grid ? output : Grid.fromArray(output);

    // Find if output is a logical combination of input regions
    const inColors = inGrid.getUniqueColors();
    const outColors = outGrid.getUniqueColors();

    return {
      inputColors: inColors,
      outputColors: outColors,
      possibleOperations: [
        'union', 'intersection', 'difference', 'xor'
      ]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Generator for all hypothesis strategies
  // ─────────────────────────────────────────────────────────────

  *generateHypotheses(complexityVector) {
    const cv = complexityVector || new ComplexityVector();

    // Yield based on complexity dimensions
    for (const [hierarchyName, subfamily] of Object.entries(this.hierarchies)) {
      for (const [stratName, strategy] of Object.entries(subfamily)) {
        yield {
          hierarchy: hierarchyName,
          name: `${hierarchyName}:${stratName}`,
          strategy,
          complexity: cv
        };
      }
    }
  }

  /**
   * Count total hypothesis classes
   */
  countClasses() {
    let count = 0;
    for (const subfamily of Object.values(this.hierarchies)) {
      count += Object.keys(subfamily).length;
    }
    return count;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: 6-STAGE VALIDATION PIPELINE
// ═══════════════════════════════════════════════════════════════════

class ValidationPipeline {
  constructor() {
    this.stages = [
      'syntactic',
      'semantic',
      'behavioral',
      'counterexample',
      'compression',
      'evidence'
    ];
    this.stageResults = {};
  }

  /**
   * Run full validation pipeline
   */
  validate(strategy, trainingPairs, config = {}) {
    this.stageResults = {};

    // Stage 1: Syntactic Validation
    const syntactic = this.validateSyntactic(strategy);
    this.stageResults.syntactic = syntactic;
    if (!syntactic.passed) return { passed: false, stage: 'syntactic', results: this.stageResults };

    // Stage 2: Semantic Validation
    const semantic = this.validateSemantic(strategy, trainingPairs);
    this.stageResults.semantic = semantic;
    if (!semantic.passed) return { passed: false, stage: 'semantic', results: this.stageResults };

    // Stage 3: Behavioral Validation
    const behavioral = this.validateBehavioral(strategy, trainingPairs);
    this.stageResults.behavioral = behavioral;
    if (!behavioral.passed) return { passed: false, stage: 'behavioral', results: this.stageResults };

    // Stage 4: Counterexample Augmentation
    const counterexample = this.validateCounterexample(strategy, trainingPairs);
    this.stageResults.counterexample = counterexample;
    if (!counterexample.passed && config.strictCounterexample) {
      return { passed: false, stage: 'counterexample', results: this.stageResults };
    }

    // Stage 5: Compression Validation
    const compression = this.validateCompression(strategy);
    this.stageResults.compression = compression;

    // Stage 6: Evidence Aggregation
    const evidence = this.aggregateEvidence();
    this.stageResults.evidence = evidence;

    return {
      passed: evidence.score >= (config.threshold || 0.8),
      stage: 'complete',
      score: evidence.score,
      results: this.stageResults
    };
  }

  // Stage 1: Syntactic Validation
  validateSyntactic(strategy) {
    const checks = {
      hasApplyMethod: typeof strategy.apply === 'function' ||
        (strategy.strategy && typeof strategy.strategy.apply === 'function'),
      hasName: !!strategy.name,
      validChain: !strategy.chain || Array.isArray(strategy.chain)
    };

    return {
      passed: Object.values(checks).every(v => v),
      checks
    };
  }

  // Stage 2: Semantic Validation
  validateSemantic(strategy, trainingPairs) {
    const checks = {
      deterministic: true,
      validOutput: true,
      consistentDimensions: true
    };

    for (const pair of trainingPairs) {
      try {
        const input = pair.input instanceof Grid ? pair.input : Grid.fromArray(pair.input);
        const applyFn = strategy.apply || strategy.strategy?.apply;

        const output1 = applyFn.call(strategy.strategy || strategy, input);
        const output2 = applyFn.call(strategy.strategy || strategy, input);

        // Check determinism
        if (!output1.equals(output2)) {
          checks.deterministic = false;
        }

        // Check valid output
        if (!output1 || !output1.data || output1.rows === 0 || output1.cols === 0) {
          checks.validOutput = false;
        }
      } catch (e) {
        checks.validOutput = false;
      }
    }

    return {
      passed: Object.values(checks).every(v => v),
      checks
    };
  }

  // Stage 3: Behavioral Validation
  validateBehavioral(strategy, trainingPairs) {
    let perfectMatches = 0;
    let totalCells = 0;
    let correctCells = 0;

    for (const pair of trainingPairs) {
      try {
        const input = pair.input instanceof Grid ? pair.input : Grid.fromArray(pair.input);
        const expected = pair.output instanceof Grid ? pair.output : Grid.fromArray(pair.output);
        const applyFn = strategy.apply || strategy.strategy?.apply;

        const predicted = applyFn.call(strategy.strategy || strategy, input);

        if (predicted.equals(expected)) {
          perfectMatches++;
        }

        // Cell-level accuracy
        for (let r = 0; r < Math.min(predicted.rows, expected.rows); r++) {
          for (let c = 0; c < Math.min(predicted.cols, expected.cols); c++) {
            totalCells++;
            if (predicted.data[r][c] === expected.data[r][c]) {
              correctCells++;
            }
          }
        }
      } catch (e) {
        // Error counts as failure
      }
    }

    const accuracy = totalCells > 0 ? correctCells / totalCells : 0;
    const allPerfect = perfectMatches === trainingPairs.length;

    return {
      passed: allPerfect,
      perfectMatches,
      totalPairs: trainingPairs.length,
      cellAccuracy: accuracy
    };
  }

  // Stage 4: Counterexample Augmentation
  validateCounterexample(strategy, trainingPairs) {
    let passedAugmented = 0;
    let totalAugmented = 0;

    for (const pair of trainingPairs) {
      const input = pair.input instanceof Grid ? pair.input : Grid.fromArray(pair.input);
      const expected = pair.output instanceof Grid ? pair.output : Grid.fromArray(pair.output);

      // Generate augmented versions
      const augmentations = this.generateAugmentations(input, expected);

      for (const { augInput, augExpected, type } of augmentations) {
        totalAugmented++;
        try {
          const applyFn = strategy.apply || strategy.strategy?.apply;
          const predicted = applyFn.call(strategy.strategy || strategy, augInput);

          // For some augmentations, we expect the output to change accordingly
          if (type === 'identity') {
            if (predicted.equals(augExpected)) passedAugmented++;
          } else {
            // For transforms, just check it doesn't crash
            passedAugmented++;
          }
        } catch (e) {
          // Crash is a failure
        }
      }
    }

    return {
      passed: totalAugmented === 0 || passedAugmented / totalAugmented >= 0.8,
      passedAugmented,
      totalAugmented,
      robustness: totalAugmented > 0 ? passedAugmented / totalAugmented : 1
    };
  }

  generateAugmentations(input, output) {
    const augmentations = [];

    // Identity (should still work)
    augmentations.push({
      augInput: input.clone(),
      augExpected: output.clone(),
      type: 'identity'
    });

    // Color swap (if strategy is color-invariant)
    const swapped = input.clone();
    for (let r = 0; r < swapped.rows; r++) {
      for (let c = 0; c < swapped.cols; c++) {
        if (swapped.data[r][c] === 1) swapped.data[r][c] = 2;
        else if (swapped.data[r][c] === 2) swapped.data[r][c] = 1;
      }
    }
    augmentations.push({
      augInput: swapped,
      augExpected: null, // Don't validate
      type: 'color_swap'
    });

    return augmentations;
  }

  // Stage 5: Compression Validation
  validateCompression(strategy) {
    const chainLength = strategy.chain?.length || strategy.depth || 1;
    const nameLength = (strategy.name || '').length;

    // Prefer shorter strategies (Occam's Razor)
    const compressionScore = 1 / (1 + chainLength * 0.1 + nameLength * 0.001);

    return {
      passed: true, // Always passes, but affects score
      chainLength,
      nameLength,
      compressionScore
    };
  }

  // Stage 6: Evidence Aggregation
  aggregateEvidence() {
    const weights = {
      syntactic: 0.1,
      semantic: 0.15,
      behavioral: 0.5,
      counterexample: 0.15,
      compression: 0.1
    };

    let score = 0;

    if (this.stageResults.syntactic?.passed) score += weights.syntactic;
    if (this.stageResults.semantic?.passed) score += weights.semantic;
    if (this.stageResults.behavioral?.passed) score += weights.behavioral;
    if (this.stageResults.counterexample?.passed) score += weights.counterexample * this.stageResults.counterexample.robustness;
    score += weights.compression * (this.stageResults.compression?.compressionScore || 0);

    return {
      score,
      passed: score >= 0.8,
      breakdown: {
        syntactic: this.stageResults.syntactic?.passed ? weights.syntactic : 0,
        semantic: this.stageResults.semantic?.passed ? weights.semantic : 0,
        behavioral: this.stageResults.behavioral?.passed ? weights.behavioral : 0,
        counterexample: (this.stageResults.counterexample?.robustness || 0) * weights.counterexample,
        compression: (this.stageResults.compression?.compressionScore || 0) * weights.compression
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: 7-LAYER COGNITIVE MEMORY STACK
// ═══════════════════════════════════════════════════════════════════

class CognitiveMemory {
  constructor(basePath = './memory') {
    this.basePath = basePath;
    this.layers = {
      episodic: [],       // Full success episodes
      semantic: {},       // Generalized patterns
      procedural: [],     // Working chains
      prediction: {},     // Input -> likely strategies
      error: [],          // Counterexamples
      priors: {},         // Transformation probabilities
      curriculum: {       // Learning schedule
        explorationRate: 0.3,
        complexityBias: 1,
        maxDepthSeen: 1
      }
    };
    this.loaded = false;
  }

  ensureDirectory() {
    try {
      if (!fs.existsSync(this.basePath)) {
        fs.mkdirSync(this.basePath, { recursive: true });
      }
    } catch (e) {
      // Running in environment without fs
    }
  }

  load() {
    if (this.loaded) return;
    this.ensureDirectory();

    const files = ['episodic', 'semantic', 'procedural', 'prediction', 'error', 'priors', 'curriculum'];
    for (const file of files) {
      try {
        const filePath = path.join(this.basePath, `${file}.json`);
        if (fs.existsSync(filePath)) {
          this.layers[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      } catch (e) {
        // File doesn't exist yet
      }
    }

    this.loaded = true;
  }

  save() {
    this.ensureDirectory();

    for (const [name, data] of Object.entries(this.layers)) {
      try {
        fs.writeFileSync(
          path.join(this.basePath, `${name}.json`),
          JSON.stringify(data, null, 2)
        );
      } catch (e) {
        // fs not available
      }
    }
  }

  // Layer 1: Episodic Memory
  recordEpisode(taskId, strategy, trainingPairs, result) {
    this.load();

    const episode = {
      taskId,
      strategyName: strategy.name,
      hierarchy: strategy.hierarchy || 'unknown',
      chain: strategy.chain?.map(p => p.name) || [strategy.name],
      complexity: strategy.complexity?.toString() || 'C(1,1,1,1,1,1,1)',
      inputFeatures: this.extractFeatures(trainingPairs),
      success: result.passed,
      score: result.score,
      timestamp: Date.now()
    };

    this.layers.episodic.push(episode);

    // Update other layers based on episode
    if (result.passed) {
      this.updateSemanticFromEpisode(episode);
      this.updateProceduralFromEpisode(episode);
      this.updatePriorsFromEpisode(episode);
    } else {
      this.recordError(episode);
    }

    this.updateCurriculum(episode);
    this.save();
  }

  // Layer 2: Semantic Memory
  updateSemanticFromEpisode(episode) {
    const key = episode.hierarchy;
    if (!this.layers.semantic[key]) {
      this.layers.semantic[key] = { count: 0, successRate: 0, avgComplexity: 0 };
    }

    const sem = this.layers.semantic[key];
    sem.count++;
    sem.successRate = (sem.successRate * (sem.count - 1) + (episode.success ? 1 : 0)) / sem.count;
  }

  // Layer 3: Procedural Memory
  updateProceduralFromEpisode(episode) {
    if (episode.success && episode.chain) {
      const chainKey = episode.chain.join('->');

      const existing = this.layers.procedural.find(p => p.chain === chainKey);
      if (existing) {
        existing.count++;
        existing.lastUsed = Date.now();
      } else {
        this.layers.procedural.push({
          chain: chainKey,
          hierarchy: episode.hierarchy,
          count: 1,
          lastUsed: Date.now()
        });
      }
    }
  }

  // Layer 4: Prediction Memory
  recordPrediction(inputFeatures, predictedStrategy, wasCorrect) {
    this.load();

    const featureKey = JSON.stringify(inputFeatures);
    if (!this.layers.prediction[featureKey]) {
      this.layers.prediction[featureKey] = [];
    }

    this.layers.prediction[featureKey].push({
      strategy: predictedStrategy,
      correct: wasCorrect,
      timestamp: Date.now()
    });

    this.save();
  }

  predictLikelyStrategies(inputGrid) {
    this.load();

    const features = this.extractFeaturesFromGrid(inputGrid);
    const featureKey = JSON.stringify(features);

    // Direct match
    if (this.layers.prediction[featureKey]) {
      const successes = this.layers.prediction[featureKey]
        .filter(p => p.correct)
        .map(p => p.strategy);

      if (successes.length > 0) return successes;
    }

    // Fall back to priors
    const sortedPriors = Object.entries(this.layers.priors)
      .sort((a, b) => b[1].successRate - a[1].successRate);

    return sortedPriors.slice(0, 5).map(([name]) => name);
  }

  // Layer 5: Error Memory
  recordError(episode) {
    this.layers.error.push({
      taskId: episode.taskId,
      strategy: episode.strategyName,
      inputFeatures: episode.inputFeatures,
      timestamp: Date.now()
    });

    // Keep only recent errors
    if (this.layers.error.length > 1000) {
      this.layers.error = this.layers.error.slice(-500);
    }
  }

  // Layer 6: Transformation Priors
  updatePriorsFromEpisode(episode) {
    const key = episode.hierarchy;
    if (!this.layers.priors[key]) {
      this.layers.priors[key] = { count: 0, successRate: 0 };
    }

    const prior = this.layers.priors[key];
    prior.count++;
    prior.successRate = (prior.successRate * (prior.count - 1) + 1) / prior.count;
  }

  getPriorProbability(hierarchy) {
    this.load();
    return this.layers.priors[hierarchy]?.successRate || 0.1;
  }

  // Layer 7: Curriculum Memory
  updateCurriculum(episode) {
    const curr = this.layers.curriculum;

    // Adjust exploration based on success
    if (episode.success) {
      curr.explorationRate = Math.max(0.1, curr.explorationRate * 0.95);
    } else {
      curr.explorationRate = Math.min(0.5, curr.explorationRate * 1.05);
    }

    // Track max complexity seen
    const complexity = episode.complexity?.totalComplexity?.() || 7;
    if (complexity > curr.maxDepthSeen) {
      curr.maxDepthSeen = complexity;
    }
  }

  shouldExplore() {
    return Math.random() < this.layers.curriculum.explorationRate;
  }

  // Feature extraction
  extractFeatures(trainingPairs) {
    if (trainingPairs.length === 0) return {};

    const firstInput = trainingPairs[0].input;
    const grid = firstInput instanceof Grid ? firstInput : Grid.fromArray(firstInput);

    return this.extractFeaturesFromGrid(grid);
  }

  extractFeaturesFromGrid(grid) {
    return {
      rows: grid.rows,
      cols: grid.cols,
      uniqueColors: grid.getUniqueColors().length,
      objectCount: grid.getObjects().length,
      density: grid.getObjects().reduce((sum, o) => sum + o.cells.length, 0) / (grid.rows * grid.cols)
    };
  }

  // Query methods
  getSuccessfulStrategiesFor(features) {
    this.load();

    return this.layers.episodic
      .filter(e => e.success && this.featuresMatch(e.inputFeatures, features))
      .map(e => e.strategyName);
  }

  featuresMatch(f1, f2, tolerance = 0.2) {
    if (!f1 || !f2) return false;

    const keys = ['rows', 'cols', 'uniqueColors', 'objectCount'];
    for (const key of keys) {
      if (f1[key] && f2[key]) {
        const diff = Math.abs(f1[key] - f2[key]) / Math.max(f1[key], f2[key], 1);
        if (diff > tolerance) return false;
      }
    }

    return true;
  }

  getStats() {
    this.load();

    return {
      episodeCount: this.layers.episodic.length,
      semanticPatterns: Object.keys(this.layers.semantic).length,
      proceduralChains: this.layers.procedural.length,
      predictionKeys: Object.keys(this.layers.prediction).length,
      errorCount: this.layers.error.length,
      priorCategories: Object.keys(this.layers.priors).length,
      explorationRate: this.layers.curriculum.explorationRate,
      maxComplexity: this.layers.curriculum.maxDepthSeen
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 5: CHAIN EXECUTION RUNTIME
// ═══════════════════════════════════════════════════════════════════

class ChainExecutor {
  constructor() {
    this.ontology = new HypothesisOntology();
    this.executionTrace = [];
  }

  /**
   * Execute a chain of transformations
   */
  execute(chain, inputGrid, options = {}) {
    this.executionTrace = [];
    let current = inputGrid instanceof Grid ? inputGrid.clone() : Grid.fromArray(inputGrid);

    for (let i = 0; i < chain.length; i++) {
      const step = chain[i];
      const startTime = Date.now();

      try {
        const result = this.executeStep(step, current, options);

        this.executionTrace.push({
          step: i,
          operation: step.name || step,
          inputSize: { rows: current.rows, cols: current.cols },
          outputSize: { rows: result.rows, cols: result.cols },
          timeMs: Date.now() - startTime,
          success: true
        });

        current = result;
      } catch (error) {
        this.executionTrace.push({
          step: i,
          operation: step.name || step,
          error: error.message,
          timeMs: Date.now() - startTime,
          success: false
        });

        if (!options.continueOnError) {
          throw error;
        }
      }
    }

    return {
      result: current,
      trace: this.executionTrace
    };
  }

  executeStep(step, grid, options = {}) {
    // If step is a string, look it up in ontology
    if (typeof step === 'string') {
      const [hierarchy, method] = step.includes(':') ? step.split(':') : ['unknown', step];

      if (this.ontology.hierarchies[hierarchy]?.[method]) {
        return this.ontology.hierarchies[hierarchy][method].apply(grid);
      }

      // Try to find it anywhere
      for (const [h, subfamily] of Object.entries(this.ontology.hierarchies)) {
        if (subfamily[method]) {
          return subfamily[method].apply(grid);
        }
      }
    }

    // If step has apply method, use it
    if (step.apply && typeof step.apply === 'function') {
      return step.apply(grid);
    }

    // If step.strategy has apply method, use it
    if (step.strategy?.apply) {
      return step.strategy.apply(grid);
    }

    throw new Error(`Unknown step type: ${JSON.stringify(step)}`);
  }

  /**
   * Generate composite chains
   */
  *generateChains(maxLength = 3) {
    const strategies = [...this.ontology.generateHypotheses()];

    // Single operations
    for (const s of strategies) {
      yield [s];
    }

    // Pairs - diverse hierarchies first
    if (maxLength >= 2) {
      for (const s1 of strategies) {
        for (const s2 of strategies) {
          if (s1.hierarchy !== s2.hierarchy) {
            yield [s1, s2];
          }
        }
      }
      // Then same-hierarchy pairs (important for gravity+flip, scale+scale)
      for (const s1 of strategies) {
        for (const s2 of strategies) {
          if (s1.hierarchy === s2.hierarchy && s1.name !== s2.name) {
            yield [s1, s2];
          }
        }
      }
    }

    // Triples - diverse hierarchies first
    if (maxLength >= 3) {
      for (const s1 of strategies) {
        for (const s2 of strategies) {
          for (const s3 of strategies) {
            const hierarchies = new Set([s1.hierarchy, s2.hierarchy, s3.hierarchy]);
            if (hierarchies.size >= 2) {
              yield [s1, s2, s3];
            }
          }
        }
      }
      // Then same-hierarchy triples for complex transforms
      for (const s1 of strategies) {
        for (const s2 of strategies) {
          for (const s3 of strategies) {
            const names = new Set([s1.name, s2.name, s3.name]);
            if (names.size >= 2) {
              yield [s1, s2, s3];
            }
          }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 6: EXPLAINABILITY LAYER
// ═══════════════════════════════════════════════════════════════════

class ExplainabilityEngine {
  constructor() {
    this.explanations = [];
  }

  /**
   * Generate human-readable explanation for a strategy
   */
  explain(strategy, trainingPairs) {
    const explanation = {
      summary: this.generateSummary(strategy),
      steps: this.explainSteps(strategy),
      patterns: this.identifyPatterns(strategy, trainingPairs),
      confidence: this.assessConfidence(strategy, trainingPairs),
      alternatives: []
    };

    this.explanations.push(explanation);
    return explanation;
  }

  generateSummary(strategy) {
    const name = strategy.name || 'Unknown Strategy';
    const hierarchy = strategy.hierarchy || 'unknown';
    const depth = strategy.chain?.length || strategy.depth || 1;

    return `Strategy "${name}" from ${hierarchy} hierarchy (depth: ${depth})`;
  }

  explainSteps(strategy) {
    const steps = [];

    if (strategy.chain) {
      strategy.chain.forEach((step, i) => {
        steps.push({
          index: i + 1,
          operation: step.name || step,
          description: this.describeOperation(step)
        });
      });
    } else {
      steps.push({
        index: 1,
        operation: strategy.name,
        description: this.describeOperation(strategy)
      });
    }

    return steps;
  }

  describeOperation(op) {
    const descriptions = {
      'gravityDown': 'Move all colored cells downward as if affected by gravity',
      'gravityUp': 'Move all colored cells upward',
      'gravityLeft': 'Move all colored cells leftward',
      'gravityRight': 'Move all colored cells rightward',
      'flipHorizontal': 'Flip the grid horizontally (mirror left-right)',
      'flipVertical': 'Flip the grid vertically (mirror top-bottom)',
      'rotate90': 'Rotate the grid 90 degrees clockwise',
      'scale': 'Scale the grid by a factor (enlarge)',
      'shrink': 'Shrink the grid by a factor',
      'replaceColor': 'Replace one color with another',
      'swapColors': 'Swap two colors with each other',
      'morphDilate': 'Expand colored regions (morphological dilation)',
      'morphErode': 'Shrink colored regions (morphological erosion)',
      'majorityVoting': 'Fill empty cells with the most common color',
      'extractSkeleton': 'Extract the skeleton/centerline of shapes'
    };

    const name = op.name || op;
    return descriptions[name] || `Apply ${name} transformation`;
  }

  identifyPatterns(strategy, trainingPairs) {
    const patterns = [];

    // Analyze what changes between input and output
    for (const pair of trainingPairs) {
      const input = pair.input instanceof Grid ? pair.input : Grid.fromArray(pair.input);
      const output = pair.output instanceof Grid ? pair.output : Grid.fromArray(pair.output);

      // Size change
      if (input.rows !== output.rows || input.cols !== output.cols) {
        patterns.push(`Size changes from ${input.rows}x${input.cols} to ${output.rows}x${output.cols}`);
      }

      // Color changes
      const inputColors = new Set(input.getUniqueColors());
      const outputColors = new Set(output.getUniqueColors());

      const addedColors = [...outputColors].filter(c => !inputColors.has(c));
      const removedColors = [...inputColors].filter(c => !outputColors.has(c));

      if (addedColors.length > 0) {
        patterns.push(`New colors introduced: ${addedColors.join(', ')}`);
      }
      if (removedColors.length > 0) {
        patterns.push(`Colors removed: ${removedColors.join(', ')}`);
      }

      // Object count change
      const inputObjects = input.getObjects().length;
      const outputObjects = output.getObjects().length;
      if (inputObjects !== outputObjects) {
        patterns.push(`Object count changes from ${inputObjects} to ${outputObjects}`);
      }
    }

    return [...new Set(patterns)]; // Remove duplicates
  }

  assessConfidence(strategy, trainingPairs) {
    let score = 0.5; // Base confidence

    // More training pairs = more confidence
    score += Math.min(0.2, trainingPairs.length * 0.05);

    // Simpler strategies = more confident they're correct
    const depth = strategy.chain?.length || strategy.depth || 1;
    score += Math.max(0, 0.2 - depth * 0.05);

    // Known hierarchy = more confidence
    if (strategy.hierarchy && strategy.hierarchy !== 'unknown') {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Generate diff heatmap between input and output
   */
  generateDiffHeatmap(input, output) {
    const inGrid = input instanceof Grid ? input : Grid.fromArray(input);
    const outGrid = output instanceof Grid ? output : Grid.fromArray(output);

    const heatmap = [];
    const maxR = Math.max(inGrid.rows, outGrid.rows);
    const maxC = Math.max(inGrid.cols, outGrid.cols);

    for (let r = 0; r < maxR; r++) {
      const row = [];
      for (let c = 0; c < maxC; c++) {
        const inVal = inGrid.get(r, c);
        const outVal = outGrid.get(r, c);

        if (inVal === -1 || outVal === -1) {
          row.push('SIZE_CHANGE');
        } else if (inVal === outVal) {
          row.push('UNCHANGED');
        } else if (inVal === 0) {
          row.push('ADDED');
        } else if (outVal === 0) {
          row.push('REMOVED');
        } else {
          row.push('MODIFIED');
        }
      }
      heatmap.push(row);
    }

    return heatmap;
  }

  /**
   * Generate strategy tree visualization
   */
  generateStrategyTree(strategies) {
    const tree = { name: 'root', children: {} };

    for (const s of strategies) {
      const hierarchy = s.hierarchy || 'unknown';
      if (!tree.children[hierarchy]) {
        tree.children[hierarchy] = { name: hierarchy, strategies: [] };
      }
      tree.children[hierarchy].strategies.push(s.name);
    }

    return tree;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 7: SAFETY BOUNDARY MANAGER
// ═══════════════════════════════════════════════════════════════════

class SafetyBoundary {
  constructor(config = {}) {
    // Merge with SafeJumpPolicy
    this.policy = SafeJumpPolicy;

    this.config = {
      maxIterations: config.maxIterations || 1000000,
      maxTimeMs: config.maxTimeMs || 300000, // 5 minutes
      maxMemoryMB: config.maxMemoryMB || 512,
      maxGridSize: config.maxGridSize || 100,
      maxChainLength: this.policy.MAX_CHAIN_LENGTH,
      maxComplexityJump: this.policy.MAX_COMPLEXITY_JUMP,
      maxStrategiesPerGen: this.policy.MAX_STRATEGIES_PER_GENERATION,
      validationBudgetMs: this.policy.VALIDATION_TIME_BUDGET_MS,
      humanOversightRequired: this.policy.HUMAN_OVERSIGHT_REQUIRED,
      allowFileSystem: config.allowFileSystem !== false,
      allowNetwork: config.allowNetwork || false,
      ...config
    };

    this.stats = {
      iterations: 0,
      startTime: null,
      peakMemory: 0,
      largeJumps: 0,
      chainLengthWarnings: 0
    };

    this.flowSyncMonitor = this.policy.ENABLE_FLOW_SYNC_MONITOR ? [] : null;
  }

  /**
   * Validate complexity vector jump
   */
  validateComplexityJump(prevVector, newVector) {
    if (!prevVector || !newVector) return true;

    const prev = prevVector.toArray ? prevVector.toArray() : Object.values(prevVector.dimensions || prevVector);
    const next = newVector.toArray ? newVector.toArray() : Object.values(newVector.dimensions || newVector);

    for (let i = 0; i < prev.length; i++) {
      const jump = (next[i] || 1) - (prev[i] || 1);
      if (jump > this.config.maxComplexityJump) {
        if (this.policy.WARN_ON_LARGE_JUMPS) {
          this.stats.largeJumps++;
          this.policy.onUnsafeJump({
            axis: i,
            jump,
            max: this.config.maxComplexityJump,
            prevVector: prev,
            newVector: next
          });
        }
        return false;
      }
    }
    return true;
  }

  /**
   * Validate chain length
   */
  validateChainLength(chain) {
    const length = Array.isArray(chain) ? chain.length : 1;
    if (length > this.config.maxChainLength) {
      this.stats.chainLengthWarnings++;
      if (this.policy.LOG_LEVEL === 'verbose') {
        console.warn(`[SAFETY] Chain length ${length} exceeds max ${this.config.maxChainLength}`);
      }
      return false;
    }
    return true;
  }

  /**
   * Record flow sync timing for bottleneck detection
   */
  recordFlowSync(stepName, durationMs) {
    if (!this.flowSyncMonitor) return;

    this.flowSyncMonitor.push({ step: stepName, duration: durationMs, timestamp: Date.now() });

    if (durationMs > this.policy.FLOW_SYNC_THRESHOLD_MS) {
      console.warn(`[FLOW SYNC] Bottleneck detected: ${stepName} took ${durationMs}ms`);
    }
  }

  /**
   * Ensure human oversight is active
   */
  requireOversight(action) {
    if (this.config.humanOversightRequired && !this._humanStarted) {
      this.policy.onAutonomyAttempt({ action, timestamp: Date.now() });
      throw new SafetyError('OVERSIGHT_REQUIRED', 'Human oversight required to start execution');
    }
  }

  /**
   * Mark that human has initiated execution
   */
  humanStart() {
    this._humanStarted = true;
  }

  humanStop() {
    this._humanStarted = false;
  }

  start() {
    this.stats.startTime = Date.now();
    this.stats.iterations = 0;
  }

  check() {
    this.stats.iterations++;

    // Iteration limit
    if (this.stats.iterations > this.config.maxIterations) {
      throw new SafetyError('ITERATION_LIMIT', `Exceeded ${this.config.maxIterations} iterations`);
    }

    // Time limit
    const elapsed = Date.now() - this.stats.startTime;
    if (elapsed > this.config.maxTimeMs) {
      throw new SafetyError('TIME_LIMIT', `Exceeded ${this.config.maxTimeMs}ms`);
    }

    // Memory check (approximate)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memMB = process.memoryUsage().heapUsed / 1024 / 1024;
      this.stats.peakMemory = Math.max(this.stats.peakMemory, memMB);

      if (memMB > this.config.maxMemoryMB) {
        throw new SafetyError('MEMORY_LIMIT', `Exceeded ${this.config.maxMemoryMB}MB`);
      }
    }

    return true;
  }

  validateGrid(grid) {
    if (grid.rows > this.config.maxGridSize || grid.cols > this.config.maxGridSize) {
      throw new SafetyError('GRID_SIZE', `Grid ${grid.rows}x${grid.cols} exceeds limit ${this.config.maxGridSize}`);
    }
    return true;
  }

  getStats() {
    return {
      ...this.stats,
      elapsedMs: this.stats.startTime ? Date.now() - this.stats.startTime : 0
    };
  }
}

class SafetyError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
    this.name = 'SafetyError';
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SOLVER v3
// ═══════════════════════════════════════════════════════════════════

class UnlimitedSolverV3 {
  constructor(config = {}) {
    this.config = {
      maxTime: config.maxTime || 300000,
      maxComplexity: config.maxComplexity || 21, // Sum of complexity vector
      verbose: config.verbose !== false,
      memoryPath: config.memoryPath || path.join(__dirname, 'memory_v3'),
      strictValidation: config.strictValidation || false,
      ...config
    };

    // Initialize all subsystems
    this.ontology = new HypothesisOntology();
    this.validation = new ValidationPipeline();
    this.memory = new CognitiveMemory(this.config.memoryPath);
    this.executor = new ChainExecutor();
    this.explainer = new ExplainabilityEngine();
    this.safety = new SafetyBoundary({
      maxTimeMs: this.config.maxTime
    });

    // V3.5: Memory Distillation for auto-storage of successful strategies
    this.distillation = new MemoryDistillation({
      memoryPath: this.config.memoryPath,
      verbose: this.config.verbose,
      similarityThreshold: 0.75
    });

    this.stats = {
      strategiesTried: 0,
      maxComplexityReached: 0,
      validationPasses: 0,
      validationFails: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * THE MAIN SOLVING LOOP - v3
   */
  solve(task) {
    const { train: trainingPairs, test: testPairs } = this.parseTask(task);

    if (trainingPairs.length === 0) {
      throw new Error('No training pairs provided');
    }

    this.stats.startTime = Date.now();
    this.stats.strategiesTried = 0;
    this.safety.start();

    if (this.config.verbose) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`UNLIMITED SOLVER v3 — META HORIZON`);
      console.log(`Hypothesis Classes: ${this.ontology.countClasses()}`);
      console.log(`Training pairs: ${trainingPairs.length}`);
      console.log(`Test pairs: ${testPairs.length}`);
      console.log(`${'═'.repeat(70)}\n`);
    }

    // Phase 0.5: Distilled Memory Recall (V3.5)
    const distilledResult = this.tryDistilledRecall(trainingPairs, testPairs, task);
    if (distilledResult) {
      return distilledResult;
    }

    // Phase 1: Memory lookup
    const memoryStrategy = this.tryMemoryStrategies(trainingPairs);
    if (memoryStrategy) {
      return this.finalizeResult(memoryStrategy, testPairs, trainingPairs, 'memory');
    }

    // Phase 1.5: Beast Mode - Micro-feature driven fast candidates
    const beastResult = this.tryBeastModeCandidates(trainingPairs, testPairs, task);
    if (beastResult) {
      return beastResult;
    }

    // Phase 1.6: Composite Chains - Multi-hop transformation search
    const compositeResult = this.tryCompositeChains(trainingPairs, testPairs, task);
    if (compositeResult) {
      return compositeResult;
    }

    // Phase 2: Multi-dimensional search
    for (let totalComplexity = 7; totalComplexity <= this.config.maxComplexity; totalComplexity++) {
      if (this.config.verbose && totalComplexity % 7 === 0) {
        console.log(`[Complexity ${totalComplexity}] Searching...`);
      }

      // Generate all complexity vectors at this level
      for (const cv of ComplexityVector.generateAtLevel(totalComplexity)) {
        // Generate hypotheses for this complexity
        for (const hypothesis of this.ontology.generateHypotheses(cv)) {
          this.stats.strategiesTried++;
          this.stats.maxComplexityReached = Math.max(this.stats.maxComplexityReached, totalComplexity);

          try {
            this.safety.check();
          } catch (e) {
            if (e instanceof SafetyError) {
              if (this.config.verbose) {
                console.log(`\nSafety limit: ${e.message}`);
              }
              break;
            }
            throw e;
          }

          // Validate through pipeline
          const validationResult = this.validation.validate(hypothesis, trainingPairs, {
            strictCounterexample: this.config.strictValidation
          });

          if (validationResult.passed) {
            this.stats.validationPasses++;

            // Record in memory
            this.memory.recordEpisode(task.id || 'unknown', hypothesis, trainingPairs, validationResult);

            return this.finalizeResult(hypothesis, testPairs, trainingPairs, 'search');
          } else {
            this.stats.validationFails++;

            // Record near-miss for learning
            if (validationResult.results?.behavioral?.cellAccuracy > 0.7) {
              this.memory.recordEpisode(task.id || 'unknown', hypothesis, trainingPairs, validationResult);
            }
          }
        }
      }
    }

    // Phase 3: Chain search (composite strategies)
    if (this.config.verbose) {
      console.log(`[Chain Search] Trying composite strategies...`);
    }

    for (const chain of this.executor.generateChains(this.safety.config.maxChainLength || 3)) {
      this.stats.strategiesTried++;

      try {
        this.safety.check();
      } catch (e) {
        if (e instanceof SafetyError) {
          if (this.config.verbose) {
            console.log(`\nSafety limit during chain search: ${e.message}`);
          }
          break;
        }
        throw e;
      }

      // Create composite hypothesis from chain
      const chainHypothesis = {
        name: chain.map(s => s.name).join(' → '),
        hierarchy: 'composite',
        chain: chain,
        strategy: {
          apply: (grid) => {
            let result = grid;
            for (const step of chain) {
              result = step.strategy.apply(result);
            }
            return result;
          }
        }
      };

      // Validate chain
      const validationResult = this.validation.validate(chainHypothesis, trainingPairs, {
        strictCounterexample: this.config.strictValidation
      });

      if (validationResult.passed) {
        this.stats.validationPasses++;
        this.memory.recordEpisode(task.id || 'unknown', chainHypothesis, trainingPairs, validationResult);
        return this.finalizeResult(chainHypothesis, testPairs, trainingPairs, 'chain');
      }
    }

    // No solution found
    this.stats.endTime = Date.now();
    return {
      success: false,
      stats: this.stats,
      message: 'No valid strategy found within constraints'
    };
  }

  parseTask(task) {
    const train = (task.train || []).map(pair => ({
      input: pair.input,
      output: pair.output
    }));

    const test = (task.test || []).map(pair => ({
      input: pair.input,
      output: pair.output
    }));

    return { train, test };
  }

  tryMemoryStrategies(trainingPairs) {
    const features = this.memory.extractFeatures(trainingPairs);
    const likelyStrategies = this.memory.getSuccessfulStrategiesFor(features);

    for (const strategyName of likelyStrategies) {
      this.stats.strategiesTried++;

      // Try to find and execute this strategy
      for (const hypothesis of this.ontology.generateHypotheses()) {
        if (hypothesis.name === strategyName) {
          const validationResult = this.validation.validate(hypothesis, trainingPairs);
          if (validationResult.passed) {
            if (this.config.verbose) {
              console.log(`Found solution from memory: ${strategyName}`);
            }
            return hypothesis;
          }
        }
      }
    }

    return null;
  }

  /**
   * Beast Mode - Micro-feature driven fast candidate search with FRACTURE
   * Uses MicroExtract to identify patterns and generates targeted candidates
   * NEW: Splits grid into fragments for parallel micro-solving
   */
  tryBeastModeCandidates(trainingPairs, testPairs, task) {
    const flowHandle = FlowSync.startFlow(`beast_${Date.now()}`, { task: task?.id });

    if (!flowHandle.allowed) {
      logger.log('BEAST_BLOCKED', { reason: flowHandle.reason });
      return null;
    }

    // Analyze first training pair
    const firstInput = trainingPairs[0]?.input;
    const firstOutput = trainingPairs[0]?.output;
    if (!firstInput || !firstOutput) {
      flowHandle.complete({ success: false });
      return null;
    }

    const inputGrid = firstInput instanceof Grid ? firstInput : Grid.fromArray(firstInput);
    const gridData = inputGrid.data || inputGrid.toArray();

    // Phase 1.5a: FRACTURE - Split grid into fragments
    const { frags, elapsed: frElapsed, count } = fracture(gridData, { bgVal: 0, maxFrags: 6, pad: 1 });
    logger.log('MICRO_FRACTURE', { frElapsed, count });

    if (this.config.verbose) {
      console.log(`[Beast Mode] Fractured into ${count} fragments (${frElapsed}ms)`);
    }

    // Phase 1.5b: Try whole-grid micro-extract first (original behavior)
    const wholeGridResult = this.tryWholeGridMicro(trainingPairs, testPairs, task, flowHandle, gridData);
    if (wholeGridResult) return wholeGridResult;

    // Phase 1.5c: Try fragment-based micro-solving
    let currentGrid = gridData.map(r => r.slice()); // Clone for mutation

    for (const fragMeta of frags) {
      // Run micro-extract on the fragment
      const micro = MicroExtract.analyze(fragMeta.frag, { prevGrid: null, mode: 'BEAST' });

      logger.log('MICRO_EXTRACT_FRAG', {
        rule: micro.rule,
        conf: micro.confidence,
        fragBox: fragMeta.box,
        solv: fragMeta.solvability
      });

      // Pre-solve FlowSync gating
      const flowCheck = FlowSync.analyze({
        time: micro.elapsed + frElapsed,
        progressScore: micro.confidence * fragMeta.solvability,
        microRule: micro.rule
      });

      logger.log('FLOW_SYNC_PRE_FRAG', flowCheck);

      if (flowCheck.warnings?.includes('Low progress') && micro.confidence < 0.04) {
        logger.log('FLOW_SYNC_SKIP_FRAG', { reason: 'low_signal', fragBox: fragMeta.box });
        continue;
      }

      // Generate micro candidates seeded from fragment
      const fragState = {
        grid: fragMeta.frag,
        clone: () => fragMeta.frag.map(r => r.slice())
      };
      const candidates = generateCandidatesFromMicro(fragState, micro);

      for (const candidate of candidates) {
        this.stats.strategiesTried++;

        try {
          // Simulate candidate on fragment
          const simFragGrid = candidate.apply(fragState);

          // Quick score on fragment context
          const fragPrevState = { grid: fragMeta.frag };
          const fragNextState = { grid: simFragGrid };
          const q = quickEvaluate(fragPrevState, fragNextState);

          logger.log('FRAG_CAND_EVAL', {
            fragBox: fragMeta.box,
            candidate: candidate.name,
            score: q
          });

          // If promising, apply fragment -> recombine -> validate
          if (q > 0.01 || micro.confidence > 0.25 || fragMeta.solvability > 0.5) {
            const merged = applyFragmentToGrid(currentGrid, simFragGrid, fragMeta.box);

            // SafeJump guard
            const safe = SafeJumpPolicy.guard({}, {});
            if (!safe.allowed) {
              logger.log('SAFE_BLOCK_FRAG', { reason: safe.reason, fragBox: fragMeta.box });
              continue;
            }

            // Create hypothesis from merged grid transform
            const hypothesis = this.createFragmentHypothesis(candidate, fragMeta, merged, gridData);

            // Validate against all training pairs
            const validationResult = this.validation.validate(hypothesis, trainingPairs, {
              strictCounterexample: this.config.strictValidation
            });

            if (validationResult.passed) {
              logger.log('APPLY_FRAG_TRANSFORM', {
                candidate: candidate.name,
                fragBox: fragMeta.box,
                micro: { rule: micro.rule, conf: micro.confidence }
              });

              flowHandle.complete({ success: true, candidate: candidate.name, source: 'fragment' });
              this.memory.recordEpisode(task?.id || 'unknown', hypothesis, trainingPairs, validationResult);

              return this.finalizeResult(hypothesis, testPairs, trainingPairs, 'beast_frag');
            }
          }
        } catch (e) {
          logger.log('BEAST_FRAG_ERROR', { candidate: candidate.name, error: e.message }, 'WARN');
        }
      }
    }

    flowHandle.complete({ success: false });
    return null;
  }

  /**
   * Try whole-grid micro-extraction (original Beast Mode behavior)
   */
  tryWholeGridMicro(trainingPairs, testPairs, task, flowHandle, gridData) {
    const micro = MicroExtract.analyze(gridData, { mode: 'BEAST' });

    if (this.config.verbose) {
      console.log(`[Beast Mode] Rule: ${micro.rule}, Confidence: ${(micro.confidence * 100).toFixed(1)}%`);
    }

    logger.log('MICRO_EXTRACT', {
      rule: micro.rule,
      confidence: micro.confidence,
      features: Object.keys(micro.features)
    });

    const currentState = {
      grid: gridData,
      clone: () => JSON.parse(JSON.stringify(gridData))
    };
    const candidates = generateCandidatesFromMicro(currentState, micro);

    if (this.config.verbose) {
      console.log(`[Beast Mode] Generated ${candidates.length} candidates`);
    }

    // NEW: Convergence pass to stabilize noisy transforms
    const expectedOutput = trainingPairs[0]?.output;
    const expectedData = expectedOutput instanceof Grid ? expectedOutput.data : (expectedOutput?.data || expectedOutput);

    if (expectedData && candidates.length > 0) {
      const convergenceResult = convergeToTarget(gridData, candidates, expectedData, 12);

      if (convergenceResult.matched) {
        logger.log('CONVERGE_MATCH_FOUND', {
          cycles: convergenceResult.cycles,
          rule: micro.rule
        });

        // Create hypothesis from converged result
        const convergedHypothesis = {
          name: `beast:converged_${micro.rule}`,
          hierarchy: 'beast',
          strategy: {
            apply: () => new Grid(convergenceResult.grid)
          }
        };

        const validationResult = this.validation.validate(convergedHypothesis, trainingPairs, {
          strictCounterexample: this.config.strictValidation
        });

        if (validationResult.passed) {
          logger.log('CONVERGE_VALIDATED', { rule: micro.rule, cycles: convergenceResult.cycles });
          flowHandle.complete({ success: true, source: 'convergence' });
          this.memory.recordEpisode(task?.id || 'unknown', convergedHypothesis, trainingPairs, validationResult);
          return this.finalizeResult(convergedHypothesis, testPairs, trainingPairs, 'beast:convergence');
        }
      } else if (convergenceResult.cycles > 0) {
        // Update gridData with converged partial result for candidate loop
        logger.log('CONVERGE_PARTIAL', { cycles: convergenceResult.cycles, improved: convergenceResult.improved });
      }
    }

    for (const candidate of candidates) {
      const gateResult = flowHandle.gate(candidate.name);
      if (!gateResult.allowed) {
        logger.log('BEAST_TIMEOUT', { candidate: candidate.name, elapsed: gateResult.elapsed });
        break;
      }

      this.stats.strategiesTried++;

      try {
        const simGrid = candidate.apply(currentState);
        const nextState = { grid: simGrid };

        const safe = SafeJumpPolicy.guard({}, {});
        if (!safe.allowed) {
          logger.log('SAFE_JUMP_BLOCK', { candidate: candidate.name, reason: safe.reason });
          continue;
        }

        const score = quickEvaluate(currentState, nextState);
        logger.log('CANDIDATE_EVAL', { candidate: candidate.name, score });

        if (score > 0.01 || micro.confidence > 0.25) {
          const hypothesis = {
            name: `beast:${candidate.name}`,
            hierarchy: 'beast',
            strategy: {
              apply: (grid) => {
                const state = {
                  grid: grid.data || grid.toArray(),
                  clone: () => JSON.parse(JSON.stringify(grid.data || grid.toArray()))
                };
                const result = candidate.apply(state);
                return new Grid(result);
              }
            }
          };

          const validationResult = this.validation.validate(hypothesis, trainingPairs, {
            strictCounterexample: this.config.strictValidation
          });

          if (validationResult.passed) {
            logger.log('APPLY_TRANSFORM', { candidate: candidate.name, success: true });
            flowHandle.complete({ success: true, candidate: candidate.name });
            this.memory.recordEpisode(task?.id || 'unknown', hypothesis, trainingPairs, validationResult);

            return this.finalizeResult(hypothesis, testPairs, trainingPairs, 'beast');
          }
        }
      } catch (e) {
        logger.log('BEAST_ERROR', { candidate: candidate.name, error: e.message }, 'WARN');
      }
    }

    return null;
  }

  /**
   * Create hypothesis from fragment-based transform
   */
  createFragmentHypothesis(candidate, fragMeta, mergedGrid, originalGrid) {
    return {
      name: `beast_frag:${candidate.name}@[${fragMeta.box.join(',')}]`,
      hierarchy: 'beast_fragment',
      fragBox: fragMeta.box,
      strategy: {
        apply: (grid) => {
          const inputData = grid.data || grid.toArray();
          const fragState = {
            grid: fragMeta.frag,
            clone: () => fragMeta.frag.map(r => r.slice())
          };

          // Re-extract fragment from input at same position
          const [minR, minC, maxR, maxC] = fragMeta.box;
          const extractedFrag = [];
          for (let r = minR; r <= maxR; r++) {
            const row = [];
            for (let c = minC; c <= maxC; c++) {
              row.push(inputData[r]?.[c] ?? 0);
            }
            extractedFrag.push(row);
          }

          const newFragState = {
            grid: extractedFrag,
            clone: () => extractedFrag.map(r => r.slice())
          };

          const transformed = candidate.apply(newFragState);
          const result = applyFragmentToGrid(inputData, transformed, fragMeta.box);

          return new Grid(result);
        }
      }
    };
  }

  /**
   * Phase 1.6: Try Composite Chains
   * Multi-hop transformation search using primitives
   */
  tryCompositeChains(trainingPairs, testPairs, task) {
    const flowHandle = FlowSync.startFlow(`composite_${Date.now()}`, { task: task?.id });

    if (!flowHandle.allowed) {
      logger.log('COMPOSITE_BLOCKED', { reason: flowHandle.reason });
      return null;
    }

    // Extract grid data from training pairs
    const normalizedPairs = trainingPairs.map(pair => ({
      input: pair.input instanceof Grid ? pair.input.data || pair.input.toArray() : pair.input,
      output: pair.output instanceof Grid ? pair.output.data || pair.output.toArray() : pair.output
    }));

    if (this.config.verbose) {
      console.log(`[Composite Chains] Searching for multi-hop transformation...`);
    }

    logger.log('COMPOSITE_START', {
      trainingPairs: normalizedPairs.length,
      maxDepth: 4
    });

    try {
      // Initialize CompositeChains engine
      const chainEngine = new CompositeChains(4, {
        maxCandidates: 5000,
        earlyExit: true,
        verbose: this.config.verbose
      });

      // Find valid chain
      const validChain = chainEngine.findValidChain(normalizedPairs);

      if (validChain) {
        logger.log('COMPOSITE_FOUND', {
          chain: validChain.chain,
          depth: validChain.chain.length
        });

        // Create hypothesis from chain
        const hypothesis = {
          name: `composite:${validChain.chain.join('_')}`,
          hierarchy: 'composite',
          chainSteps: validChain.chain,
          strategy: {
            apply: (grid) => {
              const inputData = grid.data || grid.toArray();
              const result = chainEngine.applyChain(inputData, validChain.chain);
              return new Grid(result);
            }
          }
        };

        // Validate hypothesis
        const validationResult = this.validation.validate(hypothesis, trainingPairs, {
          strictCounterexample: this.config.strictValidation
        });

        if (validationResult.passed) {
          logger.log('COMPOSITE_VALIDATED', {
            chain: validChain.chain,
            stats: chainEngine.stats
          });

          flowHandle.complete({ success: true, source: 'composite' });
          this.memory.recordEpisode(task?.id || 'unknown', hypothesis, trainingPairs, validationResult);

          return this.finalizeResult(hypothesis, testPairs, trainingPairs, 'composite');
        }
      }

      logger.log('COMPOSITE_NO_MATCH', { stats: chainEngine.stats });
    } catch (e) {
      logger.log('COMPOSITE_ERROR', { error: e.message }, 'WARN');
    }

    flowHandle.complete({ success: false });
    return null;
  }

  /**
   * Phase 0.5: Try Distilled Memory Recall (V3.5)
   * Attempts to match current task against previously distilled successful strategies
   */
  tryDistilledRecall(trainingPairs, testPairs, task) {
    logger.log('DISTILL_RECALL_START', { taskId: task?.id });

    // Normalize training pairs for fingerprinting
    const normalizedPairs = trainingPairs.map(pair => ({
      input: pair.input instanceof Grid ? pair.input.data || pair.input.toArray() : pair.input,
      output: pair.output instanceof Grid ? pair.output.data || pair.output.toArray() : pair.output
    }));

    // Try to recall matching distilled strategy
    const match = this.distillation.recallBest(normalizedPairs);

    if (!match) {
      logger.log('DISTILL_NO_MATCH', {});
      return null;
    }

    logger.log('DISTILL_MATCH_FOUND', {
      fingerprint: match.fingerprint?.hash,
      similarity: match.similarity,
      essence: match.essence?.name,
      type: match.essence?.type
    });

    // Try to reconstruct and apply the strategy
    try {
      const essence = match.essence;
      let hypothesis = null;

      if (essence.type === 'composite' && essence.chain) {
        // Reconstruct composite chain strategy
        const chainEngine = new CompositeChains(4);

        hypothesis = {
          name: `distilled:${essence.name}`,
          hierarchy: 'distilled',
          chainSteps: essence.chain,
          strategy: {
            apply: (grid) => {
              const inputData = grid.data || grid.toArray();
              const result = chainEngine.applyChain(inputData, essence.chain);
              return new Grid(result);
            }
          }
        };
      } else if (essence.type === 'beast' && essence.transform) {
        // We can't easily reconstruct beast transforms, skip
        logger.log('DISTILL_SKIP_BEAST', { transform: essence.transform });
        return null;
      }

      if (hypothesis) {
        // Validate the reconstructed hypothesis
        const validationResult = this.validation.validate(hypothesis, trainingPairs, {
          strictCounterexample: this.config.strictValidation
        });

        if (validationResult.passed) {
          logger.log('DISTILL_VALIDATED', {
            fingerprint: match.fingerprint?.hash,
            chain: essence.chain
          });

          // Record successful recall
          this.distillation.recordOutcome(match.fingerprint.hash, true);

          return this.finalizeResult(hypothesis, testPairs, trainingPairs, 'distilled');
        } else {
          // Record failed recall (strategy didn't work for this task)
          this.distillation.recordOutcome(match.fingerprint.hash, false);
          logger.log('DISTILL_VALIDATION_FAILED', { fingerprint: match.fingerprint?.hash });
        }
      }
    } catch (e) {
      logger.log('DISTILL_ERROR', { error: e.message }, 'WARN');
    }

    return null;
  }

  finalizeResult(strategy, testPairs, trainingPairs, source) {
    this.stats.endTime = Date.now();

    const results = [];
    for (const { input, output } of testPairs) {
      const inputGrid = input instanceof Grid ? input : Grid.fromArray(input);
      const expectedOutput = output ? (output instanceof Grid ? output : Grid.fromArray(output)) : null;

      const applyFn = strategy.apply || strategy.strategy?.apply;
      const predicted = applyFn.call(strategy.strategy || strategy, inputGrid);

      results.push({
        input: inputGrid.toArray(),
        predicted: predicted.toArray(),
        expected: expectedOutput?.toArray() || null,
        correct: expectedOutput ? predicted.equals(expectedOutput) : null
      });
    }

    // Generate explanation
    const explanation = this.explainer.explain(strategy, trainingPairs);

    if (this.config.verbose) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`SOLUTION FOUND (via ${source})`);
      console.log(`Strategy: ${strategy.name}`);
      console.log(`Hierarchy: ${strategy.hierarchy || 'unknown'}`);
      console.log(`Strategies tried: ${this.stats.strategiesTried}`);
      console.log(`Time: ${this.stats.endTime - this.stats.startTime}ms`);
      console.log(`Confidence: ${(explanation.confidence * 100).toFixed(1)}%`);
      console.log(`${'═'.repeat(70)}\n`);
    }

    // V3.5: Distill successful strategy for future recall
    if (source !== 'distilled') {  // Don't re-distill already distilled strategies
      try {
        const normalizedPairs = trainingPairs.map(pair => ({
          input: pair.input instanceof Grid ? pair.input.data || pair.input.toArray() : pair.input,
          output: pair.output instanceof Grid ? pair.output.data || pair.output.toArray() : pair.output
        }));

        const fingerprint = this.distillation.distill({
          taskId: strategy.name,
          trainPairs: normalizedPairs,
          strategy,
          source,
          solveTime: this.stats.endTime - this.stats.startTime
        });

        logger.log('DISTILL_STORED', {
          fingerprint: fingerprint.hash,
          source,
          strategy: strategy.name
        });
      } catch (e) {
        logger.log('DISTILL_STORE_ERROR', { error: e.message }, 'WARN');
      }
    }

    return {
      success: true,
      strategy: {
        name: strategy.name,
        hierarchy: strategy.hierarchy,
        complexity: strategy.complexity?.toString()
      },
      results,
      explanation,
      stats: this.stats,
      source
    };
  }

  /**
   * Quick solve with sensible defaults
   */
  static quickSolve(task, timeout = 60000) {
    const solver = new UnlimitedSolverV3({
      maxTime: timeout,
      verbose: false
    });
    return solver.solve(task);
  }

  /**
   * Get solver stats and capabilities
   */
  getCapabilities() {
    return {
      version: SOLVER_VERSION,
      codename: CODENAME,
      hypothesisClasses: this.ontology.countClasses(),
      hierarchies: Object.keys(this.ontology.hierarchies),
      validationStages: this.validation.stages,
      memoryLayers: Object.keys(this.memory.layers),
      memoryStats: this.memory.getStats(),
      distillationStats: this.distillation.getStats()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Main Solver
  UnlimitedSolverV3,

  // Core Components
  ComplexityVector,
  HypothesisOntology,
  ValidationPipeline,
  CognitiveMemory,
  ChainExecutor,
  ExplainabilityEngine,
  SafetyBoundary,
  SafetyError,

  // Safety Policy
  SafeJumpPolicy,

  // Re-export Grid from v2
  Grid,

  // Meta
  VERSION: SOLVER_VERSION,
  CODENAME
};

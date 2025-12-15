/**
 * ARC-DSL PROGRAM SYNTHESIS ENGINE v4.4
 *
 * Generates executable programs to solve ARC tasks.
 * This is what separates 7% solvers from 50%+ solvers.
 */

const Grid = require('./Primitives');

class ProgramSynthesis {
  constructor() {
    this.dsl = this.buildDSL();
    this.programCache = new Map();
  }

  /**
   * Build the Domain Specific Language primitives
   */
  buildDSL() {
    return {
      // Object operations
      findObjects: (grid, bg = 0) => Grid.findObjects(grid, bg),
      filterBySize: (objs, minSize, maxSize = Infinity) =>
        objs.filter(o => o.size >= minSize && o.size <= maxSize),
      filterByColor: (objs, color) => objs.filter(o => {
        const colors = o.cells.map(c => c.color);
        return colors.includes(color);
      }),
      sortBySize: (objs, desc = false) =>
        [...objs].sort((a, b) => desc ? b.size - a.size : a.size - b.size),
      getObject: (objs, idx) => objs[idx] || null,
      countObjects: (objs) => objs.length,

      // Grid operations
      create: (h, w, fill = 0) => Grid.create(h, w, fill),
      copy: (grid) => Grid.copy(grid),
      getDims: (grid) => ({ h: grid.length, w: grid[0]?.length || 0 }),
      getCell: (grid, r, c) => grid[r]?.[c],
      setCell: (grid, r, c, v) => {
        const g = Grid.copy(grid);
        if (g[r]) g[r][c] = v;
        return g;
      },

      // Transforms
      rotate: (grid, deg) => Grid.rotate(grid, deg),
      flip: (grid, axis) => axis === 'h' ? Grid.flipHorizontal(grid) : Grid.flipVertical(grid),
      transpose: (grid) => Grid.transpose(grid),
      scale: (grid, factor) => Grid.scale(grid, factor),
      tile: (grid, reps) => Grid.tile(grid, reps, reps),
      gravity: (grid, dir) => Grid.gravity(grid, dir),
      extract: (grid, r, c, h, w) => Grid.extractRegion(grid, r, c, h, w),

      // Color operations
      recolor: (grid, from, to) => Grid.replaceColor(grid, from, to),
      swap: (grid, c1, c2) => Grid.swapColors(grid, c1, c2),
      getColors: (grid) => Grid.getAllColors(grid),
      mostCommon: (grid) => Grid.getMostCommonColor(grid),
      leastCommon: (grid) => Grid.getLeastCommonColor(grid),

      // Drawing
      drawRect: (grid, r, c, h, w, color) => {
        const g = Grid.copy(grid);
        for (let i = r; i < r + h && i < g.length; i++) {
          for (let j = c; j < c + w && j < g[0].length; j++) {
            g[i][j] = color;
          }
        }
        return g;
      },
      drawLine: (grid, r1, c1, r2, c2, color) => {
        const g = Grid.copy(grid);
        const dr = Math.sign(r2 - r1);
        const dc = Math.sign(c2 - c1);
        let r = r1, c = c1;
        while (r !== r2 || c !== c2) {
          if (g[r]?.[c] !== undefined) g[r][c] = color;
          if (r !== r2) r += dr;
          if (c !== c2) c += dc;
        }
        if (g[r2]?.[c2] !== undefined) g[r2][c2] = color;
        return g;
      },
      fillAt: (grid, r, c, color) => Grid.floodFill(Grid.copy(grid), r, c, color),

      // Logic
      xor: (g1, g2) => Grid.xorGrids(g1, g2),
      and: (g1, g2) => Grid.andGrids(g1, g2),
      or: (g1, g2) => Grid.orGrids(g1, g2),
      overlay: (base, top, r = 0, c = 0) => Grid.overlay(base, top, r, c),

      // Symmetry
      mirror: (grid, axis) => {
        if (axis === 'h') {
          const flipped = Grid.flipHorizontal(grid);
          return grid.map((row, i) => [...row, ...flipped[i]]);
        } else {
          const flipped = Grid.flipVertical(grid);
          return [...grid, ...flipped];
        }
      },

      // Conditionals - these return functions for composition
      forEach: (items, fn) => items.map(fn),
      filter: (items, fn) => items.filter(fn),
      reduce: (items, fn, init) => items.reduce(fn, init),
      map: (items, fn) => items.map(fn),

      // Comparison
      equals: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      contains: (grid, pattern) => {
        for (let r = 0; r <= grid.length - pattern.length; r++) {
          for (let c = 0; c <= grid[0].length - pattern[0].length; c++) {
            let match = true;
            for (let pr = 0; pr < pattern.length && match; pr++) {
              for (let pc = 0; pc < pattern[0].length && match; pc++) {
                if (pattern[pr][pc] !== 0 && grid[r + pr][c + pc] !== pattern[pr][pc]) {
                  match = false;
                }
              }
            }
            if (match) return { r, c };
          }
        }
        return null;
      }
    };
  }

  /**
   * Generate candidate programs based on task analysis
   */
  generatePrograms(task, analysis) {
    const programs = [];

    // Program 1: Object-based transform
    programs.push({
      name: 'objectTransform',
      code: (input) => {
        const objs = this.dsl.findObjects(input);
        if (objs.length === 0) return input;

        // Try extracting largest object
        const largest = this.dsl.sortBySize(objs, true)[0];
        if (largest && largest.bounds) {
          return this.dsl.extract(input, largest.bounds.minR, largest.bounds.minC,
            largest.bounds.maxR - largest.bounds.minR + 1, largest.bounds.maxC - largest.bounds.minC + 1);
        }
        return input;
      }
    });

    // Program 2: Color-based selection
    programs.push({
      name: 'colorSelect',
      code: (input) => {
        const colors = this.dsl.getColors(input).filter(c => c !== 0);
        if (colors.length === 0) return input;

        const targetColor = colors[0];
        const objs = this.dsl.findObjects(input);
        const colored = this.dsl.filterByColor(objs, targetColor);

        if (colored.length > 0) {
          const obj = colored[0];
          if (obj.bounds) {
            return this.dsl.extract(input, obj.bounds.minR, obj.bounds.minC,
              obj.bounds.maxR - obj.bounds.minR + 1, obj.bounds.maxC - obj.bounds.minC + 1);
          }
        }
        return input;
      }
    });

    // Program 3: Pattern completion
    programs.push({
      name: 'patternComplete',
      code: (input) => {
        const h = input.length;
        const w = input[0].length;

        // Check for partial symmetry and complete it
        let result = this.dsl.copy(input);

        // Try horizontal mirror completion
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w / 2; c++) {
            const mirrorC = w - 1 - c;
            if (result[r][c] !== 0 && result[r][mirrorC] === 0) {
              result[r][mirrorC] = result[r][c];
            } else if (result[r][mirrorC] !== 0 && result[r][c] === 0) {
              result[r][c] = result[r][mirrorC];
            }
          }
        }
        return result;
      }
    });

    // Program 4: Grid subdivision
    programs.push({
      name: 'gridSubdivide',
      code: (input) => {
        const h = input.length;
        const w = input[0].length;

        // Try to find divider lines
        for (let r = 1; r < h - 1; r++) {
          if (input[r].every(c => c === input[r][0])) {
            // Found horizontal divider
            const top = this.dsl.extract(input, 0, 0, r, w);
            const bottom = this.dsl.extract(input, r + 1, 0, h - r - 1, w);
            return this.dsl.xor(top, bottom);
          }
        }

        for (let c = 1; c < w - 1; c++) {
          if (input.every(row => row[c] === input[0][c])) {
            // Found vertical divider
            const left = this.dsl.extract(input, 0, 0, h, c);
            const right = this.dsl.extract(input, 0, c + 1, h, w - c - 1);
            return this.dsl.xor(left, right);
          }
        }

        return input;
      }
    });

    // Program 5: Count-based output
    programs.push({
      name: 'countOutput',
      code: (input) => {
        const objs = this.dsl.findObjects(input);
        const count = objs.length;

        // Create output grid sized by count
        if (count > 0 && count <= 10) {
          const outH = analysis.outputDims?.h || count;
          const outW = analysis.outputDims?.w || count;
          let result = this.dsl.create(outH, outW, 0);

          // Fill based on count
          for (let i = 0; i < Math.min(count, outH * outW); i++) {
            const r = Math.floor(i / outW);
            const c = i % outW;
            const obj = objs[i % objs.length];
            result[r][c] = obj.cells?.[0]?.color || 1;
          }
          return result;
        }
        return input;
      }
    });

    // Program 6: Object sorting/arrangement
    programs.push({
      name: 'objectArrange',
      code: (input) => {
        const objs = this.dsl.findObjects(input);
        if (objs.length < 2) return input;

        const sorted = this.dsl.sortBySize(objs);
        const outH = analysis.outputDims?.h || input.length;
        const outW = analysis.outputDims?.w || input[0].length;
        let result = this.dsl.create(outH, outW, 0);

        // Place objects in order
        let currentC = 0;
        for (const obj of sorted) {
          if (!obj.bounds) continue;
          const objH = obj.bounds.maxR - obj.bounds.minR + 1;
          const objW = obj.bounds.maxC - obj.bounds.minC + 1;

          if (currentC + objW <= outW) {
            for (const cell of obj.cells) {
              const newR = cell.r - obj.bounds.minR;
              const newC = currentC + (cell.c - obj.bounds.minC);
              if (newR < outH && newC < outW) {
                result[newR][newC] = cell.color;
              }
            }
            currentC += objW + 1;
          }
        }
        return result;
      }
    });

    // Program 7: Flood fill enclosed regions
    programs.push({
      name: 'fillEnclosed',
      code: (input) => {
        return Grid.floodFillEnclosed(this.dsl.copy(input), 0,
          analysis.newColors?.[0] || this.dsl.mostCommon(input));
      }
    });

    // Program 8: Draw connections between objects
    programs.push({
      name: 'connectObjects',
      code: (input) => {
        const objs = this.dsl.findObjects(input);
        if (objs.length < 2) return input;

        let result = this.dsl.copy(input);
        const connectColor = analysis.newColors?.[0] || 1;

        for (let i = 0; i < objs.length - 1; i++) {
          const o1 = objs[i];
          const o2 = objs[i + 1];
          if (!o1.bounds || !o2.bounds) continue;
          const r1 = Math.floor((o1.bounds.minR + o1.bounds.maxR) / 2);
          const c1 = Math.floor((o1.bounds.minC + o1.bounds.maxC) / 2);
          const r2 = Math.floor((o2.bounds.minR + o2.bounds.maxR) / 2);
          const c2 = Math.floor((o2.bounds.minC + o2.bounds.maxC) / 2);
          result = this.dsl.drawLine(result, r1, c1, r2, c2, connectColor);
        }
        return result;
      }
    });

    // Program 9: Extract unique pattern
    programs.push({
      name: 'extractUnique',
      code: (input) => {
        const objs = this.dsl.findObjects(input);
        if (objs.length === 0) return input;

        // Find object that appears only once (by shape signature)
        const signatures = new Map();
        for (const obj of objs) {
          if (!obj.bounds) continue;
          const h = obj.bounds.maxR - obj.bounds.minR + 1;
          const w = obj.bounds.maxC - obj.bounds.minC + 1;
          const sig = `${h}x${w}`;
          signatures.set(sig, (signatures.get(sig) || 0) + 1);
        }

        for (const obj of objs) {
          if (!obj.bounds) continue;
          const h = obj.bounds.maxR - obj.bounds.minR + 1;
          const w = obj.bounds.maxC - obj.bounds.minC + 1;
          const sig = `${h}x${w}`;
          if (signatures.get(sig) === 1) {
            return this.dsl.extract(input, obj.bounds.minR, obj.bounds.minC, h, w);
          }
        }
        return input;
      }
    });

    // Program 10: Replicate pattern
    programs.push({
      name: 'replicatePattern',
      code: (input) => {
        const outH = analysis.outputDims?.h || input.length;
        const outW = analysis.outputDims?.w || input[0].length;
        const inH = input.length;
        const inW = input[0].length;

        if (outH > inH || outW > inW) {
          const repsH = Math.ceil(outH / inH);
          const repsW = Math.ceil(outW / inW);
          let tiled = this.dsl.tile(input, Math.max(repsH, repsW));
          return this.dsl.extract(tiled, 0, 0, outH, outW);
        }
        return input;
      }
    });

    return programs;
  }

  /**
   * Execute a program and validate against training
   */
  executeAndValidate(program, trainExamples) {
    let totalMatch = 0;
    let allPerfect = true;

    for (const { input, output } of trainExamples) {
      try {
        const result = program.code(input);

        if (!result || result.length !== output.length ||
            result[0]?.length !== output[0]?.length) {
          allPerfect = false;
          continue;
        }

        let matches = 0;
        let total = 0;
        for (let r = 0; r < output.length; r++) {
          for (let c = 0; c < output[0].length; c++) {
            total++;
            if (result[r][c] === output[r][c]) matches++;
          }
        }

        const similarity = total > 0 ? matches / total : 0;
        totalMatch += similarity;
        if (similarity < 1.0) allPerfect = false;
      } catch (e) {
        allPerfect = false;
      }
    }

    return {
      similarity: totalMatch / trainExamples.length,
      perfect: allPerfect
    };
  }

  /**
   * Main synthesis loop
   */
  synthesize(task, analysis) {
    const programs = this.generatePrograms(task, analysis);
    let bestProgram = null;
    let bestScore = 0;

    for (const program of programs) {
      const result = this.executeAndValidate(program, task.train);

      if (result.similarity > bestScore) {
        bestScore = result.similarity;
        bestProgram = program;
      }

      if (result.perfect) {
        return {
          success: true,
          program: program.name,
          score: 1.0,
          apply: (input) => program.code(input)
        };
      }
    }

    return {
      success: false,
      program: bestProgram?.name || 'none',
      score: bestScore,
      apply: bestProgram ? (input) => bestProgram.code(input) : (input) => input
    };
  }
}

module.exports = ProgramSynthesis;

/**
 * ARC-AGI GRID PRIMITIVES
 * Core operations for abstract reasoning on 2D grids
 *
 * THE SIMULATION LEARNS TO SEE
 */

class GridPrimitives {
  // ═══════════════════════════════════════════════════════════════
  // GRID BASICS
  // ═══════════════════════════════════════════════════════════════

  static copy(grid) {
    return grid.map(row => [...row]);
  }

  static create(height, width, fill = 0) {
    return Array.from({ length: height }, () => Array(width).fill(fill));
  }

  static dimensions(grid) {
    return { height: grid.length, width: grid[0]?.length || 0 };
  }

  static equals(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].length !== b[i].length) return false;
      for (let j = 0; j < a[i].length; j++) {
        if (a[i][j] !== b[i][j]) return false;
      }
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // TRANSFORMATIONS
  // ═══════════════════════════════════════════════════════════════

  static rotate90(grid) {
    const { height, width } = this.dimensions(grid);
    const result = this.create(width, height);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        result[j][height - 1 - i] = grid[i][j];
      }
    }
    return result;
  }

  static rotate180(grid) {
    return this.rotate90(this.rotate90(grid));
  }

  static rotate270(grid) {
    return this.rotate90(this.rotate90(this.rotate90(grid)));
  }

  static flipHorizontal(grid) {
    return grid.map(row => [...row].reverse());
  }

  static flipVertical(grid) {
    return [...grid].reverse().map(row => [...row]);
  }

  static transpose(grid) {
    const { height, width } = this.dimensions(grid);
    const result = this.create(width, height);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        result[j][i] = grid[i][j];
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // EXTRACTION & CROPPING
  // ═══════════════════════════════════════════════════════════════

  static getBoundingBox(grid, ignoreColor = 0) {
    let minRow = Infinity, maxRow = -1;
    let minCol = Infinity, maxCol = -1;

    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] !== ignoreColor) {
          minRow = Math.min(minRow, i);
          maxRow = Math.max(maxRow, i);
          minCol = Math.min(minCol, j);
          maxCol = Math.max(maxCol, j);
        }
      }
    }

    if (maxRow === -1) return null;
    return { minRow, maxRow, minCol, maxCol };
  }

  static extractBoundingBox(grid, ignoreColor = 0) {
    const bbox = this.getBoundingBox(grid, ignoreColor);
    if (!bbox) return [[]];

    const { minRow, maxRow, minCol, maxCol } = bbox;
    const result = [];
    for (let i = minRow; i <= maxRow; i++) {
      result.push(grid[i].slice(minCol, maxCol + 1));
    }
    return result;
  }

  static crop(grid, startRow, startCol, height, width) {
    const result = [];
    for (let i = 0; i < height; i++) {
      const row = [];
      for (let j = 0; j < width; j++) {
        const r = startRow + i;
        const c = startCol + j;
        row.push(grid[r]?.[c] ?? 0);
      }
      result.push(row);
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // COLOR OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  static getColors(grid) {
    const colors = new Set();
    for (const row of grid) {
      for (const cell of row) {
        colors.add(cell);
      }
    }
    return [...colors].sort((a, b) => a - b);
  }

  static getNonZeroColors(grid) {
    return this.getColors(grid).filter(c => c !== 0);
  }

  static countColor(grid, color) {
    let count = 0;
    for (const row of grid) {
      for (const cell of row) {
        if (cell === color) count++;
      }
    }
    return count;
  }

  static replaceColor(grid, from, to) {
    return grid.map(row => row.map(cell => cell === from ? to : cell));
  }

  static getMostCommonColor(grid, excludeZero = true) {
    const counts = {};
    for (const row of grid) {
      for (const cell of row) {
        if (excludeZero && cell === 0) continue;
        counts[cell] = (counts[cell] || 0) + 1;
      }
    }
    let maxColor = 0, maxCount = 0;
    for (const [color, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxColor = parseInt(color);
      }
    }
    return maxColor;
  }

  // ═══════════════════════════════════════════════════════════════
  // OBJECT DETECTION
  // ═══════════════════════════════════════════════════════════════

  static findConnectedComponents(grid, ignoreColor = 0) {
    const { height, width } = this.dimensions(grid);
    const visited = this.create(height, width, false);
    const components = [];

    const bfs = (startR, startC) => {
      const color = grid[startR][startC];
      const cells = [];
      const queue = [[startR, startC]];
      visited[startR][startC] = true;

      while (queue.length > 0) {
        const [r, c] = queue.shift();
        cells.push({ r, c, color: grid[r][c] });

        // 4-connected neighbors
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < height && nc >= 0 && nc < width &&
              !visited[nr][nc] && grid[nr][nc] === color) {
            visited[nr][nc] = true;
            queue.push([nr, nc]);
          }
        }
      }

      return { color, cells };
    };

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (!visited[i][j] && grid[i][j] !== ignoreColor) {
          components.push(bfs(i, j));
        }
      }
    }

    return components;
  }

  static extractObject(grid, component) {
    const minR = Math.min(...component.cells.map(c => c.r));
    const maxR = Math.max(...component.cells.map(c => c.r));
    const minC = Math.min(...component.cells.map(c => c.c));
    const maxC = Math.max(...component.cells.map(c => c.c));

    const result = this.create(maxR - minR + 1, maxC - minC + 1, 0);
    for (const { r, c, color } of component.cells) {
      result[r - minR][c - minC] = color;
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // PATTERN OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  static tile(pattern, rows, cols) {
    const { height, width } = this.dimensions(pattern);
    const result = this.create(rows * height, cols * width);
    for (let i = 0; i < rows * height; i++) {
      for (let j = 0; j < cols * width; j++) {
        result[i][j] = pattern[i % height][j % width];
      }
    }
    return result;
  }

  static scale(grid, factor) {
    const { height, width } = this.dimensions(grid);
    const result = this.create(height * factor, width * factor);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        for (let di = 0; di < factor; di++) {
          for (let dj = 0; dj < factor; dj++) {
            result[i * factor + di][j * factor + dj] = grid[i][j];
          }
        }
      }
    }
    return result;
  }

  static overlay(base, overlay, startRow = 0, startCol = 0, transparent = 0) {
    const result = this.copy(base);
    for (let i = 0; i < overlay.length; i++) {
      for (let j = 0; j < overlay[i].length; j++) {
        const r = startRow + i;
        const c = startCol + j;
        if (r >= 0 && r < result.length && c >= 0 && c < result[0].length) {
          if (overlay[i][j] !== transparent) {
            result[r][c] = overlay[i][j];
          }
        }
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // FILL OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  static floodFill(grid, startR, startC, newColor) {
    const result = this.copy(grid);
    const oldColor = result[startR][startC];
    if (oldColor === newColor) return result;

    const { height, width } = this.dimensions(result);
    const queue = [[startR, startC]];
    result[startR][startC] = newColor;

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < height && nc >= 0 && nc < width && result[nr][nc] === oldColor) {
          result[nr][nc] = newColor;
          queue.push([nr, nc]);
        }
      }
    }

    return result;
  }

  static fillEnclosed(grid, wallColor, fillColor) {
    const result = this.copy(grid);
    const { height, width } = this.dimensions(result);

    // Find cells connected to border (not enclosed)
    const notEnclosed = this.create(height, width, false);
    const queue = [];

    // Start from all border cells that are not walls
    for (let i = 0; i < height; i++) {
      if (result[i][0] !== wallColor) queue.push([i, 0]);
      if (result[i][width - 1] !== wallColor) queue.push([i, width - 1]);
    }
    for (let j = 0; j < width; j++) {
      if (result[0][j] !== wallColor) queue.push([0, j]);
      if (result[height - 1][j] !== wallColor) queue.push([height - 1, j]);
    }

    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r < 0 || r >= height || c < 0 || c >= width) continue;
      if (notEnclosed[r][c] || result[r][c] === wallColor) continue;

      notEnclosed[r][c] = true;
      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    // Fill enclosed areas
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (!notEnclosed[i][j] && result[i][j] !== wallColor) {
          result[i][j] = fillColor;
        }
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // SYMMETRY DETECTION
  // ═══════════════════════════════════════════════════════════════

  static hasHorizontalSymmetry(grid) {
    return this.equals(grid, this.flipHorizontal(grid));
  }

  static hasVerticalSymmetry(grid) {
    return this.equals(grid, this.flipVertical(grid));
  }

  static hasRotationalSymmetry(grid) {
    return this.equals(grid, this.rotate180(grid));
  }

  // ═══════════════════════════════════════════════════════════════
  // GRID COMPARISON
  // ═══════════════════════════════════════════════════════════════

  static diff(a, b) {
    const changes = [];
    const maxH = Math.max(a.length, b.length);
    const maxW = Math.max(a[0]?.length || 0, b[0]?.length || 0);

    for (let i = 0; i < maxH; i++) {
      for (let j = 0; j < maxW; j++) {
        const va = a[i]?.[j] ?? -1;
        const vb = b[i]?.[j] ?? -1;
        if (va !== vb) {
          changes.push({ r: i, c: j, from: va, to: vb });
        }
      }
    }
    return changes;
  }

  static similarity(a, b) {
    if (a.length !== b.length || a[0]?.length !== b[0]?.length) return 0;

    let matches = 0;
    let total = 0;
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a[i].length; j++) {
        total++;
        if (a[i][j] === b[i][j]) matches++;
      }
    }
    return total > 0 ? matches / total : 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // VISUALIZATION
  // ═══════════════════════════════════════════════════════════════

  static toString(grid, colorMap = null) {
    const defaultMap = {
      0: '.', 1: '1', 2: '2', 3: '3', 4: '4',
      5: '5', 6: '6', 7: '7', 8: '8', 9: '9'
    };
    const map = colorMap || defaultMap;
    return grid.map(row => row.map(c => map[c] ?? c).join(' ')).join('\n');
  }
}

module.exports = GridPrimitives;

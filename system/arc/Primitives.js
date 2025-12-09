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
  // CONCATENATION & MIRRORING
  // ═══════════════════════════════════════════════════════════════

  static concatHorizontal(a, b) {
    const height = Math.max(a.length, b.length);
    const result = [];
    for (let i = 0; i < height; i++) {
      const rowA = a[i] || [];
      const rowB = b[i] || [];
      result.push([...rowA, ...rowB]);
    }
    return result;
  }

  static concatVertical(a, b) {
    return [...a.map(r => [...r]), ...b.map(r => [...r])];
  }

  static mirrorHorizontal(grid) {
    return this.concatHorizontal(grid, this.flipHorizontal(grid));
  }

  static mirrorVertical(grid) {
    return this.concatVertical(grid, this.flipVertical(grid));
  }

  static tileHorizontal(grid, times = 2) {
    let result = this.copy(grid);
    for (let i = 1; i < times; i++) {
      result = this.concatHorizontal(result, grid);
    }
    return result;
  }

  static tileVertical(grid, times = 2) {
    let result = this.copy(grid);
    for (let i = 1; i < times; i++) {
      result = this.concatVertical(result, grid);
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // GRAVITY & SHIFTING
  // ═══════════════════════════════════════════════════════════════

  static shiftDown(grid, amount = 1) {
    const { height, width } = this.dimensions(grid);
    const result = this.create(height, width, 0);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const newI = (i + amount) % height;
        result[newI][j] = grid[i][j];
      }
    }
    return result;
  }

  static shiftUp(grid, amount = 1) {
    return this.shiftDown(grid, grid.length - amount);
  }

  static shiftRight(grid, amount = 1) {
    const { height, width } = this.dimensions(grid);
    const result = this.create(height, width, 0);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const newJ = (j + amount) % width;
        result[i][newJ] = grid[i][j];
      }
    }
    return result;
  }

  static shiftLeft(grid, amount = 1) {
    return this.shiftRight(grid, grid[0].length - amount);
  }

  static gravityDown(grid) {
    const { height, width } = this.dimensions(grid);
    const result = this.create(height, width, 0);

    for (let j = 0; j < width; j++) {
      const column = [];
      for (let i = 0; i < height; i++) {
        if (grid[i][j] !== 0) column.push(grid[i][j]);
      }
      const startRow = height - column.length;
      for (let i = 0; i < column.length; i++) {
        result[startRow + i][j] = column[i];
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // PATTERN DETECTION & DEDUPLICATION
  // ═══════════════════════════════════════════════════════════════

  static findHorizontalRepeat(grid) {
    const { height, width } = this.dimensions(grid);
    for (let w = 1; w <= width / 2; w++) {
      if (width % w !== 0) continue;
      let isRepeat = true;
      for (let i = 0; i < height && isRepeat; i++) {
        for (let j = w; j < width && isRepeat; j++) {
          if (grid[i][j] !== grid[i][j % w]) isRepeat = false;
        }
      }
      if (isRepeat) return w;
    }
    return width;
  }

  static findVerticalRepeat(grid) {
    const { height, width } = this.dimensions(grid);
    for (let h = 1; h <= height / 2; h++) {
      if (height % h !== 0) continue;
      let isRepeat = true;
      for (let i = h; i < height && isRepeat; i++) {
        for (let j = 0; j < width && isRepeat; j++) {
          if (grid[i][j] !== grid[i % h][j]) isRepeat = false;
        }
      }
      if (isRepeat) return h;
    }
    return height;
  }

  static deduplicateHorizontal(grid) {
    const repeatWidth = this.findHorizontalRepeat(grid);
    return grid.map(row => row.slice(0, repeatWidth));
  }

  static deduplicateVertical(grid) {
    const repeatHeight = this.findVerticalRepeat(grid);
    return grid.slice(0, repeatHeight).map(r => [...r]);
  }

  static deduplicate(grid) {
    let result = this.deduplicateVertical(grid);
    result = this.deduplicateHorizontal(result);
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // XOR & DIFFERENCE OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  static xor(a, b, outputColor = 2) {
    const height = Math.min(a.length, b.length);
    const width = Math.min(a[0]?.length || 0, b[0]?.length || 0);
    const result = this.create(height, width, 0);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const va = a[i][j] !== 0;
        const vb = b[i][j] !== 0;
        if (va !== vb) result[i][j] = outputColor;
      }
    }
    return result;
  }

  // AND operation: output where BOTH grids have non-zero values
  static and(a, b, outputColor = 2) {
    const height = Math.min(a.length, b.length);
    const width = Math.min(a[0]?.length || 0, b[0]?.length || 0);
    const result = this.create(height, width, 0);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const va = a[i][j] !== 0;
        const vb = b[i][j] !== 0;
        if (va && vb) result[i][j] = outputColor;
      }
    }
    return result;
  }

  static splitVerticalHalves(grid, separator = 5) {
    const { width } = this.dimensions(grid);
    let splitCol = -1;

    // Find separator column
    for (let j = 0; j < width; j++) {
      if (grid.every(row => row[j] === separator)) {
        splitCol = j;
        break;
      }
    }

    if (splitCol === -1) {
      splitCol = Math.floor(width / 2);
    }

    const left = grid.map(row => row.slice(0, splitCol));
    const right = grid.map(row => row.slice(splitCol + 1));
    return { left, right };
  }

  // ═══════════════════════════════════════════════════════════════
  // MARKER OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  static findMarker(grid) {
    // Find a single isolated cell in corner (likely a marker)
    const { height, width } = this.dimensions(grid);
    const corners = [
      [0, 0], [0, width - 1],
      [height - 1, 0], [height - 1, width - 1]
    ];

    for (const [r, c] of corners) {
      if (grid[r][c] !== 0) {
        return { row: r, col: c, color: grid[r][c] };
      }
    }

    // Check last row for marker
    for (let j = 0; j < width; j++) {
      if (grid[height - 1][j] !== 0) {
        return { row: height - 1, col: j, color: grid[height - 1][j] };
      }
    }

    return null;
  }

  static replaceColorWithMarker(grid) {
    const marker = this.findMarker(grid);
    if (!marker) return this.copy(grid);

    const { height, width } = this.dimensions(grid);
    const result = this.create(height, width, 0);

    // Find the main shape color (not the marker, not 0)
    let shapeColor = 0;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[i][j] !== 0 && grid[i][j] !== marker.color) {
          shapeColor = grid[i][j];
          break;
        }
      }
      if (shapeColor) break;
    }

    // Replace shape color with marker color, REMOVE the marker itself
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (i === marker.row && j === marker.col) {
          result[i][j] = 0; // Remove marker
        } else if (grid[i][j] === shapeColor) {
          result[i][j] = marker.color;
        }
      }
    }

    return result;
  }

  static expandAroundPoints(grid, targetColor = 5, expandColor = 1, radius = 1) {
    const { height, width } = this.dimensions(grid);
    const result = this.copy(grid);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[i][j] === targetColor) {
          // Draw square around this point
          for (let di = -radius; di <= radius; di++) {
            for (let dj = -radius; dj <= radius; dj++) {
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < height && nj >= 0 && nj < width) {
                if (result[ni][nj] === 0) {
                  result[ni][nj] = expandColor;
                }
              }
            }
          }
        }
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // ADVANCED OBJECT OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  static findLargestComponent(grid, targetColor = null) {
    const components = this.findConnectedComponents(grid);
    if (components.length === 0) return null;

    // Filter by color if specified
    const filtered = targetColor !== null
      ? components.filter(c => c.color === targetColor)
      : components;

    if (filtered.length === 0) return null;

    return filtered.reduce((largest, comp) =>
      comp.cells.length > largest.cells.length ? comp : largest
    );
  }

  static colorLargestComponent(grid, newColor = 8, targetColor = null) {
    // If no targetColor specified, find the dominant non-zero color
    if (targetColor === null) {
      const colors = this.getNonZeroColors(grid);
      targetColor = colors[0] || 0;
    }

    const largest = this.findLargestComponent(grid, targetColor);
    if (!largest) return this.copy(grid);

    const result = this.copy(grid);
    for (const { r, c } of largest.cells) {
      result[r][c] = newColor;
    }
    return result;
  }

  // Color ALL connected components larger than size threshold
  static colorSignificantComponents(grid, newColor = 8, minSize = 2, targetColor = null) {
    if (targetColor === null) {
      const colors = this.getNonZeroColors(grid);
      targetColor = colors[0] || 0;
    }

    const components = this.findConnectedComponents(grid);
    const significant = components.filter(c =>
      c.color === targetColor && c.cells.length >= minSize
    );

    const result = this.copy(grid);
    for (const comp of significant) {
      for (const { r, c } of comp.cells) {
        result[r][c] = newColor;
      }
    }
    return result;
  }

  static fillLShapeCorner(grid, shapeColor = 8, fillColor = 1) {
    const { height, width } = this.dimensions(grid);
    const result = this.copy(grid);

    // Find ALL L-shaped patterns (all 4 orientations) and fill the corner
    // An L-shape is 3 cells in an L, we fill the 4th to make a 2x2
    for (let i = 0; i < height - 1; i++) {
      for (let j = 0; j < width - 1; j++) {
        // Check each 2x2 region for L-shapes
        const tl = grid[i][j];
        const tr = grid[i][j + 1];
        const bl = grid[i + 1][j];
        const br = grid[i + 1][j + 1];

        // Count how many cells have shapeColor
        const cells = [tl, tr, bl, br];
        const shapeCount = cells.filter(c => c === shapeColor).length;
        const zeroCount = cells.filter(c => c === 0).length;

        // L-shape: exactly 3 cells with shapeColor, 1 with 0
        if (shapeCount === 3 && zeroCount === 1) {
          if (tl === 0) result[i][j] = fillColor;
          else if (tr === 0) result[i][j + 1] = fillColor;
          else if (bl === 0) result[i + 1][j] = fillColor;
          else if (br === 0) result[i + 1][j + 1] = fillColor;
        }
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // SELF-TILING (tile based on non-zero pattern)
  // ═══════════════════════════════════════════════════════════════

  static selfTile(grid) {
    const { height, width } = this.dimensions(grid);
    const result = this.create(height * height, width * width, 0);

    for (let bi = 0; bi < height; bi++) {
      for (let bj = 0; bj < width; bj++) {
        if (grid[bi][bj] !== 0) {
          // Place a copy of the grid at this block position
          for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
              result[bi * height + i][bj * width + j] = grid[i][j];
            }
          }
        }
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // COLOR MAPPING (learn from examples)
  // ═══════════════════════════════════════════════════════════════

  static learnColorMapping(inputGrid, outputGrid) {
    const mapping = {};
    const { height, width } = this.dimensions(inputGrid);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const inColor = inputGrid[i][j];
        const outColor = outputGrid[i]?.[j];
        if (outColor !== undefined && inColor !== outColor) {
          mapping[inColor] = outColor;
        }
      }
    }

    return mapping;
  }

  static applyColorMapping(grid, mapping) {
    return grid.map(row => row.map(cell => mapping[cell] ?? cell));
  }

  // ═══════════════════════════════════════════════════════════════
  // ADVANCED SPATIAL OPERATIONS (2027 MODE)
  // ═══════════════════════════════════════════════════════════════

  // Flood fill enclosed regions (regions bounded by a color)
  static floodFillEnclosed(grid, boundaryColor, fillColor = 4) {
    const { height, width } = this.dimensions(grid);
    const result = this.copy(grid);

    // Find all cells reachable from edge (not enclosed)
    const reachableFromEdge = this.create(height, width, false);
    const queue = [];

    // Start from all edge cells that are NOT boundary
    for (let i = 0; i < height; i++) {
      if (grid[i][0] !== boundaryColor) queue.push([i, 0]);
      if (grid[i][width - 1] !== boundaryColor) queue.push([i, width - 1]);
    }
    for (let j = 0; j < width; j++) {
      if (grid[0][j] !== boundaryColor) queue.push([0, j]);
      if (grid[height - 1][j] !== boundaryColor) queue.push([height - 1, j]);
    }

    // BFS to mark all cells reachable from edge
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r < 0 || r >= height || c < 0 || c >= width) continue;
      if (reachableFromEdge[r][c] || grid[r][c] === boundaryColor) continue;
      reachableFromEdge[r][c] = true;
      queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
    }

    // Fill cells that are NOT reachable from edge and NOT boundary
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (!reachableFromEdge[i][j] && grid[i][j] !== boundaryColor) {
          result[i][j] = fillColor;
        }
      }
    }

    return result;
  }

  // Draw a cross/plus pattern around each cell of a specific color
  static drawCrossAround(grid, targetColor, crossColor, radius = 1) {
    const { height, width } = this.dimensions(grid);
    const result = this.copy(grid);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[i][j] === targetColor) {
          // Draw cross arms
          for (let d = 1; d <= radius; d++) {
            if (i - d >= 0 && result[i - d][j] === 0) result[i - d][j] = crossColor; // up
            if (i + d < height && result[i + d][j] === 0) result[i + d][j] = crossColor; // down
            if (j - d >= 0 && result[i][j - d] === 0) result[i][j - d] = crossColor; // left
            if (j + d < width && result[i][j + d] === 0) result[i][j + d] = crossColor; // right
          }
        }
      }
    }

    return result;
  }

  // Draw crosses with different colors based on marker color
  static drawCrossWithMapping(grid, colorMap) {
    const { height, width } = this.dimensions(grid);
    const result = this.copy(grid);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const cellColor = grid[i][j];
        if (cellColor !== 0 && colorMap[cellColor]) {
          const crossColor = colorMap[cellColor];
          // Draw cross arms
          if (i - 1 >= 0 && result[i - 1][j] === 0) result[i - 1][j] = crossColor;
          if (i + 1 < height && result[i + 1][j] === 0) result[i + 1][j] = crossColor;
          if (j - 1 >= 0 && result[i][j - 1] === 0) result[i][j - 1] = crossColor;
          if (j + 1 < width && result[i][j + 1] === 0) result[i][j + 1] = crossColor;
        }
      }
    }

    return result;
  }

  // Move object of one color to be adjacent to anchor color
  static moveObjectToAnchor(grid, objectColor, anchorColor) {
    const { height, width } = this.dimensions(grid);

    // Find object bounding box
    let objMinR = height, objMaxR = -1, objMinC = width, objMaxC = -1;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[i][j] === objectColor) {
          objMinR = Math.min(objMinR, i);
          objMaxR = Math.max(objMaxR, i);
          objMinC = Math.min(objMinC, j);
          objMaxC = Math.max(objMaxC, j);
        }
      }
    }

    // Find anchor bounding box
    let ancMinR = height, ancMaxR = -1, ancMinC = width, ancMaxC = -1;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[i][j] === anchorColor) {
          ancMinR = Math.min(ancMinR, i);
          ancMaxR = Math.max(ancMaxR, i);
          ancMinC = Math.min(ancMinC, j);
          ancMaxC = Math.max(ancMaxC, j);
        }
      }
    }

    if (objMaxR < 0 || ancMaxR < 0) return this.copy(grid);

    // Calculate move to place object just above anchor
    const objHeight = objMaxR - objMinR + 1;
    const targetRow = ancMinR - objHeight;
    const deltaR = targetRow - objMinR;
    const deltaC = 0; // Keep horizontal position

    // Create result with object moved
    const result = this.copy(grid);

    // Clear old object position
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[i][j] === objectColor) {
          result[i][j] = 0;
        }
      }
    }

    // Place object at new position
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (grid[i][j] === objectColor) {
          const newR = i + deltaR;
          const newC = j + deltaC;
          if (newR >= 0 && newR < height && newC >= 0 && newC < width) {
            result[newR][newC] = objectColor;
          }
        }
      }
    }

    return result;
  }

  // Scale grid by factor
  static scale(grid, factor) {
    const { height, width } = this.dimensions(grid);
    const result = this.create(height * factor, width * factor, 0);

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

  // Downscale grid by factor (take mode of each block)
  static downscale(grid, factor) {
    const { height, width } = this.dimensions(grid);
    const newHeight = Math.floor(height / factor);
    const newWidth = Math.floor(width / factor);
    const result = this.create(newHeight, newWidth, 0);

    for (let i = 0; i < newHeight; i++) {
      for (let j = 0; j < newWidth; j++) {
        // Find most common non-zero color in block
        const counts = {};
        for (let di = 0; di < factor; di++) {
          for (let dj = 0; dj < factor; dj++) {
            const c = grid[i * factor + di][j * factor + dj];
            if (c !== 0) counts[c] = (counts[c] || 0) + 1;
          }
        }
        let maxCount = 0, maxColor = 0;
        for (const [color, count] of Object.entries(counts)) {
          if (count > maxCount) {
            maxCount = count;
            maxColor = parseInt(color);
          }
        }
        result[i][j] = maxColor;
      }
    }

    return result;
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

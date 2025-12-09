/**
 * PRIMITIVES.JS - Complete Grid Operations Library for ARC
 *
 * Every atomic operation needed to manipulate ARC grids.
 * These are the building blocks for the solver.
 */

class Grid {
  // ═══════════════════════════════════════════════════════════
  // BASIC OPERATIONS
  // ═══════════════════════════════════════════════════════════

  static copy(grid) {
    return grid.map(row => [...row]);
  }

  static create(height, width, fill = 0) {
    return Array(height).fill(null).map(() => Array(width).fill(fill));
  }

  static equals(a, b) {
    if (a.length !== b.length) return false;
    if (a[0]?.length !== b[0]?.length) return false;
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a[0].length; j++) {
        if (a[i][j] !== b[i][j]) return false;
      }
    }
    return true;
  }

  static dimensions(grid) {
    return { height: grid.length, width: grid[0]?.length || 0 };
  }

  // ═══════════════════════════════════════════════════════════
  // GEOMETRIC TRANSFORMS
  // ═══════════════════════════════════════════════════════════

  static rotate(grid, degrees) {
    const h = grid.length;
    const w = grid[0].length;

    if (degrees === 90 || degrees === -270) {
      const result = this.create(w, h);
      for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
          result[j][h - 1 - i] = grid[i][j];
        }
      }
      return result;
    }

    if (degrees === 180 || degrees === -180) {
      const result = this.create(h, w);
      for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
          result[h - 1 - i][w - 1 - j] = grid[i][j];
        }
      }
      return result;
    }

    if (degrees === 270 || degrees === -90) {
      const result = this.create(w, h);
      for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
          result[w - 1 - j][i] = grid[i][j];
        }
      }
      return result;
    }

    return this.copy(grid);
  }

  static flipHorizontal(grid) {
    return grid.map(row => [...row].reverse());
  }

  static flipVertical(grid) {
    return [...grid].reverse().map(row => [...row]);
  }

  static transpose(grid) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.create(w, h);
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        result[j][i] = grid[i][j];
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // SCALING OPERATIONS
  // ═══════════════════════════════════════════════════════════

  static scale(grid, factorY, factorX = factorY) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.create(h * factorY, w * factorX);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        for (let di = 0; di < factorY; di++) {
          for (let dj = 0; dj < factorX; dj++) {
            result[i * factorY + di][j * factorX + dj] = grid[i][j];
          }
        }
      }
    }
    return result;
  }

  static downscale(grid, factorY, factorX = factorY) {
    const h = grid.length;
    const w = grid[0].length;
    const newH = Math.floor(h / factorY);
    const newW = Math.floor(w / factorX);
    const result = this.create(newH, newW);

    for (let i = 0; i < newH; i++) {
      for (let j = 0; j < newW; j++) {
        result[i][j] = grid[i * factorY][j * factorX];
      }
    }
    return result;
  }

  static tile(grid, repeatY, repeatX) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.create(h * repeatY, w * repeatX);

    for (let ti = 0; ti < repeatY; ti++) {
      for (let tj = 0; tj < repeatX; tj++) {
        for (let i = 0; i < h; i++) {
          for (let j = 0; j < w; j++) {
            result[ti * h + i][tj * w + j] = grid[i][j];
          }
        }
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // COLOR OPERATIONS
  // ═══════════════════════════════════════════════════════════

  static replaceColor(grid, from, to) {
    return grid.map(row => row.map(c => c === from ? to : c));
  }

  static swapColors(grid, color1, color2) {
    return grid.map(row => row.map(c => {
      if (c === color1) return color2;
      if (c === color2) return color1;
      return c;
    }));
  }

  static getNonZeroColors(grid) {
    const colors = new Set();
    for (const row of grid) {
      for (const c of row) {
        if (c !== 0) colors.add(c);
      }
    }
    return [...colors].sort((a, b) => a - b);
  }

  static getAllColors(grid) {
    const colors = new Set();
    for (const row of grid) {
      for (const c of row) {
        colors.add(c);
      }
    }
    return [...colors].sort((a, b) => a - b);
  }

  static getColorCount(grid, color) {
    let count = 0;
    for (const row of grid) {
      for (const c of row) {
        if (c === color) count++;
      }
    }
    return count;
  }

  static getMostCommonColor(grid, excludeZero = true) {
    const counts = {};
    for (const row of grid) {
      for (const c of row) {
        if (excludeZero && c === 0) continue;
        counts[c] = (counts[c] || 0) + 1;
      }
    }
    let max = 0, maxColor = excludeZero ? 1 : 0;
    for (const [color, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        maxColor = parseInt(color);
      }
    }
    return maxColor;
  }

  static getLeastCommonColor(grid, excludeZero = true) {
    const counts = {};
    for (const row of grid) {
      for (const c of row) {
        if (excludeZero && c === 0) continue;
        counts[c] = (counts[c] || 0) + 1;
      }
    }
    let min = Infinity, minColor = excludeZero ? 1 : 0;
    for (const [color, count] of Object.entries(counts)) {
      if (count < min) {
        min = count;
        minColor = parseInt(color);
      }
    }
    return minColor;
  }

  // ═══════════════════════════════════════════════════════════
  // EXTRACTION OPERATIONS
  // ═══════════════════════════════════════════════════════════

  static extractBoundingBox(grid, backgroundColor = 0) {
    let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;

    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[0].length; j++) {
        if (grid[i][j] !== backgroundColor) {
          minR = Math.min(minR, i);
          maxR = Math.max(maxR, i);
          minC = Math.min(minC, j);
          maxC = Math.max(maxC, j);
        }
      }
    }

    if (maxR === -1) return [[backgroundColor]];

    const result = [];
    for (let i = minR; i <= maxR; i++) {
      result.push(grid[i].slice(minC, maxC + 1));
    }
    return result;
  }

  static extractRegion(grid, row, col, height, width) {
    const result = [];
    for (let i = 0; i < height; i++) {
      const rowArr = [];
      for (let j = 0; j < width; j++) {
        const r = row + i;
        const c = col + j;
        rowArr.push((r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) ? grid[r][c] : 0);
      }
      result.push(rowArr);
    }
    return result;
  }

  static findObjects(grid, backgroundColor = 0) {
    const h = grid.length;
    const w = grid[0].length;
    const visited = this.create(h, w, false);
    const objects = [];

    const floodFill = (startR, startC) => {
      const cells = [];
      const stack = [[startR, startC]];

      while (stack.length > 0) {
        const [r, c] = stack.pop();
        if (r < 0 || r >= h || c < 0 || c >= w) continue;
        if (visited[r][c]) continue;
        if (grid[r][c] === backgroundColor) continue;

        visited[r][c] = true;
        cells.push({ r, c, color: grid[r][c] });

        stack.push([r-1, c], [r+1, c], [r, c-1], [r, c+1]);
      }
      return cells;
    };

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (!visited[i][j] && grid[i][j] !== backgroundColor) {
          const cells = floodFill(i, j);
          if (cells.length > 0) {
            const minR = Math.min(...cells.map(c => c.r));
            const maxR = Math.max(...cells.map(c => c.r));
            const minC = Math.min(...cells.map(c => c.c));
            const maxC = Math.max(...cells.map(c => c.c));

            const objGrid = this.create(maxR - minR + 1, maxC - minC + 1, backgroundColor);
            for (const cell of cells) {
              objGrid[cell.r - minR][cell.c - minC] = cell.color;
            }

            objects.push({
              grid: objGrid,
              cells,
              bounds: { minR, maxR, minC, maxC },
              size: cells.length
            });
          }
        }
      }
    }

    return objects;
  }

  static extractLargestObject(grid, backgroundColor = 0) {
    const objects = this.findObjects(grid, backgroundColor);
    if (objects.length === 0) return [[backgroundColor]];

    objects.sort((a, b) => b.size - a.size);
    return objects[0].grid;
  }

  static extractSmallestObject(grid, backgroundColor = 0) {
    const objects = this.findObjects(grid, backgroundColor);
    if (objects.length === 0) return [[backgroundColor]];

    objects.sort((a, b) => a.size - b.size);
    return objects[0].grid;
  }

  static extractObjectByColor(grid, color, backgroundColor = 0) {
    const objects = this.findObjects(grid, backgroundColor);
    const colored = objects.filter(o => o.cells.some(c => c.color === color));
    if (colored.length === 0) return [[backgroundColor]];
    return colored[0].grid;
  }

  // ═══════════════════════════════════════════════════════════
  // GRAVITY / MOVEMENT
  // ═══════════════════════════════════════════════════════════

  static gravity(grid, direction, backgroundColor = 0) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.create(h, w, backgroundColor);

    if (direction === 'down') {
      for (let j = 0; j < w; j++) {
        const col = [];
        for (let i = 0; i < h; i++) {
          if (grid[i][j] !== backgroundColor) col.push(grid[i][j]);
        }
        const offset = h - col.length;
        for (let i = 0; i < col.length; i++) {
          result[offset + i][j] = col[i];
        }
      }
    } else if (direction === 'up') {
      for (let j = 0; j < w; j++) {
        const col = [];
        for (let i = 0; i < h; i++) {
          if (grid[i][j] !== backgroundColor) col.push(grid[i][j]);
        }
        for (let i = 0; i < col.length; i++) {
          result[i][j] = col[i];
        }
      }
    } else if (direction === 'left') {
      for (let i = 0; i < h; i++) {
        const row = grid[i].filter(c => c !== backgroundColor);
        for (let j = 0; j < row.length; j++) {
          result[i][j] = row[j];
        }
      }
    } else if (direction === 'right') {
      for (let i = 0; i < h; i++) {
        const row = grid[i].filter(c => c !== backgroundColor);
        const offset = w - row.length;
        for (let j = 0; j < row.length; j++) {
          result[i][offset + j] = row[j];
        }
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // LOGICAL OPERATIONS (for overlays/halves)
  // ═══════════════════════════════════════════════════════════

  static splitHorizontally(grid) {
    const h = grid.length;
    const mid = Math.floor(h / 2);
    const top = grid.slice(0, mid);
    const bottom = grid.slice(h - mid);
    return [top, bottom];
  }

  static splitVertically(grid) {
    const w = grid[0].length;
    const mid = Math.floor(w / 2);
    const left = grid.map(row => row.slice(0, mid));
    const right = grid.map(row => row.slice(w - mid));
    return [left, right];
  }

  static xorGrids(a, b, backgroundColor = 0) {
    const h = Math.min(a.length, b.length);
    const w = Math.min(a[0].length, b[0].length);
    const result = this.create(h, w, backgroundColor);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const va = a[i][j] !== backgroundColor;
        const vb = b[i][j] !== backgroundColor;
        if (va !== vb) {
          result[i][j] = va ? a[i][j] : b[i][j];
        }
      }
    }
    return result;
  }

  static andGrids(a, b, backgroundColor = 0) {
    const h = Math.min(a.length, b.length);
    const w = Math.min(a[0].length, b[0].length);
    const result = this.create(h, w, backgroundColor);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (a[i][j] !== backgroundColor && b[i][j] !== backgroundColor) {
          result[i][j] = a[i][j];
        }
      }
    }
    return result;
  }

  static orGrids(a, b, backgroundColor = 0) {
    const h = Math.min(a.length, b.length);
    const w = Math.min(a[0].length, b[0].length);
    const result = this.create(h, w, backgroundColor);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (a[i][j] !== backgroundColor) {
          result[i][j] = a[i][j];
        } else if (b[i][j] !== backgroundColor) {
          result[i][j] = b[i][j];
        }
      }
    }
    return result;
  }

  static xorHalves(grid) {
    const [left, right] = this.splitVertically(grid);
    return this.xorGrids(left, right);
  }

  static andHalves(grid) {
    const [left, right] = this.splitVertically(grid);
    return this.andGrids(left, right);
  }

  static orHalves(grid) {
    const [left, right] = this.splitVertically(grid);
    return this.orGrids(left, right);
  }

  static xorHalvesH(grid) {
    const [top, bottom] = this.splitHorizontally(grid);
    return this.xorGrids(top, bottom);
  }

  static andHalvesH(grid) {
    const [top, bottom] = this.splitHorizontally(grid);
    return this.andGrids(top, bottom);
  }

  static orHalvesH(grid) {
    const [top, bottom] = this.splitHorizontally(grid);
    return this.orGrids(top, bottom);
  }

  // ═══════════════════════════════════════════════════════════
  // DRAW OPERATIONS (for patterns around objects)
  // ═══════════════════════════════════════════════════════════

  static drawCrossAround(grid, targetColor, drawColor) {
    const result = this.copy(grid);
    const h = grid.length;
    const w = grid[0].length;

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] === targetColor) {
          // Draw cross (up, down, left, right until edge)
          for (let di = i - 1; di >= 0 && result[di][j] === 0; di--) result[di][j] = drawColor;
          for (let di = i + 1; di < h && result[di][j] === 0; di++) result[di][j] = drawColor;
          for (let dj = j - 1; dj >= 0 && result[i][dj] === 0; dj--) result[i][dj] = drawColor;
          for (let dj = j + 1; dj < w && result[i][dj] === 0; dj++) result[i][dj] = drawColor;
        }
      }
    }
    return result;
  }

  static drawDiagonalAround(grid, targetColor, drawColor) {
    const result = this.copy(grid);
    const h = grid.length;
    const w = grid[0].length;

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] === targetColor) {
          // Draw diagonals
          for (let d = 1; i - d >= 0 && j - d >= 0 && result[i-d][j-d] === 0; d++) result[i-d][j-d] = drawColor;
          for (let d = 1; i - d >= 0 && j + d < w && result[i-d][j+d] === 0; d++) result[i-d][j+d] = drawColor;
          for (let d = 1; i + d < h && j - d >= 0 && result[i+d][j-d] === 0; d++) result[i+d][j-d] = drawColor;
          for (let d = 1; i + d < h && j + d < w && result[i+d][j+d] === 0; d++) result[i+d][j+d] = drawColor;
        }
      }
    }
    return result;
  }

  static drawFullCross(grid, targetColor, drawColor) {
    // Cross + diagonal combined
    let result = this.drawCrossAround(grid, targetColor, drawColor);
    result = this.drawDiagonalAround(result, targetColor, drawColor);
    return result;
  }

  static drawBoxAround(grid, targetColor, drawColor, padding = 1) {
    const result = this.copy(grid);
    const h = grid.length;
    const w = grid[0].length;

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] === targetColor) {
          // Draw box around pixel
          for (let di = -padding; di <= padding; di++) {
            for (let dj = -padding; dj <= padding; dj++) {
              if (di === 0 && dj === 0) continue;
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < h && nj >= 0 && nj < w && result[ni][nj] === 0) {
                result[ni][nj] = drawColor;
              }
            }
          }
        }
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // FLOOD FILL OPERATIONS
  // ═══════════════════════════════════════════════════════════

  static floodFill(grid, startR, startC, newColor) {
    const result = this.copy(grid);
    const oldColor = result[startR][startC];
    if (oldColor === newColor) return result;

    const h = grid.length;
    const w = grid[0].length;
    const stack = [[startR, startC]];

    while (stack.length > 0) {
      const [r, c] = stack.pop();
      if (r < 0 || r >= h || c < 0 || c >= w) continue;
      if (result[r][c] !== oldColor) continue;

      result[r][c] = newColor;
      stack.push([r-1, c], [r+1, c], [r, c-1], [r, c+1]);
    }

    return result;
  }

  static floodFillEnclosed(grid, backgroundColor, fillColor) {
    // Fill enclosed regions (regions not touching edges)
    const h = grid.length;
    const w = grid[0].length;
    const result = this.copy(grid);
    const visited = this.create(h, w, false);

    // Mark all background cells connected to edges
    const markEdgeConnected = (startR, startC) => {
      const stack = [[startR, startC]];
      while (stack.length > 0) {
        const [r, c] = stack.pop();
        if (r < 0 || r >= h || c < 0 || c >= w) continue;
        if (visited[r][c]) continue;
        if (result[r][c] !== backgroundColor) continue;

        visited[r][c] = true;
        stack.push([r-1, c], [r+1, c], [r, c-1], [r, c+1]);
      }
    };

    // Start from all edges
    for (let i = 0; i < h; i++) {
      markEdgeConnected(i, 0);
      markEdgeConnected(i, w - 1);
    }
    for (let j = 0; j < w; j++) {
      markEdgeConnected(0, j);
      markEdgeConnected(h - 1, j);
    }

    // Fill non-visited background cells
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (!visited[i][j] && result[i][j] === backgroundColor) {
          result[i][j] = fillColor;
        }
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // PATTERN / SYMMETRY DETECTION
  // ═══════════════════════════════════════════════════════════

  static hasHorizontalSymmetry(grid) {
    const h = grid.length;
    const w = grid[0].length;
    for (let i = 0; i < Math.floor(h / 2); i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] !== grid[h - 1 - i][j]) return false;
      }
    }
    return true;
  }

  static hasVerticalSymmetry(grid) {
    const h = grid.length;
    const w = grid[0].length;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < Math.floor(w / 2); j++) {
        if (grid[i][j] !== grid[i][w - 1 - j]) return false;
      }
    }
    return true;
  }

  static hasPointSymmetry(grid) {
    const h = grid.length;
    const w = grid[0].length;
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] !== grid[h - 1 - i][w - 1 - j]) return false;
      }
    }
    return true;
  }

  static makeSymmetricH(grid) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.copy(grid);
    for (let i = 0; i < Math.floor(h / 2); i++) {
      for (let j = 0; j < w; j++) {
        if (result[h - 1 - i][j] === 0 && result[i][j] !== 0) {
          result[h - 1 - i][j] = result[i][j];
        } else if (result[i][j] === 0 && result[h - 1 - i][j] !== 0) {
          result[i][j] = result[h - 1 - i][j];
        }
      }
    }
    return result;
  }

  static makeSymmetricV(grid) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.copy(grid);
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < Math.floor(w / 2); j++) {
        if (result[i][w - 1 - j] === 0 && result[i][j] !== 0) {
          result[i][w - 1 - j] = result[i][j];
        } else if (result[i][j] === 0 && result[i][w - 1 - j] !== 0) {
          result[i][j] = result[i][w - 1 - j];
        }
      }
    }
    return result;
  }

  static makePointSymmetric(grid) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.copy(grid);
    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        const oi = h - 1 - i;
        const oj = w - 1 - j;
        if (result[oi][oj] === 0 && result[i][j] !== 0) {
          result[oi][oj] = result[i][j];
        } else if (result[i][j] === 0 && result[oi][oj] !== 0) {
          result[i][j] = result[oi][oj];
        }
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // OVERLAY / COMPOSITION
  // ═══════════════════════════════════════════════════════════

  static overlay(base, top, offsetR = 0, offsetC = 0, backgroundColor = 0) {
    const result = this.copy(base);
    for (let i = 0; i < top.length; i++) {
      for (let j = 0; j < top[0].length; j++) {
        const r = i + offsetR;
        const c = j + offsetC;
        if (r >= 0 && r < result.length && c >= 0 && c < result[0].length) {
          if (top[i][j] !== backgroundColor) {
            result[r][c] = top[i][j];
          }
        }
      }
    }
    return result;
  }

  static stackHorizontal(grids) {
    if (grids.length === 0) return [[]];
    const maxH = Math.max(...grids.map(g => g.length));
    const result = [];

    for (let i = 0; i < maxH; i++) {
      let row = [];
      for (const g of grids) {
        if (i < g.length) {
          row = row.concat(g[i]);
        } else {
          row = row.concat(Array(g[0]?.length || 0).fill(0));
        }
      }
      result.push(row);
    }
    return result;
  }

  static stackVertical(grids) {
    if (grids.length === 0) return [[]];
    const maxW = Math.max(...grids.map(g => g[0]?.length || 0));
    const result = [];

    for (const g of grids) {
      for (const row of g) {
        const newRow = [...row];
        while (newRow.length < maxW) newRow.push(0);
        result.push(newRow);
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // GRID PARTITIONING
  // ═══════════════════════════════════════════════════════════

  static splitIntoQuadrants(grid) {
    const h = grid.length;
    const w = grid[0].length;
    const midH = Math.floor(h / 2);
    const midW = Math.floor(w / 2);

    return {
      topLeft: this.extractRegion(grid, 0, 0, midH, midW),
      topRight: this.extractRegion(grid, 0, midW, midH, w - midW),
      bottomLeft: this.extractRegion(grid, midH, 0, h - midH, midW),
      bottomRight: this.extractRegion(grid, midH, midW, h - midH, w - midW)
    };
  }

  static splitByDivider(grid, dividerColor) {
    // Find horizontal or vertical divider and split
    const h = grid.length;
    const w = grid[0].length;

    // Check for horizontal divider
    for (let i = 0; i < h; i++) {
      if (grid[i].every(c => c === dividerColor)) {
        const top = grid.slice(0, i);
        const bottom = grid.slice(i + 1);
        if (top.length > 0 && bottom.length > 0) {
          return { type: 'horizontal', parts: [top, bottom] };
        }
      }
    }

    // Check for vertical divider
    for (let j = 0; j < w; j++) {
      let isDivider = true;
      for (let i = 0; i < h; i++) {
        if (grid[i][j] !== dividerColor) {
          isDivider = false;
          break;
        }
      }
      if (isDivider) {
        const left = grid.map(row => row.slice(0, j));
        const right = grid.map(row => row.slice(j + 1));
        if (left[0].length > 0 && right[0].length > 0) {
          return { type: 'vertical', parts: [left, right] };
        }
      }
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════════════════

  static print(grid, name = '') {
    if (name) console.log(`--- ${name} ---`);
    const colorMap = ['⬛', '🟦', '🟥', '🟩', '🟨', '⬜', '🟪', '🟧', '🩵', '🟫'];
    for (const row of grid) {
      console.log(row.map(c => colorMap[c] || '❓').join(''));
    }
    console.log();
  }

  static toHash(grid) {
    return grid.map(row => row.join(',')).join('|');
  }

  static fromHash(hash) {
    return hash.split('|').map(row => row.split(',').map(Number));
  }

  // ═══════════════════════════════════════════════════════════
  // GRID LINE DETECTION & CELL EXTRACTION
  // ═══════════════════════════════════════════════════════════

  static findGridLines(grid) {
    const h = grid.length;
    const w = grid[0].length;

    // Find horizontal lines (rows where all cells are same color)
    const hLines = [];
    for (let i = 0; i < h; i++) {
      const firstColor = grid[i][0];
      if (grid[i].every(c => c === firstColor)) {
        hLines.push({ row: i, color: firstColor });
      }
    }

    // Find vertical lines (cols where all cells are same color)
    const vLines = [];
    for (let j = 0; j < w; j++) {
      const firstColor = grid[0][j];
      let allSame = true;
      for (let i = 0; i < h; i++) {
        if (grid[i][j] !== firstColor) {
          allSame = false;
          break;
        }
      }
      if (allSame) {
        vLines.push({ col: j, color: firstColor });
      }
    }

    return { hLines, vLines };
  }

  static extractGridCells(grid, gridColor = null) {
    const h = grid.length;
    const w = grid[0].length;

    // Auto-detect grid color if not provided
    if (gridColor === null) {
      const lines = this.findGridLines(grid);
      if (lines.hLines.length > 0) {
        gridColor = lines.hLines[0].color;
      } else if (lines.vLines.length > 0) {
        gridColor = lines.vLines[0].color;
      } else {
        return [{ grid, bounds: { r1: 0, r2: h-1, c1: 0, c2: w-1 }, height: h, width: w }];
      }
    }

    // Find row boundaries (between grid lines)
    const rowBounds = [];
    let start = -1;
    for (let i = 0; i < h; i++) {
      const isGridRow = grid[i].every(c => c === gridColor);
      if (!isGridRow && start === -1) {
        start = i;
      } else if (isGridRow && start !== -1) {
        rowBounds.push([start, i - 1]);
        start = -1;
      }
    }
    if (start !== -1) rowBounds.push([start, h - 1]);

    // Find col boundaries
    const colBounds = [];
    start = -1;
    for (let j = 0; j < w; j++) {
      let isGridCol = true;
      for (let i = 0; i < h; i++) {
        if (grid[i][j] !== gridColor) {
          isGridCol = false;
          break;
        }
      }
      if (!isGridCol && start === -1) {
        start = j;
      } else if (isGridCol && start !== -1) {
        colBounds.push([start, j - 1]);
        start = -1;
      }
    }
    if (start !== -1) colBounds.push([start, w - 1]);

    // Extract cells
    const cells = [];
    for (const [r1, r2] of rowBounds) {
      for (const [c1, c2] of colBounds) {
        const cell = this.extractRegion(grid, r1, c1, r2 - r1 + 1, c2 - c1 + 1);
        cells.push({
          grid: cell,
          bounds: { r1, r2, c1, c2 },
          height: r2 - r1 + 1,
          width: c2 - c1 + 1
        });
      }
    }

    return cells.length > 0 ? cells : [{ grid, bounds: { r1: 0, r2: h-1, c1: 0, c2: w-1 }, height: h, width: w }];
  }

  static findSmallestCell(grid, gridColor = null) {
    const cells = this.extractGridCells(grid, gridColor);
    if (cells.length === 0) return grid;

    let smallest = cells[0];
    for (const cell of cells) {
      if (cell.height * cell.width < smallest.height * smallest.width) {
        smallest = cell;
      }
    }
    return smallest.grid;
  }

  static findLargestCell(grid, gridColor = null) {
    const cells = this.extractGridCells(grid, gridColor);
    if (cells.length === 0) return grid;

    let largest = cells[0];
    for (const cell of cells) {
      if (cell.height * cell.width > largest.height * largest.width) {
        largest = cell;
      }
    }
    return largest.grid;
  }

  static findUniqueCell(grid, gridColor = null) {
    const cells = this.extractGridCells(grid, gridColor);
    if (cells.length <= 1) return cells[0]?.grid || grid;

    // Count each cell pattern
    const patterns = {};
    for (const cell of cells) {
      const hash = this.toHash(cell.grid);
      patterns[hash] = patterns[hash] || { count: 0, cell };
      patterns[hash].count++;
    }

    // Find unique pattern (count = 1)
    for (const [hash, data] of Object.entries(patterns)) {
      if (data.count === 1) {
        return data.cell.grid;
      }
    }

    return this.findSmallestCell(grid, gridColor);
  }

  // ═══════════════════════════════════════════════════════════
  // MORPHOLOGICAL OPERATIONS
  // ═══════════════════════════════════════════════════════════

  static dilate(grid, color = null) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.copy(grid);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] !== 0 && (color === null || grid[i][j] === color)) {
          const c = grid[i][j];
          if (i > 0 && result[i-1][j] === 0) result[i-1][j] = c;
          if (i < h-1 && result[i+1][j] === 0) result[i+1][j] = c;
          if (j > 0 && result[i][j-1] === 0) result[i][j-1] = c;
          if (j < w-1 && result[i][j+1] === 0) result[i][j+1] = c;
        }
      }
    }
    return result;
  }

  static erode(grid, backgroundColor = 0) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.copy(grid);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] !== backgroundColor) {
          const neighbors = [
            i > 0 ? grid[i-1][j] : backgroundColor,
            i < h-1 ? grid[i+1][j] : backgroundColor,
            j > 0 ? grid[i][j-1] : backgroundColor,
            j < w-1 ? grid[i][j+1] : backgroundColor
          ];
          if (neighbors.includes(backgroundColor)) {
            result[i][j] = backgroundColor;
          }
        }
      }
    }
    return result;
  }

  static outline(grid, outlineColor = null, backgroundColor = 0) {
    const h = grid.length;
    const w = grid[0].length;
    const result = this.create(h, w, backgroundColor);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w; j++) {
        if (grid[i][j] !== backgroundColor) {
          const neighbors = [
            i > 0 ? grid[i-1][j] : backgroundColor,
            i < h-1 ? grid[i+1][j] : backgroundColor,
            j > 0 ? grid[i][j-1] : backgroundColor,
            j < w-1 ? grid[i][j+1] : backgroundColor
          ];
          if (neighbors.includes(backgroundColor)) {
            result[i][j] = outlineColor !== null ? outlineColor : grid[i][j];
          }
        }
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════
  // COUNTING & ANALYSIS
  // ═══════════════════════════════════════════════════════════

  static countObjects(grid, backgroundColor = 0) {
    return this.findObjects(grid, backgroundColor).length;
  }

  static getObjectSizes(grid, backgroundColor = 0) {
    return this.findObjects(grid, backgroundColor).map(o => o.size);
  }
}

module.exports = Grid;

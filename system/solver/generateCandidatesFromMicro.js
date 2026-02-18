/**
 * TRINITY Beast Mode Transform Seeding
 * ═══════════════════════════════════════════════════════════════════
 * Enhanced candidate generation with colorReplacement, mirrorSymmetry,
 * and diagonalPatterns handlers for high-impact transforms.
 */

function generateCandidatesFromMicro(state, micro) {
  const grid = state.grid;
  const rule = micro.rule;
  const cand = [];

  // Micro → simple transforms
  const add = (name, fn) => cand.push({ name, apply: fn });

  // Helper: clone grid properly
  const cloneGrid = (g) => g.map(r => r.slice());

  switch (rule) {

    // === NEW: colorReplacement handler ===
    case "colorReplacement":
      // Replace colors within bounding box while preserving shape
      if (micro.features.bbox && micro.features.distinct > 1) {
        const [r0, c0, r1, c1] = micro.features.bbox;
        const colors = new Set();
        for (let r = r0; r <= r1; r++) {
          for (let c = c0; c <= c1; c++) {
            if (grid[r] && grid[r][c] != null) colors.add(grid[r][c]);
          }
        }
        const colorArr = Array.from(colors);

        // Try swapping each pair of colors in the region
        for (let i = 0; i < colorArr.length; i++) {
          for (let j = i + 1; j < colorArr.length; j++) {
            const fromC = colorArr[i], toC = colorArr[j];
            add(`color_swap_${fromC}_${toC}`, s => {
              const g = cloneGrid(s.grid);
              for (let r = 0; r < g.length; r++) {
                for (let c = 0; c < g[0].length; c++) {
                  if (g[r][c] === fromC) g[r][c] = toC;
                  else if (g[r][c] === toC) g[r][c] = fromC;
                }
              }
              return g;
            });
          }
        }

        // Try filling entire bbox with dominant color
        if (micro.features.top) {
          const dominantColor = micro.features.top.value;
          add("bbox_fill_dominant", s => {
            const g = cloneGrid(s.grid);
            for (let r = r0; r <= r1 && r < g.length; r++) {
              for (let c = c0; c <= c1 && c < g[0].length; c++) {
                if (g[r][c] != null && g[r][c] !== 0) g[r][c] = dominantColor;
              }
            }
            return g;
          });
        }

        // Try normalizing all non-bg colors to single color
        for (const targetColor of colorArr.slice(0, 3)) {
          add(`normalize_to_${targetColor}`, s => {
            const g = cloneGrid(s.grid);
            for (let r = 0; r < g.length; r++) {
              for (let c = 0; c < g[0].length; c++) {
                if (g[r][c] != null && g[r][c] !== 0) g[r][c] = targetColor;
              }
            }
            return g;
          });
        }
      }
      break;

    // === NEW: mirrorSymmetry handler ===
    case "mirrorSymmetry":
      const kind = micro.features.kind;

      // Apply detected symmetry type
      if (kind === 'vertical') {
        add("apply_vert_symmetry", s => {
          const g = cloneGrid(s.grid);
          const h = g.length, w = g[0].length;
          for (let r = 0; r < h; r++) {
            for (let c = 0; c < Math.floor(w / 2); c++) {
              // Copy left half to right
              g[r][w - 1 - c] = g[r][c];
            }
          }
          return g;
        });
        add("apply_vert_symmetry_rev", s => {
          const g = cloneGrid(s.grid);
          const h = g.length, w = g[0].length;
          for (let r = 0; r < h; r++) {
            for (let c = 0; c < Math.floor(w / 2); c++) {
              // Copy right half to left
              g[r][c] = g[r][w - 1 - c];
            }
          }
          return g;
        });
      }

      if (kind === 'horizontal') {
        add("apply_horiz_symmetry", s => {
          const g = cloneGrid(s.grid);
          const h = g.length, w = g[0].length;
          for (let r = 0; r < Math.floor(h / 2); r++) {
            for (let c = 0; c < w; c++) {
              // Copy top half to bottom
              g[h - 1 - r][c] = g[r][c];
            }
          }
          return g;
        });
        add("apply_horiz_symmetry_rev", s => {
          const g = cloneGrid(s.grid);
          const h = g.length, w = g[0].length;
          for (let r = 0; r < Math.floor(h / 2); r++) {
            for (let c = 0; c < w; c++) {
              // Copy bottom half to top
              g[r][c] = g[h - 1 - r][c];
            }
          }
          return g;
        });
      }

      // Also try 90° rotation
      add("rotate_90", s => {
        const h = s.grid.length, w = s.grid[0].length;
        const g = Array.from({ length: w }, () => Array(h).fill(0));
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            g[c][h - 1 - r] = s.grid[r][c];
          }
        }
        return g;
      });

      add("rotate_180", s => {
        const g = cloneGrid(s.grid);
        const h = g.length, w = g[0].length;
        for (let r = 0; r < Math.floor(h / 2); r++) {
          for (let c = 0; c < w; c++) {
            const tmp = g[r][c];
            g[r][c] = g[h - 1 - r][w - 1 - c];
            g[h - 1 - r][w - 1 - c] = tmp;
          }
        }
        if (h % 2 === 1) {
          const midR = Math.floor(h / 2);
          for (let c = 0; c < Math.floor(w / 2); c++) {
            const tmp = g[midR][c];
            g[midR][c] = g[midR][w - 1 - c];
            g[midR][w - 1 - c] = tmp;
          }
        }
        return g;
      });

      add("flip_both", s => {
        const g = cloneGrid(s.grid);
        g.reverse();
        for (let r = 0; r < g.length; r++) g[r].reverse();
        return g;
      });
      break;

    // === NEW: diagonalPatterns handler ===
    case "diagonalPatterns":
      const diagCount = micro.features.diagCount || 0;

      // Fill along main diagonal with detected pattern
      add("diag_fill_main", s => {
        const g = cloneGrid(s.grid);
        const h = g.length, w = g[0].length;
        const diagColor = g[0]?.[0] ?? 0;
        for (let i = 0; i < Math.min(h, w); i++) {
          g[i][i] = diagColor;
        }
        return g;
      });

      // Fill anti-diagonal
      add("diag_fill_anti", s => {
        const g = cloneGrid(s.grid);
        const h = g.length, w = g[0].length;
        const diagColor = g[0]?.[w - 1] ?? 0;
        for (let i = 0; i < Math.min(h, w); i++) {
          g[i][w - 1 - i] = diagColor;
        }
        return g;
      });

      // Transpose (swap rows/cols along diagonal)
      add("transpose", s => {
        const h = s.grid.length, w = s.grid[0].length;
        const g = Array.from({ length: w }, () => Array(h).fill(0));
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            g[c][r] = s.grid[r][c];
          }
        }
        return g;
      });

      // Diagonal stripe propagation
      if (diagCount >= 2) {
        add("diag_stripe_extend", s => {
          const g = cloneGrid(s.grid);
          const h = g.length, w = g[0].length;
          for (let r = 1; r < h; r++) {
            for (let c = 1; c < w; c++) {
              if (g[r][c] === 0 || g[r][c] == null) {
                g[r][c] = g[r - 1][c - 1];
              }
            }
          }
          return g;
        });
      }
      break;

    case "singleColorIsolate":
      // Try filling isolated spots with dominant color
      if (micro.features.topVal !== undefined) {
        add("fill_isolates", s => {
          const g = cloneGrid(s.grid);
          for (const iso of micro.features.isolates || []) {
            if (iso.r < g.length && iso.c < g[0].length) {
              g[iso.r][iso.c] = micro.features.topVal;
            }
          }
          return g;
        });

        // Also try removing isolates (set to background)
        add("remove_isolates", s => {
          const g = cloneGrid(s.grid);
          for (const iso of micro.features.isolates || []) {
            if (iso.r < g.length && iso.c < g[0].length) {
              g[iso.r][iso.c] = 0;
            }
          }
          return g;
        });
      }
      break;

    case "boundingBlobs":
      // Try border fill around top blob bounding box
      const top = micro.features.top?.[0];
      if (top) {
        const [r0, c0, r1, c1] = top.bbox;
        add("blob_border_fill", s => {
          const g = cloneGrid(s.grid);
          for (let c = c0; c <= c1 && c < g[0].length; c++) {
            if (r0 < g.length) g[r0][c] = top.value;
            if (r1 < g.length) g[r1][c] = top.value;
          }
          for (let r = r0; r <= r1 && r < g.length; r++) {
            if (c0 < g[0].length) g[r][c0] = top.value;
            if (c1 < g[0].length) g[r][c1] = top.value;
          }
          return g;
        });

        // Extract just the blob region
        add("extract_blob", s => {
          const bh = r1 - r0 + 1, bw = c1 - c0 + 1;
          const g = Array.from({ length: bh }, () => Array(bw).fill(0));
          for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
              if (r < s.grid.length && c < s.grid[0].length) {
                g[r - r0][c - c0] = s.grid[r][c];
              }
            }
          }
          return g;
        });

        // Fill blob interior
        add("blob_interior_fill", s => {
          const g = cloneGrid(s.grid);
          for (let r = r0 + 1; r < r1 && r < g.length; r++) {
            for (let c = c0 + 1; c < c1 && c < g[0].length; c++) {
              g[r][c] = top.value;
            }
          }
          return g;
        });
      }
      break;

    case "runLengthPatterns":
      // try column & row unify
      add("row_simplify", s => {
        const g = cloneGrid(s.grid);
        for (let r = 0; r < g.length; r++) {
          const val = g[r][0];
          for (let c = 0; c < g[0].length; c++) {
            g[r][c] = val;
          }
        }
        return g;
      });
      add("col_simplify", s => {
        const g = cloneGrid(s.grid);
        for (let c = 0; c < g[0].length; c++) {
          const val = g[0][c];
          for (let r = 0; r < g.length; r++) {
            g[r][c] = val;
          }
        }
        return g;
      });
      // Mode-based fill (most common value per row/col)
      add("row_mode_fill", s => {
        const g = cloneGrid(s.grid);
        for (let r = 0; r < g.length; r++) {
          const counts = new Map();
          for (let c = 0; c < g[0].length; c++) {
            counts.set(g[r][c], (counts.get(g[r][c]) || 0) + 1);
          }
          let mode = g[r][0], maxC = 0;
          for (const [v, cnt] of counts) {
            if (cnt > maxC) { mode = v; maxC = cnt; }
          }
          for (let c = 0; c < g[0].length; c++) g[r][c] = mode;
        }
        return g;
      });
      break;

    case "symmetry":
      // mirror grid
      add("mirror_vertical", s => {
        const g = cloneGrid(s.grid);
        const h = g.length, w = g[0].length;
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            g[r][c] = s.grid[r][w - 1 - c];
          }
        }
        return g;
      });
      add("mirror_horizontal", s => {
        const g = cloneGrid(s.grid);
        const h = g.length, w = g[0].length;
        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            g[r][c] = s.grid[h - 1 - r][c];
          }
        }
        return g;
      });
      break;

    case "motionVectors":
      // try shifting dominant colors in common directions
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      dirs.forEach(([dr, dc]) => {
        add(`shift_${dr}_${dc}`, s => {
          const { grid } = s;
          const h = grid.length, w = grid[0].length;
          const g = Array.from({ length: h }, () => Array(w).fill(0));
          for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < h && nc >= 0 && nc < w) g[nr][nc] = grid[r][c];
            }
          }
          return g;
        });
      });

      // Also try flip transforms for motion detection
      add("flip_horizontal", s => {
        const g = cloneGrid(s.grid);
        for (let r = 0; r < g.length; r++) g[r].reverse();
        return g;
      });
      add("flip_vertical", s => {
        const g = cloneGrid(s.grid);
        g.reverse();
        return g;
      });
      break;

    case "repeats":
      // try crop/extend periodic pattern
      for (const hint of micro.features.patternHints || []) {
        add(`tile_${hint.axis}_${hint.period}`, s => {
          const g = cloneGrid(s.grid);
          const h = g.length, w = g[0].length;
          if (hint.axis === 'col') {
            for (let r = 0; r < h; r++) {
              for (let c = 0; c < w; c++) {
                g[r][c] = s.grid[r][c % hint.period];
              }
            }
          } else {
            for (let r = 0; r < h; r++) {
              for (let c = 0; c < w; c++) {
                g[r][c] = s.grid[r % hint.period][c];
              }
            }
          }
          return g;
        });
      }
      break;
  }

  // If no rule triggered — small nudge
  if (cand.length === 0) {
    add("identity_probe", s => cloneGrid(s.grid));
  }

  return cand;
}

module.exports = { generateCandidatesFromMicro };

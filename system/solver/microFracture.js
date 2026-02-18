// system/solver/microFracture.js
// Purpose: aggressively split a grid into independent subproblems (fragments),
// prioritize by solvability, and provide merge helpers.
// Beast-mode defaults: fast heuristics, low overhead.

const { performance } = require('perf_hooks');

function timeNow(){ return performance.now(); }

// Simple util to clone 2D arrays
function cloneGrid(g){
  return g.map(r => r.slice());
}

function dims(grid){ return { h: grid.length, w: grid[0]?.length || 0 }; }

// Quick bounding-box extractor for non-background cells
function findActiveBBox(grid, bgVal = null) {
  const {h,w} = dims(grid);
  let minR = h, minC = w, maxR = -1, maxC = -1;
  for (let r=0;r<h;r++){
    for (let c=0;c<w;c++){
      const v = grid[r][c];
      if (v !== bgVal) {
        minR = Math.min(minR, r);
        minC = Math.min(minC, c);
        maxR = Math.max(maxR, r);
        maxC = Math.max(maxC, c);
      }
    }
  }
  if (maxR < 0) return null;
  return { minR, minC, maxR, maxC };
}

// Connected components - 4-neighbor
function connectedComponents(grid, bgVal = null, maxCount = 64) {
  const {h,w} = dims(grid);
  const seen = Array.from({length:h},()=>Array(w).fill(false));
  const comps = [];
  for (let r=0;r<h;r++){
    for (let c=0;c<w;c++){
      if (seen[r][c]) continue;
      if (grid[r][c] === bgVal) { seen[r][c] = true; continue; }
      // BFS
      const q = [[r,c]];
      seen[r][c] = true;
      const cells = [];
      while(q.length){
        const [cr,cc] = q.pop();
        cells.push([cr,cc]);
        const N = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dr,dc] of N){
          const nr = cr+dr, nc = cc+dc;
          if (nr>=0 && nr<h && nc>=0 && nc<w && !seen[nr][nc] && grid[nr][nc] !== bgVal) {
            seen[nr][nc] = true;
            q.push([nr,nc]);
          }
        }
        if (cells.length > 4000) break; // safety
      }
      comps.push({ size: cells.length, cells });
      if (comps.length >= maxCount) return comps;
    }
  }
  // sort largest-first (so we solve big meaningful bits first in BEAST)
  comps.sort((a,b)=>b.size-a.size);
  return comps;
}

// Build fragment grid from component cells
function buildFragment(grid, comp, pad = 1) {
  const {h,w} = dims(grid);
  let minR = Infinity, minC=Infinity, maxR=-Infinity, maxC=-Infinity;
  for (const [r,c] of comp.cells) {
    minR = Math.min(minR, r); maxR = Math.max(maxR, r);
    minC = Math.min(minC, c); maxC = Math.max(maxC, c);
  }
  minR = Math.max(0, minR - pad); minC = Math.max(0, minC - pad);
  maxR = Math.min(h-1, maxR + pad); maxC = Math.min(w-1, maxC + pad);
  const fh = maxR - minR + 1, fw = maxC - minC + 1;
  const frag = Array.from({length:fh},()=>Array(fw).fill(null));
  for (let r=minR;r<=maxR;r++){
    for (let c=minC;c<=maxC;c++){
      frag[r-minR][c-minC] = grid[r][c];
    }
  }
  return { frag, box: [minR,minC,maxR,maxC] };
}

// Heuristic: solvability score for a fragment (fast)
function fragSolvability(frag) {
  // small fragments with pattern give higher solvability
  const {h,w} = dims(frag);
  let distinct = new Set();
  let edgeActivity = 0;
  for (let r=0;r<h;r++){
    for (let c=0;c<w;c++){
      distinct.add(frag[r][c]);
      if (r===0 || c===0 || r===h-1 || c===w-1) {
        if (frag[r][c] !== null) edgeActivity++;
      }
    }
  }
  const dScore = Math.min(1, distinct.size / Math.max(1, h*w));
  const sizeFactor = 1 / Math.log2(2 + h*w); // prefer smaller-ish slices up to a point
  const edgeFactor = Math.min(1, edgeActivity / Math.max(1, h+w));
  // solvability mixes distinctness, size, and edge clues
  return Math.max(0, Math.min(1, (0.6 * (1 - dScore)) + (0.8 * edgeFactor) + (0.4 * sizeFactor)));
}

// Merge back quick painter: apply fragment grid to outer grid bounding box
function applyFragmentToGrid(baseGrid, frag, box) {
  const [minR,minC] = box;
  const g = cloneGrid(baseGrid);
  for (let r=0;r<frag.length;r++){
    for (let c=0;c<frag[0].length;c++){
      const v = frag[r][c];
      if (v !== null && v !== undefined) g[minR + r][minC + c] = v;
    }
  }
  return g;
}

// Main API
function fracture(grid, opts={bgVal:null, maxFrags:8, pad:1}) {
  const start = timeNow();
  // Handle null background - treat 0 as background for ARC grids
  const bgVal = opts.bgVal !== undefined ? opts.bgVal : 0;

  // 1) fast connected components (non-bg)
  const comps = connectedComponents(grid, bgVal, opts.maxFrags*4);
  const frags = [];
  for (let i=0;i<Math.min(comps.length, opts.maxFrags); i++){
    const comp = comps[i];
    const {frag, box} = buildFragment(grid, comp, opts.pad);
    const solv = fragSolvability(frag);
    frags.push({frag, box, size:comp.size, solvability: solv});
  }
  // sort by solvability descending (beast mode wants solvable fragments first)
  frags.sort((a,b)=>b.solvability - a.solvability);
  const elapsed = Math.round(timeNow() - start);
  return { frags, elapsed, count: frags.length };
}

module.exports = {
  fracture,
  buildFragment,
  applyFragmentToGrid,
  connectedComponents,
  findActiveBBox,
  fragSolvability,
  cloneGrid,
  dims
};

// system/solver/MicroExtract.js
// Beast Mode Micro-Extraction: aggressive, fast atomic rule detection.
// Enhanced with ColorReplacement, MirrorSymmetry, DiagonalPatterns.
// Drop-in replacement for previous MicroExtract.

const { performance } = require('perf_hooks');
function timeNow() { return performance.now(); }

// Grid utilities
function dims(grid) { return { h: grid.length, w: grid[0]?.length || 0 }; }
function getNeighbors(grid, r, c) {
  const D = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  const out = [];
  for (const [dr,dc] of D) {
    const nr = r+dr, nc = c+dc;
    if (nr>=0 && nr<grid.length && nc>=0 && nc<grid[0].length) out.push(grid[nr][nc]);
  }
  return out;
}
function cloneGrid(g){ return g.map(r=>r.slice()); }

function colorHistogram(grid) {
  const hist = new Map();
  for (let r=0;r<grid.length;r++){
    for (let c=0;c<grid[0].length;c++){
      const v = grid[r][c];
      hist.set(v, (hist.get(v)||0)+1);
    }
  }
  return hist;
}

// === New helper: shape similarity between two fragments ===
function shapeSignature(grid) {
  // binary mask of "active" vs background (null/undefined treated as bg)
  const mask = [];
  for (let r=0;r<grid.length;r++){
    const row=[];
    for (let c=0;c<grid[0].length;c++){
      row.push(grid[r][c] == null ? 0 : 1);
    }
    mask.push(row);
  }
  // compress into string for quick compare
  return mask.map(row => row.join('')).join('|');
}

// === New helper: check approximate rotation/reflection equivalence ===
function equivalentByTransform(A, B) {
  // A and B same dims
  const h = A.length, w = A[0].length;
  const eq = (G1, G2) => {
    for (let r=0;r<h;r++) for (let c=0;c<w;c++) if ((G1[r][c] == null ? null : G1[r][c]) !== (G2[r][c] == null ? null : G2[r][c])) return false;
    return true;
  };
  // generate transforms of A: original, rot90, rot180, rot270, flipH, flipV
  function rot90(G){
    const H = Array.from({length:w},()=>Array(h).fill(null));
    for (let r=0;r<h;r++) for (let c=0;c<w;c++) H[c][h-1-r] = G[r][c];
    return H;
  }
  function flipH(G){
    const H = cloneGrid(G);
    for (let r=0;r<h;r++) H[r] = H[r].slice().reverse();
    return H;
  }
  function flipV(G){
    const H = cloneGrid(G);
    H.reverse();
    return H;
  }
  if (eq(A,B)) return true;
  if (eq(rot90(A),B)) return true;
  if (eq(rot90(rot90(A)),B)) return true;
  if (eq(rot90(rot90(rot90(A))),B)) return true;
  if (eq(flipH(A),B)) return true;
  if (eq(flipV(A),B)) return true;
  return false;
}

// === Detectors (fast, sampled) ===
const detectors = {
  singleColorIsolate(grid) {
    const hist = colorHistogram(grid);
    const entries = Array.from(hist.entries()).sort((a,b)=>b[1]-a[1]);
    const [topVal, topCount] = entries[0] || [null,0];
    const total = grid.length*grid[0].length;
    const dominance = topCount/total;
    const isolates = [];
    for (let r=0;r<grid.length;r++){
      for (let c=0;c<grid[0].length;c++){
        const v = grid[r][c];
        const n = getNeighbors(grid,r,c);
        if (n.length && !(n.every(x => x===v)) && hist.get(v) < Math.max(6, total*0.02)) {
          isolates.push({r,c,v});
        }
      }
    }
    return {
      name:'singleColorIsolate',
      score: Math.min(1, dominance + isolates.length*0.02),
      data:{topVal, dominance, isolatesCount: isolates.length, isolates: isolates.slice(0,6)}
    };
  },

  boundingBlobs(grid) {
    const {h,w} = dims(grid);
    const seen = Array.from({length:h},()=>Array(w).fill(false));
    const blobs = [];
    for (let r=0;r<h;r++){
      for (let c=0;c<w;c++){
        if (seen[r][c]) continue;
        const V = grid[r][c];
        const q = [[r,c]];
        seen[r][c]=true;
        let minR=r,maxR=r,minC=c,maxC=c, size=0;
        while(q.length){
          const [cr,cc] = q.pop();
          size++;
          minR = Math.min(minR,cr); maxR=Math.max(maxR,cr);
          minC = Math.min(minC,cc); maxC=Math.max(maxC,cc);
          const N = [[1,0],[-1,0],[0,1],[0,-1]];
          for (const [dr,dc] of N){
            const nr=cr+dr,nc=cc+dc;
            if (nr>=0 && nr<h && nc>=0 && nc<w && !seen[nr][nc] && grid[nr][nc]===V){
              seen[nr][nc]=true; q.push([nr,nc]);
            }
          }
        }
        blobs.push({value:V, size, bbox:[minR,minC,maxR,maxC]});
      }
    }
    blobs.sort((a,b)=>b.size-a.size);
    const top = blobs.slice(0,6);
    const score = Math.min(1, top[0]?.size / (h*w) || 0);
    return { name:'boundingBlobs', score, data:{top} };
  },

  runLengthPatterns(grid) {
    const {h,w} = dims(grid);
    let rowStrong=0, colStrong=0;
    for (let r=0;r<h;r++){
      const row = grid[r];
      let runs = 1;
      for (let i=1;i<w;i++){ if (row[i]!==row[i-1]) runs++; }
      if (runs <= Math.max(2, w*0.15)) rowStrong++;
    }
    for (let c=0;c<w;c++){
      let runs = 1;
      for (let r=1;r<h;r++){ if (grid[r][c] !== grid[r-1][c]) runs++; }
      if (runs <= Math.max(2, h*0.15)) colStrong++;
    }
    const score = Math.min(1, (rowStrong/h + colStrong/w)/2);
    return { name:'runLengthPatterns', score, data:{rowStrong,colStrong} };
  },

  symmetry(grid) {
    const {h,w} = dims(grid);
    let horiz=0, vert=0, sample=0;
    const stepR = Math.max(1, Math.floor(h/8));
    const stepC = Math.max(1, Math.floor(w/8));
    for (let r=0;r<h;r+=stepR){
      for (let c=0;c<w;c+=stepC){
        sample++;
        if (grid[r][c] === grid[r][w-1-c]) vert++;
        if (grid[r][c] === grid[h-1-r][c]) horiz++;
      }
    }
    const vertScore = vert/sample, horizScore = horiz/sample;
    return { name:'symmetry', score: Math.max(vertScore,horizScore), data:{vert:vertScore,horiz:horizScore} };
  },

  motionVectors(grid, prev) {
    if (!prev) return { name:'motionVectors', score:0, data:{} };
    const {h,w} = dims(grid);
    let matches=0, total=0;
    const stepR = Math.max(1, Math.floor(h/6));
    const stepC = Math.max(1, Math.floor(w/6));
    for (let r=0;r<h;r+=stepR){
      for (let c=0;c<w;c+=stepC){
        total++;
        const v = grid[r][c];
        let found=false;
        for (let dr=-2;dr<=2 && !found;dr++){
          for (let dc=-2;dc<=2 && !found;dc++){
            const pr=r+dr, pc=c+dc;
            if (pr>=0 && pr<h && pc>=0 && pc<w && prev[pr][pc]===v) { found=true; }
          }
        }
        if (found) matches++;
      }
    }
    const score = matches/Math.max(1,total);
    return { name:'motionVectors', score, data:{score} };
  },

  repeats(grid) {
    const {h,w} = dims(grid);
    const patternHints = [];
    for (let period=2; period<=Math.min(6,w); period++){
      let ok=true;
      for (let r=0;r<h && ok;r++){
        for (let c=0;c<w-period;c++){
          if (grid[r][c] !== grid[r][c+period]) { ok=false; break; }
        }
      }
      if (ok) patternHints.push({axis:'col',period});
    }
    for (let period=2; period<=Math.min(6,h); period++){
      let ok=true;
      for (let c=0;c<w && ok;c++){
        for (let r=0;r<h-period;r++){
          if (grid[r][c] !== grid[r+period][c]) { ok=false; break; }
        }
      }
      if (ok) patternHints.push({axis:'row',period});
    }
    const score = Math.min(1, patternHints.length*0.5);
    return { name:'repeats', score, data:{patternHints} };
  },

  // === NEW: colorReplacement detector ===
  colorReplacement(grid) {
    // Try to detect when shapes/masks match but colors differ (simple heuristic)
    // Build signature by mapping each non-null cell to 1, null to 0
    const sig = shapeSignature(grid);
    // For local Beast speed: sample small rotated/flipped variants against color-variant groups
    // We'll detect "consistent mask islands but multiple colors" via bounding blobs and color hist
    const blobs = detectors.boundingBlobs(grid);
    const top = blobs.data && blobs.data.top ? blobs.data.top[0] : null;
    if (!top) return { name:'colorReplacement', score:0, data:{} };
    const { bbox } = top;
    const [r0,c0,r1,c1] = bbox;
    const sub = [];
    for (let r=r0;r<=r1;r++){
      const row=[];
      for (let c=c0;c<=c1;c++) row.push(grid[r][c]);
      sub.push(row);
    }
    // compute unique color count vs mask count
    const hist = colorHistogram(sub);
    const distinct = hist.size;
    // mask density
    let maskCount=0, total=sub.length*sub[0].length;
    for (let r=0;r<sub.length;r++) for (let c=0;c<sub[0].length;c++) if (sub[r][c] != null) maskCount++;
    const maskDensity = maskCount/Math.max(1,total);
    // If mask density high and distinct colors >1 but shape consistent, we score
    const score = Math.min(1, (maskDensity * 0.8) * (distinct > 1 ? Math.min(1, distinct/4) : 0));
    return { name:'colorReplacement', score, data:{bbox, distinct, maskDensity, top} };
  },

  // === NEW: mirrorSymmetry detector (explicit) ===
  mirrorSymmetry(grid) {
    // sample for exact or near-exact mirror along v/h axes
    const {h,w} = dims(grid);
    // build small centered crop to test
    const sampleH = Math.min(h, 8), sampleW = Math.min(w, 8);
    const r0 = Math.floor((h - sampleH)/2), c0 = Math.floor((w - sampleW)/2);
    const crop = [];
    for (let r=r0;r<r0+sampleH;r++){
      const row=[];
      for (let c=c0;c<c0+sampleW;c++){
        row.push(grid[r][c]);
      }
      crop.push(row);
    }
    // check vertical and horizontal mirror similarity (with color-agnostic mask)
    const maskEq = (A,B)=>{
      const hh=A.length, ww=A[0].length;
      for (let r=0;r<hh;r++) for (let c=0;c<ww;c++){
        const a = A[r][c] != null ? 1 : 0;
        const b = B[r][c] != null ? 1 : 0;
        if (a!==b) return false;
      }
      return true;
    };
    // build flipped versions
    const flipH = (G)=>G.map(row=>row.slice().reverse());
    const flipV = (G)=>G.slice().reverse();
    const vert = maskEq(crop, flipH(crop));
    const horiz = maskEq(crop, flipV(crop));
    const score = Math.max(vert ? 0.9 : 0, horiz ? 0.9 : 0);
    const kind = vert ? 'vertical' : (horiz ? 'horizontal' : null);
    return { name:'mirrorSymmetry', score, data:{kind} };
  },

  // === NEW: diagonalPatterns detector ===
  diagonalPatterns(grid) {
    const {h,w} = dims(grid);
    // quick detection of consistent diagonals: sample main diagonals for repeated color runs
    let diagCount=0, tested=0;
    for (let start=-Math.floor(h/2); start<=Math.floor(w/2); start++){
      tested++;
      let prev=null, consistent=true, count=0;
      for (let r=0;r<h;r++){
        const c = r + start;
        if (c<0||c>=w) continue;
        const v = grid[r][c];
        if (v == null) { consistent=false; break; }
        if (prev === null) prev = v; else { if (v !== prev) { consistent=false; break; } }
        count++;
      }
      if (consistent && count>=2) diagCount++;
      if (tested>8) break;
    }
    const score = Math.min(1, diagCount/4);
    return { name:'diagonalPatterns', score, data:{diagCount} };
  }
};

// MicroExtract analyze function
function analyze(grid, opts={prevGrid:null, mode:'BEAST'}) {
  const start = timeNow();
  const results = [];
  try {
    // core detectors: keep order tuned for payoff
    results.push(detectors.colorReplacement(grid));      // high payoff
    results.push(detectors.singleColorIsolate(grid));
    results.push(detectors.boundingBlobs(grid));
    results.push(detectors.runLengthPatterns(grid));
    results.push(detectors.symmetry(grid));
    results.push(detectors.mirrorSymmetry(grid));       // explicit mirror
    results.push(detectors.diagonalPatterns(grid));     // diagonal detection
    results.push(detectors.motionVectors(grid, opts.prevGrid));
    results.push(detectors.repeats(grid));
  } catch(err) {
    console.error("[MICROEXTRACT ERR]", err);
  }

  // choose best by score
  let best = { name:'none', score:0, data:{} };
  for (const r of results){
    if (!r) continue;
    const s = r.score || 0;
    if (s > best.score) best = r;
  }

  // BEAST mode small-boost heuristics
  if (opts.mode === 'BEAST' && best.score < 0.18) {
    const iso = results.find(x=>x.name==='singleColorIsolate');
    if (iso && iso.data && iso.data.isolatesCount>0) {
      best = { name: iso.name, score: Math.min(0.35, 0.02*iso.data.isolatesCount + iso.score), data: iso.data };
    }
  }

  const elapsed = Math.max(1, Math.round(timeNow() - start));
  return {
    rule: best.name,
    confidence: Math.min(1,best.score),
    features: best.data,
    isPredictive: best.score >= 0.12 || (opts.mode==='BEAST' && best.score>0.05),
    detectorsRun: results.map(r=>({name:r.name,score:r.score})),
    elapsed
  };
}

module.exports = { analyze };

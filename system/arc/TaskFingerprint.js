/**
 * TaskFingerprint.js
 * V3.5 – Memory Distillation
 * ═══════════════════════════════════════════════════════════════════
 * Generates unique fingerprints/signatures for ARC tasks based on
 * structural, color, and spatial properties for memory matching.
 */

/**
 * Generate a fingerprint for a task based on its training pairs
 * @param {Array<{input: number[][], output: number[][]}>} trainPairs
 * @returns {Object} - Fingerprint object
 */
function generateFingerprint(trainPairs) {
  if (!trainPairs || trainPairs.length === 0) {
    return { hash: 'empty', features: {} };
  }

  const features = {
    // Structural features
    inputDims: [],
    outputDims: [],
    dimChanges: [],

    // Color features
    inputColors: [],
    outputColors: [],
    colorChanges: [],

    // Relationship features
    sizeRatios: [],
    colorMappings: [],

    // Pattern features
    symmetry: [],
    density: []
  };

  for (const { input, output } of trainPairs) {
    // Dimensions
    const inH = input?.length || 0;
    const inW = input?.[0]?.length || 0;
    const outH = output?.length || 0;
    const outW = output?.[0]?.length || 0;

    features.inputDims.push(`${inH}x${inW}`);
    features.outputDims.push(`${outH}x${outW}`);

    // Dimension change type
    if (outH === inH && outW === inW) {
      features.dimChanges.push('same');
    } else if (outH === inH * 2 && outW === inW * 2) {
      features.dimChanges.push('scale2x');
    } else if (outH === inW && outW === inH) {
      features.dimChanges.push('transpose');
    } else if (outH > inH || outW > inW) {
      features.dimChanges.push('expand');
    } else {
      features.dimChanges.push('shrink');
    }

    // Size ratios
    const ratio = (outH * outW) / Math.max(1, inH * inW);
    features.sizeRatios.push(ratio.toFixed(2));

    // Colors
    const inColors = countColors(input);
    const outColors = countColors(output);
    features.inputColors.push(inColors.count);
    features.outputColors.push(outColors.count);

    // Color change pattern
    if (outColors.count === inColors.count) {
      features.colorChanges.push('preserve');
    } else if (outColors.count > inColors.count) {
      features.colorChanges.push('add');
    } else {
      features.colorChanges.push('reduce');
    }

    // Color mapping detection
    const mapping = detectColorMapping(input, output);
    if (mapping) {
      features.colorMappings.push(mapping);
    }

    // Symmetry detection
    features.symmetry.push(detectSymmetryType(input, output));

    // Density (non-zero cells ratio)
    const inDensity = inColors.nonZero / Math.max(1, inH * inW);
    const outDensity = outColors.nonZero / Math.max(1, outH * outW);
    features.density.push({
      input: inDensity.toFixed(2),
      output: outDensity.toFixed(2),
      change: (outDensity - inDensity).toFixed(2)
    });
  }

  // Generate hash from key features
  const hashParts = [
    features.dimChanges.join(','),
    features.colorChanges.join(','),
    features.symmetry.join(','),
    features.sizeRatios.join(',')
  ];

  const hash = simpleHash(hashParts.join('|'));

  return {
    hash,
    features,
    pairCount: trainPairs.length,
    timestamp: Date.now()
  };
}

/**
 * Count colors in a grid
 */
function countColors(grid) {
  if (!grid || !grid.length) return { count: 0, nonZero: 0, histogram: {} };

  const histogram = {};
  let nonZero = 0;

  for (const row of grid) {
    for (const cell of row) {
      histogram[cell] = (histogram[cell] || 0) + 1;
      if (cell !== 0) nonZero++;
    }
  }

  return {
    count: Object.keys(histogram).length,
    nonZero,
    histogram
  };
}

/**
 * Detect color mapping between input and output
 */
function detectColorMapping(input, output) {
  if (!input || !output) return null;
  if (input.length !== output.length) return null;

  const mappings = new Map();
  let consistent = true;

  for (let r = 0; r < input.length && consistent; r++) {
    if (!input[r] || !output[r]) continue;
    if (input[r].length !== output[r].length) return null;

    for (let c = 0; c < input[r].length && consistent; c++) {
      const inVal = input[r][c];
      const outVal = output[r][c];

      if (mappings.has(inVal)) {
        if (mappings.get(inVal) !== outVal) {
          consistent = false;
        }
      } else {
        mappings.set(inVal, outVal);
      }
    }
  }

  if (!consistent) return null;

  // Check if it's a meaningful mapping (not identity)
  let hasChange = false;
  for (const [from, to] of mappings) {
    if (from !== to) {
      hasChange = true;
      break;
    }
  }

  if (!hasChange) return 'identity';

  // Encode mapping
  const mapStr = [...mappings.entries()]
    .filter(([f, t]) => f !== t)
    .map(([f, t]) => `${f}→${t}`)
    .join(',');

  return mapStr || 'identity';
}

/**
 * Detect symmetry relationship between input and output
 */
function detectSymmetryType(input, output) {
  if (!input || !output) return 'none';

  const inH = input.length, inW = input[0]?.length || 0;
  const outH = output.length, outW = output[0]?.length || 0;

  // Check for flip horizontal
  if (inH === outH && inW === outW) {
    let isFlipH = true, isFlipV = true, isRot180 = true;

    for (let r = 0; r < inH && (isFlipH || isFlipV || isRot180); r++) {
      for (let c = 0; c < inW && (isFlipH || isFlipV || isRot180); c++) {
        if (input[r][c] !== output[r][inW - 1 - c]) isFlipH = false;
        if (input[r][c] !== output[inH - 1 - r][c]) isFlipV = false;
        if (input[r][c] !== output[inH - 1 - r][inW - 1 - c]) isRot180 = false;
      }
    }

    if (isFlipH) return 'flipH';
    if (isFlipV) return 'flipV';
    if (isRot180) return 'rot180';
  }

  // Check for transpose/rotate90
  if (inH === outW && inW === outH) {
    let isRot90 = true, isRot270 = true;

    for (let r = 0; r < inH && (isRot90 || isRot270); r++) {
      for (let c = 0; c < inW && (isRot90 || isRot270); c++) {
        if (input[r][c] !== output[c][inH - 1 - r]) isRot90 = false;
        if (input[r][c] !== output[inW - 1 - c][r]) isRot270 = false;
      }
    }

    if (isRot90) return 'rot90';
    if (isRot270) return 'rot270';
  }

  return 'none';
}

/**
 * Simple hash function for fingerprint
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Calculate similarity between two fingerprints
 * @param {Object} fp1 - First fingerprint
 * @param {Object} fp2 - Second fingerprint
 * @returns {number} - Similarity score 0-1
 */
function fingerprintSimilarity(fp1, fp2) {
  if (!fp1 || !fp2) return 0;
  if (fp1.hash === fp2.hash) return 1.0;

  let score = 0;
  let total = 0;

  // Compare dim changes
  const dc1 = fp1.features?.dimChanges || [];
  const dc2 = fp2.features?.dimChanges || [];
  if (dc1.length > 0 && dc2.length > 0) {
    total++;
    if (dc1[0] === dc2[0]) score++;
  }

  // Compare color changes
  const cc1 = fp1.features?.colorChanges || [];
  const cc2 = fp2.features?.colorChanges || [];
  if (cc1.length > 0 && cc2.length > 0) {
    total++;
    if (cc1[0] === cc2[0]) score++;
  }

  // Compare symmetry
  const sym1 = fp1.features?.symmetry || [];
  const sym2 = fp2.features?.symmetry || [];
  if (sym1.length > 0 && sym2.length > 0) {
    total++;
    if (sym1[0] === sym2[0]) score++;
  }

  // Compare size ratios
  const sr1 = fp1.features?.sizeRatios || [];
  const sr2 = fp2.features?.sizeRatios || [];
  if (sr1.length > 0 && sr2.length > 0) {
    total++;
    if (sr1[0] === sr2[0]) score++;
  }

  return total > 0 ? score / total : 0;
}

module.exports = {
  generateFingerprint,
  fingerprintSimilarity,
  countColors,
  detectColorMapping,
  detectSymmetryType,
  simpleHash
};

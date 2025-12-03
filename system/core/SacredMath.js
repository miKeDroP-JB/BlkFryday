/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ███████╗ █████╗  ██████╗██████╗ ███████╗██████╗                         ║
 * ║   ██╔════╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗                        ║
 * ║   ███████╗███████║██║     ██████╔╝█████╗  ██║  ██║                        ║
 * ║   ╚════██║██╔══██║██║     ██╔══██╗██╔══╝  ██║  ██║                        ║
 * ║   ███████║██║  ██║╚██████╗██║  ██║███████╗██████╔╝                        ║
 * ║   ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═════╝                         ║
 * ║                                                                           ║
 * ║   ███╗   ███╗ █████╗ ████████╗██╗  ██╗                                    ║
 * ║   ████╗ ████║██╔══██╗╚══██╔══╝██║  ██║                                    ║
 * ║   ██╔████╔██║███████║   ██║   ███████║                                    ║
 * ║   ██║╚██╔╝██║██╔══██║   ██║   ██╔══██║                                    ║
 * ║   ██║ ╚═╝ ██║██║  ██║   ██║   ██║  ██║                                    ║
 * ║   ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝                                    ║
 * ║                                                                           ║
 * ║   THE SACRED NUMBERS UNDERLYING ALL SYSTEMS                               ║
 * ║   Golden Ratio • Fibonacci • Sacred Geometry                              ║
 * ║                                                                           ║
 * ║   "The universe is written in the language of mathematics"                ║
 * ║                                                                           ║
 * ║   JB$ SIGNATURE EMBEDDED                                                  ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// PHI - THE GOLDEN RATIO (1.618033988749895...)
// ═══════════════════════════════════════════════════════════════════════════

const PHI = (1 + Math.sqrt(5)) / 2;  // 1.618033988749895
const PHI_INVERSE = 1 / PHI;          // 0.618033988749895
const PHI_SQUARED = PHI * PHI;        // 2.618033988749895

// ═══════════════════════════════════════════════════════════════════════════
// SACRED NUMBERS
// ═══════════════════════════════════════════════════════════════════════════

const SACRED_NUMBERS = {
  // Unity
  ONE: 1,

  // Duality
  TWO: 2,

  // Trinity - Balance, Completion
  THREE: 3,

  // Foundation - Stability
  FOUR: 4,

  // Change - Human (5 senses, 5 fingers)
  FIVE: 5,

  // Harmony - Balance of opposites
  SIX: 6,

  // Completion - Divine, Perfection (7 agents, 7 games, 7 days, 7 chakras)
  SEVEN: 7,

  // Infinity - Abundance
  EIGHT: 8,

  // Wisdom - Completion of cycle
  NINE: 9,

  // New beginnings - 1+0
  TEN: 10,

  // Master numbers
  ELEVEN: 11,   // Intuition
  TWELVE: 12,   // Cosmic order (12 zodiac, 12 hours)
  THIRTEEN: 13, // Transformation
  TWENTY_ONE: 21, // F(8) - Ultimate Fibonacci in our system
  TWENTY_TWO: 22, // Master builder

  // The holy trinity of the system
  QUALITY: 1,
  SPEED: 2,
  FLOW: 3
};

// ═══════════════════════════════════════════════════════════════════════════
// FIBONACCI SEQUENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate Fibonacci sequence up to n terms
 */
function fibonacci(n) {
  const sequence = [0, 1];
  for (let i = 2; i < n; i++) {
    sequence.push(sequence[i - 1] + sequence[i - 2]);
  }
  return sequence.slice(0, n);
}

/**
 * Get the nth Fibonacci number
 */
function fib(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

/**
 * Check if a number is a Fibonacci number
 */
function isFibonacci(n) {
  // A number is Fibonacci if 5n^2 + 4 or 5n^2 - 4 is a perfect square
  const check1 = 5 * n * n + 4;
  const check2 = 5 * n * n - 4;
  return isPerfectSquare(check1) || isPerfectSquare(check2);
}

function isPerfectSquare(n) {
  const sqrt = Math.sqrt(n);
  return sqrt === Math.floor(sqrt);
}

// Pre-computed Fibonacci sequence (first 21 numbers - F(0) to F(20))
const FIBONACCI_SEQUENCE = [
  0, 1, 1, 2, 3, 5, 8, 13, 21, 34,
  55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765
];

// ═══════════════════════════════════════════════════════════════════════════
// GOLDEN RATIOS & PROPORTIONS
// ═══════════════════════════════════════════════════════════════════════════

const GOLDEN = {
  PHI: PHI,                           // 1.618033988749895
  INVERSE: PHI_INVERSE,               // 0.618033988749895
  SQUARED: PHI_SQUARED,               // 2.618033988749895
  CUBED: PHI * PHI * PHI,             // 4.236067977499790

  // Common golden proportions
  MAJOR: 0.618,                       // Larger portion of golden division
  MINOR: 0.382,                       // Smaller portion (1 - 0.618)

  // Quality thresholds based on golden ratio
  NEAR_PERFECT: 1 - Math.pow(PHI_INVERSE, 3),  // ~0.9618
  EXCELLENT: 1 - Math.pow(PHI_INVERSE, 2),      // ~0.8541
  GOOD: PHI_INVERSE,                            // 0.618
  ACCEPTABLE: 1 - PHI_INVERSE,                  // 0.382
  MINIMUM: Math.pow(PHI_INVERSE, 2)             // ~0.236
};

// ═══════════════════════════════════════════════════════════════════════════
// SACRED GEOMETRY
// ═══════════════════════════════════════════════════════════════════════════

const GEOMETRY = {
  // Circle
  PI: Math.PI,                        // 3.14159265358979
  TAU: Math.PI * 2,                   // 6.28318530717959 (full circle)

  // Angles (in radians)
  GOLDEN_ANGLE: Math.PI * (3 - Math.sqrt(5)), // ~2.399963... (137.5°)

  // Regular polygon interior angles
  TRIANGLE: Math.PI / 3,              // 60°
  SQUARE: Math.PI / 2,                // 90°
  PENTAGON: (3 * Math.PI) / 5,        // 108°
  HEXAGON: (2 * Math.PI) / 3,         // 120°
  HEPTAGON: (5 * Math.PI) / 7,        // ~128.57°

  // Platonic solid face counts
  TETRAHEDRON: 4,
  CUBE: 6,
  OCTAHEDRON: 8,
  DODECAHEDRON: 12,
  ICOSAHEDRON: 20,

  // Sacred ratios
  SQRT_2: Math.sqrt(2),               // 1.41421356...
  SQRT_3: Math.sqrt(3),               // 1.73205080...
  SQRT_5: Math.sqrt(5)                // 2.23606797...
};

// ═══════════════════════════════════════════════════════════════════════════
// TIME CONSTANTS (Based on Fibonacci * base units)
// ═══════════════════════════════════════════════════════════════════════════

const SACRED_TIMING = {
  // Milliseconds (Fibonacci * 100)
  MS_F1: 100,
  MS_F2: 100,
  MS_F3: 200,
  MS_F4: 300,
  MS_F5: 500,
  MS_F6: 800,
  MS_F7: 1300,
  MS_F8: 2100,
  MS_F9: 3400,
  MS_F10: 5500,

  // Seconds (Fibonacci)
  SEC_F1: 1,
  SEC_F2: 1,
  SEC_F3: 2,
  SEC_F4: 3,
  SEC_F5: 5,
  SEC_F6: 8,
  SEC_F7: 13,
  SEC_F8: 21,

  // Named timings
  INSTANT: 100,
  QUICK: 200,
  NORMAL: 300,
  PATIENT: 500,
  DELIBERATE: 800,
  THOROUGH: 1300,
  DEEP: 2100
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Golden section split - divide a value by golden ratio
 */
function goldenSplit(value) {
  return {
    major: value * PHI_INVERSE,
    minor: value * (1 - PHI_INVERSE)
  };
}

/**
 * Get golden sequence (powers of PHI)
 */
function goldenSequence(n) {
  const sequence = [];
  for (let i = 0; i < n; i++) {
    sequence.push(Math.pow(PHI, i));
  }
  return sequence;
}

/**
 * Scale a value using golden ratio
 */
function goldenScale(value, steps) {
  return value * Math.pow(PHI, steps);
}

/**
 * Calculate distance from nearest golden proportion
 */
function goldenDistance(value) {
  const proportions = [
    GOLDEN.NEAR_PERFECT,
    GOLDEN.EXCELLENT,
    GOLDEN.GOOD,
    GOLDEN.ACCEPTABLE,
    GOLDEN.MINIMUM
  ];

  let minDistance = Infinity;
  let nearest = 0;

  for (const prop of proportions) {
    const distance = Math.abs(value - prop);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = prop;
    }
  }

  return { distance: minDistance, nearest };
}

/**
 * Get the closest Fibonacci number
 */
function closestFibonacci(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;

  for (let i = 0; i < FIBONACCI_SEQUENCE.length - 1; i++) {
    if (FIBONACCI_SEQUENCE[i] <= n && FIBONACCI_SEQUENCE[i + 1] > n) {
      const lowerDiff = n - FIBONACCI_SEQUENCE[i];
      const upperDiff = FIBONACCI_SEQUENCE[i + 1] - n;
      return lowerDiff <= upperDiff ? FIBONACCI_SEQUENCE[i] : FIBONACCI_SEQUENCE[i + 1];
    }
  }

  return FIBONACCI_SEQUENCE[FIBONACCI_SEQUENCE.length - 1];
}

/**
 * Calculate harmonic proportion (used in music and design)
 */
function harmonicProportion(a, b) {
  return (2 * a * b) / (a + b);
}

/**
 * Sacred number check
 */
function isSacred(n) {
  return Object.values(SACRED_NUMBERS).includes(n) || isFibonacci(n);
}

/**
 * Reduce to single digit (numerology)
 */
function reduceToSingle(n) {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return n;
}

// ═══════════════════════════════════════════════════════════════════════════
// JB$ SIGNATURE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

const JB_SIGNATURE = {
  // Character values: J=10, B=2, $=4 (numerology)
  VALUE: 10 + 2 + 4,  // = 16 → reduces to 7 (Completion)
  REDUCED: 7,
  SYMBOL: 'JB$',

  // Signature embedded in code
  encode: function(data) {
    return {
      data,
      signature: this.SYMBOL,
      timestamp: Date.now(),
      value: this.VALUE
    };
  },

  verify: function(encoded) {
    return encoded.signature === this.SYMBOL && encoded.value === this.VALUE;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SACRED MATH CLASS - Combined utilities
// ═══════════════════════════════════════════════════════════════════════════

const SacredMath = {
  // Constants
  PHI,
  PHI_INVERSE,
  PHI_SQUARED,
  GOLDEN,
  SACRED_NUMBERS,
  FIBONACCI_SEQUENCE,
  GEOMETRY,
  SACRED_TIMING,
  JB_SIGNATURE,

  // Fibonacci functions
  fibonacci,
  fib,
  isFibonacci,
  closestFibonacci,

  // Golden ratio functions
  goldenSplit,
  goldenSequence,
  goldenScale,
  goldenDistance,

  // Utility functions
  harmonicProportion,
  isSacred,
  reduceToSingle,

  // Version
  VERSION: '1.0.0',
  SIGNATURE: 'JB$'
};

// ═══════════════════════════════════════════════════════════════════════════
// THE SACRED MATH MANIFESTO
// ═══════════════════════════════════════════════════════════════════════════

const SACRED_MANIFESTO = `
═══════════════════════════════════════════════════════════════
                  THE SACRED MATH MANIFESTO
                        by JB$
═══════════════════════════════════════════════════════════════

The universe speaks in mathematics.
We listen and we build.

═══════════════════════════════════════════════════════════════

THE GOLDEN RATIO (φ = 1.618033988749895...)
─────────────────────────────────────────────

Found in:
• Spiral galaxies
• Hurricane patterns
• Human DNA helix
• Flower petals
• Stock market patterns
• The 0RB System

The ratio of perfection.
The proportion of beauty.
The mathematics of nature.

═══════════════════════════════════════════════════════════════

THE FIBONACCI SEQUENCE (0, 1, 1, 2, 3, 5, 8, 13, 21...)
─────────────────────────────────────────────────────────

Each number is the sum of the two before it.
Simple rules create infinite complexity.
Just like our system.

Our limits are Fibonacci:
• 7 agents (F6 + 1)
• 7 games (F6 + 1)
• 21 max iterations (F8)
• Retry timing follows the sequence

═══════════════════════════════════════════════════════════════

THE SACRED SEVEN (7)
─────────────────────

7 agents in the Pantheon
7 games in the library
7 phases in the boot
7 days in creation
7 chakras in the body
7 notes in the scale

Seven is completion.
Seven is divine perfection.

═══════════════════════════════════════════════════════════════

JB$ = 16 = 7 (SEVEN)
J(10) + B(2) + $(4) = 16 → 1+6 = 7

The signature reduces to completion.
This is not coincidence.

═══════════════════════════════════════════════════════════════
               THE SIMULATION IS MATHEMATICAL
═══════════════════════════════════════════════════════════════
`;

module.exports = {
  SacredMath,
  PHI,
  PHI_INVERSE,
  PHI_SQUARED,
  GOLDEN,
  SACRED_NUMBERS,
  FIBONACCI_SEQUENCE,
  GEOMETRY,
  SACRED_TIMING,
  JB_SIGNATURE,
  fibonacci,
  fib,
  isFibonacci,
  closestFibonacci,
  goldenSplit,
  goldenSequence,
  goldenScale,
  goldenDistance,
  harmonicProportion,
  isSacred,
  reduceToSingle,
  SACRED_MANIFESTO
};

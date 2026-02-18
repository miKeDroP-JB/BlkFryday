#!/usr/bin/env node
// ============================================================
//  MEMORY RESET - Clear accumulated state for fresh learning
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// State files to reset
const STATE_FILES = [
  'forge/forge-state.json',
  'quantum/quantum-state.json',
  'v11/quantum-state.json',
  'knowledge-store/knowledge.json'
];

// Empty state templates
const EMPTY_STATES = {
  'forge/forge-state.json': {
    timestamp: Date.now(),
    stats: { filesProcessed: 0, patternsExtracted: 0, atomicUnits: 0, trainingIterations: 0 },
    memoryStats: { positions: 0, totalItems: 0, entanglements: 0, globalPatterns: 0 },
    loopResults: null,
    reset: true
  },
  'quantum/quantum-state.json': {
    states: {},
    crystals: {},
    volatile: {},
    timestamp: Date.now()
  },
  'v11/quantum-state.json': {
    states: {},
    crystals: {},
    volatile: {},
    timestamp: Date.now()
  },
  'knowledge-store/knowledge.json': {
    entries: [],
    index: {},
    timestamp: Date.now()
  }
};

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🧹 MEMORY RESET                           ║
║                                                              ║
║        Clear accumulated patterns for fresh learning         ║
╚══════════════════════════════════════════════════════════════╝
`);

// Check current state
console.log('📊 Current Memory State:\n');

let totalItems = 0;
for (const file of STATE_FILES) {
  const filePath = path.join(DATA_DIR, file);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const items = data.memoryStats?.totalItems ||
                   Object.keys(data.states || {}).length ||
                   (data.entries || []).length || 0;
      totalItems += items;
      console.log(`   ${file}: ${items.toLocaleString()} items`);
    } catch (e) {
      console.log(`   ${file}: (parse error)`);
    }
  } else {
    console.log(`   ${file}: (not found)`);
  }
}

console.log(`\n   Total: ${totalItems.toLocaleString()} accumulated items\n`);

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (dryRun) {
  console.log('🔍 DRY RUN - No changes will be made\n');
}

if (!force && !dryRun) {
  console.log('⚠️  This will clear all learned patterns!');
  console.log('   Use --force to confirm, or --dry-run to preview\n');
  process.exit(0);
}

// Reset files
console.log('🧹 Resetting state files...\n');

for (const file of STATE_FILES) {
  const filePath = path.join(DATA_DIR, file);
  const emptyState = EMPTY_STATES[file];

  if (emptyState && !dryRun) {
    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(emptyState, null, 2));
    console.log(`   ✓ Reset: ${file}`);
  } else if (dryRun) {
    console.log(`   [would reset] ${file}`);
  }
}

if (!dryRun) {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ✅ MEMORY CLEARED                         ║
║                                                              ║
║        System ready for fresh learning cycle                 ║
║        Run: npm run train                                    ║
╚══════════════════════════════════════════════════════════════╝
`);
}

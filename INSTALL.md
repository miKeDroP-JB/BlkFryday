# ORBOS V11.5 - Installation from External HD

## Quick Install

```bash
# 1. Mount your external drive
sudo mount /dev/sdX1 /mnt/external  # Replace sdX1 with your drive

# 2. Copy the repo
cp -r /mnt/external/BlkFryday ~/BlkFryday

# 3. Enter directory
cd ~/BlkFryday

# 4. Install Node.js dependencies
npm install  # or: yarn install

# 5. Install Python dependencies
pip install -r requirements.txt  # if exists, or:
pip install numpy  # minimal deps for reasoning-grimoire

# 6. Verify installation
node system/relationship-intelligence/test.js
python3 reasoning-grimoire/reasoning_grimoire.py
```

## Full Setup

### Prerequisites

| Component | Version | Check Command |
|-----------|---------|---------------|
| Node.js | 18+ | `node --version` |
| Python | 3.10+ | `python3 --version` |
| Git | 2.x | `git --version` |

### Step-by-Step

```bash
# ══════════════════════════════════════════════════════════════
# STEP 1: MOUNT EXTERNAL DRIVE
# ══════════════════════════════════════════════════════════════

# Find your drive
lsblk
# or
sudo fdisk -l

# Create mount point (if needed)
sudo mkdir -p /mnt/external

# Mount (replace sdX1 with your partition)
sudo mount /dev/sdX1 /mnt/external

# For NTFS drives:
sudo mount -t ntfs-3g /dev/sdX1 /mnt/external

# For exFAT drives:
sudo mount -t exfat /dev/sdX1 /mnt/external

# ══════════════════════════════════════════════════════════════
# STEP 2: COPY REPOSITORY
# ══════════════════════════════════════════════════════════════

# Option A: Copy entire folder
cp -r /mnt/external/BlkFryday ~/BlkFryday

# Option B: If it's a git repo on the drive
cd /mnt/external/BlkFryday
git clone . ~/BlkFryday

# ══════════════════════════════════════════════════════════════
# STEP 3: INSTALL DEPENDENCIES
# ══════════════════════════════════════════════════════════════

cd ~/BlkFryday

# Node.js (for Relationship Intelligence System)
npm install

# Python (for Reasoning Grimoire)
pip3 install numpy

# ══════════════════════════════════════════════════════════════
# STEP 4: VERIFY INSTALLATION
# ══════════════════════════════════════════════════════════════

# Run all tests
node system/relationship-intelligence/test.js
python3 reasoning-grimoire/reasoning_grimoire.py

# Run benchmarks
node system/relationship-intelligence/bench.js
node benchmark/quicktest.js
```

## Directory Structure

```
BlkFryday/
├── system/
│   └── relationship-intelligence/   # Phase 10: RIS
│       ├── index.js                 # Main API
│       ├── schema.js                # User schema
│       ├── persist-engine.js        # Storage
│       ├── capture-engine.js        # Signal capture
│       ├── process-engine.js        # Pattern recognition
│       ├── surface-engine.js        # Context injection
│       ├── evolve-engine.js         # Learning/Trust/Resonance
│       ├── transfer-engine.js       # Avatar handoffs
│       ├── test.js                  # Test suite (28 tests)
│       └── bench.js                 # Benchmark
├── reasoning-grimoire/              # Phase 9: Reasoning
│   ├── reasoning_grimoire.py        # Core reasoning
│   ├── emoji_grimoire.py            # Atomic compression
│   ├── flowsync_evolver.py          # Self-improvement
│   ├── orb_core.py                  # Integration
│   ├── enhanced_tournament.py       # Tournament + Grimoire
│   └── launch_reasoning_engine.py   # AGI loop launcher
├── benchmark/
│   └── quicktest.js                 # AGI adjacency benchmark
└── training/                        # Training state
```

## Usage Examples

### Relationship Intelligence System

```javascript
const { RelationshipIntelligenceSystem } = require('./system/relationship-intelligence');

const ris = new RelationshipIntelligenceSystem({
  storage: 'file',
  storagePath: './data/relationships'
});

// Start session
const session = await ris.startSession('user123', 'SOLO');

// Process messages
await ris.processMessage(session.session_id, 'I prefer concise responses');

// Get context for prompts
const context = await ris.getContext('user123', { avatar: 'SOLO' });

// End session
await ris.endSession(session.session_id);
```

### Reasoning Grimoire

```python
from reasoning_grimoire import ReasoningGrimoire

grimoire = ReasoningGrimoire()

# Learn from debate
grimoire.learn_from_tournament(debate_data)

# Transfer to new problem
result = grimoire.transfer("Design a new feature...")
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Permission denied` mounting | Use `sudo` or check drive permissions |
| `Module not found` | Run `npm install` or `pip install` |
| Drive not detected | Check USB connection, try different port |
| Read-only mount | Remount with `-o rw` flag |

## Platform-Specific

### macOS
```bash
# Drives auto-mount to /Volumes/
cp -r /Volumes/YourDrive/BlkFryday ~/BlkFryday
```

### Windows (WSL)
```bash
# Access Windows drives via /mnt/
cp -r /mnt/d/BlkFryday ~/BlkFryday
```

### Linux
```bash
# Standard mount
sudo mount /dev/sdX1 /mnt/external
cp -r /mnt/external/BlkFryday ~/BlkFryday
```

---

**ORBOS V11.5** | Phase 9: Reasoning Grimoire | Phase 10: Relationship Intelligence

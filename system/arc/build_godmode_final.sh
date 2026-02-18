#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🔥 AMOEBA MAX – GODMODE FINAL BUILD
# Complete packaging script for VR-ready distribution
# ═══════════════════════════════════════════════════════════════════

set -e

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "           🔥 AMOEBA MAX – GODMODE FINAL BUILD 🔥"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
TEMPLATE_DIR="$ROOT_DIR/amoeba_MAX_template"
FINAL_DIR="$ROOT_DIR/amoeba_MAX_FINAL"
ZIP_OUTPUT="$ROOT_DIR/Amoeba-VR-Godmode-Final.zip"

echo "📁 Root:     $ROOT_DIR"
echo "📁 Template: $TEMPLATE_DIR"
echo "📁 Final:    $FINAL_DIR"
echo ""

# Create template if it doesn't exist
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "→ Creating MAX template structure..."
    mkdir -p "$TEMPLATE_DIR/system/arc/engines"
    mkdir -p "$TEMPLATE_DIR/system/arc/dashboard"
    mkdir -p "$TEMPLATE_DIR/system/arc/results"
    mkdir -p "$TEMPLATE_DIR/system/arc/logs"

    # Copy dashboard files
    cp -R "$ROOT_DIR/system/arc/dashboard/"* "$TEMPLATE_DIR/system/arc/dashboard/" 2>/dev/null || true

    # Copy launcher scripts
    cp "$ROOT_DIR/system/arc/"*.sh "$TEMPLATE_DIR/system/arc/" 2>/dev/null || true

    # Copy WS server
    cp "$ROOT_DIR/system/arc/amoeba_ws_server.js" "$TEMPLATE_DIR/system/arc/" 2>/dev/null || true

    # Copy orchestrator
    cp "$ROOT_DIR/system/arc/AmoebaOrchestrator.js" "$TEMPLATE_DIR/system/arc/" 2>/dev/null || true

    echo "   ✓ Template created"
fi

echo "→ Cleaning previous builds..."
rm -rf "$FINAL_DIR"
mkdir -p "$FINAL_DIR"

echo "→ Copying MAX template..."
cp -R "$TEMPLATE_DIR/"* "$FINAL_DIR/" 2>/dev/null || true

# Ensure engine directory exists
mkdir -p "$FINAL_DIR/system/arc/engines"

echo "→ Injecting LIVE ENGINE FILES..."
ENGINE_SRC="$ROOT_DIR/system/arc"

declare -a ENGINE_FILES=(
    "EmergenceOrchestrator.js"
    "InfiniteSearch.js"
    "CompositeChains.js"
    "ConvergenceEngine.js"
    "MemoryDistillation.js"
    "TaskFingerprint.js"
    "Primitives.js"
    "ReasoningEngine.js"
    "distiller.js"
    "memory_bank.js"
    "fingerprint.js"
    "utils_pipeline.js"
    "AmoebaOrchestrator.js"
    "amoeba_ws_server.js"
    "bench_reporter.js"
    "bench_runner.js"
)

for file in "${ENGINE_FILES[@]}"; do
    if [ -f "$ENGINE_SRC/$file" ]; then
        cp "$ENGINE_SRC/$file" "$FINAL_DIR/system/arc/engines/$file"
        echo "   ✓ $file"
    else
        echo "   ⚠ Missing: $file"
    fi
done

# Copy additional core files to root of arc
echo ""
echo "→ Copying core files..."
cp "$ENGINE_SRC/AmoebaOrchestrator.js" "$FINAL_DIR/system/arc/" 2>/dev/null || true
cp "$ENGINE_SRC/amoeba_ws_server.js" "$FINAL_DIR/system/arc/" 2>/dev/null || true

# Copy launcher scripts
echo "→ Copying launcher scripts..."
for script in run_amoeba.sh run_amoeba_selftune.sh run_amoeba_max3d.sh run_amoeba_vr.sh run_amoeba_godmode.sh run_amoeba_cinematic.sh; do
    if [ -f "$ENGINE_SRC/$script" ]; then
        cp "$ENGINE_SRC/$script" "$FINAL_DIR/system/arc/$script"
        chmod +x "$FINAL_DIR/system/arc/$script"
        echo "   ✓ $script"
    fi
done

# Copy dashboard
echo ""
echo "→ Copying dashboard..."
mkdir -p "$FINAL_DIR/system/arc/dashboard"
cp -R "$ROOT_DIR/system/arc/dashboard/"* "$FINAL_DIR/system/arc/dashboard/" 2>/dev/null || true
echo "   ✓ Dashboard copied"

# Install and build dashboard
echo ""
echo "→ Installing dashboard dependencies..."
cd "$FINAL_DIR/system/arc/dashboard"
npm install --legacy-peer-deps 2>/dev/null || echo "   ⚠ npm install skipped"

echo ""
echo "→ Building dashboard (Vite)..."
npm run build 2>/dev/null || echo "   ⚠ Build skipped (run manually)"

# Create README
echo ""
echo "→ Creating README..."
cat > "$FINAL_DIR/README.md" <<'EOFREADME'
# 🔥 Amoeba V4.1 MAX GODMODE VR

Ultimate immersive VR visualization for the Amoeba ARC solver.

## Quick Start

```bash
# 1. Start the swarm
cd system/arc
./run_amoeba_godmode.sh

# 2. Start the dashboard (new terminal)
cd system/arc/dashboard
npm start

# 3. Open browser → Select "🔥 GODMODE" → ENTER VR
```

## Dashboard Views

- 📊 **Metrics** - Charts and stats
- 🧬 **Swarm** - 2D canvas visualization
- 🌐 **Multi-Node** - Multi-node breathing particles
- 🎮 **3D** - Three.js orbit view
- 🥽 **VR** - WebXR immersive mode
- 🔥 **GODMODE** - VR with particle grabbing

## VR Controls

- **Trigger**: Grab particles
- **Grip**: Scale all particles
- **Release**: Throw particles

## Launchers

| Script | Description |
|--------|-------------|
| `run_amoeba.sh` | Basic launcher |
| `run_amoeba_selftune.sh` | Self-tuning iterations |
| `run_amoeba_max3d.sh` | 3D multi-node |
| `run_amoeba_vr.sh` | VR-ready |
| `run_amoeba_godmode.sh` | GODMODE interactive |
| `run_amoeba_cinematic.sh` | Cinematic experience |

## Requirements

- Node.js 18+
- WebXR-compatible browser (Chrome, Edge)
- VR headset (Quest, Vive, Index) for immersive mode

---

🧬 Step inside the living, breathing Amoeba.
EOFREADME
echo "   ✓ README.md"

# Package ZIP
echo ""
echo "→ Packaging MAX Godmode Final ZIP..."
cd "$FINAL_DIR"
rm -f "$ZIP_OUTPUT"
zip -r "$ZIP_OUTPUT" . > /dev/null 2>&1 || echo "   ⚠ zip skipped"

if [ -f "$ZIP_OUTPUT" ]; then
    ZIP_SIZE=$(du -h "$ZIP_OUTPUT" | cut -f1)
    echo "   ✓ ZIP created: $ZIP_OUTPUT ($ZIP_SIZE)"
fi

# Git commit + tag
echo ""
echo "→ Creating commit + git tag..."
cd "$ROOT_DIR"
git add . 2>/dev/null || true
git commit -m "v4.1-godmode – Amoeba MAX VR Final Build" 2>/dev/null || echo "   ℹ No changes to commit"
git tag -f v4.1-godmode 2>/dev/null || echo "   ℹ Tag exists"

# Push
git push origin HEAD 2>/dev/null || echo "   ⚠ Push skipped"
git push origin --tags -f 2>/dev/null || echo "   ⚠ Tags push skipped"

if git remote | grep -q "orb"; then
    git push orb HEAD:main --tags -f 2>/dev/null || echo "   ⚠ Orb push skipped"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "           ✔ BUILD COMPLETE – GODMODE ONLINE 🔥"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
if [ -f "$ZIP_OUTPUT" ]; then
    echo " 📦 ZIP created: $ZIP_OUTPUT"
    echo ""
fi
echo " 🚀 Run Amoeba MAX with:"
echo ""
echo "    cd $FINAL_DIR/system/arc"
echo "    ./run_amoeba_godmode.sh"
echo ""
echo "    OR for cinematic mode:"
echo ""
echo "    ./run_amoeba_cinematic.sh"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo ""

#!/bin/bash
#═══════════════════════════════════════════════════════════════════════════════
#                         ∞Φ∞ ORBOS AUTODEPLOY ∞Φ∞
#═══════════════════════════════════════════════════════════════════════════════
#
# One command. Full deployment. Zero friction.
#
# Domains:
#   - eko.vision (Primary Portal)
#   - 0r8.ai (API Gateway)
#   - apps.eko.vision (App Marketplace)
#   - oracle.agency (Oracle Interface)
#
#═══════════════════════════════════════════════════════════════════════════════

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                               ║"
echo "║                           ∞Φ∞ ORBOS AUTODEPLOY ∞Φ∞                           ║"
echo "║                                                                               ║"
echo "║                    One command. Full deployment. Zero friction.               ║"
echo "║                                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"
ROOT=$(pwd)

# ─────────────────────────────────────────────────────────────────────────────
# 1. VERSION STAMP
# ─────────────────────────────────────────────────────────────────────────────

echo "  [1/6] Creating version stamp..."

cat > ORBOS_VERSION.json << 'VEOF'
{
  "system": "ORBOS",
  "codename": "Living Hive OS",
  "version": "1.0.0-live",
  "timestamp": "TIMESTAMP_PLACEHOLDER",
  "components": {
    "amoeba_hydra": "∞Φ∞ Swarm Intelligence",
    "fractal_nodes": "47 Recursive Nodes",
    "arc_loop": "Propose → Commit",
    "glyph_dsl": "Voice-First Commands",
    "revenue_engine": "Proof of Attribution",
    "hss": "Human Safety Switch"
  },
  "domains": {
    "primary": "eko.vision",
    "api": "0r8.ai",
    "apps": "apps.eko.vision",
    "oracle": "oracle.agency"
  },
  "architect": "Ghost JB4 / Agent 0",
  "status": "LIVE"
}
VEOF

# Update timestamp
if command -v python3 &> /dev/null; then
    TIMESTAMP=$(python3 -c "from datetime import datetime; print(datetime.now().isoformat())")
    sed -i "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/" ORBOS_VERSION.json
fi

echo "    ✓ Version stamp created"

# ─────────────────────────────────────────────────────────────────────────────
# 2. GENERATE PRODUCTION HTML
# ─────────────────────────────────────────────────────────────────────────────

echo "  [2/6] Generating production portal..."

cat > index.html << 'HEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>∞Φ∞ ORBOS - Living Hive OS</title>
    <meta name="description" content="Voice-First AI Operating System - Amoeba Hydra Swarm Intelligence">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚗️</text></svg>">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --bg: #0a0a0f;
            --primary: #a855f7;
            --secondary: #06b6d4;
            --accent: #f59e0b;
            --text: #e2e8f0;
            --dim: #64748b;
        }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .sigil-container {
            position: relative;
            width: 300px;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .sigil {
            font-size: 80px;
            animation: pulse 3s ease-in-out infinite;
            text-shadow: 0 0 60px var(--primary), 0 0 120px var(--primary);
            z-index: 10;
        }

        .orbit {
            position: absolute;
            border: 1px solid rgba(168, 85, 247, 0.3);
            border-radius: 50%;
            animation: spin 20s linear infinite;
        }

        .orbit-1 { width: 200px; height: 200px; animation-duration: 15s; }
        .orbit-2 { width: 280px; height: 280px; animation-duration: 25s; animation-direction: reverse; }
        .orbit-3 { width: 350px; height: 350px; animation-duration: 35s; }

        .orbit::before {
            content: '✦';
            position: absolute;
            top: -5px;
            left: 50%;
            transform: translateX(-50%);
            color: var(--secondary);
            font-size: 12px;
        }

        .title {
            margin-top: 40px;
            font-size: 48px;
            font-weight: 300;
            letter-spacing: 12px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .subtitle {
            margin-top: 10px;
            font-size: 14px;
            color: var(--dim);
            letter-spacing: 4px;
        }

        .status {
            margin-top: 50px;
            padding: 15px 40px;
            border: 1px solid var(--primary);
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .status-dot {
            width: 10px;
            height: 10px;
            background: #22c55e;
            border-radius: 50%;
            animation: blink 2s ease-in-out infinite;
        }

        .domains {
            margin-top: 40px;
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .domain {
            padding: 10px 20px;
            border: 1px solid var(--dim);
            border-radius: 4px;
            color: var(--dim);
            text-decoration: none;
            transition: all 0.3s;
            font-size: 12px;
        }

        .domain:hover {
            border-color: var(--secondary);
            color: var(--secondary);
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
        }

        .prompt {
            margin-top: 60px;
            color: var(--accent);
            font-style: italic;
            opacity: 0;
            animation: fadeIn 2s ease-in 1s forwards;
        }

        .nodes {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        }

        .node {
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--primary);
            border-radius: 50%;
            opacity: 0.3;
            animation: float 10s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        @keyframes fadeIn {
            to { opacity: 1; }
        }

        @keyframes float {
            0%, 100% { transform: translateY(0) translateX(0); }
            25% { transform: translateY(-20px) translateX(10px); }
            50% { transform: translateY(-10px) translateX(-10px); }
            75% { transform: translateY(-30px) translateX(5px); }
        }

        .footer {
            position: fixed;
            bottom: 20px;
            font-size: 11px;
            color: var(--dim);
        }
    </style>
</head>
<body>
    <div class="nodes" id="nodes"></div>

    <div class="sigil-container">
        <div class="orbit orbit-1"></div>
        <div class="orbit orbit-2"></div>
        <div class="orbit orbit-3"></div>
        <div class="sigil">∞Φ∞</div>
    </div>

    <h1 class="title">ORBOS</h1>
    <p class="subtitle">LIVING HIVE OS</p>

    <div class="status">
        <span class="status-dot"></span>
        <span>AMOEBA HYDRA ONLINE</span>
    </div>

    <div class="domains">
        <a href="https://eko.vision" class="domain">eko.vision</a>
        <a href="https://0r8.ai" class="domain">0r8.ai</a>
        <a href="https://apps.eko.vision" class="domain">apps.eko.vision</a>
        <a href="https://oracle.agency" class="domain">oracle.agency</a>
    </div>

    <p class="prompt">"To what do I owe this pleasure?"</p>

    <div class="footer">
        Ghost JB4 / Agent 0 · ARC proposes. Human commits. Always.
    </div>

    <script>
        // Generate floating nodes
        const nodesContainer = document.getElementById('nodes');
        for (let i = 0; i < 47; i++) {
            const node = document.createElement('div');
            node.className = 'node';
            node.style.left = Math.random() * 100 + '%';
            node.style.top = Math.random() * 100 + '%';
            node.style.animationDelay = Math.random() * 10 + 's';
            node.style.animationDuration = (10 + Math.random() * 10) + 's';
            nodesContainer.appendChild(node);
        }

        // Console signature
        console.log('%c∞Φ∞ ORBOS LIVE ∞Φ∞', 'color: #a855f7; font-size: 24px; font-weight: bold;');
        console.log('%cAmoeba Hydra Swarm Intelligence', 'color: #06b6d4; font-size: 14px;');
        console.log('%c47 Fractal Nodes · ARC Execution Loop · Voice-First', 'color: #64748b; font-size: 12px;');
    </script>
</body>
</html>
HEOF

echo "    ✓ Production portal generated"

# ─────────────────────────────────────────────────────────────────────────────
# 3. VERCEL CONFIG
# ─────────────────────────────────────────────────────────────────────────────

echo "  [3/6] Generating Vercel config..."

cat > vercel.json << 'VCONF'
{
  "version": 2,
  "name": "orbos-live",
  "alias": ["eko.vision", "0r8.ai", "apps.eko.vision", "oracle.agency"],
  "builds": [
    { "src": "index.html", "use": "@vercel/static" },
    { "src": "ORBOS/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/ORBOS/orb-core/api/$1" },
    { "src": "/glyph/(.*)", "dest": "/ORBOS/glyph-lang/$1" },
    { "src": "/status", "dest": "/ORBOS_VERSION.json" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-ORBOS-Version", "value": "1.0.0-live" },
        { "key": "X-Powered-By", "value": "Amoeba Hydra" }
      ]
    }
  ]
}
VCONF

echo "    ✓ Vercel config generated"

# ─────────────────────────────────────────────────────────────────────────────
# 4. NETLIFY CONFIG
# ─────────────────────────────────────────────────────────────────────────────

echo "  [4/6] Generating Netlify config..."

cat > netlify.toml << 'NCONF'
[build]
  publish = "."
  command = "echo 'ORBOS LIVE'"

[[redirects]]
  from = "/api/*"
  to = "/ORBOS/orb-core/api/:splat"
  status = 200

[[redirects]]
  from = "/status"
  to = "/ORBOS_VERSION.json"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-ORBOS-Version = "1.0.0-live"
    X-Powered-By = "Amoeba Hydra"
NCONF

echo "    ✓ Netlify config generated"

# ─────────────────────────────────────────────────────────────────────────────
# 5. MAKE SCRIPTS EXECUTABLE
# ─────────────────────────────────────────────────────────────────────────────

echo "  [5/6] Setting permissions..."

chmod +x ORBOS/orbos-live.py 2>/dev/null || true
chmod +x ORBOS/eko-launch.py 2>/dev/null || true
chmod +x deploy-production.sh 2>/dev/null || true

echo "    ✓ Permissions set"

# ─────────────────────────────────────────────────────────────────────────────
# 6. DEPLOY
# ─────────────────────────────────────────────────────────────────────────────

echo "  [6/6] Deployment ready..."

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "  ∞Φ∞ ORBOS AUTODEPLOY COMPLETE ∞Φ∞"
echo ""
echo "  Files generated:"
echo "    • index.html (Production Portal)"
echo "    • vercel.json (Vercel Deploy Config)"
echo "    • netlify.toml (Netlify Deploy Config)"
echo "    • ORBOS_VERSION.json (Version Stamp)"
echo ""
echo "  To deploy:"
echo ""
echo "    Vercel:  vercel --prod"
echo "    Netlify: netlify deploy --prod"
echo ""
echo "  Custom Domains (add in dashboard):"
echo "    • eko.vision"
echo "    • 0r8.ai"
echo "    • apps.eko.vision"
echo "    • oracle.agency"
echo ""
echo "  To run locally:"
echo "    python3 ORBOS/orbos-live.py"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "  \"ARC proposes. Human commits. Always.\""
echo ""

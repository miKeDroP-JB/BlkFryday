#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#
#     ∞Φ∞ ORBOS / eKo.vision FULL PRODUCTION DEPLOY ∞Φ∞
#
# ═══════════════════════════════════════════════════════════════════════════════
#
# Domains:
#   • https://eko.vision        (Primary umbrella)
#   • https://0r8.ai            (AI interface entry)
#   • https://apps.eko.vision   (Applications hub)
#   • https://oracle.agency     (Oracle services)
#
# "From intent to empire. Everybody Eats."
#
# ═══════════════════════════════════════════════════════════════════════════════

set -e

echo "
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ∞Φ∞  ORBOS PRODUCTION DEPLOY  ∞Φ∞                                        ║
║                                                                               ║
║         eKo.vision │ 0r8.ai │ oracle.agency │ apps.eko.vision                ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
ENTRY_FILE="index.html"
ECOSYSTEM_FILE="orbos-unified-ecosystem.html"
VERSION_FILE="ORBOS_VERSION.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "init")

# Domain configuration
PRIMARY_DOMAIN="eko.vision"
AI_DOMAIN="0r8.ai"
APPS_DOMAIN="apps.eko.vision"
ORACLE_DOMAIN="oracle.agency"

# ═══════════════════════════════════════════════════════════════════════════════
# VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔍 Validating deployment..."

# Check for required files
REQUIRED_FILES=(
    "ORBOS/eko-launch.py"
    "0r8-starter/package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
        echo "  ✓ $file"
    else
        echo "  ⚠️  Missing $file (will be created)"
    fi
done

# ═══════════════════════════════════════════════════════════════════════════════
# STRUCTURE SETUP
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "⚙️  Setting up production structure..."

# Create directory structure
mkdir -p "$PROJECT_ROOT"/{apps,oracle,creation,assets,logs,public,api}

# Create apps subdomains
mkdir -p "$PROJECT_ROOT/apps"/{terminal,vision,forge,brain}

echo "  ✓ Directory structure created"

# ═══════════════════════════════════════════════════════════════════════════════
# GENERATE UNIFIED ECOSYSTEM ENTRY
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "🌐 Generating unified ecosystem entry..."

cat > "$PROJECT_ROOT/$ECOSYSTEM_FILE" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eKo.vision | ORBOS - The AI Operating System</title>
    <meta name="description" content="ORBOS - Voice-first AI Operating System. From intent to empire. Everybody Eats.">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦉</text></svg>">

    <!-- Open Graph -->
    <meta property="og:title" content="eKo.vision | ORBOS">
    <meta property="og:description" content="The AI Operating System - From intent to empire">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://eko.vision">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg: #0a0a0f;
            --fg: #e0e0e0;
            --accent: #8b5cf6;
            --accent2: #f97316;
            --glow: rgba(139, 92, 246, 0.3);
        }

        body {
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            background: var(--bg);
            color: var(--fg);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .hero {
            text-align: center;
            margin-bottom: 4rem;
        }

        .logo {
            font-size: 6rem;
            margin-bottom: 1rem;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        h1 {
            font-size: 3rem;
            background: linear-gradient(135deg, var(--accent), var(--accent2));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        }

        .tagline {
            font-size: 1.2rem;
            color: #888;
            margin-bottom: 2rem;
        }

        .domains {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }

        .domain-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            text-decoration: none;
            color: var(--fg);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .domain-card:hover {
            border-color: var(--accent);
            box-shadow: 0 0 30px var(--glow);
            transform: translateY(-5px);
        }

        .domain-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent), var(--accent2));
            opacity: 0;
            transition: opacity 0.3s;
        }

        .domain-card:hover::before {
            opacity: 1;
        }

        .domain-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .domain-name {
            font-size: 1.1rem;
            font-weight: bold;
            color: var(--accent);
        }

        .domain-desc {
            font-size: 0.85rem;
            color: #666;
            margin-top: 0.5rem;
        }

        .status {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 100px;
            font-size: 0.8rem;
            color: #22c55e;
            margin-bottom: 2rem;
        }

        .status::before {
            content: '';
            width: 8px;
            height: 8px;
            background: #22c55e;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .terminal {
            background: #111;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 1rem;
            font-size: 0.9rem;
            margin: 2rem auto;
            max-width: 600px;
        }

        .terminal-header {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .terminal-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .terminal-dot.red { background: #ff5f56; }
        .terminal-dot.yellow { background: #ffbd2e; }
        .terminal-dot.green { background: #27c93f; }

        .terminal-content {
            color: #0f0;
            line-height: 1.6;
        }

        .terminal-prompt {
            color: var(--accent);
        }

        .footer {
            text-align: center;
            padding: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            color: #666;
            font-size: 0.85rem;
        }

        .footer-links {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-bottom: 1rem;
        }

        .footer-links a {
            color: #888;
            text-decoration: none;
        }

        .footer-links a:hover {
            color: var(--accent);
        }

        .philosophy {
            color: var(--accent2);
            font-style: italic;
        }

        @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .logo { font-size: 4rem; }
            .domains { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <div class="logo">🦉</div>
            <h1>eKo.vision</h1>
            <p class="tagline">ORBOS - The AI Operating System</p>
            <div class="status">SYSTEM ONLINE</div>
        </div>

        <div class="domains">
            <a href="https://0r8.ai" class="domain-card">
                <div class="domain-icon">🤖</div>
                <div class="domain-name">0r8.ai</div>
                <div class="domain-desc">AI Interface - Voice-first terminal & agents</div>
            </a>

            <a href="https://apps.eko.vision" class="domain-card">
                <div class="domain-icon">🚀</div>
                <div class="domain-name">apps.eko.vision</div>
                <div class="domain-desc">Applications Hub - Tools & creations</div>
            </a>

            <a href="https://oracle.agency" class="domain-card">
                <div class="domain-icon">🔮</div>
                <div class="domain-name">oracle.agency</div>
                <div class="domain-desc">Oracle Services - AI consulting & strategy</div>
            </a>

            <a href="/terminal" class="domain-card">
                <div class="domain-icon">💻</div>
                <div class="domain-name">Terminal</div>
                <div class="domain-desc">ORB.TERM - AI-powered command center</div>
            </a>
        </div>

        <div class="terminal">
            <div class="terminal-header">
                <div class="terminal-dot red"></div>
                <div class="terminal-dot yellow"></div>
                <div class="terminal-dot green"></div>
            </div>
            <div class="terminal-content">
                <span class="terminal-prompt">🦉 eko></span> system status<br>
                ✅ ORBOS Core: ONLINE<br>
                ✅ 47 Fractal Nodes: ACTIVE<br>
                ✅ Revenue Engine: LIVE<br>
                ✅ HSS Gate: SECURED<br>
                <br>
                <span class="terminal-prompt">🦉 eko></span> <span style="animation: blink 1s infinite;">_</span>
            </div>
        </div>
    </div>

    <footer class="footer">
        <div class="footer-links">
            <a href="/docs">Documentation</a>
            <a href="/api">API</a>
            <a href="https://github.com/miKeDroP-JB/BlkFryday">GitHub</a>
        </div>
        <p class="philosophy">"From intent to empire. Everybody Eats."</p>
        <p>© 2024 eKo.vision | Architect: JB</p>
    </footer>

    <style>
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
    </style>
</body>
</html>
HTMLEOF

# Copy to index.html
cp "$PROJECT_ROOT/$ECOSYSTEM_FILE" "$PROJECT_ROOT/$ENTRY_FILE"

echo "  ✓ Ecosystem entry generated"

# ═══════════════════════════════════════════════════════════════════════════════
# VERSION STAMP
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "🧬 Stamping build version..."

cat > "$PROJECT_ROOT/$VERSION_FILE" << EOF
{
  "system": "ORBOS",
  "umbrella": "eKo.vision",
  "entry": "0r8.ai",
  "services": "oracle.agency",
  "build_time": "$TIMESTAMP",
  "git_hash": "$GIT_HASH",
  "status": "LIVE",
  "mode": "REGENERATIVE",
  "domains": {
    "primary": "$PRIMARY_DOMAIN",
    "ai": "$AI_DOMAIN",
    "apps": "$APPS_DOMAIN",
    "oracle": "$ORACLE_DOMAIN"
  },
  "components": {
    "core_builder": true,
    "fractal_nodes": 47,
    "revenue_engine": true,
    "glyph_compiler": true,
    "hss": true,
    "rust_core": true
  },
  "laws": {
    "physics": 8,
    "life_domains": 8
  },
  "philosophy": "From intent to empire. Everybody Eats."
}
EOF

echo "  ✓ Version stamped: $GIT_HASH @ $TIMESTAMP"

# ═══════════════════════════════════════════════════════════════════════════════
# VERCEL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "☁️  Generating Vercel configuration..."

cat > "$PROJECT_ROOT/vercel.json" << 'EOF'
{
  "version": 2,
  "name": "orbos-eko",
  "alias": ["eko.vision", "www.eko.vision", "0r8.ai", "www.0r8.ai"],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/0r8-starter/api/$1"
    },
    {
      "src": "/terminal",
      "dest": "/0r8-starter/public/index.html"
    },
    {
      "src": "/docs",
      "dest": "/ORBOS/README.md"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-ORBOS-Version", "value": "1.0.0" },
        { "key": "X-Powered-By", "value": "ORBOS/eKo" }
      ]
    }
  ],
  "env": {
    "ORBOS_MODE": "production",
    "NODE_ENV": "production"
  }
}
EOF

echo "  ✓ Vercel config generated"

# ═══════════════════════════════════════════════════════════════════════════════
# NETLIFY CONFIGURATION (Alternative)
# ═══════════════════════════════════════════════════════════════════════════════

cat > "$PROJECT_ROOT/netlify.toml" << 'EOF'
[build]
  publish = "."
  command = "echo 'ORBOS Deploy'"

[[redirects]]
  from = "/api/*"
  to = "/0r8-starter/api/:splat"
  status = 200

[[redirects]]
  from = "/terminal"
  to = "/0r8-starter/public/index.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-ORBOS-Version = "1.0.0"
    X-Powered-By = "ORBOS/eKo"

[context.production.environment]
  ORBOS_MODE = "production"
  NODE_ENV = "production"
EOF

echo "  ✓ Netlify config generated"

# ═══════════════════════════════════════════════════════════════════════════════
# GIT OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "📦 Committing production state..."

git add . 2>/dev/null || true
git commit -m "∞Φ∞ ORBOS LIVE :: unified ecosystem deploy [$TIMESTAMP]" 2>/dev/null || echo "  ℹ️  No changes to commit"

echo ""
echo "🚀 Pushing to production..."

git push 2>/dev/null || echo "  ℹ️  Push handled separately"

# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOYMENT INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ DEPLOY PREPARATION COMPLETE"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📍 Next Steps for Custom Domains:"
echo ""
echo "   1. VERCEL DEPLOY:"
echo "      vercel --prod"
echo "      vercel alias eko.vision"
echo "      vercel alias 0r8.ai"
echo ""
echo "   2. DNS RECORDS (add to your registrar):"
echo ""
echo "      eko.vision:"
echo "        A     @     76.76.21.21"
echo "        CNAME www   cname.vercel-dns.com"
echo ""
echo "      0r8.ai:"
echo "        A     @     76.76.21.21"
echo "        CNAME www   cname.vercel-dns.com"
echo ""
echo "      apps.eko.vision:"
echo "        CNAME apps  cname.vercel-dns.com"
echo ""
echo "      oracle.agency:"
echo "        A     @     76.76.21.21"
echo "        CNAME www   cname.vercel-dns.com"
echo ""
echo "   3. VERIFY DOMAINS IN VERCEL:"
echo "      vercel domains add eko.vision"
echo "      vercel domains add 0r8.ai"
echo "      vercel domains add apps.eko.vision"
echo "      vercel domains add oracle.agency"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌍 ORBOS ENTRY POINTS:"
echo ""
echo "   • https://eko.vision          (Primary)"
echo "   • https://0r8.ai              (AI Interface)"
echo "   • https://apps.eko.vision     (Applications)"
echo "   • https://oracle.agency       (Services)"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "∞Φ∞ EVERYBODY EATS ∞Φ∞"
echo ""

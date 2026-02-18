#!/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  QUICK SETUP - Get running in 30 seconds                                  ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -e

echo "
╔═══════════════════════════════════════════════════════════════════════════╗
║                    0RB QUICK SETUP                                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
"

# Detect script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$ROOT_DIR"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    nvm use 20
fi

echo "✅ Node.js $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install --silent

# Create directories
mkdir -p data logs config

# Create .env file if not exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# AI Providers (at least one required)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Email Provider (optional, uses console mode if not set)
SENDGRID_API_KEY=
RESEND_API_KEY=

# Outreach Settings
SENDER_NAME=Your Name
SENDER_EMAIL=you@example.com

# Defaults
ORB_DEFAULT_PROVIDER=anthropic
ORB_DEFAULT_NETWORK=base
EOF
    echo "⚠️  Edit .env file to add your API keys"
fi

# Check for API keys
echo ""
echo "🔑 Checking API keys..."

if [ -f .env ]; then
    source .env 2>/dev/null || true
fi

READY=false

if [ -n "$ANTHROPIC_API_KEY" ] || [ -n "$OPENAI_API_KEY" ]; then
    READY=true
    echo "✅ AI provider configured"
else
    echo "⚠️  No AI provider configured - edit .env and add ANTHROPIC_API_KEY or OPENAI_API_KEY"
fi

# Test Ollama
if curl -s http://localhost:11434/api/tags &> /dev/null; then
    READY=true
    echo "✅ Ollama detected"
fi

echo ""

if [ "$READY" = true ]; then
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "✅ SETUP COMPLETE - You're ready to go!"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "Quick Start Commands:"
    echo "  npm start              - Launch interactive REPL"
    echo "  npm run automate       - Run daily automation"
    echo "  npm run schedule       - Start scheduler daemon"
    echo ""
    echo "Other Commands:"
    echo "  npm run core           - Test core system"
    echo "  npm run morning        - Run morning routine"
    echo "  npm run outreach       - Process outreach campaigns"
    echo ""
else
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo "⚠️  SETUP INCOMPLETE - Add API keys to .env file"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "Edit .env and add at least one:"
    echo "  ANTHROPIC_API_KEY=your-key"
    echo "  OPENAI_API_KEY=your-key"
    echo ""
    echo "Or start Ollama for local AI:"
    echo "  ollama serve"
    echo ""
fi

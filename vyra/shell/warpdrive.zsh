#═══════════════════════════════════════════════════════════════════
# WARPDRIVE ZSH - Agent-Aware Shell for Reality Engineers
#═══════════════════════════════════════════════════════════════════
# "Every command is a spell. Every output is a manifestation."
#═══════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────
# CORE CONFIGURATION
# ─────────────────────────────────────────────────────────────────

export WARPDRIVE_VERSION="1.0.0"
export VYRA_HOME="${VYRA_HOME:-/opt/vyra}"
export CHANNEL0_SOCKET="${CHANNEL0_SOCKET:-/tmp/channel0.sock}"
export SWARM_API="${SWARM_API:-http://localhost:7777}"

# Colors
export VYRA_CYAN='\033[0;36m'
export VYRA_MAGENTA='\033[0;35m'
export VYRA_GOLD='\033[0;33m'
export VYRA_GREEN='\033[0;32m'
export VYRA_RED='\033[0;31m'
export VYRA_NC='\033[0m'

# ─────────────────────────────────────────────────────────────────
# PROMPT - NEON SIGIL FLOATING
# ─────────────────────────────────────────────────────────────────

# Use starship if available, otherwise custom prompt
if command -v starship &> /dev/null; then
    eval "$(starship init zsh)"
else
    # Custom WarpDrive prompt
    autoload -Uz vcs_info
    precmd() { vcs_info }
    zstyle ':vcs_info:git:*' formats '%F{magenta}[%b]%f '

    # Agent status indicator
    warpdrive_agent_status() {
        if [[ -S "$CHANNEL0_SOCKET" ]]; then
            echo "%F{cyan}◈%f"
        else
            echo "%F{red}◇%f"
        fi
    }

    # Swarm count
    warpdrive_swarm_count() {
        local count=$(curl -s "$SWARM_API/agents/count" 2>/dev/null || echo "0")
        if [[ "$count" -gt 0 ]]; then
            echo "%F{gold}⬡${count}%f"
        fi
    }

    setopt PROMPT_SUBST
    PROMPT='
%F{cyan}╭─[%f%F{magenta}VYRA%f%F{cyan}]─[%f%F{yellow}%~%f%F{cyan}]%f ${vcs_info_msg_0_}$(warpdrive_agent_status) $(warpdrive_swarm_count)
%F{cyan}╰─▶%f '

    RPROMPT='%F{240}%T%f'
fi

# ─────────────────────────────────────────────────────────────────
# HISTORY & COMPLETION
# ─────────────────────────────────────────────────────────────────

HISTFILE=~/.zsh_history
HISTSIZE=50000
SAVEHIST=50000

setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE
setopt SHARE_HISTORY
setopt EXTENDED_HISTORY
setopt INC_APPEND_HISTORY

# Smart completion
autoload -Uz compinit && compinit
zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"

# ─────────────────────────────────────────────────────────────────
# PLUGINS (if available)
# ─────────────────────────────────────────────────────────────────

# Autosuggestions
[[ -f /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh ]] && \
    source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh

# Syntax highlighting
[[ -f /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh ]] && \
    source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# FZF
[[ -f /usr/share/fzf/key-bindings.zsh ]] && source /usr/share/fzf/key-bindings.zsh
[[ -f /usr/share/fzf/completion.zsh ]] && source /usr/share/fzf/completion.zsh

# ─────────────────────────────────────────────────────────────────
# ALIASES - STANDARD
# ─────────────────────────────────────────────────────────────────

alias ls='exa --icons --group-directories-first'
alias ll='exa -la --icons --group-directories-first'
alias lt='exa --tree --icons --level=2'
alias cat='bat --style=plain'
alias grep='rg'
alias find='fd'
alias vim='nvim'
alias v='nvim'
alias g='git'
alias d='docker'
alias dc='docker-compose'
alias k='kubectl'
alias tf='terraform'

# ─────────────────────────────────────────────────────────────────
# SPELLCASTING - AGENT COMMANDS
# ─────────────────────────────────────────────────────────────────

# Summon an agent
summon-agent() {
    local agent_type="${1:-apollo}"
    local task="$2"

    echo -e "${VYRA_CYAN}⟡ Summoning agent: ${agent_type}...${VYRA_NC}"

    curl -s -X POST "$SWARM_API/agents/spawn" \
        -H "Content-Type: application/json" \
        -d "{\"type\": \"$agent_type\", \"task\": \"$task\"}" | jq .

    echo -e "${VYRA_GREEN}✓ Agent summoned${VYRA_NC}"
}

# Deploy a swarm
deploy-swarm() {
    local swarm_type="${1:-analysis}"
    local target="$2"

    echo -e "${VYRA_MAGENTA}⬡ Deploying swarm: ${swarm_type}...${VYRA_NC}"

    curl -s -X POST "$SWARM_API/swarm/deploy" \
        -H "Content-Type: application/json" \
        -d "{\"type\": \"$swarm_type\", \"target\": \"$target\"}" | jq .

    echo -e "${VYRA_GREEN}✓ Swarm deployed${VYRA_NC}"
}

# List active agents
list-agents() {
    echo -e "${VYRA_CYAN}⟡ Active Agents:${VYRA_NC}"
    curl -s "$SWARM_API/agents" | jq -r '.agents[] | "  \(.id) | \(.type) | \(.status)"'
}

# Kill an agent
dismiss-agent() {
    local agent_id="$1"

    if [[ -z "$agent_id" ]]; then
        echo -e "${VYRA_RED}Usage: dismiss-agent <agent_id>${VYRA_NC}"
        return 1
    fi

    echo -e "${VYRA_GOLD}⟡ Dismissing agent: ${agent_id}...${VYRA_NC}"
    curl -s -X DELETE "$SWARM_API/agents/$agent_id" | jq .
}

# Send message to Channel 0
channel() {
    local message="$*"

    if [[ -S "$CHANNEL0_SOCKET" ]]; then
        echo "$message" | nc -U "$CHANNEL0_SOCKET"
    else
        echo -e "${VYRA_RED}Channel 0 not connected${VYRA_NC}"
    fi
}

# Quick chat with default model
ask() {
    local query="$*"
    echo -e "${VYRA_CYAN}⟡ Querying...${VYRA_NC}"

    curl -s -X POST "$SWARM_API/chat" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$query\"}" | jq -r '.response'
}

# ─────────────────────────────────────────────────────────────────
# SPELLCASTING - BUILD COMMANDS
# ─────────────────────────────────────────────────────────────────

# Build a server
build-server() {
    local name="${1:-server}"
    local port="${2:-3000}"

    echo -e "${VYRA_CYAN}⟡ Building server: ${name} on port ${port}...${VYRA_NC}"

    mkdir -p "$name"
    cd "$name"

    cat > package.json << EOF
{
  "name": "$name",
  "version": "1.0.0",
  "scripts": {
    "dev": "node index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF

    cat > index.js << EOF
const express = require('express');
const app = express();
const PORT = process.env.PORT || $port;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'online', name: '$name', timestamp: Date.now() });
});

app.listen(PORT, () => console.log(\`$name running on port \${PORT}\`));
EOF

    npm install
    echo -e "${VYRA_GREEN}✓ Server built. Run: npm run dev${VYRA_NC}"
}

# Spin up a node
spin-node() {
    local script="${1:-index.js}"

    if [[ ! -f "$script" ]]; then
        echo -e "${VYRA_RED}File not found: $script${VYRA_NC}"
        return 1
    fi

    echo -e "${VYRA_CYAN}⟡ Spinning node: ${script}...${VYRA_NC}"
    node "$script" &
    echo -e "${VYRA_GREEN}✓ Node spinning (PID: $!)${VYRA_NC}"
}

# Open timeline (git log visualization)
open-timeline() {
    echo -e "${VYRA_MAGENTA}⟡ Opening timeline...${VYRA_NC}"

    git log --graph --oneline --all --decorate --color=always | head -50
}

# Reality check (system status)
reality-check() {
    echo -e "${VYRA_CYAN}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                    VYRA REALITY CHECK                             ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${VYRA_NC}"

    echo -e "${VYRA_GOLD}System:${VYRA_NC}"
    echo "  Kernel: $(uname -r)"
    echo "  Uptime: $(uptime -p)"
    echo "  Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"

    echo -e "\n${VYRA_GOLD}Channel 0:${VYRA_NC}"
    if [[ -S "$CHANNEL0_SOCKET" ]]; then
        echo "  Status: ${VYRA_GREEN}Connected${VYRA_NC}"
    else
        echo "  Status: ${VYRA_RED}Disconnected${VYRA_NC}"
    fi

    echo -e "\n${VYRA_GOLD}Swarm:${VYRA_NC}"
    local agent_count=$(curl -s "$SWARM_API/agents/count" 2>/dev/null || echo "offline")
    echo "  Agents: $agent_count"

    echo -e "\n${VYRA_GOLD}AI Stack:${VYRA_NC}"
    if command -v ollama &> /dev/null; then
        echo "  Ollama: ${VYRA_GREEN}Installed${VYRA_NC}"
    else
        echo "  Ollama: ${VYRA_RED}Not found${VYRA_NC}"
    fi

    echo -e "\n${VYRA_GOLD}GPU:${VYRA_NC}"
    if command -v nvidia-smi &> /dev/null; then
        nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader
    else
        echo "  No NVIDIA GPU detected"
    fi
}

# ─────────────────────────────────────────────────────────────────
# SPELLCASTING - AI COMMANDS
# ─────────────────────────────────────────────────────────────────

# Run local model
llm() {
    local model="${1:-llama3}"
    local prompt="${@:2}"

    if [[ -z "$prompt" ]]; then
        echo -e "${VYRA_CYAN}Starting interactive session with $model...${VYRA_NC}"
        ollama run "$model"
    else
        ollama run "$model" "$prompt"
    fi
}

# Embed text
embed() {
    local text="$*"
    curl -s -X POST "$SWARM_API/embed" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"$text\"}" | jq '.embedding[:5]'
    echo "... (truncated)"
}

# Transcribe audio
transcribe() {
    local audio_file="$1"

    if [[ ! -f "$audio_file" ]]; then
        echo -e "${VYRA_RED}File not found: $audio_file${VYRA_NC}"
        return 1
    fi

    echo -e "${VYRA_CYAN}⟡ Transcribing...${VYRA_NC}"
    whisper "$audio_file" --model small --output_format txt
}

# ─────────────────────────────────────────────────────────────────
# SPECTRAL DIAGNOSTICS
# ─────────────────────────────────────────────────────────────────

# Memory heatmap
memory-heatmap() {
    echo -e "${VYRA_MAGENTA}⟡ Memory Heatmap:${VYRA_NC}"
    ps aux --sort=-%mem | head -15 | awk 'NR>1 {printf "%-20s %6s%%\n", $11, $4}'
}

# Log analyzer
analyze-logs() {
    local log_file="${1:-/var/log/syslog}"
    local pattern="${2:-error}"

    echo -e "${VYRA_CYAN}⟡ Analyzing $log_file for '$pattern'...${VYRA_NC}"
    grep -i "$pattern" "$log_file" | tail -20
}

# Network spectral
network-scan() {
    echo -e "${VYRA_CYAN}⟡ Network Spectral Analysis:${VYRA_NC}"
    echo -e "\n${VYRA_GOLD}Listening Ports:${VYRA_NC}"
    ss -tuln | head -20

    echo -e "\n${VYRA_GOLD}Active Connections:${VYRA_NC}"
    ss -tun | head -10
}

# ─────────────────────────────────────────────────────────────────
# KEYBINDINGS
# ─────────────────────────────────────────────────────────────────

bindkey -e  # Emacs mode

# Ctrl+G - Git status
bindkey -s '^g' 'git status\n'

# Ctrl+F - FZF file search
bindkey -s '^f' 'nvim $(fzf)\n'

# Ctrl+R - Enhanced history search (FZF)
if command -v fzf &> /dev/null; then
    bindkey '^R' fzf-history-widget
fi

# Alt+A - List agents
bindkey -s '\ea' 'list-agents\n'

# Alt+R - Reality check
bindkey -s '\er' 'reality-check\n'

# ─────────────────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────────────────

# Show boot message on new shell
if [[ -z "$WARPDRIVE_BOOTED" ]]; then
    export WARPDRIVE_BOOTED=1

    echo -e "${VYRA_CYAN}"
    cat << 'EOF'
    ╭─────────────────────────────────────────────╮
    │  WARPDRIVE ZSH v1.0.0                       │
    │  "Every command is a spell"                 │
    │                                             │
    │  Type 'reality-check' for system status    │
    │  Type 'help-spells' for available commands │
    ╰─────────────────────────────────────────────╯
EOF
    echo -e "${VYRA_NC}"
fi

# Help command
help-spells() {
    echo -e "${VYRA_CYAN}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                     WARPDRIVE SPELLBOOK                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  AGENT COMMANDS                                                   ║
║    summon-agent <type> [task]  - Summon an AI agent              ║
║    deploy-swarm <type> [target] - Deploy agent swarm             ║
║    list-agents                  - Show active agents              ║
║    dismiss-agent <id>           - Dismiss an agent                ║
║    channel <message>            - Send to Channel 0               ║
║    ask <query>                  - Quick AI query                  ║
║                                                                   ║
║  BUILD COMMANDS                                                   ║
║    build-server <name> [port]   - Scaffold a server              ║
║    spin-node <script>           - Run Node.js in background      ║
║    open-timeline                - Git history visualization       ║
║    reality-check                - System status                   ║
║                                                                   ║
║  AI COMMANDS                                                      ║
║    llm [model] [prompt]         - Run local LLM                  ║
║    embed <text>                 - Generate embeddings            ║
║    transcribe <audio>           - Transcribe audio file          ║
║                                                                   ║
║  DIAGNOSTICS                                                      ║
║    memory-heatmap               - Process memory usage           ║
║    analyze-logs [file] [pattern] - Search logs                   ║
║    network-scan                 - Network analysis               ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${VYRA_NC}"
}

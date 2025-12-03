# ═══════════════════════════════════════════════════════════════════
# VYRA: GENESIS SECTOR - User ZSH Configuration
# ═══════════════════════════════════════════════════════════════════

# Source WarpDrive
source /etc/zsh/warpdrive.zsh

# User customizations below
# ─────────────────────────────────────────────────────────────────

# Add local bin to PATH
export PATH="$HOME/.local/bin:$PATH"

# Default editor
export EDITOR="nvim"
export VISUAL="nvim"

# Node version manager
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Python virtual environment auto-activation
auto_venv() {
    if [[ -d "./venv" ]]; then
        source ./venv/bin/activate
    elif [[ -d "./.venv" ]]; then
        source ./.venv/bin/activate
    fi
}
chpwd_functions+=("auto_venv")

# Auto-activate on shell start if in project directory
auto_venv

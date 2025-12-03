#!/bin/bash
#═══════════════════════════════════════════════════════════════════
# VYRA: GENESIS SECTOR - Post-Install Automation
#═══════════════════════════════════════════════════════════════════
# Runs automatically after first boot
#═══════════════════════════════════════════════════════════════════

set -e

CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

VYRA_USER="${VYRA_USER:-vyra}"
VYRA_HOME="/home/$VYRA_USER"
VYRA_OPT="/opt/vyra"

echo -e "${CYAN}"
cat << 'EOF'
██╗   ██╗██╗   ██╗██████╗  █████╗
██║   ██║╚██╗ ██╔╝██╔══██╗██╔══██╗
██║   ██║ ╚████╔╝ ██████╔╝███████║
╚██╗ ██╔╝  ╚██╔╝  ██╔══██╗██╔══██║
 ╚████╔╝    ██║   ██║  ██║██║  ██║
  ╚═══╝     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
    GENESIS SECTOR - POST INSTALL
EOF
echo -e "${NC}"

# ─────────────────────────────────────────────────────────────────
# Phase 1: User Setup
# ─────────────────────────────────────────────────────────────────

phase() {
    echo -e "\n${GOLD}═══ $1 ═══${NC}\n"
}

setup_user() {
    phase "Setting up VYRA user"

    # Create user if doesn't exist
    if ! id "$VYRA_USER" &>/dev/null; then
        useradd -m -G wheel,docker,audio,video -s /usr/bin/zsh "$VYRA_USER"
        echo "$VYRA_USER:vyra" | chpasswd
        echo -e "${GREEN}✓ User $VYRA_USER created${NC}"
    else
        echo -e "${GREEN}✓ User $VYRA_USER exists${NC}"
    fi

    # Setup directories
    mkdir -p "$VYRA_HOME/.config/vyra"
    mkdir -p "$VYRA_HOME/.local/bin"
    mkdir -p "$VYRA_HOME/.local/share"
    mkdir -p "/var/lib/vyra/channel0"

    chown -R "$VYRA_USER:$VYRA_USER" "$VYRA_HOME"
    chown -R "$VYRA_USER:$VYRA_USER" "/var/lib/vyra"
}

# ─────────────────────────────────────────────────────────────────
# Phase 2: Shell Configuration
# ─────────────────────────────────────────────────────────────────

setup_shell() {
    phase "Configuring WarpDrive ZSH"

    # Copy shell configs
    cp /etc/skel/.zshrc "$VYRA_HOME/.zshrc"
    cp /etc/skel/starship.toml "$VYRA_HOME/.config/starship.toml"

    # Set default shell
    chsh -s /usr/bin/zsh "$VYRA_USER"

    echo -e "${GREEN}✓ Shell configured${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Phase 3: AI Stack
# ─────────────────────────────────────────────────────────────────

setup_ai() {
    phase "Installing AI Stack"

    if [[ -f "$VYRA_OPT/ai/install-ai-stack.sh" ]]; then
        bash "$VYRA_OPT/ai/install-ai-stack.sh"
    else
        echo -e "${GOLD}⚠ AI stack installer not found, skipping${NC}"
    fi
}

# ─────────────────────────────────────────────────────────────────
# Phase 4: Services
# ─────────────────────────────────────────────────────────────────

enable_services() {
    phase "Enabling VYRA Services"

    # Reload systemd
    systemctl daemon-reload

    # Enable services
    systemctl enable channel0.service 2>/dev/null || echo "Channel 0 service not found"
    systemctl enable swarm-panel.service 2>/dev/null || echo "Swarm panel service not found"
    systemctl enable vyra-visual.service 2>/dev/null || echo "Visual service not found"

    # Start Docker
    systemctl enable docker
    systemctl start docker

    # Add user to docker group
    usermod -aG docker "$VYRA_USER"

    echo -e "${GREEN}✓ Services enabled${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Phase 5: Visual Setup
# ─────────────────────────────────────────────────────────────────

setup_visual() {
    phase "Configuring Visual Layer"

    # Create visual config
    cat > "$VYRA_HOME/.config/vyra/visual.yaml" << 'EOF'
theme: neon-sigil
trap_beats: true
focus_mode: true
reactive_glyphs: true
EOF

    chown "$VYRA_USER:$VYRA_USER" "$VYRA_HOME/.config/vyra/visual.yaml"

    echo -e "${GREEN}✓ Visual layer configured${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Phase 6: Default Macros
# ─────────────────────────────────────────────────────────────────

setup_macros() {
    phase "Setting up Default Macros"

    cat > "$VYRA_HOME/.config/vyra/channel0.yaml" << 'EOF'
persistence: true
context_window: 100

macros:
  build-server: 'summon-agent hephaestus "Build a server: {args}"'
  deploy-swarm: 'deploy-swarm {args}'
  spin-node: 'node {args} &'
  open-timeline: 'git log --graph --oneline -20'
  focus: 'vyra-visual focus-on'
  flow: 'tmux new-session -d -s flow && tmux send-keys -t flow "clear && neofetch" Enter'
  quick-api: 'summon-agent hephaestus "Create a REST API for: {args}"'
  analyze: 'summon-agent athena "Analyze: {args}"'
  ideate: 'summon-agent apollo "Generate ideas for: {args}"'

aliases:
  s: summon-agent
  sw: deploy-swarm
  la: list-agents
  rc: reality-check

intent_patterns:
  - pattern: 'build (?:a |an )?(.+)'
    action: build
    extract: target
  - pattern: 'deploy (.+)'
    action: deploy
    extract: target
  - pattern: 'analyze (.+)'
    action: analyze
    extract: target
  - pattern: 'find (.+)'
    action: search
    extract: query
  - pattern: 'show (.+)'
    action: display
    extract: target
  - pattern: 'create (.+)'
    action: build
    extract: target
EOF

    chown "$VYRA_USER:$VYRA_USER" "$VYRA_HOME/.config/vyra/channel0.yaml"

    echo -e "${GREEN}✓ Macros configured${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Phase 7: Autostart Configuration
# ─────────────────────────────────────────────────────────────────

setup_autostart() {
    phase "Configuring Autostart"

    mkdir -p "$VYRA_HOME/.config/autostart"

    # Channel 0 autostart
    cat > "$VYRA_HOME/.config/autostart/channel0.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Channel 0
Exec=/opt/vyra/channel0/daemon.py
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

    # Swarm Panel autostart
    cat > "$VYRA_HOME/.config/autostart/swarm-panel.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=Swarm Panel
Exec=/opt/vyra/swarm/panel.py
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

    # Visual Layer autostart
    cat > "$VYRA_HOME/.config/autostart/vyra-visual.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=VYRA Visual
Exec=/usr/share/vyra/visual/ritual-layer.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

    chown -R "$VYRA_USER:$VYRA_USER" "$VYRA_HOME/.config/autostart"

    echo -e "${GREEN}✓ Autostart configured${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Phase 8: Final Touch
# ─────────────────────────────────────────────────────────────────

final_touch() {
    phase "Final Configuration"

    # Create welcome script
    cat > "$VYRA_HOME/.config/vyra/welcome.sh" << 'WELCOME'
#!/bin/bash
echo ""
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║                                                                   ║"
echo "║   Welcome to VYRA: GENESIS SECTOR                                ║"
echo "║                                                                   ║"
echo "║   Commands:                                                       ║"
echo "║     reality-check  - System status                               ║"
echo "║     help-spells    - Available commands                          ║"
echo "║     summon-agent   - Spawn an AI agent                           ║"
echo "║     deploy-swarm   - Deploy agent swarm                          ║"
echo "║     llm            - Local LLM interface                         ║"
echo "║                                                                   ║"
echo "║   Swarm Panel:  http://localhost:7777                            ║"
echo "║   Model Router: http://localhost:8000                            ║"
echo "║                                                                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo ""
WELCOME

    chmod +x "$VYRA_HOME/.config/vyra/welcome.sh"

    # Add to .zshrc
    echo 'source ~/.config/vyra/welcome.sh' >> "$VYRA_HOME/.zshrc"

    # Mark as installed
    touch "/var/lib/vyra/.installed"

    chown -R "$VYRA_USER:$VYRA_USER" "$VYRA_HOME"

    echo -e "${GREEN}✓ VYRA Genesis Sector fully installed${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

main() {
    # Check if already installed
    if [[ -f "/var/lib/vyra/.installed" ]]; then
        echo -e "${GOLD}VYRA already installed. Run with --force to reinstall.${NC}"
        if [[ "$1" != "--force" ]]; then
            exit 0
        fi
    fi

    setup_user
    setup_shell
    setup_ai
    enable_services
    setup_visual
    setup_macros
    setup_autostart
    final_touch

    echo -e "\n${CYAN}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║        VYRA: GENESIS SECTOR INSTALLATION COMPLETE                ║
║                                                                   ║
║   Reboot to activate all systems, or run:                        ║
║     systemctl start channel0 swarm-panel                         ║
║                                                                   ║
║   EVERYBODY EATS                                                  ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

main "$@"

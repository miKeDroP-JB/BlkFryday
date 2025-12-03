#!/bin/bash
#═══════════════════════════════════════════════════════════════════
# VYRA: GENESIS SECTOR - ISO Build Script
#═══════════════════════════════════════════════════════════════════

set -e

# Colors
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GOLD='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Config
VYRA_VERSION="1.0.0"
BUILD_DATE=$(date +%Y%m%d)
ISO_NAME="vyra-genesis-${BUILD_DATE}"
WORK_DIR="/tmp/vyra-build"
OUT_DIR="$(pwd)/out"

echo -e "${CYAN}"
cat << 'EOF'
██╗   ██╗██╗   ██╗██████╗  █████╗
██║   ██║╚██╗ ██╔╝██╔══██╗██╔══██╗
██║   ██║ ╚████╔╝ ██████╔╝███████║
╚██╗ ██╔╝  ╚██╔╝  ██╔══██╗██╔══██║
 ╚████╔╝    ██║   ██║  ██║██║  ██║
  ╚═══╝     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
       GENESIS SECTOR BUILD
EOF
echo -e "${NC}"

echo -e "${MAGENTA}Version: ${VYRA_VERSION}${NC}"
echo -e "${MAGENTA}Build Date: ${BUILD_DATE}${NC}"
echo ""

#───────────────────────────────────────────────────────────────────
# Phase 1: Prerequisites Check
#───────────────────────────────────────────────────────────────────
phase() {
    echo -e "\n${GOLD}═══ $1 ═══${NC}\n"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}This script must be run as root${NC}"
        exit 1
    fi
}

check_deps() {
    phase "Checking Dependencies"

    DEPS="archiso git wget curl squashfs-tools xorriso"
    MISSING=""

    for dep in $DEPS; do
        if ! command -v $dep &> /dev/null; then
            MISSING="$MISSING $dep"
        fi
    done

    if [[ -n "$MISSING" ]]; then
        echo -e "${GOLD}Installing missing dependencies:${MISSING}${NC}"
        pacman -Sy --noconfirm $MISSING
    fi

    echo -e "${GREEN}✓ All dependencies satisfied${NC}"
}

#───────────────────────────────────────────────────────────────────
# Phase 2: Prepare Build Environment
#───────────────────────────────────────────────────────────────────
prepare_env() {
    phase "Preparing Build Environment"

    # Clean previous builds
    rm -rf "$WORK_DIR"
    mkdir -p "$WORK_DIR"
    mkdir -p "$OUT_DIR"

    # Copy archiso profile
    cp -r /usr/share/archiso/configs/releng "$WORK_DIR/profile"

    echo -e "${GREEN}✓ Build environment ready${NC}"
}

#───────────────────────────────────────────────────────────────────
# Phase 3: Customize Profile
#───────────────────────────────────────────────────────────────────
customize_profile() {
    phase "Customizing VYRA Profile"

    PROFILE="$WORK_DIR/profile"
    AIROOTFS="$PROFILE/airootfs"

    # Create directory structure
    mkdir -p "$AIROOTFS/etc/skel"
    mkdir -p "$AIROOTFS/etc/vyra"
    mkdir -p "$AIROOTFS/usr/local/bin"
    mkdir -p "$AIROOTFS/usr/share/vyra"
    mkdir -p "$AIROOTFS/opt/vyra"

    # Copy VYRA components
    echo -e "${CYAN}→ Installing WarpDrive ZSH...${NC}"
    cp -r "$(dirname $0)/shell/"* "$AIROOTFS/etc/skel/"
    cp "$(dirname $0)/shell/warpdrive.zsh" "$AIROOTFS/etc/zsh/"

    echo -e "${CYAN}→ Installing AI Stack...${NC}"
    cp -r "$(dirname $0)/ai/"* "$AIROOTFS/opt/vyra/"

    echo -e "${CYAN}→ Installing Visual Layer...${NC}"
    cp -r "$(dirname $0)/visual/"* "$AIROOTFS/usr/share/vyra/"

    echo -e "${CYAN}→ Installing Channel 0...${NC}"
    cp -r "$(dirname $0)/channel0/"* "$AIROOTFS/opt/vyra/"

    echo -e "${CYAN}→ Installing Swarm Panel...${NC}"
    cp -r "$(dirname $0)/swarm/"* "$AIROOTFS/opt/vyra/"

    echo -e "${CYAN}→ Installing Scripts...${NC}"
    cp "$(dirname $0)/scripts/"*.sh "$AIROOTFS/usr/local/bin/"
    chmod +x "$AIROOTFS/usr/local/bin/"*.sh

    # Set default shell
    echo "SHELL=/usr/bin/zsh" >> "$AIROOTFS/etc/environment"

    echo -e "${GREEN}✓ Profile customized${NC}"
}

#───────────────────────────────────────────────────────────────────
# Phase 4: Add Packages
#───────────────────────────────────────────────────────────────────
add_packages() {
    phase "Adding VYRA Packages"

    PKGLIST="$WORK_DIR/profile/packages.x86_64"

    # Base system
    cat >> "$PKGLIST" << 'PACKAGES'

# ═══ VYRA: GENESIS SECTOR PACKAGES ═══

# Shell & Terminal
zsh
zsh-completions
zsh-autosuggestions
zsh-syntax-highlighting
tmux
alacritty
kitty
starship

# Development Core
base-devel
git
git-lfs
wget
curl
openssh
gnupg

# Node.js
nodejs
npm

# Python
python
python-pip
python-virtualenv
python-poetry

# Containers
docker
docker-compose
podman

# Build Tools
cmake
ninja
meson
rust
go

# Editor
neovim
visual-studio-code-bin

# AI/ML Dependencies
cuda
cudnn
python-pytorch-cuda
python-numpy
python-scipy
python-pandas

# Audio/Video
pipewire
pipewire-pulse
ffmpeg
sox

# Graphics
mesa
vulkan-icd-loader
nvidia-dkms
nvidia-utils

# Desktop (Garuda Dragonized inspired)
plasma-desktop
plasma-workspace
kde-applications-meta
kvantum
latte-dock

# Fonts
ttf-jetbrains-mono
ttf-fira-code
noto-fonts
noto-fonts-emoji

# Utils
htop
btop
neofetch
bat
exa
fd
ripgrep
fzf
jq
yq

# Network
nginx
netcat
nmap
wireshark-qt

# VYRA Specific
python-langchain
python-openai
PACKAGES

    echo -e "${GREEN}✓ Package list updated${NC}"
}

#───────────────────────────────────────────────────────────────────
# Phase 5: Configure System
#───────────────────────────────────────────────────────────────────
configure_system() {
    phase "Configuring VYRA System"

    AIROOTFS="$WORK_DIR/profile/airootfs"

    # Create VYRA config
    cat > "$AIROOTFS/etc/vyra/config.yaml" << 'CONFIG'
vyra:
  version: "1.0.0"
  codename: "GENESIS_SECTOR"

channel0:
  enabled: true
  persistence: true
  macros:
    - build-server
    - deploy-swarm
    - spin-node
    - open-timeline

swarm:
  panel_enabled: true
  max_agents: 100
  heatmap: true
  timeline_jumps: true

visual:
  theme: "neon-sigil"
  trap_beats: true
  focus_mode: true
  reactive_glyphs: true

ai:
  default_model: "ollama:llama3"
  embedding_server: true
  multi_router: true
CONFIG

    # Create systemd services
    mkdir -p "$AIROOTFS/etc/systemd/system"

    # Channel 0 service
    cat > "$AIROOTFS/etc/systemd/system/channel0.service" << 'SERVICE'
[Unit]
Description=VYRA Channel 0 Intent Interface
After=network.target

[Service]
Type=simple
ExecStart=/opt/vyra/channel0/daemon.py
Restart=always
User=vyra

[Install]
WantedBy=multi-user.target
SERVICE

    # Swarm Panel service
    cat > "$AIROOTFS/etc/systemd/system/swarm-panel.service" << 'SERVICE'
[Unit]
Description=VYRA Swarm Control Panel
After=network.target channel0.service

[Service]
Type=simple
ExecStart=/opt/vyra/swarm/panel.py
Restart=always
User=vyra

[Install]
WantedBy=multi-user.target
SERVICE

    # Visual layer service
    cat > "$AIROOTFS/etc/systemd/system/vyra-visual.service" << 'SERVICE'
[Unit]
Description=VYRA Visual Ritual Layer
After=graphical.target

[Service]
Type=simple
ExecStart=/opt/vyra/visual/ritual-layer.sh
Restart=always
User=vyra

[Install]
WantedBy=graphical.target
SERVICE

    echo -e "${GREEN}✓ System configured${NC}"
}

#───────────────────────────────────────────────────────────────────
# Phase 6: Build ISO
#───────────────────────────────────────────────────────────────────
build_iso() {
    phase "Building VYRA ISO"

    cd "$WORK_DIR"

    # Update profile name
    sed -i "s/iso_name=.*/iso_name=\"vyra-genesis\"/" profile/profiledef.sh
    sed -i "s/iso_label=.*/iso_label=\"VYRA_GENESIS\"/" profile/profiledef.sh
    sed -i "s/iso_publisher=.*/iso_publisher=\"0RB System\"/" profile/profiledef.sh
    sed -i "s/iso_application=.*/iso_application=\"VYRA Genesis Sector\"/" profile/profiledef.sh

    # Build
    mkarchiso -v -w "$WORK_DIR/work" -o "$OUT_DIR" profile/

    echo -e "${GREEN}✓ ISO built successfully${NC}"
}

#───────────────────────────────────────────────────────────────────
# Phase 7: Finalize
#───────────────────────────────────────────────────────────────────
finalize() {
    phase "Finalizing Build"

    ISO_FILE=$(ls -t "$OUT_DIR"/*.iso | head -1)
    ISO_SIZE=$(du -h "$ISO_FILE" | cut -f1)

    echo -e "${CYAN}"
    cat << EOF
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   VYRA: GENESIS SECTOR - BUILD COMPLETE                          ║
║                                                                   ║
║   ISO: $(basename $ISO_FILE)
║   Size: $ISO_SIZE
║   Location: $OUT_DIR
║                                                                   ║
║   Flash to USB:                                                   ║
║   sudo dd if=$ISO_FILE of=/dev/sdX bs=4M status=progress          ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

#───────────────────────────────────────────────────────────────────
# Main
#───────────────────────────────────────────────────────────────────
main() {
    check_root
    check_deps
    prepare_env
    customize_profile
    add_packages
    configure_system
    build_iso
    finalize
}

# Run if not sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi

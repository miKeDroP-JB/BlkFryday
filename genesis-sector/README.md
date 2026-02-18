# VYRA: Genesis Sector

```
   ██╗   ██╗██╗   ██╗██████╗  █████╗
   ██║   ██║╚██╗ ██╔╝██╔══██╗██╔══██╗
   ██║   ██║ ╚████╔╝ ██████╔╝███████║
   ╚██╗ ██╔╝  ╚██╔╝  ██╔══██╗██╔══██║
    ╚████╔╝    ██║   ██║  ██║██║  ██║
     ╚═══╝     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝

   ════════════════════════════════════
       Portable AI Development Universe
   ════════════════════════════════════
```

**Bootable. Sovereign. Frictionless.**

A full-stack AI development realm that doesn't ask permission from Windows, Microsoft, or any corporate babysitter. Plug into any machine, boot into your world, build at light velocity.

## Features

### Core OS (Base Reality Layer)
- **Arch Linux** - Lean, fast, modular
- **Garuda Dragonized Interface** - Neon ritual visual aesthetic
- **BTRFS with snapshots** - Time travel for your filesystem
- **Full disk encryption** - LUKS2 optional

### Shell Environment (Command Layer)
**WarpDrive ZSH** with:
- Hyperspeed autosuggestions
- Command spellcasting (syntax highlighting)
- Stylized neon prompt (Starship)
- Agent hooks & swarm control shortcuts
- Spectral diagnostics

### Development Stack (Forge Layer)
Everything preinstalled:
- Node 22 + npm/yarn/pnpm/Bun
- Python 3.11 + Poetry + pip
- Rust + Cargo
- Go
- Docker + Podman
- Git with GPG signing
- VS Code + Neovim Ultra Mode
- Full LSP support

### AI Stack (Intelligence Layer)
- **Ollama** - Local LLM server
- **WhisperX** - Speech-to-text
- **Piper TTS** - Text-to-speech
- **LangChain & LlamaIndex** - AI frameworks
- **ChromaDB & FAISS** - Vector stores
- **VYRA Orchestrator** - Agent swarm management

### Visual + Ritual Layer
- Alchemical UI glyphs
- Reactive sigils
- Motion backgrounds with sacred geometry
- Dark neon terminal aesthetic
- Focus modes: Trance, Clarity, Summon

### Swarm Control Panel
- Visualize agents as nodes
- Drag-link communication channels
- Real-time throughput monitoring
- Memory heatmaps
- Timeline navigation

### VYRA: Channel 0
Your personal intent interface:
- Context persistence
- Command transformations
- MACROS: `build server`, `deploy swarm`, `spin node`, `summon agent`

## Quick Start

### Build the ISO

```bash
# Clone and enter
cd genesis-sector

# Build the ISO (requires Arch Linux host)
./build.sh iso

# Output: output/genesis-sector-YYYY.MM.DD-x86_64.iso
```

### Write to USB

```bash
# Write to USB drive (WARNING: destroys all data)
./build.sh usb /dev/sdX
```

### Boot and Install

1. Boot from USB
2. Run `genesis-install` for full installation
3. Or use live environment directly

## Directory Structure

```
genesis-sector/
├── iso-profile/              # Archiso profile
│   ├── profiledef.sh         # ISO configuration
│   ├── packages.x86_64       # Package manifest
│   ├── pacman.conf           # Pacman configuration
│   └── airootfs/             # Root filesystem overlay
│       ├── etc/
│       │   ├── vyra/         # VYRA configuration
│       │   ├── skel/         # User skeleton
│       │   └── systemd/      # Services
│       └── usr/local/bin/    # VYRA binaries
├── install-scripts/          # Installation automation
│   ├── genesis-install.sh    # Full system installer
│   └── ai-stack-installer.sh # AI component installer
├── garuda-skin/              # Theme files
│   ├── plasma/               # KDE Plasma colors
│   ├── kvantum/              # Kvantum theme
│   └── gtk/                  # GTK theme
├── swarm-panel/              # Agent control GUI
│   └── src/main.py           # PyQt6 application
├── visual-layer/             # Visual ritual components
│   ├── vyra-visual-engine.py # Background/glyph engine
│   ├── themes/               # CSS themes
│   └── glyphs/               # Glyph definitions
├── build.sh                  # Master build script
└── README.md                 # This file
```

## VYRA CLI Commands

```bash
# Enter Channel 0 (interactive mode)
vyra

# Or use direct commands
vyra channel 0       # Interactive intent interface
vyra swarm status    # Check swarm status
vyra swarm deploy    # Deploy agent swarm
vyra agent spawn     # Summon new agent
vyra agent list      # List active agents
vyra focus trance    # Enter focus trance mode
vyra focus clarity   # Enter clarity mode (debugging)
vyra ask "question"  # Query local AI
```

## Shell Aliases

```bash
# Swarm shortcuts
swarm-status        # vyra swarm status
swarm-log          # vyra swarm logs --follow
summon-agent       # vyra agent spawn

# Focus modes
focus-trance       # vyra focus --mode trance
clarity-pulse      # vyra focus --mode clarity

# Build commands
build-server       # vyra build --type server
deploy-swarm       # vyra swarm deploy
spin-node          # vyra node create

# AI shortcuts
ollama-run         # ollama run
ollama-list        # ollama list
```

## Portability

Genesis Sector runs from:
- USB-C SSD (recommended)
- NVMe enclosure
- External HDD
- Any USB drive (slower but works)

Plug into any x86_64 machine with UEFI. Boot into your world.

## System Requirements

**Minimum:**
- 4GB RAM
- 32GB storage
- x86_64 CPU
- UEFI boot

**Recommended:**
- 16GB+ RAM
- 256GB+ NVMe SSD
- Modern GPU (NVIDIA for CUDA)
- 8+ core CPU

## Building from Arch Linux

```bash
# Install dependencies
sudo pacman -S archiso squashfs-tools libisoburn grub

# Clone this repository
git clone <repo>
cd genesis-sector

# Build
./build.sh all
```

## Customization

### Add packages
Edit `iso-profile/packages.x86_64`

### Modify shell config
Edit `iso-profile/airootfs/etc/skel/.zshrc`

### Change theme colors
Edit `garuda-skin/plasma/vyra-neon.colors`

### Add macros
Edit `iso-profile/airootfs/etc/vyra/macros.yaml`

## License

MIT License - Build freely, modify freely, deploy freely.

## Credits

Built with:
- Arch Linux
- archiso
- Garuda Linux (inspiration)
- Tokyo Night color scheme (inspiration)
- The open source AI community

---

```
⟡ VYRA: Genesis Sector
  Bootable. Sovereign. Frictionless.
```

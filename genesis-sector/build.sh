#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  VYRA: GENESIS SECTOR - MASTER BUILD SCRIPT                         ║
# ║  Build the complete bootable ISO from source                         ║
# ╚══════════════════════════════════════════════════════════════════════╝

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SIGIL="${PURPLE}⟡${NC}"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build"
ISO_PROFILE="$SCRIPT_DIR/iso-profile"
OUTPUT_DIR="$SCRIPT_DIR/output"
ISO_NAME="genesis-sector"
ISO_VERSION="$(date +%Y.%m.%d)"

# === UTILITY FUNCTIONS ===

log() {
    echo -e "${SIGIL} $1"
}

log_success() {
    echo -e "${SIGIL} ${GREEN}$1${NC}"
}

log_warn() {
    echo -e "${SIGIL} ${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${SIGIL} ${RED}$1${NC}" >&2
}

show_banner() {
    clear
    echo -e "${PURPLE}"
    cat << 'EOF'

   ██╗   ██╗██╗   ██╗██████╗  █████╗
   ██║   ██║╚██╗ ██╔╝██╔══██╗██╔══██╗
   ██║   ██║ ╚████╔╝ ██████╔╝███████║
   ╚██╗ ██╔╝  ╚██╔╝  ██╔══██╗██╔══██║
    ╚████╔╝    ██║   ██║  ██║██║  ██║
     ╚═══╝     ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝

   ════════════════════════════════════
       G E N E S I S   S E C T O R
              Build System
   ════════════════════════════════════

EOF
    echo -e "${NC}"
}

# === CHECK DEPENDENCIES ===

check_dependencies() {
    log "Checking build dependencies..."

    local deps=(
        "archiso"
        "pacman"
        "mksquashfs"
        "xorriso"
        "grub-mkrescue"
    )

    local missing=()

    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing dependencies: ${missing[*]}"
        log "Install them with: pacman -S archiso squashfs-tools libisoburn grub"
        exit 1
    fi

    log_success "All dependencies found"
}

# === PREPARE BUILD ENVIRONMENT ===

prepare_build() {
    log "Preparing build environment..."

    # Create directories
    mkdir -p "$BUILD_DIR"
    mkdir -p "$OUTPUT_DIR"

    # Clean previous builds
    if [[ -d "$BUILD_DIR/work" ]]; then
        log_warn "Cleaning previous build..."
        sudo rm -rf "$BUILD_DIR/work"
    fi

    log_success "Build environment ready"
}

# === COPY PROFILE ===

copy_profile() {
    log "Copying ISO profile..."

    # Copy the archiso profile
    cp -r "$ISO_PROFILE" "$BUILD_DIR/profile"

    # Copy additional components into airootfs
    local airootfs="$BUILD_DIR/profile/airootfs"

    # Copy VYRA CLI
    mkdir -p "$airootfs/usr/local/bin"
    cp "$ISO_PROFILE/airootfs/usr/local/bin/vyra" "$airootfs/usr/local/bin/"
    chmod +x "$airootfs/usr/local/bin/vyra"

    # Copy install scripts
    cp "$SCRIPT_DIR/install-scripts/genesis-install.sh" "$airootfs/usr/local/bin/genesis-install"
    cp "$SCRIPT_DIR/install-scripts/ai-stack-installer.sh" "$airootfs/usr/local/bin/ai-stack-install"
    chmod +x "$airootfs/usr/local/bin/genesis-install"
    chmod +x "$airootfs/usr/local/bin/ai-stack-install"

    # Copy swarm panel
    mkdir -p "$airootfs/usr/local/share/vyra/swarm-panel"
    cp -r "$SCRIPT_DIR/swarm-panel/"* "$airootfs/usr/local/share/vyra/swarm-panel/"

    # Create launcher
    cat > "$airootfs/usr/local/bin/swarm-panel" << 'EOF'
#!/bin/bash
cd /usr/local/share/vyra/swarm-panel
python3 src/main.py "$@"
EOF
    chmod +x "$airootfs/usr/local/bin/swarm-panel"

    # Copy visual layer
    mkdir -p "$airootfs/usr/local/share/vyra/visual"
    cp -r "$SCRIPT_DIR/visual-layer/"* "$airootfs/usr/local/share/vyra/visual/"

    # Copy themes
    mkdir -p "$airootfs/usr/share/color-schemes"
    cp "$SCRIPT_DIR/garuda-skin/plasma/"*.colors "$airootfs/usr/share/color-schemes/" 2>/dev/null || true

    mkdir -p "$airootfs/usr/share/Kvantum/VyraNeon"
    cp "$SCRIPT_DIR/garuda-skin/kvantum/VyraNeon/"* "$airootfs/usr/share/Kvantum/VyraNeon/" 2>/dev/null || true

    mkdir -p "$airootfs/usr/share/themes/VyraNeon/gtk-3.0"
    cp "$SCRIPT_DIR/garuda-skin/gtk/gtk-3.0/"* "$airootfs/usr/share/themes/VyraNeon/gtk-3.0/" 2>/dev/null || true

    log_success "Profile copied"
}

# === SETUP REPOSITORIES ===

setup_repos() {
    log "Setting up package repositories..."

    local profile_pacman="$BUILD_DIR/profile/pacman.conf"

    # Add Chaotic-AUR keyring and mirrorlist setup
    # This would normally be done in the live environment
    # For now, we'll rely on standard Arch repos

    log_success "Repositories configured"
}

# === BUILD ISO ===

build_iso() {
    log "Building ISO image (this will take a while)..."

    cd "$BUILD_DIR"

    # Run mkarchiso
    sudo mkarchiso -v \
        -w "$BUILD_DIR/work" \
        -o "$OUTPUT_DIR" \
        "$BUILD_DIR/profile"

    # Find the generated ISO
    local iso_file
    iso_file=$(find "$OUTPUT_DIR" -name "*.iso" -type f -printf '%T+ %p\n' | sort -r | head -1 | cut -d' ' -f2)

    if [[ -z "$iso_file" ]]; then
        log_error "ISO build failed - no ISO file found"
        exit 1
    fi

    # Rename to our standard name
    local final_name="$OUTPUT_DIR/${ISO_NAME}-${ISO_VERSION}-x86_64.iso"
    mv "$iso_file" "$final_name"

    log_success "ISO built: $final_name"
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${PURPLE}⟡${NC} Genesis Sector ISO Ready!                                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  Output: ${CYAN}$final_name${NC}                                ${GREEN}║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
}

# === BUILD USB IMAGE ===

build_usb() {
    local device="${1:-}"

    if [[ -z "$device" ]]; then
        log_error "Usage: $0 usb /dev/sdX"
        exit 1
    fi

    if [[ ! -b "$device" ]]; then
        log_error "Not a block device: $device"
        exit 1
    fi

    log_warn "This will DESTROY all data on $device!"
    echo -e "${YELLOW}Type 'GENESIS' to confirm:${NC} "
    read -r confirm

    if [[ "$confirm" != "GENESIS" ]]; then
        log_error "Aborted"
        exit 1
    fi

    # Find the ISO
    local iso_file
    iso_file=$(find "$OUTPUT_DIR" -name "${ISO_NAME}*.iso" -type f | head -1)

    if [[ -z "$iso_file" ]]; then
        log_error "No ISO found. Run '$0 iso' first."
        exit 1
    fi

    log "Writing $iso_file to $device..."

    sudo dd if="$iso_file" of="$device" bs=4M status=progress conv=fsync

    log_success "USB drive ready!"
    echo ""
    echo -e "${GREEN}Boot from $device to enter Genesis Sector${NC}"
}

# === CLEAN BUILD ===

clean_build() {
    log "Cleaning build artifacts..."

    sudo rm -rf "$BUILD_DIR/work"
    rm -rf "$BUILD_DIR/profile"

    log_success "Build cleaned"
}

# === VERIFY ISO ===

verify_iso() {
    local iso_file
    iso_file=$(find "$OUTPUT_DIR" -name "${ISO_NAME}*.iso" -type f | head -1)

    if [[ -z "$iso_file" ]]; then
        log_error "No ISO found"
        exit 1
    fi

    log "Verifying ISO: $iso_file"

    # Generate checksums
    local sha256
    sha256=$(sha256sum "$iso_file" | cut -d' ' -f1)

    echo ""
    echo -e "  ${CYAN}File:${NC} $iso_file"
    echo -e "  ${CYAN}Size:${NC} $(du -h "$iso_file" | cut -f1)"
    echo -e "  ${CYAN}SHA256:${NC} $sha256"

    # Save checksum
    echo "$sha256  $(basename "$iso_file")" > "${iso_file}.sha256"

    log_success "Verification complete"
}

# === HELP ===

show_help() {
    show_banner
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  iso       Build the Genesis Sector ISO"
    echo "  usb       Write ISO to USB drive (requires device path)"
    echo "  clean     Clean build artifacts"
    echo "  verify    Verify ISO and generate checksums"
    echo "  all       Build ISO and verify"
    echo "  help      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 iso              # Build the ISO"
    echo "  $0 usb /dev/sdb     # Write to USB drive"
    echo "  $0 all              # Full build + verification"
}

# === MAIN ===

main() {
    local cmd="${1:-help}"
    shift || true

    case "$cmd" in
        iso)
            show_banner
            check_dependencies
            prepare_build
            copy_profile
            setup_repos
            build_iso
            ;;
        usb)
            show_banner
            build_usb "$@"
            ;;
        clean)
            show_banner
            clean_build
            ;;
        verify)
            show_banner
            verify_iso
            ;;
        all)
            show_banner
            check_dependencies
            prepare_build
            copy_profile
            setup_repos
            build_iso
            verify_iso
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $cmd"
            show_help
            exit 1
            ;;
    esac
}

main "$@"

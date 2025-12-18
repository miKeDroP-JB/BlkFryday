#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  VYRA: GENESIS SECTOR - SYSTEM INSTALLER                            ║
# ║  Transform any drive into a sovereign development universe          ║
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
LOG_FILE="/tmp/genesis-install.log"

# === UTILITY FUNCTIONS ===

log() {
    echo -e "${SIGIL} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
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
        Installation System v1.0
   ════════════════════════════════════

EOF
    echo -e "${NC}"
}

# === DISK DETECTION ===

detect_disks() {
    log "Detecting available disks..."
    echo ""
    lsblk -d -o NAME,SIZE,TYPE,MODEL | grep -E "disk" | head -20
    echo ""
}

select_disk() {
    detect_disks

    echo -e "${CYAN}Enter target disk (e.g., sda, nvme0n1):${NC} "
    read -r TARGET_DISK

    if [[ ! -b "/dev/$TARGET_DISK" ]]; then
        log_error "Invalid disk: /dev/$TARGET_DISK"
        exit 1
    fi

    log_warn "WARNING: All data on /dev/$TARGET_DISK will be destroyed!"
    echo -e "${YELLOW}Type 'GENESIS' to confirm:${NC} "
    read -r confirm

    if [[ "$confirm" != "GENESIS" ]]; then
        log_error "Installation cancelled"
        exit 1
    fi

    DISK="/dev/$TARGET_DISK"
}

# === PARTITIONING ===

partition_disk() {
    log "Partitioning $DISK..."

    # Unmount any existing partitions
    umount "${DISK}"* 2>/dev/null || true

    # Wipe existing partition table
    wipefs -a "$DISK"

    # Create GPT partition table
    parted -s "$DISK" mklabel gpt

    # EFI partition (512MB)
    parted -s "$DISK" mkpart primary fat32 1MiB 513MiB
    parted -s "$DISK" set 1 esp on

    # Root partition (remaining space)
    parted -s "$DISK" mkpart primary btrfs 513MiB 100%

    # Determine partition names
    if [[ "$DISK" =~ "nvme" ]]; then
        EFI_PART="${DISK}p1"
        ROOT_PART="${DISK}p2"
    else
        EFI_PART="${DISK}1"
        ROOT_PART="${DISK}2"
    fi

    log_success "Partitioning complete"
}

# === ENCRYPTION (OPTIONAL) ===

setup_encryption() {
    echo -e "${CYAN}Enable LUKS encryption? (y/N):${NC} "
    read -r enable_encryption

    if [[ "$enable_encryption" =~ ^[Yy]$ ]]; then
        log "Setting up LUKS encryption..."

        cryptsetup luksFormat --type luks2 "$ROOT_PART"
        cryptsetup open "$ROOT_PART" vyra-root

        ROOT_PART="/dev/mapper/vyra-root"
        ENCRYPTED=true

        log_success "Encryption enabled"
    else
        ENCRYPTED=false
    fi
}

# === FILESYSTEM SETUP ===

setup_filesystems() {
    log "Creating filesystems..."

    # Format EFI partition
    mkfs.fat -F32 "$EFI_PART"

    # Format root partition with btrfs
    mkfs.btrfs -f -L VYRA_ROOT "$ROOT_PART"

    # Mount root
    mount "$ROOT_PART" /mnt

    # Create btrfs subvolumes
    btrfs subvolume create /mnt/@
    btrfs subvolume create /mnt/@home
    btrfs subvolume create /mnt/@snapshots
    btrfs subvolume create /mnt/@cache
    btrfs subvolume create /mnt/@log
    btrfs subvolume create /mnt/@vyra

    # Unmount and remount with subvolumes
    umount /mnt

    mount -o noatime,compress=zstd,space_cache=v2,subvol=@ "$ROOT_PART" /mnt

    mkdir -p /mnt/{boot/efi,home,.snapshots,var/cache,var/log,var/lib/vyra}

    mount -o noatime,compress=zstd,space_cache=v2,subvol=@home "$ROOT_PART" /mnt/home
    mount -o noatime,compress=zstd,space_cache=v2,subvol=@snapshots "$ROOT_PART" /mnt/.snapshots
    mount -o noatime,compress=zstd,space_cache=v2,subvol=@cache "$ROOT_PART" /mnt/var/cache
    mount -o noatime,compress=zstd,space_cache=v2,subvol=@log "$ROOT_PART" /mnt/var/log
    mount -o noatime,compress=zstd,space_cache=v2,subvol=@vyra "$ROOT_PART" /mnt/var/lib/vyra

    # Mount EFI
    mount "$EFI_PART" /mnt/boot/efi

    log_success "Filesystems created"
}

# === BASE SYSTEM INSTALLATION ===

install_base() {
    log "Installing base system (this may take a while)..."

    # Update mirrorlist for fastest servers
    reflector --latest 20 --sort rate --save /etc/pacman.d/mirrorlist

    # Install base packages
    pacstrap /mnt base base-devel linux linux-firmware linux-headers \
        btrfs-progs grub efibootmgr \
        networkmanager iwd bluez bluez-utils \
        zsh git neovim sudo

    log_success "Base system installed"
}

# === SYSTEM CONFIGURATION ===

configure_system() {
    log "Configuring system..."

    # Generate fstab
    genfstab -U /mnt >> /mnt/etc/fstab

    # Set timezone
    arch-chroot /mnt ln -sf /usr/share/zoneinfo/UTC /etc/localtime
    arch-chroot /mnt hwclock --systohc

    # Set locale
    echo "en_US.UTF-8 UTF-8" >> /mnt/etc/locale.gen
    arch-chroot /mnt locale-gen
    echo "LANG=en_US.UTF-8" > /mnt/etc/locale.conf

    # Set hostname
    echo "genesis-sector" > /mnt/etc/hostname
    cat > /mnt/etc/hosts << EOF
127.0.0.1   localhost
::1         localhost
127.0.1.1   genesis-sector.localdomain genesis-sector
EOF

    # Configure mkinitcpio for btrfs
    sed -i 's/^HOOKS=.*/HOOKS=(base udev autodetect modconf kms keyboard keymap consolefont block filesystems fsck)/' /mnt/etc/mkinitcpio.conf

    if [[ "$ENCRYPTED" == true ]]; then
        sed -i 's/^HOOKS=.*/HOOKS=(base udev autodetect modconf kms keyboard keymap consolefont block encrypt filesystems fsck)/' /mnt/etc/mkinitcpio.conf
    fi

    arch-chroot /mnt mkinitcpio -P

    # Install and configure GRUB
    arch-chroot /mnt grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=VYRA

    if [[ "$ENCRYPTED" == true ]]; then
        ROOT_UUID=$(blkid -s UUID -o value "$ROOT_PART")
        sed -i "s/^GRUB_CMDLINE_LINUX=.*/GRUB_CMDLINE_LINUX=\"cryptdevice=UUID=$ROOT_UUID:vyra-root root=\/dev\/mapper\/vyra-root\"/" /mnt/etc/default/grub
    fi

    arch-chroot /mnt grub-mkconfig -o /boot/grub/grub.cfg

    # Enable services
    arch-chroot /mnt systemctl enable NetworkManager
    arch-chroot /mnt systemctl enable bluetooth

    log_success "System configured"
}

# === USER SETUP ===

setup_user() {
    log "Setting up user..."

    echo -e "${CYAN}Enter username:${NC} "
    read -r USERNAME

    arch-chroot /mnt useradd -m -G wheel,audio,video,storage,docker -s /bin/zsh "$USERNAME"

    log "Set password for $USERNAME:"
    arch-chroot /mnt passwd "$USERNAME"

    log "Set root password:"
    arch-chroot /mnt passwd

    # Enable sudo for wheel group
    echo "%wheel ALL=(ALL:ALL) ALL" >> /mnt/etc/sudoers.d/wheel

    log_success "User created"
}

# === VYRA INSTALLATION ===

install_vyra() {
    log "Installing VYRA Genesis Sector components..."

    # Copy VYRA configuration
    cp -r "$SCRIPT_DIR/../iso-profile/airootfs/etc/vyra" /mnt/etc/
    cp "$SCRIPT_DIR/../iso-profile/airootfs/usr/local/bin/vyra" /mnt/usr/local/bin/
    chmod +x /mnt/usr/local/bin/vyra

    # Copy shell configuration
    cp "$SCRIPT_DIR/../iso-profile/airootfs/etc/skel/.zshrc" /mnt/home/$USERNAME/
    cp -r "$SCRIPT_DIR/../iso-profile/airootfs/etc/skel/.config" /mnt/home/$USERNAME/

    # Create VYRA directories
    mkdir -p /mnt/var/lib/vyra/{agents,models,swarm,channel_0}
    mkdir -p /mnt/home/$USERNAME/.vyra/{bin,hooks,cache}

    # Set ownership
    arch-chroot /mnt chown -R "$USERNAME:$USERNAME" "/home/$USERNAME"

    log_success "VYRA components installed"
}

# === DESKTOP ENVIRONMENT ===

install_desktop() {
    log "Installing desktop environment..."

    arch-chroot /mnt pacman -S --noconfirm \
        plasma-meta kde-applications-meta sddm \
        kvantum latte-dock \
        kitty firefox chromium \
        ttf-jetbrains-mono-nerd ttf-fira-code noto-fonts noto-fonts-emoji

    # Enable SDDM
    arch-chroot /mnt systemctl enable sddm

    # Copy theme files
    cp -r "$SCRIPT_DIR/../garuda-skin/plasma/"* /mnt/usr/share/color-schemes/
    cp -r "$SCRIPT_DIR/../garuda-skin/kvantum/"* /mnt/usr/share/Kvantum/
    mkdir -p /mnt/usr/share/themes/VyraNeon
    cp -r "$SCRIPT_DIR/../garuda-skin/gtk/"* /mnt/usr/share/themes/VyraNeon/

    log_success "Desktop environment installed"
}

# === AI STACK ===

install_ai_stack() {
    log "Installing AI development stack..."

    # Run AI stack installer
    bash "$SCRIPT_DIR/ai-stack-installer.sh" --chroot /mnt --user "$USERNAME"

    log_success "AI stack installed"
}

# === DEVELOPMENT TOOLS ===

install_dev_tools() {
    log "Installing development tools..."

    arch-chroot /mnt pacman -S --noconfirm \
        nodejs npm yarn \
        python python-pip python-poetry \
        rust cargo \
        go \
        docker docker-compose podman \
        code neovim \
        git git-lfs lazygit \
        cmake ninja meson \
        ripgrep fd bat exa fzf zoxide \
        htop btop nvtop

    # Enable Docker
    arch-chroot /mnt systemctl enable docker
    arch-chroot /mnt usermod -aG docker "$USERNAME"

    log_success "Development tools installed"
}

# === FINAL STEPS ===

finalize() {
    log "Finalizing installation..."

    # Create first-boot script
    cat > /mnt/etc/vyra/first-boot.sh << 'FIRSTBOOT'
#!/bin/bash
# VYRA First Boot Setup

# Install AUR helper
if ! command -v yay &> /dev/null; then
    git clone https://aur.archlinux.org/yay.git /tmp/yay
    cd /tmp/yay && makepkg -si --noconfirm
    rm -rf /tmp/yay
fi

# Install additional AUR packages
yay -S --noconfirm \
    visual-studio-code-bin \
    bun-bin \
    pnpm

# Remove first-boot script
rm /etc/vyra/first-boot.sh
systemctl disable vyra-first-boot.service

echo "VYRA Genesis Sector: First boot complete!"
FIRSTBOOT
    chmod +x /mnt/etc/vyra/first-boot.sh

    # Create first-boot service
    cat > /mnt/etc/systemd/system/vyra-first-boot.service << 'SERVICE'
[Unit]
Description=VYRA Genesis Sector First Boot
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/etc/vyra/first-boot.sh
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
SERVICE
    arch-chroot /mnt systemctl enable vyra-first-boot.service

    # Unmount
    umount -R /mnt

    if [[ "$ENCRYPTED" == true ]]; then
        cryptsetup close vyra-root
    fi

    log_success "Installation complete!"
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  ${PURPLE}⟡${NC} VYRA: GENESIS SECTOR installed successfully!               ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}                                                                    ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  Remove installation media and reboot to enter your new realm.    ${GREEN}║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# === MAIN ===

main() {
    show_banner

    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi

    # Check if running from live environment
    if [[ ! -d /run/archiso ]]; then
        log_warn "Not running from Arch ISO live environment"
        echo -e "${YELLOW}Continue anyway? (y/N):${NC} "
        read -r continue_anyway
        [[ ! "$continue_anyway" =~ ^[Yy]$ ]] && exit 1
    fi

    select_disk
    partition_disk
    setup_encryption
    setup_filesystems
    install_base
    configure_system
    setup_user
    install_vyra
    install_desktop
    install_dev_tools
    install_ai_stack
    finalize
}

main "$@"

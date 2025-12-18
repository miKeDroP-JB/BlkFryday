#!/bin/bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  0RB BOOTABLE DRIVE INSTALLER                                             ║
# ║  Run this from ANY Linux live USB to create your bootable 0RB system      ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

set -e

echo "
╔═══════════════════════════════════════════════════════════════════════════╗
║                    0RB BOOTABLE DRIVE INSTALLER                           ║
║                                                                           ║
║  This will install a complete 0RB development environment on your drive  ║
║  WARNING: This will ERASE the target drive!                               ║
╚═══════════════════════════════════════════════════════════════════════════╝
"

# List available drives
echo "Available drives:"
lsblk -d -o NAME,SIZE,MODEL | grep -v loop
echo ""

read -p "Enter target drive (e.g., sdb, nvme0n1): " TARGET_DRIVE
TARGET="/dev/${TARGET_DRIVE}"

if [ ! -b "$TARGET" ]; then
    echo "❌ Drive $TARGET not found!"
    exit 1
fi

echo ""
echo "⚠️  WARNING: ALL DATA ON $TARGET WILL BE ERASED!"
read -p "Type 'YES' to continue: " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "🔧 Starting installation..."

# ═══════════════════════════════════════════════════════════════════════════
# PARTITION THE DRIVE
# ═══════════════════════════════════════════════════════════════════════════

echo "📦 Partitioning drive..."

# Wipe and create partitions
wipefs -a "$TARGET"
parted -s "$TARGET" mklabel gpt
parted -s "$TARGET" mkpart ESP fat32 1MiB 512MiB
parted -s "$TARGET" set 1 esp on
parted -s "$TARGET" mkpart primary ext4 512MiB 100%

# Determine partition names
if [[ "$TARGET" == *"nvme"* ]]; then
    BOOT_PART="${TARGET}p1"
    ROOT_PART="${TARGET}p2"
else
    BOOT_PART="${TARGET}1"
    ROOT_PART="${TARGET}2"
fi

# Format partitions
mkfs.fat -F32 "$BOOT_PART"
mkfs.ext4 -F "$ROOT_PART"

# Mount
mkdir -p /mnt/orb
mount "$ROOT_PART" /mnt/orb
mkdir -p /mnt/orb/boot
mount "$BOOT_PART" /mnt/orb/boot

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL BASE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

echo "📥 Installing base system (this takes a few minutes)..."

# Check if we're on Arch or need debootstrap
if command -v pacstrap &> /dev/null; then
    # Arch-based
    pacstrap /mnt/orb base linux linux-firmware networkmanager sudo git nodejs npm neovim zsh
    genfstab -U /mnt/orb >> /mnt/orb/etc/fstab

    # Install bootloader
    arch-chroot /mnt/orb bootctl install

    cat > /mnt/orb/boot/loader/entries/orb.conf << 'BOOTEOF'
title   0RB System
linux   /vmlinuz-linux
initrd  /initramfs-linux.img
options root=PARTUUID=REPLACE_ME rw
BOOTEOF

    # Replace PARTUUID
    ROOT_UUID=$(blkid -s PARTUUID -o value "$ROOT_PART")
    sed -i "s/REPLACE_ME/$ROOT_UUID/" /mnt/orb/boot/loader/entries/orb.conf

elif command -v debootstrap &> /dev/null; then
    # Debian-based
    debootstrap --arch amd64 bookworm /mnt/orb http://deb.debian.org/debian

    # Mount necessary filesystems
    mount --bind /dev /mnt/orb/dev
    mount --bind /proc /mnt/orb/proc
    mount --bind /sys /mnt/orb/sys

    # Install packages
    chroot /mnt/orb apt-get update
    chroot /mnt/orb apt-get install -y linux-image-amd64 grub-efi-amd64 \
        networkmanager sudo git curl neovim zsh

    # Install Node.js
    chroot /mnt/orb bash -c "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
    chroot /mnt/orb apt-get install -y nodejs

    # Install bootloader
    chroot /mnt/orb grub-install --target=x86_64-efi --efi-directory=/boot --removable
    chroot /mnt/orb grub-mkconfig -o /boot/grub/grub.cfg
else
    echo "❌ No supported package manager found. Run from Arch or Debian live USB."
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

echo "⚙️ Configuring system..."

# Set hostname
echo "orb" > /mnt/orb/etc/hostname

# Create user
arch-chroot /mnt/orb useradd -m -G wheel -s /bin/zsh orb 2>/dev/null || \
    chroot /mnt/orb useradd -m -G sudo -s /bin/zsh orb
echo "orb:orb" | arch-chroot /mnt/orb chpasswd 2>/dev/null || \
    echo "orb:orb" | chroot /mnt/orb chpasswd

# Enable sudo
echo "%wheel ALL=(ALL) NOPASSWD: ALL" > /mnt/orb/etc/sudoers.d/wheel 2>/dev/null || \
    echo "%sudo ALL=(ALL) NOPASSWD: ALL" > /mnt/orb/etc/sudoers.d/sudo

# Enable NetworkManager
arch-chroot /mnt/orb systemctl enable NetworkManager 2>/dev/null || \
    chroot /mnt/orb systemctl enable NetworkManager

# ═══════════════════════════════════════════════════════════════════════════
# INSTALL 0RB SYSTEM
# ═══════════════════════════════════════════════════════════════════════════

echo "🚀 Installing 0RB System..."

# Clone repo
git clone https://github.com/miKeDroP-JB/BlkFryday.git /mnt/orb/home/orb/0RB
cd /mnt/orb/home/orb/0RB
git checkout claude/setup-arch-linux-build-014XR2gMNRFHmYMW4ucWJ58b

# Set ownership
arch-chroot /mnt/orb chown -R orb:orb /home/orb/0RB 2>/dev/null || \
    chroot /mnt/orb chown -R orb:orb /home/orb/0RB

# Install npm dependencies (as user)
arch-chroot /mnt/orb su - orb -c "cd /home/orb/0RB && npm install" 2>/dev/null || \
    chroot /mnt/orb su - orb -c "cd /home/orb/0RB && npm install"

# Create .env template
cat > /mnt/orb/home/orb/0RB/.env << 'ENVEOF'
# Add your API key here:
ANTHROPIC_API_KEY=
# OR
OPENAI_API_KEY=
ENVEOF

# ═══════════════════════════════════════════════════════════════════════════
# AUTO-START CONFIG
# ═══════════════════════════════════════════════════════════════════════════

echo "🔄 Configuring auto-start..."

# Create auto-start script
cat > /mnt/orb/home/orb/.zshrc << 'ZSHEOF'
# 0RB System Auto-Start
if [ -z "$ORB_STARTED" ]; then
    export ORB_STARTED=1
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                         0RB SYSTEM READY                                  ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Commands:"
    echo "  orb        - Start interactive REPL"
    echo "  orb-auto   - Run daily automation"
    echo "  orb-test   - Run tests"
    echo ""
    cd ~/0RB
fi

alias orb="cd ~/0RB && npm start"
alias orb-auto="cd ~/0RB && npm run automate"
alias orb-test="cd ~/0RB && npm test"
ZSHEOF

# ═══════════════════════════════════════════════════════════════════════════
# CLEANUP
# ═══════════════════════════════════════════════════════════════════════════

echo "🧹 Cleaning up..."

umount -R /mnt/orb 2>/dev/null || true

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ INSTALLATION COMPLETE!                              ║"
echo "╠═══════════════════════════════════════════════════════════════════════════╣"
echo "║                                                                           ║"
echo "║  1. Remove this USB and reboot                                            ║"
echo "║  2. Select your new drive in BIOS boot menu                               ║"
echo "║  3. Login: orb / orb                                                      ║"
echo "║  4. Edit ~/.env and add your API key                                      ║"
echo "║  5. Type 'orb' to start!                                                  ║"
echo "║                                                                           ║"
echo "╚═══════════════════════════════════════════════════════════════════════════╝"

#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# 0RB SYSTEM - EXTERNAL DRIVE INSTALLER
# Creates bootable Arch Linux on external drive for Lenovo machines
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "   ██████╗ ██████╗ ██████╗     ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗"
echo "  ██╔═████╗██╔══██╗██╔══██╗    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║"
echo "  ██║██╔██║██████╔╝██████╔╝    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║"
echo "  ████╔╝██║██╔══██╗██╔══██╗    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║"
echo "  ╚██████╔╝██║  ██║██████╔╝    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║"
echo "   ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "                    EXTERNAL DRIVE INSTALLER FOR LENOVO"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# PREFLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════════════════════

# Must be root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR] Please run as root: sudo $0${NC}"
    exit 1
fi

# Check for required tools
REQUIRED_TOOLS="parted mkfs.fat mkfs.ext4 pacstrap arch-chroot genfstab"
for tool in $REQUIRED_TOOLS; do
    if ! command -v $tool &> /dev/null; then
        echo -e "${YELLOW}[WARN] $tool not found. Installing...${NC}"
        pacman -Sy --noconfirm arch-install-scripts dosfstools || {
            echo -e "${RED}[ERROR] Failed to install required tools. Are you on Arch Linux?${NC}"
            exit 1
        }
    fi
done

# ═══════════════════════════════════════════════════════════════════════════════
# DRIVE SELECTION
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "\n${CYAN}[*] Detecting drives...${NC}\n"

# List drives
echo "Available drives:"
echo "─────────────────────────────────────────────────────────────────"
lsblk -d -o NAME,SIZE,TYPE,MODEL,TRAN | grep -E "disk|NAME"
echo "─────────────────────────────────────────────────────────────────"

echo ""
echo -e "${YELLOW}[!] IMPORTANT: Select your EXTERNAL drive (probably USB/1TB)${NC}"
echo -e "${RED}[!] WARNING: ALL DATA ON SELECTED DRIVE WILL BE ERASED${NC}"
echo ""

read -p "Enter drive name (e.g., sdb, sdc - WITHOUT /dev/): " DRIVE

if [ -z "$DRIVE" ]; then
    echo -e "${RED}[ERROR] No drive specified${NC}"
    exit 1
fi

DRIVE_PATH="/dev/${DRIVE}"

# Verify drive exists
if [ ! -b "$DRIVE_PATH" ]; then
    echo -e "${RED}[ERROR] Drive $DRIVE_PATH does not exist${NC}"
    exit 1
fi

# Get drive info
DRIVE_SIZE=$(lsblk -d -o SIZE -n $DRIVE_PATH | tr -d ' ')
DRIVE_MODEL=$(lsblk -d -o MODEL -n $DRIVE_PATH | tr -d ' ')

echo ""
echo -e "${CYAN}Selected drive:${NC}"
echo "  Path: $DRIVE_PATH"
echo "  Size: $DRIVE_SIZE"
echo "  Model: $DRIVE_MODEL"
echo ""

# Triple confirmation for safety
echo -e "${RED}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}  WARNING: This will COMPLETELY ERASE $DRIVE_PATH ($DRIVE_SIZE)${NC}"
echo -e "${RED}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
read -p "Type 'YES' to confirm: " CONFIRM1
if [ "$CONFIRM1" != "YES" ]; then
    echo "Aborted."
    exit 1
fi

read -p "Type the drive name again to confirm ($DRIVE): " CONFIRM2
if [ "$CONFIRM2" != "$DRIVE" ]; then
    echo "Drive name mismatch. Aborted."
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}[*] System Configuration${NC}"
echo ""

read -p "Hostname [0rb-system]: " HOSTNAME
HOSTNAME=${HOSTNAME:-0rb-system}

read -p "Username [orb]: " USERNAME
USERNAME=${USERNAME:-orb}

read -s -p "Password for $USERNAME: " PASSWORD
echo ""
read -s -p "Confirm password: " PASSWORD_CONFIRM
echo ""

if [ "$PASSWORD" != "$PASSWORD_CONFIRM" ]; then
    echo -e "${RED}[ERROR] Passwords do not match${NC}"
    exit 1
fi

read -p "Timezone [America/New_York]: " TIMEZONE
TIMEZONE=${TIMEZONE:-America/New_York}

# Swap size (recommended: equal to RAM for hibernation)
RAM_SIZE=$(free -g | awk '/^Mem:/{print $2}')
read -p "Swap size in GB [$RAM_SIZE]: " SWAP_SIZE
SWAP_SIZE=${SWAP_SIZE:-$RAM_SIZE}

echo ""
echo -e "${CYAN}Configuration Summary:${NC}"
echo "  Drive: $DRIVE_PATH"
echo "  Hostname: $HOSTNAME"
echo "  Username: $USERNAME"
echo "  Timezone: $TIMEZONE"
echo "  Swap: ${SWAP_SIZE}GB"
echo ""

read -p "Proceed with installation? [y/N]: " PROCEED
if [[ ! "$PROCEED" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# PARTITIONING
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}[*] Partitioning drive...${NC}"

# Unmount any existing partitions
umount ${DRIVE_PATH}* 2>/dev/null || true
swapoff ${DRIVE_PATH}* 2>/dev/null || true

# Wipe existing partition table
wipefs -a $DRIVE_PATH

# Create GPT partition table
parted -s $DRIVE_PATH mklabel gpt

# Calculate partition sizes
# 1: EFI - 512MB
# 2: Swap - User specified
# 3: Root - Remaining space

EFI_END="513MiB"
SWAP_END="$((513 + (SWAP_SIZE * 1024)))MiB"

echo "  Creating EFI partition (512MB)..."
parted -s $DRIVE_PATH mkpart "EFI" fat32 1MiB $EFI_END
parted -s $DRIVE_PATH set 1 esp on
parted -s $DRIVE_PATH set 1 boot on

echo "  Creating swap partition (${SWAP_SIZE}GB)..."
parted -s $DRIVE_PATH mkpart "SWAP" linux-swap $EFI_END $SWAP_END

echo "  Creating root partition (remaining space)..."
parted -s $DRIVE_PATH mkpart "ROOT" ext4 $SWAP_END 100%

# Wait for kernel to recognize partitions
sleep 2
partprobe $DRIVE_PATH
sleep 2

# Define partition paths
EFI_PART="${DRIVE_PATH}1"
SWAP_PART="${DRIVE_PATH}2"
ROOT_PART="${DRIVE_PATH}3"

# Handle NVMe naming convention
if [[ "$DRIVE" == nvme* ]]; then
    EFI_PART="${DRIVE_PATH}p1"
    SWAP_PART="${DRIVE_PATH}p2"
    ROOT_PART="${DRIVE_PATH}p3"
fi

echo ""
echo -e "${GREEN}[✓] Partitioning complete${NC}"
lsblk $DRIVE_PATH

# ═══════════════════════════════════════════════════════════════════════════════
# FORMATTING
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}[*] Formatting partitions...${NC}"

echo "  Formatting EFI partition (FAT32)..."
mkfs.fat -F32 -n "EFI" $EFI_PART

echo "  Formatting swap partition..."
mkswap -L "SWAP" $SWAP_PART

echo "  Formatting root partition (ext4)..."
mkfs.ext4 -L "ROOT" -F $ROOT_PART

echo -e "${GREEN}[✓] Formatting complete${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# MOUNTING
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}[*] Mounting filesystems...${NC}"

MOUNT_POINT="/mnt"

mount $ROOT_PART $MOUNT_POINT
mkdir -p $MOUNT_POINT/boot/efi
mount $EFI_PART $MOUNT_POINT/boot/efi
swapon $SWAP_PART

echo -e "${GREEN}[✓] Filesystems mounted${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# BASE SYSTEM INSTALLATION
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}[*] Installing base system (this may take a while)...${NC}"

# Core packages
BASE_PACKAGES=(
    # Base system
    base
    base-devel
    linux
    linux-firmware
    linux-headers

    # Boot
    grub
    efibootmgr
    os-prober

    # Networking
    networkmanager
    wireless_tools
    wpa_supplicant
    dhcpcd

    # Essential tools
    sudo
    vim
    nano
    git
    curl
    wget
    htop
    neofetch

    # Filesystem
    ntfs-3g
    exfat-utils
    dosfstools

    # Hardware
    usbutils
    pciutils

    # For 0RB System
    python
    python-pip
    nodejs
    npm
    docker
    docker-compose
)

pacstrap $MOUNT_POINT "${BASE_PACKAGES[@]}"

echo -e "${GREEN}[✓] Base system installed${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}[*] Configuring system...${NC}"

# Generate fstab
echo "  Generating fstab..."
genfstab -U $MOUNT_POINT >> $MOUNT_POINT/etc/fstab

# Chroot and configure
echo "  Configuring in chroot..."

arch-chroot $MOUNT_POINT /bin/bash <<CHROOT_COMMANDS
# Timezone
ln -sf /usr/share/zoneinfo/$TIMEZONE /etc/localtime
hwclock --systohc

# Locale
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
echo "LANG=en_US.UTF-8" > /etc/locale.conf

# Hostname
echo "$HOSTNAME" > /etc/hostname
cat > /etc/hosts <<EOF
127.0.0.1   localhost
::1         localhost
127.0.1.1   $HOSTNAME.localdomain $HOSTNAME
EOF

# Create user
useradd -m -G wheel,docker -s /bin/bash $USERNAME
echo "$USERNAME:$PASSWORD" | chpasswd
echo "root:$PASSWORD" | chpasswd

# Sudo access
echo "%wheel ALL=(ALL:ALL) ALL" >> /etc/sudoers

# Enable services
systemctl enable NetworkManager
systemctl enable docker

# Initramfs
mkinitcpio -P

# GRUB bootloader - KEY FOR LENOVO/EXTERNAL DRIVE
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=0RB --removable --recheck

# Also install to fallback path (some Lenovo BIOS need this)
mkdir -p /boot/efi/EFI/BOOT
cp /boot/efi/EFI/0RB/grubx64.efi /boot/efi/EFI/BOOT/BOOTX64.EFI

# Configure GRUB
cat > /etc/default/grub <<EOF
GRUB_DEFAULT=0
GRUB_TIMEOUT=5
GRUB_DISTRIBUTOR="0RB System"
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"
GRUB_CMDLINE_LINUX=""
GRUB_PRELOAD_MODULES="part_gpt part_msdos"
GRUB_DISABLE_OS_PROBER=false
EOF

grub-mkconfig -o /boot/grub/grub.cfg

CHROOT_COMMANDS

echo -e "${GREEN}[✓] System configured${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# 0RB SYSTEM SETUP
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}[*] Setting up 0RB System environment...${NC}"

# Create 0RB directory structure
mkdir -p $MOUNT_POINT/home/$USERNAME/0rb-system
mkdir -p $MOUNT_POINT/home/$USERNAME/.config/0rb

# Create welcome script
cat > $MOUNT_POINT/home/$USERNAME/0rb-system/welcome.sh <<'EOF'
#!/bin/bash
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "   ██████╗ ██████╗ ██████╗     ███████╗██╗   ██╗███████╗████████╗███████╗███╗   ███╗"
echo "  ██╔═████╗██╔══██╗██╔══██╗    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝██╔════╝████╗ ████║"
echo "  ██║██╔██║██████╔╝██████╔╝    ███████╗ ╚████╔╝ ███████╗   ██║   █████╗  ██╔████╔██║"
echo "  ████╔╝██║██╔══██╗██╔══██╗    ╚════██║  ╚██╔╝  ╚════██║   ██║   ██╔══╝  ██║╚██╔╝██║"
echo "  ╚██████╔╝██║  ██║██████╔╝    ███████║   ██║   ███████║   ██║   ███████╗██║ ╚═╝ ██║"
echo "   ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚══════╝   ╚═╝   ╚══════╝   ╚═╝   ╚══════╝╚═╝     ╚═╝"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Welcome to 0RB System - Your Sovereign AI Platform"
echo ""
echo "  Quick Start:"
echo "    cd ~/0rb-system && ./setup.sh"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
EOF
chmod +x $MOUNT_POINT/home/$USERNAME/0rb-system/welcome.sh

# Create setup script for 0RB
cat > $MOUNT_POINT/home/$USERNAME/0rb-system/setup.sh <<'EOF'
#!/bin/bash
echo "[*] Setting up 0RB System..."

# Clone the repository
if [ ! -d "BlkFryday" ]; then
    git clone https://github.com/miKeDroP-JB/BlkFryday.git
fi

cd BlkFryday/fractal-memory-engine

# Install Python dependencies
pip install -r services/sovereign-ai/requirements.txt 2>/dev/null || true

# Install Ollama
if ! command -v ollama &> /dev/null; then
    echo "[*] Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
fi

# Pull base models
echo "[*] Pulling base models (this may take a while)..."
ollama pull mistral:7b-instruct-v0.2-q4_K_M
ollama pull llama3:8b-instruct-q8_0

echo ""
echo "[✓] 0RB System setup complete!"
echo ""
echo "Start the Sovereign AI Engine:"
echo "  cd BlkFryday/fractal-memory-engine/services/sovereign-ai"
echo "  python app.py"
echo ""
EOF
chmod +x $MOUNT_POINT/home/$USERNAME/0rb-system/setup.sh

# Add welcome to bashrc
echo "~/0rb-system/welcome.sh" >> $MOUNT_POINT/home/$USERNAME/.bashrc

# Fix ownership
arch-chroot $MOUNT_POINT chown -R $USERNAME:$USERNAME /home/$USERNAME

echo -e "${GREEN}[✓] 0RB System environment ready${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# CLEANUP
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${CYAN}[*] Cleaning up...${NC}"

# Unmount
umount -R $MOUNT_POINT
swapoff $SWAP_PART

echo -e "${GREEN}[✓] Cleanup complete${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# DONE
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}To boot on your Lenovo:${NC}"
echo ""
echo "  1. Plug in the external drive"
echo "  2. Power on and press F12 (or F2/Enter) for boot menu"
echo "  3. Select: '0RB' or 'USB HDD' or 'EFI: [your drive name]'"
echo "  4. If not showing, enter BIOS and:"
echo "     - Disable Secure Boot"
echo "     - Enable USB Boot"
echo "     - Set USB HDD as first boot priority"
echo ""
echo -e "  ${CYAN}Login:${NC}"
echo "    Username: $USERNAME"
echo "    Password: [the password you set]"
echo ""
echo -e "  ${CYAN}First boot:${NC}"
echo "    cd ~/0rb-system && ./setup.sh"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

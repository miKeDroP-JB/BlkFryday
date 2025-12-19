# 🔥 0RB SYSTEM - EXTERNAL SSD BOOT GUIDE

## The Goal
Boot from external SSD → Full AI factory ready → Build anything.

---

## OPTION 1: Fresh Linux Install on External SSD (Recommended)

### Step 1: Prepare the SSD
1. **Get a fast SSD** (NVMe in USB-C enclosure or Thunderbolt is best)
2. **Backup anything on it** (we're wiping it)

### Step 2: Create Bootable USB
Download one of these:
- **Arch Linux** (Most control): https://archlinux.org/download/
- **Endeavour OS** (Arch made easy): https://endeavouros.com/
- **Ubuntu** (Just works): https://ubuntu.com/download

Use **Ventoy** or **balenaEtcher** to flash to USB.

### Step 3: Boot & Install to External SSD
1. Plug in both: bootable USB + external SSD
2. Enter BIOS/UEFI (usually F2, F12, or DEL on boot)
3. Boot from USB
4. During install, **SELECT THE EXTERNAL SSD** as target (not your internal drive!)
5. Install with these options:
   - Encryption: Optional but recommended
   - Swap: 16GB (or 1.5x your RAM)
   - Filesystem: ext4 or btrfs

### Step 4: Configure Boot Order
After install:
1. Enter BIOS/UEFI again
2. Set external SSD as first boot device
3. Or use boot menu to select each time

### Step 5: Run 0RB Setup
Once booted into your new OS:
```bash
# Download and run setup
curl -sSL https://raw.githubusercontent.com/miKeDroP-JB/BlkFryday/main/setup/os-setup.sh | bash

# Or clone and run
git clone https://github.com/miKeDroP-JB/BlkFryday.git
cd BlkFryday/setup
chmod +x os-setup.sh
./os-setup.sh
```

### Step 6: Add Your API Keys
```bash
nano ~/.orb-env

# Add your keys:
export ANTHROPIC_API_KEY="sk-ant-..."
export OPENAI_API_KEY="sk-..."
```

### Step 7: Launch
```bash
source ~/.zshrc
orb-start
```

---

## OPTION 2: Portable Linux (No Install)

Use a **persistent live USB** that saves your data:

### Ventoy + Persistence
1. Install Ventoy on your SSD: https://ventoy.net/
2. Copy a Linux ISO to the SSD
3. Create persistence file:
   ```bash
   sudo dd if=/dev/zero of=persistence.dat bs=1G count=50
   sudo mkfs.ext4 persistence.dat
   ```
4. Ventoy auto-detects and uses persistence

### Pre-configured Options
- **Kali Live Persistence** - Comes with persistence support
- **Ubuntu Persistent** - Create via Rufus with persistence option

---

## OPTION 3: macOS on External SSD

If you're on Mac:

1. **Format SSD as APFS** in Disk Utility
2. **Install macOS** via Recovery Mode (Cmd+R on boot)
   - Select external SSD as target
3. **Boot holding Option key** to select drive
4. Run setup:
   ```bash
   # Install Homebrew first
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

   # Then run 0RB setup
   curl -sSL https://raw.githubusercontent.com/miKeDroP-JB/BlkFryday/main/setup/os-setup.sh | bash
   ```

---

## BIOS/UEFI Quick Reference

| Brand | Key to Enter BIOS | Key for Boot Menu |
|-------|------------------|-------------------|
| Dell | F2 | F12 |
| HP | F10 | F9 |
| Lenovo | F1/F2 | F12 |
| ASUS | F2/DEL | F8 |
| Acer | F2 | F12 |
| MSI | DEL | F11 |
| Mac | N/A | Option (⌥) |

---

## Post-Setup Verification

Run this to verify everything works:
```bash
# Check Node
node --version  # Should show v20.x

# Check Python
python --version  # Should show 3.11.x

# Check Ollama
ollama list

# Check Docker
docker ps

# Check Claude CLI
claude --version

# Test the core
cd ~/0rb/blkfryday
node -e "const { createORB } = require('./core'); createORB().then(o => console.log(o.getStatus()))"
```

---

## Troubleshooting

### SSD Not Showing in BIOS
- Try different USB port (USB 3.0 ports work best)
- Check SSD enclosure compatibility
- Update BIOS firmware

### Boot Loop
- Enter BIOS, disable Secure Boot
- Try CSM/Legacy mode if UEFI fails

### Slow Boot
- Enable TRIM: `sudo systemctl enable fstrim.timer`
- Check boot times: `systemd-analyze blame`

### Permission Issues
```bash
# Fix Docker
sudo usermod -aG docker $USER
newgrp docker

# Fix npm globals
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

---

## The Result

After setup, you boot up and get:
```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ⟡ 0RB SYSTEM - INITIALIZING ⟡                                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

⟡ Starting Ollama...
  ✓ Ollama running
  ✓ Docker running

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ⟡ SYSTEM READY - BUILD THE FUTURE ⟡                                  ║
║                                                                           ║
║     Commands:                                                             ║
║       orb          - Start Claude in workspace                            ║
║       build <desc> - Build something with the factory                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

You're now in Claude, ready to build. The smartest system in the world, at your fingertips, booted fresh from your portable SSD.

**LFG.** 🔥

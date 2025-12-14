# ORBOS Boot Guide

## Quick Start (Interactive)
```bash
cd /path/to/BlkFryday
./boot.sh
```

## Headless Server Boot
```bash
cd /path/to/BlkFryday
./autorun.sh
```

## Auto-Mount Boot (Linux)

### Option 1: udev rule (triggers on SSD plug-in)
Create `/etc/udev/rules.d/99-orbos.rules`:
```
ACTION=="add", KERNEL=="sd*", SUBSYSTEM=="block", RUN+="/path/to/BlkFryday/autorun.sh"
```

### Option 2: fstab + systemd (mount-triggered)
Add to `/etc/fstab`:
```
UUID=YOUR-SSD-UUID /mnt/orbos ext4 defaults,nofail 0 2
```

Create `/etc/systemd/system/orbos.service`:
```ini
[Unit]
Description=ORBOS Auto-Start
After=local-fs.target

[Service]
Type=oneshot
ExecStart=/mnt/orbos/BlkFryday/autorun.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable orbos.service
```

### Option 3: rc.local (legacy)
Add to `/etc/rc.local`:
```bash
/path/to/BlkFryday/autorun.sh &
```

## Directory Structure
```
BlkFryday/
├── boot.sh           # Interactive boot menu
├── autorun.sh        # Headless auto-start
├── system/
│   ├── terminal/
│   │   ├── 0r8-term-core.js
│   │   ├── bootstrap-callagents.sh
│   │   └── bootstrap-dynamic.sh
│   └── arc/
│       └── InfiniteReasoner.js
└── orbos.log         # Runtime log (created on boot)
```

## Check Status
```bash
tail -f /path/to/BlkFryday/orbos.log
ps aux | grep orbos
```

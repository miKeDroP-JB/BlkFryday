#!/usr/bin/env bash
# VYRA: Genesis Sector - Custom Arch Linux ISO Profile
# Bootable. Sovereign. Frictionless.

iso_name="genesis-sector"
iso_label="VYRA_GENESIS"
iso_publisher="VYRA Systems <https://vyra.dev>"
iso_application="VYRA: Genesis Sector - Portable AI Development Universe"
iso_version="$(date +%Y.%m.%d)"
install_dir="vyra"
buildmodes=('iso')
bootmodes=('bios.syslinux.mbr' 'bios.syslinux.eltorito'
           'uefi-ia32.grub.esp' 'uefi-x64.grub.esp'
           'uefi-ia32.grub.eltorito' 'uefi-x64.grub.eltorito')
arch="x86_64"
pacman_conf="pacman.conf"
airootfs_image_type="squashfs"
airootfs_image_tool_options=('-comp' 'zstd' '-Xcompression-level' '15' '-b' '1M')
file_permissions=(
  ["/etc/shadow"]="0:0:400"
  ["/etc/gshadow"]="0:0:400"
  ["/etc/vyra/vyra.conf"]="0:0:644"
  ["/usr/local/bin/vyra"]="0:0:755"
  ["/usr/local/bin/swarm-panel"]="0:0:755"
  ["/usr/local/bin/genesis-install"]="0:0:755"
)

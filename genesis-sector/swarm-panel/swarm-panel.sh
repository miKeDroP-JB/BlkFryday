#!/usr/bin/env bash
# VYRA: Genesis Sector - Swarm Panel Launcher

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
MODE="default"
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            MODE="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Set environment
export QT_QPA_PLATFORM=xcb
export VYRA_PANEL_MODE="$MODE"

# Run the panel
python3 "$SCRIPT_DIR/src/main.py"

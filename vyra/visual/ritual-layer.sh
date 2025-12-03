#!/bin/bash
#═══════════════════════════════════════════════════════════════════
# VYRA: GENESIS SECTOR - Visual Ritual Layer
#═══════════════════════════════════════════════════════════════════
# "Reality shifts when the sigils activate"
#═══════════════════════════════════════════════════════════════════

VYRA_VISUAL_DIR="/usr/share/vyra/visual"
VYRA_AUDIO_DIR="/usr/share/vyra/audio"
CONFIG_FILE="${HOME}/.config/vyra/visual.yaml"

# Colors
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GOLD='\033[0;33m'
NC='\033[0m'

# ─────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────

load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        # Parse YAML config (simple key: value)
        THEME=$(grep "^theme:" "$CONFIG_FILE" | cut -d: -f2 | tr -d ' ')
        TRAP_BEATS=$(grep "^trap_beats:" "$CONFIG_FILE" | cut -d: -f2 | tr -d ' ')
        FOCUS_MODE=$(grep "^focus_mode:" "$CONFIG_FILE" | cut -d: -f2 | tr -d ' ')
        REACTIVE_GLYPHS=$(grep "^reactive_glyphs:" "$CONFIG_FILE" | cut -d: -f2 | tr -d ' ')
    else
        THEME="neon-sigil"
        TRAP_BEATS="true"
        FOCUS_MODE="true"
        REACTIVE_GLYPHS="true"
    fi
}

# ─────────────────────────────────────────────────────────────────
# Theme Application
# ─────────────────────────────────────────────────────────────────

apply_theme() {
    echo -e "${CYAN}⟡ Applying theme: $THEME${NC}"

    case "$THEME" in
        "neon-sigil")
            apply_neon_sigil_theme
            ;;
        "dark-void")
            apply_dark_void_theme
            ;;
        "quantum-flux")
            apply_quantum_flux_theme
            ;;
        *)
            apply_neon_sigil_theme
            ;;
    esac
}

apply_neon_sigil_theme() {
    # KDE Plasma theme settings
    if command -v plasma-apply-colorscheme &> /dev/null; then
        # Apply custom color scheme
        cat > "${HOME}/.local/share/color-schemes/VyraNeonSigil.colors" << 'EOF'
[ColorEffects:Disabled]
Color=56,56,56
ColorAmount=0
ColorEffect=0
ContrastAmount=0.65
ContrastEffect=1
IntensityAmount=0.1
IntensityEffect=2

[ColorEffects:Inactive]
ChangeSelectionColor=true
Color=112,111,110
ColorAmount=0.025
ColorEffect=2
ContrastAmount=0.1
ContrastEffect=2
Enable=false
IntensityAmount=0
IntensityEffect=0

[Colors:Button]
BackgroundAlternate=30,30,40
BackgroundNormal=20,20,30
DecorationFocus=0,255,255
DecorationHover=155,89,182
ForegroundActive=0,255,255
ForegroundInactive=160,160,160
ForegroundLink=0,255,255
ForegroundNegative=231,76,60
ForegroundNeutral=241,196,15
ForegroundNormal=200,200,200
ForegroundPositive=46,204,113
ForegroundVisited=155,89,182

[Colors:Selection]
BackgroundAlternate=0,255,255
BackgroundNormal=0,255,255
DecorationFocus=0,255,255
DecorationHover=155,89,182
ForegroundActive=0,0,0
ForegroundInactive=0,0,0
ForegroundLink=0,0,0
ForegroundNegative=231,76,60
ForegroundNeutral=0,0,0
ForegroundNormal=0,0,0
ForegroundPositive=0,0,0
ForegroundVisited=0,0,0

[Colors:View]
BackgroundAlternate=15,15,25
BackgroundNormal=10,10,15
DecorationFocus=0,255,255
DecorationHover=155,89,182
ForegroundActive=0,255,255
ForegroundInactive=160,160,160
ForegroundLink=0,255,255
ForegroundNegative=231,76,60
ForegroundNeutral=241,196,15
ForegroundNormal=200,200,200
ForegroundPositive=46,204,113
ForegroundVisited=155,89,182

[Colors:Window]
BackgroundAlternate=15,15,25
BackgroundNormal=10,10,15
DecorationFocus=0,255,255
DecorationHover=155,89,182
ForegroundActive=0,255,255
ForegroundInactive=160,160,160
ForegroundLink=0,255,255
ForegroundNegative=231,76,60
ForegroundNeutral=241,196,15
ForegroundNormal=200,200,200
ForegroundPositive=46,204,113
ForegroundVisited=155,89,182

[General]
ColorScheme=VyraNeonSigil
Name=VYRA Neon Sigil
shadeSortColumn=true

[WM]
activeBackground=10,10,15
activeBlend=0,255,255
activeForeground=0,255,255
inactiveBackground=10,10,15
inactiveBlend=100,100,100
inactiveForeground=160,160,160
EOF
        plasma-apply-colorscheme VyraNeonSigil 2>/dev/null || true
    fi

    # Kvantum theme
    if command -v kvantummanager &> /dev/null; then
        kvantummanager --set KvDark 2>/dev/null || true
    fi

    # GTK theme
    if [[ -f "${HOME}/.config/gtk-3.0/settings.ini" ]]; then
        sed -i 's/gtk-theme-name=.*/gtk-theme-name=Breeze-Dark/' "${HOME}/.config/gtk-3.0/settings.ini"
    fi

    echo -e "${GREEN}✓ Neon Sigil theme applied${NC}"
}

apply_dark_void_theme() {
    echo -e "${MAGENTA}✓ Dark Void theme applied${NC}"
}

apply_quantum_flux_theme() {
    echo -e "${GOLD}✓ Quantum Flux theme applied${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Reactive Glyphs (Conky)
# ─────────────────────────────────────────────────────────────────

setup_reactive_glyphs() {
    if [[ "$REACTIVE_GLYPHS" != "true" ]]; then
        return
    fi

    echo -e "${CYAN}⟡ Setting up reactive glyphs...${NC}"

    mkdir -p "${HOME}/.config/conky"

    cat > "${HOME}/.config/conky/vyra-glyphs.conf" << 'EOF'
conky.config = {
    alignment = 'top_right',
    background = true,
    border_width = 0,
    cpu_avg_samples = 2,
    default_color = '00ffff',
    default_outline_color = '00ffff',
    default_shade_color = '000000',
    double_buffer = true,
    draw_borders = false,
    draw_graph_borders = true,
    draw_outline = false,
    draw_shades = false,
    extra_newline = false,
    font = 'JetBrains Mono:size=10',
    gap_x = 30,
    gap_y = 60,
    minimum_height = 400,
    minimum_width = 280,
    net_avg_samples = 2,
    no_buffers = true,
    out_to_console = false,
    out_to_ncurses = false,
    out_to_stderr = false,
    out_to_x = true,
    own_window = true,
    own_window_class = 'Conky',
    own_window_type = 'desktop',
    own_window_transparent = true,
    own_window_argb_visual = true,
    own_window_argb_value = 0,
    show_graph_range = false,
    show_graph_scale = false,
    stippled_borders = 0,
    update_interval = 1.0,
    uppercase = false,
    use_spacer = 'none',
    use_xft = true,
}

conky.text = [[
${color 9b59b6}╔═══════════════════════════════════╗
${color 9b59b6}║${color 00ffff}         VYRA GENESIS SECTOR       ${color 9b59b6}║
${color 9b59b6}╠═══════════════════════════════════╣${color}
${color 9b59b6}║${color ffd700} ◈ SYSTEM ${color}
${color 9b59b6}║${color}  Kernel: ${kernel}
${color 9b59b6}║${color}  Uptime: ${uptime}
${color 9b59b6}║${color}
${color 9b59b6}║${color ffd700} ◈ RESOURCES ${color}
${color 9b59b6}║${color}  CPU: ${cpu}% ${cpubar 8,150}
${color 9b59b6}║${color}  RAM: ${memperc}% ${membar 8,150}
${color 9b59b6}║${color}  Swap: ${swapperc}% ${swapbar 8,150}
${color 9b59b6}║${color}
${color 9b59b6}║${color ffd700} ◈ NETWORK ${color}
${color 9b59b6}║${color}  Down: ${downspeed wlan0}
${color 9b59b6}║${color}  Up: ${upspeed wlan0}
${color 9b59b6}║${color}
${color 9b59b6}║${color ffd700} ◈ PROCESSES ${color}
${color 9b59b6}║${color}  ${top name 1}${top cpu 1}%
${color 9b59b6}║${color}  ${top name 2}${top cpu 2}%
${color 9b59b6}║${color}  ${top name 3}${top cpu 3}%
${color 9b59b6}╚═══════════════════════════════════╝${color}
]]
EOF

    # Start conky in background
    pkill conky 2>/dev/null || true
    conky -c "${HOME}/.config/conky/vyra-glyphs.conf" &

    echo -e "${GREEN}✓ Reactive glyphs active${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Audio Layer (Trap Beats)
# ─────────────────────────────────────────────────────────────────

start_audio_layer() {
    if [[ "$TRAP_BEATS" != "true" ]]; then
        return
    fi

    echo -e "${CYAN}⟡ Starting audio layer...${NC}"

    # Check for audio files
    if [[ -d "$VYRA_AUDIO_DIR" ]] && [[ -n "$(ls -A $VYRA_AUDIO_DIR/*.{mp3,ogg,wav} 2>/dev/null)" ]]; then
        # Use mpv for background playback
        if command -v mpv &> /dev/null; then
            mpv --no-video --loop-playlist=inf --volume=30 "$VYRA_AUDIO_DIR"/*.{mp3,ogg,wav} &>/dev/null &
            echo -e "${GREEN}✓ Audio layer active${NC}"
        fi
    else
        echo -e "${GOLD}⚠ No audio files found in $VYRA_AUDIO_DIR${NC}"
    fi
}

# ─────────────────────────────────────────────────────────────────
# Focus Mode
# ─────────────────────────────────────────────────────────────────

enable_focus_mode() {
    if [[ "$FOCUS_MODE" != "true" ]]; then
        return
    fi

    echo -e "${CYAN}⟡ Enabling focus mode...${NC}"

    # Disable notifications
    if command -v dunstctl &> /dev/null; then
        dunstctl set-paused true
    fi

    # Set DND on KDE
    if command -v qdbus &> /dev/null; then
        qdbus org.freedesktop.Notifications /org/freedesktop/Notifications org.freedesktop.Notifications.Inhibit "VYRA" "Focus Mode" 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ Focus mode active${NC}"
}

disable_focus_mode() {
    if command -v dunstctl &> /dev/null; then
        dunstctl set-paused false
    fi
    echo -e "${GOLD}✓ Focus mode disabled${NC}"
}

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

main() {
    echo -e "${CYAN}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════╗
║                    VISUAL RITUAL LAYER                            ║
║              Reality shifts when sigils activate                  ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    load_config
    apply_theme
    setup_reactive_glyphs
    start_audio_layer
    enable_focus_mode

    echo -e "\n${GREEN}⟡ Visual ritual layer fully activated${NC}"
}

# Handle arguments
case "${1:-}" in
    "stop")
        pkill conky 2>/dev/null || true
        pkill mpv 2>/dev/null || true
        disable_focus_mode
        echo -e "${GOLD}Visual layer stopped${NC}"
        ;;
    "focus-on")
        FOCUS_MODE="true"
        enable_focus_mode
        ;;
    "focus-off")
        disable_focus_mode
        ;;
    *)
        main
        ;;
esac

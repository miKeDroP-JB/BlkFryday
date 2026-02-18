#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║  VYRA: GENESIS SECTOR - VISUAL RITUAL ENGINE                        ║
║  Dynamic backgrounds, glyphs, and focus state management             ║
╚══════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import math
import time
import random
import threading
from dataclasses import dataclass
from typing import List, Tuple, Optional
from pathlib import Path

# For desktop wallpaper and notifications
import subprocess

# OpenGL rendering (optional, for advanced effects)
try:
    from OpenGL.GL import *
    from OpenGL.GLUT import *
    HAS_OPENGL = True
except ImportError:
    HAS_OPENGL = False

# === CONFIGURATION ===

VYRA_HOME = Path(os.getenv("VYRA_HOME", Path.home() / ".vyra"))
VISUAL_DIR = VYRA_HOME / "visual"
BACKGROUNDS_DIR = VISUAL_DIR / "backgrounds"
GLYPHS_DIR = VISUAL_DIR / "glyphs"
SOUNDS_DIR = VISUAL_DIR / "sounds"

# VYRA Color Palette
COLORS = {
    "bg_dark": (26, 27, 38),
    "bg_medium": (36, 40, 59),
    "purple": (187, 154, 247),
    "pink": (247, 118, 142),
    "cyan": (125, 207, 255),
    "green": (158, 206, 106),
    "yellow": (224, 175, 104),
    "blue": (122, 162, 247),
    "text": (192, 202, 245),
}

# === DATA STRUCTURES ===

@dataclass
class FocusState:
    """Current focus state configuration"""
    mode: str = "normal"  # normal, trance, clarity, summon
    intensity: float = 1.0
    background_animation: bool = True
    sound_enabled: bool = True
    glyph_overlay: bool = False

@dataclass
class Glyph:
    """Alchemical glyph definition"""
    name: str
    symbol: str
    meaning: str
    color: Tuple[int, int, int]
    animation: str = "pulse"

# === GLYPH DEFINITIONS ===

VYRA_GLYPHS = {
    "sigil": Glyph("VYRA Sigil", "⟡", "Core resonance", COLORS["purple"]),
    "channel": Glyph("Channel", "◈", "Communication", COLORS["cyan"]),
    "agent": Glyph("Agent", "◉", "Intelligence node", COLORS["green"]),
    "swarm": Glyph("Swarm", "⬡", "Collective", COLORS["yellow"]),
    "manifest": Glyph("Manifest", "◎", "Creation", COLORS["pink"]),
    "flow": Glyph("Flow", "≋", "Data stream", COLORS["blue"]),
    "anchor": Glyph("Anchor", "⊛", "Stability", COLORS["text"]),
    "transform": Glyph("Transform", "⌬", "Mutation", COLORS["purple"]),
    "infinite": Glyph("Infinite", "∞", "Boundless", COLORS["cyan"]),
    "genesis": Glyph("Genesis", "⊕", "Origin", COLORS["pink"]),
}

# === BACKGROUND GENERATOR ===

class BackgroundGenerator:
    """Generate animated wallpapers with sacred geometry"""

    def __init__(self, width: int = 1920, height: int = 1080):
        self.width = width
        self.height = height
        self.frame = 0
        self.running = False

    def generate_geometry_frame(self, mode: str = "normal") -> bytes:
        """Generate a single frame of sacred geometry"""
        # Using PIL for image generation
        try:
            from PIL import Image, ImageDraw
        except ImportError:
            return b""

        img = Image.new("RGB", (self.width, self.height), COLORS["bg_dark"])
        draw = ImageDraw.Draw(img)

        center_x = self.width // 2
        center_y = self.height // 2

        if mode == "trance":
            self._draw_trance_geometry(draw, center_x, center_y)
        elif mode == "clarity":
            self._draw_clarity_geometry(draw, center_x, center_y)
        elif mode == "summon":
            self._draw_summon_geometry(draw, center_x, center_y)
        else:
            self._draw_normal_geometry(draw, center_x, center_y)

        # Convert to bytes
        import io
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return buffer.getvalue()

    def _draw_normal_geometry(self, draw, cx: int, cy: int):
        """Normal mode - subtle pulsing grid"""
        phase = math.sin(self.frame * 0.02) * 0.3 + 0.7

        # Grid lines
        for i in range(0, self.width, 40):
            alpha = int(30 * phase)
            color = (*COLORS["bg_medium"], alpha)
            draw.line([(i, 0), (i, self.height)], fill=COLORS["bg_medium"], width=1)

        for i in range(0, self.height, 40):
            draw.line([(0, i), (self.width, i)], fill=COLORS["bg_medium"], width=1)

        # Central sigil
        self._draw_sigil(draw, cx, cy, 100, phase)

    def _draw_trance_geometry(self, draw, cx: int, cy: int):
        """Trance mode - deep focus spirals"""
        phase = self.frame * 0.01

        # Concentric circles
        for i in range(1, 15):
            radius = i * 60 + math.sin(phase + i * 0.5) * 20
            alpha = int(255 * (1 - i / 15) * 0.3)
            color = self._blend_color(COLORS["purple"], COLORS["blue"],
                                       math.sin(phase + i) * 0.5 + 0.5)
            draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius],
                        outline=color, width=2)

        # Spiral arms
        for arm in range(6):
            arm_phase = phase + (arm * math.pi / 3)
            points = []
            for t in range(100):
                r = t * 5 + math.sin(arm_phase) * 30
                angle = t * 0.1 + arm_phase
                x = cx + math.cos(angle) * r
                y = cy + math.sin(angle) * r
                points.append((x, y))
            if len(points) > 1:
                draw.line(points, fill=COLORS["purple"], width=2)

    def _draw_clarity_geometry(self, draw, cx: int, cy: int):
        """Clarity mode - sharp hexagonal patterns for debugging"""
        phase = self.frame * 0.03

        # Hexagonal grid
        hex_size = 40
        for row in range(-10, 11):
            for col in range(-15, 16):
                offset = hex_size * 0.866 if row % 2 else 0
                hx = cx + col * hex_size * 1.5 + offset - cx * 0.5
                hy = cy + row * hex_size * 0.866 * 2 - cy * 0.5

                intensity = math.sin(phase + row * 0.1 + col * 0.1) * 0.5 + 0.5
                color = self._blend_color(COLORS["cyan"], COLORS["green"], intensity)
                self._draw_hexagon(draw, hx, hy, hex_size * 0.8, color)

        # Central target
        for i in range(4):
            radius = 50 + i * 30
            draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius],
                        outline=COLORS["cyan"], width=2)
        draw.line([(cx - 100, cy), (cx + 100, cy)], fill=COLORS["cyan"], width=2)
        draw.line([(cx, cy - 100), (cx, cy + 100)], fill=COLORS["cyan"], width=2)

    def _draw_summon_geometry(self, draw, cx: int, cy: int):
        """Summon mode - agent spawning circle"""
        phase = self.frame * 0.02

        # Outer summoning circle
        radius = 300
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius],
                    outline=COLORS["purple"], width=3)

        # Inner circles
        for i in range(3):
            r = 100 + i * 70
            rotation = phase + i * 0.5
            draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                        outline=COLORS["pink"], width=2)

        # Pentagram-style connection points
        points = []
        for i in range(5):
            angle = (i * 2 * math.pi / 5) - math.pi / 2 + phase
            px = cx + math.cos(angle) * radius
            py = cy + math.sin(angle) * radius
            points.append((px, py))

            # Draw node
            draw.ellipse([px - 15, py - 15, px + 15, py + 15],
                        fill=COLORS["green"], outline=COLORS["text"])

        # Connect every other point (star pattern)
        for i in range(5):
            draw.line([points[i], points[(i + 2) % 5]], fill=COLORS["purple"], width=2)

        # Central agent spawn point
        glow_radius = 50 + math.sin(phase * 3) * 10
        draw.ellipse([cx - glow_radius, cy - glow_radius,
                     cx + glow_radius, cy + glow_radius],
                    fill=COLORS["bg_medium"], outline=COLORS["purple"], width=3)

        # Sigil in center
        self._draw_sigil(draw, cx, cy, 30, 1.0)

    def _draw_sigil(self, draw, x: int, y: int, size: int, intensity: float):
        """Draw the VYRA sigil"""
        color = self._alpha_color(COLORS["purple"], intensity)

        # Diamond shape
        points = [
            (x, y - size),
            (x + size, y),
            (x, y + size),
            (x - size, y),
        ]
        draw.polygon(points, outline=color, width=2)

        # Inner circle
        r = size * 0.5
        draw.ellipse([x - r, y - r, x + r, y + r], outline=color, width=2)

        # Center dot
        draw.ellipse([x - 5, y - 5, x + 5, y + 5], fill=color)

    def _draw_hexagon(self, draw, x: int, y: int, size: int, color):
        """Draw a hexagon"""
        points = []
        for i in range(6):
            angle = i * math.pi / 3 - math.pi / 6
            px = x + math.cos(angle) * size
            py = y + math.sin(angle) * size
            points.append((px, py))
        draw.polygon(points, outline=color, width=1)

    def _blend_color(self, c1: Tuple, c2: Tuple, t: float) -> Tuple:
        """Blend two colors"""
        return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

    def _alpha_color(self, color: Tuple, alpha: float) -> Tuple:
        """Apply alpha to color (as RGB approximation)"""
        bg = COLORS["bg_dark"]
        return tuple(int(bg[i] + (color[i] - bg[i]) * alpha) for i in range(3))

    def start_animation(self, mode: str = "normal", output_dir: Path = None):
        """Start background animation loop"""
        self.running = True
        self.mode = mode

        if output_dir is None:
            output_dir = BACKGROUNDS_DIR

        output_dir.mkdir(parents=True, exist_ok=True)

        while self.running:
            frame_data = self.generate_geometry_frame(self.mode)
            frame_path = output_dir / "current.png"

            with open(frame_path, "wb") as f:
                f.write(frame_data)

            # Set as wallpaper (KDE Plasma)
            subprocess.run([
                "qdbus", "org.kde.plasmashell", "/PlasmaShell",
                "org.kde.PlasmaShell.evaluateScript",
                f'''
                var allDesktops = desktops();
                for (var i = 0; i < allDesktops.length; i++) {{
                    var d = allDesktops[i];
                    d.wallpaperPlugin = "org.kde.image";
                    d.currentConfigGroup = Array("Wallpaper", "org.kde.image", "General");
                    d.writeConfig("Image", "file://{frame_path}");
                }}
                '''
            ], capture_output=True)

            self.frame += 1
            time.sleep(0.1)  # ~10 FPS

    def stop_animation(self):
        """Stop the animation loop"""
        self.running = False

# === AUDIO ENGINE ===

class AudioEngine:
    """Ambient audio and sound effect management"""

    def __init__(self):
        self.playing = False
        self.current_track = None
        self.volume = 0.3

        # Sound definitions
        self.sounds = {
            "keypress": ["key_click_1.wav", "key_click_2.wav", "key_click_3.wav"],
            "agent_spawn": ["spawn.wav"],
            "agent_terminate": ["terminate.wav"],
            "notification": ["notify.wav"],
            "focus_enter": ["focus_in.wav"],
            "focus_exit": ["focus_out.wav"],
        }

        self.ambient_tracks = {
            "normal": "ambient_normal.ogg",
            "trance": "deep_focus.ogg",
            "clarity": "clarity_pulse.ogg",
            "summon": "summon_grid.ogg",
        }

    def play_sound(self, sound_name: str):
        """Play a one-shot sound effect"""
        if sound_name not in self.sounds:
            return

        sound_files = self.sounds[sound_name]
        sound_file = random.choice(sound_files)
        sound_path = SOUNDS_DIR / sound_file

        if sound_path.exists():
            subprocess.Popen(
                ["paplay", str(sound_path), f"--volume={int(self.volume * 65536)}"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

    def start_ambient(self, mode: str = "normal"):
        """Start ambient background audio"""
        if mode not in self.ambient_tracks:
            mode = "normal"

        track_file = self.ambient_tracks[mode]
        track_path = SOUNDS_DIR / track_file

        if track_path.exists():
            self.stop_ambient()
            self.current_track = subprocess.Popen(
                ["mpv", "--loop=inf", f"--volume={int(self.volume * 100)}",
                 "--no-video", str(track_path)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            self.playing = True

    def stop_ambient(self):
        """Stop ambient audio"""
        if self.current_track:
            self.current_track.terminate()
            self.current_track = None
        self.playing = False

    def set_volume(self, volume: float):
        """Set audio volume (0.0 - 1.0)"""
        self.volume = max(0.0, min(1.0, volume))

# === FOCUS STATE MANAGER ===

class FocusStateManager:
    """Manage focus state transitions and visual modes"""

    def __init__(self):
        self.state = FocusState()
        self.background_gen = BackgroundGenerator()
        self.audio = AudioEngine()
        self.background_thread: Optional[threading.Thread] = None

    def enter_mode(self, mode: str):
        """Enter a focus mode"""
        if mode == self.state.mode:
            return

        # Play transition sound
        self.audio.play_sound("focus_enter")

        # Stop current background
        self.background_gen.stop_animation()
        if self.background_thread:
            self.background_thread.join(timeout=1)

        # Update state
        self.state.mode = mode

        # Start new background animation
        self.background_thread = threading.Thread(
            target=self.background_gen.start_animation,
            args=(mode,)
        )
        self.background_thread.daemon = True
        self.background_thread.start()

        # Start ambient audio
        if self.state.sound_enabled:
            self.audio.start_ambient(mode)

        # Notify
        self._notify(f"Focus Mode: {mode.upper()}")

    def exit_mode(self):
        """Exit current mode, return to normal"""
        self.audio.play_sound("focus_exit")
        self.enter_mode("normal")

    def toggle_sounds(self, enabled: bool):
        """Toggle sound effects"""
        self.state.sound_enabled = enabled
        if not enabled:
            self.audio.stop_ambient()
        else:
            self.audio.start_ambient(self.state.mode)

    def toggle_backgrounds(self, enabled: bool):
        """Toggle background animations"""
        self.state.background_animation = enabled
        if not enabled:
            self.background_gen.stop_animation()
        else:
            self.background_thread = threading.Thread(
                target=self.background_gen.start_animation,
                args=(self.state.mode,)
            )
            self.background_thread.daemon = True
            self.background_thread.start()

    def _notify(self, message: str):
        """Send desktop notification"""
        subprocess.run([
            "notify-send",
            "-i", "vyra",
            "VYRA: Genesis Sector",
            message
        ], capture_output=True)

# === CLI INTERFACE ===

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="VYRA Visual Ritual Engine"
    )
    parser.add_argument(
        "command",
        choices=["focus", "background", "sound", "glyph"],
        help="Command to execute"
    )
    parser.add_argument(
        "--mode",
        choices=["normal", "trance", "clarity", "summon"],
        default="normal",
        help="Focus mode"
    )
    parser.add_argument(
        "--sound",
        help="Sound effect to play"
    )
    parser.add_argument(
        "--volume",
        type=float,
        default=0.3,
        help="Audio volume (0.0-1.0)"
    )

    args = parser.parse_args()

    manager = FocusStateManager()

    if args.command == "focus":
        manager.enter_mode(args.mode)
        print(f"⟡ Focus mode: {args.mode}")

        # Keep running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            manager.exit_mode()

    elif args.command == "background":
        gen = BackgroundGenerator()
        print(f"⟡ Generating {args.mode} background...")
        gen.start_animation(args.mode)

    elif args.command == "sound":
        audio = AudioEngine()
        audio.set_volume(args.volume)
        if args.sound:
            audio.play_sound(args.sound)
        else:
            audio.start_ambient(args.mode)
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                audio.stop_ambient()

    elif args.command == "glyph":
        print("⟡ VYRA Glyphs:")
        for name, glyph in VYRA_GLYPHS.items():
            print(f"  {glyph.symbol}  {name}: {glyph.meaning}")

if __name__ == "__main__":
    main()

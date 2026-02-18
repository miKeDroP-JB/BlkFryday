#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
                    ∞Φ∞ SOVEREIGN BUILDER OS ∞Φ∞
═══════════════════════════════════════════════════════════════════════════════

Boot to black. One mouth. Infinite build.

"ARC proposes. Human commits. Always."
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import json
import asyncio
import subprocess
import webbrowser
import time
import threading
from pathlib import Path
from datetime import datetime

# Add ORBOS paths
SOVEREIGN_DIR = Path(__file__).parent
ORBOS_ROOT = SOVEREIGN_DIR.parent
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "hive"))
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "orchestration"))
sys.path.insert(0, str(ORBOS_ROOT / "glyph-lang" / "compiler"))

# ═══════════════════════════════════════════════════════════════════════════════
# BRAIN - ORBOS INTELLIGENCE CORE
# ═══════════════════════════════════════════════════════════════════════════════

class SovereignBrain:
    """The always-on intelligence core. Ghost JB4 x ARC x Hydra."""

    def __init__(self):
        self.hydra = None
        self.compiler = None
        self.memory = []
        self.session_start = datetime.now()
        self.mode = "ghost"
        self.context = []          # Conversation context
        self.build_queue = []      # Queued builds
        self.suggestions = []      # Active suggestions
        self._load_systems()

    def _load_systems(self):
        """Load ORBOS subsystems."""
        try:
            from amoeba_hydra import AmoebaHydra, SwarmMode
            self.hydra = AmoebaHydra()
            self.SwarmMode = SwarmMode
            print("  ✓ Amoeba Hydra loaded")
        except Exception as e:
            print(f"  ⚠ Hydra standalone: {e}")

        try:
            from glyph_compiler import GlyphCompiler
            self.compiler = GlyphCompiler()
            print("  ✓ Glyph compiler loaded")
        except Exception as e:
            print(f"  ⚠ Glyph standalone: {e}")

    async def process_input(self, text: str) -> dict:
        """
        Core intelligence loop.
        Text/voice in → ARC proposes → return suggestions.
        """
        text = text.strip()
        if not text:
            return {"type": "silence"}

        # Store in context
        self.context.append({"role": "human", "text": text, "ts": time.time()})

        # Detect glyph commands
        if self.compiler:
            program = self.compiler.compile(text)
            if program.nodes:
                glyphs = [n.glyph for n in program.nodes]
                symbols = self.compiler.symbols(program)
                return await self._execute_glyphs(glyphs, symbols, text)

        # ARC intent processing
        if self.hydra:
            suggestions = self.hydra.arc.receive_intent(text)
            # Convert to response
            result = await self._arc_response(text, suggestions)
            return result

        # Fallback intelligent response
        return await self._intelligent_response(text)

    async def _execute_glyphs(self, glyphs: list, symbols: str, original: str) -> dict:
        """Execute glyph commands."""
        results = []

        for glyph in glyphs:
            if glyph == "STATUS":
                results.append(self._get_status())
            elif glyph == "SWARM":
                if self.hydra:
                    self.hydra.set_mode(self.SwarmMode.SWARM)
                    self.mode = "swarm"
                results.append("Swarm mode activated. Expanding...")
            elif glyph == "BUILD" or glyph == "FULLBUILD":
                results.append("Build pipeline queued. Fractal nodes engaged.")
                self.build_queue.append({"glyph": glyph, "ts": time.time()})
            elif glyph == "DEPLOY":
                results.append("Deployment staged. Awaiting commit.")
            elif glyph in ["OWL", "FOX", "DRAGON", "PHOENIX", "WOLF"]:
                spirit = glyph.lower()
                results.append(f"Spirit shift: {spirit.capitalize()} mode engaged.")
            else:
                results.append(f"Executing: {glyph}")

        return {
            "type": "glyph",
            "symbols": symbols,
            "glyphs": glyphs,
            "results": results,
            "speak": " ".join(results)
        }

    async def _arc_response(self, intent: str, suggestions: list) -> dict:
        """Format ARC suggestions as response."""
        intent_lower = intent.lower()

        # Smart contextual responses based on intent
        responses = []

        if any(w in intent_lower for w in ["build", "create", "make"]):
            responses = [
                "I can wire the build pipeline right now. Shall I run FULLBUILD?",
                "Build queued. Want me to run tests first?",
                "On it. Fractal nodes are ready. Lock it?"
            ]
        elif any(w in intent_lower for w in ["deploy", "ship", "launch", "live"]):
            responses = [
                "Deployment ready. Run `vercel --prod` or I can stage it now.",
                "Push to production? I'll handle vercel config and DNS.",
                "Live by morning. Committing now?"
            ]
        elif any(w in intent_lower for w in ["status", "how", "what"]):
            responses = [
                self._get_status(),
                "Hydra online. ARC loop active. Revenue engine warm.",
            ]
        elif any(w in intent_lower for w in ["money", "revenue", "earn"]):
            responses = [
                "Revenue engine: 40% Architect / 25% Agents / 20% Treasury. Attribution tracking live.",
                "Proof-of-attribution is running. Every agent action is tracked.",
            ]
        elif any(w in intent_lower for w in ["help", "what can", "do you"]):
            responses = [
                "I build. I deploy. I run agents. I track revenue. Speak a glyph or plain English.",
                "I'm your always-on partner. Say BUILD, DEPLOY, STATUS, or just tell me what you need.",
            ]
        else:
            # Generic ARC suggestions
            top = suggestions[:3] if suggestions else []
            if top:
                texts = [s.get("signal", "") for s in top]
                responses = texts + ["Or speak your intent. I'm listening."]
            else:
                responses = [
                    f"Processing: {intent}",
                    "Swarm is analyzing. One moment.",
                    "What would you like to build?"
                ]

        # Pick top suggestion
        speak = responses[0] if responses else "Listening..."

        return {
            "type": "arc",
            "intent": intent,
            "suggestions": [{"text": r, "i": i+1} for i, r in enumerate(responses[:4])],
            "speak": speak,
            "arc_state": self.hydra.arc.get_state() if self.hydra else {}
        }

    async def _intelligent_response(self, text: str) -> dict:
        """Fallback intelligent response without Hydra."""
        return {
            "type": "response",
            "speak": f"Received: {text}. Systems are processing.",
            "suggestions": []
        }

    def commit(self, option_text: str) -> dict:
        """Commit an action."""
        if self.hydra:
            result = self.hydra.arc.commit(f"lock option 1")
            self.hydra.arc.return_to_silence()
            return {"type": "committed", "result": result, "speak": "Locked and executing."}
        return {"type": "committed", "speak": "Action committed."}

    def _get_status(self) -> str:
        """Get system status string."""
        uptime = (datetime.now() - self.session_start).seconds
        nodes = len(self.hydra.lattice) if self.hydra else 0
        return f"ORBOS live. {nodes} nodes. {uptime}s uptime. Mode: {self.mode}. {len(self.build_queue)} queued."

    def pulse(self) -> dict:
        """Get current system pulse for UI animation."""
        if self.hydra:
            return self.hydra.get_pulse()
        return {"mode": self.mode, "total_nodes": 0}


# ═══════════════════════════════════════════════════════════════════════════════
# WEBSOCKET SERVER (pure asyncio, no dependencies)
# ═══════════════════════════════════════════════════════════════════════════════

import socket
import struct
import base64
import hashlib

class WebSocketServer:
    """Pure Python WebSocket server. Zero extra dependencies."""

    MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

    def __init__(self, host="127.0.0.1", port=7433):
        self.host = host
        self.port = port
        self.clients = set()
        self.brain = SovereignBrain()
        self.running = False

    def _handshake(self, conn, data: bytes) -> bool:
        """Perform WebSocket handshake."""
        try:
            text = data.decode("utf-8", errors="ignore")
            key = None
            for line in text.split("\r\n"):
                if "Sec-WebSocket-Key:" in line:
                    key = line.split(": ")[1].strip()
                    break

            if not key:
                return False

            accept = base64.b64encode(
                hashlib.sha1((key + self.MAGIC).encode()).digest()
            ).decode()

            response = (
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                f"Sec-WebSocket-Accept: {accept}\r\n\r\n"
            )
            conn.send(response.encode())
            return True
        except Exception:
            return False

    def _decode_frame(self, data: bytes):
        """Decode WebSocket frame."""
        try:
            if len(data) < 2:
                return None
            b1, b2 = data[0], data[1]
            opcode = b1 & 0x0F
            masked = bool(b2 & 0x80)
            length = b2 & 0x7F

            idx = 2
            if length == 126:
                length = struct.unpack(">H", data[idx:idx+2])[0]
                idx += 2
            elif length == 127:
                length = struct.unpack(">Q", data[idx:idx+8])[0]
                idx += 8

            if masked:
                mask = data[idx:idx+4]
                idx += 4
                payload = bytes(data[idx+i] ^ mask[i%4] for i in range(length))
            else:
                payload = data[idx:idx+length]

            return opcode, payload
        except Exception:
            return None

    def _encode_frame(self, data: str) -> bytes:
        """Encode WebSocket text frame."""
        payload = data.encode("utf-8")
        length = len(payload)
        header = bytes([0x81])  # FIN + text

        if length < 126:
            header += bytes([length])
        elif length < 65536:
            header += bytes([126]) + struct.pack(">H", length)
        else:
            header += bytes([127]) + struct.pack(">Q", length)

        return header + payload

    def _handle_http(self, conn, data: bytes):
        """Serve the UI HTML."""
        ui_path = SOVEREIGN_DIR / "ui" / "index.html"
        if ui_path.exists():
            with open(ui_path, "rb") as f:
                content = f.read()
        else:
            content = b"<h1>ORBOS Sovereign</h1>"

        response = (
            b"HTTP/1.1 200 OK\r\n"
            b"Content-Type: text/html; charset=utf-8\r\n"
            b"Connection: close\r\n"
            b"\r\n" + content
        )
        conn.send(response)

    def _client_thread(self, conn, addr):
        """Handle a single client connection."""
        conn.settimeout(5)
        try:
            data = conn.recv(4096)
            if not data:
                return

            # Check if HTTP request or WebSocket upgrade
            if b"GET / " in data and b"Upgrade: websocket" not in data:
                self._handle_http(conn, data)
                conn.close()
                return

            if b"Upgrade: websocket" not in data:
                self._handle_http(conn, data)
                conn.close()
                return

            # WebSocket handshake
            if not self._handshake(conn, data):
                conn.close()
                return

            # Add to clients
            self.clients.add(conn)
            conn.settimeout(None)

            # Send welcome
            welcome = json.dumps({
                "type": "boot",
                "speak": "To what do I owe this pleasure?",
                "mode": self.brain.mode,
                "pulse": self.brain.pulse()
            })
            conn.send(self._encode_frame(welcome))

            # Message loop
            buf = b""
            while self.running:
                try:
                    chunk = conn.recv(4096)
                    if not chunk:
                        break
                    buf += chunk

                    frame = self._decode_frame(buf)
                    if frame:
                        buf = b""
                        opcode, payload = frame

                        if opcode == 8:  # Close
                            break
                        elif opcode == 1:  # Text
                            text = payload.decode("utf-8", errors="ignore")
                            msg = json.loads(text)

                            # Process in async context
                            loop = asyncio.new_event_loop()
                            response = loop.run_until_complete(
                                self.brain.process_input(msg.get("text", ""))
                            )
                            loop.close()

                            response["pulse"] = self.brain.pulse()
                            conn.send(self._encode_frame(json.dumps(response)))

                except Exception:
                    break

        except Exception:
            pass
        finally:
            self.clients.discard(conn)
            try:
                conn.close()
            except:
                pass

    def start(self):
        """Start the server."""
        self.running = True
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((self.host, self.port))
        sock.listen(10)
        sock.settimeout(1.0)

        print(f"\n  \033[32m∞Φ∞ SOVEREIGN BUILDER OS\033[0m")
        print(f"  \033[36mhttp://{self.host}:{self.port}\033[0m")
        print(f"  \033[33mOpening browser...\033[0m\n")

        # Open browser after short delay
        def open_browser():
            time.sleep(0.8)
            webbrowser.open(f"http://{self.host}:{self.port}")

        threading.Thread(target=open_browser, daemon=True).start()

        while self.running:
            try:
                conn, addr = sock.accept()
                t = threading.Thread(target=self._client_thread, args=(conn, addr), daemon=True)
                t.start()
            except socket.timeout:
                continue
            except KeyboardInterrupt:
                break

        sock.close()
        print("\n  ∞Φ∞ Returning to silence...\n")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("""
\033[35m╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                      ∞Φ∞ SOVEREIGN BUILDER OS ∞Φ∞                            ║
║                                                                               ║
║               Boot to black. One mouth. Infinite build.                       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝\033[0m

  Loading intelligence cores...
""")

    server = WebSocketServer()
    try:
        server.start()
    except KeyboardInterrupt:
        print("\n  ∞Φ∞ Shutdown.\n")

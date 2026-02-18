#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
                         ∞Φ∞ ORBOS LIVE ∞Φ∞
═══════════════════════════════════════════════════════════════════════════════

UNIFIED PRODUCTION LAUNCHER
All systems. One command. Zero friction.

Domains:
  - eko.vision (Primary Portal)
  - 0r8.ai (API Gateway)
  - apps.eko.vision (App Marketplace)
  - oracle.agency (Oracle Interface)

═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import asyncio
import json
import subprocess
from datetime import datetime
from pathlib import Path

# Add paths
ORBOS_ROOT = Path(__file__).parent
sys.path.insert(0, str(ORBOS_ROOT))
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "hive"))
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "orchestration"))
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "revenue-engine"))
sys.path.insert(0, str(ORBOS_ROOT / "glyph-lang" / "compiler"))
sys.path.insert(0, str(ORBOS_ROOT / "core-builder" / "ingest"))
sys.path.insert(0, str(ORBOS_ROOT / "core-builder" / "classify"))

# ═══════════════════════════════════════════════════════════════════════════════
# BOOT SIGIL
# ═══════════════════════════════════════════════════════════════════════════════

ORBOS_SIGIL = """
\033[35m
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                              ⚗️   ∞Φ∞   ⚗️                                    ║
║                                                                               ║
║                    ✧  ˚  ·  ⋆  ˚  ✦  ˚  ·  ✧                                 ║
║               ˚        ·    ⋆    ·        ˚                                   ║
║          ✦      ·                    ·      ✦                                 ║
║        ˚    ⋆      ██████╗ ██████╗ ██████╗  ██████╗ ███████╗    ⋆    ˚       ║
║      ·            ██╔═══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝            ·     ║
║        ˚    ⋆    ██║   ██║██████╔╝██████╔╝██║   ██║███████╗    ⋆    ˚        ║
║          ✦      ·██║   ██║██╔══██╗██╔══██╗██║   ██║╚════██║·      ✦          ║
║               ˚  ╚██████╔╝██║  ██║██████╔╝╚██████╔╝███████║  ˚               ║
║                    ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝                  ║
║                    ✧  ˚  ·  ⋆  ˚  ✦  ˚  ·  ✧                                 ║
║                                                                               ║
║                         L I V E   S Y S T E M                                 ║
║                                                                               ║
║                    eko.vision | 0r8.ai | oracle.agency                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
\033[0m
"""

# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM COMPONENTS
# ═══════════════════════════════════════════════════════════════════════════════

class ORBOSLive:
    """Unified ORBOS Production System"""

    def __init__(self):
        self.root = ORBOS_ROOT
        self.components = {}
        self.status = "initializing"
        self.boot_time = None

    async def boot(self):
        """Full system boot sequence."""
        print(ORBOS_SIGIL)
        self.boot_time = datetime.now()

        print("  \033[36m⚡ BOOT SEQUENCE INITIATED\033[0m\n")

        # 1. Load Amoeba Hydra
        await self._load_component("amoeba_hydra", "Living Hive OS")

        # 2. Load Fractal Nodes
        await self._load_component("fractal_nodes", "47 Fractal Nodes")

        # 3. Load Revenue Engine
        await self._load_component("crypto_rail", "Revenue Engine")

        # 4. Load Glyph Compiler
        await self._load_component("glyph_compiler", "Glyph DSL")

        # 5. Load Ingest Engine
        await self._load_component("ingest", "Core Ingest")

        # 6. Load Canonicalizer
        await self._load_component("canonicalize", "Canonicalizer")

        self.status = "online"

        print("\n  ─────────────────────────────────────────────")
        print(f"  \033[32m✓ ORBOS LIVE - ALL SYSTEMS ONLINE\033[0m")
        print(f"  \033[33m  Boot time: {(datetime.now() - self.boot_time).total_seconds():.2f}s\033[0m")
        print("  ─────────────────────────────────────────────\n")

        return self

    async def _load_component(self, name: str, display: str):
        """Load a component module."""
        try:
            module = __import__(name)
            self.components[name] = module
            print(f"    \033[32m✓\033[0m {display}")
            await asyncio.sleep(0.1)
        except ImportError as e:
            print(f"    \033[33m⚠\033[0m {display} (standalone)")
            self.components[name] = None

    def get_hydra(self):
        """Get the Amoeba Hydra instance."""
        if "amoeba_hydra" in self.components and self.components["amoeba_hydra"]:
            return self.components["amoeba_hydra"].AmoebaHydra()
        return None

    def get_orchestrator(self):
        """Get the Fractal Orchestrator."""
        if "fractal_nodes" in self.components and self.components["fractal_nodes"]:
            return self.components["fractal_nodes"].FractalOrchestrator()
        return None

    def get_revenue_engine(self):
        """Get the Revenue Engine."""
        if "crypto_rail" in self.components and self.components["crypto_rail"]:
            return self.components["crypto_rail"].RevenueEngine()
        return None

    async def intent(self, voice_input: str):
        """Process voice intent through ARC loop."""
        hydra = self.get_hydra()
        if hydra:
            suggestions = hydra.arc.receive_intent(voice_input)
            return {
                "status": "awaiting_commit",
                "suggestions": suggestions[:5],
                "arc_state": hydra.arc.get_state()
            }
        return {"status": "offline", "error": "Hydra not loaded"}

    async def commit(self, command: str):
        """Commit an action through ARC loop."""
        hydra = self.get_hydra()
        if hydra:
            result = hydra.arc.commit(command)
            return result
        return {"status": "offline", "error": "Hydra not loaded"}

    def get_status(self):
        """Get full system status."""
        return {
            "status": self.status,
            "boot_time": self.boot_time.isoformat() if self.boot_time else None,
            "components": {k: v is not None for k, v in self.components.items()},
            "domains": {
                "primary": "eko.vision",
                "api": "0r8.ai",
                "apps": "apps.eko.vision",
                "oracle": "oracle.agency"
            }
        }


# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════

async def deploy_vercel():
    """Deploy to Vercel."""
    print("\n  \033[36m🚀 DEPLOYING TO VERCEL\033[0m\n")

    # Check for vercel CLI
    result = subprocess.run(["which", "vercel"], capture_output=True, text=True)
    if result.returncode != 0:
        print("    ⚠️  Vercel CLI not found. Install with: npm i -g vercel")
        print("    Then run: vercel --prod")
        return False

    # Deploy
    os.chdir(ORBOS_ROOT.parent)
    result = subprocess.run(["vercel", "--prod", "-y"], capture_output=True, text=True)
    print(result.stdout)

    if result.returncode == 0:
        print("    \033[32m✓ Deployed to Vercel\033[0m")
        return True
    else:
        print(f"    \033[31m✗ Deploy failed: {result.stderr}\033[0m")
        return False


async def deploy_netlify():
    """Deploy to Netlify."""
    print("\n  \033[36m🚀 DEPLOYING TO NETLIFY\033[0m\n")

    # Check for netlify CLI
    result = subprocess.run(["which", "netlify"], capture_output=True, text=True)
    if result.returncode != 0:
        print("    ⚠️  Netlify CLI not found. Install with: npm i -g netlify-cli")
        print("    Then run: netlify deploy --prod")
        return False

    # Deploy
    os.chdir(ORBOS_ROOT.parent)
    result = subprocess.run(["netlify", "deploy", "--prod"], capture_output=True, text=True)
    print(result.stdout)

    if result.returncode == 0:
        print("    \033[32m✓ Deployed to Netlify\033[0m")
        return True
    else:
        print(f"    \033[31m✗ Deploy failed: {result.stderr}\033[0m")
        return False


# ═══════════════════════════════════════════════════════════════════════════════
# INTERACTIVE CLI
# ═══════════════════════════════════════════════════════════════════════════════

async def interactive_mode(orbos: ORBOSLive):
    """Interactive CLI mode."""
    print("  \033[33m\"To what do I owe this pleasure?\"\033[0m\n")
    print("  Commands: intent <text> | commit <cmd> | status | deploy | exit\n")

    while True:
        try:
            cmd = input("  \033[35m∞Φ∞\033[0m ").strip()

            if not cmd:
                continue

            if cmd.lower() in ["exit", "quit", "q"]:
                print("\n  \033[36m∞Φ∞ Returning to silence...\033[0m\n")
                break

            if cmd.lower() == "status":
                status = orbos.get_status()
                print(f"\n  Status: {status['status']}")
                print(f"  Components: {sum(status['components'].values())}/{len(status['components'])}")
                print(f"  Domains: {', '.join(status['domains'].values())}\n")

            elif cmd.lower().startswith("intent "):
                intent_text = cmd[7:]
                result = await orbos.intent(intent_text)
                print(f"\n  [ARC] {result['status']}")
                if 'suggestions' in result:
                    for s in result['suggestions']:
                        opt = s.get('option', '?')
                        sig = s.get('signal', 'N/A')
                        w = s.get('weight', 0)
                        print(f"    {opt}. {sig} (w={w:.2f})")
                print()

            elif cmd.lower().startswith("commit "):
                commit_cmd = cmd[7:]
                result = await orbos.commit(commit_cmd)
                print(f"\n  [Commit] {result}\n")

            elif cmd.lower() == "deploy":
                print("\n  Deploy to: [1] Vercel  [2] Netlify  [3] Both")
                choice = input("  Choice: ").strip()
                if choice == "1":
                    await deploy_vercel()
                elif choice == "2":
                    await deploy_netlify()
                elif choice == "3":
                    await deploy_vercel()
                    await deploy_netlify()
                print()

            elif cmd.lower() == "pulse":
                hydra = orbos.get_hydra()
                if hydra:
                    pulse = hydra.get_pulse()
                    print(f"\n  Mode: {pulse['mode']}")
                    print(f"  Nodes: {pulse['total_nodes']}")
                    print(f"  Sensors: {pulse['sensors']}")
                    print(f"  Regenerations: {pulse['regenerations']}\n")

            elif cmd.lower() == "swarm":
                hydra = orbos.get_hydra()
                if hydra:
                    from amoeba_hydra import SwarmMode
                    hydra.set_mode(SwarmMode.SWARM)
                    print("\n  \033[31m⚡ SWARM MODE ACTIVATED\033[0m\n")

            elif cmd.lower() == "ghost":
                hydra = orbos.get_hydra()
                if hydra:
                    from amoeba_hydra import SwarmMode
                    hydra.set_mode(SwarmMode.GHOST)
                    print("\n  \033[36m👻 GHOST MODE ACTIVATED\033[0m\n")

            else:
                # Treat as intent
                result = await orbos.intent(cmd)
                if 'suggestions' in result and result['suggestions']:
                    print(f"\n  [ARC] Suggestions:")
                    for s in result['suggestions']:
                        opt = s.get('option', '?')
                        sig = s.get('signal', 'N/A')
                        print(f"    {opt}. {sig}")
                    print()
                else:
                    print(f"\n  [ARC] Processing: {cmd}\n")

        except KeyboardInterrupt:
            print("\n\n  \033[36m∞Φ∞ Interrupted. Returning to silence...\033[0m\n")
            break
        except EOFError:
            break
        except Exception as e:
            print(f"\n  \033[31mError: {e}\033[0m\n")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    """Main entry point."""
    args = sys.argv[1:]

    # Boot ORBOS
    orbos = ORBOSLive()
    await orbos.boot()

    if not args:
        # Interactive mode
        await interactive_mode(orbos)

    elif args[0] == "deploy":
        # Auto-deploy
        if len(args) > 1 and args[1] == "vercel":
            await deploy_vercel()
        elif len(args) > 1 and args[1] == "netlify":
            await deploy_netlify()
        else:
            await deploy_vercel()
            await deploy_netlify()

    elif args[0] == "status":
        status = orbos.get_status()
        print(json.dumps(status, indent=2))

    elif args[0] == "intent":
        if len(args) > 1:
            result = await orbos.intent(" ".join(args[1:]))
            print(json.dumps(result, indent=2, default=str))

    else:
        print(f"  Unknown command: {args[0]}")
        print("  Usage: orbos-live.py [deploy|status|intent <text>]")


if __name__ == "__main__":
    asyncio.run(main())

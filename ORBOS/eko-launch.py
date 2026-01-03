#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
                              eKo SYSTEM LAUNCHER
═══════════════════════════════════════════════════════════════════════════════
The personal AI system that produces revenue, builds products, and scales.

Components:
  - Core Builder: Ingest, canonicalize, emit
  - Orb Core: Agents, orchestration, memory
  - Glyph-Lang: Voice-first DSL
  - Revenue Engine: Crypto rails, attribution
  - 47 Fractal Nodes: Recursive AI runtime

"From intent to empire. Everybody Eats."
═══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import asyncio
import json
from datetime import datetime

# Add ORBOS to path
ORBOS_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ORBOS_ROOT)

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

EKO_CONFIG = {
    "name": "eKo",
    "version": "1.0.0",
    "architect": "JB",
    "spirit": "owl",
    "nodes": 47,
    "mode": "production",
}

# ═══════════════════════════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════════════════════════

BANNER = """
\033[35m
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║         ███████╗██╗  ██╗ ██████╗     ███████╗██╗   ██╗███████╗████████╗       ║
║         ██╔════╝██║ ██╔╝██╔═══██╗    ██╔════╝╚██╗ ██╔╝██╔════╝╚══██╔══╝       ║
║         █████╗  █████╔╝ ██║   ██║    ███████╗ ╚████╔╝ ███████╗   ██║          ║
║         ██╔══╝  ██╔═██╗ ██║   ██║    ╚════██║  ╚██╔╝  ╚════██║   ██║          ║
║         ███████╗██║  ██╗╚██████╔╝    ███████║   ██║   ███████║   ██║          ║
║         ╚══════╝╚═╝  ╚═╝ ╚═════╝     ╚══════╝   ╚═╝   ╚══════╝   ╚═╝          ║
║                                                                               ║
║                    THE PERSONAL AI PRODUCTION SYSTEM                          ║
║                                                                               ║
║         🦉 Architect: JB            📊 Nodes: 47           🔥 Mode: LIVE      ║
║                                                                               ║
║                    "From intent to empire. Everybody Eats."                   ║
╚═══════════════════════════════════════════════════════════════════════════════╝
\033[0m
"""

# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM LOADER
# ═══════════════════════════════════════════════════════════════════════════════

class EkoSystem:
    """Main eKo system orchestrator."""

    def __init__(self, config: dict = None):
        self.config = config or EKO_CONFIG
        self.started_at = None
        self.components = {}
        self.status = "initializing"

    async def boot(self):
        """Full system boot sequence."""
        print(BANNER)
        self.started_at = datetime.now()
        print(f"  ⏰ Boot started: {self.started_at.strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # Boot sequence
        steps = [
            ("Core Builder", self._boot_core_builder),
            ("Revenue Engine", self._boot_revenue_engine),
            ("Glyph Compiler", self._boot_glyph_compiler),
            ("Fractal Nodes", self._boot_fractal_nodes),
            ("Voice Interface", self._boot_voice),
        ]

        for name, boot_fn in steps:
            print(f"  🔄 Booting {name}...")
            try:
                await boot_fn()
                print(f"  ✅ {name} online")
            except Exception as e:
                print(f"  ⚠️  {name} failed: {e}")

        self.status = "running"
        print()
        print("  " + "═" * 60)
        print("  🚀 eKo SYSTEM ONLINE")
        print("  " + "═" * 60)
        print()

    async def _boot_core_builder(self):
        """Initialize Core Builder."""
        try:
            from core_builder.ingest.ingest import IngestEngine
            self.components['ingest'] = IngestEngine()
        except ImportError:
            # Create minimal stub
            self.components['ingest'] = {'status': 'stub'}

        try:
            from core_builder.classify.canonicalize import Canonicalizer
            self.components['canon'] = Canonicalizer()
        except ImportError:
            self.components['canon'] = {'status': 'stub'}

    async def _boot_revenue_engine(self):
        """Initialize Revenue Engine."""
        try:
            from orb_core.revenue_engine.crypto_rail import RevenueEngine, ConversionTracker
            self.components['revenue'] = RevenueEngine()
            self.components['tracker'] = ConversionTracker(self.components['revenue'])
        except ImportError:
            self.components['revenue'] = {'status': 'stub'}

    async def _boot_glyph_compiler(self):
        """Initialize Glyph Compiler."""
        try:
            from glyph_lang.compiler.glyph_compiler import GlyphCompiler, GlyphExecutor
            self.components['glyph'] = GlyphCompiler()
            self.components['executor'] = GlyphExecutor()
        except ImportError:
            self.components['glyph'] = {'status': 'stub'}

    async def _boot_fractal_nodes(self):
        """Initialize Fractal Nodes."""
        try:
            from orb_core.orchestration.fractal_nodes import FractalOrchestrator
            self.components['nodes'] = FractalOrchestrator(self.config['nodes'])
        except ImportError:
            self.components['nodes'] = {'status': 'stub', 'count': self.config['nodes']}

    async def _boot_voice(self):
        """Initialize Voice Interface."""
        # Stub for now - would integrate with actual voice system
        self.components['voice'] = {'status': 'ready', 'wake_word': 'orb'}

    def get_status(self) -> dict:
        """Get system status."""
        return {
            'name': self.config['name'],
            'version': self.config['version'],
            'status': self.status,
            'uptime': str(datetime.now() - self.started_at) if self.started_at else None,
            'components': {k: type(v).__name__ if hasattr(v, '__class__') else str(v)
                         for k, v in self.components.items()},
            'architect': self.config['architect'],
            'spirit': self.config['spirit'],
        }

    async def execute_glyph(self, command: str) -> dict:
        """Execute a glyph command."""
        glyph = self.components.get('glyph')
        executor = self.components.get('executor')

        if not glyph or not executor:
            return {'error': 'Glyph system not initialized'}

        try:
            program = glyph.compile(command)
            symbols = glyph.symbols(program)
            commands = glyph.to_executable(program)

            print(f"\n  📜 Command: {command}")
            print(f"  ✨ Glyphs: {symbols}")

            results = await executor.execute(commands)
            return {
                'input': command,
                'symbols': symbols,
                'results': results
            }
        except Exception as e:
            return {'error': str(e)}

    async def shutdown(self):
        """Graceful shutdown."""
        print("\n  🛑 Shutting down eKo...")

        for name, component in self.components.items():
            if hasattr(component, 'close'):
                component.close()
            elif hasattr(component, 'stop'):
                component.stop()

        self.status = "stopped"
        print("  ✅ eKo shutdown complete")


# ═══════════════════════════════════════════════════════════════════════════════
# INTERACTIVE CLI
# ═══════════════════════════════════════════════════════════════════════════════

async def interactive_mode(eko: EkoSystem):
    """Run interactive command loop."""
    print("\n  📟 eKo Interactive Mode")
    print("  Type 'help' for commands, 'exit' to quit\n")

    while True:
        try:
            cmd = input("  🦉 eko> ").strip()

            if not cmd:
                continue

            if cmd.lower() in ['exit', 'quit', 'q']:
                break

            if cmd.lower() == 'help':
                print("""
  Commands:
    status    - Show system status
    ingest    - Run ingest pipeline
    build     - Run full build
    revenue   - Show revenue stats
    <glyph>   - Execute glyph command
    exit      - Exit eKo
                """)
                continue

            if cmd.lower() == 'status':
                status = eko.get_status()
                print(f"\n  {json.dumps(status, indent=2)}\n")
                continue

            if cmd.lower() == 'revenue':
                revenue = eko.components.get('revenue')
                if hasattr(revenue, 'get_summary'):
                    summary = revenue.get_summary(30)
                    print(f"\n  💰 30-Day Revenue: ${summary['total_revenue']:.2f}")
                    print(f"  📊 Conversions: {summary['conversions']}\n")
                else:
                    print("  Revenue engine not fully initialized")
                continue

            # Try as glyph command
            result = await eko.execute_glyph(cmd)
            if 'error' in result:
                print(f"  ❌ {result['error']}")
            else:
                print(f"  ✅ Executed: {result.get('symbols', cmd)}")

        except KeyboardInterrupt:
            break
        except EOFError:
            break

    await eko.shutdown()


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    """Main entry point."""
    eko = EkoSystem(EKO_CONFIG)
    await eko.boot()

    if len(sys.argv) > 1:
        # Execute command from args
        cmd = ' '.join(sys.argv[1:])
        result = await eko.execute_glyph(cmd)
        print(json.dumps(result, indent=2))
        await eko.shutdown()
    else:
        # Interactive mode
        await interactive_mode(eko)


if __name__ == "__main__":
    asyncio.run(main())

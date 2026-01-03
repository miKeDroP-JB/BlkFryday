#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
GLYPH-LANG - VOICE-FIRST DSL COMPILER
═══════════════════════════════════════════════════════════════════════════════
Domain-specific language for voice commands, compression, and execution.

"Speak the glyphs. Shape reality."
═══════════════════════════════════════════════════════════════════════════════
"""

import re
import json
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum

# ═══════════════════════════════════════════════════════════════════════════════
# GLYPH TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class GlyphType(Enum):
    COMMAND = "command"      # Execute action
    QUERY = "query"          # Request information
    MODIFIER = "modifier"    # Modify next glyph
    MACRO = "macro"          # Expand to multiple glyphs
    FLOW = "flow"            # Control flow
    SPIRIT = "spirit"        # Spirit mode activation

# ═══════════════════════════════════════════════════════════════════════════════
# GLYPH REGISTRY - THE SACRED SYMBOLS
# ═══════════════════════════════════════════════════════════════════════════════

GLYPH_REGISTRY = {
    # ═══════════════════════════════════════════════════════════════════════════
    # COMMAND GLYPHS
    # ═══════════════════════════════════════════════════════════════════════════

    # Builder Commands
    "BUILD": {"type": GlyphType.COMMAND, "action": "core-builder.emit.build", "symbol": "🔨"},
    "INGEST": {"type": GlyphType.COMMAND, "action": "core-builder.ingest.ingest", "symbol": "📥"},
    "CANON": {"type": GlyphType.COMMAND, "action": "core-builder.classify.canonicalize", "symbol": "📋"},
    "DEPLOY": {"type": GlyphType.COMMAND, "action": "orb-core.orchestration.deploy", "symbol": "🚀"},

    # Agent Commands
    "AWAKEN": {"type": GlyphType.COMMAND, "action": "orb-core.agents.awaken", "symbol": "⚡"},
    "SPAWN": {"type": GlyphType.COMMAND, "action": "orb-core.orchestration.spawn", "symbol": "✨"},
    "SWARM": {"type": GlyphType.COMMAND, "action": "orb-core.orchestration.swarm", "symbol": "🐝"},
    "HALT": {"type": GlyphType.COMMAND, "action": "orb-core.agents.halt", "symbol": "🛑"},

    # Memory Commands
    "STORE": {"type": GlyphType.COMMAND, "action": "orb-core.memory.store", "symbol": "💾"},
    "RECALL": {"type": GlyphType.COMMAND, "action": "orb-core.memory.recall", "symbol": "🧠"},
    "FORGET": {"type": GlyphType.COMMAND, "action": "orb-core.memory.forget", "symbol": "💨"},

    # System Commands
    "STATUS": {"type": GlyphType.COMMAND, "action": "orb-core.system.status", "symbol": "📊"},
    "BOOT": {"type": GlyphType.COMMAND, "action": "orb-core.system.boot", "symbol": "🔌"},
    "SHUTDOWN": {"type": GlyphType.COMMAND, "action": "orb-core.system.shutdown", "symbol": "⭕"},

    # ═══════════════════════════════════════════════════════════════════════════
    # QUERY GLYPHS
    # ═══════════════════════════════════════════════════════════════════════════

    "SHOW": {"type": GlyphType.QUERY, "action": "display", "symbol": "👁️"},
    "COUNT": {"type": GlyphType.QUERY, "action": "count", "symbol": "🔢"},
    "FIND": {"type": GlyphType.QUERY, "action": "search", "symbol": "🔍"},
    "LIST": {"type": GlyphType.QUERY, "action": "list", "symbol": "📜"},

    # ═══════════════════════════════════════════════════════════════════════════
    # MODIFIER GLYPHS
    # ═══════════════════════════════════════════════════════════════════════════

    "ALL": {"type": GlyphType.MODIFIER, "scope": "all", "symbol": "🌐"},
    "FAST": {"type": GlyphType.MODIFIER, "mode": "fast", "symbol": "⚡"},
    "SAFE": {"type": GlyphType.MODIFIER, "mode": "safe", "symbol": "🛡️"},
    "DEEP": {"type": GlyphType.MODIFIER, "mode": "deep", "symbol": "🌊"},
    "SILENT": {"type": GlyphType.MODIFIER, "mode": "silent", "symbol": "🤫"},

    # ═══════════════════════════════════════════════════════════════════════════
    # SPIRIT GLYPHS
    # ═══════════════════════════════════════════════════════════════════════════

    "OWL": {"type": GlyphType.SPIRIT, "spirit": "owl", "symbol": "🦉"},
    "FOX": {"type": GlyphType.SPIRIT, "spirit": "fox", "symbol": "🦊"},
    "DRAGON": {"type": GlyphType.SPIRIT, "spirit": "dragon", "symbol": "🐉"},
    "PHOENIX": {"type": GlyphType.SPIRIT, "spirit": "phoenix", "symbol": "🔥"},
    "WOLF": {"type": GlyphType.SPIRIT, "spirit": "wolf", "symbol": "🐺"},
    "RAVEN": {"type": GlyphType.SPIRIT, "spirit": "raven", "symbol": "🐦‍⬛"},
    "SERPENT": {"type": GlyphType.SPIRIT, "spirit": "serpent", "symbol": "🐍"},
    "EAGLE": {"type": GlyphType.SPIRIT, "spirit": "eagle", "symbol": "🦅"},

    # ═══════════════════════════════════════════════════════════════════════════
    # MACRO GLYPHS (Expand to multiple commands)
    # ═══════════════════════════════════════════════════════════════════════════

    "FULLBUILD": {
        "type": GlyphType.MACRO,
        "expansion": ["INGEST", "CANON", "BUILD", "DEPLOY"],
        "symbol": "🏗️"
    },
    "WAKEALL": {
        "type": GlyphType.MACRO,
        "expansion": ["BOOT", "AWAKEN", "SWARM"],
        "symbol": "🌅"
    },
    "BACKUP": {
        "type": GlyphType.MACRO,
        "expansion": ["STORE", "ALL"],
        "symbol": "💿"
    },

    # ═══════════════════════════════════════════════════════════════════════════
    # FLOW GLYPHS
    # ═══════════════════════════════════════════════════════════════════════════

    "IF": {"type": GlyphType.FLOW, "control": "conditional", "symbol": "❓"},
    "THEN": {"type": GlyphType.FLOW, "control": "then", "symbol": "➡️"},
    "ELSE": {"type": GlyphType.FLOW, "control": "else", "symbol": "↪️"},
    "LOOP": {"type": GlyphType.FLOW, "control": "loop", "symbol": "🔄"},
    "WAIT": {"type": GlyphType.FLOW, "control": "wait", "symbol": "⏳"},
}

# ═══════════════════════════════════════════════════════════════════════════════
# VOICE PATTERNS - Natural language to glyph mapping
# ═══════════════════════════════════════════════════════════════════════════════

VOICE_PATTERNS = [
    # Build commands
    (r"\b(build|compile|create)\s*(everything|all|full)?\b", ["FULLBUILD"]),
    (r"\b(build|compile|make)\s*(?:the\s+)?(project|system|app)\b", ["BUILD"]),
    (r"\b(ingest|import|load)\s*(files?|data|archives?)?\b", ["INGEST"]),
    (r"\bcanonical(ize)?\b", ["CANON"]),
    (r"\bdeploy\b", ["DEPLOY"]),

    # Agent commands
    (r"\b(awaken?|wake|start)\s*(agents?|all)?\b", ["AWAKEN"]),
    (r"\bspawn\s*(\d+)?\s*(nodes?|agents?)?\b", ["SPAWN"]),
    (r"\bswarm\b", ["SWARM"]),
    (r"\b(halt|stop|kill)\s*(all|agents?)?\b", ["HALT"]),

    # Memory commands
    (r"\b(store|save|remember)\b", ["STORE"]),
    (r"\b(recall|retrieve|remember)\b", ["RECALL"]),
    (r"\b(forget|delete|clear)\b", ["FORGET"]),

    # Status/info
    (r"\b(status|state|health)\b", ["STATUS"]),
    (r"\bshow\s+(.+)\b", ["SHOW"]),
    (r"\bcount\s+(.+)\b", ["COUNT"]),
    (r"\bfind\s+(.+)\b", ["FIND"]),
    (r"\blist\s+(.+)\b", ["LIST"]),

    # Spirits
    (r"\b(be|become|switch\s+to)\s*(owl)\b", ["OWL"]),
    (r"\b(be|become|switch\s+to)\s*(fox)\b", ["FOX"]),
    (r"\b(be|become|switch\s+to)\s*(dragon)\b", ["DRAGON"]),
    (r"\b(be|become|switch\s+to)\s*(phoenix)\b", ["PHOENIX"]),
    (r"\b(be|become|switch\s+to)\s*(wolf)\b", ["WOLF"]),

    # Modifiers
    (r"\bquick(ly)?|fast\b", ["FAST"]),
    (r"\bsafe(ly)?|careful(ly)?\b", ["SAFE"]),
    (r"\bdeep(ly)?|thorough(ly)?\b", ["DEEP"]),
    (r"\bsilent(ly)?|quiet(ly)?\b", ["SILENT"]),
    (r"\ball|everything\b", ["ALL"]),
]

# ═══════════════════════════════════════════════════════════════════════════════
# GLYPH AST
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class GlyphNode:
    """AST node for a glyph."""
    glyph: str
    type: GlyphType
    symbol: str
    data: Dict[str, Any]
    modifiers: List[str] = None
    children: List['GlyphNode'] = None

    def __post_init__(self):
        self.modifiers = self.modifiers or []
        self.children = self.children or []

@dataclass
class GlyphProgram:
    """Complete glyph program AST."""
    nodes: List[GlyphNode]
    source: str
    metadata: Dict[str, Any] = None

# ═══════════════════════════════════════════════════════════════════════════════
# COMPILER
# ═══════════════════════════════════════════════════════════════════════════════

class GlyphCompiler:
    """
    Compiles voice/text input into executable glyph programs.
    """

    def __init__(self):
        self.registry = GLYPH_REGISTRY
        self.patterns = VOICE_PATTERNS
        self.macros = {k: v for k, v in self.registry.items() if v.get('type') == GlyphType.MACRO}

    def tokenize(self, text: str) -> List[str]:
        """Convert text to glyph tokens."""
        text = text.upper().strip()

        # Direct glyph match
        tokens = []
        words = text.split()

        for word in words:
            # Clean punctuation
            word = re.sub(r'[^\w]', '', word)
            if word in self.registry:
                tokens.append(word)

        # If no direct matches, try voice patterns
        if not tokens:
            tokens = self.parse_voice(text.lower())

        return tokens

    def parse_voice(self, text: str) -> List[str]:
        """Parse natural language into glyphs."""
        tokens = []

        for pattern, glyphs in self.patterns:
            if re.search(pattern, text, re.IGNORECASE):
                tokens.extend(glyphs)

        return tokens

    def expand_macros(self, tokens: List[str]) -> List[str]:
        """Expand macro glyphs into their component glyphs."""
        expanded = []

        for token in tokens:
            glyph = self.registry.get(token, {})
            if glyph.get('type') == GlyphType.MACRO:
                expansion = glyph.get('expansion', [])
                expanded.extend(self.expand_macros(expansion))
            else:
                expanded.append(token)

        return expanded

    def parse(self, tokens: List[str]) -> GlyphProgram:
        """Parse tokens into AST."""
        nodes = []
        modifiers = []

        for token in tokens:
            glyph = self.registry.get(token)
            if not glyph:
                continue

            glyph_type = glyph.get('type', GlyphType.COMMAND)

            if glyph_type == GlyphType.MODIFIER:
                modifiers.append(token)
            else:
                node = GlyphNode(
                    glyph=token,
                    type=glyph_type,
                    symbol=glyph.get('symbol', ''),
                    data=glyph,
                    modifiers=modifiers.copy()
                )
                nodes.append(node)
                modifiers = []  # Reset after applying

        return GlyphProgram(nodes=nodes, source=' '.join(tokens))

    def compile(self, text: str) -> GlyphProgram:
        """Full compilation pipeline: text -> tokens -> expand -> parse."""
        tokens = self.tokenize(text)
        tokens = self.expand_macros(tokens)
        program = self.parse(tokens)
        return program

    def to_executable(self, program: GlyphProgram) -> List[Dict]:
        """Convert program to executable commands."""
        commands = []

        for node in program.nodes:
            cmd = {
                'glyph': node.glyph,
                'symbol': node.symbol,
                'type': node.type.value,
                'modifiers': node.modifiers
            }

            if node.type == GlyphType.COMMAND:
                cmd['action'] = node.data.get('action')
            elif node.type == GlyphType.SPIRIT:
                cmd['spirit'] = node.data.get('spirit')
            elif node.type == GlyphType.QUERY:
                cmd['query'] = node.data.get('action')

            commands.append(cmd)

        return commands

    def symbols(self, program: GlyphProgram) -> str:
        """Get visual symbol representation of program."""
        return ' '.join(node.symbol for node in program.nodes)


# ═══════════════════════════════════════════════════════════════════════════════
# EXECUTOR
# ═══════════════════════════════════════════════════════════════════════════════

class GlyphExecutor:
    """Executes compiled glyph programs."""

    def __init__(self):
        self.handlers: Dict[str, Callable] = {}
        self.current_spirit = "owl"
        self.context: Dict[str, Any] = {}

    def register(self, action: str, handler: Callable):
        """Register action handler."""
        self.handlers[action] = handler

    async def execute(self, commands: List[Dict]) -> List[Any]:
        """Execute a list of commands."""
        results = []

        for cmd in commands:
            try:
                result = await self._execute_one(cmd)
                results.append({'command': cmd['glyph'], 'result': result, 'status': 'success'})
            except Exception as e:
                results.append({'command': cmd['glyph'], 'error': str(e), 'status': 'error'})

        return results

    async def _execute_one(self, cmd: Dict) -> Any:
        """Execute a single command."""
        glyph = cmd['glyph']
        cmd_type = cmd['type']

        if cmd_type == 'spirit':
            self.current_spirit = cmd.get('spirit', 'owl')
            return f"Spirit changed to {self.current_spirit}"

        action = cmd.get('action')
        if action and action in self.handlers:
            handler = self.handlers[action]
            return await handler(cmd)

        # Default: return acknowledgment
        return f"Executed: {glyph}"


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██████╗ ██╗  ██╗   ██╗██████╗ ██╗  ██╗                                   ║
║    ██╔════╝ ██║  ╚██╗ ██╔╝██╔══██╗██║  ██║                                   ║
║    ██║  ███╗██║   ╚████╔╝ ██████╔╝███████║                                   ║
║    ██║   ██║██║    ╚██╔╝  ██╔═══╝ ██╔══██║                                   ║
║    ╚██████╔╝███████╗██║   ██║     ██║  ██║                                   ║
║     ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝  ╚═╝                                   ║
║                                                                               ║
║                    GLYPH-LANG COMPILER                                        ║
║              "Speak the glyphs. Shape reality."                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    """)

    compiler = GlyphCompiler()

    # Demo compilation
    test_inputs = [
        "BUILD INGEST DEPLOY",
        "build everything",
        "awaken agents",
        "FAST SPAWN SWARM",
        "switch to owl",
        "FULLBUILD",
        "show status",
    ]

    for text in test_inputs:
        print(f"\n  Input: \"{text}\"")
        program = compiler.compile(text)
        symbols = compiler.symbols(program)
        commands = compiler.to_executable(program)

        print(f"  Symbols: {symbols}")
        print(f"  Commands: {json.dumps(commands, indent=2)}")


if __name__ == "__main__":
    main()

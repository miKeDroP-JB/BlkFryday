#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
CHANNEL 0 - Personal Intent Interface
═══════════════════════════════════════════════════════════════════
"Your thoughts become commands. Your intent shapes reality."

Channel 0 is the bridge between your consciousness and the system.
It maintains context, transforms commands, and aligns with your flow.
═══════════════════════════════════════════════════════════════════
"""

import asyncio
import json
import os
import socket
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [CHANNEL0] %(levelname)s: %(message)s'
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────

SOCKET_PATH = os.environ.get('CHANNEL0_SOCKET', '/tmp/channel0.sock')
CONFIG_PATH = Path(os.environ.get('CHANNEL0_CONFIG', '/etc/vyra/channel0.yaml'))
STATE_PATH = Path(os.environ.get('CHANNEL0_STATE', '/var/lib/vyra/channel0/state.json'))
SWARM_API = os.environ.get('SWARM_API', 'http://localhost:7777')

# Default configuration
DEFAULT_CONFIG = {
    'persistence': True,
    'context_window': 100,
    'macros': {
        'build-server': 'summon-agent hephaestus "Build a server: {args}"',
        'deploy-swarm': 'deploy-swarm {args}',
        'spin-node': 'node {args} &',
        'open-timeline': 'git log --graph --oneline -20',
        'focus': 'enable-focus-mode',
        'flow': 'enable-flow-state'
    },
    'aliases': {},
    'intent_patterns': [
        {'pattern': r'build (?:a |an )?(.+)', 'action': 'build', 'extract': 'target'},
        {'pattern': r'deploy (.+)', 'action': 'deploy', 'extract': 'target'},
        {'pattern': r'analyze (.+)', 'action': 'analyze', 'extract': 'target'},
        {'pattern': r'find (.+)', 'action': 'search', 'extract': 'query'},
        {'pattern': r'show (.+)', 'action': 'display', 'extract': 'target'}
    ]
}

# ─────────────────────────────────────────────────────────────────
# Context Manager
# ─────────────────────────────────────────────────────────────────

class ContextManager:
    """Maintains conversation and command context"""

    def __init__(self, max_entries: int = 100):
        self.max_entries = max_entries
        self.history: List[Dict[str, Any]] = []
        self.variables: Dict[str, Any] = {}
        self.focus_target: Optional[str] = None
        self.timeline: str = "main"

    def add_entry(self, entry_type: str, content: str, metadata: Dict = None):
        entry = {
            'timestamp': datetime.now().isoformat(),
            'type': entry_type,
            'content': content,
            'metadata': metadata or {}
        }
        self.history.append(entry)

        # Trim if needed
        if len(self.history) > self.max_entries:
            self.history = self.history[-self.max_entries:]

    def set_variable(self, key: str, value: Any):
        self.variables[key] = value

    def get_variable(self, key: str, default: Any = None) -> Any:
        return self.variables.get(key, default)

    def get_recent(self, n: int = 10) -> List[Dict]:
        return self.history[-n:]

    def to_dict(self) -> Dict:
        return {
            'history': self.history,
            'variables': self.variables,
            'focus_target': self.focus_target,
            'timeline': self.timeline
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'ContextManager':
        ctx = cls()
        ctx.history = data.get('history', [])
        ctx.variables = data.get('variables', {})
        ctx.focus_target = data.get('focus_target')
        ctx.timeline = data.get('timeline', 'main')
        return ctx

# ─────────────────────────────────────────────────────────────────
# Intent Parser
# ─────────────────────────────────────────────────────────────────

class IntentParser:
    """Parses natural language into actionable intents"""

    def __init__(self, patterns: List[Dict]):
        import re
        self.patterns = [(re.compile(p['pattern'], re.IGNORECASE), p) for p in patterns]

    def parse(self, text: str) -> Optional[Dict[str, Any]]:
        for pattern, config in self.patterns:
            match = pattern.match(text.strip())
            if match:
                return {
                    'action': config['action'],
                    'extract': match.group(1) if match.groups() else None,
                    'raw': text
                }
        return None

# ─────────────────────────────────────────────────────────────────
# Macro Expander
# ─────────────────────────────────────────────────────────────────

class MacroExpander:
    """Expands macros and command shortcuts"""

    def __init__(self, macros: Dict[str, str], aliases: Dict[str, str]):
        self.macros = macros
        self.aliases = aliases

    def expand(self, command: str) -> str:
        parts = command.strip().split(maxsplit=1)
        if not parts:
            return command

        cmd = parts[0]
        args = parts[1] if len(parts) > 1 else ""

        # Check aliases first
        if cmd in self.aliases:
            cmd = self.aliases[cmd]

        # Check macros
        if cmd in self.macros:
            template = self.macros[cmd]
            return template.format(args=args, **self._get_context_vars())

        return command

    def _get_context_vars(self) -> Dict[str, str]:
        return {
            'cwd': os.getcwd(),
            'user': os.environ.get('USER', 'vyra'),
            'home': os.environ.get('HOME', '/home/vyra'),
            'timestamp': datetime.now().isoformat()
        }

# ─────────────────────────────────────────────────────────────────
# Channel 0 Core
# ─────────────────────────────────────────────────────────────────

class Channel0:
    """The core Channel 0 daemon"""

    def __init__(self):
        self.config = self._load_config()
        self.context = ContextManager(self.config.get('context_window', 100))
        self.intent_parser = IntentParser(self.config.get('intent_patterns', []))
        self.macro_expander = MacroExpander(
            self.config.get('macros', {}),
            self.config.get('aliases', {})
        )
        self.running = False

        # Load persisted state
        if self.config.get('persistence', True):
            self._load_state()

    def _load_config(self) -> Dict:
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH) as f:
                user_config = yaml.safe_load(f) or {}
                return {**DEFAULT_CONFIG, **user_config}
        return DEFAULT_CONFIG

    def _load_state(self):
        if STATE_PATH.exists():
            try:
                with open(STATE_PATH) as f:
                    data = json.load(f)
                    self.context = ContextManager.from_dict(data)
                    logger.info("State restored from persistence")
            except Exception as e:
                logger.warning(f"Could not load state: {e}")

    def _save_state(self):
        if self.config.get('persistence', True):
            STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
            with open(STATE_PATH, 'w') as f:
                json.dump(self.context.to_dict(), f)

    async def process_input(self, raw_input: str) -> Dict[str, Any]:
        """Process incoming input from the channel"""

        # Log input
        self.context.add_entry('input', raw_input)

        # Try to parse as intent
        intent = self.intent_parser.parse(raw_input)
        if intent:
            result = await self._handle_intent(intent)
            return result

        # Expand macros
        expanded = self.macro_expander.expand(raw_input)
        if expanded != raw_input:
            return {
                'type': 'macro_expansion',
                'original': raw_input,
                'expanded': expanded,
                'execute': True
            }

        # Pass through as raw command
        return {
            'type': 'passthrough',
            'command': raw_input
        }

    async def _handle_intent(self, intent: Dict) -> Dict[str, Any]:
        """Handle parsed intent"""

        action = intent['action']
        target = intent.get('extract')

        if action == 'build':
            return {
                'type': 'agent_task',
                'agent': 'hephaestus',
                'task': f'build {target}',
                'intent': intent
            }
        elif action == 'deploy':
            return {
                'type': 'swarm_deploy',
                'target': target,
                'intent': intent
            }
        elif action == 'analyze':
            return {
                'type': 'agent_task',
                'agent': 'athena',
                'task': f'analyze {target}',
                'intent': intent
            }
        elif action == 'search':
            return {
                'type': 'search',
                'query': target,
                'intent': intent
            }
        elif action == 'display':
            return {
                'type': 'display',
                'target': target,
                'intent': intent
            }

        return {'type': 'unknown_intent', 'intent': intent}

    async def handle_connection(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Handle incoming socket connection"""

        addr = writer.get_extra_info('peername')
        logger.info(f"Connection from {addr}")

        try:
            while True:
                data = await reader.readline()
                if not data:
                    break

                message = data.decode().strip()
                if not message:
                    continue

                logger.debug(f"Received: {message}")

                # Process input
                result = await self.process_input(message)

                # Send response
                response = json.dumps(result) + '\n'
                writer.write(response.encode())
                await writer.drain()

                # Save state
                self._save_state()

        except Exception as e:
            logger.error(f"Connection error: {e}")
        finally:
            writer.close()
            await writer.wait_closed()
            logger.info(f"Connection closed: {addr}")

    async def start_unix_socket(self):
        """Start Unix socket server"""

        # Remove existing socket
        if os.path.exists(SOCKET_PATH):
            os.unlink(SOCKET_PATH)

        server = await asyncio.start_unix_server(
            self.handle_connection,
            path=SOCKET_PATH
        )

        # Set permissions
        os.chmod(SOCKET_PATH, 0o660)

        logger.info(f"Channel 0 listening on {SOCKET_PATH}")

        self.running = True
        async with server:
            await server.serve_forever()

    async def start_tcp_server(self, host: str = '127.0.0.1', port: int = 7700):
        """Start TCP server (alternative to Unix socket)"""

        server = await asyncio.start_server(
            self.handle_connection,
            host, port
        )

        logger.info(f"Channel 0 listening on {host}:{port}")

        self.running = True
        async with server:
            await server.serve_forever()

    def stop(self):
        """Stop the daemon"""
        self.running = False
        self._save_state()
        if os.path.exists(SOCKET_PATH):
            os.unlink(SOCKET_PATH)
        logger.info("Channel 0 stopped")

# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────

async def main():
    """Main entry point"""

    print("""
╔═══════════════════════════════════════════════════════════════════╗
║                        CHANNEL 0                                  ║
║              Personal Intent Interface                            ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    channel = Channel0()

    try:
        await channel.start_unix_socket()
    except KeyboardInterrupt:
        channel.stop()

if __name__ == '__main__':
    asyncio.run(main())

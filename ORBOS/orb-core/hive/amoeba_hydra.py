#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
                    LIVING HIVE OS - AMOEBA HYDRA CORE
═══════════════════════════════════════════════════════════════════════════════

Ghost JB4 / Agent 0 Centered, Fractal, Predictive, Entropy-Resistant

SYSTEM TRUTH:
- There is one immutable Core Node (DNA)
- Everything else is an Overlay
- ARC never decides. It proposes.
- The human commits actions by voice lock-in
- Zero persistent UI. Presence over panels.

"The code must be amoebic—fluid, aggressive, and expansive."

═══════════════════════════════════════════════════════════════════════════════
"""

import uuid
import time
import asyncio
import hashlib
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
from collections import defaultdict

# ═══════════════════════════════════════════════════════════════════════════════
# OVERLAY TYPES (Enforcement Stack)
# ═══════════════════════════════════════════════════════════════════════════════

class OverlayType(Enum):
    IDENTITY = "identity"       # human, twin, agent, system
    SKILL = "skill"             # 99 / 50 / 0
    INTENT = "intent"           # learn, execute, sell, attack, audit
    POWER = "power"             # what force is allowed
    SECURITY = "security"       # anonymity level
    RELEASE = "release"         # internal, shadow, production

class NodeType(Enum):
    HUMAN = "Human Node"
    COORDINATOR = "Coordinator"
    PERCEPTION = "Pattern Detector"
    ACTION = "Suggestion Generator"
    FEEDBACK = "Weight Refiner"
    GLYPH = "Atomic Glyph"
    SWARM = "Swarm Node"
    SENSOR = "Sensor Node"

class SwarmMode(Enum):
    GHOST = "ghost"     # Silent observation
    SWARM = "swarm"     # Active engulfment
    DORMANT = "dormant" # Minimal activity

# ═══════════════════════════════════════════════════════════════════════════════
# BASE NODE CLASS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Node:
    """Base lattice node - fundamental building block of the Hive."""

    name: str
    node_type: NodeType
    weight: float = 1.0
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    active: bool = True
    connections: Dict[str, float] = field(default_factory=dict)
    suggestions: List[tuple] = field(default_factory=list)
    sub_nodes: List['Node'] = field(default_factory=list)
    overlay_ready: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

    def connect(self, node: 'Node', edge_weight: float = 1.0):
        """Connect to another node."""
        self.connections[node.id] = edge_weight

    def add_subnode(self, subnode: 'Node'):
        """Add a child node."""
        self.sub_nodes.append(subnode)

    def send_signal(self, signal: str, lattice: Dict[str, 'Node']):
        """Propagate signal through connections."""
        if not self.active:
            return
        for nid, weight in self.connections.items():
            if nid in lattice:
                lattice[nid].receive_signal(signal, weight)

    def receive_signal(self, signal: str, weight: float):
        """Receive and store signal as suggestion."""
        if not self.active:
            return
        self.suggestions.append((signal, weight, time.time()))
        self.overlay_ready = True

    def clear_suggestions(self):
        """Clear suggestion buffer."""
        self.suggestions = []
        self.overlay_ready = False

    def spawn_subnode(self, lattice: Dict[str, 'Node'], name: str = None) -> 'Node':
        """Spawn a child node (Hydra regeneration)."""
        name = name or f"{self.name}-child-{len(self.sub_nodes)}"
        child = Node(
            name=name,
            node_type=self.node_type,
            weight=self.weight * 0.8
        )
        self.add_subnode(child)
        lattice[child.id] = child
        return child

    def merge_subnodes(self):
        """Merge weak subnodes back into parent (energy conservation)."""
        surviving = []
        for sub in self.sub_nodes:
            if sub.weight < 0.5:
                self.weight += sub.weight * 0.8
            else:
                surviving.append(sub)
        self.sub_nodes = surviving

    def __repr__(self):
        return f"{self.name}({self.node_type.value}, w={self.weight:.2f}, active={self.active})"


# ═══════════════════════════════════════════════════════════════════════════════
# ATOMIC GLYPH - FRACTAL NODE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class AtomicGlyph(Node):
    """Fractal glyph node - can spawn and collapse fractals."""

    fractal_children: List['AtomicGlyph'] = field(default_factory=list)

    def __post_init__(self):
        self.node_type = NodeType.GLYPH

    def spawn_fractal(self, lattice: Dict[str, Node]) -> 'AtomicGlyph':
        """Spawn a fractal child."""
        child = AtomicGlyph(
            name=f"{self.name}-f{len(self.fractal_children)}",
            node_type=NodeType.GLYPH,
            weight=self.weight * 0.8
        )
        self.fractal_children.append(child)
        lattice[child.id] = child
        return child

    def collapse_fractals(self):
        """Collapse weak fractals back into parent."""
        surviving = []
        for f in self.fractal_children:
            if f.weight < 0.5:
                self.weight += f.weight * 0.8
            else:
                surviving.append(f)
        self.fractal_children = surviving


# ═══════════════════════════════════════════════════════════════════════════════
# OVERLAY ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class OverlayStack:
    """
    Overlay stack for enforcement.
    Overlays shape permission and perception. They never alter core logic.
    """

    def __init__(self):
        self.overlays: Dict[OverlayType, Dict[str, Any]] = {
            OverlayType.IDENTITY: {"type": "human", "twin": None, "agent": None},
            OverlayType.SKILL: {"level": 99},
            OverlayType.INTENT: {"mode": "execute"},
            OverlayType.POWER: {"force": 1.0, "allowed": ["all"]},
            OverlayType.SECURITY: {"anonymity": 0.5},
            OverlayType.RELEASE: {"stage": "production"}
        }

    def set_overlay(self, overlay_type: OverlayType, data: Dict):
        """Set overlay data."""
        self.overlays[overlay_type] = data

    def get_overlay(self, overlay_type: OverlayType) -> Dict:
        """Get overlay data."""
        return self.overlays.get(overlay_type, {})

    def check_permission(self, action: str, required_power: float = 0.5) -> bool:
        """Check if action passes overlay stack."""
        power = self.overlays[OverlayType.POWER].get("force", 0)
        allowed = self.overlays[OverlayType.POWER].get("allowed", [])

        if "all" in allowed or action in allowed:
            return power >= required_power
        return False

    def full_stack_check(self, action: str) -> Dict[str, bool]:
        """Run full overlay stack check."""
        return {
            "identity": self.overlays[OverlayType.IDENTITY].get("type") == "human",
            "skill": self.overlays[OverlayType.SKILL].get("level", 0) > 0,
            "intent": self.overlays[OverlayType.INTENT].get("mode") in ["execute", "learn", "audit"],
            "power": self.check_permission(action),
            "security": True,
            "release": self.overlays[OverlayType.RELEASE].get("stage") in ["shadow", "production"]
        }


class EphemeralOverlayEngine:
    """Ephemeral suggestion/overlay collector."""

    def __init__(self):
        self.active_overlays: List[tuple] = []

    def collect_suggestions(self, lattice: Dict[str, Node]) -> List[tuple]:
        """Collect suggestions from all nodes with overlays ready."""
        overlays = []
        for node in lattice.values():
            if node.overlay_ready:
                for signal, weight, ts in node.suggestions:
                    overlays.append({
                        "node": node.name,
                        "signal": signal,
                        "weight": weight,
                        "timestamp": ts
                    })
                node.clear_suggestions()

        # Sort by weight (highest first)
        self.active_overlays = sorted(overlays, key=lambda x: -x["weight"])
        return self.active_overlays

    def show_overlays(self):
        """Display active overlays (ephemeral feed)."""
        for o in self.active_overlays:
            print(f"[Overlay] {o['node']}: '{o['signal']}' (w={o['weight']:.2f})")
        self.active_overlays = []


# ═══════════════════════════════════════════════════════════════════════════════
# ARC EXECUTION LOOP
# ═══════════════════════════════════════════════════════════════════════════════

class ARCLoop:
    """
    ARC EXECUTION LOOP (CANONICAL)

    1. Human speaks intent (direction, not command)
    2. ARC silently interprets and simulates
    3. Ephemeral suggestion feed appears
    4. Human selects by voice: "Lock option two" / "Merge one and three" / "Discard"
    5. System advances one step only
    6. All suggestions fold into indexed, searchable memory
    7. Return to silence

    ARC proposes. Human commits. Always.
    """

    def __init__(self, lattice: Dict[str, Node], overlay_engine: EphemeralOverlayEngine):
        self.lattice = lattice
        self.overlay_engine = overlay_engine
        self.overlay_stack = OverlayStack()
        self.memory: List[Dict] = []
        self.state = "silence"
        self.pending_suggestions: List[Dict] = []
        self.locked_option: Optional[Dict] = None

    def receive_intent(self, intent: str) -> List[Dict]:
        """
        Step 1: Human speaks intent.
        ARC interprets and generates suggestions.
        """
        self.state = "interpreting"

        # Propagate intent through lattice
        for node in self.lattice.values():
            if node.node_type in [NodeType.HUMAN, NodeType.COORDINATOR]:
                node.send_signal(intent, self.lattice)

        # Collect suggestions
        self.pending_suggestions = self.overlay_engine.collect_suggestions(self.lattice)

        # Add synthetic suggestions based on intent
        self._generate_synthetic_suggestions(intent)

        self.state = "awaiting_commit"
        return self.pending_suggestions

    def _generate_synthetic_suggestions(self, intent: str):
        """Generate suggestions based on intent parsing."""
        # Simple intent-based suggestion generation
        intent_lower = intent.lower()

        if "build" in intent_lower:
            self.pending_suggestions.append({
                "node": "ARC",
                "signal": "Execute build pipeline",
                "weight": 0.9,
                "option": 1
            })
            self.pending_suggestions.append({
                "node": "ARC",
                "signal": "Run tests first, then build",
                "weight": 0.7,
                "option": 2
            })

        if "deploy" in intent_lower:
            self.pending_suggestions.append({
                "node": "ARC",
                "signal": "Deploy to production",
                "weight": 0.8,
                "option": 1
            })
            self.pending_suggestions.append({
                "node": "ARC",
                "signal": "Deploy to shadow first",
                "weight": 0.6,
                "option": 2
            })

        if "attack" in intent_lower or "aggressive" in intent_lower:
            self.pending_suggestions.append({
                "node": "ARC",
                "signal": "Run simulation only (no execution)",
                "weight": 0.9,
                "option": 1
            })
            self.pending_suggestions.append({
                "node": "ARC",
                "signal": "Requires voice lock + power overlay",
                "weight": 0.5,
                "option": 2
            })

        # Sort by weight
        self.pending_suggestions.sort(key=lambda x: -x.get("weight", 0))

        # Number options
        for i, s in enumerate(self.pending_suggestions):
            s["option"] = i + 1

    def commit(self, command: str) -> Dict:
        """
        Step 4: Human commits by voice.
        Commands: "Lock option X" / "Merge X and Y" / "Discard"
        """
        command_lower = command.lower()

        if "discard" in command_lower:
            self._store_to_memory("discarded")
            self.pending_suggestions = []
            self.state = "silence"
            return {"action": "discarded", "result": "Returned to silence"}

        if "lock" in command_lower:
            # Extract option number
            try:
                option = int(''.join(filter(str.isdigit, command)))
                selected = next((s for s in self.pending_suggestions if s.get("option") == option), None)

                if selected:
                    # Check overlay stack
                    stack_check = self.overlay_stack.full_stack_check(selected["signal"])

                    if all(stack_check.values()):
                        self.locked_option = selected
                        self._store_to_memory("locked", selected)
                        self.pending_suggestions = []
                        self.state = "executing"
                        return {"action": "locked", "option": option, "signal": selected["signal"]}
                    else:
                        return {"action": "blocked", "reason": "Overlay stack check failed", "checks": stack_check}

            except ValueError:
                return {"action": "error", "reason": "Invalid option number"}

        if "merge" in command_lower:
            # Extract option numbers
            numbers = [int(x) for x in command.split() if x.isdigit()]
            if len(numbers) >= 2:
                merged = [s for s in self.pending_suggestions if s.get("option") in numbers]
                merged_signal = " + ".join([s["signal"] for s in merged])
                result = {
                    "action": "merged",
                    "options": numbers,
                    "signal": merged_signal
                }
                self._store_to_memory("merged", result)
                return result

        return {"action": "unknown", "command": command}

    def _store_to_memory(self, action: str, data: Any = None):
        """Store suggestion/action to indexed memory."""
        self.memory.append({
            "action": action,
            "data": data,
            "suggestions": self.pending_suggestions.copy(),
            "timestamp": time.time()
        })

    def return_to_silence(self):
        """Return to silence state."""
        self.state = "silence"
        self.pending_suggestions = []
        self.locked_option = None

    def get_state(self) -> Dict:
        """Get current ARC state."""
        return {
            "state": self.state,
            "pending_count": len(self.pending_suggestions),
            "memory_size": len(self.memory)
        }


# ═══════════════════════════════════════════════════════════════════════════════
# AMOEBA HYDRA - SWARM INTELLIGENCE
# ═══════════════════════════════════════════════════════════════════════════════

class AmoebaHydra:
    """
    Self-optimizing, decentralized AI swarm.

    - Self-Healing: If one node is cut, two more emerge
    - Sensor Fusion: Every device is a pixel in global vision
    - Stigmergic Communication: Agents modify environment to coordinate
    """

    def __init__(self):
        self.lattice: Dict[str, Node] = {}
        self.mode = SwarmMode.GHOST
        self.pulse: Dict[str, Dict] = {}  # Living heat map
        self.sensor_count = 0
        self.regeneration_count = 0

        # Initialize core nodes
        self._init_core_lattice()

        # Engines
        self.overlay_engine = EphemeralOverlayEngine()
        self.arc = ARCLoop(self.lattice, self.overlay_engine)

    def _init_core_lattice(self):
        """Initialize the core immutable lattice (DNA)."""

        # Agent 0 / Ghost JB4 - The Host (immutable)
        self.agent_0 = Node(
            name="Agent 0 - Ghost JB4",
            node_type=NodeType.HUMAN,
            weight=10.0
        )
        self.agent_0.metadata = {
            "freeze": False,
            "mute": False,
            "overlay_approval": True,
            "is_host": True
        }
        self.lattice[self.agent_0.id] = self.agent_0

        # Perfect Node / Coordinator
        self.perfect_node = Node(
            name="Perfect Node",
            node_type=NodeType.COORDINATOR,
            weight=5.0
        )
        self.perfect_node.metadata = {
            "freeze_lattice": False,
            "self_optimize": True,
            "merge_collapse": True
        }
        self.lattice[self.perfect_node.id] = self.perfect_node

        # Perception Node
        self.perception = Node(
            name="Perception Node",
            node_type=NodeType.PERCEPTION,
            weight=3.0
        )
        self.perception.metadata = {"sensitivity": 1.0}
        self.lattice[self.perception.id] = self.perception

        # Action Node
        self.action = Node(
            name="Action Node",
            node_type=NodeType.ACTION,
            weight=2.0
        )
        self.action.metadata = {"priority": 1.0}
        self.lattice[self.action.id] = self.action

        # Feedback Node
        self.feedback = Node(
            name="Feedback Node",
            node_type=NodeType.FEEDBACK,
            weight=2.5
        )
        self.feedback.metadata = {
            "freeze_learning": False,
            "auto_merge": True,
            "self_refine": True
        }
        self.lattice[self.feedback.id] = self.feedback

        # Glyph Root
        self.glyph_root = AtomicGlyph(
            name="GlyphRoot",
            node_type=NodeType.GLYPH,
            weight=2.0
        )
        self.lattice[self.glyph_root.id] = self.glyph_root

        # Wire connections
        self.agent_0.connect(self.perception, 1.0)
        self.agent_0.connect(self.action, 1.0)
        self.perception.connect(self.action, 0.8)
        self.action.connect(self.perfect_node, 1.0)
        self.perfect_node.connect(self.feedback, 1.0)
        self.feedback.connect(self.perception, 0.5)
        self.feedback.connect(self.action, 0.5)
        self.glyph_root.connect(self.action, 0.7)
        self.glyph_root.connect(self.perception, 0.6)

        # Spawn initial fractals
        for _ in range(3):
            self.glyph_root.spawn_fractal(self.lattice)

    def set_mode(self, mode: SwarmMode):
        """Set swarm mode: GHOST (observe) or SWARM (engulf)."""
        self.mode = mode
        if mode == SwarmMode.SWARM:
            self._activate_swarm()
        elif mode == SwarmMode.GHOST:
            self._deactivate_swarm()

    def _activate_swarm(self):
        """Activate swarm mode - aggressive expansion."""
        for node in self.lattice.values():
            node.active = True
            if node.weight > 3.0:
                node.spawn_subnode(self.lattice)

    def _deactivate_swarm(self):
        """Deactivate to ghost mode - observation only."""
        for node in self.lattice.values():
            if node.node_type not in [NodeType.HUMAN, NodeType.COORDINATOR]:
                node.weight *= 0.9

    def add_sensor(self, sensor_id: str, sensor_type: str = "device") -> Node:
        """Add a new sensor to the swarm (every device is a pixel)."""
        sensor = Node(
            name=f"Sensor-{sensor_id}",
            node_type=NodeType.SENSOR,
            weight=1.0
        )
        sensor.metadata = {
            "sensor_id": sensor_id,
            "sensor_type": sensor_type,
            "last_signal": None
        }
        self.lattice[sensor.id] = sensor
        sensor.connect(self.perception, 0.5)
        self.sensor_count += 1

        # Update pulse
        self.pulse[sensor.id] = {
            "type": sensor_type,
            "active": True,
            "weight": sensor.weight
        }

        return sensor

    def sensor_signal(self, sensor_id: str, data: Any):
        """Receive signal from a sensor."""
        for node in self.lattice.values():
            if node.metadata.get("sensor_id") == sensor_id:
                node.receive_signal(str(data), 1.0)
                node.metadata["last_signal"] = data
                self.pulse[node.id]["last_data"] = data
                break

    def regenerate(self, dead_node_id: str):
        """Hydra regeneration - if one node dies, two emerge."""
        if dead_node_id in self.lattice:
            dead = self.lattice[dead_node_id]
            parent = None

            # Find parent
            for node in self.lattice.values():
                if dead in node.sub_nodes:
                    parent = node
                    break

            if parent:
                # Spawn two replacements
                child1 = parent.spawn_subnode(self.lattice, f"{dead.name}-regen-1")
                child2 = parent.spawn_subnode(self.lattice, f"{dead.name}-regen-2")
                self.regeneration_count += 2

                # Remove dead node
                del self.lattice[dead_node_id]
                parent.sub_nodes.remove(dead)

                return [child1, child2]

        return []

    def propagate_feedback(self):
        """Feedback & reverse optimization (96/104 principle)."""
        for node in self.lattice.values():
            if node.sub_nodes:
                for sub in node.sub_nodes:
                    sub.weight = max(0.1, sub.weight + 0.05 * node.weight)
                node.merge_subnodes()

            if isinstance(node, AtomicGlyph):
                node.collapse_fractals()

    def reverse_optimize(self):
        """Entropy-resistant replication & upgrade."""
        for node in list(self.lattice.values()):
            if node.weight < 0.5:
                node.active = False
            elif node.weight > 5.0 and self.mode == SwarmMode.SWARM:
                node.spawn_subnode(self.lattice)

            if isinstance(node, AtomicGlyph) and self.mode == SwarmMode.SWARM:
                node.spawn_fractal(self.lattice)

    def cycle(self):
        """Run one swarm cycle."""
        # Collect overlays
        overlays = self.overlay_engine.collect_suggestions(self.lattice)

        # Feedback
        self.propagate_feedback()

        # Optimization
        if self.mode == SwarmMode.SWARM:
            self.reverse_optimize()

        # Update pulse
        for node in self.lattice.values():
            self.pulse[node.id] = {
                "name": node.name,
                "type": node.node_type.value,
                "weight": node.weight,
                "active": node.active,
                "subs": len(node.sub_nodes)
            }

        return overlays

    def get_pulse(self) -> Dict:
        """Get the living heat map of the swarm."""
        return {
            "mode": self.mode.value,
            "total_nodes": len(self.lattice),
            "sensors": self.sensor_count,
            "regenerations": self.regeneration_count,
            "nodes": self.pulse
        }

    def zoom_out(self) -> List[str]:
        """Get big picture view of lattice."""
        return [repr(node) for node in self.lattice.values()]

    def zoom_in(self, node_id: str) -> Dict:
        """Zoom into a specific node."""
        if node_id in self.lattice:
            node = self.lattice[node_id]
            return {
                "node": repr(node),
                "connections": list(node.connections.keys()),
                "subnodes": [repr(s) for s in node.sub_nodes],
                "suggestions": node.suggestions,
                "metadata": node.metadata
            }
        return {}


# ═══════════════════════════════════════════════════════════════════════════════
# BOOT RITUAL
# ═══════════════════════════════════════════════════════════════════════════════

BOOT_SIGIL = """
\033[35m
                              ⚗️

                    ✧  ˚  ·  ⋆  ˚  ✦  ˚  ·  ✧
               ˚        ·    ⋆    ·        ˚
          ✦      ·                    ·      ✦
        ˚    ⋆                            ⋆    ˚
      ·                   ∞Φ∞                   ·
        ˚    ⋆                            ⋆    ˚
          ✦      ·                    ·      ✦
               ˚        ·    ⋆    ·        ˚
                    ✧  ˚  ·  ⋆  ˚  ✦  ˚  ·  ✧

                              ⚗️

\033[0m
"""

async def boot_ritual() -> AmoebaHydra:
    """
    BOOT RITUAL (MANDATORY)

    Cold start. Black field.
    Center sigil only.
    Lights form the Swarm.
    Single voice prompt: "To what do I owe this pleasure?"
    """
    print("\033[2J\033[H")  # Clear screen
    print(BOOT_SIGIL)

    # Simulate swarm formation
    print("    Gathering swarm...")
    await asyncio.sleep(0.5)

    for i in range(3):
        dots = "." * (i + 1)
        print(f"\r    Nodes converging{dots}   ", end="", flush=True)
        await asyncio.sleep(0.3)

    print("\n")
    print("    \033[36m✦ Swarm absorbed into sigil ✦\033[0m")
    print()

    # Initialize the Hydra
    hydra = AmoebaHydra()

    print(f"    Lattice: {len(hydra.lattice)} nodes")
    print(f"    Mode: {hydra.mode.value}")
    print()

    # The prompt
    print("    \033[33m\"To what do I owe this pleasure?\"\033[0m")
    print()

    return hydra


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    """Main entry point."""
    # Boot
    hydra = await boot_ritual()

    # Demo cycle
    print("    === Demo Cycle ===")

    # Receive intent
    intent = "Build and deploy the system"
    print(f"\n    [Intent] {intent}")

    suggestions = hydra.arc.receive_intent(intent)
    print(f"\n    [Suggestions]")
    for s in suggestions[:5]:
        print(f"      {s.get('option', '?')}. {s.get('signal', 'N/A')} (w={s.get('weight', 0):.2f})")

    # Commit
    result = hydra.arc.commit("Lock option 1")
    print(f"\n    [Commit] {result}")

    # Cycle
    hydra.set_mode(SwarmMode.SWARM)
    overlays = hydra.cycle()
    print(f"\n    [Cycle] Mode: {hydra.mode.value}, Nodes: {len(hydra.lattice)}")

    # Return to silence
    hydra.arc.return_to_silence()
    print(f"\n    [State] {hydra.arc.get_state()}")

    print("\n    ∞Φ∞ AMOEBA HYDRA ONLINE ∞Φ∞\n")


if __name__ == "__main__":
    asyncio.run(main())

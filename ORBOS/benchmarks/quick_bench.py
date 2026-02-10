#!/usr/bin/env python3
"""
∞Φ∞ ORBOS QUICK BENCHMARK ∞Φ∞
Fast performance snapshot - runs in <10 seconds
"""

import sys
import time
import statistics
from pathlib import Path

# Add paths
ORBOS_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "hive"))
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "orchestration"))
sys.path.insert(0, str(ORBOS_ROOT / "glyph-lang" / "compiler"))

print("""
\033[35m╔═══════════════════════════════════════════════════════════════╗
║           ∞Φ∞ ORBOS QUICK BENCHMARK ∞Φ∞                      ║
╚═══════════════════════════════════════════════════════════════╝\033[0m
""")

results = []

def bench(name, iterations, func):
    """Simple benchmark wrapper."""
    times = []
    for _ in range(iterations):
        start = time.perf_counter()
        func()
        times.append((time.perf_counter() - start) * 1000)

    avg = statistics.mean(times)
    ops = 1000 / avg if avg > 0 else 0
    results.append((name, avg, ops, iterations))
    print(f"  \033[32m✓\033[0m {name}: {avg:.3f}ms avg | {ops:,.0f} ops/sec")

# ═══════════════════════════════════════════════════════════════
# AMOEBA HYDRA
# ═══════════════════════════════════════════════════════════════
print("\033[36m  ━━━ AMOEBA HYDRA ━━━\033[0m")

try:
    from amoeba_hydra import AmoebaHydra, Node, NodeType, SwarmMode

    hydra = AmoebaHydra()

    # Node creation
    bench("Node Creation", 500, lambda: Node(name="test", node_type=NodeType.SWARM))

    # Signal propagation
    bench("Signal Propagation", 200, lambda: hydra.agent_0.send_signal("test", hydra.lattice))

    # ARC intent
    bench("ARC Intent", 100, lambda: (hydra.arc.receive_intent("build"), hydra.arc.return_to_silence()))

    # ARC commit
    hydra.arc.receive_intent("test")
    bench("ARC Commit", 100, lambda: hydra.arc.commit("lock option 1"))

    # Overlay stack check
    bench("Overlay Check", 500, lambda: hydra.arc.overlay_stack.full_stack_check("payment"))

    # Swarm cycle (reduced)
    bench("Swarm Cycle", 50, lambda: hydra.cycle())

    print(f"    Lattice nodes: {len(hydra.lattice)}")

except Exception as e:
    print(f"  \033[31m✗ Hydra failed: {e}\033[0m")

# ═══════════════════════════════════════════════════════════════
# FRACTAL NODES
# ═══════════════════════════════════════════════════════════════
print("\n\033[36m  ━━━ FRACTAL NODES ━━━\033[0m")

try:
    from fractal_nodes import FractalOrchestrator

    orch = FractalOrchestrator()

    bench("Node Spawn", 100, lambda: orch.spawn_node(f"n_{time.time()}"))
    bench("Task Distribute", 100, lambda: orch.distribute_task({"type": "compute", "data": [1,2,3]}))
    bench("Energy Wave", 100, lambda: orch.propagate_energy())

    print(f"    Total nodes: {len(orch.nodes)}")

except Exception as e:
    print(f"  \033[33m⚠ Fractal: {e}\033[0m")

# ═══════════════════════════════════════════════════════════════
# GLYPH DSL
# ═══════════════════════════════════════════════════════════════
print("\n\033[36m  ━━━ GLYPH DSL ━━━\033[0m")

try:
    from glyph_compiler import GlyphCompiler

    compiler = GlyphCompiler()

    bench("Glyph Parse", 500, lambda: compiler.compile("BUILD"))
    bench("Voice Match", 300, lambda: compiler.voice_to_glyph("build the system"))
    bench("Macro Expand", 300, lambda: compiler.expand_macro("FULLBUILD"))

except Exception as e:
    print(f"  \033[33m⚠ Glyph: {e}\033[0m")

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
print("\n\033[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m")
print("\033[35m                    BENCHMARK SUMMARY                      \033[0m")
print("\033[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n")

if results:
    total_ops = sum(r[2] for r in results)
    avg_latency = statistics.mean(r[1] for r in results)

    print(f"  Tests Run:       {len(results)}")
    print(f"  Total Ops/Sec:   {total_ops:,.0f}")
    print(f"  Avg Latency:     {avg_latency:.3f}ms")

    # Performance tiers
    print("\n  \033[33mPerformance Tiers:\033[0m")
    for name, latency, ops, _ in sorted(results, key=lambda x: -x[2]):
        tier = "🔥" if ops > 50000 else "⚡" if ops > 10000 else "✓" if ops > 1000 else "⚠"
        print(f"    {tier} {name}: {ops:,.0f} ops/sec")

    # Grade
    if total_ops > 200000:
        grade = "A+"
    elif total_ops > 100000:
        grade = "A"
    elif total_ops > 50000:
        grade = "B"
    elif total_ops > 20000:
        grade = "C"
    else:
        grade = "D"

    print(f"\n  \033[32m∞Φ∞ SYSTEM GRADE: {grade} ∞Φ∞\033[0m")

print("\n\033[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n")

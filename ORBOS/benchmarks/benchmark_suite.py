#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
                    ∞Φ∞ ORBOS BENCHMARK SUITE ∞Φ∞
═══════════════════════════════════════════════════════════════════════════════

Comprehensive benchmarking for all ORBOS subsystems.
Measures performance, throughput, latency, and scalability.

═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
import time
import asyncio
import statistics
import json
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Any, Callable
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import traceback

# Add ORBOS paths
ORBOS_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ORBOS_ROOT))
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "hive"))
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "orchestration"))
sys.path.insert(0, str(ORBOS_ROOT / "orb-core" / "revenue-engine"))
sys.path.insert(0, str(ORBOS_ROOT / "glyph-lang" / "compiler"))

# ═══════════════════════════════════════════════════════════════════════════════
# BENCHMARK RESULTS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class BenchmarkResult:
    """Single benchmark result."""
    name: str
    category: str
    iterations: int
    total_time_ms: float
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    std_dev_ms: float
    ops_per_sec: float
    memory_mb: float = 0.0
    success_rate: float = 100.0
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class BenchmarkSuite:
    """Full benchmark suite results."""
    timestamp: str
    system: str = "ORBOS"
    version: str = "1.0.0-live"
    results: List[BenchmarkResult] = field(default_factory=list)
    summary: Dict[str, Any] = field(default_factory=dict)

# ═══════════════════════════════════════════════════════════════════════════════
# BENCHMARK UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════

def get_memory_mb() -> float:
    """Get current memory usage in MB."""
    try:
        import resource
        return resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024
    except:
        return 0.0

def benchmark(name: str, category: str, iterations: int = 1000):
    """Decorator for benchmarking functions."""
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            times = []
            successes = 0

            # Warmup
            for _ in range(min(10, iterations // 10)):
                try:
                    func(*args, **kwargs)
                except:
                    pass

            # Actual benchmark
            mem_before = get_memory_mb()
            for _ in range(iterations):
                start = time.perf_counter()
                try:
                    func(*args, **kwargs)
                    successes += 1
                except:
                    pass
                end = time.perf_counter()
                times.append((end - start) * 1000)  # Convert to ms

            mem_after = get_memory_mb()

            if times:
                return BenchmarkResult(
                    name=name,
                    category=category,
                    iterations=iterations,
                    total_time_ms=sum(times),
                    avg_time_ms=statistics.mean(times),
                    min_time_ms=min(times),
                    max_time_ms=max(times),
                    std_dev_ms=statistics.stdev(times) if len(times) > 1 else 0,
                    ops_per_sec=1000 / statistics.mean(times) if statistics.mean(times) > 0 else 0,
                    memory_mb=mem_after - mem_before,
                    success_rate=(successes / iterations) * 100
                )
            return None
        return wrapper
    return decorator

async def async_benchmark(name: str, category: str, iterations: int, func, *args, **kwargs) -> BenchmarkResult:
    """Benchmark async functions."""
    times = []
    successes = 0

    # Warmup
    for _ in range(min(10, iterations // 10)):
        try:
            await func(*args, **kwargs)
        except:
            pass

    # Actual benchmark
    mem_before = get_memory_mb()
    for _ in range(iterations):
        start = time.perf_counter()
        try:
            await func(*args, **kwargs)
            successes += 1
        except:
            pass
        end = time.perf_counter()
        times.append((end - start) * 1000)

    mem_after = get_memory_mb()

    return BenchmarkResult(
        name=name,
        category=category,
        iterations=iterations,
        total_time_ms=sum(times),
        avg_time_ms=statistics.mean(times),
        min_time_ms=min(times),
        max_time_ms=max(times),
        std_dev_ms=statistics.stdev(times) if len(times) > 1 else 0,
        ops_per_sec=1000 / statistics.mean(times) if statistics.mean(times) > 0 else 0,
        memory_mb=mem_after - mem_before,
        success_rate=(successes / iterations) * 100
    )

# ═══════════════════════════════════════════════════════════════════════════════
# AMOEBA HYDRA BENCHMARKS
# ═══════════════════════════════════════════════════════════════════════════════

class AmoebaHydraBenchmarks:
    """Benchmarks for Amoeba Hydra swarm intelligence."""

    def __init__(self):
        self.hydra = None
        self.results = []

    def setup(self):
        """Initialize Hydra for benchmarks."""
        try:
            from amoeba_hydra import AmoebaHydra, SwarmMode
            self.hydra = AmoebaHydra()
            self.SwarmMode = SwarmMode
            return True
        except Exception as e:
            print(f"    ⚠ Hydra setup failed: {e}")
            return False

    def run_all(self) -> List[BenchmarkResult]:
        """Run all Hydra benchmarks."""
        if not self.setup():
            return []

        results = []

        # 1. Node Creation
        results.append(self._bench_node_creation())

        # 2. Signal Propagation
        results.append(self._bench_signal_propagation())

        # 3. Hydra Regeneration
        results.append(self._bench_regeneration())

        # 4. Swarm Cycle
        results.append(self._bench_swarm_cycle())

        # 5. Mode Switching
        results.append(self._bench_mode_switch())

        # 6. Sensor Fusion
        results.append(self._bench_sensor_fusion())

        # 7. Overlay Collection
        results.append(self._bench_overlay_collection())

        return [r for r in results if r is not None]

    def _bench_node_creation(self) -> BenchmarkResult:
        """Benchmark node creation speed."""
        from amoeba_hydra import Node, NodeType
        times = []

        for _ in range(1000):
            start = time.perf_counter()
            node = Node(name="test", node_type=NodeType.SWARM, weight=1.0)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Node Creation",
            category="Amoeba Hydra",
            iterations=1000,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times),
            metadata={"node_type": "SWARM"}
        )

    def _bench_signal_propagation(self) -> BenchmarkResult:
        """Benchmark signal propagation through lattice."""
        times = []

        for _ in range(500):
            start = time.perf_counter()
            self.hydra.agent_0.send_signal("test_signal", self.hydra.lattice)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Signal Propagation",
            category="Amoeba Hydra",
            iterations=500,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times),
            metadata={"lattice_size": len(self.hydra.lattice)}
        )

    def _bench_regeneration(self) -> BenchmarkResult:
        """Benchmark Hydra regeneration (one dies, two emerge)."""
        times = []

        # Get a node to regenerate
        for _ in range(100):
            # Create a test node
            sensor = self.hydra.add_sensor(f"test_{time.time()}")

            start = time.perf_counter()
            self.hydra.regenerate(sensor.id)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Hydra Regeneration",
            category="Amoeba Hydra",
            iterations=100,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times),
            metadata={"regeneration_count": self.hydra.regeneration_count}
        )

    def _bench_swarm_cycle(self) -> BenchmarkResult:
        """Benchmark full swarm cycle."""
        times = []

        for _ in range(200):
            start = time.perf_counter()
            self.hydra.cycle()
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Swarm Cycle",
            category="Amoeba Hydra",
            iterations=200,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times),
            metadata={"final_node_count": len(self.hydra.lattice)}
        )

    def _bench_mode_switch(self) -> BenchmarkResult:
        """Benchmark mode switching (ghost ↔ swarm)."""
        times = []

        for i in range(200):
            mode = self.SwarmMode.SWARM if i % 2 == 0 else self.SwarmMode.GHOST
            start = time.perf_counter()
            self.hydra.set_mode(mode)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Mode Switch",
            category="Amoeba Hydra",
            iterations=200,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )

    def _bench_sensor_fusion(self) -> BenchmarkResult:
        """Benchmark sensor addition and signal processing."""
        times = []

        for i in range(500):
            start = time.perf_counter()
            sensor = self.hydra.add_sensor(f"bench_sensor_{i}")
            self.hydra.sensor_signal(f"bench_sensor_{i}", {"temp": 25, "humid": 60})
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Sensor Fusion",
            category="Amoeba Hydra",
            iterations=500,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times),
            metadata={"total_sensors": self.hydra.sensor_count}
        )

    def _bench_overlay_collection(self) -> BenchmarkResult:
        """Benchmark overlay collection from lattice."""
        times = []

        # Generate some signals first
        for node in list(self.hydra.lattice.values())[:10]:
            node.receive_signal("test", 1.0)

        for _ in range(500):
            start = time.perf_counter()
            self.hydra.overlay_engine.collect_suggestions(self.hydra.lattice)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Overlay Collection",
            category="Amoeba Hydra",
            iterations=500,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )


# ═══════════════════════════════════════════════════════════════════════════════
# ARC LOOP BENCHMARKS
# ═══════════════════════════════════════════════════════════════════════════════

class ARCLoopBenchmarks:
    """Benchmarks for ARC Execution Loop."""

    def __init__(self):
        self.hydra = None

    def setup(self):
        """Initialize ARC loop for benchmarks."""
        try:
            from amoeba_hydra import AmoebaHydra
            self.hydra = AmoebaHydra()
            return True
        except Exception as e:
            print(f"    ⚠ ARC setup failed: {e}")
            return False

    def run_all(self) -> List[BenchmarkResult]:
        """Run all ARC benchmarks."""
        if not self.setup():
            return []

        results = []

        # 1. Intent Processing
        results.append(self._bench_intent_processing())

        # 2. Commit Latency
        results.append(self._bench_commit_latency())

        # 3. Full ARC Cycle
        results.append(self._bench_full_cycle())

        # 4. Overlay Stack Check
        results.append(self._bench_overlay_stack())

        return [r for r in results if r is not None]

    def _bench_intent_processing(self) -> BenchmarkResult:
        """Benchmark intent processing speed."""
        intents = [
            "build the system",
            "deploy to production",
            "run aggressive expansion",
            "analyze market data",
            "optimize revenue"
        ]
        times = []

        for i in range(500):
            intent = intents[i % len(intents)]
            start = time.perf_counter()
            self.hydra.arc.receive_intent(intent)
            end = time.perf_counter()
            times.append((end - start) * 1000)
            self.hydra.arc.return_to_silence()

        return BenchmarkResult(
            name="Intent Processing",
            category="ARC Loop",
            iterations=500,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )

    def _bench_commit_latency(self) -> BenchmarkResult:
        """Benchmark commit latency."""
        times = []

        for _ in range(500):
            self.hydra.arc.receive_intent("test intent")

            start = time.perf_counter()
            self.hydra.arc.commit("lock option 1")
            end = time.perf_counter()
            times.append((end - start) * 1000)

            self.hydra.arc.return_to_silence()

        return BenchmarkResult(
            name="Commit Latency",
            category="ARC Loop",
            iterations=500,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )

    def _bench_full_cycle(self) -> BenchmarkResult:
        """Benchmark full ARC cycle (intent → commit → silence)."""
        times = []

        for _ in range(300):
            start = time.perf_counter()
            self.hydra.arc.receive_intent("build and deploy")
            self.hydra.arc.commit("lock option 1")
            self.hydra.arc.return_to_silence()
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Full ARC Cycle",
            category="ARC Loop",
            iterations=300,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times),
            metadata={"memory_entries": len(self.hydra.arc.memory)}
        )

    def _bench_overlay_stack(self) -> BenchmarkResult:
        """Benchmark overlay stack permission checks."""
        times = []
        actions = ["payment", "system_access", "data_read", "agent_spawn", "deploy"]

        for i in range(1000):
            action = actions[i % len(actions)]
            start = time.perf_counter()
            self.hydra.arc.overlay_stack.full_stack_check(action)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Overlay Stack Check",
            category="ARC Loop",
            iterations=1000,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )


# ═══════════════════════════════════════════════════════════════════════════════
# FRACTAL NODES BENCHMARKS
# ═══════════════════════════════════════════════════════════════════════════════

class FractalNodesBenchmarks:
    """Benchmarks for 47 Fractal Nodes orchestration."""

    def __init__(self):
        self.orchestrator = None

    def setup(self):
        """Initialize orchestrator for benchmarks."""
        try:
            from fractal_nodes import FractalOrchestrator
            self.orchestrator = FractalOrchestrator()
            return True
        except Exception as e:
            print(f"    ⚠ Fractal setup failed: {e}")
            return False

    def run_all(self) -> List[BenchmarkResult]:
        """Run all fractal benchmarks."""
        if not self.setup():
            return []

        results = []

        # 1. Node Spawning
        results.append(self._bench_node_spawn())

        # 2. Task Distribution
        results.append(self._bench_task_distribution())

        # 3. Energy Wave
        results.append(self._bench_energy_wave())

        return [r for r in results if r is not None]

    def _bench_node_spawn(self) -> BenchmarkResult:
        """Benchmark fractal node spawning."""
        times = []

        for i in range(200):
            start = time.perf_counter()
            self.orchestrator.spawn_node(f"bench_node_{i}")
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Node Spawning",
            category="Fractal Nodes",
            iterations=200,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times),
            metadata={"total_nodes": len(self.orchestrator.nodes)}
        )

    def _bench_task_distribution(self) -> BenchmarkResult:
        """Benchmark task distribution across nodes."""
        times = []

        for i in range(300):
            task = {"type": "compute", "data": list(range(100)), "id": i}
            start = time.perf_counter()
            self.orchestrator.distribute_task(task)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Task Distribution",
            category="Fractal Nodes",
            iterations=300,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )

    def _bench_energy_wave(self) -> BenchmarkResult:
        """Benchmark energy wave propagation."""
        times = []

        for _ in range(200):
            start = time.perf_counter()
            self.orchestrator.propagate_energy()
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Energy Wave",
            category="Fractal Nodes",
            iterations=200,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )


# ═══════════════════════════════════════════════════════════════════════════════
# GLYPH COMPILER BENCHMARKS
# ═══════════════════════════════════════════════════════════════════════════════

class GlyphCompilerBenchmarks:
    """Benchmarks for Glyph DSL compiler."""

    def __init__(self):
        self.compiler = None

    def setup(self):
        """Initialize compiler for benchmarks."""
        try:
            from glyph_compiler import GlyphCompiler
            self.compiler = GlyphCompiler()
            return True
        except Exception as e:
            print(f"    ⚠ Glyph setup failed: {e}")
            return False

    def run_all(self) -> List[BenchmarkResult]:
        """Run all glyph benchmarks."""
        if not self.setup():
            return []

        results = []

        # 1. Glyph Parsing
        results.append(self._bench_glyph_parsing())

        # 2. Voice Pattern Matching
        results.append(self._bench_voice_patterns())

        # 3. Macro Expansion
        results.append(self._bench_macro_expansion())

        return [r for r in results if r is not None]

    def _bench_glyph_parsing(self) -> BenchmarkResult:
        """Benchmark glyph parsing speed."""
        glyphs = ["∞BUILD", "⚡DEPLOY", "🔥ATTACK", "👁️SCAN", "🌀CYCLE"]
        times = []

        for i in range(1000):
            glyph = glyphs[i % len(glyphs)]
            start = time.perf_counter()
            self.compiler.parse(glyph)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Glyph Parsing",
            category="Glyph DSL",
            iterations=1000,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )

    def _bench_voice_patterns(self) -> BenchmarkResult:
        """Benchmark voice pattern matching."""
        patterns = [
            "build the system",
            "deploy to production",
            "run full scan",
            "execute attack mode",
            "show status"
        ]
        times = []

        for i in range(500):
            pattern = patterns[i % len(patterns)]
            start = time.perf_counter()
            self.compiler.voice_to_glyph(pattern)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Voice Pattern Match",
            category="Glyph DSL",
            iterations=500,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )

    def _bench_macro_expansion(self) -> BenchmarkResult:
        """Benchmark macro expansion."""
        times = []

        for _ in range(500):
            start = time.perf_counter()
            self.compiler.expand_macro("FULLBUILD")
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Macro Expansion",
            category="Glyph DSL",
            iterations=500,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )


# ═══════════════════════════════════════════════════════════════════════════════
# REVENUE ENGINE BENCHMARKS
# ═══════════════════════════════════════════════════════════════════════════════

class RevenueEngineBenchmarks:
    """Benchmarks for Revenue Engine."""

    def __init__(self):
        self.engine = None

    def setup(self):
        """Initialize engine for benchmarks."""
        try:
            from crypto_rail import RevenueEngine
            self.engine = RevenueEngine()
            return True
        except Exception as e:
            print(f"    ⚠ Revenue setup failed: {e}")
            return False

    def run_all(self) -> List[BenchmarkResult]:
        """Run all revenue benchmarks."""
        if not self.setup():
            return []

        results = []

        # 1. Attribution Recording
        results.append(self._bench_attribution())

        # 2. Split Calculation
        results.append(self._bench_split_calc())

        # 3. Payout Processing
        results.append(self._bench_payout())

        return [r for r in results if r is not None]

    def _bench_attribution(self) -> BenchmarkResult:
        """Benchmark attribution recording."""
        times = []

        for i in range(1000):
            start = time.perf_counter()
            self.engine.record_attribution(
                agent_id=f"agent_{i % 10}",
                action="task_completion",
                value=100.0
            )
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Attribution Recording",
            category="Revenue Engine",
            iterations=1000,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )

    def _bench_split_calc(self) -> BenchmarkResult:
        """Benchmark revenue split calculation."""
        times = []

        for _ in range(1000):
            start = time.perf_counter()
            self.engine.calculate_splits(1000.0)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Split Calculation",
            category="Revenue Engine",
            iterations=1000,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )

    def _bench_payout(self) -> BenchmarkResult:
        """Benchmark payout processing."""
        times = []

        for i in range(500):
            start = time.perf_counter()
            self.engine.process_payout(f"agent_{i % 10}", 50.0)
            end = time.perf_counter()
            times.append((end - start) * 1000)

        return BenchmarkResult(
            name="Payout Processing",
            category="Revenue Engine",
            iterations=500,
            total_time_ms=sum(times),
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times),
            ops_per_sec=1000 / statistics.mean(times)
        )


# ═══════════════════════════════════════════════════════════════════════════════
# COMPARATIVE ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

def generate_comparison(results: List[BenchmarkResult]) -> Dict[str, Any]:
    """Generate comparative analysis."""

    # Group by category
    by_category = {}
    for r in results:
        if r.category not in by_category:
            by_category[r.category] = []
        by_category[r.category].append(r)

    # Calculate category scores
    category_scores = {}
    for cat, cat_results in by_category.items():
        avg_ops = statistics.mean([r.ops_per_sec for r in cat_results])
        avg_latency = statistics.mean([r.avg_time_ms for r in cat_results])
        success_rate = statistics.mean([r.success_rate for r in cat_results])

        # Score = ops/sec normalized + (1/latency) normalized + success_rate
        category_scores[cat] = {
            "avg_ops_per_sec": avg_ops,
            "avg_latency_ms": avg_latency,
            "success_rate": success_rate,
            "tests_run": len(cat_results)
        }

    # Overall system score
    total_ops = sum([r.ops_per_sec for r in results])
    avg_latency = statistics.mean([r.avg_time_ms for r in results])

    return {
        "category_breakdown": category_scores,
        "total_ops_per_sec": total_ops,
        "avg_latency_ms": avg_latency,
        "total_tests": len(results),
        "overall_success_rate": statistics.mean([r.success_rate for r in results])
    }


def print_grade(score: float) -> str:
    """Convert score to letter grade."""
    if score >= 95: return "A+"
    if score >= 90: return "A"
    if score >= 85: return "B+"
    if score >= 80: return "B"
    if score >= 75: return "C+"
    if score >= 70: return "C"
    if score >= 60: return "D"
    return "F"


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN BENCHMARK RUNNER
# ═══════════════════════════════════════════════════════════════════════════════

BANNER = """
\033[35m
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                    ∞Φ∞ ORBOS BENCHMARK SUITE ∞Φ∞                             ║
║                                                                               ║
║              Comprehensive Performance Analysis & Comparison                  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
\033[0m
"""

def run_all_benchmarks() -> BenchmarkSuite:
    """Run complete benchmark suite."""
    print(BANNER)

    suite = BenchmarkSuite(
        timestamp=datetime.now().isoformat(),
        results=[]
    )

    # ─────────────────────────────────────────────────────────────────────────
    # AMOEBA HYDRA
    # ─────────────────────────────────────────────────────────────────────────
    print("  \033[36m━━━ AMOEBA HYDRA SWARM ━━━\033[0m\n")
    hydra_bench = AmoebaHydraBenchmarks()
    hydra_results = hydra_bench.run_all()
    suite.results.extend(hydra_results)

    for r in hydra_results:
        status = "\033[32m✓\033[0m" if r.success_rate == 100 else "\033[33m⚠\033[0m"
        print(f"    {status} {r.name}: {r.avg_time_ms:.3f}ms avg ({r.ops_per_sec:.0f} ops/sec)")
    print()

    # ─────────────────────────────────────────────────────────────────────────
    # ARC LOOP
    # ─────────────────────────────────────────────────────────────────────────
    print("  \033[36m━━━ ARC EXECUTION LOOP ━━━\033[0m\n")
    arc_bench = ARCLoopBenchmarks()
    arc_results = arc_bench.run_all()
    suite.results.extend(arc_results)

    for r in arc_results:
        status = "\033[32m✓\033[0m" if r.success_rate == 100 else "\033[33m⚠\033[0m"
        print(f"    {status} {r.name}: {r.avg_time_ms:.3f}ms avg ({r.ops_per_sec:.0f} ops/sec)")
    print()

    # ─────────────────────────────────────────────────────────────────────────
    # FRACTAL NODES
    # ─────────────────────────────────────────────────────────────────────────
    print("  \033[36m━━━ FRACTAL NODES (47) ━━━\033[0m\n")
    fractal_bench = FractalNodesBenchmarks()
    fractal_results = fractal_bench.run_all()
    suite.results.extend(fractal_results)

    for r in fractal_results:
        status = "\033[32m✓\033[0m" if r.success_rate == 100 else "\033[33m⚠\033[0m"
        print(f"    {status} {r.name}: {r.avg_time_ms:.3f}ms avg ({r.ops_per_sec:.0f} ops/sec)")
    print()

    # ─────────────────────────────────────────────────────────────────────────
    # GLYPH DSL
    # ─────────────────────────────────────────────────────────────────────────
    print("  \033[36m━━━ GLYPH DSL COMPILER ━━━\033[0m\n")
    glyph_bench = GlyphCompilerBenchmarks()
    glyph_results = glyph_bench.run_all()
    suite.results.extend(glyph_results)

    for r in glyph_results:
        status = "\033[32m✓\033[0m" if r.success_rate == 100 else "\033[33m⚠\033[0m"
        print(f"    {status} {r.name}: {r.avg_time_ms:.3f}ms avg ({r.ops_per_sec:.0f} ops/sec)")
    print()

    # ─────────────────────────────────────────────────────────────────────────
    # REVENUE ENGINE
    # ─────────────────────────────────────────────────────────────────────────
    print("  \033[36m━━━ REVENUE ENGINE ━━━\033[0m\n")
    revenue_bench = RevenueEngineBenchmarks()
    revenue_results = revenue_bench.run_all()
    suite.results.extend(revenue_results)

    for r in revenue_results:
        status = "\033[32m✓\033[0m" if r.success_rate == 100 else "\033[33m⚠\033[0m"
        print(f"    {status} {r.name}: {r.avg_time_ms:.3f}ms avg ({r.ops_per_sec:.0f} ops/sec)")
    print()

    # ─────────────────────────────────────────────────────────────────────────
    # SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    suite.summary = generate_comparison(suite.results)

    print("  \033[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m")
    print("  \033[35m                     BENCHMARK SUMMARY                      \033[0m")
    print("  \033[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n")

    print(f"    Total Tests:        {suite.summary['total_tests']}")
    print(f"    Total Ops/Sec:      {suite.summary['total_ops_per_sec']:,.0f}")
    print(f"    Avg Latency:        {suite.summary['avg_latency_ms']:.3f}ms")
    print(f"    Success Rate:       {suite.summary['overall_success_rate']:.1f}%")
    print()

    print("    \033[33mCategory Breakdown:\033[0m")
    for cat, scores in suite.summary['category_breakdown'].items():
        grade = print_grade(scores['success_rate'])
        print(f"      • {cat}: {scores['avg_ops_per_sec']:,.0f} ops/sec, {scores['avg_latency_ms']:.3f}ms avg [{grade}]")

    print()
    print("  \033[35m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m\n")

    # Overall grade
    overall_grade = print_grade(suite.summary['overall_success_rate'])
    print(f"    \033[32m∞Φ∞ OVERALL SYSTEM GRADE: {overall_grade} ∞Φ∞\033[0m\n")

    return suite


def save_results(suite: BenchmarkSuite, path: str = None):
    """Save benchmark results to JSON."""
    if path is None:
        path = ORBOS_ROOT / "benchmarks" / f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    # Convert to dict
    data = {
        "timestamp": suite.timestamp,
        "system": suite.system,
        "version": suite.version,
        "results": [asdict(r) for r in suite.results],
        "summary": suite.summary
    }

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"    Results saved to: {path}\n")
    return path


if __name__ == "__main__":
    suite = run_all_benchmarks()
    save_results(suite)

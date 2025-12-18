#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
CONTINUOUS TRAINING - Train as you build, build as you train
═══════════════════════════════════════════════════════════════════════════════

Unified training harness that runs:
1. Auto-training (pattern learning from queries)
2. Evolution (keyword and weight refinement)
3. ARC solver training (hypothesis improvement)

All systems improve continuously while you work.
"""

import asyncio
import time
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).parent))

from auto_trainer import AutoTrainer
from evolution_engine import EvolutionEngine, EvolutionConfig
from arc_agi2_solver import ARCSolver, ARCPuzzleGenerator


def print_banner():
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ██████╗ ██████╗ ███╗   ██╗████████╗██╗███╗   ██╗██╗   ██╗ ██████╗ ██╗   ██╗║
║  ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██║████╗  ██║██║   ██║██╔═══██╗██║   ██║║
║  ██║     ██║   ██║██╔██╗ ██║   ██║   ██║██╔██╗ ██║██║   ██║██║   ██║██║   ██║║
║  ██║     ██║   ██║██║╚██╗██║   ██║   ██║██║╚██╗██║██║   ██║██║   ██║██║   ██║║
║  ╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║██║ ╚████║╚██████╔╝╚██████╔╝╚██████╔╝║
║   ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝  ╚═════╝ ║
║                                                                              ║
║                   ████████╗██████╗  █████╗ ██╗███╗   ██╗                     ║
║                   ╚══██╔══╝██╔══██╗██╔══██╗██║████╗  ██║                     ║
║                      ██║   ██████╔╝███████║██║██╔██╗ ██║                     ║
║                      ██║   ██╔══██╗██╔══██║██║██║╚██╗██║                     ║
║                      ██║   ██║  ██║██║  ██║██║██║ ╚████║                     ║
║                      ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝                     ║
║                                                                              ║
║              "Train as you build, build as you train"                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    """)


class ContinuousTrainingOrchestrator:
    """Orchestrates all training systems"""

    def __init__(self):
        self.auto_trainer = AutoTrainer()
        self.evolution_engine = EvolutionEngine()
        self.arc_solver = ARCSolver(use_learning=True)
        self.start_time = None
        self.stats = {
            'training_epochs': 0,
            'evolution_cycles': 0,
            'arc_puzzles_solved': 0,
            'patterns_learned': 0,
            'total_queries': 0
        }

    def run_training_cycle(self, epochs: int = 3, evolution: bool = True) -> Dict:
        """Run one complete training cycle"""
        self.start_time = time.time()
        results = {}

        # Phase 1: Auto-training
        print("\n" + "="*70)
        print("  PHASE 1: AUTO-TRAINING")
        print("="*70)

        for i in range(epochs):
            epoch_result = self.auto_trainer.train_epoch(queries_per_epoch=20)
            self.stats['training_epochs'] += 1
            self.stats['total_queries'] += epoch_result['total']

        results['training'] = {
            'epochs': epochs,
            'accuracy': self.auto_trainer.metrics.routing_accuracy,
            'confidence': self.auto_trainer.metrics.avg_confidence
        }

        # Phase 2: ARC Solver Training
        print("\n" + "="*70)
        print("  PHASE 2: ARC SOLVER TRAINING")
        print("="*70)

        puzzles = [
            ARCPuzzleGenerator.puzzle_rotate_90(),
            ARCPuzzleGenerator.puzzle_flip_horizontal(),
            ARCPuzzleGenerator.puzzle_scale_2x(),
            ARCPuzzleGenerator.puzzle_color_swap(),
        ]

        arc_correct = 0
        for puzzle in puzzles:
            result = self.arc_solver.solve(puzzle)
            if result.correct:
                arc_correct += 1
                self.stats['arc_puzzles_solved'] += 1
            print(f"  {puzzle.puzzle_id}: {'✓' if result.correct else '✗'}")

        results['arc'] = {
            'puzzles_tested': len(puzzles),
            'correct': arc_correct,
            'accuracy': arc_correct / len(puzzles)
        }

        if self.arc_solver.learner:
            learner_stats = self.arc_solver.learner.get_stats()
            self.stats['patterns_learned'] = learner_stats.get('total_patterns', 0)

        # Phase 3: Evolution (optional)
        if evolution:
            print("\n" + "="*70)
            print("  PHASE 3: EVOLUTION")
            print("="*70)

            evo_config = EvolutionConfig(
                population_size=6,
                generations=2,
                mutation_rate=0.15
            )
            evo_result = self.evolution_engine.run_evolution_cycle(evo_config)
            self.stats['evolution_cycles'] += 1

            results['evolution'] = {
                'improvement': evo_result.get('improvement', 0),
                'final_accuracy': evo_result.get('final_accuracy', 0)
            }

        elapsed = time.time() - self.start_time

        # Final summary
        self._print_summary(results, elapsed)

        return results

    def _print_summary(self, results: Dict, elapsed: float):
        """Print training summary"""
        print(f"""

╔══════════════════════════════════════════════════════════════════════════════╗
║                    CONTINUOUS TRAINING COMPLETE                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Training Results:                                                           ║
║    • Epochs Run:        {self.stats['training_epochs']:>4}                                                   ║
║    • Total Queries:     {self.stats['total_queries']:>4}                                                   ║
║    • Routing Accuracy:  {results['training']['accuracy']:>4.0%}                                                   ║
║    • Avg Confidence:    {results['training']['confidence']:>4.0%}                                                   ║
║                                                                              ║
║  ARC Solver Results:                                                         ║
║    • Puzzles Solved:    {results['arc']['correct']}/{results['arc']['puzzles_tested']}                                                    ║
║    • Patterns Learned:  {self.stats['patterns_learned']:>4}                                                   ║
║                                                                              ║""")

        if 'evolution' in results:
            print(f"""║  Evolution Results:                                                          ║
║    • Cycles Run:        {self.stats['evolution_cycles']:>4}                                                   ║
║    • Final Accuracy:    {results['evolution']['final_accuracy']:>4.0%}                                                   ║
║    • Improvement:       {results['evolution']['improvement']:>+4.0%}                                                   ║
║                                                                              ║""")

        print(f"""║  Time Elapsed:          {elapsed:>5.1f}s                                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """)


def run_continuous_training(epochs: int = 3, evolution: bool = True):
    """Main entry point"""
    print_banner()
    orchestrator = ContinuousTrainingOrchestrator()
    results = orchestrator.run_training_cycle(epochs=epochs, evolution=evolution)
    return orchestrator


if __name__ == "__main__":
    run_continuous_training(epochs=3, evolution=True)

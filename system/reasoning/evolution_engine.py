#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
EVOLUTION ENGINE - Continuous System Refinement
═══════════════════════════════════════════════════════════════════════════════

Evolves the reasoning system through:
1. Tier keyword refinement (learns new discriminating keywords)
2. Weight adjustment based on performance
3. Pattern mutation and crossover
4. Fitness-based selection

"Adapt or perish - the system that learns fastest wins."
"""

import json
import random
import time
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import sys

sys.path.insert(0, str(Path(__file__).parent))

from tier_specialists import TierCouncil, Tier, Query
from auto_trainer import TrainingDataGenerator, TrainingMetrics


# ═══════════════════════════════════════════════════════════════════════════════
# EVOLUTION CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class EvolutionConfig:
    """Configuration for evolution process"""
    population_size: int = 10
    mutation_rate: float = 0.1
    crossover_rate: float = 0.3
    elite_count: int = 2
    generations: int = 5
    fitness_threshold: float = 0.9


# ═══════════════════════════════════════════════════════════════════════════════
# KEYWORD EVOLUTION
# ═══════════════════════════════════════════════════════════════════════════════

class KeywordEvolver:
    """Evolves tier keywords for better routing"""

    # Candidate keywords to try adding to each tier
    CANDIDATE_KEYWORDS = {
        Tier.LOGIC_CORE: [
            'axiom', 'proof', 'theorem', 'deduction', 'induction', 'contradiction',
            'syllogism', 'valid', 'invalid', 'premise', 'conclusion', 'derive',
            'formula', 'calculus', 'algebra', 'equation', 'truth', 'false'
        ],
        Tier.STRATEGIST: [
            'negotiate', 'strategy', 'tactics', 'plan', 'objective', 'counter',
            'position', 'leverage', 'concession', 'deadline', 'pressure', 'stance',
            'alliance', 'opponent', 'move', 'gambit', 'chess', 'maneuver'
        ],
        Tier.MANIPULATOR: [
            'persuade', 'influence', 'convince', 'trust', 'rapport', 'charm',
            'framing', 'anchor', 'reciprocity', 'scarcity', 'authority', 'social',
            'compliance', 'commitment', 'liking', 'consensus', 'appeal'
        ],
        Tier.ARCHITECT: [
            'design', 'system', 'architecture', 'component', 'module', 'interface',
            'scalable', 'resilient', 'failure', 'redundancy', 'pattern', 'structure',
            'blueprint', 'specification', 'requirement', 'constraint'
        ],
        Tier.RAW_REALITY: [
            'emotion', 'feel', 'experience', 'trauma', 'stress', 'anxiety',
            'fear', 'anger', 'grief', 'joy', 'visceral', 'gut', 'instinct',
            'survivor', 'witness', 'authentic', 'raw', 'unfiltered'
        ],
    }

    def __init__(self, council: TierCouncil):
        self.council = council
        self.keyword_fitness: Dict[Tier, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
        self.keyword_trials: Dict[Tier, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

    def evaluate_keyword(self, tier: Tier, keyword: str, test_queries: List[str]) -> float:
        """Evaluate how well a keyword helps route to the correct tier"""
        # Temporarily add keyword
        original_keywords = list(self.council.TIER_KEYWORDS.get(tier, []))
        if keyword not in original_keywords:
            self.council.TIER_KEYWORDS[tier] = original_keywords + [keyword]

        correct = 0
        for query in test_queries:
            result = self.council.query(query, target_tiers=list(Tier))
            sorted_contribs = sorted(
                result.tier_contributions.items(),
                key=lambda x: x[1],
                reverse=True
            )
            if sorted_contribs[0][0] == tier:
                correct += 1

        # Restore original keywords
        self.council.TIER_KEYWORDS[tier] = original_keywords

        return correct / len(test_queries) if test_queries else 0

    def evolve_keywords(self, tier: Tier, generations: int = 3) -> List[str]:
        """Evolve keywords for a specific tier"""
        print(f"\n  Evolving keywords for {tier.name}...")

        # Generate test queries for this tier
        test_queries = [
            TrainingDataGenerator.generate_query(tier)
            for _ in range(20)
        ]

        # Get baseline accuracy
        baseline = self.evaluate_keyword(tier, "", test_queries)
        print(f"    Baseline accuracy: {baseline:.0%}")

        # Try candidate keywords
        successful_keywords = []
        for keyword in self.CANDIDATE_KEYWORDS.get(tier, []):
            fitness = self.evaluate_keyword(tier, keyword, test_queries)
            self.keyword_fitness[tier][keyword] = fitness
            self.keyword_trials[tier][keyword] += 1

            if fitness > baseline + 0.05:  # 5% improvement threshold
                successful_keywords.append((keyword, fitness))
                print(f"    ✓ '{keyword}': {fitness:.0%} (+{(fitness-baseline):.0%})")

        # Add best keywords permanently
        if successful_keywords:
            successful_keywords.sort(key=lambda x: -x[1])
            for kw, fitness in successful_keywords[:3]:  # Top 3
                if kw not in self.council.TIER_KEYWORDS.get(tier, []):
                    self.council.TIER_KEYWORDS[tier] = list(self.council.TIER_KEYWORDS.get(tier, [])) + [kw]

        return [kw for kw, _ in successful_keywords]


# ═══════════════════════════════════════════════════════════════════════════════
# WEIGHT EVOLUTION
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class WeightChromosome:
    """A chromosome representing tier weights"""
    tier_weights: Dict[str, float] = field(default_factory=dict)
    fitness: float = 0.0

    @classmethod
    def random(cls) -> 'WeightChromosome':
        """Create random chromosome"""
        return cls(tier_weights={
            tier.name: random.uniform(0.5, 1.5) for tier in Tier
        })

    def mutate(self, rate: float = 0.1):
        """Mutate weights"""
        for tier_name in self.tier_weights:
            if random.random() < rate:
                # Add random noise
                self.tier_weights[tier_name] *= random.uniform(0.8, 1.2)
                # Clamp to valid range
                self.tier_weights[tier_name] = max(0.1, min(2.0, self.tier_weights[tier_name]))

    def crossover(self, other: 'WeightChromosome') -> 'WeightChromosome':
        """Crossover with another chromosome"""
        child = WeightChromosome()
        for tier_name in self.tier_weights:
            if random.random() < 0.5:
                child.tier_weights[tier_name] = self.tier_weights[tier_name]
            else:
                child.tier_weights[tier_name] = other.tier_weights[tier_name]
        return child


class WeightEvolver:
    """Evolves tier contribution weights"""

    def __init__(self, council: TierCouncil):
        self.council = council
        self.population: List[WeightChromosome] = []
        self.best_chromosome: Optional[WeightChromosome] = None

    def evaluate_fitness(self, chromosome: WeightChromosome) -> float:
        """Evaluate chromosome fitness based on routing accuracy"""
        # Generate balanced test set
        test_batch = TrainingDataGenerator.generate_batch(count_per_tier=4)

        correct = 0
        for expected_tier, query in test_batch:
            result = self.council.query(query, target_tiers=list(Tier))

            # Apply chromosome weights
            weighted_contribs = {}
            for tier, contrib in result.tier_contributions.items():
                weight = chromosome.tier_weights.get(tier.name, 1.0)
                weighted_contribs[tier] = contrib * weight

            # Check if expected tier wins
            sorted_contribs = sorted(weighted_contribs.items(), key=lambda x: -x[1])
            if sorted_contribs[0][0] == expected_tier:
                correct += 1

        return correct / len(test_batch)

    def evolve(self, config: EvolutionConfig) -> WeightChromosome:
        """Run evolution process"""
        print("\n  Evolving tier weights...")

        # Initialize population
        self.population = [WeightChromosome.random() for _ in range(config.population_size)]

        for gen in range(config.generations):
            # Evaluate fitness
            for chrom in self.population:
                chrom.fitness = self.evaluate_fitness(chrom)

            # Sort by fitness
            self.population.sort(key=lambda c: -c.fitness)
            best = self.population[0]

            print(f"    Gen {gen+1}: Best fitness = {best.fitness:.0%}")

            if best.fitness >= config.fitness_threshold:
                print(f"    ✓ Reached fitness threshold!")
                break

            # Selection and reproduction
            new_population = self.population[:config.elite_count]  # Elitism

            while len(new_population) < config.population_size:
                # Tournament selection
                p1 = max(random.sample(self.population, 3), key=lambda c: c.fitness)
                p2 = max(random.sample(self.population, 3), key=lambda c: c.fitness)

                # Crossover
                if random.random() < config.crossover_rate:
                    child = p1.crossover(p2)
                else:
                    child = WeightChromosome(tier_weights=p1.tier_weights.copy())

                # Mutation
                child.mutate(config.mutation_rate)
                new_population.append(child)

            self.population = new_population

        # Return best
        self.best_chromosome = max(self.population, key=lambda c: c.fitness)
        return self.best_chromosome


# ═══════════════════════════════════════════════════════════════════════════════
# EVOLUTION ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class EvolutionEngine:
    """
    Main evolution engine that coordinates all refinement processes.

    Runs periodic evolution cycles to improve:
    1. Tier keyword sets
    2. Contribution weights
    3. Pattern confidence
    """

    def __init__(self, save_path: str = "data/evolution_state.json"):
        self.council = TierCouncil()
        self.keyword_evolver = KeywordEvolver(self.council)
        self.weight_evolver = WeightEvolver(self.council)
        self.save_path = Path(save_path)
        self.generation = 0
        self.history: List[Dict] = []

    def run_evolution_cycle(self, config: EvolutionConfig = None) -> Dict:
        """Run one complete evolution cycle"""
        config = config or EvolutionConfig()
        self.generation += 1

        print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                       EVOLUTION CYCLE {self.generation:>3}                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """)

        start_time = time.time()
        results = {'generation': self.generation}

        # Phase 1: Measure baseline
        print("  Phase 1: Measuring baseline...")
        baseline_metrics = self._measure_accuracy()
        results['baseline_accuracy'] = baseline_metrics['accuracy']
        print(f"    Baseline accuracy: {baseline_metrics['accuracy']:.0%}")

        # Phase 2: Evolve keywords for weak tiers
        print("\n  Phase 2: Keyword Evolution...")
        weak_tiers = [
            tier for tier, stats in baseline_metrics['per_tier'].items()
            if stats['accuracy'] < 0.8
        ]

        new_keywords = {}
        for tier in weak_tiers:
            new_kw = self.keyword_evolver.evolve_keywords(Tier[tier], generations=3)
            new_keywords[tier] = new_kw

        results['new_keywords'] = new_keywords

        # Phase 3: Evolve weights
        print("\n  Phase 3: Weight Evolution...")
        best_weights = self.weight_evolver.evolve(config)
        results['best_weights'] = best_weights.tier_weights
        results['weight_fitness'] = best_weights.fitness

        # Phase 4: Measure improvement
        print("\n  Phase 4: Measuring improvement...")
        final_metrics = self._measure_accuracy()
        results['final_accuracy'] = final_metrics['accuracy']
        improvement = final_metrics['accuracy'] - baseline_metrics['accuracy']
        results['improvement'] = improvement

        elapsed = time.time() - start_time
        results['time_seconds'] = elapsed

        # Summary
        print(f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                       EVOLUTION RESULTS                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Baseline Accuracy:  {baseline_metrics['accuracy']:>5.0%}                                                  ║
║  Final Accuracy:     {final_metrics['accuracy']:>5.0%}                                                  ║
║  Improvement:        {improvement:>+5.0%}                                                  ║
║  Time:               {elapsed:>5.1f}s                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """)

        # Show per-tier improvement
        print("  Per-Tier Changes:")
        for tier_name in baseline_metrics['per_tier']:
            before = baseline_metrics['per_tier'][tier_name]['accuracy']
            after = final_metrics['per_tier'].get(tier_name, {}).get('accuracy', before)
            delta = after - before
            symbol = "↑" if delta > 0 else "↓" if delta < 0 else "→"
            print(f"    {tier_name:15} {before:.0%} → {after:.0%} {symbol}")

        self.history.append(results)
        self._save_state()

        return results

    def _measure_accuracy(self) -> Dict:
        """Measure current routing accuracy"""
        test_batch = TrainingDataGenerator.generate_batch(count_per_tier=10)

        total = 0
        correct = 0
        per_tier = defaultdict(lambda: {'correct': 0, 'total': 0})

        for expected_tier, query in test_batch:
            result = self.council.query(query, target_tiers=list(Tier))
            sorted_contribs = sorted(
                result.tier_contributions.items(),
                key=lambda x: x[1],
                reverse=True
            )
            actual_top = sorted_contribs[0][0]

            total += 1
            per_tier[expected_tier.name]['total'] += 1

            if actual_top == expected_tier:
                correct += 1
                per_tier[expected_tier.name]['correct'] += 1

        # Calculate accuracies
        for tier_name in per_tier:
            stats = per_tier[tier_name]
            stats['accuracy'] = stats['correct'] / stats['total'] if stats['total'] > 0 else 0

        return {
            'accuracy': correct / total if total > 0 else 0,
            'per_tier': dict(per_tier)
        }

    def _save_state(self):
        """Save evolution state"""
        self.save_path.parent.mkdir(parents=True, exist_ok=True)
        state = {
            'generation': self.generation,
            'history': self.history,
            'keywords': {tier.name: list(kws) for tier, kws in self.council.TIER_KEYWORDS.items()},
            'timestamp': datetime.now().isoformat()
        }
        with open(self.save_path, 'w') as f:
            json.dump(state, f, indent=2)


def run_evolution():
    """Run the evolution engine"""
    engine = EvolutionEngine()
    config = EvolutionConfig(
        population_size=8,
        generations=3,
        mutation_rate=0.15
    )
    results = engine.run_evolution_cycle(config)
    return engine


if __name__ == "__main__":
    run_evolution()

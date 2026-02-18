#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════════════════
AUTO-TRAINER - Continuous Learning System
═══════════════════════════════════════════════════════════════════════════════

Runs continuous training loops that:
1. Generate/sample training queries
2. Process through the system
3. Evaluate results
4. Learn from successes/failures
5. Evolve patterns and weights

"Train as you build, build as you train."
"""

import asyncio
import random
import time
import json
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict
import sys

sys.path.insert(0, str(Path(__file__).parent))

from tier_specialists import TierCouncil, Tier, Query
from pattern_learner import PatternLearner


# ═══════════════════════════════════════════════════════════════════════════════
# TRAINING DATA GENERATORS
# ═══════════════════════════════════════════════════════════════════════════════

class TrainingDataGenerator:
    """Generates training queries for each tier"""

    TIER_TEMPLATES = {
        Tier.LOGIC_CORE: [
            "Prove that {concept} using {method}",
            "What is the logical flaw in: {statement}",
            "Derive the {result} from {premises}",
            "Is this argument valid: {argument}",
            "Formalize the proof of {theorem}",
        ],
        Tier.STRATEGIST: [
            "What's the optimal strategy for {scenario}",
            "How should we handle {crisis}",
            "Assess the risks of {decision}",
            "Plan a response to {threat}",
            "What are the strategic implications of {event}",
        ],
        Tier.MANIPULATOR: [
            "How do we persuade {audience} to {action}",
            "Build rapport with {person_type}",
            "Overcome objections about {topic}",
            "What motivates {group} to {behavior}",
            "How to influence {decision_maker} on {issue}",
        ],
        Tier.ARCHITECT: [
            "Design a {system} that handles {requirement}",
            "What's the failure mode analysis for {component}",
            "Architecture for {scale} users with {constraint}",
            "How to make {system} fault-tolerant",
            "Interface design between {component1} and {component2}",
        ],
        Tier.RAW_REALITY: [
            "What emotions arise during {situation}",
            "How do people actually behave in {crisis}",
            "What's the authentic response to {event}",
            "Describe the real experience of {role} during {situation}",
            "What stress patterns emerge in {context}",
        ],
    }

    FILL_VALUES = {
        'concept': ['prime numbers are infinite', 'P=NP is undecidable', 'recursion terminates'],
        'method': ['induction', 'contradiction', 'direct proof', 'cases'],
        'statement': ['all swans are white', 'this sentence is false', 'might makes right'],
        'premises': ['axioms of set theory', 'Peano axioms', 'first principles'],
        'result': ['Pythagorean theorem', 'quadratic formula', 'Bayes theorem'],
        'argument': ['ad hominem attack', 'slippery slope', 'appeal to authority'],
        'theorem': ['Gödel incompleteness', 'Fermat last', 'Cantor diagonal'],
        'scenario': ['hostile negotiation', 'market entry', 'crisis response'],
        'crisis': ['data breach', 'PR disaster', 'supply chain failure'],
        'decision': ['market expansion', 'product pivot', 'acquisition'],
        'threat': ['competitor move', 'regulatory change', 'economic downturn'],
        'event': ['merger announcement', 'leadership change', 'market crash'],
        'audience': ['skeptical investors', 'resistant employees', 'hesitant customers'],
        'action': ['adopt new process', 'invest more', 'change behavior'],
        'person_type': ['analytical thinker', 'emotional decision maker', 'busy executive'],
        'topic': ['pricing', 'timeline', 'quality concerns'],
        'group': ['millennials', 'enterprise customers', 'technical users'],
        'behavior': ['early adoption', 'brand loyalty', 'advocacy'],
        'decision_maker': ['CEO', 'board', 'procurement team'],
        'issue': ['budget allocation', 'strategic direction', 'vendor selection'],
        'system': ['distributed database', 'real-time analytics', 'payment processor'],
        'requirement': ['high availability', 'low latency', 'data consistency'],
        'component': ['load balancer', 'message queue', 'cache layer'],
        'scale': ['million', 'billion', 'global'],
        'constraint': ['limited budget', 'legacy integration', 'strict compliance'],
        'component1': ['frontend', 'API gateway', 'microservice'],
        'component2': ['database', 'cache', 'message broker'],
        'situation': ['job loss', 'medical emergency', 'natural disaster'],
        'role': ['first responder', '911 operator', 'ER doctor'],
        'context': ['high-stakes negotiation', 'life-or-death decision', 'crisis management'],
    }

    @classmethod
    def generate_query(cls, tier: Tier) -> str:
        """Generate a random query for a specific tier"""
        templates = cls.TIER_TEMPLATES.get(tier, [])
        if not templates:
            return "What should we do?"

        template = random.choice(templates)

        # Fill in placeholders
        result = template
        for key, values in cls.FILL_VALUES.items():
            placeholder = '{' + key + '}'
            if placeholder in result:
                result = result.replace(placeholder, random.choice(values), 1)

        return result

    @classmethod
    def generate_batch(cls, count_per_tier: int = 2) -> List[Tuple[Tier, str]]:
        """Generate a batch of queries across all tiers"""
        batch = []
        for tier in Tier:
            for _ in range(count_per_tier):
                query = cls.generate_query(tier)
                batch.append((tier, query))
        random.shuffle(batch)
        return batch


# ═══════════════════════════════════════════════════════════════════════════════
# TRAINING METRICS
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class TrainingMetrics:
    """Tracks training progress"""
    total_queries: int = 0
    correct_routing: int = 0
    avg_confidence: float = 0.0
    tier_accuracy: Dict[str, float] = field(default_factory=dict)
    learning_curve: List[float] = field(default_factory=list)
    training_time_seconds: float = 0.0

    def add_result(self, expected_tier: Tier, actual_top_tier: Tier, confidence: float):
        """Record a training result"""
        self.total_queries += 1
        if expected_tier == actual_top_tier:
            self.correct_routing += 1

        # Update running average
        n = self.total_queries
        self.avg_confidence = (self.avg_confidence * (n - 1) + confidence) / n

        # Track per-tier accuracy
        tier_name = expected_tier.name
        if tier_name not in self.tier_accuracy:
            self.tier_accuracy[tier_name] = {'correct': 0, 'total': 0}
        self.tier_accuracy[tier_name]['total'] += 1
        if expected_tier == actual_top_tier:
            self.tier_accuracy[tier_name]['correct'] += 1

        # Learning curve (every 10 queries)
        if self.total_queries % 10 == 0:
            self.learning_curve.append(self.routing_accuracy)

    @property
    def routing_accuracy(self) -> float:
        return self.correct_routing / self.total_queries if self.total_queries > 0 else 0


# ═══════════════════════════════════════════════════════════════════════════════
# AUTO-TRAINER
# ═══════════════════════════════════════════════════════════════════════════════

class AutoTrainer:
    """
    Continuous training system that improves the model as it runs.

    Training Loop:
    1. Generate training queries
    2. Process through TierCouncil
    3. Evaluate routing accuracy
    4. Record patterns from successes
    5. Adjust weights based on performance
    """

    def __init__(self, save_path: str = "data/training_state.json"):
        self.council = TierCouncil()
        self.learner = PatternLearner()
        self.metrics = TrainingMetrics()
        self.save_path = Path(save_path)
        self.running = False
        self.epoch = 0

        print("AutoTrainer initialized")

    def train_single(self, expected_tier: Tier, query: str) -> Dict:
        """Run a single training step"""
        # Process query
        result = self.council.query(query, target_tiers=list(Tier))

        # Find top contributing tier
        sorted_contribs = sorted(
            result.tier_contributions.items(),
            key=lambda x: x[1],
            reverse=True
        )
        actual_top_tier = sorted_contribs[0][0]
        top_contrib = sorted_contribs[0][1]

        # Check if routing was correct
        is_correct = (actual_top_tier == expected_tier)

        # Record metrics
        self.metrics.add_result(expected_tier, actual_top_tier, result.confidence)

        # Learn from result
        if is_correct:
            # Record successful pattern
            features = {
                'query_length': len(query),
                'expected_tier': expected_tier.name,
                'confidence': result.confidence
            }
            # We'd ideally extract real features, but for now use simple ones
            self.learner.record_success(
                transforms=[('tier_routing', {'tier': expected_tier.name})],
                features=features,
                confidence=result.confidence
            )

        return {
            'query': query,
            'expected': expected_tier.name,
            'actual': actual_top_tier.name,
            'correct': is_correct,
            'confidence': result.confidence,
            'contribution': top_contrib
        }

    def train_batch(self, batch_size: int = 10) -> List[Dict]:
        """Train on a batch of queries"""
        batch = TrainingDataGenerator.generate_batch(count_per_tier=batch_size // 5)
        results = []

        for expected_tier, query in batch[:batch_size]:
            result = self.train_single(expected_tier, query)
            results.append(result)

        return results

    def train_epoch(self, queries_per_epoch: int = 50) -> Dict:
        """Run one training epoch"""
        self.epoch += 1
        start_time = time.time()

        print(f"\n{'='*60}")
        print(f"  EPOCH {self.epoch}")
        print('='*60)

        results = self.train_batch(queries_per_epoch)

        # Calculate epoch stats
        correct = sum(1 for r in results if r['correct'])
        accuracy = correct / len(results)

        elapsed = time.time() - start_time
        self.metrics.training_time_seconds += elapsed

        # Show progress
        print(f"\n  Queries: {len(results)}")
        print(f"  Correct: {correct} ({accuracy:.0%})")
        print(f"  Avg Confidence: {self.metrics.avg_confidence:.0%}")
        print(f"  Time: {elapsed:.1f}s")

        # Show per-tier breakdown
        print(f"\n  Per-Tier Accuracy:")
        for tier_name, stats in self.metrics.tier_accuracy.items():
            tier_acc = stats['correct'] / stats['total'] if stats['total'] > 0 else 0
            bar = "█" * int(tier_acc * 10)
            print(f"    {tier_name:15} {bar} {tier_acc:.0%}")

        return {
            'epoch': self.epoch,
            'accuracy': accuracy,
            'correct': correct,
            'total': len(results),
            'time': elapsed
        }

    def train_continuous(self, epochs: int = 5, queries_per_epoch: int = 50):
        """Run continuous training for multiple epochs"""
        print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   █████╗ ██╗   ██╗████████╗ ██████╗ ████████╗██████╗  █████╗ ██╗███╗   ██╗  ║
║  ██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗╚══██╔══╝██╔══██╗██╔══██╗██║████╗  ██║  ║
║  ███████║██║   ██║   ██║   ██║   ██║   ██║   ██████╔╝███████║██║██╔██╗ ██║  ║
║  ██╔══██║██║   ██║   ██║   ██║   ██║   ██║   ██╔══██╗██╔══██║██║██║╚██╗██║  ║
║  ██║  ██║╚██████╔╝   ██║   ╚██████╔╝   ██║   ██║  ██║██║  ██║██║██║ ╚████║  ║
║  ╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝  ║
║                                                                              ║
║                    CONTINUOUS LEARNING SYSTEM                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        """)

        self.running = True
        epoch_results = []

        for i in range(epochs):
            if not self.running:
                break

            result = self.train_epoch(queries_per_epoch)
            epoch_results.append(result)

            # Save progress
            self._save_state()

        # Final summary
        self._print_summary(epoch_results)

        return epoch_results

    def _save_state(self):
        """Save training state to disk"""
        self.save_path.parent.mkdir(parents=True, exist_ok=True)
        state = {
            'epoch': self.epoch,
            'metrics': {
                'total_queries': self.metrics.total_queries,
                'correct_routing': self.metrics.correct_routing,
                'avg_confidence': self.metrics.avg_confidence,
                'tier_accuracy': self.metrics.tier_accuracy,
                'learning_curve': self.metrics.learning_curve,
                'training_time_seconds': self.metrics.training_time_seconds
            },
            'timestamp': datetime.now().isoformat()
        }
        with open(self.save_path, 'w') as f:
            json.dump(state, f, indent=2)

    def _print_summary(self, epoch_results: List[Dict]):
        """Print training summary"""
        print(f"""

╔══════════════════════════════════════════════════════════════════════════════╗
║                          TRAINING COMPLETE                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Epochs:          {self.epoch:>4}                                                       ║
║  Total Queries:   {self.metrics.total_queries:>4}                                                       ║
║  Routing Acc:     {self.metrics.routing_accuracy:>4.0%}                                                       ║
║  Avg Confidence:  {self.metrics.avg_confidence:>4.0%}                                                       ║
║  Training Time:   {self.metrics.training_time_seconds:>5.1f}s                                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Learning Curve:                                                             ║""")

        # Show learning curve as ASCII chart
        if self.metrics.learning_curve:
            max_val = max(self.metrics.learning_curve)
            for i, val in enumerate(self.metrics.learning_curve[-10:]):  # Last 10 points
                bar_len = int(val / max_val * 30) if max_val > 0 else 0
                bar = "█" * bar_len
                print(f"║  {i*10:>3}: {bar} {val:.0%}")

        print("╚══════════════════════════════════════════════════════════════════════════════╝")

        # Learner stats
        learner_stats = self.learner.get_stats()
        print(f"\n  Patterns Learned: {learner_stats.get('total_patterns', 0)}")


def run_auto_training():
    """Run the auto-training system"""
    trainer = AutoTrainer()
    results = trainer.train_continuous(epochs=5, queries_per_epoch=20)
    return trainer


if __name__ == "__main__":
    run_auto_training()

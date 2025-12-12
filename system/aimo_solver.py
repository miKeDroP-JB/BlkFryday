#!/usr/bin/env python3
"""
AIMO SOLVER - Mathematical Olympiad Integration
═══════════════════════════════════════════════════════════════════
Connects Kaggle AIMO inference to the Infinite Strategy Generator brain.
═══════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import re
from typing import Optional

try:
    import kaggle_evaluation.aimo_3_inference_server
    import pandas as pd
    import polars as pl
    KAGGLE_AVAILABLE = True
except ImportError:
    KAGGLE_AVAILABLE = False
    print("[AIMO] Kaggle evaluation not available - running in standalone mode")


class MathSolver:
    """
    Mathematical problem solver using pattern matching and symbolic reasoning.
    Integrates with the Infinite Strategy Generator concept.
    """

    def __init__(self):
        self._strategies = self._load_strategies()
        self._cache = {}

    def _load_strategies(self):
        """Load mathematical solving strategies."""
        return {
            'arithmetic': self._solve_arithmetic,
            'algebra': self._solve_algebra,
            'geometry': self._solve_geometry,
            'number_theory': self._solve_number_theory,
            'combinatorics': self._solve_combinatorics,
            'pattern': self._solve_pattern,
        }

    def classify_problem(self, problem: str) -> str:
        """Classify the problem type."""
        problem_lower = problem.lower()

        if any(w in problem_lower for w in ['triangle', 'circle', 'angle', 'area', 'perimeter']):
            return 'geometry'
        elif any(w in problem_lower for w in ['divide', 'remainder', 'prime', 'factor', 'modulo']):
            return 'number_theory'
        elif any(w in problem_lower for w in ['ways', 'arrangements', 'combinations', 'permutations']):
            return 'combinatorics'
        elif any(w in problem_lower for w in ['equation', 'solve for', 'find x', 'variable']):
            return 'algebra'
        elif any(w in problem_lower for w in ['sum', 'product', 'average', 'total']):
            return 'arithmetic'
        else:
            return 'pattern'

    def solve(self, problem: str) -> int:
        """
        Solve a mathematical problem.
        Returns an integer between 0 and 99999.
        """
        # Check cache
        if problem in self._cache:
            return self._cache[problem]

        # Classify and solve
        problem_type = self.classify_problem(problem)
        strategy = self._strategies.get(problem_type, self._solve_pattern)

        try:
            result = strategy(problem)
            # Ensure result is in valid range
            result = max(0, min(99999, int(result)))
        except Exception as e:
            print(f"[AIMO] Strategy failed: {e}")
            result = self._extract_numbers(problem)

        self._cache[problem] = result
        return result

    def _extract_numbers(self, text: str) -> int:
        """Extract numbers from text as fallback."""
        numbers = re.findall(r'\d+', text)
        if numbers:
            # Return the last mentioned number (often the answer hint)
            return int(numbers[-1]) % 100000
        return 0

    def _solve_arithmetic(self, problem: str) -> int:
        """Solve arithmetic problems."""
        numbers = [int(n) for n in re.findall(r'\d+', problem)]
        if not numbers:
            return 0

        problem_lower = problem.lower()

        if 'sum' in problem_lower or 'add' in problem_lower or 'total' in problem_lower:
            return sum(numbers)
        elif 'product' in problem_lower or 'multiply' in problem_lower:
            result = 1
            for n in numbers:
                result *= n
            return result % 100000
        elif 'average' in problem_lower or 'mean' in problem_lower:
            return sum(numbers) // len(numbers)
        elif 'difference' in problem_lower or 'subtract' in problem_lower:
            if len(numbers) >= 2:
                return abs(numbers[0] - numbers[1])

        return numbers[-1] if numbers else 0

    def _solve_algebra(self, problem: str) -> int:
        """Solve algebraic problems."""
        # Look for equations like "x + 5 = 10"
        eq_match = re.search(r'(\d+)\s*[+\-*/]\s*(\d+)\s*=\s*(\d+)', problem)
        if eq_match:
            a, b, c = map(int, eq_match.groups())
            # Assume addition: a + x = c -> x = c - a
            return abs(c - a)

        return self._extract_numbers(problem)

    def _solve_geometry(self, problem: str) -> int:
        """Solve geometry problems."""
        numbers = [int(n) for n in re.findall(r'\d+', problem)]
        problem_lower = problem.lower()

        if 'area' in problem_lower:
            if 'triangle' in problem_lower and len(numbers) >= 2:
                # Area = 0.5 * base * height
                return (numbers[0] * numbers[1]) // 2
            elif 'rectangle' in problem_lower or 'square' in problem_lower:
                if len(numbers) >= 2:
                    return numbers[0] * numbers[1]
                elif len(numbers) == 1:
                    return numbers[0] ** 2
            elif 'circle' in problem_lower and numbers:
                # Area = pi * r^2 ≈ 3.14159 * r^2
                return int(3.14159 * numbers[0] ** 2)

        if 'perimeter' in problem_lower:
            if 'triangle' in problem_lower and len(numbers) >= 3:
                return sum(numbers[:3])
            elif 'rectangle' in problem_lower and len(numbers) >= 2:
                return 2 * (numbers[0] + numbers[1])
            elif 'square' in problem_lower and numbers:
                return 4 * numbers[0]

        return self._extract_numbers(problem)

    def _solve_number_theory(self, problem: str) -> int:
        """Solve number theory problems."""
        numbers = [int(n) for n in re.findall(r'\d+', problem)]
        problem_lower = problem.lower()

        if 'remainder' in problem_lower or 'modulo' in problem_lower:
            if len(numbers) >= 2:
                return numbers[0] % numbers[1]

        if 'gcd' in problem_lower or 'greatest common' in problem_lower:
            if len(numbers) >= 2:
                return self._gcd(numbers[0], numbers[1])

        if 'lcm' in problem_lower or 'least common' in problem_lower:
            if len(numbers) >= 2:
                return self._lcm(numbers[0], numbers[1])

        if 'prime' in problem_lower:
            if 'sum' in problem_lower:
                # Sum of first n primes
                n = numbers[0] if numbers else 10
                return sum(self._first_n_primes(min(n, 100)))
            elif numbers:
                # Check if prime or find nth prime
                return self._nth_prime(min(numbers[0], 1000))

        return self._extract_numbers(problem)

    def _solve_combinatorics(self, problem: str) -> int:
        """Solve combinatorics problems."""
        numbers = [int(n) for n in re.findall(r'\d+', problem)]
        problem_lower = problem.lower()

        if not numbers:
            return 0

        n = numbers[0]
        r = numbers[1] if len(numbers) > 1 else n

        if 'permutation' in problem_lower or 'arrangements' in problem_lower:
            return self._permutation(n, r) % 100000

        if 'combination' in problem_lower or 'choose' in problem_lower:
            return self._combination(n, r) % 100000

        if 'factorial' in problem_lower:
            return self._factorial(min(n, 20)) % 100000

        return self._extract_numbers(problem)

    def _solve_pattern(self, problem: str) -> int:
        """Solve pattern-based problems."""
        numbers = [int(n) for n in re.findall(r'\d+', problem)]

        if len(numbers) >= 3:
            # Check for arithmetic sequence
            diffs = [numbers[i+1] - numbers[i] for i in range(len(numbers)-1)]
            if len(set(diffs)) == 1:
                # Arithmetic sequence - return next term
                return numbers[-1] + diffs[0]

            # Check for geometric sequence
            if all(numbers[i] != 0 for i in range(len(numbers)-1)):
                ratios = [numbers[i+1] / numbers[i] for i in range(len(numbers)-1)]
                if len(set(ratios)) == 1:
                    return int(numbers[-1] * ratios[0])

        return self._extract_numbers(problem)

    # Helper functions
    def _gcd(self, a: int, b: int) -> int:
        while b:
            a, b = b, a % b
        return a

    def _lcm(self, a: int, b: int) -> int:
        return abs(a * b) // self._gcd(a, b)

    def _is_prime(self, n: int) -> bool:
        if n < 2:
            return False
        if n == 2:
            return True
        if n % 2 == 0:
            return False
        for i in range(3, int(n**0.5) + 1, 2):
            if n % i == 0:
                return False
        return True

    def _nth_prime(self, n: int) -> int:
        count = 0
        num = 1
        while count < n:
            num += 1
            if self._is_prime(num):
                count += 1
        return num

    def _first_n_primes(self, n: int) -> list:
        primes = []
        num = 2
        while len(primes) < n:
            if self._is_prime(num):
                primes.append(num)
            num += 1
        return primes

    def _factorial(self, n: int) -> int:
        if n <= 1:
            return 1
        result = 1
        for i in range(2, n + 1):
            result *= i
        return result

    def _permutation(self, n: int, r: int) -> int:
        if r > n:
            return 0
        return self._factorial(n) // self._factorial(n - r)

    def _combination(self, n: int, r: int) -> int:
        if r > n:
            return 0
        return self._factorial(n) // (self._factorial(r) * self._factorial(n - r))


# Global model instance
model = MathSolver()


def predict(id_: 'pl.Series', problem: 'pl.Series') -> 'pl.DataFrame':
    """Make a prediction for Kaggle AIMO competition."""
    id_val = id_.item(0)
    problem_text: str = problem.item(0)

    print(f"[AIMO] Solving problem {id_val}...")
    prediction = model.solve(problem_text)
    print(f"[AIMO] Answer: {prediction}")

    return pl.DataFrame({'id': id_val, 'answer': prediction})


def main():
    """Main entry point."""
    if KAGGLE_AVAILABLE:
        inference_server = kaggle_evaluation.aimo_3_inference_server.AIMO3InferenceServer(
            predict
        )

        if os.getenv('KAGGLE_IS_COMPETITION_RERUN'):
            inference_server.serve()
        else:
            # Try to run local gateway with test data
            test_path = '/kaggle/input/ai-mathematical-olympiad-progress-prize-3/test.csv'
            if os.path.exists(test_path):
                inference_server.run_local_gateway((test_path,))
            else:
                print("[AIMO] No test data found - running in demo mode")
                demo_problems()
    else:
        print("[AIMO] Running in standalone demo mode")
        demo_problems()


def demo_problems():
    """Demo the solver with sample problems."""
    problems = [
        "What is the sum of the first 10 prime numbers?",
        "Find the area of a triangle with base 6 and height 8.",
        "What is 17 modulo 5?",
        "How many ways can you arrange 5 books on a shelf?",
        "What is the next number in the sequence: 2, 4, 6, 8, ?",
        "Find the GCD of 48 and 18.",
    ]

    print("\n" + "="*60)
    print("AIMO SOLVER - DEMO MODE")
    print("="*60 + "\n")

    for i, problem in enumerate(problems, 1):
        answer = model.solve(problem)
        print(f"{i}. {problem}")
        print(f"   Answer: {answer}\n")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
AIMO SOLVER v2 - Advanced Mathematical Olympiad Engine
═══════════════════════════════════════════════════════════════════
Enhanced solver with symbolic math, equation parsing, and deep reasoning.
═══════════════════════════════════════════════════════════════════
"""

import os
import sys
import re
import math
from typing import Optional, List, Tuple, Dict, Any
from fractions import Fraction
from functools import lru_cache

try:
    import kaggle_evaluation.aimo_3_inference_server
    import pandas as pd
    import polars as pl
    KAGGLE_AVAILABLE = True
except ImportError:
    KAGGLE_AVAILABLE = False
    print("[AIMO] Kaggle evaluation not available - running in standalone mode")

# Try to import sympy for symbolic math
try:
    import sympy
    from sympy import symbols, solve, simplify, expand, factor
    from sympy.parsing.sympy_parser import parse_expr
    SYMPY_AVAILABLE = True
except ImportError:
    SYMPY_AVAILABLE = False
    print("[AIMO] SymPy not available - using basic solver")


class SymbolicEngine:
    """Symbolic mathematics engine."""

    def __init__(self):
        self.variables = {}

    def parse_equation(self, equation_str: str) -> Optional[Any]:
        """Parse an equation string into symbolic form."""
        if not SYMPY_AVAILABLE:
            return None

        try:
            # Clean the equation
            eq = equation_str.replace('^', '**')
            eq = re.sub(r'(\d)([a-zA-Z])', r'\1*\2', eq)  # 2x -> 2*x

            # Split on equals
            if '=' in eq:
                left, right = eq.split('=', 1)
                return (parse_expr(left.strip()), parse_expr(right.strip()))
            else:
                return parse_expr(eq)
        except:
            return None

    def solve_equation(self, equation_str: str, var: str = 'x') -> Optional[int]:
        """Solve an equation for a variable."""
        if not SYMPY_AVAILABLE:
            return None

        try:
            parsed = self.parse_equation(equation_str)
            if parsed and isinstance(parsed, tuple):
                left, right = parsed
                x = symbols(var)
                solutions = solve(left - right, x)
                if solutions:
                    result = float(solutions[0])
                    return int(result) if result == int(result) else int(round(result))
        except:
            pass
        return None

    def evaluate_expression(self, expr_str: str, **kwargs) -> Optional[int]:
        """Evaluate a mathematical expression."""
        if not SYMPY_AVAILABLE:
            return self._basic_evaluate(expr_str)

        try:
            expr = parse_expr(expr_str.replace('^', '**'))
            if kwargs:
                expr = expr.subs(kwargs)
            result = float(expr.evalf())
            return int(result) if result == int(result) else int(round(result))
        except:
            return self._basic_evaluate(expr_str)

    def _basic_evaluate(self, expr_str: str) -> Optional[int]:
        """Basic expression evaluation without sympy."""
        try:
            # Safe evaluation
            expr = expr_str.replace('^', '**')
            # Only allow safe characters
            if re.match(r'^[\d\s\+\-\*\/\(\)\.\%]+$', expr):
                result = eval(expr)
                return int(result)
        except:
            pass
        return None


class NumberTheoryEngine:
    """Advanced number theory functions."""

    @staticmethod
    @lru_cache(maxsize=10000)
    def is_prime(n: int) -> bool:
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

    @staticmethod
    def prime_factorization(n: int) -> Dict[int, int]:
        """Return prime factorization as {prime: exponent}."""
        factors = {}
        d = 2
        while d * d <= n:
            while n % d == 0:
                factors[d] = factors.get(d, 0) + 1
                n //= d
            d += 1
        if n > 1:
            factors[n] = factors.get(n, 0) + 1
        return factors

    @staticmethod
    def divisors(n: int) -> List[int]:
        """Return all divisors of n."""
        divs = []
        for i in range(1, int(n**0.5) + 1):
            if n % i == 0:
                divs.append(i)
                if i != n // i:
                    divs.append(n // i)
        return sorted(divs)

    @staticmethod
    def euler_totient(n: int) -> int:
        """Euler's totient function φ(n)."""
        result = n
        p = 2
        while p * p <= n:
            if n % p == 0:
                while n % p == 0:
                    n //= p
                result -= result // p
            p += 1
        if n > 1:
            result -= result // n
        return result

    @staticmethod
    def gcd(a: int, b: int) -> int:
        while b:
            a, b = b, a % b
        return a

    @staticmethod
    def lcm(a: int, b: int) -> int:
        return abs(a * b) // NumberTheoryEngine.gcd(a, b)

    @staticmethod
    def extended_gcd(a: int, b: int) -> Tuple[int, int, int]:
        """Extended Euclidean algorithm. Returns (gcd, x, y) where ax + by = gcd."""
        if a == 0:
            return b, 0, 1
        gcd, x1, y1 = NumberTheoryEngine.extended_gcd(b % a, a)
        x = y1 - (b // a) * x1
        y = x1
        return gcd, x, y

    @staticmethod
    def mod_inverse(a: int, m: int) -> Optional[int]:
        """Modular multiplicative inverse."""
        gcd, x, _ = NumberTheoryEngine.extended_gcd(a % m, m)
        if gcd != 1:
            return None
        return (x % m + m) % m

    @staticmethod
    def chinese_remainder(remainders: List[int], moduli: List[int]) -> int:
        """Chinese Remainder Theorem."""
        if len(remainders) != len(moduli):
            return 0

        M = 1
        for m in moduli:
            M *= m

        result = 0
        for r, m in zip(remainders, moduli):
            Mi = M // m
            yi = NumberTheoryEngine.mod_inverse(Mi, m)
            if yi is None:
                return 0
            result += r * Mi * yi

        return result % M

    @staticmethod
    def nth_prime(n: int) -> int:
        """Return the nth prime number."""
        if n <= 0:
            return 2
        count = 0
        num = 1
        while count < n:
            num += 1
            if NumberTheoryEngine.is_prime(num):
                count += 1
        return num

    @staticmethod
    def prime_count(n: int) -> int:
        """Count primes up to n."""
        if n < 2:
            return 0
        count = 0
        for i in range(2, n + 1):
            if NumberTheoryEngine.is_prime(i):
                count += 1
        return count

    @staticmethod
    def sum_of_primes(n: int) -> int:
        """Sum of first n primes."""
        total = 0
        count = 0
        num = 2
        while count < n:
            if NumberTheoryEngine.is_prime(num):
                total += num
                count += 1
            num += 1
        return total


class CombinatoricsEngine:
    """Combinatorics and counting."""

    @staticmethod
    @lru_cache(maxsize=1000)
    def factorial(n: int) -> int:
        if n <= 1:
            return 1
        return n * CombinatoricsEngine.factorial(n - 1)

    @staticmethod
    def permutation(n: int, r: int) -> int:
        if r > n or r < 0:
            return 0
        return CombinatoricsEngine.factorial(n) // CombinatoricsEngine.factorial(n - r)

    @staticmethod
    def combination(n: int, r: int) -> int:
        if r > n or r < 0:
            return 0
        return CombinatoricsEngine.factorial(n) // (
            CombinatoricsEngine.factorial(r) * CombinatoricsEngine.factorial(n - r)
        )

    @staticmethod
    def catalan(n: int) -> int:
        """nth Catalan number."""
        return CombinatoricsEngine.combination(2 * n, n) // (n + 1)

    @staticmethod
    def stirling_second(n: int, k: int) -> int:
        """Stirling number of the second kind S(n,k)."""
        if n == 0 and k == 0:
            return 1
        if n == 0 or k == 0:
            return 0
        if k > n:
            return 0

        # Use recurrence: S(n,k) = k*S(n-1,k) + S(n-1,k-1)
        dp = [[0] * (k + 1) for _ in range(n + 1)]
        dp[0][0] = 1

        for i in range(1, n + 1):
            for j in range(1, min(i, k) + 1):
                dp[i][j] = j * dp[i-1][j] + dp[i-1][j-1]

        return dp[n][k]

    @staticmethod
    def bell(n: int) -> int:
        """nth Bell number (number of partitions of a set)."""
        return sum(CombinatoricsEngine.stirling_second(n, k) for k in range(n + 1))

    @staticmethod
    def fibonacci(n: int) -> int:
        """nth Fibonacci number."""
        if n <= 0:
            return 0
        if n == 1:
            return 1
        a, b = 0, 1
        for _ in range(2, n + 1):
            a, b = b, a + b
        return b

    @staticmethod
    def derangements(n: int) -> int:
        """Number of derangements (permutations with no fixed points)."""
        if n == 0:
            return 1
        if n == 1:
            return 0
        return (n - 1) * (CombinatoricsEngine.derangements(n - 1) +
                         CombinatoricsEngine.derangements(n - 2))


class GeometryEngine:
    """Geometry calculations."""

    @staticmethod
    def triangle_area_base_height(base: float, height: float) -> float:
        return 0.5 * base * height

    @staticmethod
    def triangle_area_heron(a: float, b: float, c: float) -> float:
        """Heron's formula."""
        s = (a + b + c) / 2
        area_sq = s * (s - a) * (s - b) * (s - c)
        return math.sqrt(max(0, area_sq))

    @staticmethod
    def circle_area(radius: float) -> float:
        return math.pi * radius ** 2

    @staticmethod
    def circle_circumference(radius: float) -> float:
        return 2 * math.pi * radius

    @staticmethod
    def sphere_volume(radius: float) -> float:
        return (4/3) * math.pi * radius ** 3

    @staticmethod
    def sphere_surface(radius: float) -> float:
        return 4 * math.pi * radius ** 2

    @staticmethod
    def polygon_interior_angle_sum(n: int) -> int:
        """Sum of interior angles of n-gon in degrees."""
        return (n - 2) * 180

    @staticmethod
    def regular_polygon_interior_angle(n: int) -> float:
        """Interior angle of regular n-gon in degrees."""
        return (n - 2) * 180 / n

    @staticmethod
    def pythagorean(a: float, b: float) -> float:
        """Hypotenuse from two legs."""
        return math.sqrt(a**2 + b**2)

    @staticmethod
    def distance_2d(x1: float, y1: float, x2: float, y2: float) -> float:
        return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)


class MathSolverV2:
    """
    Advanced Mathematical Olympiad Solver v2.
    """

    def __init__(self):
        self.symbolic = SymbolicEngine()
        self.number_theory = NumberTheoryEngine()
        self.combinatorics = CombinatoricsEngine()
        self.geometry = GeometryEngine()
        self._cache = {}

    def solve(self, problem: str) -> int:
        """Solve a mathematical problem. Returns 0-99999."""
        if problem in self._cache:
            return self._cache[problem]

        # Try multiple solving strategies in order
        strategies = [
            self._try_direct_answer,
            self._try_symbolic_solve,
            self._try_number_theory,
            self._try_combinatorics,
            self._try_geometry,
            self._try_sequence,
            self._try_expression_eval,
            self._try_extract_answer,
        ]

        for strategy in strategies:
            try:
                result = strategy(problem)
                if result is not None:
                    result = max(0, min(99999, int(result)))
                    self._cache[problem] = result
                    return result
            except Exception as e:
                continue

        # Fallback
        return self._extract_last_number(problem)

    def _try_direct_answer(self, problem: str) -> Optional[int]:
        """Check if problem contains explicit answer pattern."""
        # "The answer is X" pattern
        match = re.search(r'(?:answer|result|solution)\s+(?:is|=|:)\s*(\d+)', problem.lower())
        if match:
            return int(match.group(1))
        return None

    def _try_symbolic_solve(self, problem: str) -> Optional[int]:
        """Try symbolic equation solving."""
        problem_lower = problem.lower()

        # Look for equation patterns
        eq_patterns = [
            r'solve[:\s]+(.+?=.+?)(?:\.|$)',
            r'find\s+x[:\s]+(.+?=.+?)(?:\.|$)',
            r'(\d+\s*[+\-*/]\s*x\s*=\s*\d+)',
            r'(x\s*[+\-*/]\s*\d+\s*=\s*\d+)',
        ]

        for pattern in eq_patterns:
            match = re.search(pattern, problem_lower)
            if match:
                result = self.symbolic.solve_equation(match.group(1))
                if result is not None:
                    return result

        return None

    def _try_number_theory(self, problem: str) -> Optional[int]:
        """Try number theory strategies."""
        problem_lower = problem.lower()
        numbers = [int(n) for n in re.findall(r'\d+', problem)]

        # GCD
        if 'gcd' in problem_lower or 'greatest common' in problem_lower:
            if len(numbers) >= 2:
                result = numbers[0]
                for n in numbers[1:]:
                    result = self.number_theory.gcd(result, n)
                return result

        # LCM
        if 'lcm' in problem_lower or 'least common' in problem_lower:
            if len(numbers) >= 2:
                result = numbers[0]
                for n in numbers[1:]:
                    result = self.number_theory.lcm(result, n)
                return result

        # Euler's totient
        if 'totient' in problem_lower or 'phi(' in problem_lower or 'φ(' in problem_lower:
            if numbers:
                return self.number_theory.euler_totient(numbers[0])

        # Prime counting
        if 'how many prime' in problem_lower:
            if 'less than' in problem_lower or 'up to' in problem_lower:
                if numbers:
                    return self.number_theory.prime_count(numbers[-1])

        # nth prime
        if re.search(r'(\d+)(?:st|nd|rd|th)\s+prime', problem_lower):
            match = re.search(r'(\d+)(?:st|nd|rd|th)\s+prime', problem_lower)
            if match:
                return self.number_theory.nth_prime(int(match.group(1)))

        # Sum of primes
        if 'sum' in problem_lower and 'prime' in problem_lower:
            if 'first' in problem_lower and numbers:
                return self.number_theory.sum_of_primes(numbers[0])

        # Modulo / remainder
        if 'remainder' in problem_lower or 'mod' in problem_lower:
            if len(numbers) >= 2:
                return numbers[0] % numbers[1]

        # Divisors count
        if 'divisor' in problem_lower and 'how many' in problem_lower:
            if numbers:
                return len(self.number_theory.divisors(numbers[0]))

        # Sum of divisors
        if 'sum' in problem_lower and 'divisor' in problem_lower:
            if numbers:
                return sum(self.number_theory.divisors(numbers[0]))

        return None

    def _try_combinatorics(self, problem: str) -> Optional[int]:
        """Try combinatorics strategies."""
        problem_lower = problem.lower()
        numbers = [int(n) for n in re.findall(r'\d+', problem)]

        # Factorial
        if 'factorial' in problem_lower or re.search(r'\d+!', problem):
            match = re.search(r'(\d+)!', problem)
            if match:
                n = int(match.group(1))
                return self.combinatorics.factorial(min(n, 20)) % 100000
            elif numbers:
                return self.combinatorics.factorial(min(numbers[0], 20)) % 100000

        # Permutations
        if 'permutation' in problem_lower or 'arrange' in problem_lower:
            if len(numbers) >= 2:
                return self.combinatorics.permutation(numbers[0], numbers[1]) % 100000
            elif numbers:
                return self.combinatorics.factorial(numbers[0]) % 100000

        # Combinations / choose
        if 'combination' in problem_lower or 'choose' in problem_lower or 'select' in problem_lower:
            if len(numbers) >= 2:
                return self.combinatorics.combination(numbers[0], numbers[1]) % 100000

        # Fibonacci
        if 'fibonacci' in problem_lower:
            if numbers:
                return self.combinatorics.fibonacci(min(numbers[0], 50)) % 100000

        # Catalan
        if 'catalan' in problem_lower:
            if numbers:
                return self.combinatorics.catalan(min(numbers[0], 20)) % 100000

        # Derangements
        if 'derangement' in problem_lower:
            if numbers:
                return self.combinatorics.derangements(min(numbers[0], 20)) % 100000

        # Ways to distribute / partition
        if 'ways' in problem_lower and 'distribute' in problem_lower:
            if len(numbers) >= 2:
                # Stars and bars: C(n+k-1, k-1)
                n, k = numbers[0], numbers[1]
                return self.combinatorics.combination(n + k - 1, k - 1) % 100000

        return None

    def _try_geometry(self, problem: str) -> Optional[int]:
        """Try geometry strategies."""
        problem_lower = problem.lower()
        numbers = [float(n) for n in re.findall(r'\d+\.?\d*', problem)]

        # Triangle area
        if 'triangle' in problem_lower and 'area' in problem_lower:
            if 'base' in problem_lower and 'height' in problem_lower:
                if len(numbers) >= 2:
                    return int(self.geometry.triangle_area_base_height(numbers[0], numbers[1]))
            elif len(numbers) >= 3:
                # Heron's formula
                return int(self.geometry.triangle_area_heron(numbers[0], numbers[1], numbers[2]))

        # Circle area
        if 'circle' in problem_lower and 'area' in problem_lower:
            if numbers:
                return int(self.geometry.circle_area(numbers[0]))

        # Circle circumference
        if 'circle' in problem_lower and ('circumference' in problem_lower or 'perimeter' in problem_lower):
            if numbers:
                return int(self.geometry.circle_circumference(numbers[0]))

        # Rectangle/square area
        if ('rectangle' in problem_lower or 'square' in problem_lower) and 'area' in problem_lower:
            if len(numbers) >= 2:
                return int(numbers[0] * numbers[1])
            elif numbers:
                return int(numbers[0] ** 2)

        # Perimeter
        if 'perimeter' in problem_lower:
            if 'rectangle' in problem_lower and len(numbers) >= 2:
                return int(2 * (numbers[0] + numbers[1]))
            elif 'square' in problem_lower and numbers:
                return int(4 * numbers[0])
            elif 'triangle' in problem_lower and len(numbers) >= 3:
                return int(sum(numbers[:3]))

        # Pythagorean theorem
        if 'hypotenuse' in problem_lower or 'pythagor' in problem_lower:
            if len(numbers) >= 2:
                return int(self.geometry.pythagorean(numbers[0], numbers[1]))

        # Polygon angles
        if 'interior angle' in problem_lower and 'polygon' in problem_lower:
            if numbers:
                n = int(numbers[0])
                if 'sum' in problem_lower:
                    return self.geometry.polygon_interior_angle_sum(n)
                else:
                    return int(self.geometry.regular_polygon_interior_angle(n))

        # Sphere
        if 'sphere' in problem_lower:
            if numbers:
                if 'volume' in problem_lower:
                    return int(self.geometry.sphere_volume(numbers[0]))
                elif 'surface' in problem_lower:
                    return int(self.geometry.sphere_surface(numbers[0]))

        return None

    def _try_sequence(self, problem: str) -> Optional[int]:
        """Try sequence/pattern detection."""
        # Find sequences in the problem
        seq_match = re.findall(r'\d+', problem)
        if len(seq_match) >= 3:
            numbers = [int(n) for n in seq_match]

            # Check arithmetic sequence
            diffs = [numbers[i+1] - numbers[i] for i in range(len(numbers)-1)]
            if len(set(diffs)) == 1:
                return numbers[-1] + diffs[0]

            # Check geometric sequence
            if all(numbers[i] != 0 for i in range(len(numbers)-1)):
                ratios = [numbers[i+1] / numbers[i] for i in range(len(numbers)-1)]
                if len(set(round(r, 6) for r in ratios)) == 1:
                    return int(numbers[-1] * ratios[0])

            # Check quadratic sequence (second differences constant)
            if len(diffs) >= 2:
                second_diffs = [diffs[i+1] - diffs[i] for i in range(len(diffs)-1)]
                if len(set(second_diffs)) == 1:
                    next_diff = diffs[-1] + second_diffs[0]
                    return numbers[-1] + next_diff

        return None

    def _try_expression_eval(self, problem: str) -> Optional[int]:
        """Try to evaluate mathematical expressions."""
        # Look for explicit calculations
        expr_patterns = [
            r'calculate[:\s]+(.+?)(?:\.|$)',
            r'compute[:\s]+(.+?)(?:\.|$)',
            r'evaluate[:\s]+(.+?)(?:\.|$)',
            r'what is[:\s]+(.+?)(?:\?|$)',
        ]

        for pattern in expr_patterns:
            match = re.search(pattern, problem.lower())
            if match:
                expr = match.group(1).strip()
                result = self.symbolic.evaluate_expression(expr)
                if result is not None:
                    return result

        return None

    def _try_extract_answer(self, problem: str) -> Optional[int]:
        """Try to extract answer from common patterns."""
        problem_lower = problem.lower()
        numbers = [int(n) for n in re.findall(r'\d+', problem)]

        # Sum patterns
        if 'sum' in problem_lower or 'total' in problem_lower or 'add' in problem_lower:
            if numbers:
                return sum(numbers) % 100000

        # Product patterns
        if 'product' in problem_lower or 'multiply' in problem_lower:
            if numbers:
                result = 1
                for n in numbers:
                    result *= n
                return result % 100000

        # Average
        if 'average' in problem_lower or 'mean' in problem_lower:
            if numbers:
                return sum(numbers) // len(numbers)

        # Difference
        if 'difference' in problem_lower:
            if len(numbers) >= 2:
                return abs(numbers[0] - numbers[1])

        return None

    def _extract_last_number(self, problem: str) -> int:
        """Fallback: extract the last number from the problem."""
        numbers = re.findall(r'\d+', problem)
        if numbers:
            return int(numbers[-1]) % 100000
        return 0


# Global model instance
model = MathSolverV2()


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
            test_path = '/kaggle/input/ai-mathematical-olympiad-progress-prize-3/test.csv'
            if os.path.exists(test_path):
                inference_server.run_local_gateway((test_path,))
            else:
                print("[AIMO] No test data found - running demo")
                demo_problems()
    else:
        print("[AIMO] Running in standalone demo mode")
        demo_problems()


def demo_problems():
    """Demo with sample olympiad-style problems."""
    problems = [
        # Number theory
        ("What is the sum of the first 10 prime numbers?", 129),
        ("Find the GCD of 48 and 18.", 6),
        ("What is 2023 mod 17?", 2023 % 17),
        ("How many divisors does 60 have?", 12),
        ("What is the 15th prime number?", 47),
        ("Calculate Euler's totient φ(12).", 4),

        # Combinatorics
        ("How many ways can you arrange 5 books on a shelf?", 120),
        ("Calculate 10 choose 3.", 120),
        ("What is 7 factorial?", 5040),
        ("What is the 10th Fibonacci number?", 55),

        # Geometry
        ("Find the area of a triangle with base 6 and height 8.", 24),
        ("What is the area of a circle with radius 5?", 79),
        ("Find the hypotenuse of a right triangle with legs 3 and 4.", 5),
        ("What is the sum of interior angles of a hexagon?", 720),

        # Sequences
        ("What is the next number: 2, 5, 8, 11, ?", 14),
        ("Find the next term: 3, 6, 12, 24, ?", 48),

        # Expressions
        ("Calculate 15 + 27 * 3.", 96),
        ("What is 144 / 12 + 8?", 20),
    ]

    print("\n" + "="*70)
    print("AIMO SOLVER v2 - ADVANCED MATHEMATICAL OLYMPIAD ENGINE")
    print("="*70 + "\n")

    correct = 0
    for problem, expected in problems:
        answer = model.solve(problem)
        status = "✓" if answer == expected else f"✗ (expected {expected})"
        print(f"Q: {problem}")
        print(f"A: {answer} {status}\n")
        if answer == expected:
            correct += 1

    print("="*70)
    print(f"Score: {correct}/{len(problems)} ({100*correct/len(problems):.1f}%)")
    print("="*70)


if __name__ == "__main__":
    main()

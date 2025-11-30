#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                     PHOENIX PROTOCOL - TOP FLIGHT SECURITY                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  "From the ashes, we rise. Every failure is fuel for resurrection."          ║
║                                                                              ║
║  The Phoenix Protocol implements:                                            ║
║  • ASH_STATE: Graceful failure handling with cooling periods                 ║
║  • RESURRECTION: Automatic recovery with exponential backoff                 ║
║  • IGNITION: Multi-attempt startup sequences                                ║
║  • IMMORTALITY: System never truly dies, only transforms                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import logging
import random
import time
from datetime import datetime
from enum import Enum
from typing import Callable, Any, Optional, Dict, List
from functools import wraps
import traceback

# ============================================================
#  LOGGING SETUP
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(name)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger('PHOENIX')

# ============================================================
#  PHOENIX STATES
# ============================================================

class PhoenixState(Enum):
    DORMANT = "DORMANT"           # Not yet ignited
    IGNITING = "IGNITING"         # Startup sequence
    ALIVE = "ALIVE"               # Fully operational
    ASH_STATE = "ASH_STATE"       # Failed, cooling down
    RESURRECTING = "RESURRECTING" # Coming back to life
    REBORN = "REBORN"             # Successfully recovered
    ETERNAL_REST = "ETERNAL_REST" # Max attempts exceeded (rare)


# ============================================================
#  PHOENIX CONFIGURATION
# ============================================================

class PhoenixConfig:
    """Configuration for Phoenix Protocol behavior"""

    def __init__(
        self,
        max_ignitions: int = 3,
        base_cooldown: float = 3.0,
        max_cooldown: float = 60.0,
        cooldown_multiplier: float = 2.0,
        jitter_range: float = 0.5,
        resurrection_callback: Optional[Callable] = None,
        death_callback: Optional[Callable] = None
    ):
        self.max_ignitions = max_ignitions
        self.base_cooldown = base_cooldown
        self.max_cooldown = max_cooldown
        self.cooldown_multiplier = cooldown_multiplier
        self.jitter_range = jitter_range
        self.resurrection_callback = resurrection_callback
        self.death_callback = death_callback


# ============================================================
#  ASH STATE - Failure Container
# ============================================================

class AshState:
    """
    The Ash State represents the remains after a failure.
    It holds the memory of what went wrong and the fuel for resurrection.
    """

    def __init__(self, error: Exception, attempt: int, context: Dict = None):
        self.error = error
        self.error_type = type(error).__name__
        self.error_message = str(error)
        self.traceback = traceback.format_exc()
        self.attempt = attempt
        self.timestamp = datetime.now()
        self.context = context or {}

        # Classify the error for smarter resurrection
        self.is_transient = self._classify_error()

    def _classify_error(self) -> bool:
        """Determine if error is likely transient (worth retrying)"""
        transient_indicators = [
            'timeout', 'connection', 'rate limit', 'temporary',
            'retry', '429', '503', '502', 'unavailable', 'overloaded',
            'handshake', 'reset', 'refused', 'network'
        ]
        error_lower = self.error_message.lower()
        return any(ind in error_lower for ind in transient_indicators)

    def __str__(self):
        return f"AshState(error={self.error_type}: {self.error_message}, attempt={self.attempt})"


# ============================================================
#  PHOENIX - The Core Protocol
# ============================================================

class Phoenix:
    """
    The Phoenix Protocol - Self-healing system wrapper

    Wraps any operation with automatic failure recovery,
    exponential backoff, and resurrection capabilities.
    """

    def __init__(self, name: str, config: PhoenixConfig = None):
        self.name = name
        self.config = config or PhoenixConfig()
        self.state = PhoenixState.DORMANT
        self.attempt = 0
        self.total_resurrections = 0
        self.ash_history: List[AshState] = []
        self.logger = logging.getLogger(f'TopFlight_Phoenix')

        # Metrics
        self.metrics = {
            'total_ignitions': 0,
            'successful_ignitions': 0,
            'total_ash_states': 0,
            'total_resurrections': 0,
            'total_cooldown_time': 0.0
        }

    def _calculate_cooldown(self, attempt: int) -> float:
        """Calculate cooldown with exponential backoff + jitter"""
        base = self.config.base_cooldown * (self.config.cooldown_multiplier ** attempt)
        cooldown = min(base, self.config.max_cooldown)

        # Add jitter to prevent thundering herd
        jitter = random.uniform(-self.config.jitter_range, self.config.jitter_range)
        cooldown = max(0.1, cooldown + (cooldown * jitter))

        return round(cooldown, 2)

    def _enter_ash_state(self, error: Exception, context: Dict = None):
        """Enter the Ash State after failure"""
        self.state = PhoenixState.ASH_STATE
        ash = AshState(error, self.attempt, context)
        self.ash_history.append(ash)
        self.metrics['total_ash_states'] += 1

        self.logger.warning(
            f"⚠️ FAILURE DETECTED. ENTERING ASH_STATE. "
            f"Error: {ash.error_message}"
        )

        return ash

    def _resurrect(self) -> bool:
        """Attempt resurrection from Ash State"""
        self.state = PhoenixState.RESURRECTING
        self.total_resurrections += 1
        self.metrics['total_resurrections'] += 1

        if self.config.resurrection_callback:
            try:
                self.config.resurrection_callback(self.ash_history[-1])
            except Exception as e:
                self.logger.error(f"Resurrection callback failed: {e}")

        return True

    async def ignite_async(self, operation: Callable, *args, **kwargs) -> Any:
        """
        Async ignition sequence with automatic resurrection

        Args:
            operation: The async function to execute
            *args, **kwargs: Arguments to pass to the operation

        Returns:
            The result of the operation if successful

        Raises:
            Exception: If all ignition attempts fail
        """
        self.attempt = 0
        last_error = None

        while self.attempt < self.config.max_ignitions:
            self.attempt += 1
            self.metrics['total_ignitions'] += 1

            logger.info(f"🔥 IGNITION SEQUENCE {self.attempt}/{self.config.max_ignitions} INITIATED...")
            self.state = PhoenixState.IGNITING

            try:
                # Execute the operation
                if asyncio.iscoroutinefunction(operation):
                    result = await operation(*args, **kwargs)
                else:
                    result = operation(*args, **kwargs)

                # Success!
                self.state = PhoenixState.ALIVE if self.attempt == 1 else PhoenixState.REBORN
                self.metrics['successful_ignitions'] += 1

                if self.state == PhoenixState.REBORN:
                    self.logger.info(
                        f"🦅 STATUS: REBORN. System recovered after {self.attempt} attempts. "
                        f"RESULT: {result}"
                    )
                else:
                    self.logger.info(f"✅ IGNITION SUCCESSFUL. STATUS: ALIVE")

                return result

            except Exception as e:
                last_error = e
                ash = self._enter_ash_state(e, {'args': args, 'kwargs': kwargs})

                # Check if we should retry
                if self.attempt < self.config.max_ignitions:
                    cooldown = self._calculate_cooldown(self.attempt - 1)
                    self.metrics['total_cooldown_time'] += cooldown

                    self.logger.info(
                        f"⏳ Cooling down for {cooldown}s before next Ignition..."
                    )

                    await asyncio.sleep(cooldown)
                    self._resurrect()

        # All attempts exhausted
        self.state = PhoenixState.ETERNAL_REST

        if self.config.death_callback:
            self.config.death_callback(self.ash_history)

        self.logger.error(
            f"💀 ETERNAL REST. All {self.config.max_ignitions} ignition attempts failed. "
            f"Final error: {last_error}"
        )

        raise last_error

    def ignite(self, operation: Callable, *args, **kwargs) -> Any:
        """
        Synchronous ignition sequence with automatic resurrection
        """
        self.attempt = 0
        last_error = None

        while self.attempt < self.config.max_ignitions:
            self.attempt += 1
            self.metrics['total_ignitions'] += 1

            logger.info(f"🔥 IGNITION SEQUENCE {self.attempt}/{self.config.max_ignitions} INITIATED...")
            self.state = PhoenixState.IGNITING

            try:
                result = operation(*args, **kwargs)

                # Success!
                self.state = PhoenixState.ALIVE if self.attempt == 1 else PhoenixState.REBORN
                self.metrics['successful_ignitions'] += 1

                if self.state == PhoenixState.REBORN:
                    self.logger.info(
                        f"🦅 STATUS: REBORN. System recovered after {self.attempt} attempts. "
                        f"RESULT: {result}"
                    )
                else:
                    self.logger.info(f"✅ IGNITION SUCCESSFUL. STATUS: ALIVE")

                return result

            except Exception as e:
                last_error = e
                ash = self._enter_ash_state(e, {'args': args, 'kwargs': kwargs})

                if self.attempt < self.config.max_ignitions:
                    cooldown = self._calculate_cooldown(self.attempt - 1)
                    self.metrics['total_cooldown_time'] += cooldown

                    self.logger.info(
                        f"⏳ Cooling down for {cooldown}s before next Ignition..."
                    )

                    time.sleep(cooldown)
                    self._resurrect()

        # All attempts exhausted
        self.state = PhoenixState.ETERNAL_REST

        if self.config.death_callback:
            self.config.death_callback(self.ash_history)

        self.logger.error(
            f"💀 ETERNAL REST. All {self.config.max_ignitions} ignition attempts failed."
        )

        raise last_error

    def get_metrics(self) -> Dict:
        """Get Phoenix Protocol metrics"""
        return {
            **self.metrics,
            'current_state': self.state.value,
            'ash_history_count': len(self.ash_history),
            'success_rate': (
                self.metrics['successful_ignitions'] / max(1, self.metrics['total_ignitions'])
            ) * 100
        }


# ============================================================
#  DECORATOR - Easy Integration
# ============================================================

def phoenix_wrapped(
    max_ignitions: int = 3,
    base_cooldown: float = 3.0,
    name: str = None
):
    """
    Decorator to wrap any function with Phoenix Protocol

    Usage:
        @phoenix_wrapped(max_ignitions=3)
        async def my_risky_operation():
            ...
    """
    def decorator(func):
        phoenix_name = name or func.__name__
        config = PhoenixConfig(
            max_ignitions=max_ignitions,
            base_cooldown=base_cooldown
        )
        phoenix = Phoenix(phoenix_name, config)

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            return await phoenix.ignite_async(func, *args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            return phoenix.ignite(func, *args, **kwargs)

        if asyncio.iscoroutinefunction(func):
            async_wrapper.phoenix = phoenix
            return async_wrapper
        else:
            sync_wrapper.phoenix = phoenix
            return sync_wrapper

    return decorator


# ============================================================
#  TOP FLIGHT SECURITY TEST
# ============================================================

def simulate_top_flight_operation():
    """
    Simulates a Top Flight Security operation that may fail.
    First 2 attempts fail, third succeeds.
    """
    # Use a mutable default to track attempts across calls
    if not hasattr(simulate_top_flight_operation, 'call_count'):
        simulate_top_flight_operation.call_count = 0

    simulate_top_flight_operation.call_count += 1

    if simulate_top_flight_operation.call_count < 3:
        errors = [
            "VPN Handshake Fractured",
            "Connection Reset by Peer",
            "Rate Limit Exceeded (429)"
        ]
        raise ConnectionError(random.choice(errors))

    # Reset for next test run
    simulate_top_flight_operation.call_count = 0
    return "SECURE TUNNEL ESTABLISHED"


# ============================================================
#  MAIN - TEST SEQUENCE
# ============================================================

if __name__ == "__main__":
    logger.info("--- INITIATING TOP FLIGHT SECURITY TEST ---")

    # Create Phoenix with configuration
    config = PhoenixConfig(
        max_ignitions=3,
        base_cooldown=3.0,
        cooldown_multiplier=1.5,
        jitter_range=0.1
    )

    phoenix = Phoenix("TopFlightSecurity", config)

    try:
        # Ignite the operation
        result = phoenix.ignite(simulate_top_flight_operation)

        print("\n" + "="*60)
        print("🔥 PHOENIX PROTOCOL TEST COMPLETE 🔥")
        print("="*60)
        print(f"Final State: {phoenix.state.value}")
        print(f"Total Attempts: {phoenix.attempt}")
        print(f"Resurrections: {phoenix.total_resurrections}")
        print(f"Metrics: {phoenix.get_metrics()}")
        print("="*60)

    except Exception as e:
        print(f"\n❌ All ignition attempts failed: {e}")
        print(f"Ash History: {len(phoenix.ash_history)} failures recorded")

"""
RITUAL SCHEDULER - Cron-like scheduling with AI optimization

Features:
- Cron expression parsing
- Event-driven triggers
- Adaptive timing based on past outcomes
- Priority queue management
- Cooldown enforcement
"""
import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from enum import Enum
import heapq

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# CRON PARSER
# ═══════════════════════════════════════════════════════════════════════════

class CronField:
    """Parse a single cron field"""

    def __init__(self, field: str, min_val: int, max_val: int):
        self.values = set()
        self._parse(field, min_val, max_val)

    def _parse(self, field: str, min_val: int, max_val: int):
        """Parse cron field syntax"""
        if field == "*":
            self.values = set(range(min_val, max_val + 1))
            return

        for part in field.split(","):
            if "/" in part:
                # Step values: */5 or 0-30/5
                range_part, step = part.split("/")
                step = int(step)
                if range_part == "*":
                    start, end = min_val, max_val
                elif "-" in range_part:
                    start, end = map(int, range_part.split("-"))
                else:
                    start = int(range_part)
                    end = max_val
                self.values.update(range(start, end + 1, step))

            elif "-" in part:
                # Range: 1-5
                start, end = map(int, part.split("-"))
                self.values.update(range(start, end + 1))

            else:
                # Single value
                self.values.add(int(part))

    def matches(self, value: int) -> bool:
        return value in self.values


class CronExpression:
    """Parse and evaluate cron expressions"""

    def __init__(self, expression: str):
        """
        Cron format: minute hour day_of_month month day_of_week
        Examples:
            "0 * * * *"      - Every hour
            "*/5 * * * *"    - Every 5 minutes
            "0 3 * * *"      - Daily at 3 AM
            "0 0 25 12 *"    - Dec 25 at midnight
        """
        parts = expression.strip().split()
        if len(parts) != 5:
            raise ValueError(f"Invalid cron expression: {expression}")

        self.minute = CronField(parts[0], 0, 59)
        self.hour = CronField(parts[1], 0, 23)
        self.day_of_month = CronField(parts[2], 1, 31)
        self.month = CronField(parts[3], 1, 12)
        self.day_of_week = CronField(parts[4], 0, 6)  # 0 = Sunday
        self.expression = expression

    def matches(self, dt: datetime) -> bool:
        """Check if datetime matches cron expression"""
        return (
            self.minute.matches(dt.minute) and
            self.hour.matches(dt.hour) and
            self.day_of_month.matches(dt.day) and
            self.month.matches(dt.month) and
            self.day_of_week.matches(dt.weekday())
        )

    def next_run(self, after: datetime = None) -> datetime:
        """Calculate next run time after given datetime"""
        if after is None:
            after = datetime.utcnow()

        # Start from next minute
        candidate = after.replace(second=0, microsecond=0) + timedelta(minutes=1)

        # Search up to 1 year ahead
        max_iterations = 525600  # minutes in a year
        for _ in range(max_iterations):
            if self.matches(candidate):
                return candidate
            candidate += timedelta(minutes=1)

        raise ValueError(f"No valid time found for cron: {self.expression}")


# ═══════════════════════════════════════════════════════════════════════════
# SCHEDULED TASK
# ═══════════════════════════════════════════════════════════════════════════

@dataclass(order=True)
class ScheduledTask:
    """A task scheduled for execution"""
    run_at: datetime
    priority: int = field(compare=False)
    ritual_id: str = field(compare=False)
    context: Dict[str, Any] = field(default_factory=dict, compare=False)
    execution_count: int = field(default=0, compare=False)
    last_duration: Optional[float] = field(default=None, compare=False)
    last_status: Optional[str] = field(default=None, compare=False)


# ═══════════════════════════════════════════════════════════════════════════
# RITUAL SCHEDULER
# ═══════════════════════════════════════════════════════════════════════════

class RitualScheduler:
    """
    Manages ritual scheduling with:
    - Cron-based timing
    - Priority queue
    - Cooldown enforcement
    - AI-driven timing optimization
    """

    # Priority mappings (lower = higher priority)
    PRIORITY_MAP = {
        "critical": 0,
        "high": 1,
        "normal": 2,
        "low": 3,
        "background": 4
    }

    def __init__(self):
        self.task_queue: List[ScheduledTask] = []  # Min-heap by run_at
        self.cron_schedules: Dict[str, CronExpression] = {}
        self.cooldowns: Dict[str, datetime] = {}
        self.ritual_stats: Dict[str, Dict] = {}
        self.running = False
        self._task: Optional[asyncio.Task] = None

    def schedule_cron(
        self,
        ritual_id: str,
        cron_expr: str,
        priority: str = "normal",
        context: Dict[str, Any] = None
    ) -> datetime:
        """Schedule a ritual with cron expression"""
        cron = CronExpression(cron_expr)
        self.cron_schedules[ritual_id] = cron

        next_run = cron.next_run()
        task = ScheduledTask(
            run_at=next_run,
            priority=self.PRIORITY_MAP.get(priority, 2),
            ritual_id=ritual_id,
            context=context or {}
        )
        heapq.heappush(self.task_queue, task)

        logger.info(f"Scheduled {ritual_id} with cron '{cron_expr}', next run: {next_run}")
        return next_run

    def schedule_once(
        self,
        ritual_id: str,
        run_at: datetime,
        priority: str = "normal",
        context: Dict[str, Any] = None
    ) -> None:
        """Schedule a one-time ritual execution"""
        task = ScheduledTask(
            run_at=run_at,
            priority=self.PRIORITY_MAP.get(priority, 2),
            ritual_id=ritual_id,
            context=context or {}
        )
        heapq.heappush(self.task_queue, task)
        logger.info(f"Scheduled one-time {ritual_id} for {run_at}")

    def schedule_after(
        self,
        ritual_id: str,
        delay_seconds: int,
        priority: str = "normal",
        context: Dict[str, Any] = None
    ) -> datetime:
        """Schedule a ritual to run after a delay"""
        run_at = datetime.utcnow() + timedelta(seconds=delay_seconds)
        self.schedule_once(ritual_id, run_at, priority, context)
        return run_at

    def check_cooldown(self, ritual_id: str, cooldown_seconds: int) -> bool:
        """Check if ritual is in cooldown period"""
        if cooldown_seconds <= 0:
            return True  # No cooldown

        last_run = self.cooldowns.get(ritual_id)
        if last_run is None:
            return True  # Never run before

        elapsed = (datetime.utcnow() - last_run).total_seconds()
        return elapsed >= cooldown_seconds

    def record_execution(
        self,
        ritual_id: str,
        duration: float,
        status: str
    ) -> None:
        """Record execution for stats and cooldown"""
        self.cooldowns[ritual_id] = datetime.utcnow()

        if ritual_id not in self.ritual_stats:
            self.ritual_stats[ritual_id] = {
                "executions": 0,
                "successes": 0,
                "failures": 0,
                "total_duration": 0.0,
                "avg_duration": 0.0
            }

        stats = self.ritual_stats[ritual_id]
        stats["executions"] += 1
        stats["total_duration"] += duration
        stats["avg_duration"] = stats["total_duration"] / stats["executions"]

        if status == "completed":
            stats["successes"] += 1
        else:
            stats["failures"] += 1

    def get_next_tasks(self, count: int = 10) -> List[ScheduledTask]:
        """Peek at upcoming tasks without removing them"""
        return sorted(self.task_queue)[:count]

    def pop_due_tasks(self) -> List[ScheduledTask]:
        """Get all tasks that are due to run"""
        now = datetime.utcnow()
        due = []

        while self.task_queue and self.task_queue[0].run_at <= now:
            task = heapq.heappop(self.task_queue)
            due.append(task)

        # Sort by priority (lower = higher priority)
        due.sort(key=lambda t: (t.priority, t.run_at))
        return due

    async def run_loop(
        self,
        execute_callback: Callable[[str, Dict[str, Any]], Any],
        check_interval: float = 1.0
    ):
        """Main scheduler loop"""
        self.running = True
        logger.info("Ritual scheduler started")

        while self.running:
            try:
                due_tasks = self.pop_due_tasks()

                for task in due_tasks:
                    logger.info(f"Executing scheduled ritual: {task.ritual_id}")
                    start = datetime.utcnow()

                    try:
                        await execute_callback(task.ritual_id, task.context)
                        status = "completed"
                    except Exception as e:
                        logger.error(f"Scheduled ritual failed: {task.ritual_id} - {e}")
                        status = "failed"

                    duration = (datetime.utcnow() - start).total_seconds()
                    self.record_execution(task.ritual_id, duration, status)

                    # Re-schedule if cron
                    if task.ritual_id in self.cron_schedules:
                        cron = self.cron_schedules[task.ritual_id]
                        next_run = cron.next_run()
                        new_task = ScheduledTask(
                            run_at=next_run,
                            priority=task.priority,
                            ritual_id=task.ritual_id,
                            context=task.context,
                            execution_count=task.execution_count + 1,
                            last_duration=duration,
                            last_status=status
                        )
                        heapq.heappush(self.task_queue, new_task)

                await asyncio.sleep(check_interval)

            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                await asyncio.sleep(check_interval)

    def stop(self):
        """Stop the scheduler loop"""
        self.running = False
        if self._task:
            self._task.cancel()

    def get_stats(self) -> Dict[str, Any]:
        """Get scheduler statistics"""
        return {
            "queue_size": len(self.task_queue),
            "cron_schedules": len(self.cron_schedules),
            "ritual_stats": self.ritual_stats,
            "next_task": self.task_queue[0].ritual_id if self.task_queue else None,
            "next_run": self.task_queue[0].run_at.isoformat() if self.task_queue else None
        }


# ═══════════════════════════════════════════════════════════════════════════
# AI TIMING OPTIMIZER
# ═══════════════════════════════════════════════════════════════════════════

class TimingOptimizer:
    """
    AI-driven timing optimization based on:
    - Historical execution patterns
    - System load correlation
    - Success rate by time of day
    - User activity patterns
    """

    def __init__(self, scheduler: RitualScheduler):
        self.scheduler = scheduler
        self.load_history: List[Dict] = []
        self.timing_scores: Dict[str, Dict[int, float]] = {}  # ritual_id -> hour -> score

    def record_load(self, cpu: float, memory: float, queue_depth: int):
        """Record system load for correlation"""
        self.load_history.append({
            "timestamp": datetime.utcnow(),
            "cpu": cpu,
            "memory": memory,
            "queue_depth": queue_depth
        })
        # Keep last 24 hours
        cutoff = datetime.utcnow() - timedelta(hours=24)
        self.load_history = [l for l in self.load_history if l["timestamp"] > cutoff]

    def analyze_optimal_time(self, ritual_id: str) -> Optional[int]:
        """
        Analyze historical data to find optimal hour for ritual.
        Returns hour (0-23) or None if not enough data.
        """
        stats = self.scheduler.ritual_stats.get(ritual_id)
        if not stats or stats["executions"] < 10:
            return None  # Not enough data

        # Simple heuristic: avoid high-load hours
        # In production, use proper ML model
        load_by_hour = {}
        for record in self.load_history:
            hour = record["timestamp"].hour
            if hour not in load_by_hour:
                load_by_hour[hour] = []
            load_by_hour[hour].append(record["cpu"])

        if not load_by_hour:
            return None

        # Find lowest average load hour
        avg_load = {h: sum(loads) / len(loads) for h, loads in load_by_hour.items()}
        optimal_hour = min(avg_load, key=avg_load.get)

        return optimal_hour

    def suggest_adjustment(
        self,
        ritual_id: str,
        current_cron: str
    ) -> Optional[str]:
        """Suggest cron adjustment based on optimization"""
        optimal_hour = self.analyze_optimal_time(ritual_id)
        if optimal_hour is None:
            return None

        # Parse current cron
        parts = current_cron.split()
        current_hour = parts[1]

        # Only suggest if significantly different
        if current_hour != "*" and abs(int(current_hour) - optimal_hour) < 2:
            return None

        # Suggest new cron
        parts[1] = str(optimal_hour)
        new_cron = " ".join(parts)

        logger.info(f"Suggesting timing adjustment for {ritual_id}: {current_cron} -> {new_cron}")
        return new_cron


# ═══════════════════════════════════════════════════════════════════════════
# GLOBAL SCHEDULER INSTANCE
# ═══════════════════════════════════════════════════════════════════════════

scheduler = RitualScheduler()
optimizer = TimingOptimizer(scheduler)

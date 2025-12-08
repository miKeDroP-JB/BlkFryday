"""
Production-Ready Observability - THE SENTINELS
Phase 14: Real-time observability for the entire nervous system

Components:
- OpenTelemetry tracing
- Prometheus metrics
- Structured logging
- Custom dashboards
"""
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from functools import wraps
from contextlib import contextmanager
import threading

# Try to import telemetry libraries
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    OTEL_AVAILABLE = True
except ImportError:
    OTEL_AVAILABLE = False

try:
    from prometheus_client import Counter, Histogram, Gauge, Info
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False


logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "service": "%(name)s", "message": "%(message)s"}',
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
# Metrics Definitions
# ═══════════════════════════════════════════════════════════════

@dataclass
class MetricValue:
    """Container for metric values"""
    name: str
    value: float
    labels: Dict[str, str] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class FractalMetrics:
    """
    Central metrics collection for Fractal Memory Engine.
    Works with or without Prometheus.
    """

    def __init__(self, service_name: str = "fractal-memory"):
        self.service_name = service_name
        self._local_metrics: Dict[str, list] = {}
        self._lock = threading.Lock()

        # Initialize Prometheus metrics if available
        if PROMETHEUS_AVAILABLE:
            self._init_prometheus_metrics()
        else:
            self._prometheus_metrics = {}

    def _init_prometheus_metrics(self):
        """Initialize Prometheus metric collectors"""

        # Latency metrics
        self.message_latency = Histogram(
            'fractal_message_latency_seconds',
            'Total message processing latency',
            ['service', 'avatar', 'status'],
            buckets=[.01, .025, .05, .1, .25, .5, 1, 2.5, 5, 10]
        )

        self.engine_latency = Histogram(
            'fractal_engine_latency_seconds',
            'Individual engine processing latency',
            ['engine', 'status'],
            buckets=[.005, .01, .025, .05, .1, .25, .5, 1]
        )

        # Counter metrics
        self.rule_engine_firings = Counter(
            'fractal_rule_engine_firings_total',
            'Number of rule engine rule firings',
            ['rule_type', 'outcome']
        )

        self.llm_inference_calls = Counter(
            'fractal_llm_inference_calls_total',
            'Number of LLM inference calls',
            ['provider', 'model', 'status']
        )

        self.insight_applications = Counter(
            'fractal_insight_applications_total',
            'Number of insights applied to memory',
            ['source', 'status']
        )

        self.resonance_triggers = Counter(
            'fractal_resonance_triggers_total',
            'Number of resonance triggers activated',
            ['avatar', 'trigger_type']
        )

        self.avatar_filter_usage = Counter(
            'fractal_avatar_filter_usage_total',
            'Avatar filter profile usage',
            ['avatar_type', 'collection']
        )

        self.memory_decay_events = Counter(
            'fractal_memory_decay_events_total',
            'Memory decay/prune events',
            ['event_type']
        )

        self.auth_events = Counter(
            'fractal_auth_events_total',
            'Authentication events',
            ['event_type', 'status']
        )

        # Gauge metrics
        self.active_users = Gauge(
            'fractal_active_users',
            'Number of active users',
            ['timeframe']
        )

        self.queue_depth = Gauge(
            'fractal_queue_depth',
            'Current queue depth',
            ['queue_name', 'priority']
        )

        self.cache_hit_ratio = Gauge(
            'fractal_cache_hit_ratio',
            'Edge cache hit ratio',
            ['cache_type']
        )

        # Info metric
        self.service_info = Info(
            'fractal_service',
            'Service information'
        )
        self.service_info.info({
            'service': self.service_name,
            'version': '2.0.0',
        })

    # ─────────────────────────────────────────────────────────────
    # Recording Methods
    # ─────────────────────────────────────────────────────────────

    def record_message_latency(
        self,
        latency_seconds: float,
        service: str,
        avatar: str,
        status: str,
    ):
        """Record message processing latency"""
        if PROMETHEUS_AVAILABLE:
            self.message_latency.labels(
                service=service,
                avatar=avatar,
                status=status
            ).observe(latency_seconds)

        self._store_local("message_latency", MetricValue(
            name="message_latency",
            value=latency_seconds,
            labels={"service": service, "avatar": avatar, "status": status}
        ))

    def record_engine_latency(
        self,
        latency_seconds: float,
        engine: str,
        status: str,
    ):
        """Record individual engine latency"""
        if PROMETHEUS_AVAILABLE:
            self.engine_latency.labels(
                engine=engine,
                status=status
            ).observe(latency_seconds)

        self._store_local("engine_latency", MetricValue(
            name="engine_latency",
            value=latency_seconds,
            labels={"engine": engine, "status": status}
        ))

    def record_rule_firing(self, rule_type: str, outcome: str):
        """Record rule engine firing"""
        if PROMETHEUS_AVAILABLE:
            self.rule_engine_firings.labels(
                rule_type=rule_type,
                outcome=outcome
            ).inc()

        self._store_local("rule_firings", MetricValue(
            name="rule_firings",
            value=1,
            labels={"rule_type": rule_type, "outcome": outcome}
        ))

    def record_llm_call(self, provider: str, model: str, status: str):
        """Record LLM inference call"""
        if PROMETHEUS_AVAILABLE:
            self.llm_inference_calls.labels(
                provider=provider,
                model=model,
                status=status
            ).inc()

        self._store_local("llm_calls", MetricValue(
            name="llm_calls",
            value=1,
            labels={"provider": provider, "model": model, "status": status}
        ))

    def record_insight_applied(self, source: str, status: str):
        """Record insight application"""
        if PROMETHEUS_AVAILABLE:
            self.insight_applications.labels(
                source=source,
                status=status
            ).inc()

        self._store_local("insight_applications", MetricValue(
            name="insight_applications",
            value=1,
            labels={"source": source, "status": status}
        ))

    def record_resonance_trigger(self, avatar: str, trigger_type: str):
        """Record resonance trigger"""
        if PROMETHEUS_AVAILABLE:
            self.resonance_triggers.labels(
                avatar=avatar,
                trigger_type=trigger_type
            ).inc()

    def record_avatar_filter_usage(self, avatar_type: str, collection: str):
        """Record avatar filter profile usage"""
        if PROMETHEUS_AVAILABLE:
            self.avatar_filter_usage.labels(
                avatar_type=avatar_type,
                collection=collection
            ).inc()

    def record_memory_decay(self, event_type: str):
        """Record memory decay event"""
        if PROMETHEUS_AVAILABLE:
            self.memory_decay_events.labels(
                event_type=event_type
            ).inc()

    def record_auth_event(self, event_type: str, status: str):
        """Record auth event"""
        if PROMETHEUS_AVAILABLE:
            self.auth_events.labels(
                event_type=event_type,
                status=status
            ).inc()

    def set_active_users(self, count: int, timeframe: str = "1h"):
        """Set active users gauge"""
        if PROMETHEUS_AVAILABLE:
            self.active_users.labels(timeframe=timeframe).set(count)

    def set_queue_depth(self, depth: int, queue_name: str, priority: str):
        """Set queue depth gauge"""
        if PROMETHEUS_AVAILABLE:
            self.queue_depth.labels(
                queue_name=queue_name,
                priority=priority
            ).set(depth)

    def set_cache_hit_ratio(self, ratio: float, cache_type: str):
        """Set cache hit ratio"""
        if PROMETHEUS_AVAILABLE:
            self.cache_hit_ratio.labels(cache_type=cache_type).set(ratio)

    def _store_local(self, metric_name: str, value: MetricValue):
        """Store metric locally for non-Prometheus environments"""
        with self._lock:
            if metric_name not in self._local_metrics:
                self._local_metrics[metric_name] = []
            self._local_metrics[metric_name].append(value)
            # Keep last 1000 values
            if len(self._local_metrics[metric_name]) > 1000:
                self._local_metrics[metric_name] = self._local_metrics[metric_name][-1000:]

    def get_local_metrics(self) -> Dict[str, list]:
        """Get locally stored metrics"""
        with self._lock:
            return dict(self._local_metrics)

    # ─────────────────────────────────────────────────────────────
    # Decorators
    # ─────────────────────────────────────────────────────────────

    def timed(self, engine_name: str):
        """Decorator to time function execution"""
        def decorator(func: Callable):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start = time.time()
                status = "success"
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    status = "error"
                    raise
                finally:
                    self.record_engine_latency(
                        time.time() - start,
                        engine_name,
                        status
                    )

            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                start = time.time()
                status = "success"
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    status = "error"
                    raise
                finally:
                    self.record_engine_latency(
                        time.time() - start,
                        engine_name,
                        status
                    )

            import asyncio
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            return sync_wrapper
        return decorator

    @contextmanager
    def trace_operation(self, operation_name: str, attributes: Dict[str, Any] = None):
        """Context manager for tracing operations"""
        start = time.time()
        status = "success"

        try:
            yield
        except Exception as e:
            status = "error"
            raise
        finally:
            duration = time.time() - start
            self.record_engine_latency(duration, operation_name, status)

            # Log structured trace
            logger.info(f"operation={operation_name} duration_ms={duration*1000:.2f} status={status}")


# ═══════════════════════════════════════════════════════════════
# Tracing
# ═══════════════════════════════════════════════════════════════

class FractalTracer:
    """OpenTelemetry tracing wrapper"""

    def __init__(self, service_name: str = "fractal-memory"):
        self.service_name = service_name
        self._tracer = None

        if OTEL_AVAILABLE:
            provider = TracerProvider()
            trace.set_tracer_provider(provider)
            self._tracer = trace.get_tracer(service_name)

    def start_span(self, name: str, attributes: Dict[str, Any] = None):
        """Start a new trace span"""
        if self._tracer:
            return self._tracer.start_span(name, attributes=attributes)
        return DummySpan(name)

    @contextmanager
    def span(self, name: str, attributes: Dict[str, Any] = None):
        """Context manager for spans"""
        span = self.start_span(name, attributes)
        try:
            yield span
        except Exception as e:
            if hasattr(span, 'record_exception'):
                span.record_exception(e)
            raise
        finally:
            if hasattr(span, 'end'):
                span.end()


class DummySpan:
    """Dummy span for when OpenTelemetry is not available"""
    def __init__(self, name: str):
        self.name = name

    def end(self):
        pass

    def set_attribute(self, key: str, value: Any):
        pass

    def record_exception(self, exception: Exception):
        pass


# ═══════════════════════════════════════════════════════════════
# Dashboard Data
# ═══════════════════════════════════════════════════════════════

class DashboardData:
    """Aggregates data for custom dashboards"""

    def __init__(self, metrics: FractalMetrics):
        self.metrics = metrics

    def get_memory_mutation_data(self) -> Dict[str, Any]:
        """Get memory mutation dashboard data"""
        local = self.metrics.get_local_metrics()
        return {
            "insight_applications": len(local.get("insight_applications", [])),
            "memory_decays": len(local.get("memory_decay", [])),
            "recent_insights": local.get("insight_applications", [])[-10:],
        }

    def get_avatar_resonance_data(self) -> Dict[str, Any]:
        """Get avatar resonance dashboard data"""
        # Aggregate resonance triggers by avatar
        return {
            "resonance_events": [],
            "filter_usage": {},
        }

    def get_evolve_drift_data(self) -> Dict[str, Any]:
        """Get evolve engine drift detector data"""
        return {
            "drift_detected": False,
            "confidence_distribution": [],
            "decay_events": [],
        }

    def get_pattern_recursion_data(self) -> Dict[str, Any]:
        """Get pattern recursion tracker data"""
        return {
            "recursive_patterns": [],
            "pattern_depth": {},
        }


# ═══════════════════════════════════════════════════════════════
# Global Instances
# ═══════════════════════════════════════════════════════════════

# Singleton instances
_metrics: Optional[FractalMetrics] = None
_tracer: Optional[FractalTracer] = None


def get_metrics() -> FractalMetrics:
    global _metrics
    if _metrics is None:
        _metrics = FractalMetrics()
    return _metrics


def get_tracer() -> FractalTracer:
    global _tracer
    if _tracer is None:
        _tracer = FractalTracer()
    return _tracer


def get_dashboard() -> DashboardData:
    return DashboardData(get_metrics())

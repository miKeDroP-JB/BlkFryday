"""
===============================================================================
MODEL ROUTER - "THE CONDUCTOR"

Intelligent model routing with fallback support.
Routes requests to the best available model with graceful degradation.

Priority Order:
1. Sovereign Model (orb-sovereign) - Your fine-tuned model
2. Local Quality (llama3-70b, qwen2-72b) - Large local models
3. Local Balanced (llama3-8b, mixtral) - Medium local models
4. Local Fast (mistral-7b, phi-3) - Small local models
5. External Fallback (optional) - OpenAI/Anthropic as last resort

INTELLIGENT ROUTING. GRACEFUL DEGRADATION.
===============================================================================
"""

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Any, Callable
import hashlib

import httpx
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===============================================================================
# CONFIGURATION
# ===============================================================================

class ProviderType(str, Enum):
    OLLAMA = "ollama"
    VLLM = "vllm"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL_ONNX = "onnx"


class FallbackStrategy(str, Enum):
    STRICT = "strict"           # Never use external - fail if local unavailable
    PREFER_LOCAL = "prefer_local"  # Prefer local, fallback to external
    QUALITY_FIRST = "quality_first"  # Best quality regardless of provider
    SPEED_FIRST = "speed_first"      # Fastest response time


@dataclass
class ProviderConfig:
    """Configuration for a model provider"""
    type: ProviderType
    endpoint: str
    api_key: Optional[str] = None
    models: List[str] = field(default_factory=list)
    timeout: float = 120.0
    max_retries: int = 3
    priority: int = 0  # Lower = higher priority
    enabled: bool = True


@dataclass
class ModelEndpoint:
    """A specific model endpoint"""
    name: str
    provider: ProviderType
    model_id: str
    endpoint: str
    api_key: Optional[str] = None
    priority: int = 0
    healthy: bool = True
    last_check: Optional[datetime] = None
    avg_latency_ms: float = 0.0
    error_count: int = 0
    success_count: int = 0


class RouterConfig(BaseModel):
    """Router configuration"""
    fallback_strategy: FallbackStrategy = FallbackStrategy.PREFER_LOCAL
    health_check_interval: int = 60  # seconds
    max_consecutive_errors: int = 3
    circuit_breaker_timeout: int = 300  # seconds
    enable_external_fallback: bool = False
    external_api_keys: Dict[str, str] = {}


# ===============================================================================
# MODEL ROUTER
# ===============================================================================

class ModelRouter:
    """
    Intelligent model router with health checking and fallback.
    """

    def __init__(self, config: Optional[RouterConfig] = None):
        self.config = config or RouterConfig()
        self.http_client = httpx.AsyncClient(timeout=120.0)
        self.endpoints: Dict[str, ModelEndpoint] = {}
        self.circuit_breakers: Dict[str, datetime] = {}

        # Initialize default endpoints
        self._init_default_endpoints()

    def _init_default_endpoints(self):
        """Initialize default model endpoints"""

        # Sovereign model (highest priority)
        self.register_endpoint(ModelEndpoint(
            name="orb-sovereign",
            provider=ProviderType.OLLAMA,
            model_id="orb-sovereign:latest",
            endpoint="http://localhost:11434",
            priority=0
        ))

        # Quality tier
        self.register_endpoint(ModelEndpoint(
            name="llama3-70b",
            provider=ProviderType.OLLAMA,
            model_id="llama3:70b-instruct-q4_K_M",
            endpoint="http://localhost:11434",
            priority=10
        ))

        self.register_endpoint(ModelEndpoint(
            name="qwen2-72b",
            provider=ProviderType.OLLAMA,
            model_id="qwen2:72b-instruct-q4_K_M",
            endpoint="http://localhost:11434",
            priority=11
        ))

        # Balanced tier
        self.register_endpoint(ModelEndpoint(
            name="llama3-8b",
            provider=ProviderType.OLLAMA,
            model_id="llama3:8b-instruct-q8_0",
            endpoint="http://localhost:11434",
            priority=20
        ))

        self.register_endpoint(ModelEndpoint(
            name="mixtral-8x7b",
            provider=ProviderType.OLLAMA,
            model_id="mixtral:8x7b-instruct-v0.1-q4_K_M",
            endpoint="http://localhost:11434",
            priority=21
        ))

        # Fast tier
        self.register_endpoint(ModelEndpoint(
            name="mistral-7b",
            provider=ProviderType.OLLAMA,
            model_id="mistral:7b-instruct-v0.2-q4_K_M",
            endpoint="http://localhost:11434",
            priority=30
        ))

        self.register_endpoint(ModelEndpoint(
            name="phi-3",
            provider=ProviderType.OLLAMA,
            model_id="phi3:mini",
            endpoint="http://localhost:11434",
            priority=31
        ))

        # External fallbacks (lowest priority, disabled by default)
        if self.config.enable_external_fallback:
            if "openai" in self.config.external_api_keys:
                self.register_endpoint(ModelEndpoint(
                    name="gpt-4-turbo",
                    provider=ProviderType.OPENAI,
                    model_id="gpt-4-turbo-preview",
                    endpoint="https://api.openai.com/v1",
                    api_key=self.config.external_api_keys.get("openai"),
                    priority=100
                ))

            if "anthropic" in self.config.external_api_keys:
                self.register_endpoint(ModelEndpoint(
                    name="claude-3-sonnet",
                    provider=ProviderType.ANTHROPIC,
                    model_id="claude-3-sonnet-20240229",
                    endpoint="https://api.anthropic.com",
                    api_key=self.config.external_api_keys.get("anthropic"),
                    priority=101
                ))

    def register_endpoint(self, endpoint: ModelEndpoint):
        """Register a model endpoint"""
        self.endpoints[endpoint.name] = endpoint
        logger.info(f"Registered endpoint: {endpoint.name} (priority: {endpoint.priority})")

    def _is_circuit_open(self, endpoint_name: str) -> bool:
        """Check if circuit breaker is open for endpoint"""
        if endpoint_name not in self.circuit_breakers:
            return False

        open_until = self.circuit_breakers[endpoint_name]
        if datetime.now() > open_until:
            del self.circuit_breakers[endpoint_name]
            return False
        return True

    def _open_circuit(self, endpoint_name: str):
        """Open circuit breaker for endpoint"""
        timeout = timedelta(seconds=self.config.circuit_breaker_timeout)
        self.circuit_breakers[endpoint_name] = datetime.now() + timeout
        logger.warning(f"Circuit breaker opened for {endpoint_name}")

    async def check_endpoint_health(self, endpoint: ModelEndpoint) -> bool:
        """Check if endpoint is healthy"""
        if self._is_circuit_open(endpoint.name):
            return False

        try:
            if endpoint.provider == ProviderType.OLLAMA:
                response = await self.http_client.get(
                    f"{endpoint.endpoint}/api/tags",
                    timeout=5.0
                )
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "") for m in models]
                    available = any(
                        endpoint.model_id.split(":")[0] in name
                        for name in model_names
                    )
                    endpoint.healthy = available
                    endpoint.last_check = datetime.now()
                    return available

            elif endpoint.provider == ProviderType.OPENAI:
                response = await self.http_client.get(
                    f"{endpoint.endpoint}/models",
                    headers={"Authorization": f"Bearer {endpoint.api_key}"},
                    timeout=5.0
                )
                endpoint.healthy = response.status_code == 200
                endpoint.last_check = datetime.now()
                return endpoint.healthy

            elif endpoint.provider == ProviderType.ANTHROPIC:
                # Anthropic doesn't have a models endpoint, check with minimal request
                endpoint.healthy = bool(endpoint.api_key)
                endpoint.last_check = datetime.now()
                return endpoint.healthy

        except Exception as e:
            logger.warning(f"Health check failed for {endpoint.name}: {e}")
            endpoint.healthy = False
            endpoint.error_count += 1

            if endpoint.error_count >= self.config.max_consecutive_errors:
                self._open_circuit(endpoint.name)

        return False

    async def check_all_health(self) -> Dict[str, bool]:
        """Check health of all endpoints"""
        results = {}
        for name, endpoint in self.endpoints.items():
            results[name] = await self.check_endpoint_health(endpoint)
        return results

    def get_available_endpoints(self, strategy: Optional[FallbackStrategy] = None) -> List[ModelEndpoint]:
        """Get available endpoints sorted by strategy"""
        strategy = strategy or self.config.fallback_strategy

        available = [
            ep for ep in self.endpoints.values()
            if ep.healthy and not self._is_circuit_open(ep.name)
        ]

        if strategy == FallbackStrategy.STRICT:
            # Only local providers
            available = [
                ep for ep in available
                if ep.provider in [ProviderType.OLLAMA, ProviderType.VLLM, ProviderType.LOCAL_ONNX]
            ]

        elif strategy == FallbackStrategy.SPEED_FIRST:
            # Sort by latency
            available.sort(key=lambda x: x.avg_latency_ms or float('inf'))
            return available

        # Default: sort by priority
        available.sort(key=lambda x: x.priority)
        return available

    def select_endpoint(
        self,
        preferred_model: Optional[str] = None,
        task_type: Optional[str] = None,
        strategy: Optional[FallbackStrategy] = None
    ) -> Optional[ModelEndpoint]:
        """Select best available endpoint"""

        # Check preferred model first
        if preferred_model and preferred_model in self.endpoints:
            ep = self.endpoints[preferred_model]
            if ep.healthy and not self._is_circuit_open(ep.name):
                return ep

        # Get available endpoints
        available = self.get_available_endpoints(strategy)

        if not available:
            return None

        # Task-based selection (future enhancement)
        if task_type:
            # Could filter by model specialization
            pass

        return available[0]

    async def call_endpoint(
        self,
        endpoint: ModelEndpoint,
        messages: List[Dict],
        max_tokens: int = 2048,
        temperature: float = 0.7,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Call a model endpoint"""
        start_time = time.time()

        try:
            if endpoint.provider == ProviderType.OLLAMA:
                result = await self._call_ollama(endpoint, messages, max_tokens, temperature)

            elif endpoint.provider == ProviderType.OPENAI:
                result = await self._call_openai(endpoint, messages, max_tokens, temperature)

            elif endpoint.provider == ProviderType.ANTHROPIC:
                result = await self._call_anthropic(endpoint, messages, max_tokens, temperature)

            else:
                raise ValueError(f"Unsupported provider: {endpoint.provider}")

            # Track success
            latency = (time.time() - start_time) * 1000
            endpoint.success_count += 1
            endpoint.error_count = 0  # Reset error count on success

            # Update rolling average latency
            if endpoint.avg_latency_ms == 0:
                endpoint.avg_latency_ms = latency
            else:
                endpoint.avg_latency_ms = (endpoint.avg_latency_ms * 0.9) + (latency * 0.1)

            result["latency_ms"] = latency
            result["endpoint"] = endpoint.name
            result["provider"] = endpoint.provider.value

            return result

        except Exception as e:
            endpoint.error_count += 1
            if endpoint.error_count >= self.config.max_consecutive_errors:
                self._open_circuit(endpoint.name)
            raise

    async def _call_ollama(
        self,
        endpoint: ModelEndpoint,
        messages: List[Dict],
        max_tokens: int,
        temperature: float
    ) -> Dict[str, Any]:
        """Call Ollama endpoint"""
        payload = {
            "model": endpoint.model_id,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        response = await self.http_client.post(
            f"{endpoint.endpoint}/api/chat",
            json=payload,
            timeout=120.0
        )
        response.raise_for_status()
        data = response.json()

        return {
            "content": data.get("message", {}).get("content", ""),
            "tokens": data.get("eval_count", 0) + data.get("prompt_eval_count", 0),
            "model": endpoint.model_id
        }

    async def _call_openai(
        self,
        endpoint: ModelEndpoint,
        messages: List[Dict],
        max_tokens: int,
        temperature: float
    ) -> Dict[str, Any]:
        """Call OpenAI endpoint"""
        payload = {
            "model": endpoint.model_id,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        response = await self.http_client.post(
            f"{endpoint.endpoint}/chat/completions",
            json=payload,
            headers={
                "Authorization": f"Bearer {endpoint.api_key}",
                "Content-Type": "application/json"
            },
            timeout=120.0
        )
        response.raise_for_status()
        data = response.json()

        return {
            "content": data["choices"][0]["message"]["content"],
            "tokens": data.get("usage", {}).get("total_tokens", 0),
            "model": endpoint.model_id
        }

    async def _call_anthropic(
        self,
        endpoint: ModelEndpoint,
        messages: List[Dict],
        max_tokens: int,
        temperature: float
    ) -> Dict[str, Any]:
        """Call Anthropic endpoint"""
        # Convert messages to Anthropic format
        system_prompt = ""
        anthropic_messages = []

        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            else:
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        payload = {
            "model": endpoint.model_id,
            "max_tokens": max_tokens,
            "messages": anthropic_messages
        }

        if system_prompt:
            payload["system"] = system_prompt

        response = await self.http_client.post(
            f"{endpoint.endpoint}/v1/messages",
            json=payload,
            headers={
                "x-api-key": endpoint.api_key,
                "Content-Type": "application/json",
                "anthropic-version": "2023-06-01"
            },
            timeout=120.0
        )
        response.raise_for_status()
        data = response.json()

        return {
            "content": data["content"][0]["text"],
            "tokens": data.get("usage", {}).get("input_tokens", 0) + data.get("usage", {}).get("output_tokens", 0),
            "model": endpoint.model_id
        }

    async def route_request(
        self,
        messages: List[Dict],
        preferred_model: Optional[str] = None,
        task_type: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """Route request to best available model with fallback"""

        tried_endpoints = set()
        last_error = None

        for attempt in range(max_retries):
            # Select endpoint (excluding already tried)
            available = self.get_available_endpoints()
            available = [ep for ep in available if ep.name not in tried_endpoints]

            if not available:
                break

            # Try preferred model first on first attempt
            if attempt == 0 and preferred_model:
                endpoint = self.select_endpoint(preferred_model, task_type)
            else:
                endpoint = available[0] if available else None

            if not endpoint:
                break

            tried_endpoints.add(endpoint.name)

            try:
                result = await self.call_endpoint(
                    endpoint,
                    messages,
                    max_tokens,
                    temperature
                )
                result["attempts"] = attempt + 1
                result["tried_endpoints"] = list(tried_endpoints)
                return result

            except Exception as e:
                last_error = e
                logger.warning(f"Endpoint {endpoint.name} failed (attempt {attempt + 1}): {e}")
                continue

        # All retries exhausted
        raise Exception(f"All endpoints failed. Last error: {last_error}")

    def get_status(self) -> Dict[str, Any]:
        """Get router status"""
        return {
            "service": "model-router",
            "codename": "THE CONDUCTOR",
            "strategy": self.config.fallback_strategy.value,
            "external_fallback_enabled": self.config.enable_external_fallback,
            "endpoints": {
                name: {
                    "provider": ep.provider.value,
                    "model": ep.model_id,
                    "healthy": ep.healthy,
                    "priority": ep.priority,
                    "avg_latency_ms": round(ep.avg_latency_ms, 2),
                    "success_count": ep.success_count,
                    "error_count": ep.error_count,
                    "circuit_open": self._is_circuit_open(name)
                }
                for name, ep in self.endpoints.items()
            },
            "circuit_breakers": {
                name: dt.isoformat()
                for name, dt in self.circuit_breakers.items()
            }
        }


# ===============================================================================
# UNIFIED SERVING LAYER
# ===============================================================================

class SovereignServingLayer:
    """
    Unified model serving layer combining inference and routing.
    """

    def __init__(
        self,
        router_config: Optional[RouterConfig] = None,
        knowledge_retention: bool = True
    ):
        self.router = ModelRouter(router_config)
        self.knowledge_retention = knowledge_retention
        self.request_log: List[Dict] = []

    async def initialize(self):
        """Initialize serving layer"""
        logger.info("=" * 60)
        logger.info("SOVEREIGN SERVING LAYER - Initializing")
        logger.info("=" * 60)

        # Check all endpoints
        health = await self.router.check_all_health()

        healthy_count = sum(1 for v in health.values() if v)
        logger.info(f"Available endpoints: {healthy_count}/{len(health)}")

        for name, healthy in health.items():
            status = "OK" if healthy else "UNAVAILABLE"
            logger.info(f"  [{status}] {name}")

    async def generate(
        self,
        messages: List[Dict],
        model: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.7,
        user_id: Optional[str] = None,
        retain: bool = True
    ) -> Dict[str, Any]:
        """Generate completion with intelligent routing"""

        result = await self.router.route_request(
            messages=messages,
            preferred_model=model,
            max_tokens=max_tokens,
            temperature=temperature
        )

        # Log for analysis
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "model_requested": model,
            "model_used": result.get("endpoint"),
            "provider": result.get("provider"),
            "latency_ms": result.get("latency_ms"),
            "tokens": result.get("tokens"),
            "attempts": result.get("attempts", 1)
        }
        self.request_log.append(log_entry)

        # Keep last 1000 entries
        if len(self.request_log) > 1000:
            self.request_log = self.request_log[-1000:]

        return result

    def get_analytics(self) -> Dict[str, Any]:
        """Get serving analytics"""
        if not self.request_log:
            return {"total_requests": 0}

        total = len(self.request_log)
        by_model = {}
        by_provider = {}
        total_latency = 0
        total_tokens = 0

        for entry in self.request_log:
            model = entry.get("model_used", "unknown")
            provider = entry.get("provider", "unknown")

            by_model[model] = by_model.get(model, 0) + 1
            by_provider[provider] = by_provider.get(provider, 0) + 1
            total_latency += entry.get("latency_ms", 0)
            total_tokens += entry.get("tokens", 0)

        return {
            "total_requests": total,
            "avg_latency_ms": round(total_latency / total, 2),
            "total_tokens": total_tokens,
            "by_model": by_model,
            "by_provider": by_provider,
            "fallback_rate": sum(
                1 for e in self.request_log
                if e.get("attempts", 1) > 1
            ) / total * 100
        }


# ===============================================================================
# MAIN
# ===============================================================================

if __name__ == "__main__":
    async def main():
        # Initialize serving layer
        config = RouterConfig(
            fallback_strategy=FallbackStrategy.PREFER_LOCAL,
            enable_external_fallback=False
        )

        serving = SovereignServingLayer(config)
        await serving.initialize()

        print("\n" + "=" * 60)
        print("ROUTER STATUS")
        print("=" * 60)
        print(json.dumps(serving.router.get_status(), indent=2))

    asyncio.run(main())

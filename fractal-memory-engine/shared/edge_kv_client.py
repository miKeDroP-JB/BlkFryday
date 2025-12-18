"""
Edge KV Client (Cloudflare Workers KV)
Provides sub-50ms reads for frequently accessed user profiles
"""
import os
import json
import logging
from typing import Optional, Any, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Try to import requests, fall back to local cache
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    logger.warning("requests not installed, using local cache only")


class LocalKVCache:
    """Local in-memory cache fallback"""

    def __init__(self, default_ttl: int = 3600):
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[str]:
        if key in self._cache:
            value, expires = self._cache[key]
            if datetime.utcnow() < expires:
                return value
            del self._cache[key]
        return None

    def put(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        ttl = ttl or self._default_ttl
        self._cache[key] = (value, datetime.utcnow() + timedelta(seconds=ttl))
        return True

    def delete(self, key: str) -> bool:
        self._cache.pop(key, None)
        return True

    def clear(self):
        self._cache.clear()


class CloudflareKVClient:
    """Cloudflare Workers KV REST API client"""

    def __init__(
        self,
        account_id: Optional[str] = None,
        namespace_id: Optional[str] = None,
        api_token: Optional[str] = None,
    ):
        self.account_id = account_id or os.getenv("CF_ACCOUNT_ID")
        self.namespace_id = namespace_id or os.getenv("CF_KV_NAMESPACE")
        self.api_token = api_token or os.getenv("CF_API_TOKEN")
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/storage/kv/namespaces/{self.namespace_id}"
        self._local_cache = LocalKVCache(default_ttl=60)  # 1 min local cache

    @property
    def is_configured(self) -> bool:
        return all([self.account_id, self.namespace_id, self.api_token])

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

    def get(self, key: str, use_cache: bool = True) -> Optional[str]:
        # Check local cache first
        if use_cache:
            cached = self._local_cache.get(key)
            if cached is not None:
                return cached

        if not self.is_configured or not REQUESTS_AVAILABLE:
            return self._local_cache.get(key)

        try:
            url = f"{self.base_url}/values/{key}"
            response = requests.get(url, headers=self._headers(), timeout=5)

            if response.status_code == 200:
                value = response.text
                self._local_cache.put(key, value)
                return value
            elif response.status_code == 404:
                return None
            else:
                logger.error(f"KV get error: {response.status_code} {response.text}")
                return self._local_cache.get(key)
        except Exception as e:
            logger.error(f"KV get exception: {e}")
            return self._local_cache.get(key)

    def put(self, key: str, value: str, ttl: Optional[int] = None) -> bool:
        # Always update local cache
        self._local_cache.put(key, value, ttl)

        if not self.is_configured or not REQUESTS_AVAILABLE:
            return True

        try:
            url = f"{self.base_url}/values/{key}"
            params = {}
            if ttl:
                params["expiration_ttl"] = ttl

            response = requests.put(
                url,
                data=value,
                headers=self._headers(),
                params=params,
                timeout=5,
            )

            if response.status_code == 200:
                return True
            else:
                logger.error(f"KV put error: {response.status_code} {response.text}")
                return False
        except Exception as e:
            logger.error(f"KV put exception: {e}")
            return False

    def delete(self, key: str) -> bool:
        self._local_cache.delete(key)

        if not self.is_configured or not REQUESTS_AVAILABLE:
            return True

        try:
            url = f"{self.base_url}/values/{key}"
            response = requests.delete(url, headers=self._headers(), timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"KV delete exception: {e}")
            return False

    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern (local cache only for now)"""
        count = 0
        keys_to_delete = [
            k for k in self._local_cache._cache.keys()
            if pattern in k
        ]
        for key in keys_to_delete:
            self._local_cache.delete(key)
            count += 1
        return count


# Singleton instance
_kv_client: Optional[CloudflareKVClient] = None


def get_kv_client() -> CloudflareKVClient:
    global _kv_client
    if _kv_client is None:
        _kv_client = CloudflareKVClient()
    return _kv_client


def kv_get(key: str) -> Optional[str]:
    """Convenience function for getting KV value"""
    return get_kv_client().get(key)


def kv_put(key: str, value: str, ttl: Optional[int] = None) -> bool:
    """Convenience function for putting KV value"""
    return get_kv_client().put(key, value, ttl)


def kv_delete(key: str) -> bool:
    """Convenience function for deleting KV value"""
    return get_kv_client().delete(key)

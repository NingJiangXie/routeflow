from __future__ import annotations

import hashlib
import json
import os
import time
from typing import Any, Callable, Optional

from cachetools import LRUCache, TTLCache


DEFAULT_TTL = int(os.getenv("CACHE_TTL_SECONDS", "300"))
DEFAULT_MAX_SIZE = int(os.getenv("CACHE_MAX_SIZE", "512"))

_cache: LRUCache[str, dict[str, Any]] = LRUCache(maxsize=DEFAULT_MAX_SIZE)
_cache_timestamps: dict[str, float] = {}
_ttl_cache: TTLCache[str, dict[str, Any]] = TTLCache(maxsize=DEFAULT_MAX_SIZE, ttl=DEFAULT_TTL)


def _make_key(prefix: str, *args: Any, **kwargs: Any) -> str:
    raw = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    return f"{prefix}:{digest}"


def get_cached(key: str) -> Optional[dict[str, Any]]:
    if key in _cache:
        ts = _cache_timestamps.get(key, 0)
        age = time.time() - ts
        max_age = float(os.getenv("CACHE_TTL_SECONDS", str(DEFAULT_TTL)))
        if age > max_age:
            _cache.pop(key, None)
            _cache_timestamps.pop(key, None)
            return None
        return _cache[key]
    return None


def set_cached(key: str, value: dict[str, Any]) -> None:
    if len(_cache) >= DEFAULT_MAX_SIZE:
        oldest_key = next(iter(_cache_timestamps))
        _cache.pop(oldest_key, None)
        _cache_timestamps.pop(oldest_key, None)
    _cache[key] = value
    _cache_timestamps[key] = time.time()


def cached_endpoint(ttl: Optional[int] = None):
    def decorator(func: Callable) -> Callable:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            key = _make_key(func.__name__, *args, **kwargs)
            cached = get_cached(key)
            if cached is not None:
                return cached
            result = func(*args, **kwargs)
            if isinstance(result, dict):
                set_cached(key, result)
            return result
        wrapper.__name__ = func.__name__
        wrapper.__doc__ = func.__doc__
        return wrapper
    return decorator


def invalidate_cache(prefix: Optional[str] = None) -> int:
    if prefix is None:
        count = len(_cache)
        _cache.clear()
        _cache_timestamps.clear()
        return count
    keys_to_remove = [k for k in _cache if k.startswith(prefix)]
    for key in keys_to_remove:
        _cache.pop(key, None)
        _cache_timestamps.pop(key, None)
    return len(keys_to_remove)


def get_cache_stats() -> dict[str, Any]:
    return {
        "size": len(_cache),
        "max_size": DEFAULT_MAX_SIZE,
        "ttl_seconds": float(os.getenv("CACHE_TTL_SECONDS", str(DEFAULT_TTL))),
        "keys": list(_cache.keys())[:20],
    }

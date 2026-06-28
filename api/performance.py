from __future__ import annotations

import os
import time
from functools import wraps
from typing import Any, Callable

from logging_setup import get_logger


logger = get_logger("routeflow.perf")


def measure_time(operation_name: str, log_level: str = "info") -> Callable:
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time.perf_counter()
            try:
                result = await func(*args, **kwargs)
                elapsed = (time.perf_counter() - start) * 1000
                getattr(logger, log_level)(
                    f"{operation_name}",
                    operation=operation_name,
                    duration_ms=round(elapsed, 2),
                    status="success",
                )
                return result
            except Exception as exc:
                elapsed = (time.perf_counter() - start) * 1000
                logger.error(
                    f"{operation_name} failed",
                    operation=operation_name,
                    duration_ms=round(elapsed, 2),
                    status="error",
                    error=str(exc),
                )
                raise

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                elapsed = (time.perf_counter() - start) * 1000
                getattr(logger, log_level)(
                    f"{operation_name}",
                    operation=operation_name,
                    duration_ms=round(elapsed, 2),
                    status="success",
                )
                return result
            except Exception as exc:
                elapsed = (time.perf_counter() - start) * 1000
                logger.error(
                    f"{operation_name} failed",
                    operation=operation_name,
                    duration_ms=round(elapsed, 2),
                    status="error",
                    error=str(exc),
                )
                raise

        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    return decorator


class PerformanceMonitor:
    _instance: "PerformanceMonitor | None" = None

    def __new__(cls) -> "PerformanceMonitor":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._metrics = []
            cls._instance._max_records = 1000
        return cls._instance

    def record(self, operation: str, duration_ms: float, success: bool = True, metadata: dict | None = None) -> None:
        record = {
            "timestamp": time.time(),
            "operation": operation,
            "duration_ms": round(duration_ms, 4),
            "success": success,
            "metadata": metadata or {},
        }
        self._metrics.append(record)
        if len(self._metrics) > self._max_records:
            self._metrics = self._metrics[-self._max_records:]

        if duration_ms > float(os.getenv("PERF_SLOW_THRESHOLD_MS", "1000")):
            logger.warning(
                f"Slow operation detected: {operation}",
                operation=operation,
                duration_ms=round(duration_ms, 2),
                threshold_ms=float(os.getenv("PERF_SLOW_THRESHOLD_MS", "1000")),
            )

    def get_stats(self, operation: str | None = None) -> dict[str, Any]:
        records = (
            [r for r in self._metrics if r["operation"] == operation]
            if operation
            else self._metrics
        )
        if not records:
            return {"count": 0, "avg_ms": 0, "min_ms": 0, "max_ms": 0, "success_rate": 0}

        durations = [r["duration_ms"] for r in records]
        success_count = sum(1 for r in records if r["success"])

        return {
            "count": len(records),
            "avg_ms": round(sum(durations) / len(durations), 2),
            "min_ms": round(min(durations), 2),
            "max_ms": round(max(durations), 2),
            "success_rate": round(success_count / len(records) * 100, 1),
        }

    def get_recent(self, limit: int = 20) -> list[dict]:
        return sorted(self._metrics, key=lambda r: r["timestamp"], reverse=True)[:limit]

    def clear(self) -> None:
        self._metrics.clear()


perf_monitor = PerformanceMonitor()

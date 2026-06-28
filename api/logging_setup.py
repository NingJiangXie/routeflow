from __future__ import annotations

import logging
import os
import uuid
from contextvars import ContextVar
from typing import Any, Dict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

_request_id: ContextVar[str] = ContextVar("request_id", default="")


def get_request_id() -> str:
    return _request_id.get()


def setup_logging() -> None:
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    json_logs = os.getenv("JSON_LOGS", "false").lower() == "true"

    if json_logs:
        import structlog

        structlog.configure(
            processors=[
                structlog.contextvars.merge_contextvars,
                structlog.processors.add_log_level,
                structlog.processors.StackInfoRenderer(),
                structlog.dev.set_exc_info,
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.JSONRenderer(),
            ],
            wrapper_class=structlog.make_filtering_bound_logger(
                getattr(logging, log_level, logging.INFO)
            ),
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=True,
        )
    else:
        logging.basicConfig(
            level=getattr(logging, log_level, logging.INFO),
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        )


def get_logger(name: str = "routeflow"):
    json_logs = os.getenv("JSON_LOGS", "false").lower() == "true"
    if json_logs:
        import structlog

        return structlog.get_logger(name)
    return _StandardLoggerWrapper(logging.getLogger(name))


class _StandardLoggerWrapper:
    def __init__(self, logger: logging.Logger) -> None:
        self._logger = logger

    def _format(self, msg: str, kwargs: Dict[str, Any]) -> str:
        if not kwargs:
            return msg
        extra = " ".join(f"{k}={v}" for k, v in kwargs.items())
        return f"{msg} | {extra}"

    def debug(self, msg: str, **kwargs: Any) -> None:
        self._logger.debug(self._format(msg, kwargs))

    def info(self, msg: str, **kwargs: Any) -> None:
        self._logger.info(self._format(msg, kwargs))

    def warning(self, msg: str, **kwargs: Any) -> None:
        self._logger.warning(self._format(msg, kwargs))

    def error(self, msg: str, **kwargs: Any) -> None:
        self._logger.error(self._format(msg, kwargs))

    def critical(self, msg: str, **kwargs: Any) -> None:
        self._logger.critical(self._format(msg, kwargs))

    def exception(self, msg: str, **kwargs: Any) -> None:
        self._logger.exception(self._format(msg, kwargs))


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        _request_id.set(request_id)

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        import time

        logger = get_logger("access")
        start_time = time.time()

        response = await call_next(request)

        duration_ms = int((time.time() - start_time) * 1000)
        request_id = get_request_id()

        log_data: Dict[str, Any] = {
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "client_ip": request.client.host if request.client else None,
            "request_id": request_id,
            "user_agent": request.headers.get("user-agent"),
        }

        level = "info" if response.status_code < 500 else "error"
        message = f"{request.method} {request.url.path}"

        getattr(logger, level)(message, **log_data)

        return response

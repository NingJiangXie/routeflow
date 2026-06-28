from __future__ import annotations

import os
from typing import Optional, Set

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


ALLOWED_HOSTS: Set[str] = set()


def _parse_hosts(env_value: Optional[str]) -> Set[str]:
    if not env_value:
        return set()
    return {h.strip() for h in env_value.split(",") if h.strip()}


def _load_allowed_hosts() -> Set[str]:
    env_hosts = os.getenv("ALLOWED_HOSTS", "")
    hosts = _parse_hosts(env_hosts)
    env = os.getenv("ENVIRONMENT", "development").lower()
    if env in {"development", "dev", "test", "testing"}:
        hosts.update({"localhost", "127.0.0.1", "testserver"})
    else:
        hosts.update({"localhost", "127.0.0.1"})
    return hosts


ALLOWED_HOSTS = _load_allowed_hosts()


def _is_production() -> bool:
    return os.getenv("ENVIRONMENT", "development").lower() in {"production", "prod", "staging", "stage"}


class HostValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        host = request.headers.get("host", "")
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env in {"development", "dev", "test", "testing"}:
            response = await call_next(request)
            return response
        if host:
            host = host.split(":")[0]
            if ALLOWED_HOSTS and host not in ALLOWED_HOSTS:
                return JSONResponse(
                    status_code=403,
                    content={"error": "forbidden", "message": "Host not allowed"},
                )
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)

        is_prod = _is_production()

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Download-Options"] = "noopen"
        response.headers["X-Permitted-Cross-Domain-Policies"] = "none"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        if is_prod:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
        else:
            response.headers["X-Frame-Options"] = "SAMEORIGIN"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Cache-Control"] = "no-cache"
            response.headers["Pragma"] = "no-cache"

        return response


class CSPMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, csp_policy: Optional[str] = None) -> None:
        super().__init__(app)
        self.csp_policy = csp_policy or self._default_policy()

    def _default_policy(self) -> str:
        is_prod = _is_production()
        if is_prod:
            return (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: blob:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self';"
            )
        return (
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self'; "
            "connect-src 'self' ws://localhost:* http://localhost:*; "
            "frame-ancestors 'self'; "
            "base-uri 'self'; "
            "form-action 'self';"
        )

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        response.headers["Content-Security-Policy"] = self.csp_policy
        return response


class SSRFProtectionMiddleware(BaseHTTPMiddleware):
    BLOCKED_IP_RANGES = {
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "127.0.0.0/8",
        "169.254.0.0/16",
        "0.0.0.0/8",
    }

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        return response


def apply_security_middleware(app):
    app.add_middleware(HostValidationMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    csp_env = os.getenv("CSP_POLICY")
    csp_policy = csp_env if csp_env else None
    app.add_middleware(CSPMiddleware, csp_policy=csp_policy)

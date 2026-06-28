from __future__ import annotations

import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


def _get_limit_from_env(name: str, default: str) -> str:
    return os.getenv(name, default)


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[_get_limit_from_env("RATE_LIMIT_DEFAULT", "100/minute")],
    storage_uri=os.getenv("RATE_LIMIT_STORAGE", "memory://"),
)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    retry_after = exc.detail.get("retry_after", 60) if exc.detail else 60
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": retry_after,
        },
        headers={"Retry-After": str(retry_after)},
    )


chat_rate_limit = _get_limit_from_env("RATE_LIMIT_CHAT", "20/minute")
code_gen_rate_limit = _get_limit_from_env("RATE_LIMIT_CODE_GEN", "10/minute")
workspace_rate_limit = _get_limit_from_env("RATE_LIMIT_WORKSPACE", "60/minute")
git_rate_limit = _get_limit_from_env("RATE_LIMIT_GIT", "30/minute")

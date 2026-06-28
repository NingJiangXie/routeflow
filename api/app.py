from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import hashlib
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from cache import get_cached, set_cached, get_cache_stats
from performance import perf_monitor
from logging_setup import (
    AccessLogMiddleware,
    RequestIDMiddleware,
    get_logger,
    setup_logging,
)
from models import (
    ApiConfig,
    ChatRequest,
    CodeRequest,
    GitExecuteRequest,
    Message,
    OptimizeCodeRequest,
    WorkspacePayload,
)
from rate_limiter import (
    chat_rate_limit,
    code_gen_rate_limit,
    git_rate_limit,
    limiter,
    rate_limit_exceeded_handler,
    workspace_rate_limit,
)
from security import is_git_enabled, validate_repo_path
from security_middleware import (
    HostValidationMiddleware,
    SecurityHeadersMiddleware,
    CSPMiddleware,
)


setup_logging()
logger = get_logger("routeflow.api")


APP_VERSION = "2.3.0"
CONFIG_DIR = Path(__file__).parent / "config"
CONFIG_DIR.mkdir(exist_ok=True)
CONFIG_FILE = CONFIG_DIR / "api_config.json"
DATA_DIR = Path(__file__).parent / "data"
WORKSPACE_FILE = DATA_DIR / "routeflow_workspace.json"

DEFAULT_MODELS = {
    "openai": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    "deepseek": os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
    "custom": os.getenv("CUSTOM_MODEL", "gpt-4o-mini"),
}

DEFAULT_BASE_URLS = {
    "openai": None,
    "deepseek": "https://api.deepseek.com/v1",
    "custom": None,
}

ENV_KEY_NAMES = {
    "openai": "OPENAI_API_KEY",
    "deepseek": "DEEPSEEK_API_KEY",
    "custom": "CUSTOM_API_KEY",
}

ALLOWED_GIT_COMMANDS = {
    "status",
    "branch",
    "log",
    "diff",
    "show",
}

ALGORITHMS_INFO = {
    "astar": {"name": "A*", "description": "Classic grid-based optimal path planner."},
    "dstar": {"name": "D* Lite", "description": "Efficient dynamic replanning for changing grid maps."},
    "rrt": {"name": "RRT*", "description": "Sampling-based planner with asymptotic optimality."},
    "aco": {
        "name": "Ant Colony Optimization",
        "description": "Heuristic optimization inspired by pheromone-guided search.",
    },
}


def _csv_env(name: str, default: str) -> List[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


app = FastAPI(title="RouteFlow AI Assistant API", version=APP_VERSION)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(AccessLogMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_csv_env(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175",
    ),
    allow_credentials=os.getenv("CORS_ALLOW_CREDENTIALS", "false").lower() == "true",
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)
app.add_middleware(HostValidationMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CSPMiddleware)
app.add_middleware(
    GZipMiddleware,
    minimum_size=int(os.getenv("GZIP_MIN_SIZE", "500")),
)


def _make_etag(data: Any) -> str:
    serialized = json.dumps(data, sort_keys=True, default=str)
    return f'"{hashlib.md5(serialized.encode()).hexdigest()}"'


def _etag_response(data: Any, request: Request):
    etag = _make_etag(data)
    if_none_match = request.headers.get("if-none-match")
    if if_none_match and if_none_match == etag:
        from fastapi.responses import Response
        return Response(status_code=304)
    from fastapi.responses import JSONResponse
    return JSONResponse(content=data, headers={"ETag": etag})


def normalize_provider(provider: Optional[str]) -> str:
    value = (provider or "openai").strip().lower()
    if value not in DEFAULT_MODELS:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {value}")
    return value


def load_config() -> Dict[str, Any]:
    if not CONFIG_FILE.exists():
        return {}
    try:
        with CONFIG_FILE.open("r", encoding="utf-8") as file:
            return json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to load API config", error=str(exc))
        return {}


def save_config(config: Dict[str, Any]) -> None:
    try:
        with CONFIG_FILE.open("w", encoding="utf-8") as file:
            json.dump(config, file, indent=2, ensure_ascii=False)
    except OSError as exc:
        logger.error("Failed to save API config", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to save API config")


def empty_workspace() -> Dict[str, Any]:
    return {"version": 1, "maps": [], "runs": [], "presets": [], "updated_at": None}


def load_workspace() -> Dict[str, Any]:
    if not WORKSPACE_FILE.exists():
        return empty_workspace()
    try:
        with WORKSPACE_FILE.open("r", encoding="utf-8") as file:
            workspace = json.load(file)
        return WorkspacePayload(**workspace).model_dump()
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        logger.warning("Failed to load workspace", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to load workspace") from exc


def save_workspace(payload: WorkspacePayload) -> Dict[str, Any]:
    DATA_DIR.mkdir(exist_ok=True)
    workspace = payload.model_dump()
    try:
        with WORKSPACE_FILE.open("w", encoding="utf-8") as file:
            json.dump(workspace, file, indent=2, ensure_ascii=False)
    except OSError as exc:
        logger.error("Failed to save workspace", error=str(exc))
        raise HTTPException(status_code=500, detail="Failed to save workspace") from exc
    return workspace


def redact_config(config: Dict[str, Any]) -> Dict[str, Any]:
    redacted: Dict[str, Any] = {}
    for provider, values in config.items():
        redacted[provider] = {
            "model": values.get("model"),
            "base_url": values.get("base_url"),
            "has_api_key": bool(values.get("api_key")),
        }
    return redacted


def resolve_api_settings(request: ChatRequest | ApiConfig, provider: str) -> Dict[str, str | None]:
    config = load_config().get(provider, {})
    api_key = request.api_key or os.getenv(ENV_KEY_NAMES[provider]) or config.get("api_key")
    model = request.model or config.get("model") or DEFAULT_MODELS[provider]
    base_url = request.base_url or config.get("base_url") or DEFAULT_BASE_URLS[provider]

    if not api_key:
        raise HTTPException(
            status_code=400,
            detail=f"Missing API key. Pass api_key or set {ENV_KEY_NAMES[provider]}.",
        )
    return {"api_key": api_key, "model": model, "base_url": base_url}


def call_ai_provider(
    messages: List[Dict[str, str]],
    provider: str,
    api_key: str,
    model: str,
    base_url: Optional[str] = None,
) -> str:
    try:
        import openai

        client_kwargs: Dict[str, str] = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
        client = openai.OpenAI(**client_kwargs)
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
        )
        content = response.choices[0].message.content
        return content or ""
    except Exception as exc:
        logger.error("AI provider request failed", provider=provider, error=str(exc))
        raise HTTPException(status_code=502, detail=f"{provider} API request failed: {exc}") from exc


def parse_json_or_text(text: str, fallback_key: str) -> Dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.removeprefix("json").strip()
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    return {fallback_key: text}


def configured_provider(preferred: Optional[str] = None) -> str:
    if preferred:
        return normalize_provider(preferred)
    config = load_config()
    for provider in ("openai", "deepseek", "custom"):
        if provider in config or os.getenv(ENV_KEY_NAMES[provider]):
            return provider
    return "openai"


@app.get("/")
async def root():
    return {"message": "RouteFlow AI Assistant API is running", "version": APP_VERSION}


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": APP_VERSION}


@app.post("/api/chat")
@limiter.limit(chat_rate_limit)
async def chat(request: Request, chat_request: ChatRequest):
    provider = normalize_provider(chat_request.provider)
    settings = resolve_api_settings(chat_request, provider)
    messages = [{"role": item.role, "content": item.content} for item in chat_request.messages]
    logger.info("Chat request", provider=provider, model=settings["model"], num_messages=len(messages))
    response = call_ai_provider(
        messages,
        provider,
        str(settings["api_key"]),
        str(settings["model"]),
        settings["base_url"],
    )
    return {"response": response, "model": settings["model"], "provider": provider}


@app.post("/api/test-api")
@limiter.limit(chat_rate_limit)
async def test_api(request: Request, config: ApiConfig):
    provider = normalize_provider(config.provider)
    try:
        settings = resolve_api_settings(config, provider)
        response = call_ai_provider(
            [{"role": "user", "content": "Reply with: connection ok"}],
            provider,
            str(settings["api_key"]),
            str(settings["model"]),
            settings["base_url"],
        )
        return {"success": True, "message": "Connection successful", "response": response[:80]}
    except HTTPException as exc:
        return {"success": False, "message": exc.detail}


@app.post("/api/save-config")
@limiter.limit("10/minute")
async def save_api_config(request: Request, config: ApiConfig):
    provider = normalize_provider(config.provider)
    existing_config = load_config()
    existing_config[provider] = {
        "model": config.model or DEFAULT_MODELS[provider],
        "base_url": config.base_url or DEFAULT_BASE_URLS[provider],
    }

    if os.getenv("ALLOW_PERSIST_API_KEYS", "false").lower() == "true" and config.api_key:
        existing_config[provider]["api_key"] = config.api_key

    save_config(existing_config)
    logger.info("API config saved", provider=provider)
    return {
        "success": True,
        "message": "Config saved. API keys are only persisted when ALLOW_PERSIST_API_KEYS=true.",
    }


@app.get("/api/get-config")
async def get_api_config():
    return {"config": redact_config(load_config())}


@app.post("/api/generate-code")
@limiter.limit(code_gen_rate_limit)
async def generate_code(request: Request, code_request: CodeRequest):
    algo_key = code_request.algorithm.lower()
    if algo_key not in ALGORITHMS_INFO:
        raise HTTPException(status_code=400, detail="Unsupported algorithm")

    provider = configured_provider(code_request.provider)
    settings = resolve_api_settings(
        ChatRequest(
            messages=[Message(role="user", content="generate")],
            provider=provider,
            api_key=code_request.api_key,
            model=code_request.model,
            base_url=code_request.base_url,
        ),
        provider,
    )
    algo_info = ALGORITHMS_INFO[algo_key]
    prompt = (
        f"Generate a complete, runnable {code_request.language} implementation of "
        f"{algo_info['name']} for grid path planning.\n"
        "Return JSON with code and explanation fields.\n"
        f"Algorithm description: {algo_info['description']}"
    )
    logger.info("Code generation request", algorithm=algo_key, language=code_request.language)
    response = call_ai_provider(
        [{"role": "user", "content": prompt}],
        provider,
        str(settings["api_key"]),
        str(settings["model"]),
        settings["base_url"],
    )
    return parse_json_or_text(response, "code")


@app.get("/api/algorithms")
async def get_algorithms(request: Request):
    cache_key = "algorithms:list"
    cached = get_cached(cache_key)
    if cached is not None:
        return _etag_response(cached, request)
    data = {
        "algorithms": [
            {"id": "astar", "name": "A*", "type": "Static optimal planning"},
            {"id": "dstar", "name": "D* Lite", "type": "Dynamic planning"},
            {"id": "rrt", "name": "RRT*", "type": "Sampling-based planning"},
            {"id": "aco", "name": "ACO", "type": "Heuristic optimization"},
        ]
    }
    set_cached(cache_key, data)
    return _etag_response(data, request)


@app.post("/api/optimize-code")
@limiter.limit(code_gen_rate_limit)
async def optimize_code(request: Request, opt_request: OptimizeCodeRequest):
    algo_map = {"1": "D* Lite", "2": "RRT*", "3": "ACO"}
    goal_map = {
        "performance": "performance",
        "memory": "memory usage",
        "readability": "readability",
        "completeness": "functional completeness",
    }
    provider = configured_provider(opt_request.provider)
    settings = resolve_api_settings(
        ChatRequest(
            messages=[Message(role="user", content="optimize")],
            provider=provider,
            api_key=opt_request.api_key,
            model=opt_request.model,
            base_url=opt_request.base_url,
        ),
        provider,
    )
    algorithm = algo_map.get(str(opt_request.algorithm), opt_request.algorithm)
    goal = goal_map.get(opt_request.goal, opt_request.goal)
    prompt = (
        f"Optimize a {algorithm} path planning implementation for {goal}.\n"
        f"Extra requirements: {opt_request.requirements or 'none'}\n"
        "Return JSON with optimized_code, suggestions, and explanation fields."
    )
    logger.info("Code optimization request", algorithm=algorithm, goal=goal)
    response = call_ai_provider(
        [{"role": "user", "content": prompt}],
        provider,
        str(settings["api_key"]),
        str(settings["model"]),
        settings["base_url"],
    )
    return parse_json_or_text(response, "optimized_code")


@app.post("/api/git/execute")
@limiter.limit(git_rate_limit)
async def git_execute(request: Request, git_request: GitExecuteRequest):
    if not is_git_enabled():
        raise HTTPException(status_code=403, detail="Git API is disabled")

    args = shlex.split(git_request.command)
    if not args or args[0] != "git":
        raise HTTPException(status_code=400, detail="Only git commands are supported")
    if len(args) < 2 or args[1] not in ALLOWED_GIT_COMMANDS:
        allowed = ", ".join(sorted(ALLOWED_GIT_COMMANDS))
        raise HTTPException(status_code=400, detail=f"Allowed git commands: {allowed}")

    repo_path = validate_repo_path(git_request.repo_path)
    logger.info("Git command execution", command=args[1], repo=str(repo_path))

    try:
        result = subprocess.run(
            args,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Command timed out"}
    except OSError as exc:
        return {"success": False, "error": str(exc)}

    return {
        "success": result.returncode == 0,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "returncode": result.returncode,
    }


@app.get("/api/compare-algorithms")
async def compare_algorithms(request: Request):
    cache_key = "compare:algorithms"
    cached = get_cached(cache_key)
    if cached is not None:
        return _etag_response(cached, request)
    data = {
        "astar": {
            "name": "A*",
            "advantages": ["Optimal path guaranteed", "Simple and well-understood", "Fast on small grids"],
            "limitations": ["Slow on very large maps", "Not suitable for dynamic environments"],
            "best_for": ["Static grid environments", "Shortest path required"],
        },
        "dstar": {
            "name": "D* Lite",
            "advantages": ["Fast replanning", "Well suited to dynamic maps", "Optimal on grid costs"],
            "limitations": ["Higher state bookkeeping", "Initial setup cost"],
            "best_for": ["Robots in changing environments", "Repeated replanning tasks"],
        },
        "rrt": {
            "name": "RRT*",
            "advantages": ["Handles high-dimensional spaces", "Asymptotically optimal", "Flexible constraints"],
            "limitations": ["Can converge slowly", "Path smoothing is often needed"],
            "best_for": ["Complex continuous spaces", "Non-holonomic planning"],
        },
        "aco": {
            "name": "ACO",
            "advantages": ["Global heuristic search", "Robust to noisy objectives", "Parallelizable"],
            "limitations": ["Parameter-sensitive", "Can stagnate without evaporation tuning"],
            "best_for": ["Multi-objective routing", "Large combinatorial maps"],
        },
    }
    set_cached(cache_key, data)
    return _etag_response(data, request)


@app.get("/api/workspace")
@limiter.limit(workspace_rate_limit)
async def get_workspace(request: Request):
    return {"workspace": load_workspace()}


@app.post("/api/workspace")
@limiter.limit(workspace_rate_limit)
async def post_workspace(request: Request, workspace: WorkspacePayload):
    logger.info("Workspace saved", maps_count=len(workspace.maps), runs_count=len(workspace.runs))
    return {"success": True, "workspace": save_workspace(workspace)}


@app.get("/api/cache/stats")
async def cache_stats():
    return get_cache_stats()


@app.get("/api/performance/stats")
async def performance_stats():
    return {
        "summary": perf_monitor.get_stats(),
        "recent": perf_monitor.get_recent(10),
        "slow_operations": [
            r for r in perf_monitor.get_recent(100)
            if r["duration_ms"] > 500
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")))

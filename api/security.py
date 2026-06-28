from __future__ import annotations

import os
from pathlib import Path
from typing import Optional


def is_safe_path(base_dir: Path, target_path: Path) -> bool:
    try:
        base_resolved = base_dir.resolve()
        target_resolved = target_path.resolve()
        return base_resolved in target_resolved.parents or target_resolved == base_resolved
    except (OSError, ValueError):
        return False


def validate_repo_path(
    repo_path_str: str,
    allowed_base_dirs: Optional[list[str]] = None,
) -> Path:
    repo_path = Path(repo_path_str).expanduser()

    if repo_path.is_absolute():
        normalized = repo_path.resolve()
    else:
        cwd = Path.cwd().resolve()
        normalized = (cwd / repo_path).resolve()

    if not normalized.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Repository path does not exist")

    if not normalized.is_dir():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Repository path is not a directory")

    if not (normalized / ".git").is_dir():
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Path is not a git repository")

    if allowed_base_dirs:
        for base_dir in allowed_base_dirs:
            base = Path(base_dir).expanduser().resolve()
            if is_safe_path(base, normalized):
                return normalized
        from fastapi import HTTPException
        raise HTTPException(
            status_code=403,
            detail="Repository path is not within allowed directories",
        )

    env_allowed = os.getenv("GIT_ALLOWED_DIRS")
    if env_allowed:
        allowed = [d.strip() for d in env_allowed.split(",") if d.strip()]
        if allowed:
            for base_dir in allowed:
                base = Path(base_dir).expanduser().resolve()
                if is_safe_path(base, normalized):
                    return normalized
            from fastapi import HTTPException
            raise HTTPException(
                status_code=403,
                detail="Repository path is not within allowed directories",
            )

    return normalized


def get_allowed_git_dirs() -> list[Path]:
    env_allowed = os.getenv("GIT_ALLOWED_DIRS", "")
    return [
        Path(d.strip()).expanduser().resolve()
        for d in env_allowed.split(",")
        if d.strip()
    ]


def is_git_enabled() -> bool:
    return os.getenv("ENABLE_GIT_API", "false").lower() == "true"

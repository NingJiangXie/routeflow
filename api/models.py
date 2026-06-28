from __future__ import annotations

import ipaddress
import re
import typing
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


MAX_MESSAGES = 50
MAX_MESSAGE_LENGTH = 10000
MAX_WORKSPACE_MAPS = 50
MAX_WORKSPACE_RUNS = 100
MAX_ALGORITHM_NAME_LENGTH = 50
MAX_LANGUAGE_LENGTH = 20
MAX_GIT_COMMAND_LENGTH = 500

_BLOCKED_URL_PATTERNS = re.compile(
    r"(?:"
    r"localhost|127\.\d+\.\d+\.\d+|"
    r"0\.\d+\.\d+\.\d+|"
    r"10\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+|192\.168\.\d+|"
    r"169\.254\.\d+|"
    r"\[[\da-f:]+\]|"
    r"[a-z]-local|internal|private|intranet|intranet\.local"
    r")",
    re.IGNORECASE,
)


def _validate_not_ssrf(url: Optional[str], field_name: str) -> Optional[str]:
    if not url:
        return url
    if _BLOCKED_URL_PATTERNS.search(url):
        raise ValueError(f"{field_name} cannot point to internal/private network addresses")
    return url


class Message(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)


class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., min_length=1, max_length=MAX_MESSAGES)
    api_key: Optional[str] = Field(default=None, min_length=1, max_length=200)
    model: Optional[str] = Field(default=None, max_length=100)
    provider: str = Field(default="openai", max_length=50)
    base_url: Optional[str] = Field(default=None, max_length=500, pattern=r"^https?://")

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        v = v.strip().lower()
        allowed = {"openai", "deepseek", "custom"}
        if v not in allowed:
            raise ValueError(f"Unsupported provider: {v}")
        return v

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: Optional[str]) -> Optional[str]:
        return _validate_not_ssrf(v, "base_url")


class ApiConfig(BaseModel):
    provider: str = Field(..., max_length=50)
    api_key: Optional[str] = Field(default=None, min_length=1, max_length=200)
    model: Optional[str] = Field(default=None, max_length=100)
    base_url: Optional[str] = Field(default=None, max_length=500, pattern=r"^https?://")

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        v = v.strip().lower()
        allowed = {"openai", "deepseek", "custom"}
        if v not in allowed:
            raise ValueError(f"Unsupported provider: {v}")
        return v

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: Optional[str]) -> Optional[str]:
        return _validate_not_ssrf(v, "base_url")


class CodeRequest(BaseModel):
    algorithm: str = Field(..., min_length=1, max_length=MAX_ALGORITHM_NAME_LENGTH)
    language: str = Field(default="python", max_length=MAX_LANGUAGE_LENGTH)
    provider: Optional[str] = Field(default=None, max_length=50)
    api_key: Optional[str] = Field(default=None, min_length=1, max_length=200)
    model: Optional[str] = Field(default=None, max_length=100)
    base_url: Optional[str] = Field(default=None, max_length=500, pattern=r"^https?://")

    @field_validator("algorithm")
    @classmethod
    def validate_algorithm(cls, v: str) -> str:
        v = v.strip().lower()
        allowed = {"dstar", "rrt", "aco", "astar"}
        if v not in allowed:
            raise ValueError(f"Unsupported algorithm: {v}")
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        v = v.strip().lower()
        allowed = {"python", "javascript", "typescript", "rust", "go", "cpp", "c++", "java"}
        if v not in allowed:
            raise ValueError(f"Unsupported language: {v}")
        return v

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: Optional[str]) -> Optional[str]:
        return _validate_not_ssrf(v, "base_url")


class OptimizeCodeRequest(BaseModel):
    algorithm: str = Field(default="1", max_length=MAX_ALGORITHM_NAME_LENGTH)
    goal: str = Field(default="performance", max_length=50)
    requirements: str = Field(default="", max_length=2000)
    provider: Optional[str] = Field(default=None, max_length=50)
    api_key: Optional[str] = Field(default=None, min_length=1, max_length=200)
    model: Optional[str] = Field(default=None, max_length=100)
    base_url: Optional[str] = Field(default=None, max_length=500, pattern=r"^https?://")

    @field_validator("goal")
    @classmethod
    def validate_goal(cls, v: str) -> str:
        v = v.strip().lower()
        allowed = {"performance", "memory", "readability", "completeness"}
        if v not in allowed:
            raise ValueError(f"Unsupported optimization goal: {v}")
        return v

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, v: Optional[str]) -> Optional[str]:
        return _validate_not_ssrf(v, "base_url")


class GitExecuteRequest(BaseModel):
    command: str = Field(..., min_length=1, max_length=MAX_GIT_COMMAND_LENGTH)
    repo_path: str = Field(default=".", max_length=500)

    @field_validator("command")
    @classmethod
    def validate_command(cls, v: str) -> str:
        if "\x00" in v or ";" in v or "&&" in v or "||" in v or "|" in v:
            raise ValueError("Command contains disallowed characters")
        if not v.strip().startswith("git "):
            raise ValueError("Only git commands are supported")
        return v


class WorkspacePayload(BaseModel):
    version: int = Field(default=1, ge=1, le=100)
    maps: List[Dict[str, Any]] = Field(default_factory=list)
    runs: List[Dict[str, Any]] = Field(default_factory=list)
    presets: List[Dict[str, Any]] = Field(default_factory=list)
    updated_at: Optional[str] = None

    @field_validator("maps")
    @classmethod
    def validate_maps(cls, v: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if len(v) > MAX_WORKSPACE_MAPS:
            raise ValueError(f"Too many maps; maximum is {MAX_WORKSPACE_MAPS}")
        return v

    @field_validator("runs")
    @classmethod
    def validate_runs(cls, v: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if len(v) > MAX_WORKSPACE_RUNS:
            raise ValueError(f"Too many runs; maximum is {MAX_WORKSPACE_RUNS}")
        return v

    @field_validator("updated_at")
    @classmethod
    def validate_updated_at(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        iso_pattern = re.compile(
            r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$"
        )
        if not iso_pattern.match(v):
            raise ValueError("Invalid timestamp format; expected ISO 8601")
        return v

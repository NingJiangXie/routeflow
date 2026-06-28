import pytest
from fastapi.testclient import TestClient

from app import app


@pytest.fixture
def client():
    return TestClient(app)


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "RouteFlow" in data["message"]


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_algorithms_endpoint(client):
    response = client.get("/api/algorithms")
    assert response.status_code == 200
    data = response.json()
    assert "algorithms" in data
    assert len(data["algorithms"]) >= 4
    algo_ids = {a["id"] for a in data["algorithms"]}
    assert {"astar", "dstar", "rrt", "aco"}.issubset(algo_ids)


def test_compare_algorithms_endpoint(client):
    response = client.get("/api/compare-algorithms")
    assert response.status_code == 200
    data = response.json()
    for algo_id in ("astar", "dstar", "rrt", "aco"):
        assert algo_id in data
        algo = data[algo_id]
        assert "name" in algo
        assert "advantages" in algo
        assert "limitations" in algo
        assert "best_for" in algo
        assert isinstance(algo["advantages"], list)
        assert len(algo["advantages"]) > 0


def test_get_config_endpoint(client):
    response = client.get("/api/get-config")
    assert response.status_code == 200
    data = response.json()
    assert "config" in data
    assert isinstance(data["config"], dict)


def test_workspace_get_default(client, monkeypatch):
    monkeypatch.setenv("ENABLE_GIT_API", "false")
    response = client.get("/api/workspace")
    assert response.status_code == 200
    data = response.json()
    assert "workspace" in data
    ws = data["workspace"]
    assert ws["version"] == 1
    assert ws["maps"] == []
    assert ws["runs"] == []
    assert ws["presets"] == []


def test_workspace_post_validation(client):
    bad_payload = {
        "version": -1,
        "maps": "not-a-list",
    }
    response = client.post("/api/workspace", json=bad_payload)
    assert response.status_code == 422


def test_workspace_post_and_get(client, monkeypatch, tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    monkeypatch.setattr("app.DATA_DIR", data_dir)
    monkeypatch.setattr("app.WORKSPACE_FILE", data_dir / "workspace.json")

    workspace = {
        "version": 1,
        "maps": [{"id": "map-1", "name": "Test"}],
        "runs": [{"id": "run-1"}],
        "presets": [],
        "updated_at": None,
    }
    response = client.post("/api/workspace", json=workspace)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["workspace"]["maps"]) == 1


def test_chat_missing_messages(client):
    response = client.post("/api/chat", json={"messages": []})
    assert response.status_code == 422


def test_chat_invalid_role(client):
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "invalid", "content": "hello"}]},
    )
    assert response.status_code == 422


def test_chat_empty_content(client):
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": ""}]},
    )
    assert response.status_code == 422


def test_chat_too_many_messages(client):
    messages = [{"role": "user", "content": f"msg {i}"} for i in range(60)]
    response = client.post("/api/chat", json={"messages": messages})
    assert response.status_code == 422


def test_invalid_provider(client):
    response = client.post(
        "/api/chat",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "provider": "unknown",
        },
    )
    assert response.status_code == 422


def test_generate_code_invalid_algorithm(client):
    response = client.post(
        "/api/generate-code",
        json={"algorithm": "bogus"},
    )
    assert response.status_code == 422


def test_generate_code_invalid_language(client):
    response = client.post(
        "/api/generate-code",
        json={"algorithm": "astar", "language": "brainfuck"},
    )
    assert response.status_code == 422


def test_generate_code_valid_input_missing_api_key(client):
    response = client.post(
        "/api/generate-code",
        json={"algorithm": "astar", "language": "python"},
    )
    assert response.status_code == 400


def test_optimize_code_invalid_goal(client):
    response = client.post(
        "/api/optimize-code",
        json={"goal": "unknown"},
    )
    assert response.status_code == 422


def test_git_disabled_by_default(client):
    response = client.post(
        "/api/git/execute",
        json={"command": "git status", "repo_path": "."},
    )
    assert response.status_code == 403


def test_git_invalid_command(client, monkeypatch):
    monkeypatch.setenv("ENABLE_GIT_API", "true")
    response = client.post(
        "/api/git/execute",
        json={"command": "rm -rf /", "repo_path": "."},
    )
    assert response.status_code == 422


def test_git_command_injection_attempt(client, monkeypatch):
    monkeypatch.setenv("ENABLE_GIT_API", "true")
    response = client.post(
        "/api/git/execute",
        json={"command": "git status; rm -rf /", "repo_path": "."},
    )
    assert response.status_code == 422


def test_request_id_header(client):
    response = client.get("/api/health")
    assert "x-request-id" in response.headers
    assert len(response.headers["x-request-id"]) > 0


def test_custom_request_id_passthrough(client):
    custom_id = "test-custom-id-123"
    response = client.get("/api/health", headers={"X-Request-ID": custom_id})
    assert response.headers["x-request-id"] == custom_id


def test_cors_headers(client):
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_save_config_no_api_key_by_default(client):
    response = client.post(
        "/api/save-config",
        json={"provider": "openai", "api_key": "sk-test-123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "API keys are only persisted" in data["message"]


def test_security_headers_present(client):
    response = client.get("/api/health")
    assert "x-content-type-options" in response.headers
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "referrer-policy" in response.headers
    assert "x-frame-options" in response.headers
    assert "content-security-policy" in response.headers
    assert "x-xss-protection" in response.headers
    assert "x-download-options" in response.headers
    assert "x-permitted-cross-domain-policies" in response.headers


def test_csp_policy_contains_self(client):
    response = client.get("/api/health")
    csp = response.headers["content-security-policy"]
    assert "default-src 'self'" in csp
    assert "frame-ancestors" in csp


def test_get_config_redacts_api_key(client, monkeypatch, tmp_path):
    monkeypatch.setenv("ALLOW_PERSIST_API_KEYS", "true")
    config_dir = tmp_path / "config"
    config_dir.mkdir()
    import app
    monkeypatch.setattr(app, "CONFIG_DIR", config_dir)
    monkeypatch.setattr(app, "CONFIG_FILE", config_dir / "api_config.json")

    client.post(
        "/api/save-config",
        json={"provider": "openai", "api_key": "sk-secret-123"},
    )

    response = client.get("/api/get-config")
    assert response.status_code == 200
    data = response.json()
    assert "config" in data
    assert "openai" in data["config"]
    assert "api_key" not in data["config"]["openai"]
    assert data["config"]["openai"]["has_api_key"] is True


def test_ssrf_blocked_localhost_base_url(client):
    response = client.post(
        "/api/chat",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "base_url": "http://localhost:9000",
            "provider": "custom",
        },
    )
    assert response.status_code == 422


def test_ssrf_blocked_127_base_url(client):
    response = client.post(
        "/api/chat",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "base_url": "http://127.0.0.1:9000",
            "provider": "custom",
        },
    )
    assert response.status_code == 422


def test_ssrf_blocked_private_ip_base_url(client):
    response = client.post(
        "/api/save-config",
        json={
            "provider": "custom",
            "base_url": "http://192.168.1.1/api",
        },
    )
    assert response.status_code == 422


def test_rate_limit_default_limits_loaded():
    import os
    from rate_limiter import chat_rate_limit, code_gen_rate_limit, git_rate_limit, workspace_rate_limit

    assert chat_rate_limit == os.getenv("RATE_LIMIT_CHAT", "20/minute")
    assert code_gen_rate_limit == os.getenv("RATE_LIMIT_CODE_GEN", "10/minute")
    assert git_rate_limit == os.getenv("RATE_LIMIT_GIT", "30/minute")
    assert workspace_rate_limit == os.getenv("RATE_LIMIT_WORKSPACE", "60/minute")


def test_generate_code_missing_api_key_400(client):
    response = client.post(
        "/api/generate-code",
        json={"algorithm": "astar", "language": "python"},
    )
    assert response.status_code == 400
    data = response.json()
    assert "Missing API key" in data["detail"]


def test_optimize_code_invalid_goal_422(client):
    response = client.post(
        "/api/optimize-code",
        json={"goal": "completely_invalid_goal"},
    )
    assert response.status_code == 422


def test_pydantic_message_content_length(client):
    long_content = "a" * 15000
    response = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": long_content}]},
    )
    assert response.status_code == 422


def test_pydantic_message_too_many(client):
    messages = [{"role": "user", "content": f"msg {i}"} for i in range(100)]
    response = client.post(
        "/api/chat",
        json={"messages": messages},
    )
    assert response.status_code == 422


def test_x_frame_options_header(client):
    response = client.get("/api/health")
    xfo = response.headers["x-frame-options"].upper()
    assert xfo in ("DENY", "SAMEORIGIN")


def test_no_server_version_header(client):
    response = client.get("/api/health")
    assert "server" not in response.headers or "uvicorn" not in response.headers.get("server", "").lower()


def test_cache_stats_endpoint(client):
    response = client.get("/api/cache/stats")
    assert response.status_code == 200
    data = response.json()
    assert "size" in data
    assert "max_size" in data
    assert "ttl_seconds" in data


def test_algorithms_caching(client):
    response1 = client.get("/api/algorithms")
    assert response1.status_code == 200
    etag1 = response1.headers.get("etag")
    assert etag1 is not None

    response2 = client.get("/api/algorithms", headers={"if-none-match": etag1})
    assert response2.status_code == 304


def test_compare_algorithms_caching(client):
    response1 = client.get("/api/compare-algorithms")
    assert response1.status_code == 200
    etag1 = response1.headers.get("etag")
    assert etag1 is not None

    response2 = client.get("/api/compare-algorithms", headers={"if-none-match": etag1})
    assert response2.status_code == 304


def test_performance_stats_endpoint(client):
    response = client.get("/api/performance/stats")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "recent" in data
    assert "slow_operations" in data


def test_etag_format(client):
    response = client.get("/api/algorithms")
    etag = response.headers.get("etag")
    assert etag is not None
    assert etag.startswith('"')
    assert etag.endswith('"')
    assert len(etag) == 34  # MD5 hex = 32 chars + 2 quotes

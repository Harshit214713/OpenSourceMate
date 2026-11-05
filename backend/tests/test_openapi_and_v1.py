import pytest
import httpx
import asyncio
from fastapi.testclient import TestClient

from app.main import app
from app.services.github_service import cache

client = TestClient(app)


def test_openapi_schema_specification():
    """Verify OpenAPI 3.0+ schema contains all metadata, tags, and endpoints."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()

    assert schema["openapi"].startswith("3.")
    assert schema["info"]["title"] == "OpenSourceMate API"
    assert schema["info"]["version"] == "1.0.0"
    assert "OpenSourceMate Team" in schema["info"]["contact"]["name"]

    tags = {t["name"] for t in schema.get("tags", [])}
    for expected_tag in ["Health", "GitHub", "Matching", "Issues", "AI"]:
        assert expected_tag in tags


def test_openapi_docs_ui_rendered():
    """Verify both Swagger UI and ReDoc render documentation successfully."""
    swagger_res = client.get("/docs")
    assert swagger_res.status_code == 200
    assert "swagger" in swagger_res.text.lower() or "openapi" in swagger_res.text.lower()

    redoc_res = client.get("/redoc")
    assert redoc_res.status_code == 200
    assert "redoc" in redoc_res.text.lower()


def test_v1_health_endpoints():
    """Verify /api/v1/health and /api/v1/health/diagnostics endpoints."""
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    assert res.json()["version"] == "0.1.0"

    res_diag = client.get("/api/v1/health/diagnostics")
    assert res_diag.status_code == 200
    diag = res_diag.json()
    assert "github" in diag
    assert "cache" in diag


def test_legacy_health_endpoints_backward_compatible():
    """Verify legacy /api/health paths continue to function seamlessly."""
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    res_slash = client.get("/api/health/")
    assert res_slash.status_code == 200
    assert res_slash.json()["status"] == "healthy"


def test_v1_route_registration_in_schema():
    """Verify all functional endpoints are registered under /api/v1/ in OpenAPI schema."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json().get("paths", {})

    expected_v1_endpoints = [
        "/api/v1/health",
        "/api/v1/health/diagnostics",
        "/api/v1/github/users/{username}",
        "/api/v1/github/users/{username}/skills",
        "/api/v1/github/users/{username}/repositories",
        "/api/v1/matching/users/{username}/issues",
        "/api/v1/issues/search",
        "/api/v1/ai/analyze-issue",
    ]

    for endpoint in expected_v1_endpoints:
        assert endpoint in paths, f"Expected endpoint {endpoint} not found in OpenAPI paths"


def test_legacy_routes_work_identically_to_v1(github_mock):
    """Verify both /api/v1/github/... and /api/github/... route requests correctly."""
    user_payload = {
        "login": "testuser",
        "name": "Test User",
        "bio": "Developer",
        "avatar_url": "https://avatars.githubusercontent.com/u/123",
        "public_repos": 10,
        "followers": 5,
        "following": 2,
        "html_url": "https://github.com/testuser",
        "location": "Earth",
        "company": "OpenSource",
        "blog": "https://example.com",
    }

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=user_payload)

    github_mock(handler)
    cache.clear()

    # Call via v1 prefix
    v1_res = client.get("/api/v1/github/users/testuser")
    assert v1_res.status_code == 200
    assert v1_res.json()["username"] == "testuser"

    # Call via legacy prefix
    legacy_res = client.get("/api/github/users/testuser")
    assert legacy_res.status_code == 200
    assert legacy_res.json()["username"] == "testuser"

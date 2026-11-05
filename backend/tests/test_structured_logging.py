import json
import logging
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.utils.logging import (
    StructuredJsonFormatter,
    get_logger,
    request_id_ctx,
    sanitize_sensitive_data,
)


@pytest.fixture
def client():
    return TestClient(app)


def test_request_id_generated_and_returned_in_headers(client):
    """Verify that requests without X-Request-ID receive a generated UUID in response header."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    req_id = response.headers["x-request-id"]
    assert len(req_id) >= 16


def test_incoming_request_id_preserved_in_headers(client):
    """Verify that a client-supplied X-Request-ID is preserved and propagated."""
    custom_id = "custom-test-request-id-12345"
    response = client.get("/api/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("x-request-id") == custom_id


def test_structured_json_formatter_outputs_valid_json():
    """Verify StructuredJsonFormatter outputs valid JSON containing standard fields."""
    formatter = StructuredJsonFormatter()
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname=__file__,
        lineno=42,
        msg="Test structured log message",
        args=(),
        exc_info=None,
    )
    request_id_ctx.set("ctx-req-abc-999")
    record.structured_data = {
        "event": "user_action",
        "username": "octocat",
        "github_token": "ghp_secretTokenValue12345678",
    }

    formatted = formatter.format(record)
    parsed = json.loads(formatted)

    assert parsed["level"] == "INFO"
    assert parsed["message"] == "Test structured log message"
    assert parsed["logger"] == "test_logger"
    assert parsed["request_id"] == "ctx-req-abc-999"
    assert parsed["event"] == "user_action"
    assert parsed["username"] == "octocat"
    # Token must be redacted
    assert parsed["github_token"] == "[REDACTED]"


def test_sanitize_sensitive_data():
    """Verify token and authorization sanitization across nested structures."""
    payload = {
        "user": "alice",
        "authorization": "Bearer secret_jwt_token_here",
        "nested": {
            "token": "ghp_xyz1234567890abcdef",
            "api_key": "ai-key-secret",
            "safe_field": "visible_value",
        },
        "list_items": [
            {"token": "secret"},
            "Bearer ghp_token_in_string_123456",
            "normal string",
        ],
    }

    sanitized = sanitize_sensitive_data(payload)

    assert sanitized["user"] == "alice"
    assert sanitized["authorization"] == "[REDACTED]"
    assert sanitized["nested"]["token"] == "[REDACTED]"
    assert sanitized["nested"]["api_key"] == "[REDACTED]"
    assert sanitized["nested"]["safe_field"] == "visible_value"
    assert sanitized["list_items"][0]["token"] == "[REDACTED]"
    assert "[REDACTED_TOKEN]" in sanitized["list_items"][1]
    assert sanitized["list_items"][2] == "normal string"


def test_middleware_logs_request_and_response(caplog):
    """Verify StructuredLoggingMiddleware logs request start and completion with request id."""
    with caplog.at_level(logging.INFO):
        client = TestClient(app)
        res = client.get("/api/health", headers={"X-Request-ID": "test-log-flow-id"})
        assert res.status_code == 200

    messages = [rec.message for rec in caplog.records]
    assert any("Incoming request GET /api/health" in m for m in messages)
    assert any("Completed GET /api/health with status 200" in m for m in messages)

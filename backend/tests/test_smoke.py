"""Smoke test to verify pytest scaffolding loads the FastAPI app."""

from __future__ import annotations


def test_health_endpoint(client) -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

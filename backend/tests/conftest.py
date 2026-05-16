"""Shared pytest fixtures for backend tests.

Strategy:
- We avoid hitting real Supabase by injecting a fake admin client via FastAPI
  dependency overrides on `app.services.supabase.get_supabase_admin`.
- JWT verification is bypassed by overriding `app.dependencies.get_current_user`
  for endpoints that require auth. The fixture lets each test specify the user
  payload (sub / app_metadata.role).
- Settings env vars are populated with dummy values so `Settings()` does not
  raise on import.
"""

from __future__ import annotations

import os
from collections.abc import Callable, Iterator
from dataclasses import dataclass, field
from typing import Any
from unittest.mock import MagicMock

import pytest

# Ensure pydantic-settings does not blow up when the app module is imported.
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "dummy-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "dummy-jwt-secret")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("ENVIRONMENT", "development")


@dataclass
class FakeQuery:
    """Chainable fake Supabase query builder.

    Records the table name + each method invocation so tests can assert the
    BFF called Supabase with the expected arguments. `.execute()` returns a
    pre-set response that the test installs via `FakeSupabaseAdmin.set_response`.
    """

    table_name: str
    parent: "FakeSupabaseAdmin"
    calls: list[tuple[str, tuple[Any, ...], dict[str, Any]]] = field(default_factory=list)

    def _record(self, name: str, *args: Any, **kwargs: Any) -> "FakeQuery":
        self.calls.append((name, args, kwargs))
        return self

    # Read-side
    def select(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("select", *args, **kwargs)

    def eq(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("eq", *args, **kwargs)

    def in_(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("in_", *args, **kwargs)

    def order(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("order", *args, **kwargs)

    def limit(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("limit", *args, **kwargs)

    def range(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("range", *args, **kwargs)

    # Write-side
    def insert(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("insert", *args, **kwargs)

    def update(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("update", *args, **kwargs)

    def upsert(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("upsert", *args, **kwargs)

    def delete(self, *args: Any, **kwargs: Any) -> "FakeQuery":
        return self._record("delete", *args, **kwargs)

    def execute(self) -> Any:
        # Resolve the response based on the recorded operations on this table.
        response = self.parent.resolve_response(self.table_name, self.calls)
        # Track the executed query for assertions.
        self.parent.executed.append(
            {
                "table": self.table_name,
                "calls": list(self.calls),
            }
        )
        return response


class FakeSupabaseResponse:
    """Mimic supabase-py response object."""

    def __init__(self, data: Any) -> None:
        self.data = data


class FakeSupabaseAdmin:
    """Drop-in replacement for `get_supabase_admin()`.

    Tests configure expected responses by table name and (optionally) by the
    chained operation type (e.g. (table, "update")). The first matching pattern
    wins.
    """

    def __init__(self) -> None:
        # key: (table_name, op or "*"). value: data to return on .execute()
        self._responses: dict[tuple[str, str], Any] = {}
        self.executed: list[dict[str, Any]] = []

    def set_response(self, table: str, data: Any, *, op: str = "*") -> None:
        self._responses[(table, op)] = data

    def resolve_response(
        self, table: str, calls: list[tuple[str, tuple[Any, ...], dict[str, Any]]]
    ) -> FakeSupabaseResponse:
        # Find the dominant op (insert/update/upsert/delete/select).
        op_priority = ("insert", "update", "upsert", "delete", "select")
        op_seen: str | None = None
        for name, _, _ in calls:
            if name in op_priority:
                op_seen = name
                break
        if op_seen and (table, op_seen) in self._responses:
            return FakeSupabaseResponse(self._responses[(table, op_seen)])
        if (table, "*") in self._responses:
            return FakeSupabaseResponse(self._responses[(table, "*")])
        return FakeSupabaseResponse([])

    def table(self, name: str) -> FakeQuery:
        return FakeQuery(name, self)


@pytest.fixture()
def fake_admin() -> FakeSupabaseAdmin:
    return FakeSupabaseAdmin()


@pytest.fixture()
def app_with_overrides(fake_admin: FakeSupabaseAdmin):
    """Yield the FastAPI app with `get_supabase_admin` overridden.

    Auth overrides are applied per-test through `override_user` fixture.
    """
    from app.main import app
    from app.services.supabase import get_supabase_admin

    app.dependency_overrides[get_supabase_admin] = lambda: fake_admin
    yield app
    app.dependency_overrides.clear()


@pytest.fixture()
def client(app_with_overrides) -> Iterator[Any]:
    """FastAPI TestClient bound to the override-equipped app."""
    from fastapi.testclient import TestClient

    with TestClient(app_with_overrides) as c:
        yield c


@pytest.fixture()
def override_user(app_with_overrides) -> Callable[[dict[str, Any]], None]:
    """Install a fake `get_current_user` returning the given JWT payload.

    Usage:
        override_user({"sub": "user-1", "app_metadata": {"role": "maker"}})
    """
    from app.dependencies import get_current_user

    def _install(payload: dict[str, Any]) -> None:
        app_with_overrides.dependency_overrides[get_current_user] = lambda: payload

    return _install


@pytest.fixture()
def maker_user(override_user) -> dict[str, Any]:
    payload = {"sub": "11111111-1111-1111-1111-111111111111", "app_metadata": {"role": "maker"}}
    override_user(payload)
    return payload


@pytest.fixture()
def farmer_user(override_user) -> dict[str, Any]:
    payload = {"sub": "22222222-2222-2222-2222-222222222222", "app_metadata": {"role": "farmer"}}
    override_user(payload)
    return payload


@pytest.fixture()
def unassigned_user(override_user) -> dict[str, Any]:
    payload = {"sub": "33333333-3333-3333-3333-333333333333", "app_metadata": {"role": "unassigned"}}
    override_user(payload)
    return payload


@pytest.fixture()
def patch_admin_in_router(monkeypatch: pytest.MonkeyPatch, fake_admin: FakeSupabaseAdmin):
    """Helper to patch `get_supabase_admin` inside a router module path.

    Some routers import `get_supabase_admin` directly; FastAPI dependency
    override only catches `Depends(...)` injections. For those, monkeypatch the
    module attribute.
    """

    def _apply(module_path: str) -> None:
        monkeypatch.setattr(
            f"{module_path}.get_supabase_admin", lambda: fake_admin
        )

    return _apply


__all__ = [
    "FakeSupabaseAdmin",
    "FakeSupabaseResponse",
    "MagicMock",
    "fake_admin",
    "client",
    "app_with_overrides",
    "override_user",
    "maker_user",
    "farmer_user",
    "unassigned_user",
    "patch_admin_in_router",
]

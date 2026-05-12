"""Phase 16 test scaffolding.

- FastAPI TestClient + JWT mock fixtures
- Supabase admin client は in-memory fake に差し替え
  (実 Supabase に接続せず、router のロジック分岐を検証する)

Phase 17 と並列で整備するため、本 conftest は **将来の追加 fixture が
他 router にも適用できる構造** にしておく (例: fake_supabase は articles
など他 router でも再利用可能)。
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Callable

import pytest

# backend/ を sys.path に追加 (uv run pytest 時に backend/app を解決させる)
BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# 設定値が必須のため、テストモジュール import より先にダミーをセット
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("ENVIRONMENT", "development")

from fastapi.testclient import TestClient  # noqa: E402

from app.auth import jwt as jwt_module  # noqa: E402
from app.dependencies import get_current_user  # noqa: E402
from app.main import app  # noqa: E402
from app.services import supabase as supabase_module  # noqa: E402


# ----- JWT fixtures -----


def _build_payload(
    *, sub: str, role: str | None, aud: str = "authenticated"
) -> dict[str, Any]:
    payload: dict[str, Any] = {"sub": sub, "aud": aud}
    if role is not None:
        payload["app_metadata"] = {"role": role}
    else:
        payload["app_metadata"] = {}
    return payload


@pytest.fixture
def make_jwt_user() -> Callable[..., dict[str, Any]]:
    """テスト用に固定 sub / role を持つ JWT payload dict を生成する factory."""

    def _make(
        sub: str = "00000000-0000-0000-0000-000000000001",
        role: str | None = "farmer",
    ) -> dict[str, Any]:
        return _build_payload(sub=sub, role=role)

    return _make


@pytest.fixture
def auth_override(make_jwt_user):
    """get_current_user dependency を payload で上書きする helper.

    使い方:
        with auth_override(role="farmer", sub="..."):
            client.post(...)
    """
    from contextlib import contextmanager

    @contextmanager
    def _override(
        role: str | None = "farmer",
        sub: str = "00000000-0000-0000-0000-000000000001",
    ):
        payload = make_jwt_user(sub=sub, role=role)

        def _fake_get_current_user() -> dict[str, Any]:
            return payload

        app.dependency_overrides[get_current_user] = _fake_get_current_user
        try:
            yield payload
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    return _override


# ----- Supabase fake -----


class FakeQuery:
    """supabase-py の query chain を最小限模倣する in-memory ドライバ.

    Phase 16 のお気に入り CRUD で使う API のみを実装:
      .select / .insert / .update / .delete / .eq / .order / .limit /
      .range / .single / .execute / .in_

    各 router が必要に応じて拡張する想定。テスト本体で
    `fake_supabase.set_table(...)` を呼んでデータを差し込み、
    `fake_supabase.fail_next("23505 duplicate key value")` 等で
    失敗注入も可能。
    """

    def __init__(self, parent: "FakeSupabase", table: str):
        self._parent = parent
        self._table = table
        self._select_cols: str | None = None
        self._filters: list[tuple[str, str, Any]] = []
        self._order: tuple[str, bool] | None = None
        self._limit: int | None = None
        self._range: tuple[int, int] | None = None
        self._action: str | None = None
        self._payload: Any = None
        self._count_mode: str | None = None
        self._in: tuple[str, list[Any]] | None = None

    def select(self, cols: str = "*", count: str | None = None) -> "FakeQuery":
        self._select_cols = cols
        self._action = self._action or "select"
        self._count_mode = count
        return self

    def insert(self, payload: Any) -> "FakeQuery":
        self._action = "insert"
        self._payload = payload
        return self

    def update(self, payload: Any) -> "FakeQuery":
        self._action = "update"
        self._payload = payload
        return self

    def delete(self) -> "FakeQuery":
        self._action = "delete"
        return self

    def eq(self, col: str, val: Any) -> "FakeQuery":
        self._filters.append((col, "eq", val))
        return self

    def in_(self, col: str, vals: list[Any]) -> "FakeQuery":
        self._in = (col, vals)
        return self

    def order(self, col: str, desc: bool = False) -> "FakeQuery":
        self._order = (col, desc)
        return self

    def limit(self, n: int) -> "FakeQuery":
        self._limit = n
        return self

    def range(self, start: int, end: int) -> "FakeQuery":
        self._range = (start, end)
        return self

    def single(self) -> "FakeQuery":
        self._limit = 1
        return self

    def execute(self):  # noqa: D401 - mimic supabase-py
        return self._parent._execute(self)


class _FakeResponse:
    def __init__(self, data: list[dict[str, Any]] | None, count: int | None = None):
        self.data = data
        self.count = count


class FakeSupabase:
    """テスト全体で共有する in-memory Supabase admin スタブ."""

    def __init__(self) -> None:
        self._tables: dict[str, list[dict[str, Any]]] = {}
        self._fail_messages: list[str] = []

    # ---- helpers -------------------------------------------------

    def set_table(self, name: str, rows: list[dict[str, Any]]) -> None:
        self._tables[name] = [dict(r) for r in rows]

    def get_table(self, name: str) -> list[dict[str, Any]]:
        return self._tables.setdefault(name, [])

    def fail_next(self, message: str) -> None:
        """次の execute() を例外で失敗させる (UNIQUE 違反シミュレーションなど)."""
        self._fail_messages.append(message)

    # ---- supabase-py 互換 API ------------------------------------

    def table(self, name: str) -> FakeQuery:
        return FakeQuery(self, name)

    # ---- 内部 -----------------------------------------------------

    def _execute(self, q: FakeQuery) -> _FakeResponse:
        if self._fail_messages:
            msg = self._fail_messages.pop(0)
            raise RuntimeError(msg)

        rows = self.get_table(q._table)

        def _match(row: dict[str, Any]) -> bool:
            for col, _, val in q._filters:
                if str(row.get(col)) != str(val):
                    return False
            if q._in is not None:
                col, vals = q._in
                if row.get(col) not in vals:
                    return False
            return True

        if q._action == "insert":
            payload = q._payload
            new_rows = payload if isinstance(payload, list) else [payload]
            inserted: list[dict[str, Any]] = []
            for r in new_rows:
                # UNIQUE 制約模倣: テストで明示的に fail_next で表現するが、
                # user_favorites は (user_id, product_id) UNIQUE を簡易チェック
                if q._table == "user_favorites":
                    for existing in rows:
                        if (
                            existing.get("user_id") == r.get("user_id")
                            and existing.get("product_id") == r.get("product_id")
                        ):
                            raise RuntimeError(
                                "23505 duplicate key value violates unique constraint"
                            )
                full = dict(r)
                full.setdefault("id", f"fav-{len(rows) + len(inserted) + 1}")
                full.setdefault("created_at", "2026-05-11T00:00:00+00:00")
                full.setdefault("updated_at", "2026-05-11T00:00:00+00:00")
                rows.append(full)
                inserted.append(full)
            return _FakeResponse(data=inserted)

        if q._action == "update":
            updated = []
            for row in rows:
                if _match(row):
                    row.update(q._payload)
                    row["updated_at"] = "2026-05-11T01:00:00+00:00"
                    updated.append(row)
            return _FakeResponse(data=updated)

        if q._action == "delete":
            kept: list[dict[str, Any]] = []
            removed: list[dict[str, Any]] = []
            for row in rows:
                if _match(row):
                    removed.append(row)
                else:
                    kept.append(row)
            self._tables[q._table] = kept
            return _FakeResponse(data=removed)

        # select
        matched = [row for row in rows if _match(row)]
        if q._order is not None:
            col, desc = q._order
            matched.sort(key=lambda r: (r.get(col) or ""), reverse=desc)
        if q._range is not None:
            start, end = q._range
            matched = matched[start : end + 1]
        if q._limit is not None:
            matched = matched[: q._limit]
        return _FakeResponse(data=matched, count=len(matched))


@pytest.fixture
def fake_supabase(monkeypatch) -> FakeSupabase:
    """get_supabase_admin を in-memory fake に差し替える.

    各 router が `from app.services.supabase import get_supabase_admin`
    で名前束縛しているため、router モジュール側の binding も差し替える
    必要がある。Phase 16 で触る router を網羅し、Phase 17 以降の他 router
    も同様に追記する想定。
    """
    fake = FakeSupabase()
    monkeypatch.setattr(supabase_module, "get_supabase_admin", lambda: fake)

    # 各 router 側の名前束縛を差し替える (import 時に評価済みのため)
    from app.routers import (  # noqa: PLC0415 - test only
        articles as articles_mod,
        me as me_mod,
        me_favorites as me_favorites_mod,
        products as products_mod,
    )

    for mod in (articles_mod, me_mod, me_favorites_mod, products_mod):
        if hasattr(mod, "get_supabase_admin"):
            monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake)

    return fake


# ----- TestClient -----


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def _stub_jwks(monkeypatch):
    """verify_jwt が外部 JWKS を取りに行かないよう常に None 返却にする.

    auth_override 経由の dependency 上書きを使うテストでは verify_jwt は
    呼ばれないが、Authorization header 無しでの 401 検証など素通りパスでも
    安全に動かすためのガード。
    """

    def _stub(_token: str) -> None:
        return None

    monkeypatch.setattr(jwt_module, "verify_jwt", _stub)

"""Sprint 1: events router endpoint tests.

spec: docs/specs/events-v1.md §9 Sprint 1 受入基準
ADR-0010: 講演会機能 v1 採用

We swap `app.routers.events.get_supabase_admin` with a fake fluent client
so we can both verify response shape AND check the BFF called Supabase with
the expected filters (status='published', host status='active' post-filter,
cancelled_at IS NULL aggregation, etc.).

カバー範囲:
- GET /v1/events 公開一覧 (published のみ / draft 除外 / host non-active 除外)
- GET /v1/events/{id} (200 / 404 event_not_found / 404 event_not_published)
- POST /v1/events/{id}/register (401 / 403 maker / 201 reviewer / 409
  already_registered / 409 event_full / 404 event_not_found)
- DELETE /v1/events/{id}/register (204 / 404 not_registered)
"""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime
from typing import Any
from unittest.mock import MagicMock

import pytest


# ---- fluent fake -------------------------------------------------------------


class _FluentQuery:
    """Fake supabase-py query builder.

    Designed to support every chain method used in events.py:
    select / eq / in_ / gte / is_ / order / limit / range / insert / update /
    delete / execute, plus an attribute `count` on the response.
    """

    def __init__(
        self,
        data: list[dict[str, Any]] | None = None,
        count: int | None = None,
        raise_on_execute: Exception | None = None,
        captured_inserts: list[dict[str, Any]] | None = None,
        captured_updates: list[dict[str, Any]] | None = None,
    ) -> None:
        self.data = data or []
        self._count = count
        self._raise = raise_on_execute
        self.calls: list[tuple[str, tuple, dict]] = []
        self._insert_payload: dict[str, Any] | None = None
        self._update_payload: dict[str, Any] | None = None
        self._captured_inserts = (
            captured_inserts if captured_inserts is not None else []
        )
        self._captured_updates = (
            captured_updates if captured_updates is not None else []
        )

    def _record(self, name: str, *args: Any, **kwargs: Any) -> "_FluentQuery":
        self.calls.append((name, args, kwargs))
        return self

    def select(self, *a, **kw):
        return self._record("select", *a, **kw)

    def eq(self, *a, **kw):
        return self._record("eq", *a, **kw)

    def in_(self, *a, **kw):
        return self._record("in_", *a, **kw)

    def gte(self, *a, **kw):
        return self._record("gte", *a, **kw)

    def lte(self, *a, **kw):
        return self._record("lte", *a, **kw)

    def is_(self, *a, **kw):
        return self._record("is_", *a, **kw)

    def order(self, *a, **kw):
        return self._record("order", *a, **kw)

    def limit(self, *a, **kw):
        return self._record("limit", *a, **kw)

    def range(self, *a, **kw):
        return self._record("range", *a, **kw)

    def insert(self, payload, *a, **kw):
        self._insert_payload = payload
        self._captured_inserts.append(payload)
        return self._record("insert", payload, *a, **kw)

    def update(self, payload, *a, **kw):
        self._update_payload = payload
        self._captured_updates.append(payload)
        return self._record("update", payload, *a, **kw)

    def delete(self, *a, **kw):
        return self._record("delete", *a, **kw)

    def execute(self) -> Any:
        if self._raise is not None:
            raise self._raise
        result = MagicMock()
        result.data = self.data
        result.count = self._count
        return result


class _StubAdmin:
    """Configurable stub: per (table, op) response."""

    def __init__(self) -> None:
        # (table, op) -> dict with keys "data" / "count" / "raise"
        self._configs: dict[tuple[str, str], dict[str, Any]] = {}
        self.queries: list[tuple[str, _FluentQuery]] = []
        self.captured_inserts: dict[str, list[dict[str, Any]]] = {}
        self.captured_updates: dict[str, list[dict[str, Any]]] = {}

    def set_table(
        self,
        name: str,
        data: list[dict[str, Any]] | None = None,
        *,
        op: str = "*",
        count: int | None = None,
        raise_on_execute: Exception | None = None,
    ) -> None:
        self._configs[(name, op)] = {
            "data": data or [],
            "count": count,
            "raise": raise_on_execute,
        }

    def table(self, name: str) -> _FluentQuery:
        # Determine which op the test is configuring; default "*" if unset
        # We need to choose at execute time, so wrap in a lazy resolver.
        captured_inserts = self.captured_inserts.setdefault(name, [])
        captured_updates = self.captured_updates.setdefault(name, [])

        # Resolve the config eagerly using "*" first; switch later via __getattr__
        # is fragile, so we instead post-resolve at execute. Simpler: build a
        # tiny dispatcher that inspects q.calls to pick op.
        q = _FluentQuery(
            captured_inserts=captured_inserts,
            captured_updates=captured_updates,
        )

        def _resolve_execute(self_q: _FluentQuery = q):
            op_priority = ("insert", "update", "delete", "select")
            op_seen = None
            for cname, _, _ in self_q.calls:
                if cname in op_priority:
                    op_seen = cname
                    break
            cfg = (
                self._configs.get((name, op_seen or "*"))
                if op_seen
                else None
            )
            if cfg is None:
                cfg = self._configs.get((name, "*"), {"data": [], "count": None, "raise": None})
            self_q.data = cfg["data"]
            self_q._count = cfg["count"]
            self_q._raise = cfg["raise"]
            # Now call the real execute()
            return _FluentQuery.execute(self_q)

        q.execute = _resolve_execute  # type: ignore[method-assign]
        self.queries.append((name, q))
        return q


@pytest.fixture
def events_admin(monkeypatch) -> _StubAdmin:
    """Install a stub admin into app.routers.events."""
    from app.routers import events as events_mod

    admin = _StubAdmin()
    monkeypatch.setattr(events_mod, "get_supabase_admin", lambda: admin)
    return admin


@pytest.fixture
def override_user(app_with_overrides):
    """Install a fake `get_current_user` returning the given JWT payload.

    Returns a context manager (preferred for scoping) and a plain installer.
    """
    from app.dependencies import get_current_user

    @contextmanager
    def _ctx(*, role: str, sub: str):
        payload = {"sub": sub, "app_metadata": {"role": role}}
        app_with_overrides.dependency_overrides[get_current_user] = (
            lambda: payload
        )
        try:
            yield payload
        finally:
            app_with_overrides.dependency_overrides.pop(get_current_user, None)

    return _ctx


# ---- ids --------------------------------------------------------------------

HOST_MAKER = "11111111-1111-1111-1111-111111111111"
HOST_INACTIVE = "11111111-1111-1111-1111-1111111111aa"
REVIEWER_FARMER = "22222222-2222-2222-2222-222222222222"
REVIEWER_JA = "22222222-2222-2222-2222-2222222222ab"
MAKER_USER = "33333333-3333-3333-3333-333333333333"
EVENT_PUBLISHED = "44444444-4444-4444-4444-444444444401"
EVENT_DRAFT = "44444444-4444-4444-4444-444444444402"
EVENT_FULL = "44444444-4444-4444-4444-444444444403"
EVENT_NOT_EXIST = "44444444-4444-4444-4444-4444444444ff"
REG_ID_1 = "55555555-5555-5555-5555-555555555501"


def _published_event_row(
    event_id: str = EVENT_PUBLISHED,
    *,
    capacity: int | None = None,
    host_status: str | None = "active",
    body: str | None = "本文",
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "id": event_id,
        "host_user_id": HOST_MAKER,
        "host_type": "maker",
        "title": "オンライン講演会",
        "venue": None,
        "online_url": "https://example.test/zoom",
        "starts_at": "2026-06-01T10:00:00+00:00",
        "ends_at": "2026-06-01T12:00:00+00:00",
        "capacity": capacity,
        "status": "published",
        "users": {
            "id": HOST_MAKER,
            "name": "Acme Bio",
            "status": host_status,
            "maker_profiles": {
                "company_name": "Acme Bio Inc.",
                "prefecture": "北海道",
                "city": "札幌市",
            },
        },
    }
    if body is not None:
        row["body"] = body
    return row


# ---- GET /v1/events ---------------------------------------------------------


class TestListEvents:
    def test_returns_only_published_with_active_host(
        self, client, events_admin
    ):
        events_admin.set_table(
            "events",
            [
                _published_event_row(EVENT_PUBLISHED, host_status="active"),
                # draft は BFF の status='published' フィルタで除外されるが、
                # ここでは Stub 側で表現できないので published のみ返す前提
            ],
        )
        events_admin.set_table("event_registrations", [], count=0)

        res = client.get("/v1/events")
        assert res.status_code == 200, res.text
        body = res.json()
        assert len(body["events"]) == 1
        e = body["events"][0]
        assert e["id"] == EVENT_PUBLISHED
        assert e["host"]["display_name"] == "Acme Bio Inc."
        assert e["host"]["host_type"] == "maker"
        assert e["active_registration_count"] == 0
        assert e["status"] == "published"

    def test_excludes_events_when_host_status_not_active(
        self, client, events_admin
    ):
        events_admin.set_table(
            "events",
            [
                _published_event_row(EVENT_PUBLISHED, host_status="pending_review"),
            ],
        )
        events_admin.set_table("event_registrations", [], count=0)

        res = client.get("/v1/events")
        assert res.status_code == 200
        assert res.json() == {"events": []}

    def test_supabase_called_with_published_filter_and_starts_at_asc(
        self, client, events_admin
    ):
        events_admin.set_table("events", [])
        events_admin.set_table("event_registrations", [], count=0)

        client.get("/v1/events")
        events_q = next(q for name, q in events_admin.queries if name == "events")
        ops = [c[0] for c in events_q.calls]
        assert "select" in ops
        # eq("status", "published")
        eq_calls = [c for c in events_q.calls if c[0] == "eq"]
        assert any(c[1] == ("status", "published") for c in eq_calls), eq_calls
        # default upcoming_only=true → gte("starts_at", "now()")
        assert any(c[0] == "gte" for c in events_q.calls)
        # order starts_at asc
        order_calls = [c for c in events_q.calls if c[0] == "order"]
        assert any(
            c[1] == ("starts_at",) and c[2].get("desc") is False
            for c in order_calls
        )

    def test_upcoming_only_false_skips_starts_at_filter(
        self, client, events_admin
    ):
        events_admin.set_table("events", [])
        events_admin.set_table("event_registrations", [], count=0)

        client.get("/v1/events?upcoming_only=false")
        events_q = next(q for name, q in events_admin.queries if name == "events")
        assert not any(c[0] == "gte" for c in events_q.calls)

    def test_limit_too_large_returns_422(self, client, events_admin):
        res = client.get("/v1/events?limit=999")
        assert res.status_code == 422

    def test_limit_zero_returns_422(self, client, events_admin):
        res = client.get("/v1/events?limit=0")
        assert res.status_code == 422

    def test_aggregates_active_registration_count_per_event(
        self, client, events_admin
    ):
        events_admin.set_table(
            "events",
            [_published_event_row(EVENT_PUBLISHED)],
        )
        events_admin.set_table(
            "event_registrations",
            [
                {"event_id": EVENT_PUBLISHED},
                {"event_id": EVENT_PUBLISHED},
                {"event_id": EVENT_PUBLISHED},
            ],
        )

        res = client.get("/v1/events")
        assert res.status_code == 200
        events = res.json()["events"]
        assert events[0]["active_registration_count"] == 3


# ---- GET /v1/events/{id} ----------------------------------------------------


class TestGetEvent:
    def test_returns_detail_for_published(self, client, events_admin):
        events_admin.set_table(
            "events", [_published_event_row(EVENT_PUBLISHED)]
        )
        events_admin.set_table("event_registrations", [], count=0)

        res = client.get(f"/v1/events/{EVENT_PUBLISHED}")
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["id"] == EVENT_PUBLISHED
        assert body["body"] == "本文"
        assert body["host"]["display_name"] == "Acme Bio Inc."
        assert body["host"]["prefecture"] == "北海道"
        assert body["is_full"] is False
        assert body["active_registration_count"] == 0

    def test_is_full_when_capacity_reached(self, client, events_admin):
        events_admin.set_table(
            "events",
            [_published_event_row(EVENT_FULL, capacity=3)],
        )
        events_admin.set_table(
            "event_registrations", [], count=3
        )

        res = client.get(f"/v1/events/{EVENT_FULL}")
        assert res.status_code == 200
        body = res.json()
        assert body["capacity"] == 3
        assert body["active_registration_count"] == 3
        assert body["is_full"] is True

    def test_404_when_event_not_exist(self, client, events_admin):
        events_admin.set_table("events", [])

        res = client.get(f"/v1/events/{EVENT_NOT_EXIST}")
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "event_not_found"

    def test_404_event_not_published_for_draft(self, client, events_admin):
        draft_row = _published_event_row(EVENT_DRAFT)
        draft_row["status"] = "draft"
        events_admin.set_table("events", [draft_row])

        res = client.get(f"/v1/events/{EVENT_DRAFT}")
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "event_not_published"

    def test_404_when_host_not_active(self, client, events_admin):
        events_admin.set_table(
            "events",
            [_published_event_row(EVENT_PUBLISHED, host_status="frozen")],
        )

        res = client.get(f"/v1/events/{EVENT_PUBLISHED}")
        assert res.status_code == 404

    def test_invalid_uuid_returns_422(self, client, events_admin):
        res = client.get("/v1/events/not-a-uuid")
        assert res.status_code == 422


# ---- POST /v1/events/{id}/register ------------------------------------------


class TestRegisterEvent:
    def test_unauthenticated_returns_401_or_403(self, client, events_admin):
        # HTTPBearer の auto_error 動作で 401 or 403 (実装依存)
        res = client.post(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code in (401, 403)

    def test_maker_returns_403(self, client, events_admin, override_user):
        events_admin.set_table(
            "events",
            [{"id": EVENT_PUBLISHED, "status": "published", "capacity": None}],
        )
        with override_user(role="maker", sub=MAKER_USER):
            res = client.post(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 403

    def test_unassigned_returns_403(self, client, events_admin, override_user):
        with override_user(role="unassigned", sub="x"):
            res = client.post(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 403

    def test_farmer_register_succeeds_201(
        self, client, events_admin, override_user
    ):
        events_admin.set_table(
            "events",
            [{"id": EVENT_PUBLISHED, "status": "published", "capacity": None}],
        )
        events_admin.set_table(
            "event_registrations",
            [{"id": REG_ID_1, "event_id": EVENT_PUBLISHED, "user_id": REVIEWER_FARMER}],
            op="insert",
        )
        with override_user(role="farmer", sub=REVIEWER_FARMER):
            res = client.post(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 201, res.text
        body = res.json()
        assert body["ok"] is True
        assert body["registration_id"] == REG_ID_1

        # JWT.sub が user_id として書かれていること
        inserts = events_admin.captured_inserts.get("event_registrations", [])
        assert inserts and inserts[0]["user_id"] == REVIEWER_FARMER
        assert inserts[0]["event_id"] == EVENT_PUBLISHED

    def test_ja_staff_can_register(self, client, events_admin, override_user):
        events_admin.set_table(
            "events",
            [{"id": EVENT_PUBLISHED, "status": "published", "capacity": None}],
        )
        events_admin.set_table(
            "event_registrations",
            [{"id": REG_ID_1, "event_id": EVENT_PUBLISHED, "user_id": REVIEWER_JA}],
            op="insert",
        )
        with override_user(role="ja_staff", sub=REVIEWER_JA):
            res = client.post(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 201

    def test_event_not_found_returns_404(
        self, client, events_admin, override_user
    ):
        events_admin.set_table("events", [])
        with override_user(role="farmer", sub=REVIEWER_FARMER):
            res = client.post(f"/v1/events/{EVENT_NOT_EXIST}/register")
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "event_not_found"

    def test_draft_event_returns_404_not_published(
        self, client, events_admin, override_user
    ):
        events_admin.set_table(
            "events",
            [{"id": EVENT_DRAFT, "status": "draft", "capacity": None}],
        )
        with override_user(role="farmer", sub=REVIEWER_FARMER):
            res = client.post(f"/v1/events/{EVENT_DRAFT}/register")
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "event_not_published"

    def test_capacity_full_returns_409(
        self, client, events_admin, override_user
    ):
        events_admin.set_table(
            "events",
            [{"id": EVENT_FULL, "status": "published", "capacity": 3}],
        )
        # count=3 → active_count >= capacity → 409 event_full
        events_admin.set_table(
            "event_registrations", [], count=3, op="select"
        )
        with override_user(role="farmer", sub=REVIEWER_FARMER):
            res = client.post(f"/v1/events/{EVENT_FULL}/register")
        assert res.status_code == 409
        assert res.json()["detail"]["code"] == "event_full"

    def test_duplicate_registration_returns_409(
        self, client, events_admin, override_user
    ):
        events_admin.set_table(
            "events",
            [{"id": EVENT_PUBLISHED, "status": "published", "capacity": None}],
        )
        # INSERT で UNIQUE 違反を raise
        events_admin.set_table(
            "event_registrations",
            raise_on_execute=Exception(
                'duplicate key value violates unique constraint '
                '"event_registrations_event_id_user_id_key" (23505)'
            ),
            op="insert",
        )
        with override_user(role="farmer", sub=REVIEWER_FARMER):
            res = client.post(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 409
        assert res.json()["detail"]["code"] == "already_registered"


# ---- DELETE /v1/events/{id}/register ---------------------------------------


class TestCancelRegistration:
    def test_owner_cancel_succeeds_204(
        self, client, events_admin, override_user
    ):
        events_admin.set_table(
            "event_registrations",
            [{"id": REG_ID_1, "cancelled_at": None}],
            op="select",
        )
        events_admin.set_table(
            "event_registrations",
            [{"id": REG_ID_1, "cancelled_at": "2026-05-14T00:00:00Z"}],
            op="update",
        )
        with override_user(role="farmer", sub=REVIEWER_FARMER):
            res = client.delete(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 204
        updates = events_admin.captured_updates.get("event_registrations", [])
        assert updates and "cancelled_at" in updates[0]
        # cancelled_at は PostgREST に渡す前に Python 側で ISO 8601 文字列に
        # 確定済みであること (literal "now()" は timestamptz の不正入力)。
        cancelled_at = updates[0]["cancelled_at"]
        assert isinstance(cancelled_at, str)
        assert cancelled_at != "now()"
        # ISO 8601 として parse 可能 (tz 付き)
        parsed = datetime.fromisoformat(cancelled_at)
        assert parsed.tzinfo is not None

    def test_no_registration_returns_404(
        self, client, events_admin, override_user
    ):
        events_admin.set_table("event_registrations", [], op="select")
        with override_user(role="farmer", sub=REVIEWER_FARMER):
            res = client.delete(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "not_registered"

    def test_already_cancelled_returns_404(
        self, client, events_admin, override_user
    ):
        events_admin.set_table(
            "event_registrations",
            [
                {
                    "id": REG_ID_1,
                    "cancelled_at": "2026-05-10T00:00:00Z",
                }
            ],
            op="select",
        )
        with override_user(role="farmer", sub=REVIEWER_FARMER):
            res = client.delete(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "not_registered"

    def test_maker_cannot_cancel(self, client, events_admin, override_user):
        with override_user(role="maker", sub=MAKER_USER):
            res = client.delete(f"/v1/events/{EVENT_PUBLISHED}/register")
        assert res.status_code == 403

"""Sprint 2: maker_events router endpoint tests.

spec: docs/specs/events-v1.md §9 Sprint 2 受入基準
ADR-0010: 講演会機能 v1 採用

カバー範囲:
- role guard: maker のみ通る、その他 403
- host_user_id=JWT.sub による自社 event 限定 (他社 403 event_not_owner)
- 存在しない event は 404 event_not_found
- POST バリデーション: ends_at <= starts_at / venue+online_url 両方 NULL / 422
- POST status='published' 遷移時の starts_at >= now() 強制
- PATCH 部分更新の動作 + バリデーション
- DELETE は soft delete (status='cancelled') / 物理削除しない
- 申込者一覧: active_count / cancelled_count の集計正確性
- 申込者一覧: include_cancelled の挙動
"""

from __future__ import annotations

from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import MagicMock

import pytest


# ---- fluent fake (events_router と同形) ------------------------------------


class _FluentQuery:
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
    """Per-(table, op) configurable stub."""

    def __init__(self) -> None:
        self._configs: dict[tuple[str, str], list[dict[str, Any]]] = {}
        self.queries: list[tuple[str, _FluentQuery]] = []
        self.captured_inserts: dict[str, list[dict[str, Any]]] = {}
        self.captured_updates: dict[str, list[dict[str, Any]]] = {}
        # call counter per (table, op) so we can return different responses to
        # sequential calls (e.g. owned-event fetch vs status verification fetch)
        self._call_count: dict[tuple[str, str], int] = {}

    def set_table(
        self,
        name: str,
        data: list[dict[str, Any]] | None = None,
        *,
        op: str = "*",
        count: int | None = None,
        raise_on_execute: Exception | None = None,
    ) -> None:
        """登録した data はその (table, op) の全 call 共通."""
        self._configs.setdefault((name, op), []).append(
            {
                "data": data or [],
                "count": count,
                "raise": raise_on_execute,
                "shared": True,
            }
        )

    def queue_table(
        self,
        name: str,
        data: list[dict[str, Any]] | None = None,
        *,
        op: str = "*",
        count: int | None = None,
        raise_on_execute: Exception | None = None,
    ) -> None:
        """順次取り出される (1 回だけ消費される) 応答を末尾に追加."""
        self._configs.setdefault((name, op), []).append(
            {
                "data": data or [],
                "count": count,
                "raise": raise_on_execute,
                "shared": False,
            }
        )

    def table(self, name: str) -> _FluentQuery:
        captured_inserts = self.captured_inserts.setdefault(name, [])
        captured_updates = self.captured_updates.setdefault(name, [])

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
            key = (name, op_seen or "*")
            cfgs = self._configs.get(key) or self._configs.get((name, "*"))
            if not cfgs:
                cfg = {"data": [], "count": None, "raise": None}
            else:
                # pop the first non-shared (queued) config, else use the last shared one
                idx = self._call_count.get(key, 0)
                # find shared vs queued: queue items consumed in order, shared
                # items reused for subsequent calls beyond queued items
                queued = [c for c in cfgs if not c.get("shared")]
                shared = [c for c in cfgs if c.get("shared")]
                if idx < len(queued):
                    cfg = queued[idx]
                elif shared:
                    cfg = shared[-1]
                else:
                    cfg = queued[-1] if queued else {"data": [], "count": None, "raise": None}
                self._call_count[key] = idx + 1
            self_q.data = cfg["data"]
            self_q._count = cfg["count"]
            self_q._raise = cfg["raise"]
            return _FluentQuery.execute(self_q)

        q.execute = _resolve_execute  # type: ignore[method-assign]
        self.queries.append((name, q))
        return q


@pytest.fixture
def me_admin(monkeypatch) -> _StubAdmin:
    """Install a stub admin into app.routers.maker_events."""
    from app.routers import maker_events as me_mod

    admin = _StubAdmin()
    monkeypatch.setattr(me_mod, "get_supabase_admin", lambda: admin)
    return admin


@pytest.fixture
def override_user(app_with_overrides):
    """Install a fake `get_current_user` returning the given JWT payload."""
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

MAKER_A = "11111111-1111-1111-1111-1111111111aa"
MAKER_B = "11111111-1111-1111-1111-1111111111bb"
FARMER_USER = "22222222-2222-2222-2222-222222222222"
EVENT_OWN = "44444444-4444-4444-4444-444444444401"
EVENT_OTHER = "44444444-4444-4444-4444-444444444402"
EVENT_NOT_EXIST = "44444444-4444-4444-4444-4444444444ff"
USER_X = "55555555-5555-5555-5555-555555555501"
USER_Y = "55555555-5555-5555-5555-555555555502"
REG_X = "66666666-6666-6666-6666-666666666601"
REG_Y = "66666666-6666-6666-6666-666666666602"


def _future_event_row(
    *,
    event_id: str = EVENT_OWN,
    host: str = MAKER_A,
    status: str = "draft",
    capacity: int | None = None,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    return {
        "id": event_id,
        "host_user_id": host,
        "host_type": "maker",
        "title": "新製品セミナー",
        "body": "本文",
        "venue": None,
        "online_url": "https://example.test/zoom",
        "starts_at": (now + timedelta(days=7)).isoformat(),
        "ends_at": (now + timedelta(days=7, hours=2)).isoformat(),
        "capacity": capacity,
        "status": status,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }


def _create_payload(
    *,
    status: str = "draft",
    starts_at: datetime | None = None,
    ends_at: datetime | None = None,
    venue: str | None = None,
    online_url: str | None = "https://example.test/zoom",
    capacity: int | None = None,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    s = starts_at or (now + timedelta(days=7))
    e = ends_at or (s + timedelta(hours=2))
    return {
        "title": "新製品セミナー",
        "body": "本文",
        "venue": venue,
        "online_url": online_url,
        "starts_at": s.isoformat(),
        "ends_at": e.isoformat(),
        "capacity": capacity,
        "status": status,
    }


# =============================================================================
# Role guard
# =============================================================================


class TestRoleGuard:
    def test_list_unauthenticated_returns_401_or_403(self, client, me_admin):
        res = client.get("/v1/maker/events")
        assert res.status_code in (401, 403)

    def test_list_farmer_returns_403(self, client, me_admin, override_user):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.get("/v1/maker/events")
        assert res.status_code == 403

    def test_list_unassigned_returns_403(self, client, me_admin, override_user):
        with override_user(role="unassigned", sub="x"):
            res = client.get("/v1/maker/events")
        assert res.status_code == 403

    def test_create_farmer_returns_403(self, client, me_admin, override_user):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.post("/v1/maker/events", json=_create_payload())
        assert res.status_code == 403

    def test_patch_farmer_returns_403(self, client, me_admin, override_user):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.patch(f"/v1/maker/events/{EVENT_OWN}", json={"title": "x"})
        assert res.status_code == 403

    def test_delete_farmer_returns_403(self, client, me_admin, override_user):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.delete(f"/v1/maker/events/{EVENT_OWN}")
        assert res.status_code == 403

    def test_registrations_farmer_returns_403(
        self, client, me_admin, override_user
    ):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.get(f"/v1/maker/events/{EVENT_OWN}/registrations")
        assert res.status_code == 403


# =============================================================================
# GET /v1/maker/events (list)
# =============================================================================


class TestListMakerEvents:
    def test_returns_own_events_all_status(self, client, me_admin, override_user):
        draft_row = _future_event_row(event_id=EVENT_OWN, status="draft")
        cancelled_row = _future_event_row(
            event_id=EVENT_OTHER, status="cancelled"
        )
        me_admin.set_table("events", [draft_row, cancelled_row], op="select")
        me_admin.set_table("event_registrations", [], op="select")

        with override_user(role="maker", sub=MAKER_A):
            res = client.get("/v1/maker/events")
        assert res.status_code == 200, res.text
        body = res.json()
        assert len(body["events"]) == 2
        statuses = {e["status"] for e in body["events"]}
        assert statuses == {"draft", "cancelled"}

    def test_status_filter_published(self, client, me_admin, override_user):
        published_row = _future_event_row(status="published")
        me_admin.set_table("events", [published_row], op="select")
        me_admin.set_table("event_registrations", [], op="select")

        with override_user(role="maker", sub=MAKER_A):
            res = client.get("/v1/maker/events?status=published")
        assert res.status_code == 200
        body = res.json()
        assert len(body["events"]) == 1
        assert body["events"][0]["status"] == "published"

    def test_invalid_status_filter_returns_422(
        self, client, me_admin, override_user
    ):
        with override_user(role="maker", sub=MAKER_A):
            res = client.get("/v1/maker/events?status=nonsense")
        assert res.status_code == 422

    def test_supabase_called_with_host_user_id_filter(
        self, client, me_admin, override_user
    ):
        me_admin.set_table("events", [], op="select")
        me_admin.set_table("event_registrations", [], op="select")

        with override_user(role="maker", sub=MAKER_A):
            client.get("/v1/maker/events")
        events_q = next(q for name, q in me_admin.queries if name == "events")
        eq_calls = [c for c in events_q.calls if c[0] == "eq"]
        # host_user_id=MAKER_A の SQL eq が必ず付与されていること
        assert any(
            c[1] == ("host_user_id", MAKER_A) for c in eq_calls
        ), f"expected host_user_id eq with MAKER_A, got {eq_calls}"
        # order created_at desc
        order_calls = [c for c in events_q.calls if c[0] == "order"]
        assert any(
            c[1] == ("created_at",) and c[2].get("desc") is True
            for c in order_calls
        )

    def test_aggregates_active_registration_count(
        self, client, me_admin, override_user
    ):
        me_admin.set_table(
            "events",
            [_future_event_row(event_id=EVENT_OWN)],
            op="select",
        )
        me_admin.set_table(
            "event_registrations",
            [
                {"event_id": EVENT_OWN},
                {"event_id": EVENT_OWN},
            ],
            op="select",
        )

        with override_user(role="maker", sub=MAKER_A):
            res = client.get("/v1/maker/events")
        assert res.status_code == 200
        events = res.json()["events"]
        assert events[0]["active_registration_count"] == 2


# =============================================================================
# POST /v1/maker/events (create)
# =============================================================================


class TestCreateMakerEvent:
    def test_creates_draft_event_with_jwt_sub_as_host(
        self, client, me_admin, override_user
    ):
        me_admin.set_table(
            "events", [{"id": EVENT_OWN}], op="insert"
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=_create_payload())
        assert res.status_code == 201, res.text
        body = res.json()
        assert body["ok"] is True
        assert body["id"] == EVENT_OWN

        # host_user_id / host_type が JWT 由来で正しく書かれていること
        inserts = me_admin.captured_inserts.get("events", [])
        assert inserts
        assert inserts[0]["host_user_id"] == MAKER_A
        assert inserts[0]["host_type"] == "maker"
        assert inserts[0]["status"] == "draft"

    def test_payload_host_user_id_is_ignored(
        self, client, me_admin, override_user
    ):
        """payload に host_user_id を含めても無視され JWT.sub が強制される。"""
        me_admin.set_table("events", [{"id": EVENT_OWN}], op="insert")
        payload = _create_payload()
        payload["host_user_id"] = MAKER_B  # 攻撃シナリオ
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=payload)
        assert res.status_code == 201
        inserts = me_admin.captured_inserts.get("events", [])
        assert inserts[0]["host_user_id"] == MAKER_A

    def test_ends_at_before_starts_at_returns_422(
        self, client, me_admin, override_user
    ):
        now = datetime.now(timezone.utc)
        payload = _create_payload(
            starts_at=now + timedelta(days=7, hours=2),
            ends_at=now + timedelta(days=7),  # 逆転
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=payload)
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "validation_failed"

    def test_both_venue_and_online_url_null_returns_422(
        self, client, me_admin, override_user
    ):
        payload = _create_payload(venue=None, online_url=None)
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=payload)
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "validation_failed"

    def test_invalid_online_url_returns_422(
        self, client, me_admin, override_user
    ):
        payload = _create_payload(online_url="javascript:alert(1)")
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=payload)
        # Pydantic pattern バリデーション → 422
        assert res.status_code == 422

    def test_title_too_long_returns_422(self, client, me_admin, override_user):
        payload = _create_payload()
        payload["title"] = "x" * 201
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=payload)
        assert res.status_code == 422

    def test_capacity_zero_returns_422(self, client, me_admin, override_user):
        payload = _create_payload(capacity=0)
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=payload)
        assert res.status_code == 422

    def test_publishing_past_event_returns_422(
        self, client, me_admin, override_user
    ):
        now = datetime.now(timezone.utc)
        payload = _create_payload(
            status="published",
            starts_at=now - timedelta(days=1),
            ends_at=now - timedelta(days=1) + timedelta(hours=2),
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=payload)
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "validation_failed"

    def test_draft_past_event_is_allowed(
        self, client, me_admin, override_user
    ):
        """過去日 + status='draft' は許可 (履歴保存 / リハーサル用途)。"""
        now = datetime.now(timezone.utc)
        me_admin.set_table("events", [{"id": EVENT_OWN}], op="insert")
        payload = _create_payload(
            status="draft",
            starts_at=now - timedelta(days=1),
            ends_at=now - timedelta(days=1) + timedelta(hours=2),
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/events", json=payload)
        assert res.status_code == 201, res.text


# =============================================================================
# GET /v1/maker/events/{id} (detail)
# =============================================================================


class TestGetMakerEvent:
    def test_returns_own_draft_event(self, client, me_admin, override_user):
        row = _future_event_row(status="draft")
        me_admin.set_table("events", [row], op="select")
        me_admin.set_table("event_registrations", [], op="select", count=0)

        with override_user(role="maker", sub=MAKER_A):
            res = client.get(f"/v1/maker/events/{EVENT_OWN}")
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["id"] == EVENT_OWN
        assert body["status"] == "draft"
        assert body["host_user_id"] == MAKER_A
        assert body["body"] == "本文"

    def test_other_makers_event_returns_403(
        self, client, me_admin, override_user
    ):
        """host_user_id=MAKER_A で SELECT したら 0 件、続いて存在確認で 1 件返る."""
        me_admin.queue_table("events", [], op="select")  # owned fetch → empty
        me_admin.queue_table(
            "events",
            [{"host_user_id": MAKER_B}],
            op="select",
        )  # existence check → others
        with override_user(role="maker", sub=MAKER_A):
            res = client.get(f"/v1/maker/events/{EVENT_OTHER}")
        assert res.status_code == 403
        assert res.json()["detail"]["code"] == "event_not_owner"

    def test_nonexistent_event_returns_404(
        self, client, me_admin, override_user
    ):
        me_admin.queue_table("events", [], op="select")  # owned fetch → empty
        me_admin.queue_table("events", [], op="select")  # existence check → empty
        with override_user(role="maker", sub=MAKER_A):
            res = client.get(f"/v1/maker/events/{EVENT_NOT_EXIST}")
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "event_not_found"


# =============================================================================
# PATCH /v1/maker/events/{id} (update)
# =============================================================================


class TestPatchMakerEvent:
    def test_partial_update_title_only(self, client, me_admin, override_user):
        row = _future_event_row(status="draft")
        me_admin.set_table("events", [row], op="select")
        me_admin.set_table("events", [{"id": EVENT_OWN}], op="update")

        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_OWN}", json={"title": "更新後"}
            )
        assert res.status_code == 200, res.text
        updates = me_admin.captured_updates.get("events", [])
        assert updates and updates[0] == {"title": "更新後"}

    def test_publish_transition_succeeds(
        self, client, me_admin, override_user
    ):
        row = _future_event_row(status="draft")
        me_admin.set_table("events", [row], op="select")
        me_admin.set_table("events", [{"id": EVENT_OWN}], op="update")

        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_OWN}", json={"status": "published"}
            )
        assert res.status_code == 200

    def test_publish_to_cancelled_allowed(
        self, client, me_admin, override_user
    ):
        row = _future_event_row(status="published")
        me_admin.set_table("events", [row], op="select")
        me_admin.set_table("events", [{"id": EVENT_OWN}], op="update")

        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_OWN}", json={"status": "cancelled"}
            )
        assert res.status_code == 200

    def test_cancelled_to_published_allowed(
        self, client, me_admin, override_user
    ):
        """cancelled→published 遷移は v1 で許容 (取消の取消)。"""
        row = _future_event_row(status="cancelled")
        me_admin.set_table("events", [row], op="select")
        me_admin.set_table("events", [{"id": EVENT_OWN}], op="update")

        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_OWN}", json={"status": "published"}
            )
        assert res.status_code == 200

    def test_publishing_with_past_starts_at_returns_422(
        self, client, me_admin, override_user
    ):
        now = datetime.now(timezone.utc)
        row = _future_event_row(status="draft")
        row["starts_at"] = (now - timedelta(days=1)).isoformat()
        row["ends_at"] = (now - timedelta(days=1) + timedelta(hours=2)).isoformat()
        me_admin.set_table("events", [row], op="select")

        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_OWN}", json={"status": "published"}
            )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "validation_failed"

    def test_ends_before_starts_returns_422(
        self, client, me_admin, override_user
    ):
        row = _future_event_row(status="draft")
        me_admin.set_table("events", [row], op="select")

        now = datetime.now(timezone.utc)
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_OWN}",
                json={"ends_at": (now + timedelta(days=1)).isoformat()},
            )
        # 既存 starts_at は +7d なので、ends_at を +1d にすると逆転 → 422
        assert res.status_code == 422

    def test_clearing_both_venue_and_online_url_returns_422(
        self, client, me_admin, override_user
    ):
        row = _future_event_row(status="draft")
        row["venue"] = None
        row["online_url"] = "https://example.test/zoom"
        me_admin.set_table("events", [row], op="select")

        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_OWN}", json={"online_url": None}
            )
        assert res.status_code == 422

    def test_other_makers_event_patch_returns_403(
        self, client, me_admin, override_user
    ):
        me_admin.queue_table("events", [], op="select")  # owned fetch → empty
        me_admin.queue_table(
            "events",
            [{"host_user_id": MAKER_B}],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_OTHER}", json={"title": "x"}
            )
        assert res.status_code == 403
        assert res.json()["detail"]["code"] == "event_not_owner"

    def test_nonexistent_event_patch_returns_404(
        self, client, me_admin, override_user
    ):
        me_admin.queue_table("events", [], op="select")
        me_admin.queue_table("events", [], op="select")
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/events/{EVENT_NOT_EXIST}", json={"title": "x"}
            )
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "event_not_found"


# =============================================================================
# DELETE /v1/maker/events/{id} (soft delete)
# =============================================================================


class TestDeleteMakerEvent:
    def test_soft_deletes_by_setting_status_cancelled(
        self, client, me_admin, override_user
    ):
        row = _future_event_row(status="published")
        me_admin.set_table("events", [row], op="select")
        me_admin.set_table("events", [{"id": EVENT_OWN}], op="update")

        with override_user(role="maker", sub=MAKER_A):
            res = client.delete(f"/v1/maker/events/{EVENT_OWN}")
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["status"] == "cancelled"

        # 物理削除されない (delete chain は呼ばれない) こと
        events_queries = [q for name, q in me_admin.queries if name == "events"]
        delete_seen = any(
            any(c[0] == "delete" for c in q.calls) for q in events_queries
        )
        assert not delete_seen, "DELETE should be soft delete (UPDATE), not physical"

        # UPDATE payload が status='cancelled' であること
        updates = me_admin.captured_updates.get("events", [])
        assert updates and updates[0]["status"] == "cancelled"

    def test_already_cancelled_is_idempotent(
        self, client, me_admin, override_user
    ):
        row = _future_event_row(status="cancelled")
        me_admin.set_table("events", [row], op="select")
        # no update should be executed; even if executed, the test still passes
        with override_user(role="maker", sub=MAKER_A):
            res = client.delete(f"/v1/maker/events/{EVENT_OWN}")
        assert res.status_code == 200
        assert res.json()["status"] == "cancelled"

    def test_other_makers_event_delete_returns_403(
        self, client, me_admin, override_user
    ):
        me_admin.queue_table("events", [], op="select")
        me_admin.queue_table(
            "events",
            [{"host_user_id": MAKER_B}],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.delete(f"/v1/maker/events/{EVENT_OTHER}")
        assert res.status_code == 403
        assert res.json()["detail"]["code"] == "event_not_owner"


# =============================================================================
# GET /v1/maker/events/{id}/registrations
# =============================================================================


class TestListRegistrations:
    def test_default_excludes_cancelled(self, client, me_admin, override_user):
        row = _future_event_row()
        me_admin.set_table("events", [row], op="select")

        # 1 回目: limit/offset 付きの registrations select (active のみ)
        # 2 回目: cancelled_count 集計用の全件 select
        # _StubAdmin は同 (table, op) では順次 queued data を返す
        active_rows = [
            {
                "id": REG_X,
                "user_id": USER_X,
                "registered_at": "2026-05-13T10:00:00+00:00",
                "cancelled_at": None,
                "users": {"id": USER_X, "name": "山田 太郎", "role": "farmer"},
            },
        ]
        all_rows_for_count = [
            {"cancelled_at": None},
            {"cancelled_at": None},
            {"cancelled_at": "2026-05-13T11:00:00+00:00"},
        ]
        me_admin.queue_table("event_registrations", active_rows, op="select")
        me_admin.queue_table(
            "event_registrations", all_rows_for_count, op="select"
        )

        with override_user(role="maker", sub=MAKER_A):
            res = client.get(f"/v1/maker/events/{EVENT_OWN}/registrations")
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["active_count"] == 2
        assert body["cancelled_count"] == 1
        assert len(body["registrations"]) == 1
        assert body["registrations"][0]["display_name"] == "山田 太郎"
        assert body["registrations"][0]["role"] == "farmer"

        # cancelled_at IS NULL の filter が「最初の」registrations クエリに
        # 必ず付与されていること (active のみ取得)
        reg_queries = [
            q for name, q in me_admin.queries if name == "event_registrations"
        ]
        first_reg_q = reg_queries[0]
        is_calls = [c for c in first_reg_q.calls if c[0] == "is_"]
        assert any(
            c[1] == ("cancelled_at", "null") for c in is_calls
        ), f"expected cancelled_at IS NULL filter on first select, got {first_reg_q.calls}"

    def test_include_cancelled_returns_both(
        self, client, me_admin, override_user
    ):
        row = _future_event_row()
        me_admin.set_table("events", [row], op="select")

        all_rows = [
            {
                "id": REG_X,
                "user_id": USER_X,
                "registered_at": "2026-05-13T10:00:00+00:00",
                "cancelled_at": None,
                "users": {"id": USER_X, "name": "X", "role": "farmer"},
            },
            {
                "id": REG_Y,
                "user_id": USER_Y,
                "registered_at": "2026-05-12T10:00:00+00:00",
                "cancelled_at": "2026-05-13T11:00:00+00:00",
                "users": {"id": USER_Y, "name": "Y", "role": "ja_staff"},
            },
        ]
        me_admin.queue_table("event_registrations", all_rows, op="select")
        me_admin.queue_table(
            "event_registrations",
            [{"cancelled_at": None}, {"cancelled_at": "2026-05-13T11:00:00+00:00"}],
            op="select",
        )

        with override_user(role="maker", sub=MAKER_A):
            res = client.get(
                f"/v1/maker/events/{EVENT_OWN}/registrations?include_cancelled=true"
            )
        assert res.status_code == 200
        body = res.json()
        assert body["active_count"] == 1
        assert body["cancelled_count"] == 1
        assert len(body["registrations"]) == 2
        # 並びは registered_at desc 想定 (BFF が指定)
        assert body["registrations"][0]["id"] == REG_X

        # include_cancelled=true のとき cancelled_at IS NULL の filter は
        # 「最初の」registrations クエリに付与されないこと
        reg_queries = [
            q for name, q in me_admin.queries if name == "event_registrations"
        ]
        first_reg_q = reg_queries[0]
        is_calls = [c for c in first_reg_q.calls if c[0] == "is_"]
        assert not any(
            c[1] == ("cancelled_at", "null") for c in is_calls
        ), "cancelled_at IS NULL must NOT be applied when include_cancelled=true"

    def test_other_makers_registrations_return_403(
        self, client, me_admin, override_user
    ):
        me_admin.queue_table("events", [], op="select")
        me_admin.queue_table(
            "events",
            [{"host_user_id": MAKER_B}],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.get(f"/v1/maker/events/{EVENT_OTHER}/registrations")
        assert res.status_code == 403
        assert res.json()["detail"]["code"] == "event_not_owner"

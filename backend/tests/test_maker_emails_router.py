"""Sprint 3: maker_emails router endpoint tests.

spec: docs/specs/events-v1.md §9 Sprint 3 受入基準
ADR-0010: 講演会機能 v1 採用

カバー範囲:
- role guard: maker のみ通る、その他 403
- maker_user_id=JWT.sub による自社限定 (他社 403 campaign_not_owner)
- 存在しない campaign は 404 campaign_not_found
- POST バリデーション:
  - segment_type / segment_filter discriminator 不整合 → 422
  - specific_users 1001 件 → 422 (Ryoga C10)
  - specific_users 空配列 → 422
- PATCH / DELETE は draft のみ。queued/sent/failed は 409 campaign_already_queued
- send pre-flight:
  - draft 以外は 409
  - favorite_followers kind='favorite' のみ集計 (Ryoga C6)
  - event_past_attendees 自社主催のみ受理 (Ryoga C9、他社 403 event_not_owner)
  - recipient 0 件 → 422 (Ryoga C7)
  - 成功時 status='queued' / recipient_count 確定 / queued_at 記録
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Any
from unittest.mock import MagicMock

import pytest


# ---- fluent fake (maker_events と同形) ------------------------------------


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
    def __init__(self) -> None:
        self._configs: dict[tuple[str, str], list[dict[str, Any]]] = {}
        self.queries: list[tuple[str, _FluentQuery]] = []
        self.captured_inserts: dict[str, list[dict[str, Any]]] = {}
        self.captured_updates: dict[str, list[dict[str, Any]]] = {}
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
                idx = self._call_count.get(key, 0)
                queued = [c for c in cfgs if not c.get("shared")]
                shared = [c for c in cfgs if c.get("shared")]
                if idx < len(queued):
                    cfg = queued[idx]
                elif shared:
                    cfg = shared[-1]
                else:
                    cfg = (
                        queued[-1]
                        if queued
                        else {"data": [], "count": None, "raise": None}
                    )
                self._call_count[key] = idx + 1
            self_q.data = cfg["data"]
            self_q._count = cfg["count"]
            self_q._raise = cfg["raise"]
            return _FluentQuery.execute(self_q)

        q.execute = _resolve_execute  # type: ignore[method-assign]
        self.queries.append((name, q))
        return q


@pytest.fixture
def em_admin(monkeypatch) -> _StubAdmin:
    """Install a stub admin into both maker_emails and me_followed_makers."""
    from app.routers import maker_emails as em_mod
    from app.routers import me_followed_makers as fm_mod

    admin = _StubAdmin()
    monkeypatch.setattr(em_mod, "get_supabase_admin", lambda: admin)
    monkeypatch.setattr(fm_mod, "get_supabase_admin", lambda: admin)
    return admin


@pytest.fixture
def override_user(app_with_overrides):
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

CAMPAIGN_A = "77777777-7777-7777-7777-777777777701"
CAMPAIGN_OTHER = "77777777-7777-7777-7777-777777777702"
CAMPAIGN_NOT_EXIST = "77777777-7777-7777-7777-7777777777ff"

EVENT_OWN = "44444444-4444-4444-4444-444444444401"
EVENT_OTHER = "44444444-4444-4444-4444-444444444402"

PRODUCT_A1 = "55555555-5555-5555-5555-555555555501"
PRODUCT_A2 = "55555555-5555-5555-5555-555555555502"

USER_X = "66666666-6666-6666-6666-666666666601"
USER_Y = "66666666-6666-6666-6666-666666666602"
USER_Z = "66666666-6666-6666-6666-666666666603"


def _campaign_row(
    *,
    cid: str = CAMPAIGN_A,
    maker: str = MAKER_A,
    status: str = "draft",
    segment_type: str = "favorite_followers",
    segment_filter: dict | None = None,
    recipient_count: int = 0,
) -> dict[str, Any]:
    if segment_filter is None:
        if segment_type == "favorite_followers":
            segment_filter = {"segment_type": "favorite_followers"}
        elif segment_type == "event_past_attendees":
            segment_filter = {
                "segment_type": "event_past_attendees",
                "event_id": EVENT_OWN,
            }
        elif segment_type == "specific_users":
            segment_filter = {
                "segment_type": "specific_users",
                "user_ids": [USER_X],
            }
        else:
            segment_filter = {}
    return {
        "id": cid,
        "maker_user_id": maker,
        "subject": "件名",
        "body": "本文",
        "segment_type": segment_type,
        "segment_filter": segment_filter,
        "status": status,
        "recipient_count": recipient_count,
        "queued_at": None,
        "sent_at": None,
        "created_at": "2026-05-14T00:00:00+00:00",
        "updated_at": "2026-05-14T00:00:00+00:00",
    }


def _favorite_followers_payload() -> dict[str, Any]:
    return {
        "subject": "新製品のご案内",
        "body": "本文……",
        "segment_type": "favorite_followers",
        "segment_filter": {"segment_type": "favorite_followers"},
    }


# =============================================================================
# Role guard
# =============================================================================


class TestRoleGuard:
    def test_list_unauthenticated_returns_401_or_403(self, client, em_admin):
        res = client.get("/v1/maker/emails/campaigns")
        assert res.status_code in (401, 403)

    def test_list_farmer_returns_403(self, client, em_admin, override_user):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.get("/v1/maker/emails/campaigns")
        assert res.status_code == 403

    def test_create_farmer_returns_403(self, client, em_admin, override_user):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.post(
                "/v1/maker/emails/campaigns", json=_favorite_followers_payload()
            )
        assert res.status_code == 403

    def test_send_farmer_returns_403(self, client, em_admin, override_user):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 403

    def test_delete_farmer_returns_403(self, client, em_admin, override_user):
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.delete(f"/v1/maker/emails/campaigns/{CAMPAIGN_A}")
        assert res.status_code == 403


# =============================================================================
# GET /v1/maker/emails/campaigns (list)
# =============================================================================


class TestListCampaigns:
    def test_returns_own_campaigns(self, client, em_admin, override_user):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(), _campaign_row(cid=CAMPAIGN_OTHER, status="queued")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.get("/v1/maker/emails/campaigns")
        assert res.status_code == 200, res.text
        campaigns = res.json()["campaigns"]
        assert len(campaigns) == 2

    def test_supabase_called_with_maker_user_id_filter(
        self, client, em_admin, override_user
    ):
        em_admin.set_table("maker_email_campaigns", [], op="select")
        with override_user(role="maker", sub=MAKER_A):
            client.get("/v1/maker/emails/campaigns")
        q = next(
            qq for name, qq in em_admin.queries if name == "maker_email_campaigns"
        )
        eq_calls = [c for c in q.calls if c[0] == "eq"]
        assert any(
            c[1] == ("maker_user_id", MAKER_A) for c in eq_calls
        ), f"expected maker_user_id eq with MAKER_A, got {eq_calls}"

    def test_status_filter_draft(self, client, em_admin, override_user):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="draft")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.get("/v1/maker/emails/campaigns?status=draft")
        assert res.status_code == 200

    def test_invalid_status_filter_returns_422(
        self, client, em_admin, override_user
    ):
        with override_user(role="maker", sub=MAKER_A):
            res = client.get("/v1/maker/emails/campaigns?status=bogus")
        assert res.status_code == 422


# =============================================================================
# POST /v1/maker/emails/campaigns (create)
# =============================================================================


class TestCreateCampaign:
    def test_creates_draft_with_jwt_sub_as_maker(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns", [{"id": CAMPAIGN_A}], op="insert"
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                "/v1/maker/emails/campaigns", json=_favorite_followers_payload()
            )
        assert res.status_code == 201, res.text
        inserts = em_admin.captured_inserts.get("maker_email_campaigns", [])
        assert inserts
        assert inserts[0]["maker_user_id"] == MAKER_A
        assert inserts[0]["status"] == "draft"
        assert inserts[0]["segment_type"] == "favorite_followers"

    def test_payload_maker_user_id_is_ignored(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns", [{"id": CAMPAIGN_A}], op="insert"
        )
        payload = _favorite_followers_payload()
        payload["maker_user_id"] = MAKER_B  # 攻撃シナリオ
        payload["status"] = "queued"  # 攻撃シナリオ
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/emails/campaigns", json=payload)
        assert res.status_code == 201
        inserts = em_admin.captured_inserts.get("maker_email_campaigns", [])
        assert inserts[0]["maker_user_id"] == MAKER_A
        assert inserts[0]["status"] == "draft"

    def test_segment_type_discriminator_mismatch_returns_422(
        self, client, em_admin, override_user
    ):
        # segment_type='favorite_followers' なのに filter.segment_type が違う
        payload = {
            "subject": "件名",
            "body": "本文",
            "segment_type": "favorite_followers",
            "segment_filter": {
                "segment_type": "specific_users",
                "user_ids": [USER_X],
            },
        }
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/emails/campaigns", json=payload)
        assert res.status_code == 422

    def test_specific_users_empty_returns_422(
        self, client, em_admin, override_user
    ):
        payload = {
            "subject": "件名",
            "body": "本文",
            "segment_type": "specific_users",
            "segment_filter": {
                "segment_type": "specific_users",
                "user_ids": [],
            },
        }
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/emails/campaigns", json=payload)
        assert res.status_code == 422

    def test_specific_users_over_limit_returns_422(
        self, client, em_admin, override_user
    ):
        # Ryoga C10: 1000 件超は 422
        uids = [f"00000000-0000-0000-0000-{i:012d}" for i in range(1001)]
        payload = {
            "subject": "件名",
            "body": "本文",
            "segment_type": "specific_users",
            "segment_filter": {
                "segment_type": "specific_users",
                "user_ids": uids,
            },
        }
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/emails/campaigns", json=payload)
        assert res.status_code == 422

    def test_specific_users_at_limit_is_accepted(
        self, client, em_admin, override_user
    ):
        uids = [f"00000000-0000-0000-0000-{i:012d}" for i in range(1000)]
        em_admin.set_table(
            "maker_email_campaigns", [{"id": CAMPAIGN_A}], op="insert"
        )
        payload = {
            "subject": "件名",
            "body": "本文",
            "segment_type": "specific_users",
            "segment_filter": {
                "segment_type": "specific_users",
                "user_ids": uids,
            },
        }
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/emails/campaigns", json=payload)
        assert res.status_code == 201, res.text

    def test_invalid_segment_type_value_returns_422(
        self, client, em_admin, override_user
    ):
        payload = {
            "subject": "件名",
            "body": "本文",
            "segment_type": "nonsense",
            "segment_filter": {"segment_type": "nonsense"},
        }
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/emails/campaigns", json=payload)
        assert res.status_code == 422

    def test_subject_too_long_returns_422(
        self, client, em_admin, override_user
    ):
        payload = _favorite_followers_payload()
        payload["subject"] = "x" * 201
        with override_user(role="maker", sub=MAKER_A):
            res = client.post("/v1/maker/emails/campaigns", json=payload)
        assert res.status_code == 422


# =============================================================================
# GET / PATCH / DELETE /v1/maker/emails/campaigns/{id}
# =============================================================================


class TestGetCampaign:
    def test_returns_own_draft(self, client, em_admin, override_user):
        em_admin.set_table(
            "maker_email_campaigns", [_campaign_row()], op="select"
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.get(f"/v1/maker/emails/campaigns/{CAMPAIGN_A}")
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["id"] == CAMPAIGN_A
        assert body["maker_user_id"] == MAKER_A

    def test_other_makers_campaign_returns_403(
        self, client, em_admin, override_user
    ):
        em_admin.queue_table(
            "maker_email_campaigns", [], op="select"
        )  # owned fetch → empty
        em_admin.queue_table(
            "maker_email_campaigns",
            [{"maker_user_id": MAKER_B}],
            op="select",
        )  # existence → other owner
        with override_user(role="maker", sub=MAKER_A):
            res = client.get(f"/v1/maker/emails/campaigns/{CAMPAIGN_OTHER}")
        assert res.status_code == 403
        assert res.json()["detail"]["code"] == "campaign_not_owner"

    def test_nonexistent_returns_404(self, client, em_admin, override_user):
        em_admin.queue_table("maker_email_campaigns", [], op="select")
        em_admin.queue_table("maker_email_campaigns", [], op="select")
        with override_user(role="maker", sub=MAKER_A):
            res = client.get(f"/v1/maker/emails/campaigns/{CAMPAIGN_NOT_EXIST}")
        assert res.status_code == 404
        assert res.json()["detail"]["code"] == "campaign_not_found"


class TestPatchCampaign:
    def test_partial_update_subject_only(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns", [_campaign_row(status="draft")], op="select"
        )
        em_admin.set_table(
            "maker_email_campaigns", [{"id": CAMPAIGN_A}], op="update"
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}",
                json={"subject": "更新後"},
            )
        assert res.status_code == 200, res.text
        updates = em_admin.captured_updates.get("maker_email_campaigns", [])
        assert updates
        assert updates[0] == {"subject": "更新後"}

    def test_queued_campaign_returns_409(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="queued")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}",
                json={"subject": "更新後"},
            )
        assert res.status_code == 409
        assert res.json()["detail"]["code"] == "campaign_already_queued"

    def test_sent_campaign_returns_409(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="sent")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}",
                json={"subject": "更新後"},
            )
        assert res.status_code == 409

    def test_segment_filter_discriminator_mismatch_returns_422(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="draft", segment_type="favorite_followers")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}",
                json={
                    "segment_filter": {
                        "segment_type": "specific_users",
                        "user_ids": [USER_X],
                    }
                },
            )
        # current.segment_type='favorite_followers' なのに
        # filter.segment_type='specific_users' は不整合
        assert res.status_code == 422

    def test_other_makers_campaign_returns_403(
        self, client, em_admin, override_user
    ):
        em_admin.queue_table("maker_email_campaigns", [], op="select")
        em_admin.queue_table(
            "maker_email_campaigns",
            [{"maker_user_id": MAKER_B}],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_OTHER}",
                json={"subject": "x"},
            )
        assert res.status_code == 403

    def test_segment_type_only_patch_returns_422(
        self, client, em_admin, override_user
    ):
        # segment_type 単独更新は DB 整合性が壊れる (古い filter が残る)
        # ため 422 で拒否する (ADR-0010 Sprint 3 hotfix)。
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="draft", segment_type="favorite_followers")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.patch(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}",
                json={"segment_type": "specific_users"},
            )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "invalid_segment_filter"
        # update が走っていないこと (整合性破壊の防止)
        updates = em_admin.captured_updates.get("maker_email_campaigns", [])
        assert updates == []


class TestDeleteCampaign:
    def test_deletes_draft(self, client, em_admin, override_user):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="draft")],
            op="select",
        )
        em_admin.set_table(
            "maker_email_campaigns", [], op="delete"
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.delete(f"/v1/maker/emails/campaigns/{CAMPAIGN_A}")
        assert res.status_code == 204

    def test_queued_campaign_returns_409(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="queued")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.delete(f"/v1/maker/emails/campaigns/{CAMPAIGN_A}")
        assert res.status_code == 409

    def test_other_makers_campaign_returns_403(
        self, client, em_admin, override_user
    ):
        em_admin.queue_table("maker_email_campaigns", [], op="select")
        em_admin.queue_table(
            "maker_email_campaigns",
            [{"maker_user_id": MAKER_B}],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.delete(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_OTHER}"
            )
        assert res.status_code == 403


# =============================================================================
# POST /v1/maker/emails/campaigns/{id}/send (pre-flight)
# =============================================================================


class TestSendCampaign:
    def test_send_favorite_followers_happy(
        self, client, em_admin, override_user
    ):
        # 1) campaign fetch → draft / favorite_followers
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="draft", segment_type="favorite_followers")],
            op="select",
        )
        # 2) self products fetch → [PRODUCT_A1, PRODUCT_A2]
        em_admin.set_table(
            "products",
            [{"id": PRODUCT_A1}, {"id": PRODUCT_A2}],
            op="select",
        )
        # 3) user_favorites (kind='favorite' のみ) → 2 unique users
        em_admin.set_table(
            "user_favorites",
            [
                {"user_id": USER_X},
                {"user_id": USER_X},  # duplicate, dedup
                {"user_id": USER_Y},
            ],
            op="select",
        )
        # 4) UPDATE
        em_admin.set_table(
            "maker_email_campaigns", [{"id": CAMPAIGN_A}], op="update"
        )

        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["ok"] is True
        assert body["status"] == "queued"
        assert body["recipient_count"] == 2

        # UPDATE で status='queued' + recipient_count + queued_at が書かれた
        updates = em_admin.captured_updates.get("maker_email_campaigns", [])
        assert updates
        upd = updates[-1]
        assert upd["status"] == "queued"
        assert upd["recipient_count"] == 2
        assert "queued_at" in upd

        # user_favorites クエリで kind='favorite' フィルタが付いていること
        # (Ryoga C6: candidate を除外する重要回帰防御)
        fav_query = next(
            qq for name, qq in em_admin.queries if name == "user_favorites"
        )
        eq_calls = [c for c in fav_query.calls if c[0] == "eq"]
        assert any(
            c[1] == ("kind", "favorite") for c in eq_calls
        ), f"expected kind='favorite' filter, got {eq_calls}"

    def test_send_favorite_followers_zero_recipients_returns_422(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="draft", segment_type="favorite_followers")],
            op="select",
        )
        # 自社製品なし → 集合空
        em_admin.set_table("products", [], op="select")

        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "no_recipients"

    def test_send_favorite_followers_with_products_but_no_favorites_returns_422(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="draft", segment_type="favorite_followers")],
            op="select",
        )
        em_admin.set_table(
            "products", [{"id": PRODUCT_A1}], op="select"
        )
        em_admin.set_table("user_favorites", [], op="select")

        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "no_recipients"

    def test_send_event_past_attendees_happy(
        self, client, em_admin, override_user
    ):
        # 1) campaign fetch → event_past_attendees with event_id=EVENT_OWN
        em_admin.set_table(
            "maker_email_campaigns",
            [
                _campaign_row(
                    status="draft",
                    segment_type="event_past_attendees",
                    segment_filter={
                        "segment_type": "event_past_attendees",
                        "event_id": EVENT_OWN,
                    },
                )
            ],
            op="select",
        )
        # 2) events fetch (host check) → 自社主催
        em_admin.set_table(
            "events",
            [{"id": EVENT_OWN, "host_user_id": MAKER_A}],
            op="select",
        )
        # 3) registrations → 2 users
        em_admin.set_table(
            "event_registrations",
            [{"user_id": USER_X}, {"user_id": USER_Y}],
            op="select",
        )
        em_admin.set_table(
            "maker_email_campaigns", [{"id": CAMPAIGN_A}], op="update"
        )

        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["status"] == "queued"
        assert body["recipient_count"] == 2

    def test_send_event_past_attendees_other_makers_event_returns_403(
        self, client, em_admin, override_user
    ):
        # Ryoga C9: 他社 event 指定 → 403
        em_admin.set_table(
            "maker_email_campaigns",
            [
                _campaign_row(
                    status="draft",
                    segment_type="event_past_attendees",
                    segment_filter={
                        "segment_type": "event_past_attendees",
                        "event_id": EVENT_OTHER,
                    },
                )
            ],
            op="select",
        )
        em_admin.set_table(
            "events",
            [{"id": EVENT_OTHER, "host_user_id": MAKER_B}],
            op="select",
        )

        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 403
        assert res.json()["detail"]["code"] == "event_not_owner"

    def test_send_event_past_attendees_nonexistent_event_returns_422(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [
                _campaign_row(
                    status="draft",
                    segment_type="event_past_attendees",
                    segment_filter={
                        "segment_type": "event_past_attendees",
                        "event_id": EVENT_OTHER,
                    },
                )
            ],
            op="select",
        )
        em_admin.set_table("events", [], op="select")

        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "invalid_segment_filter"

    def test_send_event_past_attendees_zero_registrations_returns_422(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [
                _campaign_row(
                    status="draft",
                    segment_type="event_past_attendees",
                    segment_filter={
                        "segment_type": "event_past_attendees",
                        "event_id": EVENT_OWN,
                    },
                )
            ],
            op="select",
        )
        em_admin.set_table(
            "events",
            [{"id": EVENT_OWN, "host_user_id": MAKER_A}],
            op="select",
        )
        em_admin.set_table("event_registrations", [], op="select")

        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "no_recipients"

    def test_send_specific_users_happy(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [
                _campaign_row(
                    status="draft",
                    segment_type="specific_users",
                    segment_filter={
                        "segment_type": "specific_users",
                        "user_ids": [USER_X, USER_Y, USER_Z],
                    },
                )
            ],
            op="select",
        )
        em_admin.set_table(
            "maker_email_campaigns", [{"id": CAMPAIGN_A}], op="update"
        )

        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["recipient_count"] == 3

    def test_send_specific_users_empty_returns_422(
        self, client, em_admin, override_user
    ):
        # DB に既に空 user_ids が入っていた異常系 (Pydantic 検証を通り抜けた場合)
        em_admin.set_table(
            "maker_email_campaigns",
            [
                _campaign_row(
                    status="draft",
                    segment_type="specific_users",
                    segment_filter={
                        "segment_type": "specific_users",
                        "user_ids": [],
                    },
                )
            ],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 422
        assert res.json()["detail"]["code"] == "invalid_segment_filter"

    def test_send_specific_users_over_1000_returns_422(
        self, client, em_admin, override_user
    ):
        # DB 直接書込み等で 1001 件入った異常系も BFF 側で拒否
        uids = [f"00000000-0000-0000-0000-{i:012d}" for i in range(1001)]
        em_admin.set_table(
            "maker_email_campaigns",
            [
                _campaign_row(
                    status="draft",
                    segment_type="specific_users",
                    segment_filter={
                        "segment_type": "specific_users",
                        "user_ids": uids,
                    },
                )
            ],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 422

    def test_send_already_queued_returns_409(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="queued")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 409
        assert res.json()["detail"]["code"] == "campaign_already_queued"

    def test_send_already_sent_returns_409(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "maker_email_campaigns",
            [_campaign_row(status="sent")],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_A}/send"
            )
        assert res.status_code == 409

    def test_send_other_makers_campaign_returns_403(
        self, client, em_admin, override_user
    ):
        em_admin.queue_table("maker_email_campaigns", [], op="select")
        em_admin.queue_table(
            "maker_email_campaigns",
            [{"maker_user_id": MAKER_B}],
            op="select",
        )
        with override_user(role="maker", sub=MAKER_A):
            res = client.post(
                f"/v1/maker/emails/campaigns/{CAMPAIGN_OTHER}/send"
            )
        assert res.status_code == 403


# =============================================================================
# GET /v1/me/followed-makers (Sprint 3 ついで実装、SPEC §5.4)
# =============================================================================


class TestFollowedMakers:
    def test_unauthenticated_returns_401_or_403(self, client, em_admin):
        res = client.get("/v1/me/followed-makers")
        assert res.status_code in (401, 403)

    def test_maker_role_returns_200_with_empty_list(
        self, client, em_admin, override_user
    ):
        # SPEC §3.2 / §5.4: ロール不問。maker が自社製品を favorite する
        # ケースもありうるので 403 にせず、favorite 0 件なら空配列を返す
        # (ADR-0010 Sprint 3 hotfix)。
        em_admin.set_table("user_favorites", [], op="select")
        with override_user(role="maker", sub=MAKER_A):
            res = client.get("/v1/me/followed-makers")
        assert res.status_code == 200, res.text
        assert res.json() == {"manufacturer_ids": [], "manufacturers": []}

    def test_unassigned_returns_200_with_empty_list(
        self, client, em_admin, override_user
    ):
        em_admin.set_table("user_favorites", [], op="select")
        with override_user(role="unassigned", sub="x"):
            res = client.get("/v1/me/followed-makers")
        assert res.status_code == 200, res.text
        assert res.json() == {"manufacturer_ids": [], "manufacturers": []}

    def test_farmer_with_no_favorites_returns_empty(
        self, client, em_admin, override_user
    ):
        em_admin.set_table("user_favorites", [], op="select")
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.get("/v1/me/followed-makers")
        assert res.status_code == 200, res.text
        assert res.json() == {"manufacturer_ids": [], "manufacturers": []}

    def test_farmer_with_favorites_returns_distinct_makers(
        self, client, em_admin, override_user
    ):
        em_admin.set_table(
            "user_favorites",
            [
                {
                    "product_id": PRODUCT_A1,
                    "products": {
                        "id": PRODUCT_A1,
                        "maker_id": MAKER_A,
                        "users": {
                            "id": MAKER_A,
                            "name": "Aさん",
                            "maker_profiles": {"company_name": "A 株式会社"},
                        },
                    },
                },
                {
                    "product_id": PRODUCT_A2,
                    "products": {
                        "id": PRODUCT_A2,
                        "maker_id": MAKER_A,  # 重複 (同じ maker)
                        "users": {
                            "id": MAKER_A,
                            "name": "Aさん",
                            "maker_profiles": {"company_name": "A 株式会社"},
                        },
                    },
                },
                {
                    "product_id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
                    "products": {
                        "id": "ffffffff-ffff-ffff-ffff-ffffffffffff",
                        "maker_id": MAKER_B,
                        "users": {
                            "id": MAKER_B,
                            "name": "Bさん",
                            "maker_profiles": None,
                        },
                    },
                },
            ],
            op="select",
        )
        with override_user(role="farmer", sub=FARMER_USER):
            res = client.get("/v1/me/followed-makers")
        assert res.status_code == 200, res.text
        body = res.json()
        # MAKER_A は dedup されて 1 件
        assert set(body["manufacturer_ids"]) == {MAKER_A, MAKER_B}
        names = {m["display_name"] for m in body["manufacturers"]}
        # maker_profiles.company_name 優先、無ければ users.name
        assert "A 株式会社" in names
        assert "Bさん" in names

    def test_supabase_called_with_kind_favorite_filter(
        self, client, em_admin, override_user
    ):
        # Ryoga C6: kind='favorite' のみで集計する重要回帰防御
        em_admin.set_table("user_favorites", [], op="select")
        with override_user(role="farmer", sub=FARMER_USER):
            client.get("/v1/me/followed-makers")
        q = next(qq for name, qq in em_admin.queries if name == "user_favorites")
        eq_calls = [c for c in q.calls if c[0] == "eq"]
        assert any(
            c[1] == ("kind", "favorite") for c in eq_calls
        ), f"expected kind='favorite' filter, got {eq_calls}"
        assert any(
            c[1] == ("user_id", FARMER_USER) for c in eq_calls
        ), f"expected user_id eq with FARMER_USER, got {eq_calls}"

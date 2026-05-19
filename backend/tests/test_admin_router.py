"""Tests for /v1/admin/* (ADR-0009 / spec maker-approval-admin §5, §8.1).

`app.routers.admin` imports `get_supabase_admin` directly, so we monkeypatch
the module attribute (FastAPI dep override does NOT apply to direct imports).
"""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock

import pytest


ADMIN_USER_ID = "00000000-0000-0000-0000-00000000aaaa"
MAKER_ID = "11111111-1111-1111-1111-111111111111"
FARMER_ID = "22222222-2222-2222-2222-222222222222"
TARGET_ID = "33333333-3333-3333-3333-333333333333"


@pytest.fixture()
def admin_user(override_user) -> dict[str, Any]:
    payload = {
        "sub": ADMIN_USER_ID,
        "app_metadata": {"role": "admin"},
        "aal": "aal2",
    }
    override_user(payload)
    return payload


@pytest.fixture()
def admin_user_aal1(override_user) -> dict[str, Any]:
    payload = {
        "sub": ADMIN_USER_ID,
        "app_metadata": {"role": "admin"},
        "aal": "aal1",
    }
    override_user(payload)
    return payload


@pytest.fixture()
def patch_router_admin(monkeypatch, fake_admin):
    import app.routers.admin as mod

    fake_admin.auth = SimpleNamespace(admin=MagicMock())
    monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake_admin)
    return fake_admin


# ─── require_role guard ────────────────────────────────────────────────


class TestGuard:
    def test_summary_requires_auth(self, client, patch_router_admin):
        res = client.get("/v1/admin/summary")
        assert res.status_code in (401, 403)

    def test_summary_forbids_farmer(self, client, patch_router_admin, farmer_user):
        res = client.get("/v1/admin/summary")
        assert res.status_code == 403

    def test_summary_forbids_maker(self, client, patch_router_admin, maker_user):
        res = client.get("/v1/admin/summary")
        assert res.status_code == 403

    def test_pending_makers_forbids_non_admin(
        self, client, patch_router_admin, farmer_user
    ):
        res = client.get("/v1/admin/makers/pending")
        assert res.status_code == 403

    def test_approve_forbids_non_admin(
        self, client, patch_router_admin, farmer_user
    ):
        res = client.post(f"/v1/admin/makers/{MAKER_ID}/approve")
        assert res.status_code == 403

    def test_reject_forbids_non_admin(
        self, client, patch_router_admin, farmer_user
    ):
        res = client.post(
            f"/v1/admin/makers/{MAKER_ID}/reject", json={"reason": None}
        )
        assert res.status_code == 403

    def test_role_assign_forbids_non_admin(
        self, client, patch_router_admin, farmer_user
    ):
        res = client.post(
            f"/v1/admin/users/{TARGET_ID}/role", json={"role": "admin"}
        )
        assert res.status_code == 403


# ─── ADR-0011 §2.4: AAL2 enforcement for admin role ───────────────────


class TestAAL2Enforcement:
    """AAL1 admin の JWT は 401 `aal_insufficient` で reject される (ADR-0011)。"""

    def test_summary_rejects_aal1_admin(
        self, client, patch_router_admin, admin_user_aal1
    ):
        res = client.get("/v1/admin/summary")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_pending_makers_rejects_aal1_admin(
        self, client, patch_router_admin, admin_user_aal1
    ):
        res = client.get("/v1/admin/makers/pending")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_approve_rejects_aal1_admin(
        self, client, patch_router_admin, admin_user_aal1
    ):
        res = client.post(f"/v1/admin/makers/{MAKER_ID}/approve")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_reject_rejects_aal1_admin(
        self, client, patch_router_admin, admin_user_aal1
    ):
        res = client.post(
            f"/v1/admin/makers/{MAKER_ID}/reject", json={"reason": None}
        )
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_role_assign_rejects_aal1_admin(
        self, client, patch_router_admin, admin_user_aal1
    ):
        res = client.post(
            f"/v1/admin/users/{TARGET_ID}/role", json={"role": "admin"}
        )
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_missing_aal_claim_treated_as_aal1(
        self, client, patch_router_admin, override_user
    ):
        """aal claim 欠落の JWT も AAL1 扱いで reject される (jwt.py:get_user_aal)。"""
        override_user({"sub": ADMIN_USER_ID, "app_metadata": {"role": "admin"}})
        res = client.get("/v1/admin/summary")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"


# ─── GET /v1/admin/summary ─────────────────────────────────────────────


class TestSummary:
    def test_returns_counts(self, client, patch_router_admin, admin_user):
        admin = patch_router_admin
        responses = [
            [{"id": "p1"}, {"id": "p2"}, {"id": "p3"}],
            [{"id": "a1"}, {"id": "a2"}],
            [{"id": "r1"}],
            [{"id": "u1"}, {"id": "u2"}, {"id": "u3"}, {"id": "u4"}, {"id": "u5"}],
        ]
        call_idx = {"i": 0}
        original_table = admin.table

        def _table(name: str):
            q = original_table(name)

            def _execute():
                data = responses[call_idx["i"]] if call_idx["i"] < len(responses) else []
                call_idx["i"] += 1

                class _Resp:
                    pass

                resp = _Resp()
                resp.data = data
                admin.executed.append({"table": name, "calls": list(q.calls)})
                return resp

            q.execute = _execute
            return q

        admin.table = _table  # type: ignore[method-assign]

        res = client.get("/v1/admin/summary")
        assert res.status_code == 200
        body = res.json()
        assert body == {
            "pending_makers_count": 3,
            "active_makers_count": 2,
            "rejected_makers_count": 1,
            "total_users_count": 5,
        }


# ─── GET /v1/admin/makers/pending ──────────────────────────────────────


def _attach_pending_users_table(admin, all_rows: list[dict[str, Any]]) -> None:
    """supabase-py の `count="exact"` + `.range(offset, offset+limit-1)` を模擬。

    `.range(start, end)` の引数を q.calls から取り出して slice し、`count` には
    全件数 (len(all_rows)) を入れた response を返す。`set_response` は
    `count` 属性を持たないため、`.range` を使う endpoint には本ヘルパを使う。
    """
    original_table = admin.table

    def _table(name: str):
        q = original_table(name)

        def _execute():
            class _Resp:
                pass

            resp = _Resp()
            resp.data = []
            resp.count = 0
            if name == "users":
                range_call = next((c for c in q.calls if c[0] == "range"), None)
                if range_call is not None:
                    start, end = range_call[1][0], range_call[1][1]
                    resp.data = all_rows[start : end + 1]
                else:
                    resp.data = list(all_rows)
                resp.count = len(all_rows)
            admin.executed.append({"table": name, "calls": list(q.calls)})
            return resp

        q.execute = _execute
        return q

    admin.table = _table  # type: ignore[method-assign]


def _pending_row(user_id: str, company: str) -> dict[str, Any]:
    return {
        "id": user_id,
        "name": f"Maker {company}",
        "created_at": "2026-05-10T00:00:00Z",
        "maker_profiles": {
            "company_name": company,
            "prefecture": "北海道",
            "city": "札幌市",
            "note": None,
        },
    }


class TestPendingMakers:
    def test_returns_pending_rows(self, client, patch_router_admin, admin_user):
        admin = patch_router_admin
        _attach_pending_users_table(
            admin,
            [
                {
                    "id": MAKER_ID,
                    "name": "山田 太郎",
                    "created_at": "2026-05-10T00:00:00Z",
                    "maker_profiles": {
                        "company_name": "Acme Bio",
                        "prefecture": "北海道",
                        "city": "札幌市",
                        "note": "BS資材専業",
                    },
                }
            ],
        )
        admin.auth.admin.get_user_by_id = MagicMock(
            return_value=SimpleNamespace(user=SimpleNamespace(email="maker@example.com"))
        )

        res = client.get("/v1/admin/makers/pending")
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 1
        assert len(body["makers"]) == 1
        item = body["makers"][0]
        assert item["user_id"] == MAKER_ID
        assert item["company_name"] == "Acme Bio"
        assert item["email"] == "maker@example.com"

    def test_filters_by_role_and_status(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        _attach_pending_users_table(admin, [])
        client.get("/v1/admin/makers/pending")
        users_query = next(q for q in admin.executed if q["table"] == "users")
        eq_calls = [c for c in users_query["calls"] if c[0] == "eq"]
        assert any(c[1] == ("role", "maker") for c in eq_calls), eq_calls
        assert any(c[1] == ("status", "pending_review") for c in eq_calls), eq_calls

    def test_invalid_limit_returns_422(
        self, client, patch_router_admin, admin_user
    ):
        res = client.get("/v1/admin/makers/pending?limit=0")
        assert res.status_code == 422
        res = client.get("/v1/admin/makers/pending?limit=101")
        assert res.status_code == 422

    def test_returns_correct_total_when_offset_zero(
        self, client, patch_router_admin, admin_user
    ):
        """`count="exact"` の total が limit でキャップされず全件数を返すこと。"""
        admin = patch_router_admin
        all_rows = [
            _pending_row(f"00000000-0000-0000-0000-00000000000{i}", f"Co{i}")
            for i in range(5)
        ]
        _attach_pending_users_table(admin, all_rows)
        admin.auth.admin.get_user_by_id = MagicMock(
            return_value=SimpleNamespace(user=SimpleNamespace(email="m@example.com"))
        )

        res = client.get("/v1/admin/makers/pending?limit=2&offset=0")
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 5
        assert len(body["makers"]) == 2

    def test_returns_correct_rows_when_offset_nonzero(
        self, client, patch_router_admin, admin_user
    ):
        """offset>0 で 0 行返却にならず、対応するページ分が返ること。"""
        admin = patch_router_admin
        all_rows = [
            _pending_row(f"00000000-0000-0000-0000-00000000000{i}", f"Co{i}")
            for i in range(5)
        ]
        _attach_pending_users_table(admin, all_rows)
        admin.auth.admin.get_user_by_id = MagicMock(
            return_value=SimpleNamespace(user=SimpleNamespace(email="m@example.com"))
        )

        res = client.get("/v1/admin/makers/pending?limit=2&offset=1")
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 5
        assert len(body["makers"]) == 2
        users_query = next(
            q for q in admin.executed if q["table"] == "users"
        )
        range_calls = [c for c in users_query["calls"] if c[0] == "range"]
        assert range_calls and range_calls[0][1] == (1, 2)


# ─── POST /v1/admin/makers/{id}/approve ────────────────────────────────


class _StatefulUsers:
    """select/update を区別して返す簡易ストア。"""

    def __init__(self, initial: dict[str, dict[str, Any]]):
        self.rows = dict(initial)

    def attach(self, admin) -> None:
        original_table = admin.table

        def _table(name: str):
            q = original_table(name)

            def _execute():
                ops = [c[0] for c in q.calls]
                eq_calls = [c for c in q.calls if c[0] == "eq"]
                target_id: str | None = None
                for c in eq_calls:
                    if c[1] and c[1][0] == "id":
                        target_id = c[1][1]
                        break

                class _Resp:
                    pass

                resp = _Resp()
                resp.data = []

                if name != "users":
                    resp.data = []
                    admin.executed.append({"table": name, "calls": list(q.calls)})
                    return resp

                if "update" in ops:
                    update_args = next(c[2:] if False else c[1] for c in q.calls if c[0] == "update")
                    patch = update_args[0] if update_args else {}
                    if target_id and target_id in self.rows:
                        self.rows[target_id].update(patch)
                        resp.data = [{"id": target_id, **self.rows[target_id]}]
                else:
                    if target_id and target_id in self.rows:
                        resp.data = [{"id": target_id, **self.rows[target_id]}]
                    else:
                        resp.data = []
                admin.executed.append({"table": name, "calls": list(q.calls)})
                return resp

            q.execute = _execute
            return q

        admin.table = _table  # type: ignore[method-assign]


class TestApprove:
    def test_approves_pending_maker(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({MAKER_ID: {"role": "maker", "status": "pending_review"}})
        store.attach(admin)

        res = client.post(f"/v1/admin/makers/{MAKER_ID}/approve")
        assert res.status_code == 200
        body = res.json()
        assert body == {"ok": True, "user_id": MAKER_ID, "status": "active"}
        assert store.rows[MAKER_ID]["status"] == "active"

    def test_returns_404_for_non_maker(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({MAKER_ID: {"role": "farmer", "status": "active"}})
        store.attach(admin)
        res = client.post(f"/v1/admin/makers/{MAKER_ID}/approve")
        assert res.status_code == 404
        assert res.json()["error"] == "maker_not_found"

    def test_returns_404_for_missing(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({})
        store.attach(admin)
        res = client.post(f"/v1/admin/makers/{MAKER_ID}/approve")
        assert res.status_code == 404
        assert res.json()["error"] == "maker_not_found"

    def test_returns_409_when_already_active(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({MAKER_ID: {"role": "maker", "status": "active"}})
        store.attach(admin)
        res = client.post(f"/v1/admin/makers/{MAKER_ID}/approve")
        assert res.status_code == 409
        assert res.json()["error"] == "maker_not_pending"


# ─── POST /v1/admin/makers/{id}/reject ─────────────────────────────────


class TestReject:
    def test_rejects_pending_maker(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({MAKER_ID: {"role": "maker", "status": "pending_review"}})
        store.attach(admin)

        res = client.post(
            f"/v1/admin/makers/{MAKER_ID}/reject",
            json={"reason": "deceptive company"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body == {"ok": True, "user_id": MAKER_ID, "status": "rejected"}
        assert store.rows[MAKER_ID]["status"] == "rejected"

    def test_accepts_empty_body(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({MAKER_ID: {"role": "maker", "status": "pending_review"}})
        store.attach(admin)
        res = client.post(f"/v1/admin/makers/{MAKER_ID}/reject", json={})
        assert res.status_code == 200

    def test_returns_409_when_already_rejected(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({MAKER_ID: {"role": "maker", "status": "rejected"}})
        store.attach(admin)
        res = client.post(
            f"/v1/admin/makers/{MAKER_ID}/reject", json={"reason": None}
        )
        assert res.status_code == 409


# ─── POST /v1/admin/users/{id}/role ────────────────────────────────────


class TestRoleAssign:
    def test_assigns_admin_role(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({TARGET_ID: {"role": "unassigned"}})
        store.attach(admin)
        admin.auth.admin.update_user_by_id = MagicMock()

        res = client.post(
            f"/v1/admin/users/{TARGET_ID}/role", json={"role": "admin"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body == {"ok": True, "user_id": TARGET_ID, "role": "admin"}
        admin.auth.admin.update_user_by_id.assert_called_once_with(
            TARGET_ID, {"app_metadata": {"role": "admin"}}
        )
        assert store.rows[TARGET_ID]["role"] == "admin"

    def test_assigns_ja_staff_role(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({TARGET_ID: {"role": "unassigned"}})
        store.attach(admin)
        admin.auth.admin.update_user_by_id = MagicMock()

        res = client.post(
            f"/v1/admin/users/{TARGET_ID}/role", json={"role": "ja_staff"}
        )
        assert res.status_code == 200
        assert res.json()["role"] == "ja_staff"

    def test_assigns_researcher_role(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({TARGET_ID: {"role": "unassigned"}})
        store.attach(admin)
        admin.auth.admin.update_user_by_id = MagicMock()

        res = client.post(
            f"/v1/admin/users/{TARGET_ID}/role", json={"role": "researcher"}
        )
        assert res.status_code == 200
        assert res.json()["role"] == "researcher"

    @pytest.mark.parametrize("bad_role", ["farmer", "maker", "unassigned"])
    def test_rejects_non_assignable_roles_with_422(
        self, client, patch_router_admin, admin_user, bad_role
    ):
        """Pydantic Literal によって 422 で弾かれる (spec §5.5)."""
        admin = patch_router_admin
        store = _StatefulUsers({TARGET_ID: {"role": "unassigned"}})
        store.attach(admin)
        admin.auth.admin.update_user_by_id = MagicMock()

        res = client.post(
            f"/v1/admin/users/{TARGET_ID}/role", json={"role": bad_role}
        )
        assert res.status_code == 422
        admin.auth.admin.update_user_by_id.assert_not_called()

    def test_returns_404_when_user_missing(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({})
        store.attach(admin)
        admin.auth.admin.update_user_by_id = MagicMock()

        res = client.post(
            f"/v1/admin/users/{TARGET_ID}/role", json={"role": "admin"}
        )
        assert res.status_code == 404
        assert res.json()["error"] == "user_not_found"
        admin.auth.admin.update_user_by_id.assert_not_called()

    def test_returns_409_when_role_already_assigned(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        store = _StatefulUsers({TARGET_ID: {"role": "admin"}})
        store.attach(admin)
        admin.auth.admin.update_user_by_id = MagicMock()

        res = client.post(
            f"/v1/admin/users/{TARGET_ID}/role", json={"role": "admin"}
        )
        assert res.status_code == 409
        assert res.json()["error"] == "role_already_assigned"
        admin.auth.admin.update_user_by_id.assert_not_called()


# ─── public GET filter regression ──────────────────────────────────────


class TestPublicFilters:
    """ADR-0009 §5.7 / Sprint 1 申し送り: pending メーカーが公開系に出ない二重防御。"""

    def test_manufacturers_list_filters_by_status_active(
        self, client, monkeypatch, fake_admin
    ):
        import app.routers.manufacturers as mod

        monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake_admin)
        fake_admin.set_response("users", [])
        client.get("/v1/manufacturers")
        users_query = next(q for q in fake_admin.executed if q["table"] == "users")
        eq_calls = [c for c in users_query["calls"] if c[0] == "eq"]
        assert any(c[1] == ("status", "active") for c in eq_calls), eq_calls

    def test_manufacturer_detail_404_for_non_active(
        self, client, monkeypatch, fake_admin
    ):
        import app.routers.manufacturers as mod

        monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake_admin)
        fake_admin.set_response(
            "users",
            [
                {
                    "id": MAKER_ID,
                    "role": "maker",
                    "status": "pending_review",
                    "maker_profiles": {
                        "company_name": "Pending Co",
                        "prefecture": None,
                        "city": None,
                        "note": None,
                    },
                }
            ],
        )
        res = client.get(f"/v1/manufacturers/{MAKER_ID}")
        assert res.status_code == 404

    def test_home_skips_non_active_featured(
        self, client, monkeypatch, fake_admin
    ):
        import app.routers.home as mod

        class _Q:
            def __init__(self, data: Any) -> None:
                self.data = data
                self.not_ = self

            def _noop(self, *a, **kw):
                return self

            select = _noop
            lte = _noop
            order = _noop
            limit = _noop
            is_ = _noop

            def execute(self):
                r = MagicMock()
                r.data = self.data
                return r

        def _table_factory(_self, name: str):
            if name == "featured_products":
                return _Q(
                    [
                        {
                            "id": "11111111-1111-1111-1111-111111111111",
                            "sort_order": 0,
                            "displayed_at": "2026-05-10T00:00:00Z",
                            "products": {
                                "id": "22222222-2222-2222-2222-222222222222",
                                "name": "Hidden",
                                "users": {
                                    "name": "Pending Maker",
                                    "status": "pending_review",
                                    "maker_profiles": {"company_name": "Pending Co"},
                                },
                                "product_types": None,
                                "product_images": [],
                            },
                        }
                    ]
                )
            return _Q([])

        stub = SimpleNamespace(table=lambda name: _table_factory(None, name))
        monkeypatch.setattr(mod, "get_supabase_admin", lambda: stub)
        res = client.get("/v1/home")
        assert res.status_code == 200
        assert res.json()["featured_products"] == []

    def test_articles_related_products_skip_non_active_maker(
        self, client, monkeypatch
    ):
        """ADR-0009 §1.1: pending メーカー所有 product は記事 related_products から消える。"""
        import app.routers.articles as mod

        class _Q:
            def __init__(self, data: Any) -> None:
                self.data = data
                self.not_ = self

            def _noop(self, *a, **kw):
                return self

            select = _noop
            eq = _noop
            lte = _noop
            order = _noop
            limit = _noop
            is_ = _noop

            def execute(self):
                r = MagicMock()
                r.data = self.data
                return r

        article_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        article_row = {
            "id": article_id,
            "slug": "hidden-maker-article",
            "title": "Hidden Maker",
            "body_md": "# body",
            "category": "knowledge",
            "hero_image_url": None,
            "author_user_id": None,
            "published_at": "2026-05-10T00:00:00Z",
            "users": None,
        }
        rel_rows = [
            {
                "position": 0,
                "products": {
                    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                    "name": "Hidden Pending Product",
                    "users": {
                        "name": "Pending Maker",
                        "status": "pending_review",
                        "maker_profiles": {"company_name": "Pending Co"},
                    },
                    "product_images": [],
                },
            },
            {
                "position": 1,
                "products": {
                    "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
                    "name": "Visible Active Product",
                    "users": {
                        "name": "Active Maker",
                        "status": "active",
                        "maker_profiles": {"company_name": "Active Co"},
                    },
                    "product_images": [],
                },
            },
        ]

        def _table_factory(name: str):
            if name == "articles":
                return _Q([article_row])
            if name == "article_products":
                return _Q(rel_rows)
            return _Q([])

        stub = SimpleNamespace(table=_table_factory)
        monkeypatch.setattr(mod, "get_supabase_admin", lambda: stub)
        res = client.get("/v1/articles/hidden-maker-article")
        assert res.status_code == 200
        body = res.json()
        names = [p["name"] for p in body["related_products"]]
        assert "Hidden Pending Product" not in names
        assert names == ["Visible Active Product"]

    @pytest.mark.parametrize("bad_status", ["pending_review", "rejected", "frozen"])
    def test_articles_related_products_filter_all_non_active_statuses(
        self, client, monkeypatch, bad_status
    ):
        """pending / rejected / frozen いずれも公開 related_products に出さない。"""
        import app.routers.articles as mod

        class _Q:
            def __init__(self, data: Any) -> None:
                self.data = data
                self.not_ = self

            def _noop(self, *a, **kw):
                return self

            select = _noop
            eq = _noop
            lte = _noop
            order = _noop
            limit = _noop
            is_ = _noop

            def execute(self):
                r = MagicMock()
                r.data = self.data
                return r

        article_row = {
            "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "slug": "any-article",
            "title": "Any",
            "body_md": "body",
            "category": "knowledge",
            "hero_image_url": None,
            "author_user_id": None,
            "published_at": "2026-05-10T00:00:00Z",
            "users": None,
        }
        rel_rows = [
            {
                "position": 0,
                "products": {
                    "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                    "name": "Should Be Hidden",
                    "users": {
                        "name": "Bad Maker",
                        "status": bad_status,
                        "maker_profiles": {"company_name": "Bad Co"},
                    },
                    "product_images": [],
                },
            }
        ]

        def _table_factory(name: str):
            if name == "articles":
                return _Q([article_row])
            if name == "article_products":
                return _Q(rel_rows)
            return _Q([])

        stub = SimpleNamespace(table=_table_factory)
        monkeypatch.setattr(mod, "get_supabase_admin", lambda: stub)
        res = client.get("/v1/articles/any-article")
        assert res.status_code == 200
        assert res.json()["related_products"] == []

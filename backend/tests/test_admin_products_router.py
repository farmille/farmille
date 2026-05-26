"""Tests for /v1/admin/products/* (spec admin-aglist-alignment-v2 §3.1 / §3.2).

Strategy is identical to test_admin_router.py:
- Direct-import `get_supabase_admin` の monkeypatch
- `require_role("admin")` + AAL2 必須は ADR-0012、AAL1 admin / 非 admin role は reject
- 書き込み (PUT) は service_role bypass を想定し、payload による update 引数だけ verify
"""

from __future__ import annotations

from types import SimpleNamespace
from typing import Any
from unittest.mock import MagicMock

import pytest


ADMIN_ID = "00000000-0000-0000-0000-00000000aaaa"
PRODUCT_ID = "11111111-1111-1111-1111-111111111111"
MAKER_ID = "22222222-2222-2222-2222-222222222222"
PRODUCT_TYPE_ID = "33333333-3333-3333-3333-333333333333"
CROP_ID = "44444444-4444-4444-4444-444444444444"
CERT_ID = "55555555-5555-5555-5555-555555555555"
BENEFIT_ID = "66666666-6666-6666-6666-666666666666"
IMG_ID = "77777777-7777-7777-7777-777777777777"
RECIPE_ID = "88888888-8888-8888-8888-888888888888"


@pytest.fixture()
def admin_user(override_user) -> dict[str, Any]:
    payload = {
        "sub": ADMIN_ID,
        "app_metadata": {"role": "admin"},
        "aal": "aal2",
    }
    override_user(payload)
    return payload


@pytest.fixture()
def admin_user_aal1(override_user) -> dict[str, Any]:
    payload = {
        "sub": ADMIN_ID,
        "app_metadata": {"role": "admin"},
        "aal": "aal1",
    }
    override_user(payload)
    return payload


@pytest.fixture()
def patch_admin_products(monkeypatch, fake_admin):
    """`app.routers.admin_products` の `get_supabase_admin` を fake で差し替え。"""
    import app.routers.admin_products as mod

    fake_admin.auth = SimpleNamespace(admin=MagicMock())
    monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake_admin)
    return fake_admin


# ─── Guards ────────────────────────────────────────────────────────────


class TestGuard:
    def test_list_requires_auth(self, client, patch_admin_products):
        res = client.get("/v1/admin/products")
        assert res.status_code in (401, 403)

    def test_list_forbids_farmer(self, client, patch_admin_products, farmer_user):
        res = client.get("/v1/admin/products")
        assert res.status_code == 403

    def test_list_forbids_maker(self, client, patch_admin_products, maker_user):
        res = client.get("/v1/admin/products")
        assert res.status_code == 403

    def test_detail_forbids_non_admin(
        self, client, patch_admin_products, farmer_user
    ):
        res = client.get(f"/v1/admin/products/{PRODUCT_ID}")
        assert res.status_code == 403

    def test_update_forbids_non_admin(
        self, client, patch_admin_products, farmer_user
    ):
        res = client.put(
            f"/v1/admin/products/{PRODUCT_ID}",
            json={"name": "Test", "is_public": False},
        )
        assert res.status_code == 403


# ─── ADR-0012 §2.4: AAL2 enforcement ─────────────────────────────────


class TestAAL2Enforcement:
    """AAL1 admin の JWT は 401 `aal_insufficient` で reject される。"""

    def test_list_rejects_aal1_admin(
        self, client, patch_admin_products, admin_user_aal1
    ):
        res = client.get("/v1/admin/products")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_detail_rejects_aal1_admin(
        self, client, patch_admin_products, admin_user_aal1
    ):
        res = client.get(f"/v1/admin/products/{PRODUCT_ID}")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_update_rejects_aal1_admin(
        self, client, patch_admin_products, admin_user_aal1
    ):
        res = client.put(
            f"/v1/admin/products/{PRODUCT_ID}",
            json={"name": "Test", "is_public": False},
        )
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_list_rejects_missing_aal_claim(
        self, client, patch_admin_products, override_user
    ):
        override_user({"sub": ADMIN_ID, "app_metadata": {"role": "admin"}})
        res = client.get("/v1/admin/products")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"


# ─── GET /v1/admin/products ────────────────────────────────────────────


def _attach_products_list(admin, rows: list[dict[str, Any]]) -> None:
    """count="exact" + .range() を模擬。supabase-py の挙動と整合させる。"""
    original_table = admin.table

    def _table(name: str):
        q = original_table(name)

        def _execute():
            class _Resp:
                pass

            resp = _Resp()
            resp.data = []
            resp.count = 0
            if name == "products":
                range_call = next((c for c in q.calls if c[0] == "range"), None)
                if range_call is not None:
                    start, end = range_call[1][0], range_call[1][1]
                    resp.data = rows[start : end + 1]
                else:
                    resp.data = list(rows)
                resp.count = len(rows)
            admin.executed.append({"table": name, "calls": list(q.calls)})
            return resp

        q.execute = _execute
        return q

    admin.table = _table  # type: ignore[method-assign]


def _product_row(
    product_id: str,
    name: str = "Test Product",
    is_public: bool = False,
    confidence: str | None = "高",
) -> dict[str, Any]:
    return {
        "id": product_id,
        "name": name,
        "product_name_jp": "テスト資材",
        "maker_id": MAKER_ID,
        "product_type_id": PRODUCT_TYPE_ID,
        "commercial_status": "available",
        "is_public": is_public,
        "confidence": confidence,
        "created_at": "2026-05-10T00:00:00Z",
        "updated_at": "2026-05-26T00:00:00Z",
        "users": {
            "name": "Maker Inc",
            "status": "active",
            "maker_profiles": {"company_name": "Acme Bio"},
        },
        "product_types": {"id": PRODUCT_TYPE_ID, "name": "BS資材"},
        "product_images": [
            {"url": "https://example.com/img1.jpg", "order": 0, "is_primary": True},
            {"url": "https://example.com/img2.jpg", "order": 1, "is_primary": False},
        ],
    }


class TestList:
    def test_returns_paginated_rows(
        self, client, patch_admin_products, admin_user
    ):
        admin = patch_admin_products
        rows = [_product_row(f"00000000-0000-0000-0000-00000000000{i}", f"P{i}") for i in range(5)]
        _attach_products_list(admin, rows)

        res = client.get("/v1/admin/products?page=1&per_page=2")
        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 5
        assert body["page"] == 1
        assert body["per_page"] == 2
        assert len(body["products"]) == 2
        first = body["products"][0]
        assert first["name"] == "P0"
        assert first["maker_name"] == "Acme Bio"
        assert first["product_type_name"] == "BS資材"
        assert first["thumbnail_url"] == "https://example.com/img1.jpg"
        assert first["confidence"] == "高"

    def test_orders_by_updated_at_desc_then_id_desc(
        self, client, patch_admin_products, admin_user
    ):
        """spec §3.1: pagination cursor が (updated_at DESC, id DESC) で安定。"""
        admin = patch_admin_products
        _attach_products_list(admin, [])
        client.get("/v1/admin/products")
        products_query = next(q for q in admin.executed if q["table"] == "products")
        order_calls = [c for c in products_query["calls"] if c[0] == "order"]
        # 順序: updated_at DESC → id DESC
        assert len(order_calls) >= 2
        assert order_calls[0][1] == ("updated_at",)
        assert order_calls[0][2] == {"desc": True}
        assert order_calls[1][1] == ("id",)
        assert order_calls[1][2] == {"desc": True}

    def test_filter_maker_id_applied(
        self, client, patch_admin_products, admin_user
    ):
        admin = patch_admin_products
        _attach_products_list(admin, [])
        client.get(f"/v1/admin/products?maker_id={MAKER_ID}")
        products_query = next(q for q in admin.executed if q["table"] == "products")
        eq_calls = [c for c in products_query["calls"] if c[0] == "eq"]
        assert any(c[1] == ("maker_id", MAKER_ID) for c in eq_calls), eq_calls

    def test_filter_is_public_applied(
        self, client, patch_admin_products, admin_user
    ):
        admin = patch_admin_products
        _attach_products_list(admin, [])
        client.get("/v1/admin/products?is_public=true")
        products_query = next(q for q in admin.executed if q["table"] == "products")
        eq_calls = [c for c in products_query["calls"] if c[0] == "eq"]
        assert any(c[1] == ("is_public", True) for c in eq_calls), eq_calls

    def test_search_q_uses_or_filter(
        self, client, patch_admin_products, admin_user
    ):
        """name + product_name_jp の部分一致 (OR、ilike)。"""
        admin = patch_admin_products
        _attach_products_list(admin, [])
        client.get("/v1/admin/products?q=acme")
        products_query = next(q for q in admin.executed if q["table"] == "products")
        # supabase-py の or_() は record("or_", arg) で記録される
        or_calls = [c for c in products_query["calls"] if c[0] == "or_"]
        assert or_calls, products_query["calls"]
        arg = or_calls[0][1][0]
        assert "name.ilike.%acme%" in arg
        assert "product_name_jp.ilike.%acme%" in arg

    def test_invalid_per_page_returns_422(
        self, client, patch_admin_products, admin_user
    ):
        res = client.get("/v1/admin/products?per_page=0")
        assert res.status_code == 422
        res = client.get("/v1/admin/products?per_page=101")
        assert res.status_code == 422

    def test_invalid_page_returns_422(
        self, client, patch_admin_products, admin_user
    ):
        res = client.get("/v1/admin/products?page=0")
        assert res.status_code == 422


# ─── GET /v1/admin/products/{id} ───────────────────────────────────────


def _detail_row() -> dict[str, Any]:
    return {
        "id": PRODUCT_ID,
        "name": "Acme Boost",
        "product_name_jp": "アクメブースト",
        "maker_id": MAKER_ID,
        "product_type_id": PRODUCT_TYPE_ID,
        "commercial_status": "available",
        "is_public": True,
        "general_purpose": "汎用",
        "primary_compound": "compound A",
        "mode_of_action": "moa",
        "technology_action": "tech",
        "disease_pest_info": "info",
        "expected_effects_official": "official",
        "expected_effects_farmille": "farmille",
        "usage_summary": "usage",
        "precautions": "prec",
        "storage_shelf_life": "shelf",
        "notes": "notes",
        "confidence": "高",
        "fertilizer_registered": True,
        "pesticide_registered": False,
        "label_url": None,
        "sds_url": None,
        "created_at": "2026-05-10T00:00:00Z",
        "updated_at": "2026-05-26T00:00:00Z",
        "users": {
            "name": "Maker Inc",
            "status": "active",
            "maker_profiles": {"company_name": "Acme Bio"},
        },
        "product_types": {"id": PRODUCT_TYPE_ID, "name": "BS資材"},
        "product_images": [
            {
                "id": IMG_ID,
                "url": "https://example.com/img1.jpg",
                "order": 0,
                "source_page_url": None,
                "alt_text": "alt",
                "image_type": "product_packaging",
                "is_primary": True,
                "rights_note": None,
                "confidence": "高",
            },
        ],
        "product_crops": [{"crops": {"id": CROP_ID, "name": "トマト"}}],
        "product_certifications": [
            {"certifications": {"id": CERT_ID, "name": "有機JAS"}}
        ],
        "product_benefit_relations": [
            {"product_benefits": {"id": BENEFIT_ID, "category": "栄養利用", "name": "養分吸収の改善"}}
        ],
    }


def _attach_detail(admin, product_data: dict[str, Any] | None, recipes: list[dict[str, Any]]) -> None:
    """detail endpoint は products 1 fetch + product_application_recipes 1 fetch の 2 段。"""
    original_table = admin.table

    def _table(name: str):
        q = original_table(name)

        def _execute():
            class _Resp:
                pass

            resp = _Resp()
            if name == "products":
                resp.data = [product_data] if product_data else []
            elif name == "product_application_recipes":
                resp.data = recipes
            else:
                resp.data = []
            admin.executed.append({"table": name, "calls": list(q.calls)})
            return resp

        q.execute = _execute
        return q

    admin.table = _table  # type: ignore[method-assign]


class TestDetail:
    def test_returns_detail_with_relations(
        self, client, patch_admin_products, admin_user
    ):
        admin = patch_admin_products
        _attach_detail(admin, _detail_row(), [])

        res = client.get(f"/v1/admin/products/{PRODUCT_ID}")
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == PRODUCT_ID
        assert body["name"] == "Acme Boost"
        assert body["product_name_jp"] == "アクメブースト"
        assert body["maker_name"] == "Acme Bio"
        assert body["is_public"] is True
        assert body["confidence"] == "高"
        assert len(body["crops"]) == 1
        assert body["crops"][0]["name"] == "トマト"
        assert len(body["certifications"]) == 1
        assert body["certifications"][0]["name"] == "有機JAS"
        assert len(body["benefits"]) == 1
        assert body["benefits"][0]["category"] == "栄養利用"
        assert len(body["images"]) == 1
        assert body["images"][0]["is_primary"] is True

    def test_returns_recipes_in_detail(
        self, client, patch_admin_products, admin_user
    ):
        """spec §3.2 / §5 DoD: 当該 product の product_application_recipes 全行が
        read-only テーブルで表示される。"""
        admin = patch_admin_products
        recipes = [
            {
                "id": RECIPE_ID,
                "crop_category": "果菜類",
                "crop_name": "トマト",
                "cultivation_type": "施設",
                "application_method": "葉面散布",
                "application_timing": "定植後",
                "growth_stage": "栄養成長期",
                "dilution_rate": "800-1000倍",
                "dose_raw_text": "100-150ml/10a",
                "dose_amount": None,
                "dose_unit": "ml",
                "dose_basis": "10a",
                "solution_amount": "100-150L",
                "original_liquid_equivalent": None,
                "max_dose_raw_text": "明記なし",
                "max_dose_amount": None,
                "max_dose_unit": None,
                "usage_notes": "7-14日間隔",
                "precautions_specific": None,
                "confidence": "高",
                "sort_order": 0,
            }
        ]
        _attach_detail(admin, _detail_row(), recipes)

        res = client.get(f"/v1/admin/products/{PRODUCT_ID}")
        assert res.status_code == 200
        body = res.json()
        assert len(body["recipes"]) == 1
        assert body["recipes"][0]["crop_name"] == "トマト"
        assert body["recipes"][0]["dilution_rate"] == "800-1000倍"
        # numeric は None で来る (Excel が「100-150」のレンジ表記のため)
        assert body["recipes"][0]["dose_amount"] is None
        assert body["recipes"][0]["dose_raw_text"] == "100-150ml/10a"

    def test_returns_404_when_missing(
        self, client, patch_admin_products, admin_user
    ):
        admin = patch_admin_products
        _attach_detail(admin, None, [])

        res = client.get(f"/v1/admin/products/{PRODUCT_ID}")
        assert res.status_code == 404
        assert res.json()["error"] == "product_not_found"


# ─── PUT /v1/admin/products/{id} ───────────────────────────────────────


class _DetectExists:
    """update path で `_exists_product` が SELECT を発行する。row 有無を制御。"""

    def __init__(self, exists: bool):
        self.exists = exists
        self.captured: dict[str, Any] = {}

    def attach(self, admin) -> None:
        original_table = admin.table

        def _table(name: str):
            q = original_table(name)

            def _execute():
                class _Resp:
                    pass

                resp = _Resp()
                resp.data = []
                ops = [c[0] for c in q.calls]
                if name == "products" and "select" in ops:
                    # _exists_product の SELECT
                    resp.data = [{"id": PRODUCT_ID}] if self.exists else []
                elif name == "products" and "update" in ops:
                    # update のペイロードを capture
                    upd = next(c for c in q.calls if c[0] == "update")
                    self.captured["products_update"] = upd[1][0]
                    resp.data = [{"id": PRODUCT_ID}]
                elif name in ("product_crops", "product_certifications", "product_benefit_relations"):
                    if "insert" in ops:
                        ins = next(c for c in q.calls if c[0] == "insert")
                        self.captured.setdefault(f"{name}_insert", []).extend(ins[1][0])
                    resp.data = []
                elif name == "product_images":
                    if "insert" in ops:
                        ins = next(c for c in q.calls if c[0] == "insert")
                        self.captured["product_images_insert"] = ins[1][0]
                    resp.data = []
                admin.executed.append({"table": name, "calls": list(q.calls)})
                return resp

            q.execute = _execute
            return q

        admin.table = _table  # type: ignore[method-assign]


class TestUpdate:
    def test_updates_basic_fields(
        self, client, patch_admin_products, admin_user
    ):
        admin = patch_admin_products
        det = _DetectExists(exists=True)
        det.attach(admin)

        payload = {
            "name": "New Name",
            "product_name_jp": "新名称",
            "product_type_id": PRODUCT_TYPE_ID,
            "commercial_status": "available",
            "is_public": True,
            "general_purpose": "汎用",
            "confidence": "高",
        }
        res = client.put(f"/v1/admin/products/{PRODUCT_ID}", json=payload)
        assert res.status_code == 200, res.text
        assert res.json() == {"ok": True, "product_id": PRODUCT_ID}

        upd = det.captured["products_update"]
        assert upd["name"] == "New Name"
        assert upd["product_name_jp"] == "新名称"
        assert upd["is_public"] is True
        assert upd["confidence"] == "高"
        assert upd["product_type_id"] == PRODUCT_TYPE_ID

    def test_replaces_v1_relations(
        self, client, patch_admin_products, admin_user
    ):
        """v1 必達 3 種 (crops + certifications + benefits) を delete-then-insert する。"""
        admin = patch_admin_products
        det = _DetectExists(exists=True)
        det.attach(admin)

        payload = {
            "name": "P",
            "is_public": False,
            "crop_ids": [CROP_ID],
            "certification_ids": [CERT_ID],
            "benefit_ids": [BENEFIT_ID],
        }
        res = client.put(f"/v1/admin/products/{PRODUCT_ID}", json=payload)
        assert res.status_code == 200

        assert det.captured.get("product_crops_insert") == [
            {"product_id": PRODUCT_ID, "crop_id": CROP_ID}
        ]
        assert det.captured.get("product_certifications_insert") == [
            {"product_id": PRODUCT_ID, "certification_id": CERT_ID}
        ]
        assert det.captured.get("product_benefit_relations_insert") == [
            {"product_id": PRODUCT_ID, "product_benefit_id": BENEFIT_ID}
        ]
        # 3 種いずれにも DELETE が走ったことを verify
        for tbl in ("product_crops", "product_certifications", "product_benefit_relations"):
            tbl_query = next(q for q in admin.executed if q["table"] == tbl)
            assert any(c[0] == "delete" for c in tbl_query["calls"]), (tbl, tbl_query["calls"])

    def test_does_not_touch_images_when_omitted(
        self, client, patch_admin_products, admin_user
    ):
        """payload.images が None なら product_images を一切触らない (部分編集)。"""
        admin = patch_admin_products
        det = _DetectExists(exists=True)
        det.attach(admin)

        res = client.put(
            f"/v1/admin/products/{PRODUCT_ID}",
            json={"name": "P", "is_public": False},
        )
        assert res.status_code == 200
        # product_images table に触れていない
        assert not any(q["table"] == "product_images" for q in admin.executed)

    def test_replaces_images_when_provided(
        self, client, patch_admin_products, admin_user
    ):
        admin = patch_admin_products
        det = _DetectExists(exists=True)
        det.attach(admin)

        res = client.put(
            f"/v1/admin/products/{PRODUCT_ID}",
            json={
                "name": "P",
                "is_public": False,
                "images": [
                    {
                        "url": "https://example.com/new.jpg",
                        "order": 0,
                        "is_primary": True,
                        "image_type": "product_packaging",
                    },
                    {
                        "url": "https://example.com/new2.jpg",
                        "order": 1,
                        "is_primary": True,  # 2件目だが is_primary は最初の1件のみ true
                    },
                ],
            },
        )
        assert res.status_code == 200
        inserted = det.captured["product_images_insert"]
        assert len(inserted) == 2
        assert inserted[0]["is_primary"] is True
        # 2件目は is_primary 強制で false (helper / migration C 整合)
        assert inserted[1]["is_primary"] is False

    def test_returns_404_when_product_missing(
        self, client, patch_admin_products, admin_user
    ):
        admin = patch_admin_products
        det = _DetectExists(exists=False)
        det.attach(admin)

        res = client.put(
            f"/v1/admin/products/{PRODUCT_ID}",
            json={"name": "P", "is_public": False},
        )
        assert res.status_code == 404
        assert res.json()["error"] == "product_not_found"


# ─── /v1/admin/makers?status=active (admin.py 拡張、§2.2) ───────────────


@pytest.fixture()
def patch_router_admin(monkeypatch, fake_admin):
    """既存 admin.py の get_supabase_admin を差し替え。"""
    import app.routers.admin as mod

    fake_admin.auth = SimpleNamespace(admin=MagicMock())
    monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake_admin)
    return fake_admin


class TestMakersActive:
    def test_returns_active_makers(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        original_table = admin.table

        def _table(name: str):
            q = original_table(name)

            def _execute():
                class _Resp:
                    pass

                resp = _Resp()
                if name == "users":
                    resp.data = [
                        {
                            "id": MAKER_ID,
                            "name": "Maker Inc",
                            "maker_profiles": {"company_name": "Acme Bio"},
                        }
                    ]
                else:
                    resp.data = []
                admin.executed.append({"table": name, "calls": list(q.calls)})
                return resp

            q.execute = _execute
            return q

        admin.table = _table  # type: ignore[method-assign]

        res = client.get("/v1/admin/makers?status=active")
        assert res.status_code == 200
        body = res.json()
        assert len(body["makers"]) == 1
        assert body["makers"][0]["user_id"] == MAKER_ID
        assert body["makers"][0]["company_name"] == "Acme Bio"

        users_query = next(q for q in admin.executed if q["table"] == "users")
        eq_calls = [c for c in users_query["calls"] if c[0] == "eq"]
        assert any(c[1] == ("role", "maker") for c in eq_calls)
        assert any(c[1] == ("status", "active") for c in eq_calls)

    def test_forbids_non_admin(self, client, patch_router_admin, farmer_user):
        res = client.get("/v1/admin/makers")
        assert res.status_code == 403

    def test_rejects_aal1_admin(
        self, client, patch_router_admin, admin_user_aal1
    ):
        res = client.get("/v1/admin/makers")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"


# ─── /v1/admin/summary 拡張 (§3.4 products カウント) ───────────────────


class TestSummaryV2Counts:
    """既存 TestSummary は test_admin_router.py、ここでは v2 新規列 (products_total /
    products_public_total) を確認。"""

    def test_includes_products_counts(
        self, client, patch_router_admin, admin_user
    ):
        admin = patch_router_admin
        # _count は 6 回呼ばれる (users x 4, products x 2)
        responses = [
            [{"id": "p1"}],  # pending
            [],  # active
            [{"id": "r1"}],  # rejected
            [{"id": "u1"}, {"id": "u2"}],  # total users
            [{"id": "prod1"}, {"id": "prod2"}, {"id": "prod3"}],  # products_total
            [{"id": "prod1"}],  # products_public_total
        ]
        call_idx = {"i": 0}
        original_table = admin.table

        def _table(name: str):
            q = original_table(name)

            def _execute():
                data = (
                    responses[call_idx["i"]] if call_idx["i"] < len(responses) else []
                )
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
        assert body["products_total"] == 3
        assert body["products_public_total"] == 1
        # 既存 fields も壊れていない
        assert body["pending_makers_count"] == 1
        assert body["active_makers_count"] == 0
        assert body["rejected_makers_count"] == 1
        assert body["total_users_count"] == 2

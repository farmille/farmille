"""Tests for /v1/manufacturers public endpoints (Phase 17).

We swap `app.routers.manufacturers.get_supabase_admin` with a fake recorded
client (FakeSupabaseAdmin) so we can both verify response shape AND check the
BFF called Supabase with the expected filters / select clauses.
"""

from __future__ import annotations

import pytest


# ---- helpers ----------------------------------------------------------------

USER_ID_1 = "00000000-0000-0000-0000-000000000001"
USER_ID_2 = "00000000-0000-0000-0000-000000000002"
USER_ID_3 = "00000000-0000-0000-0000-000000000003"  # has no maker_profile
PRODUCT_ID = "11111111-1111-1111-1111-111111111111"
TYPE_ID = "22222222-2222-2222-2222-222222222222"


@pytest.fixture()
def patch_router_admin(monkeypatch, fake_admin):
    """The router imports `get_supabase_admin` directly, so monkeypatch the
    module attribute (FastAPI dep override does NOT apply to direct imports)."""
    import app.routers.manufacturers as mod

    monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake_admin)
    return fake_admin


# ---- list -------------------------------------------------------------------


class TestListManufacturers:
    def test_returns_only_makers_with_profile(self, client, patch_router_admin):
        admin = patch_router_admin
        admin.set_response(
            "users",
            [
                {
                    "id": USER_ID_1,
                    "created_at": "2026-05-01T00:00:00Z",
                    "maker_profiles": {
                        "company_name": "Acme Bio",
                        "prefecture": "北海道",
                        "city": "札幌市",
                    },
                },
                {
                    "id": USER_ID_2,
                    "created_at": "2026-05-02T00:00:00Z",
                    "maker_profiles": {
                        "company_name": "Beta Microbes",
                        "prefecture": None,
                        "city": None,
                    },
                },
                {
                    # Onboarding-incomplete: no profile row -> filtered out.
                    "id": USER_ID_3,
                    "created_at": "2026-05-03T00:00:00Z",
                    "maker_profiles": None,
                },
            ],
        )
        admin.set_response(
            "products",
            [
                {"id": "p1", "maker_id": USER_ID_1},
                {"id": "p2", "maker_id": USER_ID_1},
                {"id": "p3", "maker_id": USER_ID_2},
            ],
        )

        res = client.get("/v1/manufacturers")
        assert res.status_code == 200
        body = res.json()
        ids = [m["id"] for m in body["manufacturers"]]
        assert USER_ID_3 not in ids, "missing-profile maker must not surface"
        assert {USER_ID_1, USER_ID_2} == set(ids)
        counts = {m["id"]: m["product_count"] for m in body["manufacturers"]}
        assert counts[USER_ID_1] == 2
        assert counts[USER_ID_2] == 1

    def test_list_calls_supabase_with_role_filter_and_order(
        self, client, patch_router_admin
    ):
        admin = patch_router_admin
        admin.set_response("users", [])
        client.get("/v1/manufacturers")

        users_query = next(q for q in admin.executed if q["table"] == "users")
        ops = [c[0] for c in users_query["calls"]]
        assert "select" in ops
        assert "eq" in ops
        # eq("role", "maker")
        eq_calls = [c for c in users_query["calls"] if c[0] == "eq"]
        assert any(c[1] == ("role", "maker") for c in eq_calls), eq_calls
        # Sorted by created_at desc
        order_calls = [c for c in users_query["calls"] if c[0] == "order"]
        assert any(c[1] == ("created_at",) and c[2].get("desc") for c in order_calls)

    def test_limit_query_default_is_100(self, client, patch_router_admin):
        admin = patch_router_admin
        admin.set_response("users", [])
        client.get("/v1/manufacturers")
        users_query = next(q for q in admin.executed if q["table"] == "users")
        limit_calls = [c for c in users_query["calls"] if c[0] == "limit"]
        assert limit_calls and limit_calls[0][1] == (100,)

    def test_limit_too_large_returns_422(self, client, patch_router_admin):
        res = client.get("/v1/manufacturers?limit=999")
        assert res.status_code == 422

    def test_limit_zero_returns_422(self, client, patch_router_admin):
        res = client.get("/v1/manufacturers?limit=0")
        assert res.status_code == 422

    def test_empty_when_no_makers(self, client, patch_router_admin):
        admin = patch_router_admin
        admin.set_response("users", [])
        res = client.get("/v1/manufacturers")
        assert res.status_code == 200
        assert res.json() == {"manufacturers": []}

    def test_handles_maker_profile_returned_as_list(self, client, patch_router_admin):
        """Supabase nested 1:1 join is sometimes returned as list[dict]."""
        admin = patch_router_admin
        admin.set_response(
            "users",
            [
                {
                    "id": USER_ID_1,
                    "created_at": "2026-05-01T00:00:00Z",
                    "maker_profiles": [
                        {"company_name": "Acme Bio", "prefecture": "東京都", "city": None}
                    ],
                }
            ],
        )
        admin.set_response("products", [])
        res = client.get("/v1/manufacturers")
        assert res.status_code == 200
        body = res.json()
        assert body["manufacturers"][0]["company_name"] == "Acme Bio"


# ---- detail -----------------------------------------------------------------


class TestGetManufacturer:
    def test_returns_detail_with_products(self, client, patch_router_admin):
        admin = patch_router_admin
        admin.set_response(
            "users",
            [
                {
                    "id": USER_ID_1,
                    "role": "maker",
                    "maker_profiles": {
                        "company_name": "Acme Bio",
                        "prefecture": "北海道",
                        "city": "札幌市",
                        "note": "BS資材専業",
                    },
                }
            ],
        )
        admin.set_response(
            "products",
            [
                {
                    "id": PRODUCT_ID,
                    "name": "Acme Microbe X",
                    "created_at": "2026-04-01T00:00:00Z",
                    "product_types": {"name": "微生物資材"},
                    "product_images": [
                        {"url": "https://example.com/img.jpg", "order": 0}
                    ],
                }
            ],
        )
        res = client.get(f"/v1/manufacturers/{USER_ID_1}")
        assert res.status_code == 200
        body = res.json()
        assert body["company_name"] == "Acme Bio"
        assert body["note"] == "BS資材専業"
        assert len(body["products"]) == 1
        assert body["products"][0]["type_name"] == "微生物資材"
        assert body["products"][0]["image_url"] == "https://example.com/img.jpg"

    def test_404_when_user_not_found(self, client, patch_router_admin):
        admin = patch_router_admin
        admin.set_response("users", [])
        res = client.get(f"/v1/manufacturers/{USER_ID_1}")
        assert res.status_code == 404
        assert res.json()["detail"] == "manufacturer_not_found"

    def test_404_when_role_is_not_maker(self, client, patch_router_admin):
        admin = patch_router_admin
        admin.set_response(
            "users",
            [
                {
                    "id": USER_ID_1,
                    "role": "farmer",
                    "maker_profiles": None,
                }
            ],
        )
        res = client.get(f"/v1/manufacturers/{USER_ID_1}")
        assert res.status_code == 404
        assert res.json()["detail"] == "manufacturer_not_found"

    def test_404_when_maker_profile_missing(self, client, patch_router_admin):
        """Onboarding-incomplete maker -> public detail must not render."""
        admin = patch_router_admin
        admin.set_response(
            "users",
            [
                {
                    "id": USER_ID_1,
                    "role": "maker",
                    "maker_profiles": None,
                }
            ],
        )
        res = client.get(f"/v1/manufacturers/{USER_ID_1}")
        assert res.status_code == 404
        assert res.json()["detail"] == "manufacturer_not_found"

    def test_invalid_uuid_returns_422(self, client, patch_router_admin):
        res = client.get("/v1/manufacturers/not-a-uuid")
        assert res.status_code == 422

    def test_returns_empty_products_array_when_none_registered(
        self, client, patch_router_admin
    ):
        admin = patch_router_admin
        admin.set_response(
            "users",
            [
                {
                    "id": USER_ID_1,
                    "role": "maker",
                    "maker_profiles": {
                        "company_name": "Acme Bio",
                        "prefecture": None,
                        "city": None,
                        "note": None,
                    },
                }
            ],
        )
        admin.set_response("products", [])
        res = client.get(f"/v1/manufacturers/{USER_ID_1}")
        assert res.status_code == 200
        assert res.json()["products"] == []

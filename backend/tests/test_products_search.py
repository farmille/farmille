"""Tests for the public `/v1/products` list endpoint focusing on the new `q`
search parameter (spec admin-aglist-alignment-v2 §3.1, /products list page).
"""

from __future__ import annotations

from typing import Any

import pytest


PRODUCT_ROW: dict[str, Any] = {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "BioTrinsic",
    "maker_id": "22222222-2222-2222-2222-222222222222",
    "users": {
        "name": "Pivot Bio",
        "status": "active",
        "maker_profiles": {"company_name": "Pivot Bio"},
    },
    "product_types": {"id": "33333333-3333-3333-3333-333333333333", "name": "微生物資材"},
    "product_images": [],
    "created_at": "2026-04-01T00:00:00Z",
}


@pytest.fixture()
def patch_products_admin(patch_admin_in_router):
    patch_admin_in_router("app.routers.products")


def _select_calls(executed: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Filter executed queries that hit the products table with a select."""
    return [
        e
        for e in executed
        if e["table"] == "products"
        and any(name == "select" for name, _, _ in e["calls"])
    ]


class TestListQueryParam:
    def test_no_q_skips_or_filter(self, client, fake_admin, patch_products_admin):
        fake_admin.set_response("products", [PRODUCT_ROW])
        res = client.get("/v1/products")
        assert res.status_code == 200

        select_calls = _select_calls(fake_admin.executed)
        assert select_calls, "expected at least one select against products"
        ops = [name for name, _, _ in select_calls[0]["calls"]]
        assert "or_" not in ops

    def test_q_applies_or_ilike(self, client, fake_admin, patch_products_admin):
        fake_admin.set_response("products", [PRODUCT_ROW])
        res = client.get("/v1/products?q=trinsic")
        assert res.status_code == 200

        select_calls = _select_calls(fake_admin.executed)
        assert select_calls, "expected at least one select against products"
        or_calls = [c for c in select_calls[0]["calls"] if c[0] == "or_"]
        assert len(or_calls) == 1, "exactly one or_ filter expected for q"
        (filter_expr,) = or_calls[0][1]
        assert "name.ilike.%trinsic%" in filter_expr
        assert "product_name_jp.ilike.%trinsic%" in filter_expr

    def test_q_strips_commas(self, client, fake_admin, patch_products_admin):
        # comma is reserved in PostgREST `or` syntax; the endpoint sanitizes it.
        fake_admin.set_response("products", [PRODUCT_ROW])
        res = client.get("/v1/products?q=a,b")
        assert res.status_code == 200

        select_calls = _select_calls(fake_admin.executed)
        or_calls = [c for c in select_calls[0]["calls"] if c[0] == "or_"]
        assert len(or_calls) == 1
        (filter_expr,) = or_calls[0][1]
        # The "," must be removed before reaching the or_ filter.
        assert "ilike.%ab%" in filter_expr

    def test_q_only_whitespace_treated_as_empty(
        self, client, fake_admin, patch_products_admin
    ):
        fake_admin.set_response("products", [PRODUCT_ROW])
        res = client.get("/v1/products?q=%20%20")
        assert res.status_code == 200

        select_calls = _select_calls(fake_admin.executed)
        ops = [name for name, _, _ in select_calls[0]["calls"]]
        assert "or_" not in ops

    def test_q_max_length_enforced(self, client, fake_admin, patch_products_admin):
        long_q = "a" * 101
        res = client.get(f"/v1/products?q={long_q}")
        # FastAPI Query(max_length=100) → 422
        assert res.status_code == 422

"""admin の製品登録・レビュー投稿 (2026-06-07 開放) のテスト。

- admin (aal2) は製品登録でき、maker_id は Farmille ハウスアカウント
  (settings.farmille_maker_user_id) に強制される
- farmille_maker_user_id 未設定なら 503 farmille_maker_not_configured
- admin はレビュー投稿でき、user_id は admin 自身の sub
- maker の従来挙動 (maker_id = sub) は不変
"""

from __future__ import annotations

from typing import Any

import pytest

ADMIN_SUB = "99999999-9999-9999-9999-999999999999"
MAKER_SUB = "11111111-1111-1111-1111-111111111111"
HOUSE_ID = "64f02946-aaaa-bbbb-cccc-000000000000"
PRODUCT_TYPE_ID = "44444444-4444-4444-4444-444444444444"
REVIEW_ID = "55555555-5555-5555-5555-555555555555"
PRODUCT_ID = "66666666-6666-6666-6666-666666666666"


@pytest.fixture()
def patch_products_admin(patch_admin_in_router):
    patch_admin_in_router("app.routers.products")


@pytest.fixture()
def admin_user(override_user) -> dict[str, Any]:
    payload = {
        "sub": ADMIN_SUB,
        "app_metadata": {"role": "admin"},
        "aal": "aal2",
    }
    override_user(payload)
    return payload


def _product_insert_calls(executed: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        e
        for e in executed
        if e["table"] == "products"
        and any(name == "insert" for name, _, _ in e["calls"])
    ]


def _create_payload() -> dict[str, Any]:
    return {"name": "テスト資材", "product_type_id": PRODUCT_TYPE_ID}


class TestAdminCreateProduct:
    def test_admin_creates_as_farmille(
        self, client, fake_admin, patch_products_admin, admin_user, monkeypatch
    ):
        monkeypatch.setattr(
            "app.routers.products.settings.farmille_maker_user_id", HOUSE_ID
        )
        fake_admin.set_response("products", [{"id": PRODUCT_ID}], op="insert")

        res = client.post("/v1/products", json=_create_payload())

        assert res.status_code == 201
        assert res.json() == {"ok": True, "product_id": PRODUCT_ID}
        inserts = _product_insert_calls(fake_admin.executed)
        assert len(inserts) == 1
        insert_args = next(
            args for name, args, _ in inserts[0]["calls"] if name == "insert"
        )
        assert insert_args[0]["maker_id"] == HOUSE_ID

    def test_admin_blocked_when_house_account_unconfigured(
        self, client, fake_admin, patch_products_admin, admin_user, monkeypatch
    ):
        monkeypatch.setattr(
            "app.routers.products.settings.farmille_maker_user_id", None
        )

        res = client.post("/v1/products", json=_create_payload())

        assert res.status_code == 503
        assert res.json()["error"] == "farmille_maker_not_configured"
        assert _product_insert_calls(fake_admin.executed) == []

    def test_maker_still_creates_as_self(
        self, client, fake_admin, patch_products_admin, maker_user, monkeypatch
    ):
        # admin 用設定が入っていても maker は自分の sub に紐づく
        monkeypatch.setattr(
            "app.routers.products.settings.farmille_maker_user_id", HOUSE_ID
        )
        fake_admin.set_response("products", [{"id": PRODUCT_ID}], op="insert")

        res = client.post("/v1/products", json=_create_payload())

        assert res.status_code == 201
        inserts = _product_insert_calls(fake_admin.executed)
        insert_args = next(
            args for name, args, _ in inserts[0]["calls"] if name == "insert"
        )
        assert insert_args[0]["maker_id"] == MAKER_SUB


class TestAdminCreateReview:
    def test_admin_posts_review_as_self(
        self, client, fake_admin, patch_products_admin, admin_user
    ):
        fake_admin.set_response("reviews", [], op="select")
        fake_admin.set_response("reviews", [{"id": REVIEW_ID}], op="insert")

        res = client.post(
            f"/v1/products/{PRODUCT_ID}/reviews",
            json={"review_id": REVIEW_ID, "rating": 4, "body": "運営テスト"},
        )

        assert res.status_code == 201
        review_inserts = [
            e
            for e in fake_admin.executed
            if e["table"] == "reviews"
            and any(name == "insert" for name, _, _ in e["calls"])
        ]
        assert len(review_inserts) == 1
        insert_args = next(
            args
            for name, args, _ in review_inserts[0]["calls"]
            if name == "insert"
        )
        assert insert_args[0]["user_id"] == ADMIN_SUB

    def test_unassigned_still_forbidden(
        self, client, fake_admin, patch_products_admin, unassigned_user
    ):
        res = client.post(
            f"/v1/products/{PRODUCT_ID}/reviews",
            json={"review_id": REVIEW_ID, "rating": 4, "body": "x"},
        )
        assert res.status_code == 403

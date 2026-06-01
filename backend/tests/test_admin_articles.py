"""Tests for /v1/admin/articles/* (ADR-0014 / docs/drafts/admin-articles-cms-spec.md)。

`app.routers.admin_articles` imports `get_supabase_admin` directly, so we
monkeypatch the module attribute (FastAPI dep override does NOT apply to direct
imports). Pattern follows test_admin_router.py (admin_user / admin_user_aal1
fixtures, FakeSupabaseAdmin via fake_admin, set_response).
"""

from __future__ import annotations

from typing import Any

import pytest

ADMIN_USER_ID = "00000000-0000-0000-0000-00000000aaaa"
ARTICLE_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


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
def patch_router(monkeypatch, fake_admin):
    import app.routers.admin_articles as mod

    monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake_admin)
    return fake_admin


def _article_row(**overrides: Any) -> dict[str, Any]:
    base = {
        "id": ARTICLE_ID,
        "slug": "my-first-article",
        "title": "最初の記事",
        "body_md": "# 見出し\n本文",
        "category": "column",
        "hero_image_url": None,
        "author_user_id": None,
        "published_at": None,
        "created_at": "2026-06-01T00:00:00Z",
        "updated_at": "2026-06-01T00:00:00Z",
    }
    base.update(overrides)
    return base


# ─── auth / role / AAL2 guard ──────────────────────────────────────────


class TestGuard:
    def test_list_requires_auth(self, client, patch_router):
        res = client.get("/v1/admin/articles")
        assert res.status_code in (401, 403)

    def test_list_forbids_farmer(self, client, patch_router, farmer_user):
        res = client.get("/v1/admin/articles")
        assert res.status_code == 403

    def test_list_forbids_maker(self, client, patch_router, maker_user):
        res = client.get("/v1/admin/articles")
        assert res.status_code == 403

    def test_get_forbids_non_admin(self, client, patch_router, farmer_user):
        res = client.get(f"/v1/admin/articles/{ARTICLE_ID}")
        assert res.status_code == 403

    def test_create_forbids_non_admin(self, client, patch_router, farmer_user):
        res = client.post(
            "/v1/admin/articles",
            json={
                "slug": "abc",
                "title": "t",
                "body_md": "b",
                "category": "column",
            },
        )
        assert res.status_code == 403

    def test_patch_forbids_non_admin(self, client, patch_router, farmer_user):
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}", json={"title": "x"}
        )
        assert res.status_code == 403

    def test_delete_forbids_non_admin(self, client, patch_router, farmer_user):
        res = client.delete(f"/v1/admin/articles/{ARTICLE_ID}")
        assert res.status_code == 403


class TestAAL2Enforcement:
    """AAL1 admin の JWT は 401 `aal_insufficient` で reject される (ADR-0012)。"""

    def test_list_rejects_aal1_admin(self, client, patch_router, admin_user_aal1):
        res = client.get("/v1/admin/articles")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_get_rejects_aal1_admin(self, client, patch_router, admin_user_aal1):
        res = client.get(f"/v1/admin/articles/{ARTICLE_ID}")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_create_rejects_aal1_admin(self, client, patch_router, admin_user_aal1):
        res = client.post(
            "/v1/admin/articles",
            json={
                "slug": "abc",
                "title": "t",
                "body_md": "b",
                "category": "column",
            },
        )
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_patch_rejects_aal1_admin(self, client, patch_router, admin_user_aal1):
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}", json={"title": "x"}
        )
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_delete_rejects_aal1_admin(self, client, patch_router, admin_user_aal1):
        res = client.delete(f"/v1/admin/articles/{ARTICLE_ID}")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"

    def test_missing_aal_claim_treated_as_aal1(
        self, client, patch_router, override_user
    ):
        override_user({"sub": ADMIN_USER_ID, "app_metadata": {"role": "admin"}})
        res = client.get("/v1/admin/articles")
        assert res.status_code == 401
        assert res.json()["detail"] == "aal_insufficient"


# ─── GET /v1/admin/articles (list) ─────────────────────────────────────


class TestList:
    def test_returns_articles_including_drafts(
        self, client, patch_router, admin_user
    ):
        admin = patch_router
        admin.set_response(
            "articles",
            [
                _article_row(),
                _article_row(
                    id="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                    slug="draft-one",
                    published_at=None,
                ),
            ],
            op="select",
        )
        res = client.get("/v1/admin/articles")
        assert res.status_code == 200
        body = res.json()
        assert len(body["articles"]) == 2
        # 下書き (published_at=None) も返ること
        assert any(a["published_at"] is None for a in body["articles"])
        assert body["page"] == 1
        assert body["per_page"] == 50

    def test_pagination_uses_range(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [], op="select")
        client.get("/v1/admin/articles?page=2&per_page=10")
        q = next(q for q in admin.executed if q["table"] == "articles")
        range_calls = [c for c in q["calls"] if c[0] == "range"]
        assert range_calls and range_calls[0][1] == (10, 19)

    def test_invalid_per_page_returns_422(self, client, patch_router, admin_user):
        assert client.get("/v1/admin/articles?per_page=0").status_code == 422
        assert client.get("/v1/admin/articles?per_page=101").status_code == 422


# ─── GET /v1/admin/articles/{id} (detail) ──────────────────────────────


class TestDetail:
    def test_returns_full_article(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [_article_row()], op="select")
        res = client.get(f"/v1/admin/articles/{ARTICLE_ID}")
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == ARTICLE_ID
        assert body["body_md"] == "# 見出し\n本文"
        assert body["slug"] == "my-first-article"

    def test_404_when_missing(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [], op="select")
        res = client.get(f"/v1/admin/articles/{ARTICLE_ID}")
        assert res.status_code == 404
        assert res.json()["error"] == "article_not_found"


# ─── POST /v1/admin/articles (create) ──────────────────────────────────


class TestCreate:
    def test_creates_article_and_sets_author_from_jwt(
        self, client, patch_router, admin_user
    ):
        admin = patch_router
        # slug 重複チェック (select) は空、insert は新 id を返す。
        admin.set_response("articles", [], op="select")
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="insert")
        res = client.post(
            "/v1/admin/articles",
            json={
                "slug": "new-article",
                "title": "新しい記事",
                "body_md": "本文です",
                "category": "featured",
                "published_at": "2026-06-02T00:00:00Z",
            },
        )
        assert res.status_code == 200
        assert res.json() == {"ok": True, "id": ARTICLE_ID}
        # author_user_id は payload ではなく JWT の sub を使う
        insert_calls = [
            c[1][0]
            for q in admin.executed
            if q["table"] == "articles"
            for c in q["calls"]
            if c[0] == "insert"
        ]
        assert insert_calls
        assert insert_calls[0]["author_user_id"] == ADMIN_USER_ID
        assert insert_calls[0]["slug"] == "new-article"
        assert insert_calls[0]["published_at"] == "2026-06-02T00:00:00+00:00"

    def test_draft_when_published_at_omitted(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [], op="select")
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="insert")
        res = client.post(
            "/v1/admin/articles",
            json={
                "slug": "draft-article",
                "title": "下書き",
                "body_md": "まだ書きかけ",
                "category": "column",
            },
        )
        assert res.status_code == 200
        insert_calls = [
            c[1][0]
            for q in admin.executed
            if q["table"] == "articles"
            for c in q["calls"]
            if c[0] == "insert"
        ]
        assert insert_calls[0]["published_at"] is None

    def test_slug_duplicate_returns_409(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [{"id": "other-id"}], op="select")
        res = client.post(
            "/v1/admin/articles",
            json={
                "slug": "taken-slug",
                "title": "重複",
                "body_md": "本文",
                "category": "column",
            },
        )
        assert res.status_code == 409
        assert res.json()["error"] == "slug_already_exists"

    @pytest.mark.parametrize(
        "bad_payload",
        [
            {"slug": "ab", "title": "t", "body_md": "b", "category": "column"},  # slug 短すぎ
            {"slug": "Bad_Slug", "title": "t", "body_md": "b", "category": "column"},  # slug 不正
            {"slug": "ok-slug", "title": "", "body_md": "b", "category": "column"},  # title 空
            {"slug": "ok-slug", "title": "t", "body_md": "", "category": "column"},  # body 空
            {"slug": "ok-slug", "title": "t", "body_md": "b", "category": "invalid"},  # category 不正
            {"title": "t", "body_md": "b", "category": "column"},  # slug 欠落
        ],
    )
    def test_validation_returns_422(
        self, client, patch_router, admin_user, bad_payload
    ):
        res = client.post("/v1/admin/articles", json=bad_payload)
        assert res.status_code == 422

    def test_extra_field_rejected_422(self, client, patch_router, admin_user):
        res = client.post(
            "/v1/admin/articles",
            json={
                "slug": "ok-slug",
                "title": "t",
                "body_md": "b",
                "category": "column",
                "author_user_id": "11111111-1111-1111-1111-111111111111",  # 禁止キー
            },
        )
        assert res.status_code == 422


# ─── PATCH /v1/admin/articles/{id} ─────────────────────────────────────


class TestPatch:
    def test_partial_update_title_only(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="select")
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="update")
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}", json={"title": "更新後タイトル"}
        )
        assert res.status_code == 200
        assert res.json() == {"ok": True, "id": ARTICLE_ID}
        update_calls = [
            c[1][0]
            for q in admin.executed
            if q["table"] == "articles"
            for c in q["calls"]
            if c[0] == "update"
        ]
        assert update_calls and update_calls[0] == {"title": "更新後タイトル"}

    def test_publish_sets_published_at(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="select")
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="update")
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}",
            json={"published_at": "2026-06-02T12:00:00Z"},
        )
        assert res.status_code == 200
        update_calls = [
            c[1][0]
            for q in admin.executed
            if q["table"] == "articles"
            for c in q["calls"]
            if c[0] == "update"
        ]
        assert update_calls[0]["published_at"] == "2026-06-02T12:00:00+00:00"

    def test_unpublish_sets_null(self, client, patch_router, admin_user):
        """published_at=null は「非公開化」の明示意図として反映する。"""
        admin = patch_router
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="select")
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="update")
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}", json={"published_at": None}
        )
        assert res.status_code == 200
        update_calls = [
            c[1][0]
            for q in admin.executed
            if q["table"] == "articles"
            for c in q["calls"]
            if c[0] == "update"
        ]
        assert update_calls and "published_at" in update_calls[0]
        assert update_calls[0]["published_at"] is None

    def test_empty_body_returns_400(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="select")
        res = client.patch(f"/v1/admin/articles/{ARTICLE_ID}", json={})
        assert res.status_code == 400
        assert res.json()["error"] == "no_fields_to_update"

    def test_404_when_missing(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [], op="select")
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}", json={"title": "x"}
        )
        assert res.status_code == 404
        assert res.json()["error"] == "article_not_found"

    def test_slug_duplicate_returns_409(self, client, patch_router, admin_user):
        """別記事が既に使っている slug への変更は 409。"""
        admin = patch_router
        # _article_exists (select id) → True, _slug_exists (select id) → 別 id 返す
        admin.set_response(
            "articles", [{"id": "some-other-article"}], op="select"
        )
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}", json={"slug": "taken-by-other"}
        )
        assert res.status_code == 409
        assert res.json()["error"] == "slug_already_exists"

    def test_invalid_slug_returns_422(self, client, patch_router, admin_user):
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}", json={"slug": "Bad Slug!"}
        )
        assert res.status_code == 422

    def test_extra_field_rejected_422(self, client, patch_router, admin_user):
        res = client.patch(
            f"/v1/admin/articles/{ARTICLE_ID}",
            json={"author_user_id": "11111111-1111-1111-1111-111111111111"},
        )
        assert res.status_code == 422


# ─── DELETE /v1/admin/articles/{id} ────────────────────────────────────


class TestDelete:
    def test_deletes_article(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="select")
        admin.set_response("articles", [{"id": ARTICLE_ID}], op="delete")
        res = client.delete(f"/v1/admin/articles/{ARTICLE_ID}")
        assert res.status_code == 200
        assert res.json() == {"ok": True, "id": ARTICLE_ID}
        delete_ops = [
            c
            for q in admin.executed
            if q["table"] == "articles"
            for c in q["calls"]
            if c[0] == "delete"
        ]
        assert delete_ops, "expected a delete on articles"

    def test_404_when_missing(self, client, patch_router, admin_user):
        admin = patch_router
        admin.set_response("articles", [], op="select")
        res = client.delete(f"/v1/admin/articles/{ARTICLE_ID}")
        assert res.status_code == 404
        assert res.json()["error"] == "article_not_found"

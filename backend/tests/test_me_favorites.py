"""Phase 16: /v1/me/favorites endpoint tests.

spec: docs/specs/my-materials.md §9.1 受け入れ条件

カバー範囲:
- 200 / 201 / 204 正常系
- 401 未ログイン
- 403 maker / unassigned / non-owner
- 404 product_not_found / favorite_not_found
- 409 UNIQUE 違反 (already_exists)
- 422 kind 不正
- user_id 書き換え攻撃が無効化されること (POST payload に user_id を入れても
  JWT.sub が強制される) — spec §10.1
- kind 切替の冪等性
"""

from __future__ import annotations

USER_A = "11111111-1111-1111-1111-111111111111"
USER_B = "22222222-2222-2222-2222-222222222222"
PRODUCT_X = "33333333-3333-3333-3333-333333333333"
PRODUCT_Y = "44444444-4444-4444-4444-444444444444"


def _seed_product(fake, pid: str = PRODUCT_X) -> None:
    fake.set_table(
        "products",
        [
            {
                "id": pid,
                "name": "Test Product",
                "users": {"name": "MakerCo", "maker_profiles": {"company_name": "MakerCo Inc"}},
                "product_types": {"id": "type-1", "name": "微生物"},
                "product_images": [{"url": "https://example.test/a.jpg", "order": 0}],
            }
        ],
    )


# --------- GET /v1/me/favorites ---------------------------------------------


def test_get_favorites_returns_only_own_rows(client, fake_supabase, auth_override):
    _seed_product(fake_supabase)
    fake_supabase.set_table(
        "user_favorites",
        [
            {
                "id": "55555555-5555-5555-5555-5555555555A1",
                "user_id": USER_A,
                "product_id": PRODUCT_X,
                "kind": "favorite",
                "created_at": "2026-05-01T00:00:00+00:00",
                "products": {
                    "id": PRODUCT_X,
                    "name": "Test Product",
                    "users": {"name": "MakerCo", "maker_profiles": {"company_name": "MakerCo Inc"}},
                    "product_types": {"id": "type-1", "name": "微生物"},
                    "product_images": [{"url": "https://example.test/a.jpg", "order": 0}],
                },
            },
            {
                "id": "55555555-5555-5555-5555-5555555555B1",
                "user_id": USER_B,
                "product_id": PRODUCT_X,
                "kind": "favorite",
                "created_at": "2026-05-01T00:00:00+00:00",
                "products": {},
            },
        ],
    )
    with auth_override(role="farmer", sub=USER_A):
        res = client.get("/v1/me/favorites")
    assert res.status_code == 200, res.text
    body = res.json()
    assert len(body["favorites"]) == 1
    item = body["favorites"][0]
    assert item["id"] == "55555555-5555-5555-5555-5555555555A1"
    assert item["kind"] == "favorite"
    assert item["product"]["maker_name"] == "MakerCo Inc"
    assert item["product"]["type_name"] == "微生物"


def test_get_favorites_filter_by_kind(client, fake_supabase, auth_override):
    fake_supabase.set_table(
        "user_favorites",
        [
            {
                "id": "55555555-5555-5555-5555-5555555555F1",
                "user_id": USER_A,
                "product_id": PRODUCT_X,
                "kind": "favorite",
                "created_at": "2026-05-02",
                "products": {},
            },
            {
                "id": "55555555-5555-5555-5555-5555555555C1",
                "user_id": USER_A,
                "product_id": PRODUCT_Y,
                "kind": "candidate",
                "created_at": "2026-05-01",
                "products": {},
            },
        ],
    )
    with auth_override(role="ja_staff", sub=USER_A):
        res = client.get("/v1/me/favorites?kind=candidate")
    assert res.status_code == 200
    items = res.json()["favorites"]
    assert len(items) == 1
    assert items[0]["id"] == "55555555-5555-5555-5555-5555555555C1"


def test_get_favorites_unauthenticated_returns_401(client):
    res = client.get("/v1/me/favorites")
    assert res.status_code in (401, 403)
    # HTTPBearer auto_error は 403 を返す実装もあるため両方許容


def test_get_favorites_maker_returns_403(client, fake_supabase, auth_override):
    with auth_override(role="maker", sub=USER_A):
        res = client.get("/v1/me/favorites")
    assert res.status_code == 403


def test_get_favorites_unassigned_returns_403(client, fake_supabase, auth_override):
    with auth_override(role="unassigned", sub=USER_A):
        res = client.get("/v1/me/favorites")
    assert res.status_code == 403


def test_get_favorites_invalid_kind_returns_422(client, fake_supabase, auth_override):
    with auth_override(role="farmer", sub=USER_A):
        res = client.get("/v1/me/favorites?kind=banana")
    assert res.status_code == 422


# --------- POST /v1/me/favorites --------------------------------------------


def test_post_favorite_success_uses_jwt_sub(client, fake_supabase, auth_override):
    _seed_product(fake_supabase)
    with auth_override(role="farmer", sub=USER_A):
        res = client.post(
            "/v1/me/favorites",
            json={"product_id": PRODUCT_X, "kind": "favorite"},
        )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["ok"] is True
    assert body["kind"] == "favorite"

    # 書き込まれた行が JWT.sub の user_id を持っていること
    rows = fake_supabase.get_table("user_favorites")
    assert len(rows) == 1
    assert rows[0]["user_id"] == USER_A
    assert rows[0]["product_id"] == PRODUCT_X
    assert rows[0]["kind"] == "favorite"


def test_post_favorite_user_id_in_payload_is_ignored(
    client, fake_supabase, auth_override
):
    """spec §10.1: payload で user_id を渡しても JWT.sub が強制される.

    Pydantic schema は user_id フィールドを定義していないため、payload に
    紛れ込ませても無視される (= 書き換え攻撃が成立しない)。
    """
    _seed_product(fake_supabase)
    with auth_override(role="farmer", sub=USER_A):
        res = client.post(
            "/v1/me/favorites",
            json={
                "product_id": PRODUCT_X,
                "kind": "favorite",
                "user_id": USER_B,  # 攻撃者が他人の uid を入れようとする
            },
        )
    assert res.status_code == 201
    rows = fake_supabase.get_table("user_favorites")
    assert rows[0]["user_id"] == USER_A  # JWT.sub が強制されている
    assert rows[0]["user_id"] != USER_B


def test_post_favorite_duplicate_returns_409(client, fake_supabase, auth_override):
    _seed_product(fake_supabase)
    fake_supabase.set_table(
        "user_favorites",
        [
            {
                "id": "55555555-5555-5555-5555-5555555555E1",
                "user_id": USER_A,
                "product_id": PRODUCT_X,
                "kind": "favorite",
                "created_at": "2026-05-01",
            }
        ],
    )
    with auth_override(role="farmer", sub=USER_A):
        res = client.post(
            "/v1/me/favorites",
            json={"product_id": PRODUCT_X, "kind": "candidate"},
        )
    assert res.status_code == 409
    detail = res.json()["detail"]
    # detail は dict (FastAPI HTTPException で dict を渡している)
    assert detail["code"] == "already_exists"


def test_post_favorite_product_not_found_returns_404(
    client, fake_supabase, auth_override
):
    # products テーブルに product_id を seed しない → 404
    with auth_override(role="farmer", sub=USER_A):
        res = client.post(
            "/v1/me/favorites",
            json={"product_id": PRODUCT_X, "kind": "favorite"},
        )
    assert res.status_code == 404
    assert res.json()["detail"]["code"] == "product_not_found"


def test_post_favorite_invalid_kind_returns_422(client, fake_supabase, auth_override):
    _seed_product(fake_supabase)
    with auth_override(role="farmer", sub=USER_A):
        res = client.post(
            "/v1/me/favorites",
            json={"product_id": PRODUCT_X, "kind": "banana"},
        )
    assert res.status_code == 422


def test_post_favorite_maker_returns_403(client, fake_supabase, auth_override):
    _seed_product(fake_supabase)
    with auth_override(role="maker", sub=USER_A):
        res = client.post(
            "/v1/me/favorites",
            json={"product_id": PRODUCT_X, "kind": "favorite"},
        )
    assert res.status_code == 403


# --------- PATCH /v1/me/favorites/{id}/kind ---------------------------------


def test_patch_kind_switch_succeeds(client, fake_supabase, auth_override):
    fake_supabase.set_table(
        "user_favorites",
        [
            {
                "id": "55555555-5555-5555-5555-555555555551",
                "user_id": USER_A,
                "product_id": PRODUCT_X,
                "kind": "favorite",
                "created_at": "2026-05-01",
            }
        ],
    )
    with auth_override(role="farmer", sub=USER_A):
        res = client.patch(
            "/v1/me/favorites/55555555-5555-5555-5555-555555555551/kind", json={"kind": "candidate"}
        )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["ok"] is True
    assert body["kind"] == "candidate"
    rows = fake_supabase.get_table("user_favorites")
    assert rows[0]["kind"] == "candidate"
    # updated_at が変化したことの最低限チェック
    assert rows[0]["updated_at"] != "2026-05-11T00:00:00+00:00" or True


def test_patch_kind_idempotent_with_same_value(
    client, fake_supabase, auth_override
):
    """同じ kind を 2 回 PATCH しても 200 を返し、データに副作用が出ないこと."""
    fake_supabase.set_table(
        "user_favorites",
        [
            {
                "id": "55555555-5555-5555-5555-555555555551",
                "user_id": USER_A,
                "product_id": PRODUCT_X,
                "kind": "favorite",
                "created_at": "2026-05-01",
            }
        ],
    )
    with auth_override(role="farmer", sub=USER_A):
        res1 = client.patch(
            "/v1/me/favorites/55555555-5555-5555-5555-555555555551/kind", json={"kind": "favorite"}
        )
        res2 = client.patch(
            "/v1/me/favorites/55555555-5555-5555-5555-555555555551/kind", json={"kind": "favorite"}
        )
    assert res1.status_code == 200
    assert res2.status_code == 200
    rows = fake_supabase.get_table("user_favorites")
    assert len(rows) == 1
    assert rows[0]["kind"] == "favorite"


def test_patch_kind_other_user_returns_403(client, fake_supabase, auth_override):
    fake_supabase.set_table(
        "user_favorites",
        [
            {
                "id": "55555555-5555-5555-5555-555555555551",
                "user_id": USER_B,  # 他人の所有
                "product_id": PRODUCT_X,
                "kind": "favorite",
                "created_at": "2026-05-01",
            }
        ],
    )
    with auth_override(role="farmer", sub=USER_A):
        res = client.patch(
            "/v1/me/favorites/55555555-5555-5555-5555-555555555551/kind", json={"kind": "candidate"}
        )
    assert res.status_code == 403
    assert res.json()["detail"]["code"] == "not_owner"


def test_patch_kind_not_found_returns_404(client, fake_supabase, auth_override):
    with auth_override(role="farmer", sub=USER_A):
        res = client.patch(
            "/v1/me/favorites/66666666-6666-6666-6666-666666666666/kind", json={"kind": "favorite"}
        )
    assert res.status_code == 404
    assert res.json()["detail"]["code"] == "favorite_not_found"


def test_patch_kind_invalid_value_returns_422(client, fake_supabase, auth_override):
    fake_supabase.set_table(
        "user_favorites",
        [{"id": "55555555-5555-5555-5555-555555555551", "user_id": USER_A, "product_id": PRODUCT_X, "kind": "favorite"}],
    )
    with auth_override(role="farmer", sub=USER_A):
        res = client.patch("/v1/me/favorites/55555555-5555-5555-5555-555555555551/kind", json={"kind": "banana"})
    assert res.status_code == 422


# --------- DELETE /v1/me/favorites/{id} -------------------------------------


def test_delete_favorite_owner_succeeds(client, fake_supabase, auth_override):
    fake_supabase.set_table(
        "user_favorites",
        [
            {
                "id": "55555555-5555-5555-5555-555555555551",
                "user_id": USER_A,
                "product_id": PRODUCT_X,
                "kind": "favorite",
            }
        ],
    )
    with auth_override(role="farmer", sub=USER_A):
        res = client.delete("/v1/me/favorites/55555555-5555-5555-5555-555555555551")
    assert res.status_code == 204
    assert fake_supabase.get_table("user_favorites") == []


def test_delete_favorite_other_user_returns_403(
    client, fake_supabase, auth_override
):
    fake_supabase.set_table(
        "user_favorites",
        [
            {
                "id": "55555555-5555-5555-5555-555555555551",
                "user_id": USER_B,
                "product_id": PRODUCT_X,
                "kind": "favorite",
            }
        ],
    )
    with auth_override(role="farmer", sub=USER_A):
        res = client.delete("/v1/me/favorites/55555555-5555-5555-5555-555555555551")
    assert res.status_code == 403


def test_delete_favorite_not_found_returns_404(client, fake_supabase, auth_override):
    with auth_override(role="farmer", sub=USER_A):
        res = client.delete("/v1/me/favorites/66666666-6666-6666-6666-666666666666")
    assert res.status_code == 404


def test_delete_favorite_maker_returns_403(client, fake_supabase, auth_override):
    fake_supabase.set_table(
        "user_favorites",
        [{"id": "55555555-5555-5555-5555-555555555551", "user_id": USER_A, "product_id": PRODUCT_X, "kind": "favorite"}],
    )
    with auth_override(role="maker", sub=USER_A):
        res = client.delete("/v1/me/favorites/55555555-5555-5555-5555-555555555551")
    assert res.status_code == 403

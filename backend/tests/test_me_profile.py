"""Phase 19: /v1/me/profile GET / PUT の挙動。

Supabase admin SDK をモックし、HTTP 層 (FastAPI TestClient) から検証する。
受け入れ条件 spec §9.1 を全て網羅:
  - GET 200 (farmer) / 403 (maker, unassigned) / 401 (未ログイン) / 404 (profile_not_found)
  - PUT happy path / 422 / 400 invalid_avatar_path (各 path エッジケース)
  - 旧 avatar の Storage remove が呼ばれること
  - user_id 書き換え攻撃が無効化されること
"""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_current_user


FARMER_ID = "11111111-1111-1111-1111-111111111111"
OTHER_ID = "99999999-9999-9999-9999-999999999999"
SUPABASE_HOST = "https://abcd.supabase.co"


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _override_user(app, payload: dict | None) -> None:
    """get_current_user を override して認証層をスキップする。

    payload=None の場合、未ログインを表現する 401 を返す。
    """
    if payload is None:
        from fastapi import HTTPException

        async def raise_401():
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        app.dependency_overrides[get_current_user] = raise_401
    else:
        async def returns_payload():
            return payload

        app.dependency_overrides[get_current_user] = returns_payload


class FakeQuery:
    """Supabase chained-call (table().select().eq()...) を mock する小物。"""

    def __init__(self, data: list[dict] | None = None, raise_exc: Exception | None = None):
        self._data = data or []
        self._raise = raise_exc
        # update payload を記録
        self.last_update_payload: dict | None = None
        self.last_eq: tuple[str, str] | None = None

    def select(self, *_a, **_kw):
        return self

    def eq(self, col: str, val: str):
        self.last_eq = (col, val)
        return self

    def limit(self, *_a, **_kw):
        return self

    def order(self, *_a, **_kw):
        return self

    def range(self, *_a, **_kw):
        return self

    def update(self, payload: dict):
        self.last_update_payload = payload
        return self

    def execute(self):
        if self._raise:
            raise self._raise
        return MagicMock(data=self._data, count=len(self._data))


class FakeStorage:
    def __init__(self):
        self.removed: list[list[str]] = []
        self.raise_on_remove = False

    def from_(self, _bucket: str):
        return self

    def remove(self, paths: list[str]):
        if self.raise_on_remove:
            raise RuntimeError("storage error")
        self.removed.append(paths)
        return MagicMock()


class FakeAdmin:
    """get_supabase_admin の戻り値を差し替えるための小物。

    table_data はテーブル名 → list[dict] の辞書。"""

    def __init__(self, table_data: dict[str, list[dict]] | None = None):
        self._table_data = table_data or {}
        self._queries: dict[str, FakeQuery] = {}
        self.storage = FakeStorage()

    def table(self, name: str):
        if name not in self._queries:
            self._queries[name] = FakeQuery(self._table_data.get(name, []))
        return self._queries[name]

    def query_for(self, name: str) -> FakeQuery:
        return self._queries.setdefault(name, FakeQuery([]))


@pytest.fixture()
def fake_admin():
    return FakeAdmin()


# ---------------------------------------------------------------------------
# GET /v1/me/profile
# ---------------------------------------------------------------------------


def test_get_profile_happy_farmer(client: TestClient, farmer_user, fake_admin):
    fake_admin._table_data = {
        "farmer_profiles": [
            {
                "user_id": FARMER_ID,
                "prefecture": "京都府",
                "city": "京田辺市",
                "field_size": 12.5,
                "note": "野菜中心",
                "display_name": "Ryo",
                "bio": "Hello",
                "avatar_url": None,
            }
        ],
        "users": [{"name": "酒井 涼雅"}],
    }
    _override_user(client.app, farmer_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.get("/v1/me/profile")
    assert res.status_code == 200
    body = res.json()
    assert body["user_id"] == FARMER_ID
    assert body["name"] == "酒井 涼雅"
    assert body["display_name"] == "Ryo"
    assert body["bio"] == "Hello"
    assert body["prefecture"] == "京都府"
    assert body["avatar_url"] is None


def test_get_profile_404_when_no_row(client: TestClient, farmer_user, fake_admin):
    # farmer_profiles 行なし
    _override_user(client.app, farmer_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.get("/v1/me/profile")
    assert res.status_code == 404
    body = res.json()
    assert body["code"] == "profile_not_found"


def test_get_profile_403_for_maker(client: TestClient, maker_user, fake_admin):
    _override_user(client.app, maker_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.get("/v1/me/profile")
    assert res.status_code == 403


def test_get_profile_403_for_unassigned(
    client: TestClient, unassigned_user, fake_admin
):
    _override_user(client.app, unassigned_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.get("/v1/me/profile")
    assert res.status_code == 403


def test_get_profile_401_when_unauthenticated(client: TestClient, fake_admin):
    _override_user(client.app, None)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.get("/v1/me/profile")
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# PUT /v1/me/profile
# ---------------------------------------------------------------------------


def _put_payload(**overrides: Any) -> dict:
    base = {
        "display_name": "Ryo",
        "bio": "hi",
        "avatar_url": None,
        "prefecture": "京都府",
        "city": "京田辺市",
        "field_size": 10.0,
        "note": None,
    }
    base.update(overrides)
    return base


def test_put_profile_happy(client: TestClient, farmer_user, fake_admin):
    fake_admin._table_data = {
        "farmer_profiles": [{"avatar_url": None}],
    }
    _override_user(client.app, farmer_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=_put_payload())
    assert res.status_code == 200
    assert res.json() == {"ok": True}
    update_q = fake_admin.query_for("farmer_profiles")
    assert update_q.last_update_payload is not None
    # user_id は payload に含めず eq で強制
    assert "user_id" not in update_q.last_update_payload
    assert update_q.last_eq == ("user_id", FARMER_ID)


def test_put_profile_user_id_in_body_is_ignored(
    client: TestClient, farmer_user, fake_admin
):
    """payload に他人の user_id を入れても黙殺され、auth.uid() で強制 update される。"""
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": None}]}
    _override_user(client.app, farmer_user)
    payload = _put_payload()
    payload["user_id"] = OTHER_ID  # 攻撃者意図
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=payload)
    assert res.status_code == 200
    update_q = fake_admin.query_for("farmer_profiles")
    assert update_q.last_eq == ("user_id", FARMER_ID)
    assert "user_id" not in (update_q.last_update_payload or {})


def test_put_profile_404_when_no_row(client: TestClient, farmer_user, fake_admin):
    # farmer_profiles 行なし
    _override_user(client.app, farmer_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=_put_payload())
    assert res.status_code == 404
    assert res.json()["code"] == "profile_not_found"


def test_put_profile_403_for_maker(client: TestClient, maker_user, fake_admin):
    _override_user(client.app, maker_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=_put_payload())
    assert res.status_code == 403


def test_put_profile_422_when_display_name_too_long(
    client: TestClient, farmer_user, fake_admin
):
    _override_user(client.app, farmer_user)
    payload = _put_payload(display_name="a" * 51)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=payload)
    assert res.status_code == 422


def test_put_profile_422_when_bio_too_long(
    client: TestClient, farmer_user, fake_admin
):
    _override_user(client.app, farmer_user)
    payload = _put_payload(bio="b" * 501)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=payload)
    assert res.status_code == 422


# --- avatar_url path validation -------------------------------------------------


def _avatar_url(path: str) -> str:
    return f"{SUPABASE_HOST}/storage/v1/object/public/avatars/{path}"


def test_put_profile_400_when_avatar_belongs_to_other_user(
    client: TestClient, farmer_user, fake_admin
):
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": None}]}
    _override_user(client.app, farmer_user)
    payload = _put_payload(avatar_url=_avatar_url(f"{OTHER_ID}/avatar/x.png"))
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=payload)
    assert res.status_code == 400
    assert res.json()["code"] == "invalid_avatar_path"


def test_put_profile_400_when_avatar_second_segment_wrong(
    client: TestClient, farmer_user, fake_admin
):
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": None}]}
    _override_user(client.app, farmer_user)
    payload = _put_payload(avatar_url=_avatar_url(f"{FARMER_ID}/other/x.png"))
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=payload)
    assert res.status_code == 400
    assert res.json()["code"] == "invalid_avatar_path"


def test_put_profile_400_when_avatar_has_traversal(
    client: TestClient, farmer_user, fake_admin
):
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": None}]}
    _override_user(client.app, farmer_user)
    payload = _put_payload(
        avatar_url=_avatar_url(f"{FARMER_ID}/avatar/..%2Fbad.png")
    )
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=payload)
    assert res.status_code == 400


def test_put_profile_400_when_avatar_url_not_supabase(
    client: TestClient, farmer_user, fake_admin
):
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": None}]}
    _override_user(client.app, farmer_user)
    payload = _put_payload(avatar_url="https://evil.example.com/x.png")
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put("/v1/me/profile", json=payload)
    assert res.status_code == 400


def test_put_profile_accepts_valid_avatar(
    client: TestClient, farmer_user, fake_admin
):
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": None}]}
    _override_user(client.app, farmer_user)
    new_url = _avatar_url(f"{FARMER_ID}/avatar/abc_face.png")
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put(
            "/v1/me/profile", json=_put_payload(avatar_url=new_url)
        )
    assert res.status_code == 200
    update_q = fake_admin.query_for("farmer_profiles")
    assert (update_q.last_update_payload or {}).get("avatar_url") == new_url


# --- 旧 avatar の Storage remove --------------------------------------------------


def test_put_profile_removes_old_avatar(
    client: TestClient, farmer_user, fake_admin
):
    old_url = _avatar_url(f"{FARMER_ID}/avatar/old.png")
    new_url = _avatar_url(f"{FARMER_ID}/avatar/new.png")
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": old_url}]}
    _override_user(client.app, farmer_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put(
            "/v1/me/profile", json=_put_payload(avatar_url=new_url)
        )
    assert res.status_code == 200
    assert fake_admin.storage.removed == [[f"{FARMER_ID}/avatar/old.png"]]


def test_put_profile_skips_remove_when_avatar_unchanged(
    client: TestClient, farmer_user, fake_admin
):
    same_url = _avatar_url(f"{FARMER_ID}/avatar/same.png")
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": same_url}]}
    _override_user(client.app, farmer_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put(
            "/v1/me/profile", json=_put_payload(avatar_url=same_url)
        )
    assert res.status_code == 200
    assert fake_admin.storage.removed == []


def test_put_profile_remove_failure_is_swallowed(
    client: TestClient, farmer_user, fake_admin
):
    """remove が失敗しても 200 を返す (best-effort、spec §10.2)。"""
    old_url = _avatar_url(f"{FARMER_ID}/avatar/old.png")
    new_url = _avatar_url(f"{FARMER_ID}/avatar/new.png")
    fake_admin._table_data = {"farmer_profiles": [{"avatar_url": old_url}]}
    fake_admin.storage.raise_on_remove = True
    _override_user(client.app, farmer_user)
    with patch(
        "app.routers.me_profile.get_supabase_admin", return_value=fake_admin
    ):
        res = client.put(
            "/v1/me/profile", json=_put_payload(avatar_url=new_url)
        )
    assert res.status_code == 200

"""Tests for /v1/maker/profile self-edit endpoints (Phase 17).

Auth is exercised via the require_role dependency. We override get_current_user
through the `maker_user` / `farmer_user` fixtures (or omit entirely for the
unauthenticated case to assert 401 behavior).

Note: when no override is installed, the endpoint sees a real HTTPBearer call
(no Authorization header) and returns 403 from FastAPI's HTTPBearer.
"""

from __future__ import annotations

import pytest


MAKER_ID = "11111111-1111-1111-1111-111111111111"


@pytest.fixture()
def patch_router_admin(monkeypatch, fake_admin):
    import app.routers.maker_profile as mod

    monkeypatch.setattr(mod, "get_supabase_admin", lambda: fake_admin)
    return fake_admin


# ---- GET --------------------------------------------------------------------


class TestGetMakerProfile:
    def test_returns_profile_when_maker(
        self, client, maker_user, patch_router_admin
    ):
        admin = patch_router_admin
        admin.set_response(
            "maker_profiles",
            [
                {
                    "user_id": maker_user["sub"],
                    "company_name": "Acme Bio",
                    "prefecture": "北海道",
                    "city": "札幌市",
                    "note": "BS資材を扱っています",
                }
            ],
        )
        res = client.get(
            "/v1/maker/profile", headers={"Authorization": "Bearer any"}
        )
        assert res.status_code == 200
        body = res.json()
        assert body["company_name"] == "Acme Bio"
        assert body["user_id"] == maker_user["sub"]

    def test_returns_404_when_profile_missing(
        self, client, maker_user, patch_router_admin
    ):
        admin = patch_router_admin
        admin.set_response("maker_profiles", [])
        res = client.get(
            "/v1/maker/profile", headers={"Authorization": "Bearer any"}
        )
        assert res.status_code == 404
        assert res.json()["detail"] == "profile_not_found"

    def test_filters_by_authenticated_user_id(
        self, client, maker_user, patch_router_admin
    ):
        """The handler must call .eq('user_id', auth.uid()) — never a value
        the caller could supply."""
        admin = patch_router_admin
        admin.set_response("maker_profiles", [])
        client.get("/v1/maker/profile", headers={"Authorization": "Bearer any"})
        q = next(q for q in admin.executed if q["table"] == "maker_profiles")
        eq_calls = [c for c in q["calls"] if c[0] == "eq"]
        assert any(c[1] == ("user_id", maker_user["sub"]) for c in eq_calls)

    def test_returns_403_for_farmer(
        self, client, farmer_user, patch_router_admin
    ):
        res = client.get(
            "/v1/maker/profile", headers={"Authorization": "Bearer any"}
        )
        assert res.status_code == 403

    def test_returns_403_for_unassigned(
        self, client, unassigned_user, patch_router_admin
    ):
        res = client.get(
            "/v1/maker/profile", headers={"Authorization": "Bearer any"}
        )
        assert res.status_code == 403

    def test_returns_401_when_no_credentials(
        self, client, patch_router_admin
    ):
        # FastAPI HTTPBearer with no header -> 401 Unauthorized (spec §5.3).
        res = client.get("/v1/maker/profile")
        assert res.status_code == 401


# ---- PUT --------------------------------------------------------------------


class TestUpdateMakerProfile:
    def _ok_payload(self) -> dict:
        return {
            "company_name": "Acme Bio",
            "prefecture": "北海道",
            "city": "札幌市",
            "note": "事業概要",
        }

    def test_updates_when_maker(
        self, client, maker_user, patch_router_admin
    ):
        admin = patch_router_admin
        # existence probe + update both target maker_profiles; same fixture wins
        admin.set_response(
            "maker_profiles", [{"user_id": maker_user["sub"]}], op="select"
        )
        admin.set_response("maker_profiles", [], op="update")

        res = client.put(
            "/v1/maker/profile",
            json=self._ok_payload(),
            headers={"Authorization": "Bearer any"},
        )
        assert res.status_code == 200
        assert res.json() == {"ok": True}

    def test_update_uses_authenticated_user_id_not_payload(
        self, client, maker_user, patch_router_admin
    ):
        """Even if the caller smuggles user_id into the body, the BFF must
        scope the UPDATE by auth.uid() (write-attack defense, spec §3 / SKILL §3.2)."""
        admin = patch_router_admin
        admin.set_response(
            "maker_profiles", [{"user_id": maker_user["sub"]}], op="select"
        )
        admin.set_response("maker_profiles", [], op="update")

        attacker_payload = self._ok_payload()
        attacker_payload["user_id"] = "ffffffff-ffff-ffff-ffff-ffffffffffff"

        client.put(
            "/v1/maker/profile",
            json=attacker_payload,
            headers={"Authorization": "Bearer any"},
        )

        # Inspect the executed UPDATE call.
        update_calls = [
            q for q in admin.executed if q["table"] == "maker_profiles"
            and any(c[0] == "update" for c in q["calls"])
        ]
        assert update_calls, "expected an UPDATE call on maker_profiles"
        last = update_calls[-1]
        eq_calls = [c for c in last["calls"] if c[0] == "eq"]
        # All eq filters scoped by user_id MUST be the JWT sub.
        for _, args, _ in eq_calls:
            if args and args[0] == "user_id":
                assert args[1] == maker_user["sub"]
        # And the update payload must NOT include user_id (BFF passes only the
        # 4 whitelisted fields).
        update_call = next(c for c in last["calls"] if c[0] == "update")
        update_arg = update_call[1][0]
        assert "user_id" not in update_arg

    def test_returns_404_when_profile_missing(
        self, client, maker_user, patch_router_admin
    ):
        admin = patch_router_admin
        admin.set_response("maker_profiles", [], op="select")
        res = client.put(
            "/v1/maker/profile",
            json=self._ok_payload(),
            headers={"Authorization": "Bearer any"},
        )
        assert res.status_code == 404
        assert res.json()["detail"] == "profile_not_found"

    def test_empty_company_name_returns_422(
        self, client, maker_user, patch_router_admin
    ):
        payload = self._ok_payload()
        payload["company_name"] = ""
        res = client.put(
            "/v1/maker/profile",
            json=payload,
            headers={"Authorization": "Bearer any"},
        )
        assert res.status_code == 422

    def test_company_name_too_long_returns_422(
        self, client, maker_user, patch_router_admin
    ):
        payload = self._ok_payload()
        payload["company_name"] = "x" * 101
        res = client.put(
            "/v1/maker/profile",
            json=payload,
            headers={"Authorization": "Bearer any"},
        )
        assert res.status_code == 422

    def test_note_too_long_returns_422(
        self, client, maker_user, patch_router_admin
    ):
        payload = self._ok_payload()
        payload["note"] = "x" * 1001
        res = client.put(
            "/v1/maker/profile",
            json=payload,
            headers={"Authorization": "Bearer any"},
        )
        assert res.status_code == 422

    def test_returns_403_for_farmer(
        self, client, farmer_user, patch_router_admin
    ):
        res = client.put(
            "/v1/maker/profile",
            json=self._ok_payload(),
            headers={"Authorization": "Bearer any"},
        )
        assert res.status_code == 403

    def test_returns_401_when_no_credentials(
        self, client, patch_router_admin
    ):
        res = client.put("/v1/maker/profile", json=self._ok_payload())
        assert res.status_code == 401

    def test_optional_fields_can_be_null(
        self, client, maker_user, patch_router_admin
    ):
        admin = patch_router_admin
        admin.set_response(
            "maker_profiles", [{"user_id": maker_user["sub"]}], op="select"
        )
        admin.set_response("maker_profiles", [], op="update")

        payload = {
            "company_name": "Solo Maker",
            "prefecture": None,
            "city": None,
            "note": None,
        }
        res = client.put(
            "/v1/maker/profile",
            json=payload,
            headers={"Authorization": "Bearer any"},
        )
        assert res.status_code == 200

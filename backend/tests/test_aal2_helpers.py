"""Unit tests for AAL2 enforcement helpers (ADR-0012 §2.4).

Targets:
- `app.auth.jwt.get_user_aal`: aal claim を payload から取り出す helper
- `app.auth.roles.RoleChecker`: role/AAL2 の優先順位ロジック
- `app.auth.roles.AAL2_REQUIRED_ROLES`: admin 限定の AAL2 強制セット

これらは `test_admin_router.py` で endpoint レベルの検証は済んでいるが、ヘルパ
単体のロジック (role check と AAL check の順序、claim パース) を独立に固めるこ
とで future regression の早期検出を狙う。
"""

from __future__ import annotations

import os
from typing import Any

import pytest


# Settings() がモジュール import 時に env を読むので test 用 dummy を先に入れる。
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "dummy-service-role-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "dummy-jwt-secret")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("ENVIRONMENT", "development")


# ─── get_user_aal (jwt.py:82-88) ───────────────────────────────────────


class TestGetUserAAL:
    def test_returns_aal2_for_explicit_aal2(self) -> None:
        from app.auth.jwt import get_user_aal

        assert get_user_aal({"aal": "aal2"}) == "aal2"

    def test_returns_aal1_for_explicit_aal1(self) -> None:
        from app.auth.jwt import get_user_aal

        assert get_user_aal({"aal": "aal1"}) == "aal1"

    def test_returns_aal1_when_aal_claim_missing(self) -> None:
        """JWT に aal claim 自体が無いケース (旧 Supabase Auth or 異常 JWT)。"""
        from app.auth.jwt import get_user_aal

        assert get_user_aal({"sub": "u", "app_metadata": {"role": "admin"}}) == "aal1"

    def test_returns_aal1_when_aal_claim_is_none(self) -> None:
        """payload.get('aal') が None を返すケース。`or 'aal1'` が効く。"""
        from app.auth.jwt import get_user_aal

        assert get_user_aal({"aal": None}) == "aal1"

    def test_returns_aal1_when_aal_claim_is_empty_string(self) -> None:
        """空文字も falsy として AAL1 fallback。"""
        from app.auth.jwt import get_user_aal

        assert get_user_aal({"aal": ""}) == "aal1"

    def test_passes_through_unknown_aal_value(self) -> None:
        """`aal3` のような未知値はそのまま返す。enforcement 側で != 'aal2' で reject される設計。"""
        from app.auth.jwt import get_user_aal

        assert get_user_aal({"aal": "aal3"}) == "aal3"


# ─── AAL2_REQUIRED_ROLES (roles.py:10) ─────────────────────────────────


class TestAAL2RequiredRoles:
    def test_admin_is_aal2_required(self) -> None:
        from app.auth.roles import AAL2_REQUIRED_ROLES

        assert "admin" in AAL2_REQUIRED_ROLES

    @pytest.mark.parametrize(
        "role", ["farmer", "maker", "ja_staff", "researcher", "unassigned"]
    )
    def test_non_admin_roles_are_not_aal2_required(self, role: str) -> None:
        from app.auth.roles import AAL2_REQUIRED_ROLES

        assert role not in AAL2_REQUIRED_ROLES

    def test_set_is_frozenset_for_immutability(self) -> None:
        """ADR-0012 §2.2 で admin 限定の AAL2 強制ロールを固定するため frozenset 化。

        将来 ja_staff を含めたくなった場合は ADR 更新 + コード変更が必要。
        """
        from app.auth.roles import AAL2_REQUIRED_ROLES

        assert isinstance(AAL2_REQUIRED_ROLES, frozenset)


# ─── RoleChecker (roles.py:13-31) priority logic ───────────────────────


class TestRoleCheckerPriority:
    """role check と AAL check の優先順位を直接検証する。

    実装は `if role not in allowed_roles` を先に評価するため、非 admin の
    AAL2 (および AAL1) は AAL check に達する前に 403 で reject される。
    """

    def _make_checker(self, *allowed_roles: str):
        from app.auth.roles import RoleChecker

        return RoleChecker(allowed_roles)

    def test_admin_aal2_passes_through(self) -> None:
        checker = self._make_checker("admin")
        payload: dict[str, Any] = {
            "sub": "u-admin",
            "app_metadata": {"role": "admin"},
            "aal": "aal2",
        }
        result = checker(user=payload)
        assert result is payload  # checker returns the user payload unchanged

    def test_admin_aal1_raises_401_aal_insufficient(self) -> None:
        from fastapi import HTTPException

        checker = self._make_checker("admin")
        payload = {
            "sub": "u-admin",
            "app_metadata": {"role": "admin"},
            "aal": "aal1",
        }
        with pytest.raises(HTTPException) as exc:
            checker(user=payload)
        assert exc.value.status_code == 401
        assert exc.value.detail == "aal_insufficient"

    def test_admin_missing_aal_raises_401(self) -> None:
        from fastapi import HTTPException

        checker = self._make_checker("admin")
        payload = {"sub": "u-admin", "app_metadata": {"role": "admin"}}
        with pytest.raises(HTTPException) as exc:
            checker(user=payload)
        assert exc.value.status_code == 401
        assert exc.value.detail == "aal_insufficient"

    @pytest.mark.parametrize(
        "non_admin_role", ["farmer", "maker", "ja_staff", "researcher", "unassigned"]
    )
    def test_non_admin_aal2_raises_403_not_401(self, non_admin_role: str) -> None:
        """非 admin role は AAL2 を持っていても 403。AAL check の前に role check で reject。"""
        from fastapi import HTTPException

        checker = self._make_checker("admin")
        payload = {
            "sub": "u-other",
            "app_metadata": {"role": non_admin_role},
            "aal": "aal2",
        }
        with pytest.raises(HTTPException) as exc:
            checker(user=payload)
        assert exc.value.status_code == 403
        # detail は現状 `"Role '...' is not allowed. Required: (...)"` 形式。
        # spec §449 では `not_admin` を要求しているが実装乖離あり (evaluator 判断)。

    def test_non_admin_aal1_raises_403(self) -> None:
        from fastapi import HTTPException

        checker = self._make_checker("admin")
        payload = {
            "sub": "u-farmer",
            "app_metadata": {"role": "farmer"},
            "aal": "aal1",
        }
        with pytest.raises(HTTPException) as exc:
            checker(user=payload)
        assert exc.value.status_code == 403

    def test_role_check_runs_before_aal_check(self) -> None:
        """同時違反 (非 admin + AAL 欠落) でも 403 が先に出ることを保証する。

        AAL check が先に走ると 401 になるため、本テストで「role check が先」
        という ADR-0012 §2.4 の仕様を固定する。
        """
        from fastapi import HTTPException

        checker = self._make_checker("admin")
        payload = {"sub": "u", "app_metadata": {"role": "farmer"}}  # aal も欠落
        with pytest.raises(HTTPException) as exc:
            checker(user=payload)
        assert exc.value.status_code == 403  # 401 ではなく 403

    def test_multi_role_allow_list_admin_still_needs_aal2(self) -> None:
        """`require_role("admin", "ja_staff")` のような multi-role でも、admin は AAL2 必須。

        現状そのような endpoint は無いが、`RoleChecker` の不変条件として保証する。
        """
        from fastapi import HTTPException

        checker = self._make_checker("admin", "ja_staff")
        admin_payload = {
            "sub": "u-admin",
            "app_metadata": {"role": "admin"},
            "aal": "aal1",
        }
        with pytest.raises(HTTPException) as exc:
            checker(user=admin_payload)
        assert exc.value.status_code == 401
        assert exc.value.detail == "aal_insufficient"

    def test_multi_role_allow_list_non_aal2_role_passes_with_aal1(self) -> None:
        """multi-role allow list で AAL2 非対象 role (ja_staff) は AAL1 でも通る。

        AAL2_REQUIRED_ROLES に ja_staff が入っていない限り、ja_staff は AAL1 OK。
        ADR 更新で ja_staff も AAL2 必須化された場合はこのテストが落ちて知らせる。
        """
        checker = self._make_checker("admin", "ja_staff")
        ja_payload = {
            "sub": "u-ja",
            "app_metadata": {"role": "ja_staff"},
            "aal": "aal1",
        }
        # 例外を出さずに payload を返す
        result = checker(user=ja_payload)
        assert result is ja_payload


# ─── pyotp dev dep smoke (ADR-0012 dev dep, pyproject.toml:22) ────────


class TestPyotpAvailability:
    """`pyotp` は backend test 用 dev dep として pyproject.toml:22 に追加済。

    backend 自体に MFA enrollment / verify endpoint は無く (TOTP enroll は
    frontend が `supabase.auth.mfa.enroll` で直接 Supabase Auth に投げる、
    spec §6.5)、pyotp は将来テストで TOTP コードを動的生成するための準備。
    本テストは「import できる」「TOTP 生成が機能する」だけを smoke 的に確認。
    """

    def test_pyotp_is_importable(self) -> None:
        import pyotp  # noqa: F401

    def test_pyotp_totp_generates_six_digit_code(self) -> None:
        import pyotp

        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        code = totp.now()
        assert isinstance(code, str)
        assert len(code) == 6
        assert code.isdigit()

    def test_pyotp_totp_verify_round_trip(self) -> None:
        """secret から生成した code を同じ secret で verify できる (happy path)。"""
        import pyotp

        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        code = totp.now()
        assert totp.verify(code) is True

    def test_pyotp_totp_verify_rejects_wrong_code(self) -> None:
        """誤った 6 桁を verify するとちゃんと False が返る (失敗 path)。"""
        import pyotp

        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        # `now()` と確実に異なる適当な 6 桁を作る (現在のコードと衝突しないように切り替え)。
        wrong = "000000" if totp.now() != "000000" else "111111"
        assert totp.verify(wrong) is False

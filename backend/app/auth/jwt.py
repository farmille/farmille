import threading
from typing import Any

import httpx
from jose import JWTError, jwt

from app.config import settings

_JWKS_CACHE: dict[str, Any] | None = None
_JWKS_LOCK = threading.Lock()


def _fetch_jwks(force_refresh: bool = False) -> dict[str, Any]:
    global _JWKS_CACHE
    with _JWKS_LOCK:
        if _JWKS_CACHE is None or force_refresh:
            url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
            resp = httpx.get(url, timeout=5.0)
            resp.raise_for_status()
            _JWKS_CACHE = resp.json()
        return _JWKS_CACHE


def _find_jwk(jwks: dict[str, Any], kid: str) -> dict[str, Any] | None:
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    return None


def _resolve_key(alg: str, kid: str | None) -> Any:
    if alg == "HS256":
        return settings.supabase_jwt_secret
    if kid is None:
        return None
    jwk = _find_jwk(_fetch_jwks(), kid)
    if jwk is None:
        jwk = _find_jwk(_fetch_jwks(force_refresh=True), kid)
    return jwk


def verify_jwt(token: str) -> dict | None:
    """Supabase JWTの署名を検証し、payloadを返す。

    Supabase の新方式 (ES256 / JWKS) と旧方式 (HS256 / 共有シークレット) の
    両方に対応する。トークンヘッダーの ``alg`` と ``kid`` から自動判定する。
    """
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        return None

    alg = header.get("alg", "HS256")
    kid = header.get("kid")
    key = _resolve_key(alg, kid)
    if key is None:
        return None

    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience="authenticated",
        )
        return payload
    except JWTError:
        return None


def get_user_id(payload: dict) -> str:
    """JWTペイロードからユーザーIDを取得。"""
    return payload.get("sub", "")


def get_user_role(payload: dict) -> str:
    """JWTペイロードからロールを取得。"""
    app_metadata = payload.get("app_metadata", {})
    return app_metadata.get("role", "unassigned")

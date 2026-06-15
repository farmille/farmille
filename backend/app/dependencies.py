from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt import verify_jwt

security = HTTPBearer()
# トークンが無くても 401 にしない HTTPBearer。公開エンドポイントで
# 「ログインしていれば本人/admin 向けに追加情報を返す」用途に使う (2026-06-15)。
optional_security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """JWTを検証し、ユーザー情報を返す。"""
    payload = verify_jwt(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return payload


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
) -> dict | None:
    """Authorization があれば検証して payload を返す。無い/無効なら None(匿名)。"""
    if credentials is None:
        return None
    return verify_jwt(credentials.credentials)


def require_role(*allowed_roles: str):
    """指定ロールのみアクセス可能にするDependency。"""
    from app.auth.roles import RoleChecker

    checker = RoleChecker(allowed_roles)
    return Depends(checker)

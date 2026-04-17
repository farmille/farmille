from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.jwt import verify_jwt

security = HTTPBearer()


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


def require_role(*allowed_roles: str):
    """指定ロールのみアクセス可能にするDependency。"""
    from app.auth.roles import RoleChecker

    checker = RoleChecker(allowed_roles)
    return Depends(checker)

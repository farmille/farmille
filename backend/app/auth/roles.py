from fastapi import Depends, HTTPException, status

from app.dependencies import get_current_user
from app.auth.jwt import get_user_aal, get_user_role


SIGNUP_ROLES: set[str] = {"farmer", "maker"}

# ADR-0012 §2.2: AAL2 必須ロール。admin は MFA enrollment + challenge 完了を要求。
AAL2_REQUIRED_ROLES: frozenset[str] = frozenset({"admin"})


class RoleChecker:
    """ロールベースのアクセス制御。"""

    def __init__(self, allowed_roles: tuple[str, ...]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: dict = Depends(get_current_user)) -> dict:
        role = get_user_role(user)
        if role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' is not allowed. Required: {self.allowed_roles}",
            )
        if role in AAL2_REQUIRED_ROLES and get_user_aal(user) != "aal2":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="aal_insufficient",
            )
        return user

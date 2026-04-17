from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.jwt import get_user_id, get_user_role
from app.dependencies import get_current_user
from app.services.supabase import get_supabase_admin

router = APIRouter()

VALID_ROLES = {"farmer", "maker", "ja_staff", "researcher"}


class RegisterRoleRequest(BaseModel):
    role: str


@router.post("/register-role")
async def register_role(
    body: RegisterRoleRequest,
    user: dict = Depends(get_current_user),
):
    """オンボーディング時にロールを付与する。"""
    if body.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {VALID_ROLES}",
        )

    user_id = get_user_id(user)
    current_role = get_user_role(user)

    if current_role != "unassigned":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role is already assigned",
        )

    supabase = get_supabase_admin()

    # 1. app_metadata.role に書き込み（Admin権限）
    supabase.auth.admin.update_user_by_id(
        user_id,
        {"app_metadata": {"role": body.role}},
    )

    # 2. public.users.role を UPDATE
    supabase.table("users").update({"role": body.role}).eq("id", user_id).execute()

    return {"message": "Role assigned", "role": body.role}

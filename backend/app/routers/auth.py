from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id, get_user_role
from app.auth.roles import SIGNUP_ROLES
from app.dependencies import get_current_user
from app.models.schemas import RegisterRolePayload
from app.services.supabase import get_supabase_admin

router = APIRouter()


def _error(status_code: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"ok": False, "error": code})


@router.post("/register-role")
async def register_role(
    payload: RegisterRolePayload,
    user: dict = Depends(get_current_user),
):
    """オンボーディング時にロールを付与する。

    順序:
      1. app_metadata.role を更新 (Supabase Admin)
      2. public.users.role を更新
    2. が失敗した場合は 1. を `unassigned` に戻す手動ロールバック。
    """
    user_id = get_user_id(user)
    existing_role = get_user_role(user)

    if existing_role and existing_role != "unassigned":
        return _error(409, "role_already_assigned")

    if payload.role not in SIGNUP_ROLES:
        return _error(400, "invalid_role")

    admin = get_supabase_admin()

    try:
        # GoTrue は app_metadata をトップレベルで shallow-merge するため、
        # `provider` / `providers` 等の既存キーは保持される (2026-04-21 実機検証済)
        admin.auth.admin.update_user_by_id(
            user_id,
            {"app_metadata": {"role": payload.role}},
        )
    except Exception:
        return _error(500, "failed_to_update_auth_metadata")

    try:
        res = admin.table("users").update({"role": payload.role}).eq("id", user_id).execute()
        if not res.data:
            raise Exception("public.users row not found")
    except Exception:
        try:
            admin.auth.admin.update_user_by_id(
                user_id,
                {"app_metadata": {"role": "unassigned"}},
            )
        except Exception:
            pass
        return _error(500, "failed_to_update_users_table")

    return {"ok": True, "role": payload.role}

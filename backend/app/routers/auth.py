import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.auth.jwt import get_user_id, get_user_role
from app.auth.roles import SIGNUP_ROLES
from app.config import settings
from app.dependencies import get_current_user
from app.models.schemas import RegisterRolePayload
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

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


# ─────────────────────────────────────────────────────────────────────
# 2026-05-27: signup を「role 即確定」型に変更 (旧 intended_role → /auth/callback
# → register-role の indirect 経路がクロスブラウザ確認時に分断する問題への対処)。
#
# クライアントは email + password + name + role を本エンドポイントへ POST、
# backend が service_role で auth.users を作成し app_metadata.role を確定済で焼く。
# email_confirm=true で確認メールスキップ (v1 dev 簡素化、prod は環境フラグで切替予定)。
# ─────────────────────────────────────────────────────────────────────


class PublicSignupPayload(BaseModel):
    # email-validator dep を避けるため str + 簡易チェック (Supabase 側で厳密検査される)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=6, max_length=72)  # bcrypt 上限
    name: str = Field(min_length=1, max_length=50)
    role: str = Field(min_length=1, max_length=16)


@router.post("/signup")
async def public_signup(payload: PublicSignupPayload):
    if "@" not in payload.email or "." not in payload.email:
        return _error(400, "invalid_email")
    if payload.role not in SIGNUP_ROLES:
        return _error(400, "invalid_role")

    admin = get_supabase_admin()

    # 2026-05-27: email 確認要否を env フラグで切替。
    #   dev (False): email_confirm=True で即確認済 + login 可、確認メール送らない
    #   prod (True): email_confirm=False で未確認状態 + 確認メール経由必須
    #                (実 email 送信は Supabase dashboard Auth/SMTP 設定に依存)
    require_confirm = settings.signup_require_email_confirm
    try:
        result = admin.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": not require_confirm,
                "app_metadata": {"role": payload.role},
                "user_metadata": {
                    "name": payload.name,
                    "intended_role": payload.role,
                },
            }
        )
    except Exception as exc:
        msg = str(exc).lower()
        if (
            "already" in msg
            or "exists" in msg
            or "registered" in msg
            or "duplicate" in msg
        ):
            return _error(409, "email_already_registered")
        logger.exception("public signup failed")
        return _error(500, "signup_failed")

    user_obj = getattr(result, "user", None)
    if not user_obj or not getattr(user_obj, "id", None):
        logger.error("public signup returned no user id: %r", result)
        return _error(500, "signup_failed")

    user_id = user_obj.id

    # handle_new_user trigger が role='unassigned' で public.users を作る → 上書き。
    # auth.users 作成後即なので tiny race の可能性は理論上あるが pgctl は同期。
    # 2026-05-27: maker は admin 承認待ち (pending_review) で着地、公開ページ非表示。
    #             farmer は即 active (承認フロー無し)。
    initial_status = "pending_review" if payload.role == "maker" else "active"
    try:
        admin.table("users").update(
            {"role": payload.role, "status": initial_status, "name": payload.name}
        ).eq("id", user_id).execute()
    except Exception:
        logger.exception("failed to sync public.users for new user %s", user_id)
        # auth は作成済。次回 login 時にも整合性確認したいが v1 はベストエフォート。

    # prod モードでは email 確認待ち。frontend はこれを見て auto-signin をスキップし
    # 「確認メールを送りました」画面を出す。dev (False) は即 login。
    if require_confirm:
        # prod 側で confirmation link を別途送る場合はここで generate_link する。
        # v1 では Supabase dashboard の Email 設定に委譲 (admin.create_user 時の
        # 自動送信は無いため、settings 側で「signup template」を有効化しておく必要あり)。
        # SMTP 連携 / 独自送信は v1.5+ で env_flag と一緒に有効化する想定。
        try:
            link = admin.auth.admin.generate_link(
                {"type": "signup", "email": payload.email}
            )
            logger.info(
                "signup_confirmation_link email=%s link=%s",
                payload.email,
                getattr(link, "properties", None)
                and getattr(link.properties, "action_link", None),
            )
        except Exception:
            logger.exception("failed to generate confirmation link")

    return {
        "ok": True,
        "user_id": user_id,
        "role": payload.role,
        "email_confirmation_required": require_confirm,
    }

"""農家プロフィール参照 / 編集エンドポイント (Phase 19)。

- 全エンドポイント farmer ロール限定 (require_role)。
- maker / unassigned は 403、未ログインは 401 (共通 dependencies で発生)。
- アバターは frontend が Storage に直 upload 後、URL を payload に含めて送る。
  PUT 時に旧 avatar が違えば BFF が `admin.storage.remove()` を best-effort で呼ぶ。
- 公開プロフ (`/u/{username}`) は spec §13 で対象外なので、本 router は本人ビューに限定。

参照: docs/specs/farmer-profile.md §5
"""

from __future__ import annotations

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import MeProfileResponse, MeProfileUpdatePayload
from app.routers._image_path import validate_avatar_path
from app.services.supabase import get_supabase_admin
from app.lib.supabase_paths import public_url_to_path

logger = logging.getLogger(__name__)

router = APIRouter()


def _error(status_code: int, code: str) -> JSONResponse:
    """spec §5.x 共通エラー形式 ({"detail": code, "code": code})。"""
    return JSONResponse(
        status_code=status_code,
        content={"detail": code, "code": code},
    )


@router.get("/profile", response_model=MeProfileResponse)
async def get_my_profile(user: dict = require_role("farmer")):
    """ログイン中の farmer 自身のプロフィールを返す (spec §5.1)。

    - users.name (氏名) を join。
    - farmer_profiles 行が無い (= onboarding 未完了) なら 404 profile_not_found。
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    profile_res = (
        admin.table("farmer_profiles")
        .select(
            "user_id, prefecture, city, field_size, note, "
            "display_name, bio, avatar_url"
        )
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not profile_res.data:
        return _error(404, "profile_not_found")

    user_res = (
        admin.table("users")
        .select("name")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    name = (user_res.data[0]["name"] if user_res.data else "")

    p = profile_res.data[0]
    return {
        "user_id": p["user_id"],
        "name": name,
        "display_name": p.get("display_name"),
        "bio": p.get("bio"),
        "avatar_url": p.get("avatar_url"),
        "prefecture": p["prefecture"],
        "city": p["city"],
        "field_size": p.get("field_size"),
        "note": p.get("note"),
    }


@router.put("/profile")
async def update_my_profile(
    payload: MeProfileUpdatePayload,
    user: dict = require_role("farmer"),
):
    """farmer 自身のプロフィールを更新 (spec §5.2)。

    フロー:
      1. avatar_url が指定なら public URL → path 抽出 → §5.4 path validation。
         不正なら 400 invalid_avatar_path で全体拒否。
      2. 既存 avatar_url を取得 (旧画像削除のため)。
      3. update().eq("user_id", auth.uid()) で原子更新。
         user_id を payload で受けないので書き換え攻撃は構造上発生しない (§5.3)。
      4. 新旧 avatar が異なれば旧 avatar を Storage から remove (best-effort)。
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    # 1. avatar_url の path validation
    new_avatar_path: str | None = None
    if payload.avatar_url:
        new_avatar_path = public_url_to_path(payload.avatar_url, "avatars")
        if new_avatar_path is None or not validate_avatar_path(
            new_avatar_path, user_id
        ):
            return _error(400, "invalid_avatar_path")

    # 2. 既存 avatar_url を取得 (orphan 削除のため)
    existing = (
        admin.table("farmer_profiles")
        .select("avatar_url")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        return _error(404, "profile_not_found")
    old_avatar_url: str | None = existing.data[0].get("avatar_url")

    # 3. UPDATE (user_id は eq で強制、payload に含まれない)
    update_fields: dict = {
        "display_name": payload.display_name,
        "bio": payload.bio,
        "avatar_url": payload.avatar_url,
        "prefecture": payload.prefecture,
        "city": payload.city,
        "field_size": payload.field_size,
        "note": payload.note,
    }
    try:
        admin.table("farmer_profiles").update(update_fields).eq(
            "user_id", user_id
        ).execute()
    except Exception:
        logger.exception("failed to update farmer_profiles")
        return _error(500, "failed_to_update_profile")

    # 4. 旧 avatar を best-effort 削除 (失敗しても 200 を返す、spec §10.2)
    if old_avatar_url and old_avatar_url != payload.avatar_url:
        old_path = public_url_to_path(old_avatar_url, "avatars")
        # 旧 path は本人領域の前提だが念のため検証 (他人 path の誤削除を構造的に防ぐ)
        if old_path and validate_avatar_path(old_path, user_id):
            try:
                admin.storage.from_("avatars").remove([old_path])
            except Exception:
                logger.warning(
                    "failed to remove old avatar (best-effort): %s", old_path
                )

    return {"ok": True}

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id, get_user_role
from app.dependencies import get_current_user, require_role
from app.models.schemas import FarmerOnboardingPayload, MakerOnboardingPayload
from app.services.supabase import get_supabase_admin

router = APIRouter()


def _error(status_code: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"ok": False, "error": code})


@router.get("/status")
async def onboarding_status(user: dict = Depends(get_current_user)):
    """オンボーディング状態を返す。

    - role: app_metadata.role
    - has_profile: ロールに対応する profile (+ farmer の場合は user_crops 1件以上) が存在するか
    farmer は farmer_profiles と user_crops の両方が揃って初めて完了とみなす (非トランザクションな
    3段階書き込みの中断耐性のため)。
    """
    user_id = get_user_id(user)
    role = get_user_role(user)
    admin = get_supabase_admin()

    has_profile = False
    if role == "farmer":
        profile_res = (
            admin.table("farmer_profiles").select("user_id").eq("user_id", user_id).execute()
        )
        crops_res = (
            admin.table("user_crops").select("crop_id").eq("user_id", user_id).limit(1).execute()
        )
        has_profile = bool(profile_res.data) and bool(crops_res.data)
    elif role == "maker":
        profile_res = (
            admin.table("maker_profiles").select("user_id").eq("user_id", user_id).execute()
        )
        has_profile = bool(profile_res.data)

    return {"role": role, "has_profile": has_profile}


@router.get("/crops")
async def onboarding_crops(user: dict = Depends(get_current_user)):
    """オンボーディングで使う作目マスタを返す。

    L1 / L2 カテゴリ + approved な crops を一括返却。将来レビュー投稿 UI でも再利用可。
    """
    admin = get_supabase_admin()

    l1_res = admin.table("crop_categories_l1").select("id, name").execute()
    l2_res = (
        admin.table("crop_categories_l2")
        .select("id, name, crop_categories_l1_id")
        .execute()
    )
    crops_res = (
        admin.table("crops")
        .select("id, name, crop_categories_l2_id")
        .eq("status", "approved")
        .execute()
    )

    return {
        "categories_l1": l1_res.data or [],
        "categories_l2": l2_res.data or [],
        "crops": crops_res.data or [],
    }


@router.post("/farmer")
async def onboard_farmer(
    payload: FarmerOnboardingPayload,
    user: dict = require_role("farmer"),
):
    """farmer のオンボーディング完了処理。

    順序:
      1. farmer_profiles を upsert (on_conflict=user_id)
      2. user_crops を全削除
      3. user_crops に crop_ids を一括 INSERT
    2-3 の間で中断しても、再送で冪等に収束する。
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    try:
        admin.table("farmer_profiles").upsert(
            {
                "user_id": user_id,
                "prefecture": payload.prefecture,
                "city": payload.city,
                "field_size": payload.field_size,
                "note": payload.note,
            },
            on_conflict="user_id",
        ).execute()
    except Exception:
        return _error(500, "failed_to_upsert_farmer_profile")

    try:
        admin.table("user_crops").delete().eq("user_id", user_id).execute()
    except Exception:
        return _error(500, "failed_to_clear_user_crops")

    try:
        rows = [{"user_id": user_id, "crop_id": cid} for cid in payload.crop_ids]
        admin.table("user_crops").insert(rows).execute()
    except Exception:
        return _error(500, "failed_to_insert_user_crops")

    return {"ok": True}


@router.post("/maker")
async def onboard_maker(
    payload: MakerOnboardingPayload,
    user: dict = require_role("maker"),
):
    """maker のオンボーディング完了処理。maker_profiles の upsert のみ。"""
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    try:
        admin.table("maker_profiles").upsert(
            {
                "user_id": user_id,
                "company_name": payload.company_name,
                "prefecture": payload.prefecture,
                "city": payload.city,
                "note": payload.note,
            },
            on_conflict="user_id",
        ).execute()
    except Exception:
        return _error(500, "failed_to_upsert_maker_profile")

    return {"ok": True}

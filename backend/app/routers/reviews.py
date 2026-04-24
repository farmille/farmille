from uuid import UUID

from fastapi import APIRouter, Depends, Response
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id
from app.dependencies import get_current_user
from app.models.schemas import ReviewUpdatePayload
from app.services.supabase import get_supabase_admin

router = APIRouter()


def _fetch_owner(admin, review_id: UUID) -> str | None:
    res = (
        admin.table("reviews")
        .select("user_id")
        .eq("id", str(review_id))
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    return res.data[0]["user_id"]


@router.put("/{review_id}")
async def update_review(
    review_id: UUID,
    payload: ReviewUpdatePayload,
    user: dict = Depends(get_current_user),
):
    """レビュー編集。投稿者本人のみ許可。他人の review_id は 403。"""
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    owner = _fetch_owner(admin, review_id)
    if owner is None:
        return JSONResponse(
            status_code=404,
            content={"ok": False, "error": "review_not_found"},
        )
    if owner != user_id:
        return JSONResponse(
            status_code=403,
            content={"ok": False, "error": "not_owner"},
        )

    try:
        admin.table("reviews").update(
            {"rating": payload.rating, "body": payload.body}
        ).eq("id", str(review_id)).execute()
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": "failed_to_update_review"},
        )

    return {"ok": True}


@router.delete("/{review_id}", status_code=204)
async def delete_review(
    review_id: UUID,
    user: dict = Depends(get_current_user),
):
    """レビュー削除。投稿者本人のみ許可。
    Storage の画像は v1 では残存許容 (Phase 10 / v1.5 で回収)。"""
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    owner = _fetch_owner(admin, review_id)
    if owner is None:
        return JSONResponse(
            status_code=404,
            content={"ok": False, "error": "review_not_found"},
        )
    if owner != user_id:
        return JSONResponse(
            status_code=403,
            content={"ok": False, "error": "not_owner"},
        )

    try:
        admin.table("reviews").delete().eq("id", str(review_id)).execute()
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": "failed_to_delete_review"},
        )

    return Response(status_code=204)

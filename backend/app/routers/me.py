from fastapi import APIRouter, Query

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.services.supabase import get_supabase_admin

router = APIRouter()

REVIEWER_ROLES = ("farmer", "researcher", "ja_staff")


def _representative_image(images: list | None) -> str | None:
    if not images:
        return None
    sorted_imgs = sorted(images, key=lambda x: x.get("order", 0))
    return sorted_imgs[0].get("url") if sorted_imgs else None


def _maker_display_name(users: dict | None) -> str | None:
    if not users:
        return None
    raw = users.get("maker_profiles")
    if isinstance(raw, list):
        profile = raw[0] if raw else {}
    elif isinstance(raw, dict):
        profile = raw
    else:
        profile = {}
    return profile.get("company_name") or users.get("name")


def _flatten_review(row: dict) -> dict:
    product = row.get("products") or {}
    return {
        "id": row["id"],
        "product_id": row.get("product_id"),
        "product_name": product.get("name"),
        "product_maker_name": _maker_display_name(product.get("users")),
        "product_image_url": _representative_image(product.get("product_images")),
        "rating": row.get("rating"),
        "body": row.get("body"),
        # レビュー承認フロー (2026-06-13): 自分のレビューが pending/rejected か分かるよう
        # status を返す。/me/reviews で承認待ち・却下バッジを出すため。
        "status": row.get("status"),
        "rejection_reason": row.get("rejection_reason"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


@router.get("/reviews")
async def list_my_reviews(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = require_role(*REVIEWER_ROLES),
):
    """ログインユーザ自身が投稿したレビュー一覧。投稿日時 desc。

    Phase 12b 新設。reviewer 系ロール (farmer / researcher / ja_staff) のみ
    アクセス可。spec §4.1 / Q2 確定: limit default 20。
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    start = (page - 1) * limit
    end = start + limit - 1

    res = (
        admin.table("reviews")
        .select(
            'id, product_id, rating, body, status, rejection_reason, '
            'created_at, updated_at, '
            'products(name, users(name, maker_profiles(company_name)), '
            'product_images(url, "order"))',
            count="exact",
        )
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(start, end)
        .execute()
    )
    reviews = [_flatten_review(r) for r in (res.data or [])]
    total = res.count or 0
    return {"reviews": reviews, "total": total}

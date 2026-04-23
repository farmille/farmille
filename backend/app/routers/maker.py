from fastapi import APIRouter

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.services.supabase import get_supabase_admin

router = APIRouter()


def _flatten(row: dict) -> dict:
    """自社資材一覧用の最小フィールド整形。
    products × product_types(name) × product_images(代表画像) のみ。
    """
    product_type = row.get("product_types") or {}
    images = sorted(
        row.get("product_images") or [], key=lambda x: x.get("order", 0)
    )
    image_url = images[0].get("url") if images else None
    return {
        "id": row["id"],
        "name": row["name"],
        "type_name": product_type.get("name"),
        "image_url": image_url,
        "created_at": row.get("created_at"),
    }


@router.get("/products")
async def list_maker_products(user: dict = require_role("maker")):
    """maker 自身が登録した資材の一覧。最新順。

    レスポンス: { products: [{ id, name, type_name, image_url, created_at }] }
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    res = (
        admin.table("products")
        .select(
            'id, name, created_at, '
            'product_types(name), '
            'product_images(url, "order")'
        )
        .eq("maker_id", maker_id)
        .order("created_at", desc=True)
        .execute()
    )
    products = [_flatten(r) for r in (res.data or [])]
    return {"products": products}

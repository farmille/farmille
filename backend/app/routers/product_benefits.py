from fastapi import APIRouter

from app.services.supabase import get_supabase_admin

router = APIRouter()


@router.get("")
async def list_product_benefits():
    """JBSA 効果タグ一覧。category でグルーピングされる前提のため
    category → sort_order → name の順で返却。認証不要。

    spec §9 漏れの追加分 (docs/specs/maker-product.md §6.1 の UI 用)。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("product_benefits")
        .select("id, name, category, sort_order")
        .order("category")
        .order("sort_order")
        .order("name")
        .execute()
    )
    return {"product_benefits": res.data or []}

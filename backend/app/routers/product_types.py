from fastapi import APIRouter

from app.services.supabase import get_supabase_admin

router = APIRouter()


@router.get("")
async def list_product_types():
    """製品タイプ一覧(BS資材 / 農薬 / 肥料 / 土壌改良材)。is_active のみ返す。

    レスポンス: { product_types: [{ id, name }] }
    認証不要。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("product_types")
        .select("id, name")
        .eq("is_active", True)
        .order("name")
        .execute()
    )
    return {"product_types": res.data or []}

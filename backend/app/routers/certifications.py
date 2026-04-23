from fastapi import APIRouter

from app.services.supabase import get_supabase_admin

router = APIRouter()


@router.get("")
async def list_certifications():
    """認証体系マスタ (有機JAS / JGAP / GLOBALG.A.P. など)。
    name 順で返却。認証不要。

    spec §9 漏れの追加分 (docs/specs/maker-product.md §6.1 の UI 用)。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("certifications")
        .select("id, name")
        .order("name")
        .execute()
    )
    return {"certifications": res.data or []}

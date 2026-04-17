from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_products():
    """資材一覧を返す（未実装スケルトン）。"""
    return {"products": [], "message": "Not implemented yet"}

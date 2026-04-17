from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_reviews():
    """レビュー一覧を返す（未実装スケルトン）。"""
    return {"reviews": [], "message": "Not implemented yet"}

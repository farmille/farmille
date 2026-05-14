"""Events v1 — 暗黙フォロワー API (Sprint 3).

spec: docs/specs/events-v1.md §4.6 / §5.4 / §9 Sprint 3
ADR-0010: 講演会機能 v1 採用

Sprint 3 範囲:
- GET /v1/me/followed-makers   自分が favorite した製品の maker 集合

設計要点:
- kind='favorite' のみ集計 (Ryoga C6 確定、SPEC §10.8 の v1.5 案を v1 で先取り)
- candidate は「マイ資材候補」= 比較検討中なので暗黙フォロー対象外
- 単一クエリで user_favorites → products → users(role='maker') を join
  (N+1 回避、SPEC §10 ループ禁止)
- レスポンスは {manufacturer_ids, manufacturers} の両方を返す
  (id 配列だけ欲しい場合と詳細欲しい場合の両用)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends

from app.auth.jwt import get_user_id
from app.dependencies import get_current_user
from app.models.schemas import FollowedMaker, FollowedMakersResponse
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()

# SPEC §3.2 / §5.4: 全ロール許可。maker が自社製品を favorite するケースも
# ありうるので role guard は付けない (ADR-0010 Sprint 3 hotfix)。
# favorite 0 件のロールは自然に空配列が返る。


def _coerce_one(rel: dict | list | None) -> dict:
    if isinstance(rel, list):
        return rel[0] if rel else {}
    if isinstance(rel, dict):
        return rel
    return {}


def _maker_display_name(maker: dict) -> str:
    raw = maker.get("maker_profiles")
    if isinstance(raw, list):
        profile = raw[0] if raw else {}
    elif isinstance(raw, dict):
        profile = raw
    else:
        profile = {}
    return profile.get("company_name") or maker.get("name") or ""


@router.get("", response_model=FollowedMakersResponse)
async def list_followed_makers(
    user: dict = Depends(get_current_user),
) -> FollowedMakersResponse:
    """自分が favorite した製品の maker 集合 (SPEC §5.4)。

    Ryoga C6: kind='favorite' のみを暗黙フォローと見なす。
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    res = (
        admin.table("user_favorites")
        .select(
            "product_id, "
            "products(id, maker_id, "
            "users:maker_id(id, name, maker_profiles(company_name)))"
        )
        .eq("user_id", user_id)
        .eq("kind", "favorite")
        .execute()
    )

    seen: dict[str, FollowedMaker] = {}
    for row in res.data or []:
        product = _coerce_one(row.get("products"))
        maker = _coerce_one(product.get("users"))
        maker_id = maker.get("id")
        if not maker_id:
            continue
        if maker_id in seen:
            continue
        seen[maker_id] = FollowedMaker(
            user_id=maker_id,
            display_name=_maker_display_name(maker),
        )

    manufacturers = list(seen.values())
    return FollowedMakersResponse(
        manufacturer_ids=[m.user_id for m in manufacturers],
        manufacturers=manufacturers,
    )

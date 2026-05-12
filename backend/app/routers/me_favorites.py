"""Phase 16: マイ資材 (お気に入り + 候補) endpoints.

spec: docs/specs/my-materials.md §5

mounting: backend/app/main.py で /v1/me/favorites prefix で include。

設計要点:
- user_id は payload で受け取らず、JWT.sub を強制 (spec §10.1)
- UNIQUE(user_id, product_id) 違反は 409 で返し、kind 切替は PATCH /kind を案内
- PATCH /kind を分離する理由は spec §10.2 (将来の note 列追加に備えた拡張余地)
- products 削除時は ON DELETE CASCADE で自動清掃 (spec §10.6)
"""

from __future__ import annotations

import logging
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import FavoriteCreatePayload, FavoriteKindUpdatePayload
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()

REVIEWER_ROLES = ("farmer", "researcher", "ja_staff")


# ---- helpers ----------------------------------------------------------------


def _coerce_one(rel: dict | list | None) -> dict:
    """Supabase の 1:1 join が dict or list で返る両対応 (products.py と同じ)."""
    if isinstance(rel, list):
        return rel[0] if rel else {}
    if isinstance(rel, dict):
        return rel
    return {}


def _maker_display_name(maker: dict) -> str | None:
    """maker_profiles.company_name を優先、無ければ users.name にフォールバック."""
    raw = maker.get("maker_profiles")
    if isinstance(raw, list):
        profile = raw[0] if raw else {}
    elif isinstance(raw, dict):
        profile = raw
    else:
        profile = {}
    return profile.get("company_name") or maker.get("name")


def _representative_image(images: list[dict] | None) -> str | None:
    if not images:
        return None
    sorted_images = sorted(images, key=lambda x: x.get("order", 0))
    return sorted_images[0].get("url")


def _flatten_favorite(row: dict) -> dict:
    """user_favorites の 1 行を spec §5.1 の FavoriteListItem 形に整形する."""
    product = _coerce_one(row.get("products"))
    maker = _coerce_one(product.get("users"))
    product_type = _coerce_one(product.get("product_types"))
    return {
        "id": row["id"],
        "kind": row["kind"],
        "created_at": row.get("created_at"),
        "product": {
            "id": product.get("id"),
            "name": product.get("name"),
            "maker_name": _maker_display_name(maker),
            "image_url": _representative_image(product.get("product_images")),
            "type_name": product_type.get("name"),
        },
    }


def _is_unique_violation(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "23505" in msg or "duplicate key" in msg or "unique" in msg


# ---- endpoints --------------------------------------------------------------


@router.get("")
async def list_favorites(
    kind: Literal["favorite", "candidate"] | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=200),
    user: dict = require_role(*REVIEWER_ROLES),
):
    """spec §5.1: 自分の user_favorites を返す。kind 指定時は絞り込み."""
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    query = (
        admin.table("user_favorites")
        .select(
            "id, kind, created_at, "
            "products(id, name, "
            "users(name, maker_profiles(company_name)), "
            "product_types(id, name), "
            'product_images(url, "order"))'
        )
        .eq("user_id", user_id)
    )
    if kind is not None:
        query = query.eq("kind", kind)

    res = query.order("created_at", desc=True).limit(limit).execute()
    favorites = [_flatten_favorite(r) for r in (res.data or [])]
    return {"favorites": favorites}


@router.post("", status_code=201)
async def create_favorite(
    payload: FavoriteCreatePayload,
    user: dict = require_role(*REVIEWER_ROLES),
):
    """spec §5.2: 新しい user_favorites 行を作成する。

    - user_id は JWT.sub を強制 (spec §10.1)
    - product 存在確認 → 404
    - UNIQUE(user_id, product_id) 違反 → 409 (kind 切替は PATCH /kind を案内)
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    # 1. product 存在確認 (404)
    prod_res = (
        admin.table("products")
        .select("id")
        .eq("id", str(payload.product_id))
        .limit(1)
        .execute()
    )
    if not prod_res.data:
        raise HTTPException(
            status_code=404,
            detail={"detail": "product_not_found", "code": "product_not_found"},
        )

    # 2. INSERT。UNIQUE 違反は 409
    try:
        ins = (
            admin.table("user_favorites")
            .insert(
                {
                    "user_id": user_id,
                    "product_id": str(payload.product_id),
                    "kind": payload.kind,
                }
            )
            .execute()
        )
    except Exception as exc:  # noqa: BLE001 - 409 判定のため広く受ける
        if _is_unique_violation(exc):
            raise HTTPException(
                status_code=409,
                detail={"detail": "already_exists", "code": "already_exists"},
            ) from exc
        logger.exception("failed to insert user_favorite for user %s", user_id)
        raise HTTPException(
            status_code=500,
            detail={
                "detail": "failed_to_create_favorite",
                "code": "failed_to_create_favorite",
            },
        ) from exc

    if not ins.data:
        raise HTTPException(
            status_code=500,
            detail={
                "detail": "failed_to_create_favorite",
                "code": "failed_to_create_favorite",
            },
        )

    new_row = ins.data[0]
    return {"ok": True, "id": new_row["id"], "kind": new_row["kind"]}


def _fetch_favorite_owner(admin, favorite_id: str) -> str | None:
    res = (
        admin.table("user_favorites")
        .select("user_id")
        .eq("id", favorite_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    return res.data[0]["user_id"]


@router.patch("/{favorite_id}/kind")
async def update_favorite_kind(
    favorite_id: UUID,
    payload: FavoriteKindUpdatePayload,
    user: dict = require_role(*REVIEWER_ROLES),
):
    """spec §5.3: kind 切替 (favorite ⇄ candidate)。owner のみ。"""
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    owner = _fetch_favorite_owner(admin, str(favorite_id))
    if owner is None:
        raise HTTPException(
            status_code=404,
            detail={"detail": "favorite_not_found", "code": "favorite_not_found"},
        )
    if owner != user_id:
        raise HTTPException(
            status_code=403,
            detail={"detail": "not_owner", "code": "not_owner"},
        )

    try:
        upd = (
            admin.table("user_favorites")
            .update({"kind": payload.kind})
            .eq("id", str(favorite_id))
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to update favorite kind id=%s", favorite_id)
        raise HTTPException(
            status_code=500,
            detail={
                "detail": "failed_to_update_favorite",
                "code": "failed_to_update_favorite",
            },
        ) from exc

    if not upd.data:
        # update 直前で別 session に消された場合 (レアレース)
        raise HTTPException(
            status_code=404,
            detail={"detail": "favorite_not_found", "code": "favorite_not_found"},
        )
    row = upd.data[0]
    return {"ok": True, "id": row["id"], "kind": row["kind"]}


@router.delete("/{favorite_id}", status_code=204)
async def delete_favorite(
    favorite_id: UUID,
    user: dict = require_role(*REVIEWER_ROLES),
):
    """spec §5.4: owner のみ DELETE。冪等のため既に消えていれば 404."""
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    owner = _fetch_favorite_owner(admin, str(favorite_id))
    if owner is None:
        raise HTTPException(
            status_code=404,
            detail={"detail": "favorite_not_found", "code": "favorite_not_found"},
        )
    if owner != user_id:
        raise HTTPException(
            status_code=403,
            detail={"detail": "not_owner", "code": "not_owner"},
        )

    try:
        admin.table("user_favorites").delete().eq("id", str(favorite_id)).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to delete favorite id=%s", favorite_id)
        raise HTTPException(
            status_code=500,
            detail={
                "detail": "failed_to_delete_favorite",
                "code": "failed_to_delete_favorite",
            },
        ) from exc

    return Response(status_code=204)

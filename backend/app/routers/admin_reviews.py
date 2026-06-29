"""Admin レビュー承認 queue endpoints (2026-06-13 / 奥田さん指示 6-15 定例)。

- GET  /v1/admin/reviews                    — キュー一覧、status / page フィルタ
- POST /v1/admin/reviews/{id}/approve        — pending → approved (公開)
- POST /v1/admin/reviews/{id}/reject         — pending → rejected (非公開、理由任意)

承認フロー (pre-moderation):
  farmer がレビュー投稿 → status='pending' (公開ページ非表示) → admin がここで承認
  → status='approved' → products.list_product_reviews が拾い公開表示。

設計は admin_reports.py に揃える (require_role + service_role + _error)。
product_name / user_name は admin 側でのみ解決し、公開 endpoint からは leak しない。
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import (
    AdminReviewItem,
    AdminReviewListResponse,
    AdminReviewRejectPayload,
)
from app.routers._sorting import resolve_sort
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter()

# 列ヘッダソート (2026-06-29): frontend のキー → reviews テーブルのスカラー列。
# 結合列 (資材名/投稿者名) は v1 では非対応。
_REVIEW_SORTS = {
    "created_at": "created_at",
    "rating": "rating",
    "status": "status",
}


def _error(status_code: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"ok": False, "error": code})


def _embedded_name(row: dict[str, Any], key: str) -> str | None:
    """Supabase の to-one join (`products(name)` / `users(name)`) は dict / list
    どちらでも返り得るため両対応で name を取り出す。"""
    raw = row.get(key)
    if isinstance(raw, list):
        raw = raw[0] if raw else None
    if isinstance(raw, dict):
        return raw.get("name")
    return None


@router.get("", response_model=AdminReviewListResponse)
async def list_admin_reviews(
    _user: dict = require_role("admin"),
    status: str | None = Query(
        default="pending", description="pending / approved / rejected / 空=すべて"
    ),
    sort: str | None = Query(
        default=None, description="created_at / rating / status"
    ),
    direction: str | None = Query(
        default="desc", alias="dir", description="asc / desc"
    ),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=100),
) -> AdminReviewListResponse:
    """既定は status='pending' (承認待ちキュー)、created_at desc (最新が上)。

    列ヘッダソート対応 (created_at / rating / status)。古い順 (FIFO) で承認待ちを
    捌きたいときは dir=asc に切り替える。
    """
    admin = get_supabase_admin()

    # reviews→users は user_id と approved_by の 2 本 FK があるため、投稿者名は
    # user_id FK の制約名でヒントする (products は product_id 単一 FK で曖昧さなし)。
    query = admin.table("reviews").select(
        "id, product_id, user_id, rating, body, status, created_at, "
        "approved_by, approved_at, rejection_reason, "
        "products(name), users!reviews_user_id_fkey(name)",
        count="exact",
    )
    if status:
        query = query.eq("status", status)
    col, desc = resolve_sort(sort, direction, _REVIEW_SORTS, default_key="created_at")
    query = query.order(col, desc=desc).order("id", desc=desc)

    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end)

    res = query.execute()
    rows = res.data or []
    total = getattr(res, "count", None) or 0

    items: list[AdminReviewItem] = []
    for r in rows:
        items.append(
            AdminReviewItem(
                id=r["id"],
                product_id=r["product_id"],
                product_name=_embedded_name(r, "products"),
                user_id=r["user_id"],
                user_name=_embedded_name(r, "users"),
                rating=r["rating"],
                body=r["body"],
                status=r["status"],
                created_at=r["created_at"],
                approved_by=r.get("approved_by"),
                approved_at=r.get("approved_at"),
                rejection_reason=r.get("rejection_reason"),
            )
        )

    return AdminReviewListResponse(
        reviews=items, total=total, page=page, per_page=per_page
    )


def _set_status(
    review_id: UUID,
    *,
    new_status: str,
    actor_id: str,
    rejection_reason: str | None,
) -> JSONResponse | None:
    """pending のレビューを approved / rejected に進める共通処理。
    成功時 None、失敗時 JSONResponse を返す。"""
    admin = get_supabase_admin()

    cur = (
        admin.table("reviews")
        .select("id, status")
        .eq("id", str(review_id))
        .limit(1)
        .execute()
    )
    rows = cur.data or []
    if not rows:
        return _error(404, "review_not_found")
    if rows[0]["status"] != "pending":
        return _error(409, "already_moderated")

    try:
        # SELECT→UPDATE 間の競合 (approve/reject 二重クリックや 2 admin 同時) で
        # 後勝ち clobber しないよう、UPDATE 自体も status='pending' を条件にして原子化する。
        # 0 件更新 = 既に他者が処理済 → 409。
        res = (
            admin.table("reviews")
            .update(
                {
                    "status": new_status,
                    "approved_by": actor_id,
                    "approved_at": datetime.now(timezone.utc).isoformat(),
                    "rejection_reason": rejection_reason,
                }
            )
            .eq("id", str(review_id))
            .eq("status", "pending")
            .execute()
        )
    except Exception:
        logger.exception("failed to set review %s status=%s", review_id, new_status)
        return _error(500, "failed_to_moderate_review")

    if not (res.data or []):
        return _error(409, "already_moderated")

    return None


@router.post("/{review_id}/approve")
async def approve_review(
    review_id: UUID,
    _user: dict = require_role("admin"),
):
    """pending → approved。承認後は公開ページに表示される。"""
    err = _set_status(
        review_id,
        new_status="approved",
        actor_id=get_user_id(_user),
        rejection_reason=None,
    )
    if err is not None:
        return err
    return {"ok": True, "review_id": str(review_id), "status": "approved"}


@router.post("/{review_id}/reject")
async def reject_review(
    review_id: UUID,
    payload: AdminReviewRejectPayload,
    _user: dict = require_role("admin"),
):
    """pending → rejected。非公開のまま却下理由を記録する (理由は任意)。"""
    err = _set_status(
        review_id,
        new_status="rejected",
        actor_id=get_user_id(_user),
        rejection_reason=payload.reason,
    )
    if err is not None:
        return err
    return {"ok": True, "review_id": str(review_id), "status": "rejected"}


@router.post("/{review_id}/unpublish")
async def unpublish_review(
    review_id: UUID,
    payload: AdminReviewRejectPayload,
    _user: dict = require_role("admin"),
):
    """非公開化 (stage1 / 2026-06-29): pending|approved → rejected。

    reject との違いは「既に公開済 (approved) のレビューも取り下げられる」こと。
    _set_status は pending 限定なので公開後の取り下げ導線が無かった。物理削除では
    なく status を rejected にするだけなので可逆 (再 approve で復活可)。
    既に rejected のものは 409 (冪等寄り、二重操作の clobber 防止)。
    """
    admin = get_supabase_admin()

    cur = (
        admin.table("reviews")
        .select("id, status")
        .eq("id", str(review_id))
        .limit(1)
        .execute()
    )
    rows = cur.data or []
    if not rows:
        return _error(404, "review_not_found")
    if rows[0]["status"] == "rejected":
        return _error(409, "already_rejected")

    try:
        # UPDATE 自体も status in (pending, approved) を条件にして原子化し、
        # 2 admin 同時操作での後勝ち clobber を防ぐ。0 件更新 = 既に他者が処理 → 409。
        res = (
            admin.table("reviews")
            .update(
                {
                    "status": "rejected",
                    "approved_by": get_user_id(_user),
                    "approved_at": datetime.now(timezone.utc).isoformat(),
                    "rejection_reason": payload.reason or "管理者により非公開化",
                }
            )
            .eq("id", str(review_id))
            .in_("status", ["pending", "approved"])
            .execute()
        )
    except Exception:
        logger.exception("failed to unpublish review %s", review_id)
        return _error(500, "failed_to_unpublish_review")

    if not (res.data or []):
        return _error(409, "already_rejected")

    return {"ok": True, "review_id": str(review_id), "status": "rejected"}


def _remove_review_images(admin, user_id: str, review_id: str) -> None:
    """ハード削除時に Storage `review-images/{user_id}/{review_id}/` を回収する。
    best-effort: 失敗してもログのみ (行削除は既に確定しているため)。"""
    folder = f"{user_id}/{review_id}"
    try:
        entries = admin.storage.from_("review-images").list(folder)
    except Exception:
        logger.warning(
            "failed to list review images for delete %s", review_id, exc_info=True
        )
        return
    paths = [
        f"{folder}/{e['name']}"
        for e in (entries or [])
        if isinstance(e, dict) and e.get("name") and not e["name"].startswith(".")
    ]
    if not paths:
        return
    try:
        admin.storage.from_("review-images").remove(paths)
    except Exception:
        logger.warning(
            "failed to remove review images for %s", review_id, exc_info=True
        )


@router.delete("/{review_id}", status_code=204)
async def delete_review_admin(
    review_id: UUID,
    _user: dict = require_role("admin"),
):
    """ハード削除 (stage1 / 2026-06-29): レビュー行を物理削除する。

    reject/unpublish (非公開化) と違い復元不可。中間テーブル
    (review_crops / review_benefit_relations / review_point_relations /
    review_period_relations) は ON DELETE CASCADE で自動削除。レビューに紐づく
    監査ログ (user_reports は user 単位) は無く CASCADE 破壊の懸念なし。
    Storage 画像は行削除後に best-effort で回収する。
    """
    admin = get_supabase_admin()

    cur = (
        admin.table("reviews")
        .select("id, user_id")
        .eq("id", str(review_id))
        .limit(1)
        .execute()
    )
    rows = cur.data or []
    if not rows:
        return _error(404, "review_not_found")
    owner_id = rows[0]["user_id"]

    try:
        admin.table("reviews").delete().eq("id", str(review_id)).execute()
    except Exception:
        logger.exception("failed to hard-delete review %s", review_id)
        return _error(500, "failed_to_delete_review")

    # 行削除が確定してから Storage を回収 (失敗は best-effort、204 を返す)。
    _remove_review_images(admin, owner_id, str(review_id))
    return None

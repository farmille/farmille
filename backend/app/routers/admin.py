"""Admin BFF endpoints (ADR-0009 / spec maker-approval-admin §5).

`/v1/admin/*` 配下は `require_role("admin")` で第一防御する。書き込みは
service_role 経由のため RLS は第二防御に徹する。

提供エンドポイント:
- GET /v1/admin/summary
- GET /v1/admin/makers/pending
- POST /v1/admin/makers/{user_id}/approve
- POST /v1/admin/makers/{user_id}/reject
- POST /v1/admin/users/{user_id}/role
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.dependencies import require_role
from app.models.schemas import (
    AdminMakerOption,
    AdminMakersResponse,
    AdminRoleAssignPayload,
    AdminSummaryResponse,
    PendingMakerItem,
    PendingMakersResponse,
    RejectMakerPayload,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()


ASSIGNABLE_ROLES: set[str] = {"admin", "ja_staff", "researcher"}


def _error(status_code: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"ok": False, "error": code})


def _maker_profile(row: dict[str, Any]) -> dict[str, Any]:
    """Supabase 1:1 join (`maker_profiles`) は dict / list どちらでも返り得る。"""
    raw = row.get("maker_profiles")
    if isinstance(raw, list):
        return raw[0] if raw else {}
    if isinstance(raw, dict):
        return raw
    return {}


@router.get("/summary", response_model=AdminSummaryResponse)
async def get_admin_summary(
    _user: dict = require_role("admin"),
) -> AdminSummaryResponse:
    """admin ダッシュボード初期表示用サマリ (spec §5.1 + admin-aglist v2 §3.4)。"""
    admin = get_supabase_admin()

    def _count(table: str, filters: list[tuple[str, Any]]) -> int:
        query = admin.table(table).select("id")
        for col, val in filters:
            query = query.eq(col, val)
        res = query.execute()
        return len(res.data or [])

    pending = _count("users", [("role", "maker"), ("status", "pending_review")])
    active = _count("users", [("role", "maker"), ("status", "active")])
    rejected = _count("users", [("role", "maker"), ("status", "rejected")])
    total = _count("users", [])

    # admin-aglist-alignment-v2.md §3.4: products カード追加
    products_total = _count("products", [])
    products_public_total = _count("products", [("is_public", True)])

    return AdminSummaryResponse(
        pending_makers_count=pending,
        active_makers_count=active,
        rejected_makers_count=rejected,
        total_users_count=total,
        products_total=products_total,
        products_public_total=products_public_total,
    )


@router.get("/makers/pending", response_model=PendingMakersResponse)
async def list_pending_makers(
    _user: dict = require_role("admin"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> PendingMakersResponse:
    """`role='maker' AND status='pending_review'` の一覧 (spec §5.2)。

    created_at ASC (先入れ先出し) で返す。`auth.users.email` は service_role で
    取得して各 row に付与する (B1 運営確認に必須)。
    """
    admin = get_supabase_admin()

    users_res = (
        admin.table("users")
        .select(
            "id, name, created_at, "
            "maker_profiles(company_name, prefecture, city, note)",
            count="exact",
        )
        .eq("role", "maker")
        .eq("status", "pending_review")
        .order("created_at", desc=False)
        .range(offset, offset + limit - 1)
        .execute()
    )
    rows = users_res.data or []
    total = users_res.count or 0

    items: list[PendingMakerItem] = []
    for r in rows:
        profile = _maker_profile(r)
        email = ""
        try:
            ar = admin.auth.admin.get_user_by_id(r["id"])
            user_obj = getattr(ar, "user", None) or ar
            email = getattr(user_obj, "email", None) or (
                user_obj.get("email", "") if isinstance(user_obj, dict) else ""
            ) or ""
        except Exception:
            logger.exception("failed to fetch auth email for user %s", r.get("id"))
        items.append(
            PendingMakerItem(
                user_id=r["id"],
                name=r.get("name") or "",
                email=email,
                company_name=profile.get("company_name"),
                prefecture=profile.get("prefecture"),
                city=profile.get("city"),
                note=profile.get("note"),
                created_at=r["created_at"],
            )
        )

    return PendingMakersResponse(makers=items, total=total)


@router.get("/makers", response_model=AdminMakersResponse)
async def list_makers(
    status: str = Query(
        default="active",
        description="フィルタする maker の status (active / pending_review / rejected)",
    ),
    _user: dict = require_role("admin"),
) -> AdminMakersResponse:
    """`role='maker' AND status=<filter>` の一覧 (spec admin-aglist-alignment-v2 §2.2)。

    F3 編集画面の maker_id ドロップダウン用。company_name は maker_profiles から、
    フォールバックは users.name。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("users")
        .select(
            "id, name, maker_profiles(company_name)",
        )
        .eq("role", "maker")
        .eq("status", status)
        .order("name", desc=False)
        .execute()
    )
    rows = res.data or []
    items: list[AdminMakerOption] = []
    for r in rows:
        profile = _maker_profile(r)
        items.append(
            AdminMakerOption(
                user_id=r["id"],
                name=r.get("name") or "",
                company_name=profile.get("company_name"),
            )
        )
    return AdminMakersResponse(makers=items)


def _fetch_maker_status(admin: Any, user_id: UUID) -> tuple[str | None, str | None]:
    """Return (role, status) or (None, None) if not found."""
    res = (
        admin.table("users")
        .select("role, status")
        .eq("id", str(user_id))
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return None, None
    row = rows[0]
    return row.get("role"), row.get("status")


@router.post("/makers/{user_id}/approve")
async def approve_maker(
    user_id: UUID,
    _user: dict = require_role("admin"),
):
    """pending_review なメーカーを active に遷移 (spec §5.3)。"""
    admin = get_supabase_admin()
    role, status = _fetch_maker_status(admin, user_id)
    if role is None or role != "maker":
        return _error(404, "maker_not_found")
    if status != "pending_review":
        return _error(409, "maker_not_pending")

    try:
        admin.table("users").update({"status": "active"}).eq(
            "id", str(user_id)
        ).execute()
    except Exception:
        logger.exception("failed to approve maker %s", user_id)
        return _error(500, "failed_to_approve_maker")

    return {"ok": True, "user_id": str(user_id), "status": "active"}


@router.post("/makers/{user_id}/reject")
async def reject_maker(
    user_id: UUID,
    payload: RejectMakerPayload,
    _user: dict = require_role("admin"),
):
    """pending_review なメーカーを rejected に遷移 (spec §5.4)。

    `reason` は v1 では DB に保存しない (監査ログテーブル v1 アウト、spec §1.3)。
    受け取りはするが破棄する。
    """
    _ = payload
    admin = get_supabase_admin()
    role, status = _fetch_maker_status(admin, user_id)
    if role is None or role != "maker":
        return _error(404, "maker_not_found")
    if status != "pending_review":
        return _error(409, "maker_not_pending")

    try:
        admin.table("users").update({"status": "rejected"}).eq(
            "id", str(user_id)
        ).execute()
    except Exception:
        logger.exception("failed to reject maker %s", user_id)
        return _error(500, "failed_to_reject_maker")

    return {"ok": True, "user_id": str(user_id), "status": "rejected"}


@router.post("/users/{user_id}/role")
async def assign_user_role(
    user_id: UUID,
    payload: AdminRoleAssignPayload,
    _user: dict = require_role("admin"),
):
    """admin / ja_staff / researcher への昇格 (spec §5.5)。

    `farmer` / `maker` は自己選択フロー (`/v1/auth/register-role`) に任せる。
    `unassigned` への降格は v1 アウト (SQL 直)。Pydantic Literal で 422 にも落ちる
    が、防御的に ASSIGNABLE_ROLES でも再判定する。

    既存 `register-role` のロールバックパターン (auth.py:40-62) を踏襲:
      1. 現ロールを SELECT で保持
      2. auth.users.app_metadata.role を更新
      3. public.users.role を更新
      4. 3. 失敗時は 1. で取った元ロールに auth を戻す
    """
    if payload.role not in ASSIGNABLE_ROLES:
        return _error(400, "invalid_target_role")

    admin = get_supabase_admin()

    res = (
        admin.table("users")
        .select("role")
        .eq("id", str(user_id))
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return _error(404, "user_not_found")
    previous_role = rows[0].get("role") or "unassigned"
    if previous_role == payload.role:
        return _error(409, "role_already_assigned")

    try:
        admin.auth.admin.update_user_by_id(
            str(user_id),
            {"app_metadata": {"role": payload.role}},
        )
    except Exception:
        logger.exception("failed to update auth metadata for %s", user_id)
        return _error(500, "failed_to_update_auth_metadata")

    try:
        upd = (
            admin.table("users")
            .update({"role": payload.role})
            .eq("id", str(user_id))
            .execute()
        )
        if not upd.data:
            raise RuntimeError("public.users row not found")
    except Exception:
        logger.exception("failed to update public.users for %s", user_id)
        try:
            admin.auth.admin.update_user_by_id(
                str(user_id),
                {"app_metadata": {"role": previous_role}},
            )
        except Exception:
            logger.exception("rollback failed for %s", user_id)
        return _error(500, "failed_to_update_users_table")

    return {"ok": True, "user_id": str(user_id), "role": payload.role}

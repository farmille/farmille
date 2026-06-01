"""Admin 通報 queue endpoints (2026-05-27 追加)。

- GET  /v1/admin/reports                   — queue 一覧、status / page フィルタ
- POST /v1/admin/reports/{id}/resolve       — admin が status を進める

reporter / target の name 解決は admin 側のみ (公開 endpoint からは leak しない)。
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import (
    REPORT_RESOLUTIONS,
    AdminReportItem,
    AdminReportListResponse,
    AdminReportResolvePayload,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter()


def _error(status_code: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"ok": False, "error": code})


@router.get("", response_model=AdminReportListResponse)
async def list_admin_reports(
    _user: dict = require_role("admin"),
    status: str | None = Query(default=None, description="pending / resolved / spam / dismissed"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=100),
) -> AdminReportListResponse:
    admin = get_supabase_admin()

    query = admin.table("user_reports").select(
        "id, reporter_user_id, target_user_id, reason, body, status, "
        "created_at, resolved_at, resolved_by, resolution_note",
        count="exact",
    )
    if status:
        query = query.eq("status", status)
    query = query.order("created_at", desc=True)

    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end)

    res = query.execute()
    rows = res.data or []
    total = getattr(res, "count", None) or 0

    # name 解決 (N+1 を覚悟、admin queue は件数少ない前提)
    name_cache: dict[str, str | None] = {}

    def name_for(uid: str | None) -> str | None:
        if uid is None:
            return None
        if uid in name_cache:
            return name_cache[uid]
        try:
            r = admin.table("users").select("name").eq("id", uid).limit(1).execute()
            n = (r.data or [{}])[0].get("name") if r.data else None
        except Exception:
            n = None
        name_cache[uid] = n
        return n

    items: list[AdminReportItem] = []
    for r in rows:
        items.append(
            AdminReportItem(
                id=r["id"],
                reporter_user_id=r.get("reporter_user_id"),
                reporter_name=name_for(r.get("reporter_user_id")),
                target_user_id=r["target_user_id"],
                target_name=name_for(r["target_user_id"]),
                reason=r["reason"],
                body=r.get("body"),
                status=r["status"],
                created_at=r["created_at"],
                resolved_at=r.get("resolved_at"),
                resolved_by=r.get("resolved_by"),
                resolution_note=r.get("resolution_note"),
            )
        )

    return AdminReportListResponse(reports=items, total=total, page=page, per_page=per_page)


@router.post("/{report_id}/resolve")
async def resolve_report(
    report_id: UUID,
    payload: AdminReportResolvePayload,
    _user: dict = require_role("admin"),
):
    """status: pending → resolved / spam / dismissed のいずれか。"""
    if payload.resolution not in REPORT_RESOLUTIONS:
        return _error(400, "invalid_resolution")

    admin = get_supabase_admin()
    actor_id = get_user_id(_user)

    cur = (
        admin.table("user_reports")
        .select("id, status")
        .eq("id", str(report_id))
        .limit(1)
        .execute()
    )
    rows = cur.data or []
    if not rows:
        return _error(404, "report_not_found")
    if rows[0]["status"] != "pending":
        return _error(409, "already_resolved")

    try:
        admin.table("user_reports").update(
            {
                "status": payload.resolution,
                "resolved_at": datetime.now(timezone.utc).isoformat(),
                "resolved_by": actor_id,
                "resolution_note": payload.note,
            }
        ).eq("id", str(report_id)).execute()
    except Exception:
        logger.exception("failed to resolve report %s", report_id)
        return _error(500, "failed_to_resolve_report")

    return {"ok": True}

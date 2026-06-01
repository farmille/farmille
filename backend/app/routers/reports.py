"""POST /v1/reports — ログイン済 user による user → user 通報。

設計判断 (2026-05-27 追加):
- target_user_id != reporter_user_id (自己通報禁止) は DB 側 CHECK で担保 + ここでも 400
- (reporter, target) で pending 重複は UNIQUE INDEX で防止 (409 で返す)
- reason は schema 側 enum、`other` を最低限提供
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id
from app.dependencies import get_current_user
from app.models.schemas import REPORT_REASONS, ReportCreatePayload
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter()


def _error(code_status: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=code_status, content={"ok": False, "error": code})


@router.post("", status_code=201)
async def create_report(
    payload: ReportCreatePayload,
    user: dict = Depends(get_current_user),
):
    """ユーザー対ユーザー通報を作成。

    400 invalid_reason       — reason が enum 外
    400 self_report_not_allowed — target == reporter
    404 target_not_found     — target_user_id が public.users にいない
    409 already_reported     — 既に pending 通報がある (UNIQUE 制約)
    """
    if payload.reason not in REPORT_REASONS:
        return _error(400, "invalid_reason")

    reporter_id = get_user_id(user)
    target_id = str(payload.target_user_id)
    if not reporter_id:
        return _error(401, "unauthenticated")
    if reporter_id == target_id:
        return _error(400, "self_report_not_allowed")

    admin = get_supabase_admin()

    # target 存在確認 (deleted 含む)
    tgt = (
        admin.table("users")
        .select("id, deleted_at")
        .eq("id", target_id)
        .limit(1)
        .execute()
    )
    if not (tgt.data or []):
        return _error(404, "target_not_found")
    if tgt.data[0].get("deleted_at"):
        return _error(404, "target_not_found")

    try:
        ins = (
            admin.table("user_reports")
            .insert(
                {
                    "reporter_user_id": reporter_id,
                    "target_user_id": target_id,
                    "reason": payload.reason,
                    "body": payload.body,
                }
            )
            .execute()
        )
    except Exception as exc:
        msg = str(exc).lower()
        if "duplicate" in msg or "unique" in msg or "23505" in msg:
            return _error(409, "already_reported")
        logger.exception("failed to insert user_report")
        return _error(500, "failed_to_create_report")

    rows = ins.data or []
    new_id = rows[0]["id"] if rows else None
    return {"ok": True, "report_id": new_id}

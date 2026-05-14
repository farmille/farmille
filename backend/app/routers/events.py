"""Events v1 — 公開 events + reviewer 申込 (Sprint 1).

spec: docs/specs/events-v1.md §5.1 + §9 Sprint 1
ADR-0010: 講演会機能 v1 採用

Sprint 1 範囲:
- GET /v1/events                  公開一覧 (status='published' + host active)
- GET /v1/events/{id}             公開詳細
- POST /v1/events/{id}/register   reviewer 限定の申込
- DELETE /v1/events/{id}/register 自分の申込 cancel (論理削除)

設計要点:
- BFF 第一防御 (require_role + status / ownership 検証) + RLS 第二防御
- 公開フィルタ: events.status='published' AND users.status='active' を BFF で post-filter
  (ADR-0009 と同パターン。users.status は ADR-0009 migration で追加予定。
   未追加環境では post-filter が no-op になる)
- active_registration_count は cancelled_at IS NULL の集計
- DELETE は物理削除しない、cancelled_at を UPDATE (履歴保持、SPEC §5.1)
- cancel 後再申込は UNIQUE 違反で 409 (v1 では許容、§10.6)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import (
    EventDetailResponse,
    EventHost,
    EventListItem,
    EventListResponse,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()

REVIEWER_ROLES = ("farmer", "researcher", "ja_staff")


# ---- helpers ----------------------------------------------------------------


def _coerce_one(rel: dict | list | None) -> dict:
    """Supabase の 1:1 join が dict or list で返る両対応."""
    if isinstance(rel, list):
        return rel[0] if rel else {}
    if isinstance(rel, dict):
        return rel
    return {}


def _maker_display_name(user: dict) -> str:
    """host 表示名。maker_profiles.company_name 優先、無ければ users.name."""
    profile = _coerce_one(user.get("maker_profiles"))
    return (
        profile.get("company_name")
        or user.get("name")
        or ""
    )


def _host_status_active(user: dict | None) -> bool:
    """users.status が 'active' か。

    users.status カラムは ADR-0009 migration で導入予定。未導入環境では
    フィールドが存在せず、その場合は v1 完全互換のために 'active' 扱いに
    フォールバックする (ADR-0009 完了時に厳格化される)。
    """
    if not user:
        return False
    status = user.get("status")
    if status is None:
        return True
    return status == "active"


def _count_active_registrations(admin: Any, event_id: str) -> int:
    """指定 event の cancelled_at IS NULL の申込件数を返す。"""
    res = (
        admin.table("event_registrations")
        .select("id", count="exact")
        .eq("event_id", event_id)
        .is_("cancelled_at", "null")
        .execute()
    )
    return res.count or 0


def _count_active_registrations_bulk(
    admin: Any, event_ids: list[str]
) -> dict[str, int]:
    """複数 event_id の active count を 1 query で集計 (一覧の N+1 回避)."""
    if not event_ids:
        return {}
    res = (
        admin.table("event_registrations")
        .select("event_id")
        .in_("event_id", event_ids)
        .is_("cancelled_at", "null")
        .execute()
    )
    counts: dict[str, int] = {}
    for row in res.data or []:
        eid = row.get("event_id")
        if eid:
            counts[eid] = counts.get(eid, 0) + 1
    return counts


def _build_host(host_row: dict | None, host_type: str) -> EventHost | None:
    if not host_row:
        return None
    return EventHost(
        user_id=host_row["id"],
        display_name=_maker_display_name(host_row),
        host_type=host_type,  # type: ignore[arg-type]
        prefecture=_coerce_one(host_row.get("maker_profiles")).get("prefecture"),
        city=_coerce_one(host_row.get("maker_profiles")).get("city"),
    )


# ---- GET /v1/events ---------------------------------------------------------


@router.get("", response_model=EventListResponse)
async def list_events(
    upcoming_only: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> EventListResponse:
    """公開 events 一覧 (SPEC §5.1)。

    - 認証不要
    - status='published' 強制 (BFF 第一防御)
    - host (users) の status='active' を post-filter (ADR-0009 整合)
    - upcoming_only=true (default): starts_at >= now() を絞る
    - 並び順: starts_at ASC (近い未来の event から表示)
    """
    admin = get_supabase_admin()

    # users.status 列の有無に依存しないため SELECT 自体は status を含めて取り、
    # 取得後に post-filter する。
    query = (
        admin.table("events")
        .select(
            "id, host_user_id, host_type, title, venue, online_url, "
            "starts_at, ends_at, capacity, status, "
            "users:host_user_id(id, name, status, "
            "maker_profiles(company_name, prefecture, city))"
        )
        .eq("status", "published")
    )

    if upcoming_only:
        query = query.gte("starts_at", "now()")

    # range は inclusive (Supabase / PostgREST)
    end = offset + limit - 1
    res = query.order("starts_at", desc=False).range(offset, end).execute()

    rows = res.data or []

    # host status post-filter (ADR-0009)
    eligible: list[dict] = []
    for r in rows:
        host_row = _coerce_one(r.get("users"))
        if not _host_status_active(host_row):
            continue
        eligible.append(r)

    # active_registration_count を bulk で集計
    event_ids = [r["id"] for r in eligible]
    counts = _count_active_registrations_bulk(admin, event_ids)

    items: list[EventListItem] = []
    for r in eligible:
        host_row = _coerce_one(r.get("users"))
        host = _build_host(host_row, r["host_type"])
        if host is None:
            # 念のため: host が join できなかった行はスキップ
            continue
        items.append(
            EventListItem(
                id=r["id"],
                title=r["title"],
                host=host,
                starts_at=r["starts_at"],
                ends_at=r["ends_at"],
                venue=r.get("venue"),
                online_url=r.get("online_url"),
                capacity=r.get("capacity"),
                status=r["status"],
                active_registration_count=counts.get(r["id"], 0),
            )
        )
    return EventListResponse(events=items)


# ---- GET /v1/events/{event_id} ---------------------------------------------


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(event_id: UUID) -> EventDetailResponse:
    """公開 events 詳細 (SPEC §5.1)。

    status='published' かつ host status='active' のみ 200。
    それ以外は 404 (host 本人の draft 取得は /v1/maker/events/{id} を使う、
    Sprint 2 で実装)。
    """
    admin = get_supabase_admin()

    res = (
        admin.table("events")
        .select(
            "id, host_user_id, host_type, title, body, venue, online_url, "
            "starts_at, ends_at, capacity, status, "
            "users:host_user_id(id, name, status, "
            "maker_profiles(company_name, prefecture, city))"
        )
        .eq("id", str(event_id))
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise HTTPException(
            status_code=404,
            detail={"detail": "event_not_found", "code": "event_not_found"},
        )

    row = rows[0]
    if row.get("status") != "published":
        raise HTTPException(
            status_code=404,
            detail={
                "detail": "event_not_published",
                "code": "event_not_published",
            },
        )

    host_row = _coerce_one(row.get("users"))
    if not _host_status_active(host_row):
        raise HTTPException(
            status_code=404,
            detail={"detail": "event_not_found", "code": "event_not_found"},
        )

    active_count = _count_active_registrations(admin, str(event_id))
    capacity = row.get("capacity")
    is_full = capacity is not None and active_count >= capacity

    host = _build_host(host_row, row["host_type"])
    # _build_host は host_row が空でない限り None を返さない (上で active 判定済)
    assert host is not None

    return EventDetailResponse(
        id=row["id"],
        title=row["title"],
        body=row["body"],
        host=host,
        venue=row.get("venue"),
        online_url=row.get("online_url"),
        starts_at=row["starts_at"],
        ends_at=row["ends_at"],
        capacity=capacity,
        status=row["status"],
        active_registration_count=active_count,
        is_full=is_full,
    )


# ---- POST /v1/events/{event_id}/register -----------------------------------


def _is_unique_violation(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "23505" in msg or "duplicate key" in msg or "unique" in msg


@router.post("/{event_id}/register", status_code=201)
async def register_event(
    event_id: UUID,
    user: dict = require_role(*REVIEWER_ROLES),
):
    """reviewer が event に申込む (SPEC §5.1)。

    - role guard: require_role(farmer / ja_staff / researcher) で 403
      register_role_forbidden 相当 (FastAPI 既定の 403 detail を使用)
    - event 存在 + status='published' 確認 → 404
    - capacity 設定済かつ active_count >= capacity → 409 event_full
    - UNIQUE(event_id, user_id) 違反 → 409 already_registered
      (cancel 後の再申込もここで 409 になる、§10.6 v1 許容)
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    # 1. event 存在 + published 確認
    ev_res = (
        admin.table("events")
        .select("id, status, capacity")
        .eq("id", str(event_id))
        .limit(1)
        .execute()
    )
    if not ev_res.data:
        raise HTTPException(
            status_code=404,
            detail={"detail": "event_not_found", "code": "event_not_found"},
        )
    event = ev_res.data[0]
    if event.get("status") != "published":
        raise HTTPException(
            status_code=404,
            detail={
                "detail": "event_not_published",
                "code": "event_not_published",
            },
        )

    # 2. capacity チェック (race 許容、§10.5)
    capacity = event.get("capacity")
    if capacity is not None:
        active_count = _count_active_registrations(admin, str(event_id))
        if active_count >= capacity:
            raise HTTPException(
                status_code=409,
                detail={"detail": "event_full", "code": "event_full"},
            )

    # 3. INSERT。UNIQUE 違反は 409 already_registered
    try:
        ins = (
            admin.table("event_registrations")
            .insert(
                {
                    "event_id": str(event_id),
                    "user_id": user_id,
                }
            )
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        if _is_unique_violation(exc):
            raise HTTPException(
                status_code=409,
                detail={
                    "detail": "already_registered",
                    "code": "already_registered",
                },
            ) from exc
        logger.exception(
            "failed to register event=%s user=%s", event_id, user_id
        )
        raise HTTPException(
            status_code=500,
            detail={
                "detail": "failed_to_register",
                "code": "failed_to_register",
            },
        ) from exc

    if not ins.data:
        raise HTTPException(
            status_code=500,
            detail={
                "detail": "failed_to_register",
                "code": "failed_to_register",
            },
        )

    return {"ok": True, "registration_id": ins.data[0]["id"]}


# ---- DELETE /v1/events/{event_id}/register ---------------------------------


@router.delete("/{event_id}/register", status_code=204)
async def cancel_registration(
    event_id: UUID,
    user: dict = require_role(*REVIEWER_ROLES),
):
    """自分の申込を cancel (SPEC §5.1)。

    物理削除せず cancelled_at = UTC now を立てる (履歴保持、§5.1)。
    - 該当行なし or 既に cancelled → 404 not_registered
    - 他人の申込は所有者でないため SELECT で見えず 404
      (RLS 第二防御も同じ動作になる)
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    res = (
        admin.table("event_registrations")
        .select("id, cancelled_at")
        .eq("event_id", str(event_id))
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(
            status_code=404,
            detail={"detail": "not_registered", "code": "not_registered"},
        )
    row = res.data[0]
    if row.get("cancelled_at") is not None:
        raise HTTPException(
            status_code=404,
            detail={"detail": "not_registered", "code": "not_registered"},
        )

    try:
        # PostgREST 経由の UPDATE では "now()" 文字列は SQL 関数として展開されず
        # timestamptz の不正入力になるため、Python 側で確定値を生成する。
        cancelled_at_iso = datetime.now(timezone.utc).isoformat()
        admin.table("event_registrations").update(
            {"cancelled_at": cancelled_at_iso}
        ).eq("id", row["id"]).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "failed to cancel registration id=%s user=%s", row["id"], user_id
        )
        raise HTTPException(
            status_code=500,
            detail={"detail": "failed_to_cancel", "code": "failed_to_cancel"},
        ) from exc

    return Response(status_code=204)

"""Events v1 — maker CRUD + 申込者一覧 (Sprint 2).

spec: docs/specs/events-v1.md §5.2 + §9 Sprint 2
ADR-0010: 講演会機能 v1 採用

Sprint 2 範囲:
- GET    /v1/maker/events                       自社 events 一覧 (全 status)
- POST   /v1/maker/events                       作成 (status='draft' default)
- GET    /v1/maker/events/{id}                  自社 event 詳細 (status 問わず)
- PATCH  /v1/maker/events/{id}                  部分更新
- DELETE /v1/maker/events/{id}                  soft delete (status='cancelled')
- GET    /v1/maker/events/{id}/registrations    申込者一覧 (cancelled 含む選択可)

設計要点:
- 全 endpoint で require_role("maker") を第一防御、host_user_id=JWT.sub を SQL eq で強制
  (RLS は第二防御、SPEC §3.2 / §10.9 アンチパターン #6)
- DELETE は物理削除しない (status='cancelled' で履歴保持、SPEC §1.1)
- PATCH の venue/online_url 片方必須は「両方 NULL になる payload を拒否」で実装
- ends_at > starts_at は POST / PATCH 双方で検査
- 申込者の display_name は users.name へフォールバック
  (farmer_profiles 等の表示名は別 SPEC 領域、SPEC §5.2.3)
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import (
    MakerEventCreateRequest,
    MakerEventDetailResponse,
    MakerEventListItem,
    MakerEventListResponse,
    MakerEventRegistration,
    MakerEventRegistrationsResponse,
    MakerEventUpdateRequest,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_STATUS_FILTERS: tuple[str, ...] = (
    "all",
    "draft",
    "published",
    "cancelled",
)


# ---- error helpers ----------------------------------------------------------


def _http_error(status: int, code: str) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail={"detail": code, "code": code},
    )


# ---- helpers ----------------------------------------------------------------


def _count_active_registrations_bulk(
    admin: Any, event_ids: list[str]
) -> dict[str, int]:
    """複数 event_id の cancelled_at IS NULL 申込件数を 1 query で集計。"""
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


def _count_active_registrations(admin: Any, event_id: str) -> int:
    res = (
        admin.table("event_registrations")
        .select("id", count="exact")
        .eq("event_id", event_id)
        .is_("cancelled_at", "null")
        .execute()
    )
    return res.count or 0


def _fetch_owned_event(admin: Any, event_id: str, maker_id: str) -> dict | None:
    """指定 event を host_user_id=maker_id 限定で取得。

    SPEC §5.2.2: 他社 event は 403 (event_not_owner)、存在しないものは 404
    (event_not_found)。本ヘルパは「自分の event」のみを返し、None の場合は
    呼び出し側で 404 と 403 を区別する必要があるため別ヘルパを使うこと。
    """
    res = (
        admin.table("events")
        .select("*")
        .eq("id", event_id)
        .eq("host_user_id", maker_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def _classify_missing_event(
    admin: Any, event_id: str, maker_id: str
) -> HTTPException:
    """`_fetch_owned_event` が None を返した場合に 404 / 403 を判別。

    まず host_user_id 制約なしで存在確認 → 存在しなければ 404、
    存在するが他人 host なら 403。
    """
    res = (
        admin.table("events")
        .select("host_user_id")
        .eq("id", event_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return _http_error(404, "event_not_found")
    return _http_error(403, "event_not_owner")


def _validate_starts_before_ends(
    starts_at: datetime, ends_at: datetime
) -> None:
    if ends_at <= starts_at:
        raise _http_error(422, "validation_failed")


def _validate_venue_or_online_required(
    venue: str | None, online_url: str | None
) -> None:
    """venue と online_url が両方 NULL は不許可 (SPEC §5.2.2)。"""
    if not venue and not online_url:
        raise _http_error(422, "validation_failed")


def _row_to_detail(row: dict, active_count: int) -> MakerEventDetailResponse:
    return MakerEventDetailResponse(
        id=row["id"],
        title=row["title"],
        body=row["body"],
        host_user_id=row["host_user_id"],
        host_type=row["host_type"],
        venue=row.get("venue"),
        online_url=row.get("online_url"),
        starts_at=row["starts_at"],
        ends_at=row["ends_at"],
        capacity=row.get("capacity"),
        status=row["status"],
        active_registration_count=active_count,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


# ---- GET /v1/maker/events ---------------------------------------------------


@router.get("", response_model=MakerEventListResponse)
async def list_maker_events(
    status: str = Query(default="all"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: dict = require_role("maker"),
) -> MakerEventListResponse:
    """自分主催の events 一覧 (SPEC §5.2.1)。

    - role guard: maker 限定 (403)
    - host_user_id = JWT.sub の SQL eq で限定 (RLS は第二防御)
    - status クエリ: all / draft / published / cancelled
    - 並び順: created_at DESC
    """
    if status not in ALLOWED_STATUS_FILTERS:
        raise _http_error(422, "validation_failed")

    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    query = (
        admin.table("events")
        .select(
            "id, title, starts_at, ends_at, venue, online_url, capacity, "
            "status, created_at"
        )
        .eq("host_user_id", maker_id)
    )
    if status != "all":
        query = query.eq("status", status)

    end = offset + limit - 1
    res = query.order("created_at", desc=True).range(offset, end).execute()

    rows = res.data or []
    event_ids = [r["id"] for r in rows]
    counts = _count_active_registrations_bulk(admin, event_ids)

    items: list[MakerEventListItem] = []
    for r in rows:
        items.append(
            MakerEventListItem(
                id=r["id"],
                title=r["title"],
                starts_at=r["starts_at"],
                ends_at=r["ends_at"],
                venue=r.get("venue"),
                online_url=r.get("online_url"),
                capacity=r.get("capacity"),
                status=r["status"],
                active_registration_count=counts.get(r["id"], 0),
                created_at=r["created_at"],
            )
        )
    return MakerEventListResponse(events=items)


# ---- POST /v1/maker/events --------------------------------------------------


@router.post("", status_code=201)
async def create_maker_event(
    payload: MakerEventCreateRequest,
    user: dict = require_role("maker"),
):
    """新規 event を作成 (SPEC §5.2.2)。

    - host_user_id = JWT.sub / host_type='maker' を強制
    - ends_at > starts_at / venue or online_url 必須を BFF で検証
    - 公開遷移 (status='published') 時は starts_at >= now() を強制
    """
    _validate_starts_before_ends(payload.starts_at, payload.ends_at)
    _validate_venue_or_online_required(payload.venue, payload.online_url)

    if payload.status == "published":
        now = datetime.now(timezone.utc)
        if payload.starts_at < now:
            raise _http_error(422, "validation_failed")

    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    insert_payload: dict[str, Any] = {
        "host_user_id": maker_id,
        "host_type": "maker",
        "title": payload.title,
        "body": payload.body,
        "venue": payload.venue,
        "online_url": payload.online_url,
        "starts_at": payload.starts_at.isoformat(),
        "ends_at": payload.ends_at.isoformat(),
        "capacity": payload.capacity,
        "status": payload.status,
    }

    try:
        res = admin.table("events").insert(insert_payload).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to create maker event: %s", exc)
        raise _http_error(500, "failed_to_create_event") from exc

    if not res.data:
        raise _http_error(500, "failed_to_create_event")

    return {"ok": True, "id": res.data[0]["id"]}


# ---- GET /v1/maker/events/{event_id} ---------------------------------------


@router.get("/{event_id}", response_model=MakerEventDetailResponse)
async def get_maker_event(
    event_id: UUID,
    user: dict = require_role("maker"),
) -> MakerEventDetailResponse:
    """自社 event の詳細 (SPEC §5.2.2)。

    status='draft' / 'cancelled' も取得可 (host 限定の private 取得)。
    他社 event は 403 event_not_owner、存在しないものは 404 event_not_found。
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    row = _fetch_owned_event(admin, str(event_id), maker_id)
    if row is None:
        raise _classify_missing_event(admin, str(event_id), maker_id)

    active_count = _count_active_registrations(admin, str(event_id))
    return _row_to_detail(row, active_count)


# ---- PATCH /v1/maker/events/{event_id} -------------------------------------


@router.patch("/{event_id}")
async def update_maker_event(
    event_id: UUID,
    payload: MakerEventUpdateRequest,
    user: dict = require_role("maker"),
):
    """自社 event の部分更新 (SPEC §5.2.2)。

    Pydantic v2 の model_dump(exclude_unset=True) で「指定されたフィールドのみ」を
    UPDATE 対象にする (未指定フィールドは保持)。venue/online_url 両方 NULL に
    なるような更新は 422、ends_at <= starts_at も 422。status='published' に
    遷移する場合は (更新後の) starts_at >= now() を要求。

    SPEC 11.1 状態遷移: draft↔published / published→cancelled / cancelled→
    published のいずれも v1 では BFF 側で制限せず、status CHECK 制約に従う
    (Ryoga 判断: 取消した event を再公開可能とする運用、§9 末尾)。
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    current = _fetch_owned_event(admin, str(event_id), maker_id)
    if current is None:
        raise _classify_missing_event(admin, str(event_id), maker_id)

    diff = payload.model_dump(exclude_unset=True)
    if not diff:
        # 何も更新しない PATCH は 200 で no-op とする (Idempotent)
        active_count = _count_active_registrations(admin, str(event_id))
        return {"ok": True, "id": str(event_id), "active_registration_count": active_count}

    merged = {**current, **diff}

    # datetime のシリアライズ正規化
    starts_at = merged["starts_at"]
    ends_at = merged["ends_at"]
    if isinstance(starts_at, str):
        starts_at_dt = datetime.fromisoformat(starts_at.replace("Z", "+00:00"))
    else:
        starts_at_dt = starts_at
    if isinstance(ends_at, str):
        ends_at_dt = datetime.fromisoformat(ends_at.replace("Z", "+00:00"))
    else:
        ends_at_dt = ends_at
    _validate_starts_before_ends(starts_at_dt, ends_at_dt)

    _validate_venue_or_online_required(merged.get("venue"), merged.get("online_url"))

    new_status = merged.get("status")
    if new_status == "published" and current.get("status") != "published":
        now = datetime.now(timezone.utc)
        if starts_at_dt < now:
            raise _http_error(422, "validation_failed")

    # PATCH ペイロードを Supabase に渡す形に整形 (datetime → isoformat)
    update_payload: dict[str, Any] = {}
    for k, v in diff.items():
        if isinstance(v, datetime):
            update_payload[k] = v.isoformat()
        else:
            update_payload[k] = v

    try:
        admin.table("events").update(update_payload).eq("id", str(event_id)).eq(
            "host_user_id", maker_id
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to update maker event %s: %s", event_id, exc)
        raise _http_error(500, "failed_to_update_event") from exc

    return {"ok": True, "id": str(event_id)}


# ---- DELETE /v1/maker/events/{event_id} ------------------------------------


@router.delete("/{event_id}")
async def cancel_maker_event(
    event_id: UUID,
    user: dict = require_role("maker"),
):
    """自社 event を soft delete = status='cancelled' に遷移 (SPEC §5.2.2)。

    物理削除しない (履歴保持、SPEC §1.1)。既に cancelled な event を再度
    DELETE しても 200 で冪等 (no-op 扱い、Idempotent)。
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    current = _fetch_owned_event(admin, str(event_id), maker_id)
    if current is None:
        raise _classify_missing_event(admin, str(event_id), maker_id)

    if current.get("status") == "cancelled":
        return {"ok": True, "id": str(event_id), "status": "cancelled"}

    try:
        admin.table("events").update({"status": "cancelled"}).eq(
            "id", str(event_id)
        ).eq("host_user_id", maker_id).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to cancel maker event %s: %s", event_id, exc)
        raise _http_error(500, "failed_to_cancel_event") from exc

    return {"ok": True, "id": str(event_id), "status": "cancelled"}


# ---- GET /v1/maker/events/{event_id}/registrations -------------------------


def _coerce_one(rel: dict | list | None) -> dict:
    if isinstance(rel, list):
        return rel[0] if rel else {}
    if isinstance(rel, dict):
        return rel
    return {}


@router.get(
    "/{event_id}/registrations",
    response_model=MakerEventRegistrationsResponse,
)
async def list_event_registrations(
    event_id: UUID,
    include_cancelled: bool = Query(default=False),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    user: dict = require_role("maker"),
) -> MakerEventRegistrationsResponse:
    """自社 event の申込者一覧 (SPEC §5.2.3)。

    - 自社 event のみ (他社は 403、存在しないものは 404)
    - include_cancelled=true で cancelled_at IS NOT NULL の行も含める
    - response には active_count / cancelled_count を別々に同梱 (UI 表示用)
    - 並び順: registered_at DESC
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    owned = _fetch_owned_event(admin, str(event_id), maker_id)
    if owned is None:
        raise _classify_missing_event(admin, str(event_id), maker_id)

    select_cols = (
        "id, user_id, registered_at, cancelled_at, "
        "users:user_id(id, name, role)"
    )
    query = (
        admin.table("event_registrations")
        .select(select_cols)
        .eq("event_id", str(event_id))
    )
    if not include_cancelled:
        query = query.is_("cancelled_at", "null")

    end = offset + limit - 1
    res = query.order("registered_at", desc=True).range(offset, end).execute()
    rows = res.data or []

    # active / cancelled 件数は全件集計 (limit/offset とは独立、UI の総数表示用)
    counts = (
        admin.table("event_registrations")
        .select("cancelled_at")
        .eq("event_id", str(event_id))
        .execute()
    )
    active_count = 0
    cancelled_count = 0
    for r in counts.data or []:
        if r.get("cancelled_at") is None:
            active_count += 1
        else:
            cancelled_count += 1

    items: list[MakerEventRegistration] = []
    for r in rows:
        u = _coerce_one(r.get("users"))
        items.append(
            MakerEventRegistration(
                id=r["id"],
                user_id=r["user_id"],
                display_name=u.get("name"),
                role=u.get("role", "unassigned"),
                registered_at=r["registered_at"],
                cancelled_at=r.get("cancelled_at"),
            )
        )

    return MakerEventRegistrationsResponse(
        registrations=items,
        active_count=active_count,
        cancelled_count=cancelled_count,
    )

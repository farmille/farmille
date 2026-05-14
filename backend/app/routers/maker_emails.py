"""Events v1 — maker email campaigns CRUD + queue 遷移 (Sprint 3).

spec: docs/specs/events-v1.md §5.3 / §9 Sprint 3
ADR-0010: 講演会機能 v1 採用 / ADR-0011: 実送信は別 SPEC

Sprint 3 範囲:
- GET    /v1/maker/emails/campaigns                自社一覧
- POST   /v1/maker/emails/campaigns                作成 (status='draft' 固定)
- GET    /v1/maker/emails/campaigns/{id}           詳細
- PATCH  /v1/maker/emails/campaigns/{id}           draft のみ編集可
- DELETE /v1/maker/emails/campaigns/{id}           draft のみ hard delete
- POST   /v1/maker/emails/campaigns/{id}/send      pre-flight + queue 遷移
                                                   (実送信は別 SPEC)

設計要点:
- 全 endpoint で require_role("maker") を第一防御、maker_user_id=JWT.sub を
  SQL eq で強制 (RLS は第二防御、SPEC §10.9 アンチパターン #6)
- segment_filter は Pydantic discriminated union で型検証
  (SPEC §10.9 アンチパターン #2「JSONB 濫用」回避)
- send pre-flight:
  - favorite_followers: user_favorites.kind='favorite' のみ (Ryoga C6)
  - event_past_attendees: 自社主催 event のみ受理 (Ryoga C9)
  - specific_users: 最大 1000 件 (Ryoga C10、Pydantic 側で検証)
  - recipient 0 件は 422 で拒否 (Ryoga C7)
- 実送信は本 SPEC 範囲外: status='queued' に止め、queued_at を記録
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
    CampaignStatus,
    MakerEmailCampaignCreatePayload,
    MakerEmailCampaignDetailResponse,
    MakerEmailCampaignListItem,
    MakerEmailCampaignListResponse,
    MakerEmailCampaignSendResponse,
    MakerEmailCampaignUpdatePayload,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()


ALLOWED_STATUS_FILTERS: tuple[str, ...] = (
    "all",
    "draft",
    "queued",
    "sent",
    "failed",
)


# ---- error helpers ----------------------------------------------------------


def _http_error(status: int, code: str) -> HTTPException:
    return HTTPException(
        status_code=status,
        detail={"detail": code, "code": code},
    )


# ---- fetch helpers ----------------------------------------------------------


def _fetch_owned_campaign(
    admin: Any, campaign_id: str, maker_id: str
) -> dict | None:
    """maker_user_id=maker_id 限定で取得。自社のみ。"""
    res = (
        admin.table("maker_email_campaigns")
        .select("*")
        .eq("id", campaign_id)
        .eq("maker_user_id", maker_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return rows[0] if rows else None


def _classify_missing_campaign(
    admin: Any, campaign_id: str, _maker_id: str
) -> HTTPException:
    """`_fetch_owned_campaign` が None を返した場合に 404 / 403 を判別。"""
    res = (
        admin.table("maker_email_campaigns")
        .select("maker_user_id")
        .eq("id", campaign_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return _http_error(404, "campaign_not_found")
    return _http_error(403, "campaign_not_owner")


# ---- recipient computation (SPEC §4.6) -------------------------------------


def _compute_favorite_followers(
    admin: Any, maker_id: str
) -> set[str]:
    """自社製品を kind='favorite' で持つ reviewer の DISTINCT user_id 集合。

    Ryoga C6: kind='candidate' は除外。
    自社製品 = products.maker_id == maker_id。
    """
    # 1) 自社製品 id 一覧 (1 query)
    prod_res = (
        admin.table("products")
        .select("id")
        .eq("maker_id", maker_id)
        .execute()
    )
    product_ids = [r["id"] for r in (prod_res.data or [])]
    if not product_ids:
        return set()

    # 2) 当該 product を kind='favorite' で持つ user_favorites (1 query, IN bulk)
    fav_res = (
        admin.table("user_favorites")
        .select("user_id")
        .in_("product_id", product_ids)
        .eq("kind", "favorite")
        .execute()
    )
    return {r["user_id"] for r in (fav_res.data or []) if r.get("user_id")}


def _compute_event_past_attendees(
    admin: Any, maker_id: str, event_id: str
) -> set[str]:
    """指定 event の cancelled_at IS NULL 申込者集合。

    Ryoga C9: 指定 event は **自社主催** であることを必ず検証。
    他社 event 指定や存在しない event は呼び出し側で例外を投げる。
    """
    # 自社主催 event か検証 (1 query)
    ev_res = (
        admin.table("events")
        .select("id, host_user_id")
        .eq("id", event_id)
        .limit(1)
        .execute()
    )
    rows = ev_res.data or []
    if not rows:
        raise _http_error(422, "invalid_segment_filter")
    if rows[0].get("host_user_id") != maker_id:
        raise _http_error(403, "event_not_owner")

    # 申込者集合 (1 query)
    reg_res = (
        admin.table("event_registrations")
        .select("user_id")
        .eq("event_id", event_id)
        .is_("cancelled_at", "null")
        .execute()
    )
    return {r["user_id"] for r in (reg_res.data or []) if r.get("user_id")}


def _compute_specific_users(user_ids: list[str]) -> set[str]:
    """specific_users segment は input をそのまま集合に。

    Pydantic 側で 1<=len<=1000 を保証済 (Ryoga C10)。
    v1 では「自社の何らかの touchpoint があるか」までは検証しない (SPEC §5.3.4)。
    """
    return {str(u) for u in user_ids}


# ---- list_to_item helper ----------------------------------------------------


def _row_to_list_item(row: dict) -> MakerEmailCampaignListItem:
    return MakerEmailCampaignListItem(
        id=row["id"],
        subject=row["subject"],
        segment_type=row["segment_type"],
        status=row["status"],
        recipient_count=row.get("recipient_count", 0),
        created_at=row["created_at"],
        queued_at=row.get("queued_at"),
        sent_at=row.get("sent_at"),
    )


def _row_to_detail(row: dict) -> MakerEmailCampaignDetailResponse:
    return MakerEmailCampaignDetailResponse(
        id=row["id"],
        maker_user_id=row["maker_user_id"],
        subject=row["subject"],
        body=row["body"],
        segment_type=row["segment_type"],
        segment_filter=row.get("segment_filter") or {},
        status=row["status"],
        recipient_count=row.get("recipient_count", 0),
        queued_at=row.get("queued_at"),
        sent_at=row.get("sent_at"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


# ---- GET /v1/maker/emails/campaigns ----------------------------------------


@router.get("/campaigns", response_model=MakerEmailCampaignListResponse)
async def list_campaigns(
    status: str = Query(default="all"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: dict = require_role("maker"),
) -> MakerEmailCampaignListResponse:
    """自社 campaign 一覧 (SPEC §5.3.1)。

    並び順: created_at DESC。
    """
    if status not in ALLOWED_STATUS_FILTERS:
        raise _http_error(422, "validation_failed")

    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    query = (
        admin.table("maker_email_campaigns")
        .select(
            "id, subject, segment_type, status, recipient_count, "
            "created_at, queued_at, sent_at"
        )
        .eq("maker_user_id", maker_id)
    )
    if status != "all":
        query = query.eq("status", status)

    end = offset + limit - 1
    res = query.order("created_at", desc=True).range(offset, end).execute()

    items = [_row_to_list_item(r) for r in (res.data or [])]
    return MakerEmailCampaignListResponse(campaigns=items)


# ---- POST /v1/maker/emails/campaigns ---------------------------------------


def _validate_filter_matches_type(payload: MakerEmailCampaignCreatePayload) -> None:
    """segment_type と segment_filter.segment_type の一致を BFF で二重確認。

    Pydantic discriminator も同じ検査をしているが、明示的にエラー code を
    `invalid_segment_filter` で返すために再検証する (SPEC §3.3 統一エラー)。
    """
    if payload.segment_type != payload.segment_filter.segment_type:
        raise _http_error(422, "invalid_segment_filter")


@router.post("/campaigns", status_code=201)
async def create_campaign(
    payload: MakerEmailCampaignCreatePayload,
    user: dict = require_role("maker"),
):
    """新規 campaign を draft で作成 (SPEC §5.3.2)。

    - maker_user_id = JWT.sub 強制
    - status は 'draft' 固定 (payload 受け付けない)
    - segment_filter の構造は Pydantic discriminator で検証済
    """
    _validate_filter_matches_type(payload)

    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    insert_payload: dict[str, Any] = {
        "maker_user_id": maker_id,
        "subject": payload.subject,
        "body": payload.body,
        "segment_type": payload.segment_type,
        "segment_filter": payload.segment_filter.model_dump(mode="json"),
        "status": "draft",
        "recipient_count": 0,
    }

    try:
        res = (
            admin.table("maker_email_campaigns")
            .insert(insert_payload)
            .execute()
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to create maker email campaign")
        raise _http_error(500, "failed_to_create_campaign") from exc

    if not res.data:
        raise _http_error(500, "failed_to_create_campaign")

    return {"ok": True, "id": res.data[0]["id"]}


# ---- GET /v1/maker/emails/campaigns/{id} -----------------------------------


@router.get(
    "/campaigns/{campaign_id}",
    response_model=MakerEmailCampaignDetailResponse,
)
async def get_campaign(
    campaign_id: UUID,
    user: dict = require_role("maker"),
) -> MakerEmailCampaignDetailResponse:
    """自社 campaign 詳細 (SPEC §5.3)。"""
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    row = _fetch_owned_campaign(admin, str(campaign_id), maker_id)
    if row is None:
        raise _classify_missing_campaign(admin, str(campaign_id), maker_id)

    return _row_to_detail(row)


# ---- PATCH /v1/maker/emails/campaigns/{id} ---------------------------------


@router.patch("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: UUID,
    payload: MakerEmailCampaignUpdatePayload,
    user: dict = require_role("maker"),
):
    """自社 campaign の部分更新 (SPEC §5.3.3)。

    status='draft' のみ編集可。queued / sent / failed は 409 で拒否。
    segment_type と segment_filter のどちらかだけを更新する場合は両者の
    discriminator 一致を BFF で検証 (Pydantic でも基本的に検査される)。
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    current = _fetch_owned_campaign(admin, str(campaign_id), maker_id)
    if current is None:
        raise _classify_missing_campaign(admin, str(campaign_id), maker_id)

    if current.get("status") != "draft":
        raise _http_error(409, "campaign_already_queued")

    diff = payload.model_dump(exclude_unset=True)
    if not diff:
        return {"ok": True, "id": str(campaign_id)}

    # segment_type / segment_filter の discriminator 整合性検査
    new_segment_type = diff.get("segment_type") or current.get("segment_type")
    new_filter_obj = payload.segment_filter
    if new_filter_obj is not None:
        if new_filter_obj.segment_type != new_segment_type:
            raise _http_error(422, "invalid_segment_filter")
        diff["segment_filter"] = new_filter_obj.model_dump(mode="json")

    try:
        admin.table("maker_email_campaigns").update(diff).eq(
            "id", str(campaign_id)
        ).eq("maker_user_id", maker_id).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to update campaign %s", campaign_id)
        raise _http_error(500, "failed_to_update_campaign") from exc

    return {"ok": True, "id": str(campaign_id)}


# ---- DELETE /v1/maker/emails/campaigns/{id} --------------------------------


@router.delete("/campaigns/{campaign_id}", status_code=204)
async def delete_campaign(
    campaign_id: UUID,
    user: dict = require_role("maker"),
):
    """自社 campaign を hard delete (SPEC §5.3.3、generator 判断)。

    draft のみ削除可。queued / sent / failed は履歴として保持。
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    current = _fetch_owned_campaign(admin, str(campaign_id), maker_id)
    if current is None:
        raise _classify_missing_campaign(admin, str(campaign_id), maker_id)

    if current.get("status") != "draft":
        raise _http_error(409, "campaign_already_queued")

    try:
        admin.table("maker_email_campaigns").delete().eq(
            "id", str(campaign_id)
        ).eq("maker_user_id", maker_id).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to delete campaign %s", campaign_id)
        raise _http_error(500, "failed_to_delete_campaign") from exc

    return Response(status_code=204)


# ---- POST /v1/maker/emails/campaigns/{id}/send -----------------------------


@router.post(
    "/campaigns/{campaign_id}/send",
    response_model=MakerEmailCampaignSendResponse,
)
async def send_campaign(
    campaign_id: UUID,
    user: dict = require_role("maker"),
) -> MakerEmailCampaignSendResponse:
    """pre-flight 検証 → status='queued' 遷移 (SPEC §5.3.4)。

    実送信はしない (ADR-0011 / 別 SPEC)。
    1. status='draft' を要求 (他は 409 campaign_already_queued)
    2. segment_type に応じて recipient 集合を計算
       - favorite_followers (Ryoga C6: kind='favorite' のみ)
       - event_past_attendees (Ryoga C9: 自社主催のみ)
       - specific_users (Ryoga C10: <=1000 件、Pydantic で保証済)
    3. recipient 0 件 → 422 (Ryoga C7)
    4. recipient_count を確定 + status='queued' + queued_at に UPDATE
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    current = _fetch_owned_campaign(admin, str(campaign_id), maker_id)
    if current is None:
        raise _classify_missing_campaign(admin, str(campaign_id), maker_id)

    if current.get("status") != "draft":
        raise _http_error(409, "campaign_already_queued")

    segment_type = current.get("segment_type")
    segment_filter = current.get("segment_filter") or {}

    recipients: set[str]
    if segment_type == "favorite_followers":
        recipients = _compute_favorite_followers(admin, maker_id)
    elif segment_type == "event_past_attendees":
        event_id = segment_filter.get("event_id")
        if not event_id:
            raise _http_error(422, "invalid_segment_filter")
        recipients = _compute_event_past_attendees(
            admin, maker_id, str(event_id)
        )
    elif segment_type == "specific_users":
        user_ids = segment_filter.get("user_ids") or []
        if not isinstance(user_ids, list) or not user_ids:
            raise _http_error(422, "invalid_segment_filter")
        if len(user_ids) > 1000:
            raise _http_error(422, "invalid_segment_filter")
        recipients = _compute_specific_users(user_ids)
    else:
        # CHECK 制約があるので原則到達しないが防御。
        raise _http_error(422, "invalid_segment_type")

    recipient_count = len(recipients)
    if recipient_count == 0:
        raise _http_error(422, "no_recipients")

    queued_at_iso = datetime.now(timezone.utc).isoformat()
    new_status: CampaignStatus = "queued"

    try:
        admin.table("maker_email_campaigns").update(
            {
                "status": new_status,
                "recipient_count": recipient_count,
                "queued_at": queued_at_iso,
            }
        ).eq("id", str(campaign_id)).eq(
            "maker_user_id", maker_id
        ).execute()
    except Exception as exc:  # noqa: BLE001
        logger.exception("failed to queue campaign %s", campaign_id)
        raise _http_error(500, "failed_to_queue_campaign") from exc

    return MakerEmailCampaignSendResponse(
        ok=True,
        status=new_status,
        recipient_count=recipient_count,
    )

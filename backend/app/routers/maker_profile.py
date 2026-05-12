"""Maker self-profile endpoints (Phase 17).

`GET /v1/maker/profile` and `PUT /v1/maker/profile` let an authenticated maker
read and update their own `maker_profiles` row. The user_id is taken from the
JWT (`auth.uid()`) — never from the payload — to defend against write-attack
attempts (spec §3, SKILL §3.2).

Onboarding (initial INSERT) lives in `/v1/onboarding/maker`. This router is
strictly self-edit and returns 404 `profile_not_found` if the row does not
exist (spec §5.4).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import (
    MakerProfileResponse,
    MakerProfileUpdatePayload,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/profile", response_model=MakerProfileResponse)
async def get_maker_profile(
    user: dict = require_role("maker"),
) -> MakerProfileResponse:
    """Return the calling maker's profile row."""
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    res = (
        admin.table("maker_profiles")
        .select("user_id, company_name, prefecture, city, note")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="profile_not_found")
    row = rows[0]
    return MakerProfileResponse(
        user_id=row["user_id"],
        company_name=row["company_name"],
        prefecture=row.get("prefecture"),
        city=row.get("city"),
        note=row.get("note"),
    )


@router.put("/profile")
async def update_maker_profile(
    payload: MakerProfileUpdatePayload,
    user: dict = require_role("maker"),
) -> dict:
    """Update the calling maker's profile row.

    Returns 404 `profile_not_found` if the row does not exist (onboarding
    incomplete). The frontend redirects such users back to `/onboarding/maker`
    (spec §6.3).
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    # Confirm the row exists before issuing UPDATE so we can return a precise
    # 404. supabase-py update returns the affected rows, but this two-step is
    # more explicit and consistent with `/v1/products/{id}` ownership probes.
    existing = (
        admin.table("maker_profiles")
        .select("user_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="profile_not_found")

    try:
        admin.table("maker_profiles").update(
            {
                "company_name": payload.company_name,
                "prefecture": payload.prefecture,
                "city": payload.city,
                "note": payload.note,
            }
        ).eq("user_id", user_id).execute()
    except Exception:
        logger.exception("failed to update maker profile for %s", user_id)
        raise HTTPException(
            status_code=500, detail="failed_to_update_maker_profile"
        )

    return {"ok": True}

"""Public manufacturer endpoints (Phase 17).

Exposes `/v1/manufacturers` and `/v1/manufacturers/{id}` for unauthenticated
viewers. The DB models a manufacturer as `users (role='maker')` joined with
`maker_profiles`; we never create a `manufacturers` table (spec §10.1, DOA).

Service-role client is used to bypass RLS so the public list can render
without exposing the underlying RLS policy as the first line of defense
(spec §4.2 / §10.2). The BFF restricts which columns are returned.
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import (
    ManufacturerDetailResponse,
    ManufacturerListItem,
    ManufacturerListResponse,
    ManufacturerProduct,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()


def _profile_dict(maker_row: dict) -> dict[str, Any]:
    """Normalize Supabase 1:1 join (`maker_profiles`) which can come back as
    either a dict or a single-element list depending on the response shape."""
    raw = maker_row.get("maker_profiles")
    if isinstance(raw, list):
        return raw[0] if raw else {}
    if isinstance(raw, dict):
        return raw
    return {}


def _representative_image(images: list[dict] | None) -> str | None:
    if not images:
        return None
    sorted_images = sorted(images, key=lambda x: x.get("order", 0))
    return sorted_images[0].get("url")


@router.get("", response_model=ManufacturerListResponse)
async def list_manufacturers(
    limit: int = Query(default=100, ge=1, le=200),
) -> ManufacturerListResponse:
    """List public manufacturers, ordered by `users.created_at DESC`.

    Manufacturers without a populated `maker_profiles` row are excluded
    (treated as onboarding-incomplete and therefore not publishable).
    """
    admin = get_supabase_admin()

    # users + maker_profiles (inner join via Supabase nested select; rows where
    # maker_profiles is null are filtered out below).
    # ADR-0009: pending_review / rejected / frozen の maker は公開系で非表示。
    users_res = (
        admin.table("users")
        .select("id, created_at, maker_profiles(company_name, prefecture, city)")
        .eq("role", "maker")
        .eq("status", "active")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    rows = users_res.data or []
    # Filter to those with a profile row.
    eligible: list[dict[str, Any]] = []
    for r in rows:
        profile = _profile_dict(r)
        if profile.get("company_name"):
            eligible.append({"row": r, "profile": profile})

    # Aggregate product counts in one query.
    counts: dict[str, int] = {}
    if eligible:
        ids = [item["row"]["id"] for item in eligible]
        prod_res = (
            admin.table("products").select("id, maker_id").in_("maker_id", ids).execute()
        )
        for p in prod_res.data or []:
            mid = p.get("maker_id")
            if mid:
                counts[mid] = counts.get(mid, 0) + 1

    items = [
        ManufacturerListItem(
            id=item["row"]["id"],
            company_name=item["profile"]["company_name"],
            prefecture=item["profile"].get("prefecture"),
            city=item["profile"].get("city"),
            product_count=counts.get(item["row"]["id"], 0),
        )
        for item in eligible
    ]
    return ManufacturerListResponse(manufacturers=items)


@router.get("/{manufacturer_id}", response_model=ManufacturerDetailResponse)
async def get_manufacturer(manufacturer_id: UUID) -> ManufacturerDetailResponse:
    """Return manufacturer detail + that manufacturer's product list.

    404 `manufacturer_not_found` is returned for: missing user, non-maker
    role, or missing `maker_profiles` row (no public profile to display).
    """
    admin = get_supabase_admin()

    user_res = (
        admin.table("users")
        .select("id, role, status, maker_profiles(company_name, prefecture, city, note)")
        .eq("id", str(manufacturer_id))
        .limit(1)
        .execute()
    )
    rows = user_res.data or []
    if not rows:
        raise HTTPException(status_code=404, detail="manufacturer_not_found")
    user_row = rows[0]
    if user_row.get("role") != "maker":
        raise HTTPException(status_code=404, detail="manufacturer_not_found")
    if user_row.get("status") != "active":
        raise HTTPException(status_code=404, detail="manufacturer_not_found")

    profile = _profile_dict(user_row)
    if not profile.get("company_name"):
        raise HTTPException(status_code=404, detail="manufacturer_not_found")

    prod_res = (
        admin.table("products")
        .select(
            'id, name, created_at, '
            'product_types(name), '
            'product_images(url, "order")'
        )
        .eq("maker_id", str(manufacturer_id))
        .order("created_at", desc=True)
        .execute()
    )

    products = []
    for row in prod_res.data or []:
        product_type = row.get("product_types") or {}
        type_name: str | None = None
        if isinstance(product_type, dict):
            type_name = product_type.get("name")
        elif isinstance(product_type, list) and product_type:
            type_name = product_type[0].get("name")
        products.append(
            ManufacturerProduct(
                id=row["id"],
                name=row["name"],
                type_name=type_name,
                image_url=_representative_image(row.get("product_images")),
                created_at=row["created_at"],
            )
        )

    return ManufacturerDetailResponse(
        id=user_row["id"],
        company_name=profile["company_name"],
        prefecture=profile.get("prefecture"),
        city=profile.get("city"),
        note=profile.get("note"),
        products=products,
    )

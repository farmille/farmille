"""Admin products BFF (spec docs/specs/admin-aglist-alignment-v2.md §3.1 / §3.2).

`/v1/admin/products/*` 配下は `require_role("admin")` で第一防御。`admin` ロールには
ADR-0012 §2.2 の AAL2 強制が適用されるため、未 enroll セッションは 401 で reject。
書き込みは Supabase service_role で RLS bypass (BFF が唯一の書き込み経路)。

提供エンドポイント:
- GET  /v1/admin/products              一覧 (検索 + filter + pagination)
- GET  /v1/admin/products/{id}         詳細 (編集プリフィル + recipes read-only)
- PUT  /v1/admin/products/{id}         編集 (基本フィールド + v1 必達 3 種 relation)

NOTE:
- v1 必達 relation は crops + certifications + benefits の 3 種のみ
  (spec admin-aglist-alignment-v2.md §1.0.2 / §3.2)。残り 5 relation の編集 UI は
  v1.5+ Follow-ups F-FU12 に push。
- 画像は外部 URL 直入力のみ (Storage upload は v1.5+ F-FU5)。
- F2 新規作成 / 削除は v1 アウト (F-FU7 / F-FU8)。
"""

from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.dependencies import require_role
from app.models.schemas import (
    AdminProductDetailResponse,
    AdminProductImageItem,
    AdminProductListItem,
    AdminProductListResponse,
    AdminProductRecipeItem,
    AdminProductRelationItem,
    AdminProductUpdatePayload,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()


def _maker_profile(row: dict[str, Any]) -> dict[str, Any]:
    """Supabase 1:1 join (`maker_profiles`) は dict / list どちらでも返り得る
    (既存 admin.py / products.py と同じ防御)。"""
    raw = row.get("maker_profiles")
    if isinstance(raw, list):
        return raw[0] if raw else {}
    if isinstance(raw, dict):
        return raw
    return {}


def _users_dict(row: dict[str, Any]) -> dict[str, Any]:
    raw = row.get("users")
    if isinstance(raw, list):
        return raw[0] if raw else {}
    if isinstance(raw, dict):
        return raw
    return {}


def _product_types_dict(row: dict[str, Any]) -> dict[str, Any]:
    raw = row.get("product_types")
    if isinstance(raw, list):
        return raw[0] if raw else {}
    if isinstance(raw, dict):
        return raw
    return {}


def _maker_display_name(users_row: dict[str, Any]) -> str | None:
    """maker_profiles.company_name 優先、無ければ users.name にフォールバック
    (spec §2.2 「`maker_profiles.brand_name`（無ければ `users.name`）」と整合。
    実 schema には `brand_name` 列が無く `company_name` のみ存在するため、
    実在カラムを使用する。Self-eval に明記)。"""
    profile = _maker_profile(users_row)
    return profile.get("company_name") or users_row.get("name")


def _primary_thumbnail(images: list[dict[str, Any]] | None) -> str | None:
    """product_images から is_primary=true → 無ければ order 最小 → 無ければ None。"""
    if not images:
        return None
    primary = [i for i in images if i.get("is_primary")]
    if primary:
        return primary[0].get("url")
    sorted_imgs = sorted(images, key=lambda x: x.get("order", 0))
    return sorted_imgs[0].get("url") if sorted_imgs else None


def _error(status_code: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"ok": False, "error": code})


# ─────────────────────────────────────────────────────────────────────
# GET /v1/admin/products   一覧 (spec §3.1)
# ─────────────────────────────────────────────────────────────────────


@router.get("", response_model=AdminProductListResponse)
async def list_admin_products(
    _user: dict = require_role("admin"),
    q: str | None = Query(default=None, description="name + product_name_jp の部分一致検索"),
    maker_id: UUID | None = Query(default=None),
    product_type_id: UUID | None = Query(default=None),
    commercial_status: str | None = Query(default=None),
    is_public: bool | None = Query(default=None),
    confidence: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
) -> AdminProductListResponse:
    """admin products 一覧 (spec admin-aglist-alignment-v2.md §3.1)。

    並び順: `(updated_at DESC, id DESC)` で安定化 (spec §3.1 / §4.2)。
    検索: name + product_name_jp の部分一致 (Supabase の `or` フィルタを使う)。
    フィルタ: maker_id / product_type_id / commercial_status / is_public / confidence
    pagination: server-side、 `?page=N&per_page=20`、 既定 20 件 / max 100 件。
    """
    admin = get_supabase_admin()

    select_cols = (
        "id, name, product_name_jp, maker_id, product_type_id, commercial_status, "
        "is_public, confidence, created_at, updated_at, "
        "users(name, status, maker_profiles(company_name)), "
        "product_types(id, name), "
        "product_images(url, \"order\", is_primary)"
    )
    query = admin.table("products").select(select_cols, count="exact")

    # フィルタ
    if maker_id is not None:
        query = query.eq("maker_id", str(maker_id))
    if product_type_id is not None:
        query = query.eq("product_type_id", str(product_type_id))
    if commercial_status:
        query = query.eq("commercial_status", commercial_status)
    if is_public is not None:
        query = query.eq("is_public", is_public)
    if confidence:
        query = query.eq("confidence", confidence)

    # 部分一致検索 (name + product_name_jp の OR)
    if q:
        # PostgREST の or() で ilike 連結。引数はカンマ区切り。
        # 引用符 escape は PostgREST 流儀: `,` を含む値は `"` で囲む。
        # name + product_name_jp 部分一致 (case-insensitive)
        like = q.replace(",", "")  # カンマ含む検索は v1 サポート外
        query = query.or_(
            f"name.ilike.%{like}%,product_name_jp.ilike.%{like}%"
        )

    # ソート (updated_at DESC, id DESC で安定化、spec §3.1)
    query = query.order("updated_at", desc=True).order("id", desc=True)

    # pagination (PostgREST .range(start, end) は inclusive)
    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end)

    res = query.execute()
    rows = res.data or []
    total = getattr(res, "count", None) or 0

    items: list[AdminProductListItem] = []
    for r in rows:
        users_row = _users_dict(r)
        ptype = _product_types_dict(r)
        items.append(
            AdminProductListItem(
                id=r["id"],
                name=r["name"],
                product_name_jp=r.get("product_name_jp"),
                maker_id=r.get("maker_id"),
                maker_name=_maker_display_name(users_row),
                product_type_id=ptype.get("id"),
                product_type_name=ptype.get("name"),
                commercial_status=r.get("commercial_status"),
                is_public=bool(r.get("is_public")),
                confidence=r.get("confidence"),
                thumbnail_url=_primary_thumbnail(r.get("product_images") or []),
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
        )

    return AdminProductListResponse(
        products=items, total=total, page=page, per_page=per_page
    )


# ─────────────────────────────────────────────────────────────────────
# GET /v1/admin/products/{id}   詳細 (spec §3.2 編集プリフィル + recipes 表示)
# ─────────────────────────────────────────────────────────────────────


@router.get("/{product_id}", response_model=AdminProductDetailResponse)
async def get_admin_product(
    product_id: UUID,
    _user: dict = require_role("admin"),
) -> AdminProductDetailResponse | JSONResponse:
    """admin products 詳細 (spec §3.2)。

    プリフィル用に基本フィールド + v1 必達 3 種 relation + 画像 + recipes を一括返却。
    recipes は同 fetch で `product_application_recipes` 全行を sort_order 昇順で返す
    (read-only テーブル表示用、F3 v1 必達)。

    既存 products.py の公開エンドポイントと違い、非 active メーカー所有 product でも
    admin は閲覧できる (運営観点で `pending_review` / `rejected` の resolution が必要)。
    """
    admin = get_supabase_admin()

    select_cols = (
        "id, name, product_name_jp, maker_id, product_type_id, commercial_status, "
        "is_public, general_purpose, primary_compound, mode_of_action, "
        "technology_action, disease_pest_info, expected_effects_official, "
        "expected_effects_farmille, usage_summary, precautions, storage_shelf_life, "
        "notes, confidence, fertilizer_registered, pesticide_registered, "
        "label_url, sds_url, created_at, updated_at, "
        "users(name, status, maker_profiles(company_name)), "
        "product_types(id, name), "
        "product_images(id, url, \"order\", source_page_url, alt_text, image_type, "
        "is_primary, rights_note, confidence), "
        "product_crops(crops(id, name)), "
        "product_certifications(certifications(id, name)), "
        "product_benefit_relations(product_benefits(id, category, name))"
    )
    res = (
        admin.table("products").select(select_cols).eq("id", str(product_id)).execute()
    )
    rows = res.data or []
    if not rows:
        return _error(404, "product_not_found")
    r = rows[0]

    users_row = _users_dict(r)
    ptype = _product_types_dict(r)

    # 関連 (v1 必達 3 種)
    crops_items: list[AdminProductRelationItem] = []
    for rel in r.get("product_crops") or []:
        c = rel.get("crops") or {}
        if c.get("id"):
            crops_items.append(AdminProductRelationItem(id=c["id"], name=c.get("name") or ""))

    certs_items: list[AdminProductRelationItem] = []
    for rel in r.get("product_certifications") or []:
        c = rel.get("certifications") or {}
        if c.get("id"):
            certs_items.append(AdminProductRelationItem(id=c["id"], name=c.get("name") or ""))

    benefits_items: list[AdminProductRelationItem] = []
    for rel in r.get("product_benefit_relations") or []:
        b = rel.get("product_benefits") or {}
        if b.get("id"):
            benefits_items.append(
                AdminProductRelationItem(
                    id=b["id"], name=b.get("name") or "", category=b.get("category")
                )
            )

    # 画像 (order 昇順)
    images_sorted = sorted(
        r.get("product_images") or [], key=lambda x: x.get("order", 0)
    )
    images_items: list[AdminProductImageItem] = []
    for img in images_sorted:
        if not img.get("id") or not img.get("url"):
            continue
        images_items.append(
            AdminProductImageItem(
                id=img["id"],
                url=img["url"],
                order=img.get("order", 0),
                source_page_url=img.get("source_page_url"),
                alt_text=img.get("alt_text"),
                image_type=img.get("image_type"),
                is_primary=bool(img.get("is_primary")),
                rights_note=img.get("rights_note"),
                confidence=img.get("confidence"),
            )
        )

    # recipes (別 fetch、sort_order 昇順)
    rec_res = (
        admin.table("product_application_recipes")
        .select(
            "id, crop_category, crop_name, cultivation_type, application_method, "
            "application_timing, growth_stage, dilution_rate, dose_raw_text, "
            "dose_amount, dose_unit, dose_basis, solution_amount, "
            "original_liquid_equivalent, max_dose_raw_text, max_dose_amount, "
            "max_dose_unit, usage_notes, precautions_specific, confidence, sort_order"
        )
        .eq("product_id", str(product_id))
        .order("sort_order", desc=False)
        .execute()
    )
    rec_rows = rec_res.data or []
    recipes_items: list[AdminProductRecipeItem] = []
    for rr in rec_rows:
        recipes_items.append(
            AdminProductRecipeItem(
                id=rr["id"],
                crop_category=rr.get("crop_category"),
                crop_name=rr.get("crop_name"),
                cultivation_type=rr.get("cultivation_type"),
                application_method=rr.get("application_method"),
                application_timing=rr.get("application_timing"),
                growth_stage=rr.get("growth_stage"),
                dilution_rate=rr.get("dilution_rate"),
                dose_raw_text=rr.get("dose_raw_text"),
                dose_amount=(
                    float(rr["dose_amount"]) if rr.get("dose_amount") is not None else None
                ),
                dose_unit=rr.get("dose_unit"),
                dose_basis=rr.get("dose_basis"),
                solution_amount=rr.get("solution_amount"),
                original_liquid_equivalent=rr.get("original_liquid_equivalent"),
                max_dose_raw_text=rr.get("max_dose_raw_text"),
                max_dose_amount=(
                    float(rr["max_dose_amount"])
                    if rr.get("max_dose_amount") is not None
                    else None
                ),
                max_dose_unit=rr.get("max_dose_unit"),
                usage_notes=rr.get("usage_notes"),
                precautions_specific=rr.get("precautions_specific"),
                confidence=rr.get("confidence"),
                sort_order=rr.get("sort_order", 0),
            )
        )

    return AdminProductDetailResponse(
        id=r["id"],
        name=r["name"],
        product_name_jp=r.get("product_name_jp"),
        maker_id=r.get("maker_id"),
        maker_name=_maker_display_name(users_row),
        product_type_id=ptype.get("id"),
        product_type_name=ptype.get("name"),
        commercial_status=r.get("commercial_status"),
        is_public=bool(r.get("is_public")),
        general_purpose=r.get("general_purpose"),
        primary_compound=r.get("primary_compound"),
        mode_of_action=r.get("mode_of_action"),
        technology_action=r.get("technology_action"),
        disease_pest_info=r.get("disease_pest_info"),
        expected_effects_official=r.get("expected_effects_official"),
        expected_effects_farmille=r.get("expected_effects_farmille"),
        usage_summary=r.get("usage_summary"),
        precautions=r.get("precautions"),
        storage_shelf_life=r.get("storage_shelf_life"),
        notes=r.get("notes"),
        confidence=r.get("confidence"),
        fertilizer_registered=r.get("fertilizer_registered"),
        pesticide_registered=r.get("pesticide_registered"),
        label_url=r.get("label_url"),
        sds_url=r.get("sds_url"),
        crops=crops_items,
        certifications=certs_items,
        benefits=benefits_items,
        images=images_items,
        recipes=recipes_items,
        created_at=r["created_at"],
        updated_at=r["updated_at"],
    )


# ─────────────────────────────────────────────────────────────────────
# PUT /v1/admin/products/{id}   編集 (spec §3.2)
# ─────────────────────────────────────────────────────────────────────


def _exists_product(admin: Any, product_id: UUID) -> bool:
    res = (
        admin.table("products")
        .select("id")
        .eq("id", str(product_id))
        .limit(1)
        .execute()
    )
    return bool(res.data)


@router.put("/{product_id}")
async def update_admin_product(
    product_id: UUID,
    payload: AdminProductUpdatePayload,
    _user: dict = require_role("admin"),
):
    """admin による products 編集 (spec admin-aglist-alignment-v2.md §3.2)。

    strategy:
    - 基本フィールドを UPDATE (10 新規列 + 既存列、is_public toggle 含む)
    - v1 必達 3 種 relation (crops + certifications + benefits) を product_id スコープで
      全削除 → 再 INSERT (既存 products.py L399 の delete-then-insert pattern 踏襲)
    - 画像は payload.images が None なら product_images を一切触らない (部分編集対応)
    - 残 5 relation (prefectures / composition_types / science_technologies /
      application_methods / application_windows) は本 endpoint で扱わない (v1.5+)
    - product_application_recipes も本 endpoint で扱わない (v1 read-only、§3.2)

    transaction: postgrest-py に `async with db.transaction():` は存在しないため、
    delete-then-insert を try/except で囲み、途中失敗時は 500 を返してユーザー再送信に
    委ねる (spec §6 R3、admin は 3 名で低頻度 / 手動 retry 可能)。
    """
    admin = get_supabase_admin()

    if not _exists_product(admin, product_id):
        return _error(404, "product_not_found")

    # 1. 基本フィールド UPDATE
    update_payload: dict[str, Any] = {
        "name": payload.name,
        "product_name_jp": payload.product_name_jp,
        "commercial_status": payload.commercial_status,
        "is_public": payload.is_public,
        "general_purpose": payload.general_purpose,
        "primary_compound": payload.primary_compound,
        "mode_of_action": payload.mode_of_action,
        "technology_action": payload.technology_action,
        "disease_pest_info": payload.disease_pest_info,
        "expected_effects_official": payload.expected_effects_official,
        "expected_effects_farmille": payload.expected_effects_farmille,
        "usage_summary": payload.usage_summary,
        "precautions": payload.precautions,
        "storage_shelf_life": payload.storage_shelf_life,
        "notes": payload.notes,
        "confidence": payload.confidence,
        "fertilizer_registered": payload.fertilizer_registered,
        "pesticide_registered": payload.pesticide_registered,
        "label_url": payload.label_url,
        "sds_url": payload.sds_url,
    }
    if payload.product_type_id is not None:
        update_payload["product_type_id"] = str(payload.product_type_id)

    try:
        admin.table("products").update(update_payload).eq(
            "id", str(product_id)
        ).execute()
    except Exception:
        logger.exception("failed to update admin product %s", product_id)
        return _error(500, "failed_to_update_product")

    # 2. v1 必達 3 種 relation を delete-then-insert
    try:
        admin.table("product_crops").delete().eq(
            "product_id", str(product_id)
        ).execute()
        admin.table("product_certifications").delete().eq(
            "product_id", str(product_id)
        ).execute()
        admin.table("product_benefit_relations").delete().eq(
            "product_id", str(product_id)
        ).execute()

        if payload.crop_ids:
            admin.table("product_crops").insert(
                [
                    {"product_id": str(product_id), "crop_id": str(cid)}
                    for cid in payload.crop_ids
                ]
            ).execute()
        if payload.certification_ids:
            admin.table("product_certifications").insert(
                [
                    {
                        "product_id": str(product_id),
                        "certification_id": str(cid),
                    }
                    for cid in payload.certification_ids
                ]
            ).execute()
        if payload.benefit_ids:
            admin.table("product_benefit_relations").insert(
                [
                    {
                        "product_id": str(product_id),
                        "product_benefit_id": str(bid),
                    }
                    for bid in payload.benefit_ids
                ]
            ).execute()
    except Exception:
        logger.exception("failed to update admin product relations %s", product_id)
        return _error(500, "failed_to_update_relations")

    # 3. 画像 (payload.images が None なら一切触らない、部分編集)
    if payload.images is not None:
        try:
            admin.table("product_images").delete().eq(
                "product_id", str(product_id)
            ).execute()
            if payload.images:
                # is_primary は 1 件まで保証 (helper / migration C と同じ運用)
                primary_assigned = False
                rows_to_insert = []
                for img in payload.images:
                    is_primary = img.is_primary and not primary_assigned
                    if is_primary:
                        primary_assigned = True
                    rows_to_insert.append(
                        {
                            "product_id": str(product_id),
                            "url": img.url,
                            "order": img.order,
                            "source_page_url": img.source_page_url,
                            "alt_text": img.alt_text,
                            "image_type": img.image_type,
                            "is_primary": is_primary,
                            "rights_note": img.rights_note,
                            "confidence": img.confidence,
                        }
                    )
                admin.table("product_images").insert(rows_to_insert).execute()
        except Exception:
            logger.exception("failed to update admin product images %s", product_id)
            return _error(500, "failed_to_update_images")

    return {"ok": True, "product_id": str(product_id)}

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import (
    ProductCreatePayload,
    ProductUpdatePayload,
    ReviewCreatePayload,
)
from app.routers._image_path import validate_product_image_path
from app.services.supabase import get_supabase_admin

router = APIRouter()


def _representative_image(images: list[dict] | None) -> str | None:
    """product_images から order 昇順で先頭の url を代表画像として返す。"""
    if not images:
        return None
    sorted_images = sorted(images, key=lambda x: x.get("order", 0))
    return sorted_images[0].get("url")


def _maker_display_name(maker: dict) -> str | None:
    """maker の表示名を決定する。maker_profiles.company_name 優先、
    無ければ users.name にフォールバック。

    Supabase の 1:1 join は dict で返る想定だが、1:N 形式で list で
    返るケースも観測されうるため両対応。"""
    raw = maker.get("maker_profiles")
    if isinstance(raw, list):
        profile = raw[0] if raw else {}
    elif isinstance(raw, dict):
        profile = raw
    else:
        profile = {}
    return profile.get("company_name") or maker.get("name")


def _flatten_product(row: dict) -> dict:
    """Supabase JOIN レスポンスをフロント向けの平坦な形に整形(一覧用)。

    products × users(name, maker_profiles(company_name)) ×
    product_types(type_id/name) × product_images(代表画像) を 1 オブジェクトに。
    """
    maker = row.get("users") or {}
    product_type = row.get("product_types") or {}
    return {
        "id": row["id"],
        "name": row["name"],
        "maker_id": row.get("maker_id"),
        "maker_name": _maker_display_name(maker),
        "type_id": product_type.get("id"),
        "type_name": product_type.get("name"),
        "image_url": _representative_image(row.get("product_images")),
        "created_at": row.get("created_at"),
    }


def _flatten_product_detail(row: dict) -> dict:
    """詳細用の平坦化。一覧の項目に加え、画像配列・効果タグ・対象作目・認証を含める。"""
    maker = row.get("users") or {}
    product_type = row.get("product_types") or {}

    images = sorted(row.get("product_images") or [], key=lambda x: x.get("order", 0))

    benefits = []
    for rel in row.get("product_benefit_relations") or []:
        b = rel.get("product_benefits")
        if b:
            benefits.append({"id": b["id"], "category": b.get("category"), "name": b["name"]})

    crops = []
    for rel in row.get("product_crops") or []:
        c = rel.get("crops")
        if c:
            crops.append({"id": c["id"], "name": c["name"]})

    certifications = []
    for rel in row.get("product_certifications") or []:
        cert = rel.get("certifications")
        if cert:
            certifications.append({"id": cert["id"], "name": cert["name"]})

    return {
        "id": row["id"],
        "name": row["name"],
        "maker_id": row.get("maker_id"),
        "maker_name": _maker_display_name(maker),
        "type_id": product_type.get("id"),
        "type_name": product_type.get("name"),
        "general_purpose": row.get("general_purpose"),
        "primary_compound": row.get("primary_compound"),
        "mode_of_action": row.get("mode_of_action"),
        "commercial_status": row.get("commercial_status"),
        "label_url": row.get("label_url"),
        "sds_url": row.get("sds_url"),
        "created_at": row.get("created_at"),
        "images": [{"url": img["url"], "order": img.get("order", 0)} for img in images],
        "benefits": benefits,
        "crops": crops,
        "certifications": certifications,
    }


@router.post("", status_code=201)
async def create_product(
    payload: ProductCreatePayload,
    user: dict = require_role("maker"),
):
    """maker による資材登録。

    maker_id は payload ではなく JWT の sub を強制採用 (書き換え攻撃防止)。
    products INSERT 成功後に関連テーブルを順次 INSERT。途中失敗時は
    products 行を削除し CASCADE で関連を清掃する (supabase-py は単発 REST の
    ため手動ロールバック)。
    画像は §5.1 の方針で path を rename せず public URL を product_images に保存。
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    try:
        prod_res = (
            admin.table("products")
            .insert(
                {
                    "maker_id": maker_id,
                    "product_type_id": str(payload.product_type_id),
                    "name": payload.name,
                    "general_purpose": payload.general_purpose,
                    "primary_compound": payload.primary_compound,
                    "mode_of_action": payload.mode_of_action,
                    "commercial_status": payload.commercial_status,
                    "label_url": payload.label_url,
                    "sds_url": payload.sds_url,
                }
            )
            .execute()
        )
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": "failed_to_create_product"},
        )

    if not prod_res.data:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": "failed_to_create_product"},
        )

    product_id = prod_res.data[0]["id"]

    def _rollback():
        try:
            admin.table("products").delete().eq("id", product_id).execute()
        except Exception:
            pass

    try:
        if payload.image_urls:
            admin.table("product_images").insert(
                [
                    {"product_id": product_id, "url": url, "order": idx}
                    for idx, url in enumerate(payload.image_urls)
                ]
            ).execute()

        if payload.benefit_ids:
            admin.table("product_benefit_relations").insert(
                [
                    {
                        "product_id": product_id,
                        "product_benefit_id": str(bid),
                    }
                    for bid in payload.benefit_ids
                ]
            ).execute()

        if payload.crop_ids:
            admin.table("product_crops").insert(
                [
                    {"product_id": product_id, "crop_id": str(cid)}
                    for cid in payload.crop_ids
                ]
            ).execute()

        if payload.certification_ids:
            admin.table("product_certifications").insert(
                [
                    {
                        "product_id": product_id,
                        "certification_id": str(cid),
                    }
                    for cid in payload.certification_ids
                ]
            ).execute()
    except Exception:
        _rollback()
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": "failed_to_attach_relations"},
        )

    return {"ok": True, "product_id": product_id}


@router.get("")
async def list_products(
    type_id: str | None = Query(default=None),
    crop_id: str | None = Query(default=None),
    q: str | None = Query(
        default=None,
        description="部分一致検索 (name + product_name_jp、case-insensitive)",
        max_length=100,
    ),
):
    """資材一覧。`type_id` / `crop_id` / `q` の AND 絞り込み対応。

    `q` は name と product_name_jp の OR-ILIKE。カンマは PostgREST の `or` 文法
    で予約文字なので除去してから渡す。
    レスポンス: { products: [{ id, name, maker_id, maker_name,
                              type_id, type_name, image_url, created_at }] }
    認証不要(LP / ゲスト閲覧前提)。
    """
    admin = get_supabase_admin()

    # crop_id 指定時は product_crops から該当 product_id を先に取得して
    # IN 句で絞り込む(Supabase nested filter 構文を避けて確実に動かす)
    product_ids: list[str] | None = None
    if crop_id:
        pc_res = (
            admin.table("product_crops")
            .select("product_id")
            .eq("crop_id", crop_id)
            .execute()
        )
        product_ids = [r["product_id"] for r in (pc_res.data or [])]
        if not product_ids:
            return {"products": []}

    query = admin.table("products").select(
        'id, name, maker_id, created_at, '
        'users(name, status, maker_profiles(company_name)), '
        'product_types(id, name), '
        'product_images(url, "order")'
    )
    if type_id:
        query = query.eq("product_type_id", type_id)
    if product_ids is not None:
        query = query.in_("id", product_ids)
    if q:
        # PostgREST `or` 文法で name + product_name_jp の OR-ILIKE。
        # カンマは or 文法の区切り文字なので含む検索は v1 サポート外で除去。
        like = q.strip().replace(",", "")
        if like:
            query = query.or_(
                f"name.ilike.%{like}%,product_name_jp.ilike.%{like}%"
            )
    res = query.order("created_at", desc=True).execute()
    # ADR-0009: 非 active メーカー (pending_review / rejected / frozen) 所有の
    # 製品は公開一覧に出さない。Supabase の foreign-table フィルタは join 側を
    # 絞るのみで親 row を除外しないため、Python 側で post-filter する。
    active_rows = [r for r in (res.data or []) if (r.get("users") or {}).get("status") == "active"]
    products = [_flatten_product(row) for row in active_rows]
    return {"products": products}


@router.post("/{product_id}/reviews", status_code=201)
async def create_product_review(
    product_id: UUID,
    payload: ReviewCreatePayload,
    user: dict = require_role("farmer"),
):
    """farmer によるレビュー投稿。

    id は payload.review_id を採用(フロントで crypto.randomUUID() 発行、
    画像 Storage パス {uid}/{review_id}/ と同期させるため)。
    UNIQUE(user_id, product_id) 違反は 409 で返す。
    画像メタデータは ADR-0003 により DB では保持しない。
    """
    user_id = get_user_id(user)
    admin = get_supabase_admin()

    existing = (
        admin.table("reviews")
        .select("id")
        .eq("user_id", user_id)
        .eq("product_id", str(product_id))
        .limit(1)
        .execute()
    )
    if existing.data:
        return JSONResponse(
            status_code=409,
            content={"ok": False, "error": "review_already_exists"},
        )

    try:
        admin.table("reviews").insert(
            {
                "id": str(payload.review_id),
                "user_id": user_id,
                "product_id": str(product_id),
                "rating": payload.rating,
                "body": payload.body,
            }
        ).execute()
    except Exception as exc:
        msg = str(exc).lower()
        if "23505" in msg or "duplicate key" in msg or "unique" in msg:
            return JSONResponse(
                status_code=409,
                content={"ok": False, "error": "review_already_exists"},
            )
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": "failed_to_create_review"},
        )

    return {"ok": True, "review_id": str(payload.review_id)}


@router.get("/{product_id}/reviews")
async def list_product_reviews(product_id: UUID):
    """指定資材のレビュー一覧。投稿日 desc。認証不要(全員閲覧可)。

    レスポンス: { reviews: [{ id, user_id, user_name, rating, body, created_at }] }
    不正な UUID は FastAPI が 422 を返す。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("reviews")
        .select("id, user_id, rating, body, created_at, users(name)")
        .eq("product_id", str(product_id))
        .order("created_at", desc=True)
        .execute()
    )
    reviews = []
    for r in res.data or []:
        u = r.get("users") or {}
        reviews.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "user_name": u.get("name"),
            "rating": r["rating"],
            "body": r["body"],
            "created_at": r["created_at"],
        })
    return {"reviews": reviews}


@router.get("/{product_id}")
async def get_product(product_id: UUID):
    """資材詳細。maker / type / images(全件) / benefits / crops / certifications を JOIN 展開。

    レビューは別エンドポイント /v1/products/{product_id}/reviews で取得する。
    認証不要。存在しない id は 404、不正な UUID は FastAPI が 422 を返す。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("products")
        .select(
            'id, name, maker_id, general_purpose, primary_compound, mode_of_action, '
            'commercial_status, label_url, sds_url, created_at, '
            'users(name, status, maker_profiles(company_name)), '
            'product_types(id, name), '
            'product_images(url, "order"), '
            'product_benefit_relations(product_benefits(id, category, name)), '
            'product_crops(crops(id, name)), '
            'product_certifications(certifications(id, name))'
        )
        .eq("id", str(product_id))
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="product_not_found")
    row = res.data[0]
    # ADR-0009: 非 active メーカー所有の製品は公開詳細から 404 として隠す。
    if (row.get("users") or {}).get("status") != "active":
        raise HTTPException(status_code=404, detail="product_not_found")
    return _flatten_product_detail(row)


def _fetch_product_owner(admin, product_id: UUID) -> str | None:
    res = (
        admin.table("products")
        .select("maker_id")
        .eq("id", str(product_id))
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    return res.data[0]["maker_id"]


@router.put("/{product_id}")
async def update_product(
    product_id: UUID,
    payload: ProductUpdatePayload,
    user: dict = require_role("maker"),
):
    """資材編集。自社 (maker_id = JWT.sub) のみ許可。

    strategy: 基本フィールドを UPDATE、関連 3 テーブル (benefit/crop/certification) と
    product_images は product_id スコープで全削除 → 再 INSERT。
    関連 INSERT 失敗時はロールバックせず 500 を返し、ユーザー再送信に委ねる
    (spec §10.1 / Phase 10 spec §4.2)。

    Phase 10:
    - payload.remove_paths の path prefix validation → 1 つでも不正なら 400 全体拒否
    - payload.order の配列順で product_images を全削除 → 再 INSERT (order 列 = index)
    - Storage の既存画像削除は DB 更新後に best-effort (spec §11.2)
    """
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    owner = _fetch_product_owner(admin, product_id)
    if owner is None:
        return JSONResponse(
            status_code=404,
            content={"ok": False, "error": "product_not_found"},
        )
    if owner != maker_id:
        return JSONResponse(
            status_code=403,
            content={"ok": False, "error": "not_owner"},
        )

    for path in payload.remove_paths:
        if not validate_product_image_path(path, maker_id):
            return JSONResponse(
                status_code=400,
                content={"ok": False, "error": "invalid_image_path"},
            )

    try:
        admin.table("products").update(
            {
                "product_type_id": str(payload.product_type_id),
                "name": payload.name,
                "general_purpose": payload.general_purpose,
                "primary_compound": payload.primary_compound,
                "mode_of_action": payload.mode_of_action,
                "commercial_status": payload.commercial_status,
                "label_url": payload.label_url,
                "sds_url": payload.sds_url,
            }
        ).eq("id", str(product_id)).execute()
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": "failed_to_update_product"},
        )

    try:
        admin.table("product_benefit_relations").delete().eq(
            "product_id", str(product_id)
        ).execute()
        admin.table("product_crops").delete().eq(
            "product_id", str(product_id)
        ).execute()
        admin.table("product_certifications").delete().eq(
            "product_id", str(product_id)
        ).execute()

        # 画像は明示的な操作 (order 指定 or remove_paths 指定) がある時だけ
        # 全置換する。どちらも空の payload では product_images を一切触らない
        # (Phase 9 互換の「画像無関係な部分編集」セマンティクスを保持)。
        touching_images = bool(payload.order) or bool(payload.remove_paths)
        if touching_images:
            admin.table("product_images").delete().eq(
                "product_id", str(product_id)
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
        if touching_images and payload.order:
            admin.table("product_images").insert(
                [
                    {
                        "product_id": str(product_id),
                        "url": item.url,
                        "order": idx,
                    }
                    for idx, item in enumerate(payload.order)
                ]
            ).execute()
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": "failed_to_update_relations"},
        )

    if payload.remove_paths:
        try:
            admin.storage.from_("product-images").remove(payload.remove_paths)
        except Exception:
            # spec §11.2: remove 失敗は best-effort、DB 更新は既に成功
            pass

    return {"ok": True}


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    user: dict = require_role("maker"),
):
    """資材削除。自社のみ許可。
    FK ON DELETE CASCADE により関連テーブル (product_images /
    product_benefit_relations / product_crops / product_certifications /
    reviews) も自動削除される。Storage 画像は v1 では残存許容。"""
    maker_id = get_user_id(user)
    admin = get_supabase_admin()

    owner = _fetch_product_owner(admin, product_id)
    if owner is None:
        return JSONResponse(
            status_code=404,
            content={"ok": False, "error": "product_not_found"},
        )
    if owner != maker_id:
        return JSONResponse(
            status_code=403,
            content={"ok": False, "error": "not_owner"},
        )

    try:
        admin.table("products").delete().eq("id", str(product_id)).execute()
    except Exception as exc:
        logger.exception("failed to delete product %s", product_id)
        return JSONResponse(
            status_code=500,
            content={
                "ok": False,
                "error": "failed_to_delete_product",
                "detail": str(exc),
            },
        )

    return Response(status_code=204)

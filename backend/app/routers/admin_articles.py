"""Admin Articles CMS endpoints (ADR-0014 / docs/drafts/admin-articles-cms-spec.md)。

- GET    /v1/admin/articles          一覧 (下書き含む全件、pagination)
- GET    /v1/admin/articles/{id}     1 件 (編集プリフィル、body_md 含む)
- POST   /v1/admin/articles          作成 (slug 重複は 409、author = 作成 admin)
- PATCH  /v1/admin/articles/{id}     部分更新 (published_at の set/null で公開・非公開)
- DELETE /v1/admin/articles/{id}     削除 (Storage hero はバケットに残す: ADR-0014 §2.4)

全て `require_role("admin")` で第一防御。`admin` ロールには ADR-0012 §2.2 の AAL2 強制が
適用されるため、未 enroll / AAL1 セッションは 401 `aal_insufficient` で reject される。
書き込みは Supabase service_role で RLS bypass (BFF が唯一の書き込み経路)。

公開系 articles.py (read) はこの router を通らず据え置き。articles テーブルの RLS は
service_role 書き込みのみ許可 (migration 20260502120001) のため、書き込み経路は本 router に集約。
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.auth.jwt import get_user_id
from app.dependencies import require_role
from app.models.schemas import (
    AdminArticleCreate,
    AdminArticleDetail,
    AdminArticleListItem,
    AdminArticleListResponse,
    AdminArticlePatch,
)
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()


def _error(status_code: int, code: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"ok": False, "error": code})


# ─────────────────────────────────────────────────────────────────────
# GET /v1/admin/articles   一覧 (下書き含む)
# ─────────────────────────────────────────────────────────────────────


@router.get("", response_model=AdminArticleListResponse)
async def list_admin_articles(
    _user: dict = require_role("admin"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=100),
) -> AdminArticleListResponse:
    """admin articles 一覧。

    公開系 (articles.py) と違い published_at が NULL の下書きも含めて全件返す。
    並び順は (created_at DESC, id DESC) で安定化 (新規作成順、下書きも先頭に出る)。
    """
    admin = get_supabase_admin()

    query = admin.table("articles").select(
        "id, slug, title, category, hero_image_url, published_at, created_at, updated_at",
        count="exact",
    )
    query = query.order("created_at", desc=True).order("id", desc=True)

    start = (page - 1) * per_page
    end = start + per_page - 1
    query = query.range(start, end)

    res = query.execute()
    rows = res.data or []
    total = getattr(res, "count", None) or 0

    items = [
        AdminArticleListItem(
            id=r["id"],
            slug=r["slug"],
            title=r["title"],
            category=r["category"],
            hero_image_url=r.get("hero_image_url"),
            published_at=r.get("published_at"),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )
        for r in rows
    ]

    return AdminArticleListResponse(
        articles=items, total=total, page=page, per_page=per_page
    )


# ─────────────────────────────────────────────────────────────────────
# GET /v1/admin/articles/{id}   詳細 (編集プリフィル)
# ─────────────────────────────────────────────────────────────────────


@router.get("/{article_id}", response_model=AdminArticleDetail)
async def get_admin_article(
    article_id: UUID,
    _user: dict = require_role("admin"),
) -> AdminArticleDetail | JSONResponse:
    """admin articles 詳細 (body_md 含む全列)。

    公開系 get_article (slug + 公開条件) と違い、下書きも id で取得できる。
    """
    admin = get_supabase_admin()

    res = (
        admin.table("articles")
        .select(
            "id, slug, title, body_md, category, hero_image_url, author_user_id, "
            "published_at, created_at, updated_at"
        )
        .eq("id", str(article_id))
        .limit(1)
        .execute()
    )
    rows = res.data or []
    if not rows:
        return _error(404, "article_not_found")
    r = rows[0]

    return AdminArticleDetail(
        id=r["id"],
        slug=r["slug"],
        title=r["title"],
        body_md=r["body_md"],
        category=r["category"],
        hero_image_url=r.get("hero_image_url"),
        author_user_id=r.get("author_user_id"),
        published_at=r.get("published_at"),
        created_at=r["created_at"],
        updated_at=r["updated_at"],
    )


# ─────────────────────────────────────────────────────────────────────
# POST /v1/admin/articles   作成
# ─────────────────────────────────────────────────────────────────────


def _slug_exists(admin, slug: str, *, exclude_id: str | None = None) -> bool:
    """slug 重複チェック。exclude_id 指定時は当該記事自身を除外 (PATCH 用)。"""
    query = admin.table("articles").select("id").eq("slug", slug)
    res = query.limit(2).execute()
    rows = res.data or []
    if exclude_id is None:
        return bool(rows)
    return any(row.get("id") != exclude_id for row in rows)


@router.post("")
async def create_admin_article(
    payload: AdminArticleCreate,
    _user: dict = require_role("admin"),
):
    """記事を新規作成する。

    - slug 重複は 409 (DB UNIQUE 制約に頼らず BFF で先回り判定し、正規化 error code を返す)
    - author_user_id は作成 admin の auth.uid() を強制 (payload からは受け取らない)
    - published_at が None なら下書き、datetime なら公開 / 予約
    """
    admin = get_supabase_admin()

    if _slug_exists(admin, payload.slug):
        return _error(409, "slug_already_exists")

    insert_row = {
        "slug": payload.slug,
        "title": payload.title,
        "body_md": payload.body_md,
        "category": payload.category,
        "hero_image_url": payload.hero_image_url,
        "author_user_id": get_user_id(_user),
        "published_at": (
            payload.published_at.isoformat() if payload.published_at else None
        ),
    }

    try:
        res = admin.table("articles").insert(insert_row).execute()
    except Exception:
        logger.exception("failed to create article (slug=%s)", payload.slug)
        return _error(500, "failed_to_create_article")

    rows = res.data or []
    new_id = rows[0].get("id") if rows else None
    return {"ok": True, "id": new_id}


# ─────────────────────────────────────────────────────────────────────
# PATCH /v1/admin/articles/{id}   部分更新
# ─────────────────────────────────────────────────────────────────────


def _article_exists(admin, article_id: UUID) -> bool:
    res = (
        admin.table("articles")
        .select("id")
        .eq("id", str(article_id))
        .limit(1)
        .execute()
    )
    return bool(res.data)


@router.patch("/{article_id}")
async def update_admin_article(
    article_id: UUID,
    payload: AdminArticlePatch,
    _user: dict = require_role("admin"),
):
    """記事を部分更新する。

    `model_fields_set` で「送られたキーのみ」を反映する (published_at の
    null=非公開化 と キー省略=変更なし を区別する、AdminArticlePatch docstring 参照)。
    slug を変更する場合のみ重複チェック (自分自身は除外、409)。
    更新フィールドが 1 つも無い場合は 400。
    """
    admin = get_supabase_admin()

    if not _article_exists(admin, article_id):
        return _error(404, "article_not_found")

    fields_set = payload.model_fields_set
    if not fields_set:
        return _error(400, "no_fields_to_update")

    # slug 変更時のみ重複チェック (自分を除外)。
    if "slug" in fields_set and payload.slug is not None:
        if _slug_exists(admin, payload.slug, exclude_id=str(article_id)):
            return _error(409, "slug_already_exists")

    update_row: dict = {}
    if "slug" in fields_set and payload.slug is not None:
        update_row["slug"] = payload.slug
    if "title" in fields_set and payload.title is not None:
        update_row["title"] = payload.title
    if "body_md" in fields_set and payload.body_md is not None:
        update_row["body_md"] = payload.body_md
    if "category" in fields_set and payload.category is not None:
        update_row["category"] = payload.category
    # hero_image_url / published_at は null を「クリア」の明示意図として尊重する。
    if "hero_image_url" in fields_set:
        update_row["hero_image_url"] = payload.hero_image_url
    if "published_at" in fields_set:
        update_row["published_at"] = (
            payload.published_at.isoformat() if payload.published_at else None
        )

    if not update_row:
        # slug/title/body_md/category だけ送られて全て None だった等。
        return _error(400, "no_fields_to_update")

    try:
        admin.table("articles").update(update_row).eq(
            "id", str(article_id)
        ).execute()
    except Exception:
        logger.exception("failed to update article %s", article_id)
        return _error(500, "failed_to_update_article")

    return {"ok": True, "id": str(article_id)}


# ─────────────────────────────────────────────────────────────────────
# DELETE /v1/admin/articles/{id}   削除
# ─────────────────────────────────────────────────────────────────────


@router.delete("/{article_id}")
async def delete_admin_article(
    article_id: UUID,
    _user: dict = require_role("admin"),
):
    """記事を削除する (ハード削除)。

    article_products は FK CASCADE で連動削除される (migration 20260502120000)。
    Storage の hero 画像は連動削除しない (バケットに残す、ADR-0014 §2.4)。
    """
    admin = get_supabase_admin()

    if not _article_exists(admin, article_id):
        return _error(404, "article_not_found")

    try:
        admin.table("articles").delete().eq("id", str(article_id)).execute()
    except Exception:
        logger.exception("failed to delete article %s", article_id)
        return _error(500, "failed_to_delete_article")

    return {"ok": True, "id": str(article_id)}

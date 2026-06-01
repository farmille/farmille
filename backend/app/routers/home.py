"""Phase 18: ホーム集約 endpoint。

spec docs/specs/home.md §5.1 / §5.2 / §10.1。

3 系統（featured_products / articles / home_banners）を 1 endpoint で並列フェッチして
返す。Server Component の fetch waterfall を避け、Vercel ↔ Railway の往復を最小化。

設計判断:
- 認証不要（公開ページ）。書き込みは別系統（v1 では SQL 直のみ）
- supabase-py の REST 呼び出しは同期 I/O。`asyncio.to_thread` で別スレッドに逃して
  `asyncio.gather` で並列化する（純粋な async client は v1 で導入していない）
- articles は本来 Phase 15 articles.py の関数を呼びたいが、Phase 18 worktree は
  Phase 15 をまだ取り込んでいないため、同等のクエリを本ファイルに直接記述する。
  Phase 18 が main に到達した時点で Phase 15 はすでに in なので、その時点で
  共通化のリファクタは別 PR で扱う（spec §10.1 / 「重要な実装ノート」）。
"""

from __future__ import annotations

import asyncio
import re

from fastapi import APIRouter, Query

from app.models.schemas import (
    FeaturedProductInner,
    FeaturedProductItem,
    HomeArticleItem,
    HomeBannerItem,
    HomeResponse,
)
from app.services.supabase import get_supabase_admin

router = APIRouter()


# Phase 15 articles.py と同じ excerpt 生成（DB に excerpt 列を持たない、
# DOA: 生成ロジック変更時に migration 不要）
_EXCERPT_STRIP_RE = re.compile(r"[#*_`>\-]")


def _make_excerpt(body_md: str) -> str:
    if not body_md:
        return ""
    return _EXCERPT_STRIP_RE.sub("", body_md)[:120]


def _maker_display_name(maker: dict) -> str | None:
    """products.py / articles.py と同じ helper。
    maker_profiles.company_name 優先、無ければ users.name にフォールバック。
    Supabase の 1:1 join が dict / list どちらで返っても受ける。
    """
    raw = maker.get("maker_profiles")
    if isinstance(raw, list):
        profile = raw[0] if raw else {}
    elif isinstance(raw, dict):
        profile = raw
    else:
        profile = {}
    return profile.get("company_name") or maker.get("name")


def _representative_image(images: list[dict] | None) -> str | None:
    if not images:
        return None
    sorted_images = sorted(images, key=lambda x: x.get("order", 0))
    return sorted_images[0].get("url")


# ─────────────────────────────────────────────────────────────────────
# 個別フェッチ関数（asyncio.to_thread で別スレッドに逃す前提の同期関数）
# ─────────────────────────────────────────────────────────────────────


def _fetch_featured_products(limit: int) -> list[FeaturedProductItem]:
    """注目の資材を取得。

    2026-05-27 変更: spec §5.1 の `featured_products` 手動キュレ参照をやめて
    `products` の updated_at DESC を直接返す方式に置換。デモ要件「最近更新された
    資材を出す」に合わせ、admin による featured curation 運用 (spec §1.3) を保留する。
    spec/ADR 反映は post-demo (別 PR)。

    フィルタ:
      - products.is_public = true
      - products.maker.users.status = 'active' (ADR-0009: 非 active maker 除外)
    並び:
      - products.updated_at DESC (LIMIT で取り過ぎないよう Supabase 側で打ち切り)
    """
    admin = get_supabase_admin()
    # ADR-0009 post-filter 用に少し多めに fetch (active maker 除外で減るため)
    fetch_limit = max(limit * 2, limit + 4)
    res = (
        admin.table("products")
        .select(
            "id, name, updated_at, "
            "users(name, status, maker_profiles(company_name)), "
            "product_types(id, name), "
            'product_images(url, "order")'
        )
        .eq("is_public", True)
        .is_("deleted_at", "null")
        .order("updated_at", desc=True)
        .limit(fetch_limit)
        .execute()
    )

    items: list[FeaturedProductItem] = []
    for product in res.data or []:
        maker = product.get("users") or {}
        if maker.get("status") != "active":
            continue
        product_type = product.get("product_types") or {}
        items.append(
            FeaturedProductItem(
                # featured_products テーブルを参照しなくなったので id は product.id を流用。
                # 既存 schema (FeaturedProductItem.id = featured row id) の互換のため、
                # フロントは id をキーにしか使わず unique なら何でも良い (home-content の
                # map key 用途のみ)。
                id=product["id"],
                sort_order=0,
                product=FeaturedProductInner(
                    id=product["id"],
                    name=product["name"],
                    maker_name=_maker_display_name(maker),
                    image_url=_representative_image(product.get("product_images")),
                    type_name=product_type.get("name"),
                ),
            )
        )
        if len(items) >= limit:
            break
    return items


def _fetch_latest_articles(limit: int) -> list[HomeArticleItem]:
    """最新の公開済記事を取得。

    spec §5.1: published_at IS NOT NULL AND published_at <= now()、
    published_at DESC で limit 件。
    Phase 15 articles.py の list_articles と同等のクエリを本ファイルに置く
    （理由はモジュール冒頭 docstring 参照）。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("articles")
        .select("id, slug, title, category, hero_image_url, published_at, body_md")
        .not_.is_("published_at", "null")
        .lte("published_at", "now()")
        .order("published_at", desc=True)
        .limit(limit)
        .execute()
    )

    items: list[HomeArticleItem] = []
    for row in res.data or []:
        items.append(
            HomeArticleItem(
                id=row["id"],
                slug=row["slug"],
                title=row["title"],
                category=row["category"],
                hero_image_url=row.get("hero_image_url"),
                published_at=row["published_at"],
                excerpt=_make_excerpt(row.get("body_md") or ""),
            )
        )
    return items


def _fetch_banners(limit: int) -> list[HomeBannerItem]:
    """ホームバナーを取得。

    spec §5.1: displayed_at IS NOT NULL AND displayed_at <= now() で絞り、
    sort_order ASC, displayed_at DESC で limit 件。
    """
    admin = get_supabase_admin()
    res = (
        admin.table("home_banners")
        .select("id, title, image_url, link_url, sort_order, displayed_at")
        .not_.is_("displayed_at", "null")
        .lte("displayed_at", "now()")
        .order("sort_order", desc=False)
        .order("displayed_at", desc=True)
        .limit(limit)
        .execute()
    )

    items: list[HomeBannerItem] = []
    for row in res.data or []:
        items.append(
            HomeBannerItem(
                id=row["id"],
                title=row["title"],
                image_url=row["image_url"],
                link_url=row["link_url"],
                sort_order=row.get("sort_order", 0),
            )
        )
    return items


# ─────────────────────────────────────────────────────────────────────
# 集約 endpoint
# ─────────────────────────────────────────────────────────────────────


@router.get("", response_model=HomeResponse)
async def get_home(
    featured_limit: int = Query(default=8, ge=1, le=20),
    articles_limit: int = Query(default=6, ge=1, le=12),
    banners_limit: int = Query(default=3, ge=1, le=10),
) -> HomeResponse:
    """ホーム表示用の 3 系統データを集約して返す。

    spec §5.1: 認証不要、3 系統を並列フェッチ、空配列でも 200。

    並列化方針: supabase-py は同期クライアントなので、各フェッチを
    `asyncio.to_thread` で別スレッドに逃して `asyncio.gather` で並列化する。
    """
    featured, articles, banners = await asyncio.gather(
        asyncio.to_thread(_fetch_featured_products, featured_limit),
        asyncio.to_thread(_fetch_latest_articles, articles_limit),
        asyncio.to_thread(_fetch_banners, banners_limit),
    )

    return HomeResponse(
        featured_products=featured,
        latest_articles=articles,
        banners=banners,
    )

import logging
import re
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from app.models.schemas import ArticleCategory
from app.services.supabase import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter()


# spec §4.1 / §5.2: slug は ^[a-z0-9]+(-[a-z0-9]+)*$、長さ 3-80
SLUG_PATTERN = r"^[a-z0-9]+(-[a-z0-9]+)*$"

# spec §5.1 処理 3: markdown 記法を簡易除去して先頭抜粋を生成
_EXCERPT_STRIP_RE = re.compile(r"[#*_`>\-]")


def _make_excerpt(body_md: str) -> str:
    """body_md から markdown 記号を除去して先頭 120 文字を抜粋として返す。

    spec §5.1 / §10.3: DB に excerpt 列を持たず API 層で動的生成する
    （DOA 優先、生成ロジック変更時に migration 不要）。
    """
    if not body_md:
        return ""
    return _EXCERPT_STRIP_RE.sub("", body_md)[:120]


def _maker_display_name(maker: dict) -> str | None:
    """maker の表示名を決定する。maker_profiles.company_name 優先、
    無ければ users.name にフォールバック。

    Supabase の 1:1 join は dict で返る想定だが、1:N 形式で list で
    返るケースも観測されうるため両対応（products.py の同名関数と同パターン）。
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
    """product_images から order=0（昇順先頭）の url を代表画像として返す。

    products.py の同名関数と同パターン。
    """
    if not images:
        return None
    sorted_images = sorted(images, key=lambda x: x.get("order", 0))
    return sorted_images[0].get("url")


def _coerce_one(rel: dict | list | None) -> dict:
    """Supabase の 1:1 join が dict にも list にも返る両対応ヘルパ。"""
    if isinstance(rel, list):
        return rel[0] if rel else {}
    if isinstance(rel, dict):
        return rel
    return {}


@router.get("")
async def list_articles(
    category: ArticleCategory | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=50),
):
    """記事一覧（公開済のみ）。

    spec §5.1:
    - 認証不要
    - service_role 経由で `articles` を `published_at IS NOT NULL AND published_at <= now()`
      で絞り、`category` 指定時は追加絞り、`published_at DESC` で `limit` 件取得
    - excerpt は body_md から markdown 記号を簡易除去した先頭 120 文字
    - RLS でも公開条件は強制されるが、API 第一防御として明示的に同条件を WHERE に書く
    """
    admin = get_supabase_admin()

    query = (
        admin.table("articles")
        .select("id, slug, title, category, hero_image_url, published_at, body_md")
        .not_.is_("published_at", "null")
        .lte("published_at", "now()")
    )
    if category is not None:
        query = query.eq("category", category)

    res = query.order("published_at", desc=True).limit(limit).execute()

    articles = []
    for row in res.data or []:
        articles.append(
            {
                "id": row["id"],
                "slug": row["slug"],
                "title": row["title"],
                "category": row["category"],
                "hero_image_url": row.get("hero_image_url"),
                "published_at": row["published_at"],
                "excerpt": _make_excerpt(row.get("body_md") or ""),
            }
        )
    return {"articles": articles}


@router.get("/{slug}")
async def get_article(
    slug: Annotated[
        str,
        Path(
            min_length=3,
            max_length=80,
            pattern=SLUG_PATTERN,
        ),
    ],
):
    """記事詳細（公開済のみ）。

    spec §5.2:
    1. slug 一致 + 公開条件で 1 行取得（404 判定）
    2. users(id, name) を join して author 構築（NULL 許容）
    3. article_products を position ASC で取得 → products + maker 表示名 +
       product_images 先頭画像 を join し related_products を構築
    """
    admin = get_supabase_admin()

    article_res = (
        admin.table("articles")
        .select(
            "id, slug, title, body_md, category, hero_image_url, author_user_id, "
            "published_at, users(id, name)"
        )
        .eq("slug", slug)
        .not_.is_("published_at", "null")
        .lte("published_at", "now()")
        .limit(1)
        .execute()
    )
    if not article_res.data:
        # spec §5.2 / §3.3 統一エラー形式
        raise HTTPException(
            status_code=404,
            detail={"detail": "article_not_found", "code": "article_not_found"},
        )

    article = article_res.data[0]

    # author（author_user_id が NULL なら null）
    author: dict | None = None
    author_user = _coerce_one(article.get("users"))
    if article.get("author_user_id") and author_user:
        author = {
            "id": author_user["id"],
            "name": author_user.get("name"),
        }

    # related_products: article_products を position ASC で取得し、
    # products の必要項目 + maker 表示名 + 代表画像 を平坦化
    rel_res = (
        admin.table("article_products")
        .select(
            "position, products(id, name, "
            "users(name, maker_profiles(company_name)), "
            'product_images(url, "order"))'
        )
        .eq("article_id", article["id"])
        .order("position", desc=False)
        .execute()
    )

    related_products = []
    for rel in rel_res.data or []:
        product = _coerce_one(rel.get("products"))
        if not product:
            # 念のため: FK CASCADE で通常は発生しないが、防御的にスキップ
            continue
        maker = _coerce_one(product.get("users"))
        related_products.append(
            {
                "id": product["id"],
                "name": product["name"],
                "maker_name": _maker_display_name(maker),
                "image_url": _representative_image(product.get("product_images")),
                "position": rel.get("position", 0),
            }
        )

    return {
        "id": article["id"],
        "slug": article["slug"],
        "title": article["title"],
        "body_md": article["body_md"],
        "category": article["category"],
        "hero_image_url": article.get("hero_image_url"),
        "author": author,
        "published_at": article["published_at"],
        "related_products": related_products,
    }

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

# Phase 15 articles のカテゴリ enum を Phase 18 home でも再利用する。
# DB CHECK 制約と一致（articles.category）
ArticleCategory = Literal["monthly_report", "weekly_report", "featured", "column"]


class UserResponse(BaseModel):
    id: str
    role: str
    name: str


class HealthResponse(BaseModel):
    status: str


class RegisterRolePayload(BaseModel):
    role: Literal["farmer", "maker"]


class RegisterRoleResponse(BaseModel):
    ok: bool
    role: str | None = None
    error: str | None = None


class FarmerOnboardingPayload(BaseModel):
    prefecture: str = Field(min_length=1, max_length=50)
    city: str = Field(min_length=1, max_length=50)
    field_size: float | None = None
    note: str | None = Field(default=None, max_length=500)
    crop_ids: list[str] = Field(min_length=1)


class MakerOnboardingPayload(BaseModel):
    company_name: str = Field(min_length=1, max_length=100)
    prefecture: str | None = None
    city: str | None = Field(default=None, max_length=50)
    note: str | None = Field(default=None, max_length=1000)


class ReviewCreatePayload(BaseModel):
    review_id: UUID
    rating: int = Field(ge=1, le=5)
    body: str = Field(min_length=1, max_length=2000)


class ProductCreatePayload(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    product_type_id: UUID
    general_purpose: str | None = Field(default=None, max_length=500)
    primary_compound: str | None = Field(default=None, max_length=200)
    mode_of_action: str | None = Field(default=None, max_length=500)
    commercial_status: str | None = Field(default=None, max_length=50)
    label_url: str | None = Field(default=None, max_length=500)
    sds_url: str | None = Field(default=None, max_length=500)
    benefit_ids: list[UUID] = Field(default_factory=list, max_length=25)
    crop_ids: list[UUID] = Field(default_factory=list, max_length=50)
    certification_ids: list[UUID] = Field(default_factory=list, max_length=10)
    image_urls: list[str] = Field(default_factory=list, max_length=5)


class ReviewUpdatePayload(BaseModel):
    rating: int = Field(ge=1, le=5)
    body: str = Field(min_length=1, max_length=2000)
    remove_paths: list[str] = Field(default_factory=list, max_length=5)


class ProductImageOrderItem(BaseModel):
    url: str = Field(min_length=1, max_length=500)
    existing: bool


class ProductUpdatePayload(BaseModel):
    """Phase 10 から画像編集対応。
    order: 最終表示順序。existing=true は既存 URL 維持、false は新規追加 URL (既に
    Storage に upload 済み前提)。実装は全削除 → 再 INSERT (spec §4.2)。
    remove_paths: Storage から消す既存画像の path 配列。"""

    name: str = Field(min_length=1, max_length=100)
    product_type_id: UUID
    general_purpose: str | None = Field(default=None, max_length=500)
    primary_compound: str | None = Field(default=None, max_length=200)
    mode_of_action: str | None = Field(default=None, max_length=500)
    commercial_status: str | None = Field(default=None, max_length=50)
    label_url: str | None = Field(default=None, max_length=500)
    sds_url: str | None = Field(default=None, max_length=500)
    benefit_ids: list[UUID] = Field(default_factory=list, max_length=25)
    crop_ids: list[UUID] = Field(default_factory=list, max_length=50)
    certification_ids: list[UUID] = Field(default_factory=list, max_length=10)
    remove_paths: list[str] = Field(default_factory=list, max_length=5)
    order: list[ProductImageOrderItem] = Field(default_factory=list, max_length=5)


# ─────────────────────────────────────────────────────────────────────
# Phase 18: ホーム集約 (`GET /v1/home`)
# spec docs/specs/home.md §5.2
# ─────────────────────────────────────────────────────────────────────


class FeaturedProductInner(BaseModel):
    """注目資材の中身。products + maker + 代表画像 + type を平坦化したもの。"""

    id: UUID
    name: str
    maker_name: str | None
    image_url: str | None
    type_name: str | None


class FeaturedProductItem(BaseModel):
    """featured_products 1 行 + 紐付く product を内包。"""

    id: UUID  # featured_products.id（products.id ではない）
    sort_order: int = Field(ge=0)
    product: FeaturedProductInner


class HomeArticleItem(BaseModel):
    """ホームに出す最新記事カード分の最小列。Phase 15 の list 形と同等。"""

    id: UUID
    slug: str
    title: str
    category: ArticleCategory
    hero_image_url: str | None
    published_at: datetime
    excerpt: str


class HomeBannerItem(BaseModel):
    id: UUID
    title: str
    image_url: str
    link_url: str
    sort_order: int = Field(ge=0)


class HomeResponse(BaseModel):
    """`GET /v1/home` の集約 response（3 系統を 1 つにまとめる）。"""

    featured_products: list[FeaturedProductItem]
    latest_articles: list[HomeArticleItem]
    banners: list[HomeBannerItem]

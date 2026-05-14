from datetime import datetime
from typing import Annotated, Literal
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


class MeProfileResponse(BaseModel):
    """GET /v1/me/profile レスポンス (Phase 19、farmer ロール限定)。

    `name` は users.name (氏名)、`display_name` は SNS 用の任意表示名 (NULL 可)。
    spec §5.1 に整合。
    """

    user_id: UUID
    name: str
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    prefecture: str
    city: str
    field_size: float | None = None
    note: str | None = None


class MeProfileUpdatePayload(BaseModel):
    """PUT /v1/me/profile ペイロード (Phase 19、farmer ロール限定)。

    user_id は受け取らない (BFF が auth.uid() で強制、書き換え攻撃防止 §5.3)。
    各 max_length は farmer_profiles の CHECK 制約と一致させる (§4.1)。
    """

    display_name: Annotated[str | None, Field(default=None, max_length=50)]
    bio: Annotated[str | None, Field(default=None, max_length=500)]
    avatar_url: Annotated[str | None, Field(default=None, max_length=2000)]
    prefecture: Annotated[str, Field(min_length=1, max_length=20)]
    city: Annotated[str, Field(min_length=1, max_length=50)]
    field_size: Annotated[float | None, Field(default=None, ge=0)]
    note: Annotated[str | None, Field(default=None, max_length=1000)]


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


# ---- Phase 15: Articles (spec §5.3) ----

ArticleCategory = Literal["monthly_report", "weekly_report", "featured", "column"]


class ArticleListItem(BaseModel):
    id: UUID
    slug: str
    title: str
    category: ArticleCategory
    hero_image_url: str | None
    published_at: datetime
    excerpt: str


class ArticleListResponse(BaseModel):
    articles: list[ArticleListItem]


class ArticleAuthor(BaseModel):
    id: UUID
    name: str


class ArticleRelatedProduct(BaseModel):
    id: UUID
    name: str
    maker_name: str | None
    image_url: str | None
    position: int = Field(ge=0)


class ArticleDetailResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    body_md: str
    category: ArticleCategory
    hero_image_url: str | None
    author: ArticleAuthor | None
    published_at: datetime
    related_products: list[ArticleRelatedProduct]


# === Phase 17: manufacturers (public) + maker profile (self) ===


class ManufacturerListItem(BaseModel):
    id: UUID
    company_name: str
    prefecture: str | None
    city: str | None
    product_count: int = Field(ge=0)


class ManufacturerListResponse(BaseModel):
    manufacturers: list[ManufacturerListItem]


class ManufacturerProduct(BaseModel):
    id: UUID
    name: str
    type_name: str | None
    image_url: str | None
    created_at: datetime


class ManufacturerDetailResponse(BaseModel):
    id: UUID
    company_name: str
    prefecture: str | None
    city: str | None
    note: str | None
    products: list[ManufacturerProduct]


class MakerProfileResponse(BaseModel):
    user_id: UUID
    company_name: str
    prefecture: str | None
    city: str | None
    note: str | None


class MakerProfileUpdatePayload(BaseModel):
    """Self-edit payload for `/v1/maker/profile`. `user_id` is taken from the
    JWT (`auth.uid()`) on the BFF and is NEVER read from the body (spec §3,
    SKILL §3.2 write-attack hardening)."""

    company_name: Annotated[str, Field(min_length=1, max_length=100)]
    prefecture: Annotated[str | None, Field(default=None, max_length=20)] = None
    city: Annotated[str | None, Field(default=None, max_length=50)] = None
    note: Annotated[str | None, Field(default=None, max_length=1000)] = None


# ---- Phase 16: My Materials / Favorites (spec §5.5) ----

FavoriteKind = Literal["favorite", "candidate"]


class FavoriteCreatePayload(BaseModel):
    product_id: UUID
    kind: FavoriteKind


class FavoriteKindUpdatePayload(BaseModel):
    kind: FavoriteKind


class FavoriteProduct(BaseModel):
    id: UUID
    name: str
    maker_name: str | None
    image_url: str | None
    type_name: str | None


class FavoriteListItem(BaseModel):
    id: UUID
    kind: FavoriteKind
    created_at: datetime
    product: FavoriteProduct


class FavoriteListResponse(BaseModel):
    favorites: list[FavoriteListItem]


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


# ─────────────────────────────────────────────────────────────────────
# Events v1 (Sprint 1: 公開閲覧 + reviewer 申込)
# spec docs/specs/events-v1.md §5
# ─────────────────────────────────────────────────────────────────────

EventStatus = Literal["draft", "published", "cancelled"]
EventHostType = Literal["maker", "admin"]


class EventHost(BaseModel):
    """events 一覧 / 詳細に埋め込む host サマリ。Sprint 1 では prefecture / city は
    list レスポンスでは省略し、詳細でのみ返す (SPEC §5.1)。"""

    user_id: UUID
    display_name: str
    host_type: EventHostType
    prefecture: str | None = None
    city: str | None = None


class EventListItem(BaseModel):
    id: UUID
    title: str
    host: EventHost
    starts_at: datetime
    ends_at: datetime
    venue: str | None = None
    online_url: str | None = None
    capacity: int | None = None
    status: EventStatus
    active_registration_count: int = Field(ge=0)


class EventListResponse(BaseModel):
    events: list[EventListItem]


class EventDetailResponse(BaseModel):
    id: UUID
    title: str
    body: str
    host: EventHost
    venue: str | None = None
    online_url: str | None = None
    starts_at: datetime
    ends_at: datetime
    capacity: int | None = None
    status: EventStatus
    active_registration_count: int = Field(ge=0)
    is_full: bool


# ─────────────────────────────────────────────────────────────────────
# Events v1 (Sprint 2: maker CRUD + 申込者一覧)
# spec docs/specs/events-v1.md §5.2 + §9 Sprint 2
# ─────────────────────────────────────────────────────────────────────

# URL の前方一致を ^https?:// に限定する pattern（DB CHECK と一致）。
_HTTP_URL_PATTERN = r"^https?://"


class MakerEventCreateRequest(BaseModel):
    """POST /v1/maker/events のペイロード (SPEC §5.2.2)。

    host_user_id / host_type は payload では受け取らず BFF 側で
    JWT.sub と 'maker' に強制する (書き換え攻撃防止)。
    starts_at / ends_at の前後関係や venue/online_url の片方必須は
    BFF ハンドラ内で検査する (DB CHECK と二層防御)。
    """

    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=20000)
    venue: str | None = Field(default=None, min_length=1, max_length=200)
    online_url: str | None = Field(
        default=None, min_length=1, max_length=500, pattern=_HTTP_URL_PATTERN
    )
    starts_at: datetime
    ends_at: datetime
    capacity: int | None = Field(default=None, gt=0)
    status: EventStatus = "draft"


class MakerEventUpdateRequest(BaseModel):
    """PATCH /v1/maker/events/{id} のペイロード (SPEC §5.2.2)。

    全フィールドが任意 (部分更新)。値を明示的に NULL にしたい場合は明示的に
    null を送る (Pydantic v2 のデフォルトはフィールド未指定でも default=None と
    区別できないため、最低限の v1 セマンティクスとして capacity/venue/online_url
    の null クリアは「明示的に null を送る」運用とする。SPEC §5.2.2 にも整合)。
    """

    title: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, min_length=1, max_length=20000)
    venue: str | None = Field(default=None, max_length=200)
    online_url: str | None = Field(
        default=None, max_length=500, pattern=_HTTP_URL_PATTERN
    )
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    capacity: int | None = Field(default=None, gt=0)
    status: EventStatus | None = None


class MakerEventListItem(BaseModel):
    """GET /v1/maker/events 一覧の 1 行 (SPEC §5.2.1)。"""

    id: UUID
    title: str
    starts_at: datetime
    ends_at: datetime
    venue: str | None = None
    online_url: str | None = None
    capacity: int | None = None
    status: EventStatus
    active_registration_count: int = Field(ge=0)
    created_at: datetime


class MakerEventListResponse(BaseModel):
    events: list[MakerEventListItem]


class MakerEventDetailResponse(BaseModel):
    """GET /v1/maker/events/{id} レスポンス (SPEC §5.2.2)。

    host は自分自身なので最小限 (id / host_type) のみ。
    public 用 EventDetailResponse は status='published' 限定だが、
    こちらは draft / cancelled も含めて owner にだけ返す。
    """

    id: UUID
    title: str
    body: str
    host_user_id: UUID
    host_type: EventHostType
    venue: str | None = None
    online_url: str | None = None
    starts_at: datetime
    ends_at: datetime
    capacity: int | None = None
    status: EventStatus
    active_registration_count: int = Field(ge=0)
    created_at: datetime
    updated_at: datetime


class MakerEventRegistration(BaseModel):
    """GET /v1/maker/events/{id}/registrations の 1 行 (SPEC §5.2.3)。"""

    id: UUID
    user_id: UUID
    display_name: str | None = None
    role: str
    registered_at: datetime
    cancelled_at: datetime | None = None


class MakerEventRegistrationsResponse(BaseModel):
    registrations: list[MakerEventRegistration]
    active_count: int = Field(ge=0)
    cancelled_count: int = Field(ge=0)


# ─────────────────────────────────────────────────────────────────────
# Events v1 (Sprint 3: 暗黙フォロワー API)
# spec docs/specs/events-v1.md §5.4 + §9 Sprint 3
# ─────────────────────────────────────────────────────────────────────


class FollowedMaker(BaseModel):
    """GET /v1/me/followed-makers の 1 行 (SPEC §5.4)。

    user_favorites.kind='favorite' で自分が保存している製品の
    maker (user) を distinct で返す。display_name は
    maker_profiles.company_name 優先、無ければ users.name フォールバック。
    """

    user_id: UUID
    display_name: str


class FollowedMakersResponse(BaseModel):
    """暗黙フォロワー (自分が favorite した製品の maker 集合) のレスポンス。"""

    manufacturer_ids: list[UUID]
    manufacturers: list[FollowedMaker]


# ─────────────────────────────────────────────────────────────────────
# Events v1 (Sprint 3: maker_email_campaigns)
# spec docs/specs/events-v1.md §4.4 / §5.3 / §9 Sprint 3
# Ryoga 確定:
#   C6 favorite_followers は kind='favorite' のみ
#   C7 send pre-flight で recipient 0 件は 422
#   C9 event_past_attendees は自社 event のみ
#   C10 specific_users は最大 1000 件
# ─────────────────────────────────────────────────────────────────────


CampaignSegmentType = Literal[
    "favorite_followers", "event_past_attendees", "specific_users"
]

CampaignStatus = Literal["draft", "queued", "sent", "failed"]


class FavoriteFollowersFilter(BaseModel):
    """segment_type='favorite_followers' の segment_filter (SPEC §4.4)。

    追加の絞り込みフィールドは持たない (自社製品を favorite した reviewer 全員)。
    """

    segment_type: Literal["favorite_followers"]


class EventPastAttendeesFilter(BaseModel):
    """segment_type='event_past_attendees' の segment_filter (SPEC §4.4)。

    event_id は **自社主催 event** のみ受理 (Ryoga C9)。
    BFF send 時に host_user_id=JWT.sub を再検証する。
    """

    segment_type: Literal["event_past_attendees"]
    event_id: UUID


class SpecificUsersFilter(BaseModel):
    """segment_type='specific_users' の segment_filter (SPEC §4.4)。

    Ryoga C10: 最大 1000 件。1 件以上必須。
    """

    segment_type: Literal["specific_users"]
    user_ids: list[UUID] = Field(min_length=1, max_length=1000)


SegmentFilter = Annotated[
    FavoriteFollowersFilter | EventPastAttendeesFilter | SpecificUsersFilter,
    Field(discriminator="segment_type"),
]


class MakerEmailCampaignCreatePayload(BaseModel):
    """POST /v1/maker/emails/campaigns のペイロード (SPEC §5.3.2)。

    maker_user_id / status は payload では受け取らず BFF 側で
    JWT.sub と 'draft' に強制する (書き換え攻撃防止 + DOA)。
    segment_type と segment_filter.segment_type の不一致は Pydantic
    discriminator バリデーションで自動的に弾かれる。
    """

    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=20000)
    segment_type: CampaignSegmentType
    segment_filter: SegmentFilter


class MakerEmailCampaignUpdatePayload(BaseModel):
    """PATCH /v1/maker/emails/campaigns/{id} のペイロード (SPEC §5.3.3)。

    status='draft' の campaign のみ編集可能 (BFF 側で第一防御)。
    """

    subject: str | None = Field(default=None, min_length=1, max_length=200)
    body: str | None = Field(default=None, min_length=1, max_length=20000)
    segment_type: CampaignSegmentType | None = None
    segment_filter: SegmentFilter | None = None


class MakerEmailCampaignListItem(BaseModel):
    """GET /v1/maker/emails/campaigns の 1 行 (SPEC §5.3.1)。"""

    id: UUID
    subject: str
    segment_type: CampaignSegmentType
    status: CampaignStatus
    recipient_count: int = Field(ge=0)
    created_at: datetime
    queued_at: datetime | None = None
    sent_at: datetime | None = None


class MakerEmailCampaignListResponse(BaseModel):
    campaigns: list[MakerEmailCampaignListItem]


class MakerEmailCampaignDetailResponse(BaseModel):
    """GET /v1/maker/emails/campaigns/{id} (SPEC §5.3)。

    segment_filter は jsonb のまま透過させる (UI 側で discriminator 読み)。
    """

    id: UUID
    maker_user_id: UUID
    subject: str
    body: str
    segment_type: CampaignSegmentType
    segment_filter: dict
    status: CampaignStatus
    recipient_count: int = Field(ge=0)
    queued_at: datetime | None = None
    sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class MakerEmailCampaignSendResponse(BaseModel):
    """POST /v1/maker/emails/campaigns/{id}/send (SPEC §5.3.4)。

    実送信はせず status='queued' に遷移するのみ。recipient_count は
    送信予定件数 (BFF 計算)。
    """

    ok: bool
    status: CampaignStatus
    recipient_count: int = Field(ge=0)

// spec: docs/specs/maker-approval-admin.md §5.8 + admin-aglist-alignment-v2.md §3
// gen:types 未適用のため admin BFF レスポンス型は本ファイルで手書き定義する。
// gen:types 実行後に database.types.ts ベースへ切り替え予定。

export interface AdminSummary {
  pending_makers_count: number;
  active_makers_count: number;
  rejected_makers_count: number;
  total_users_count: number;
  // admin-aglist-alignment-v2.md §3.4
  products_total: number;
  products_public_total: number;
  // レビュー承認フロー (2026-06-13): 承認待ちレビュー件数
  pending_reviews_count: number;
}

export interface PendingMaker {
  user_id: string;
  name: string;
  email: string;
  company_name: string | null;
  prefecture: string | null;
  city: string | null;
  note: string | null;
  created_at: string;
}

export interface PendingMakersResponse {
  makers: PendingMaker[];
  total: number;
}

export interface AdminMakerActionResp {
  ok: true;
  user_id: string;
  status: "active" | "rejected";
}

// ─────────────────────────────────────────────────────────────────────
// admin-aglist-alignment-v2.md §3.1 / §3.2 / §2.2
// ─────────────────────────────────────────────────────────────────────

export interface AdminMakerOption {
  user_id: string;
  name: string;
  company_name: string | null;
}

export interface AdminMakersResponse {
  makers: AdminMakerOption[];
}

// B6 admin users 一覧 (spec maker-approval-admin.md §5.5)
export interface AdminUserListItem {
  user_id: string;
  email: string | null;
  name: string;
  role: UserRole;
  status: UserAccountStatus;
  created_at: string;
  pending_report_count: number;
  is_deleted: boolean;
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  total: number;
  page: number;
  per_page: number;
}

export type ReportReason =
  | "spam"
  | "abuse"
  | "impersonation"
  | "inappropriate"
  | "other";

export type ReportStatus = "pending" | "resolved" | "spam" | "dismissed";

export interface AdminReportItem {
  id: string;
  reporter_user_id: string | null;
  reporter_name: string | null;
  target_user_id: string;
  target_name: string | null;
  reason: ReportReason;
  body: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
}

export interface AdminReportListResponse {
  reports: AdminReportItem[];
  total: number;
  page: number;
  per_page: number;
}

// ─────────────────────────────────────────────────────────────────────
// レビュー承認フロー (2026-06-13 / 奥田さん指示 6-15 定例)
// reviews.status: pending → approved / rejected
// ─────────────────────────────────────────────────────────────────────

export type ReviewModerationStatus = "pending" | "approved" | "rejected";

export interface AdminReviewItem {
  id: string;
  product_id: string;
  product_name: string | null;
  user_id: string;
  user_name: string | null;
  rating: number;
  body: string;
  status: ReviewModerationStatus;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
}

export interface AdminReviewListResponse {
  reviews: AdminReviewItem[];
  total: number;
  page: number;
  per_page: number;
}

// /v1/admin/users/{id}/role POST payload。
// 既存 backend POST endpoint は ASSIGNABLE_ROLES = admin / ja_staff / researcher のみ受け付ける。
export type AdminAssignableRole = "admin" | "ja_staff" | "researcher";

// DB CHECK 制約 (supabase/migrations/20260514100001_users_status.sql) と一致。
// status は users 全員 (role を問わず) に付与される列、4 値のみ。
export type UserAccountStatus =
  | "active"
  | "pending_review"
  | "rejected"
  | "frozen";

// admin / ja_staff / researcher / unassigned を含む全 role。
// DB CHECK は farmer / maker / ja_staff / researcher / admin / unassigned。
export type UserRole =
  | "admin"
  | "farmer"
  | "maker"
  | "ja_staff"
  | "researcher"
  | "unassigned";

// 既存 admin/products F1 で利用する maker 限定の status 表示用 alias。
export type MakerAccountStatus = UserAccountStatus;

export interface AdminProductListItem {
  id: string;
  name: string;
  product_name_jp: string | null;
  maker_id: string | null;
  maker_name: string | null;
  // users.status (ADR-0009 整合)。F1 一覧で active 以外を可視化するため。
  maker_status: MakerAccountStatus | null;
  product_type_id: string | null;
  product_type_name: string | null;
  commercial_status: string | null;
  is_public: boolean;
  confidence: string | null;
  thumbnail_url: string | null;
  updated_at: string;
  created_at: string;
}

export interface AdminProductListResponse {
  products: AdminProductListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminProductImageItem {
  id: string;
  url: string;
  order: number;
  source_page_url: string | null;
  alt_text: string | null;
  image_type: string | null;
  is_primary: boolean;
  rights_note: string | null;
  confidence: string | null;
}

export interface AdminProductRecipeItem {
  id: string;
  crop_category: string | null;
  crop_name: string | null;
  cultivation_type: string | null;
  application_method: string | null;
  application_timing: string | null;
  growth_stage: string | null;
  dilution_rate: string | null;
  dose_raw_text: string | null;
  dose_amount: number | null;
  dose_unit: string | null;
  dose_basis: string | null;
  solution_amount: string | null;
  original_liquid_equivalent: string | null;
  max_dose_raw_text: string | null;
  max_dose_amount: number | null;
  max_dose_unit: string | null;
  usage_notes: string | null;
  precautions_specific: string | null;
  confidence: string | null;
  sort_order: number;
}

export interface AdminProductRelationItem {
  id: string;
  name: string;
  category: string | null;
}

export interface AdminProductDetail {
  id: string;
  name: string;
  product_name_jp: string | null;
  maker_id: string | null;
  maker_name: string | null;
  product_type_id: string | null;
  product_type_name: string | null;
  commercial_status: string | null;
  is_public: boolean;
  general_purpose: string | null;
  primary_compound: string | null;
  mode_of_action: string | null;
  technology_action: string | null;
  disease_pest_info: string | null;
  expected_effects_official: string | null;
  expected_effects_farmille: string | null;
  usage_summary: string | null;
  precautions: string | null;
  storage_shelf_life: string | null;
  notes: string | null;
  confidence: string | null;
  fertilizer_registered: boolean | null;
  pesticide_registered: boolean | null;
  label_url: string | null;
  sds_url: string | null;
  crops: AdminProductRelationItem[];
  certifications: AdminProductRelationItem[];
  benefits: AdminProductRelationItem[];
  images: AdminProductImageItem[];
  recipes: AdminProductRecipeItem[];
  created_at: string;
  updated_at: string;
}

export interface AdminProductImageInput {
  url: string;
  order: number;
  source_page_url?: string | null;
  alt_text?: string | null;
  image_type?:
    | "product_packaging"
    | "product_logo"
    | "application_scene"
    | "other"
    | null;
  is_primary?: boolean;
  rights_note?: string | null;
  confidence?: string | null;
}

export interface AdminProductUpdatePayload {
  name: string;
  product_name_jp?: string | null;
  product_type_id?: string | null;
  commercial_status?: string | null;
  is_public: boolean;
  general_purpose?: string | null;
  primary_compound?: string | null;
  mode_of_action?: string | null;
  technology_action?: string | null;
  disease_pest_info?: string | null;
  expected_effects_official?: string | null;
  expected_effects_farmille?: string | null;
  usage_summary?: string | null;
  precautions?: string | null;
  storage_shelf_life?: string | null;
  notes?: string | null;
  confidence?: string | null;
  fertilizer_registered?: boolean | null;
  pesticide_registered?: boolean | null;
  label_url?: string | null;
  sds_url?: string | null;
  crop_ids: string[];
  certification_ids: string[];
  benefit_ids: string[];
  images?: AdminProductImageInput[] | null;
}

// ─────────────────────────────────────────────────────────────────────
// Admin Articles CMS (ADR-0014 / docs/drafts/admin-articles-cms-spec.md)
// 手書き型 (gen:types 適用後も admin BFF レスポンスは本ファイルで型付けする方針)。
// ─────────────────────────────────────────────────────────────────────

// articles.category の DB CHECK 制約 (migration 20260502120000) と一致。
export type ArticleCategory =
  | "monthly_report"
  | "weekly_report"
  | "featured"
  | "column";

export interface AdminArticleListItem {
  id: string;
  slug: string;
  title: string;
  category: ArticleCategory;
  hero_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminArticleListResponse {
  articles: AdminArticleListItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminArticleDetail {
  id: string;
  slug: string;
  title: string;
  body_md: string;
  category: ArticleCategory;
  hero_image_url: string | null;
  author_user_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// POST /api/admin/articles payload (作成)。author_user_id は backend が JWT から強制。
export interface AdminArticleCreatePayload {
  slug: string;
  title: string;
  body_md: string;
  category: ArticleCategory;
  hero_image_url?: string | null;
  published_at?: string | null;
}

// PATCH /api/admin/articles/{id} payload (部分更新、全 optional)。
// published_at は null で「非公開化」、キー省略で「変更なし」を表す (backend と整合)。
export interface AdminArticlePatchPayload {
  slug?: string;
  title?: string;
  body_md?: string;
  category?: ArticleCategory;
  hero_image_url?: string | null;
  published_at?: string | null;
}

// 共通マスタ (既存 /v1/crops/tree などのレスポンス)。
export interface CropNode {
  id: string;
  name: string;
}

export interface CropL2Node extends CropNode {
  children: CropNode[];
}

export interface CropL1Node extends CropNode {
  children: CropL2Node[];
}

export interface CropsTreeResponse {
  tree: CropL1Node[];
}

export interface CertificationOption {
  id: string;
  name: string;
}

export interface CertificationsResponse {
  certifications: CertificationOption[];
}

export interface ProductBenefitOption {
  id: string;
  name: string;
  category: string | null;
  sort_order: number | null;
}

export interface ProductBenefitsResponse {
  product_benefits: ProductBenefitOption[];
}

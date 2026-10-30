import * as v from "valibot";

import type { Database } from "@/types/database.types";

type MaterialSelection = Pick<
  Database["public"]["Tables"]["materials"]["Row"],
  "avg_rating" | "id" | "manufacturer_name" | "name" | "review_count" | "seller_id"
>;

type ReviewSelection = Pick<
  Database["public"]["Tables"]["reviews"]["Row"],
  "author_user_id" | "body" | "id" | "material_id" | "rating" | "status"
>;

type UsageReportSelection = Pick<
  Database["public"]["Tables"]["usage_reports"]["Row"],
  "author_user_id" | "id" | "material_id" | "status" | "title"
>;

type UsageReportPlotSelection = Pick<
  Database["public"]["Tables"]["usage_report_plots"]["Row"],
  "name" | "treatment" | "variety_id"
>;

type ProfileReference = Pick<Database["public"]["Tables"]["profiles"]["Row"], "user_id">;

type CropSelection = Pick<Database["public"]["Tables"]["crops"]["Row"], "id" | "name">;

type ProductTypeSelection = Pick<
  Database["public"]["Tables"]["product_types"]["Row"],
  "id" | "name"
>;

type SellerAccountReference = Pick<
  Database["public"]["Tables"]["seller_accounts"]["Row"],
  "auth_user_id" | "id"
>;

type SellerApprovalState = Pick<
  Database["public"]["Tables"]["seller_accounts"]["Row"],
  "auth_user_id" | "status"
>;

type ContentReportState = Pick<
  Database["public"]["Tables"]["content_reports"]["Row"],
  "reporter_user_id" | "status" | "target_id" | "target_type"
>;

const UuidSchema = v.pipe(v.string(), v.uuid());

const AuthUserSchema = v.object({
  id: UuidSchema,
  email: v.optional(v.string()),
});

const AuthUserListSchema = v.object({ users: v.array(AuthUserSchema) });

type AuthUser = v.InferOutput<typeof AuthUserSchema>;

export type GeneralUser = {
  id: string;
  email: string;
  password: string;
  handle: string;
};

export type SellerAccount = {
  id: string;
  authUserId: string;
  loginId: string;
  password: string;
  officialName: string;
};

const MaterialSchema = v.object({
  id: UuidSchema,
  name: v.string(),
  manufacturer_name: v.string(),
  review_count: v.number(),
  avg_rating: v.nullable(v.number()),
  seller_id: v.nullable(UuidSchema),
}) satisfies v.GenericSchema<MaterialSelection>;

const ReviewSchema = v.object({
  id: UuidSchema,
  material_id: UuidSchema,
  author_user_id: UuidSchema,
  rating: v.number(),
  body: v.string(),
  status: v.string(),
}) satisfies v.GenericSchema<ReviewSelection>;

const UsageReportSchema = v.object({
  id: UuidSchema,
  material_id: UuidSchema,
  author_user_id: UuidSchema,
  title: v.nullable(v.string()),
  status: v.string(),
}) satisfies v.GenericSchema<UsageReportSelection>;

const UsageReportPlotSchema = v.object({
  name: v.string(),
  treatment: v.nullable(v.string()),
  variety_id: v.nullable(UuidSchema),
}) satisfies v.GenericSchema<UsageReportPlotSelection>;

const NamedSchema = v.object({ id: UuidSchema, name: v.string() });
const IdSchema = v.object({ id: UuidSchema });

const ProfileReferenceSchema = v.object({
  user_id: UuidSchema,
}) satisfies v.GenericSchema<ProfileReference>;

const CropSchema = v.object({
  id: UuidSchema,
  name: v.string(),
}) satisfies v.GenericSchema<CropSelection>;

const ReviewCropNameRelationSchema = v.object({
  sort_order: v.number(),
  crop: v.object({ name: v.string() }),
});

const ProductTypeSchema = v.object({
  id: UuidSchema,
  name: v.string(),
}) satisfies v.GenericSchema<ProductTypeSelection>;

const SellerAccountReferenceSchema = v.object({
  id: UuidSchema,
  auth_user_id: v.nullable(UuidSchema),
}) satisfies v.GenericSchema<SellerAccountReference>;

const SellerApprovalStateSchema = v.object({
  auth_user_id: v.nullable(UuidSchema),
  status: v.string(),
}) satisfies v.GenericSchema<SellerApprovalState>;

const ContentReportStateSchema = v.object({
  reporter_user_id: UuidSchema,
  status: v.string(),
  target_id: UuidSchema,
  target_type: v.string(),
}) satisfies v.GenericSchema<ContentReportState>;

export type Material = v.InferOutput<typeof MaterialSchema>;

export type Review = v.InferOutput<typeof ReviewSchema>;

export type UsageReport = v.InferOutput<typeof UsageReportSchema>;

export type SellerApproval = v.InferOutput<typeof SellerApprovalStateSchema>;

export type ContentReport = v.InferOutput<typeof ContentReportStateSchema>;

type RestInsertTable =
  | "catalog_import_runs"
  | "material_page_versions"
  | "material_page_links"
  | "material_ingredient_categories"
  | "material_crops"
  | "material_product_types"
  | "materials"
  | "profiles"
  | "reviews"
  | "seller_accounts"
  | "usage_reports";

type RestInsertBody<Table extends RestInsertTable> = Database["public"]["Tables"][Table]["Insert"];

const GENERAL_PASSWORD = "Farmille-E2E-General-2026!";
const SELLER_PASSWORD = "Farmille-E2E-Seller-2026!";
const E2E_TOKEN_PREFIX = "e2e-";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    throw new Error(`E2E に必要な環境変数 ${name} が設定されていません。`);
  }

  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = requireEnv("SUPABASE_SECRET_KEY");

if (new URL(supabaseUrl).origin !== "http://127.0.0.1:54321") {
  throw new Error("E2E データ操作はローカル Supabase に対してのみ実行できます。");
}

function adminHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("apikey", secretKey);
  headers.set("Authorization", `Bearer ${secretKey}`);

  return headers;
}

async function checkedFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(new URL(path, supabaseUrl), {
    ...init,
    headers: adminHeaders(init?.headers),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `${init?.method ?? "GET"} ${path} が失敗しました（${response.status}）：${body}`,
    );
  }

  return response;
}

async function jsonRequest<TSchema extends v.GenericSchema>(
  schema: TSchema,
  path: string,
  init?: RequestInit,
): Promise<v.InferOutput<TSchema>> {
  const response = await checkedFetch(path, init);
  const result = v.safeParse(schema, await response.json());

  if (!result.success) {
    throw new Error(`${path} のレスポンス形式が不正です：${v.summarize(result.issues)}`);
  }

  return result.output;
}

function restPath(table: string, params?: URLSearchParams): string {
  const query = params?.toString();

  return `/rest/v1/${table}${query === undefined || query.length === 0 ? "" : `?${query}`}`;
}

async function restSelect<TSchema extends v.GenericSchema>(
  rowSchema: TSchema,
  table: string,
  params: URLSearchParams,
): Promise<Array<v.InferOutput<TSchema>>> {
  return jsonRequest(v.array(rowSchema), restPath(table, params));
}

async function restInsert<TSchema extends v.GenericSchema, Table extends RestInsertTable>(
  rowSchema: TSchema,
  table: Table,
  body: RestInsertBody<Table>,
): Promise<v.InferOutput<TSchema>> {
  const rows = await jsonRequest(v.array(rowSchema), restPath(table), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  const row = rows[0];

  if (row === undefined) {
    throw new Error(`${table} の INSERT 結果が空です。`);
  }

  return row;
}

async function authUsersByEmail(email: string): Promise<AuthUser[]> {
  const payload = await jsonRequest(
    AuthUserListSchema,
    "/auth/v1/admin/users?page=1&per_page=1000",
  );

  return payload.users.filter((user) => user.email === email);
}

export async function cleanupOwnedE2eData(): Promise<void> {
  const sellerLookupParams = new URLSearchParams({
    select: "id,auth_user_id",
    login_id: `like.${E2E_TOKEN_PREFIX}*`,
  });

  const sellers = await restSelect(
    SellerAccountReferenceSchema,
    "seller_accounts",
    sellerLookupParams,
  );

  for (const seller of sellers) {
    const requestParams = new URLSearchParams({ seller_id: `eq.${seller.id}` });
    await checkedFetch(restPath("material_change_requests", requestParams), { method: "DELETE" });
  }

  const materialParams = new URLSearchParams({
    select: "id",
    name: `like.E2E資材_${E2E_TOKEN_PREFIX}*`,
  });

  for (const material of await restSelect(IdSchema, "materials", materialParams)) {
    await deleteMaterial(material.id);
  }

  const sellerParams = new URLSearchParams({ login_id: `like.${E2E_TOKEN_PREFIX}*` });
  await checkedFetch(restPath("seller_accounts", sellerParams), { method: "DELETE" });

  const payload = await jsonRequest(
    AuthUserListSchema,
    "/auth/v1/admin/users?page=1&per_page=1000",
  );

  const ownedUsers = payload.users.filter((user) => user.email?.startsWith(E2E_TOKEN_PREFIX));

  for (const user of ownedUsers) {
    await deleteAuthUser(user.id);
  }
}

export async function deleteAuthUsersByEmail(email: string): Promise<void> {
  const users = await authUsersByEmail(email);

  for (const user of users) {
    await checkedFetch(`/auth/v1/admin/users/${user.id}`, { method: "DELETE" });
  }
}

export async function deleteAuthUser(userId: string): Promise<void> {
  await checkedFetch(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
}

export async function deleteAvatars(userId: string): Promise<void> {
  const files = await jsonRequest(
    v.array(v.object({ name: v.string() })),
    "/storage/v1/object/list/avatars",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: userId }),
    },
  );

  if (files.length === 0) return;
  await checkedFetch("/storage/v1/object/avatars", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: files.map((file) => `${userId}/${file.name}`) }),
  });
}

async function createAuthUser(
  email: string,
  password: string,
  accountType: "general" | "seller",
): Promise<AuthUser> {
  await deleteAuthUsersByEmail(email);

  return jsonRequest(AuthUserSchema, "/auth/v1/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: { account_type: accountType },
    }),
  });
}

export function uniqueToken(prefix: string): string {
  const suffix = `${Date.now().toString(36)}${crypto.randomUUID().slice(0, 8)}`.toLowerCase();

  return `${E2E_TOKEN_PREFIX}${prefix}-${suffix}`;
}

export async function createGeneralUser(prefix: string): Promise<GeneralUser> {
  const token = uniqueToken(prefix);
  const email = `${token}@example.test`;
  const handle = `E2E_${token}`.slice(0, 30);
  const authUser = await createAuthUser(email, GENERAL_PASSWORD, "general");

  await restInsert(ProfileReferenceSchema, "profiles", {
    user_id: authUser.id,
    handle,
    standpoint: "farmer",
  });

  return {
    id: authUser.id,
    email,
    password: GENERAL_PASSWORD,
    handle,
  };
}

export async function createApprovedSeller(prefix: string): Promise<SellerAccount> {
  const loginId = uniqueToken(prefix).slice(0, 30);
  const email = `${loginId}@sellers.farmille.internal`;
  const officialName = `E2E ${loginId}株式会社`;
  const authUser = await createAuthUser(email, SELLER_PASSWORD, "seller");

  const seller = await restInsert(IdSchema, "seller_accounts", {
    auth_user_id: authUser.id,
    official_name: officialName,
    login_id: loginId,
    contact_email: `${loginId}@example.test`,
    contact_name: "E2E 担当者",
    location: "東京都千代田区",
    region_scope: "全国",
    status: "approved",
    approved_at: new Date().toISOString(),
  });

  await checkedFetch(`/auth/v1/admin/users/${authUser.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_metadata: { account_type: "seller", seller_id: seller.id },
    }),
  });

  return {
    id: seller.id,
    authUserId: authUser.id,
    loginId,
    password: SELLER_PASSWORD,
    officialName,
  };
}

export async function cleanupSellerByLoginId(loginId: string): Promise<void> {
  const params = new URLSearchParams({
    select: "id,auth_user_id",
    login_id: `eq.${loginId}`,
  });

  const sellers = await restSelect(SellerAccountReferenceSchema, "seller_accounts", params);

  for (const seller of sellers) {
    const requestParams = new URLSearchParams({ seller_id: `eq.${seller.id}` });
    await checkedFetch(restPath("material_change_requests", requestParams), { method: "DELETE" });
    const deleteParams = new URLSearchParams({ id: `eq.${seller.id}` });
    await checkedFetch(restPath("seller_accounts", deleteParams), { method: "DELETE" });

    if (seller.auth_user_id !== null) {
      await deleteAuthUser(seller.auth_user_id);
    }
  }
}

export async function sellerApprovalByLoginId(loginId: string): Promise<SellerApproval | null> {
  const params = new URLSearchParams({
    select: "auth_user_id,status",
    login_id: `eq.${loginId}`,
    limit: "1",
  });

  const sellers = await restSelect(SellerApprovalStateSchema, "seller_accounts", params);

  return sellers[0] ?? null;
}

export async function sellerLoginIdByOfficialName(officialName: string): Promise<string> {
  const params = new URLSearchParams({
    select: "login_id",
    official_name: `eq.${officialName}`,
    limit: "1",
  });

  const sellers = await restSelect(v.object({ login_id: v.string() }), "seller_accounts", params);

  if (sellers[0] === undefined) throw new Error("申請済みメーカーが見つかりません。");

  return sellers[0].login_id;
}

export async function createMaterial(
  prefix: string,
  sellerId: string | null = null,
  manufacturerName?: string,
): Promise<Material> {
  const token = uniqueToken(prefix);

  return restInsert(MaterialSchema, "materials", {
    name: `E2E資材_${token}`,
    manufacturer_name: manufacturerName ?? `E2Eメーカー_${token}`,
    sales_status: "販売中",
    seller_id: sellerId,
  });
}

export async function seedCatalogMaterial(materialId: string): Promise<void> {
  const material = await getMaterial(materialId);

  if (!material.name.startsWith(`E2E資材_${E2E_TOKEN_PREFIX}`))
    throw new Error("E2E以外の資材は変更できません。");
  const hash = materialId.replaceAll("-", "").repeat(2);
  await restInsert(IdSchema, "catalog_import_runs", {
    id: materialId,
    source_sha256: hash,
    plan_sha256: hash,
  });

  const version = await restInsert(IdSchema, "material_page_versions", {
    material_id: materialId,
    base_revision: 0,
    status: "published",
    origin: "catalog",
    catalog_import_run_id: materialId,
    description: "取り込み済みの製品説明",
    content_contract: 2,
  });

  await checkedFetch(restPath("material_page_related_companies"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      version_id: version.id,
      sort_order: 0,
      company_name: material.manufacturer_name,
    } satisfies Database["public"]["Tables"]["material_page_related_companies"]["Insert"]),
  });

  for (const [sortOrder, group, title] of [
    [0, "overview", "取り込み資料（削除対象）"],
    [1, "public_trial", "取り込み試験資料"],
  ] as const) {
    await restInsert(IdSchema, "material_page_links", {
      version_id: version.id,
      sort_order: sortOrder,
      group_name: group,
      title,
      url: `https://example.com/imported-${group}.pdf`,
    });
  }

  await checkedFetch(restPath("materials", new URLSearchParams({ id: `eq.${materialId}` })), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      published_page_version_id: version.id,
      container_type_id: 2,
      official_name: "Catalog Material Official",
      name_reading: "カタログシザイ",
    }),
  });
}

export async function archiveMaterial(materialId: string): Promise<void> {
  const material = await getMaterial(materialId);

  if (!material.name.startsWith(`E2E資材_${E2E_TOKEN_PREFIX}`)) {
    throw new Error("E2E以外の資材は変更できません。");
  }

  await checkedFetch(restPath("materials", new URLSearchParams({ id: `eq.${materialId}` })), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publication_status: "archived", archived_at: new Date().toISOString() }),
  });
}

export async function deleteMaterial(materialId: string): Promise<void> {
  // 書類・原稿の証跡は本番では保持する。使い捨てE2E資材だけを参照順に片付ける。
  const material = await getMaterial(materialId);

  if (!material.name.startsWith(`E2E資材_${E2E_TOKEN_PREFIX}`)) {
    throw new Error("E2E以外の資材は削除できません。");
  }

  const materialFilter = new URLSearchParams({ material_id: `eq.${materialId}` });
  await checkedFetch(restPath("material_page_audits", materialFilter), { method: "DELETE" });

  const versions = await restSelect(
    IdSchema,
    "material_page_versions",
    new URLSearchParams({ select: "id", material_id: `eq.${materialId}` }),
  );

  for (const version of versions) {
    await checkedFetch(
      restPath(
        "material_page_existing_images",
        new URLSearchParams({ version_id: `eq.${version.id}` }),
      ),
      { method: "DELETE" },
    );
  }

  await checkedFetch(restPath("materials", new URLSearchParams({ id: `eq.${materialId}` })), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ published_page_version_id: null }),
  });

  for (const table of [
    "material_page_versions",
    "material_editor_grants",
    "material_editor_legacy_links",
  ]) {
    await checkedFetch(restPath(table, materialFilter), { method: "DELETE" });
  }

  await checkedFetch(
    restPath("catalog_import_runs", new URLSearchParams({ id: `eq.${materialId}` })),
    { method: "DELETE" },
  );
  const targetRequestParams = new URLSearchParams({ material_id: `eq.${materialId}` });
  await checkedFetch(restPath("material_change_requests", targetRequestParams), {
    method: "DELETE",
  });
  const resultRequestParams = new URLSearchParams({ result_material_id: `eq.${materialId}` });
  await checkedFetch(restPath("material_change_requests", resultRequestParams), {
    method: "DELETE",
  });
  const params = new URLSearchParams({ id: `eq.${materialId}` });
  await checkedFetch(restPath("materials", params), { method: "DELETE" });
}

export async function addMaterialClassifications(
  materialId: string,
  input: {
    cropIds?: readonly string[];
    productTypeIds?: readonly string[];
    genreIds?: readonly string[];
  },
): Promise<void> {
  await Promise.all([
    ...(input.genreIds ?? []).map((id) =>
      restInsert(IdSchema, "material_ingredient_categories", {
        material_id: materialId,
        ingredient_category_id: id,
      }),
    ),
    ...(input.cropIds ?? []).map((cropId, sortOrder) =>
      restInsert(IdSchema, "material_crops", {
        material_id: materialId,
        crop_id: cropId,
        source_name: "E2E対象作物",
        sort_order: sortOrder,
      }),
    ),
    ...(input.productTypeIds ?? []).map((productTypeId) =>
      restInsert(IdSchema, "material_product_types", {
        material_id: materialId,
        product_type_id: productTypeId,
      }),
    ),
  ]);
}

export async function getMaterial(materialId: string): Promise<Material> {
  const params = new URLSearchParams({
    select: "id,name,manufacturer_name,review_count,avg_rating,seller_id",
    id: `eq.${materialId}`,
  });

  const rows = await restSelect(MaterialSchema, "materials", params);
  const material = rows[0];

  if (material === undefined) {
    throw new Error(`資材 ${materialId} が見つかりません。`);
  }

  return material;
}

export async function firstCrop(): Promise<v.InferOutput<typeof CropSchema>> {
  const params = new URLSearchParams({
    select: "id,name",
    name: "eq.トマト",
    limit: "1",
  });

  const rows = await restSelect(CropSchema, "crops", params);
  const crop = rows[0];

  if (crop === undefined) {
    throw new Error("E2E 用の作物「トマト」が見つかりません。");
  }

  return crop;
}

export async function createReview(input: {
  materialId: string;
  authorUserId: string;
  rating: number;
  body: string;
}): Promise<Review> {
  const crop = await firstCrop();

  const reviewId = await jsonRequest(UuidSchema, "/rest/v1/rpc/create_review_with_crops", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      p_material_id: input.materialId,
      p_author_user_id: input.authorUserId,
      p_rating: input.rating,
      p_body: input.body,
      p_crop_ids: [crop.id],
      p_has_control_plot: false,
      p_purchase_channel: null,
      p_pesticide_ack: true,
    }),
  });

  const params = new URLSearchParams({
    select: "id,material_id,author_user_id,rating,body,status",
    id: `eq.${reviewId}`,
  });

  const rows = await restSelect(ReviewSchema, "reviews", params);
  const review = rows[0];

  if (review === undefined) {
    throw new Error(`作成した感想口コミ ${reviewId} が見つかりません。`);
  }

  return review;
}

export async function reviewByAuthor(authorUserId: string): Promise<Review | null> {
  const params = new URLSearchParams({
    select: "id,material_id,author_user_id,rating,body,status",
    author_user_id: `eq.${authorUserId}`,
    limit: "1",
  });

  const rows = await restSelect(ReviewSchema, "reviews", params);

  return rows[0] ?? null;
}

export async function contentReportByTarget(
  reporterUserId: string,
  targetType: string,
  targetId: string,
): Promise<ContentReport | null> {
  const params = new URLSearchParams({
    select: "reporter_user_id,status,target_id,target_type",
    reporter_user_id: `eq.${reporterUserId}`,
    target_type: `eq.${targetType}`,
    target_id: `eq.${targetId}`,
    order: "created_at.desc",
    limit: "1",
  });

  const reports = await restSelect(ContentReportStateSchema, "content_reports", params);

  return reports[0] ?? null;
}

export async function reviewCropNames(reviewId: string): Promise<string[]> {
  const params = new URLSearchParams({
    select: "sort_order,crop:crops!review_crops_crop_id_fkey(name)",
    review_id: `eq.${reviewId}`,
    order: "sort_order.asc",
  });

  const rows = await restSelect(ReviewCropNameRelationSchema, "review_crops", params);

  return rows.map(({ crop }) => crop.name);
}

/** 指定ユーザーが押した「参考になった」の件数。 */
export async function helpfulVoteCount(userId: string): Promise<number> {
  const params = new URLSearchParams({
    select: "id",
    user_id: `eq.${userId}`,
  });

  const rows = await restSelect(IdSchema, "helpful_votes", params);

  return rows.length;
}

/** 指定の感想口コミについて記録された閲覧（view_events）の件数。 */
export async function reviewViewEventCount(reviewId: string): Promise<number> {
  const params = new URLSearchParams({
    select: "id",
    target_type: "eq.review",
    target_id: `eq.${reviewId}`,
  });

  const rows = await restSelect(IdSchema, "view_events", params);

  return rows.length;
}

export async function createPendingUsageReport(input: {
  materialId: string;
  authorUserId: string;
  title: string;
}): Promise<UsageReport> {
  const crop = await firstCrop();

  return restInsert(UsageReportSchema, "usage_reports", {
    material_id: input.materialId,
    author_user_id: input.authorUserId,
    title: input.title,
    status: "pending",
    crop_id: crop.id,
    purpose_tags: ["樹勢改善"],
    prefecture_code: 13,
    cultivation_type: "露地栽培",
    cultivation_tags: ["土耕"],
    growth_stage: "栄養生長期",
    observed_change: "E2E 編集局確認用の観察結果",
    summary: "E2E 編集局確認用のまとめ",
    pesticide_ack: true,
  });
}

export async function createPublishedUsageReport(input: {
  materialId: string;
  authorUserId: string;
  title: string;
  observedChange: string;
}) {
  const crop = await firstCrop();

  return restInsert(UsageReportSchema, "usage_reports", {
    material_id: input.materialId,
    author_user_id: input.authorUserId,
    title: input.title,
    status: "published",
    published_at: new Date().toISOString(),
    crop_id: crop.id,
    observed_change: input.observedChange,
    summary: "公開一覧の要約です。",
    pesticide_ack: true,
  });
}

export async function usageReportByAuthor(authorUserId: string): Promise<UsageReport | null> {
  const params = new URLSearchParams({
    select: "id,material_id,author_user_id,title,status",
    author_user_id: `eq.${authorUserId}`,
    order: "created_at.desc",
    limit: "1",
  });

  const rows = await restSelect(UsageReportSchema, "usage_reports", params);

  return rows[0] ?? null;
}

/** 区を並び順に、「品種／使った資材」の形で返す。品種が無い区は「-」。 */
export async function usageReportPlots(reportId: string): Promise<string[]> {
  const [plots, varieties] = await Promise.all([
    restSelect(
      UsageReportPlotSchema,
      "usage_report_plots",
      new URLSearchParams({
        select: "name,treatment,variety_id",
        report_id: `eq.${reportId}`,
        order: "sort_order",
      }),
    ),
    restSelect(
      NamedSchema,
      "usage_report_varieties",
      new URLSearchParams({ select: "id,name", report_id: `eq.${reportId}` }),
    ),
  ]);

  return plots.map(
    (plot) =>
      `${varieties.find(({ id }) => id === plot.variety_id)?.name ?? "-"}／${plot.treatment ?? "-"}`,
  );
}

export async function cropsByNames(names: string[]): Promise<v.InferOutput<typeof CropSchema>[]> {
  const params = new URLSearchParams({
    select: "id,name",
    name: `in.(${names.join(",")})`,
  });

  return restSelect(CropSchema, "crops", params);
}

export async function productTypesByNames(
  names: string[],
): Promise<v.InferOutput<typeof ProductTypeSchema>[]> {
  const params = new URLSearchParams({
    select: "id,name",
    name: `in.(${names.join(",")})`,
  });

  return restSelect(ProductTypeSchema, "product_types", params);
}

export async function genresByNames(names: string[]) {
  return restSelect(
    v.object({ id: UuidSchema, name: v.string() }),
    "ingredient_categories",
    new URLSearchParams({
      select: "id,name",
      name: `in.(${names.join(",")})`,
    }),
  );
}

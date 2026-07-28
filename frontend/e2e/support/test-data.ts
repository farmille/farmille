type AuthUser = {
  id: string;
  email?: string;
};

type AuthUserList = {
  users: AuthUser[];
};

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

export type Material = {
  id: string;
  name: string;
  manufacturer_name: string;
  review_count: number;
  avg_rating: number | null;
  seller_id: string | null;
};

export type Review = {
  id: string;
  material_id: string;
  author_user_id: string;
  rating: number;
  body: string;
  status: string;
};

export type UsageReport = {
  id: string;
  material_id: string;
  author_user_id: string;
  title: string | null;
  status: string;
};

export type Tag = {
  id: string;
  name: string;
  category: string;
};

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
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

if (new URL(supabaseUrl).origin !== "http://127.0.0.1:54321") {
  throw new Error("E2E データ操作はローカル Supabase に対してのみ実行できます。");
}

function adminHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("apikey", serviceRoleKey);
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);
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

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await checkedFetch(path, init);
  return (await response.json()) as T;
}

function restPath(table: string, params?: URLSearchParams): string {
  const query = params?.toString();
  return `/rest/v1/${table}${query === undefined || query.length === 0 ? "" : `?${query}`}`;
}

async function restSelect<T>(table: string, params: URLSearchParams): Promise<T[]> {
  return jsonRequest<T[]>(restPath(table, params));
}

async function restInsert<T>(table: string, body: object): Promise<T> {
  const rows = await jsonRequest<T[]>(restPath(table), {
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
  const payload = await jsonRequest<AuthUserList>("/auth/v1/admin/users?page=1&per_page=1000");
  return payload.users.filter((user) => user.email === email);
}

export async function cleanupOwnedE2eData(): Promise<void> {
  const materialParams = new URLSearchParams({ name: `like.E2E資材_${E2E_TOKEN_PREFIX}*` });
  await checkedFetch(restPath("materials", materialParams), { method: "DELETE" });

  const sellerParams = new URLSearchParams({ login_id: `like.${E2E_TOKEN_PREFIX}*` });
  await checkedFetch(restPath("seller_accounts", sellerParams), { method: "DELETE" });

  const payload = await jsonRequest<AuthUserList>("/auth/v1/admin/users?page=1&per_page=1000");
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

async function createAuthUser(
  email: string,
  password: string,
  accountType: "general" | "seller",
): Promise<AuthUser> {
  await deleteAuthUsersByEmail(email);

  return jsonRequest<AuthUser>("/auth/v1/admin/users", {
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

  await restInsert("profiles", {
    user_id: authUser.id,
    handle,
    prefecture_code: 13,
    prefecture_public: true,
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
  const seller = await restInsert<{ id: string }>("seller_accounts", {
    auth_user_id: authUser.id,
    official_name: officialName,
    seller_type: "maker",
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
  const sellers = await restSelect<{ id: string; auth_user_id: string | null }>(
    "seller_accounts",
    params,
  );

  for (const seller of sellers) {
    const deleteParams = new URLSearchParams({ id: `eq.${seller.id}` });
    await checkedFetch(restPath("seller_accounts", deleteParams), { method: "DELETE" });
    if (seller.auth_user_id !== null) {
      await deleteAuthUser(seller.auth_user_id);
    }
  }
}

export async function createMaterial(
  prefix: string,
  sellerId: string | null = null,
): Promise<Material> {
  const token = uniqueToken(prefix);

  return restInsert<Material>("materials", {
    name: `E2E資材_${token}`,
    manufacturer_name: `E2Eメーカー_${token}`,
    product_type: "E2E",
    sales_status: "販売中",
    seller_id: sellerId,
  });
}

export async function deleteMaterial(materialId: string): Promise<void> {
  const params = new URLSearchParams({ id: `eq.${materialId}` });
  await checkedFetch(restPath("materials", params), { method: "DELETE" });
}

export async function listSeedMaterials(): Promise<Material[]> {
  const params = new URLSearchParams({
    select: "id,name,manufacturer_name,review_count,avg_rating,seller_id",
    name: "not.like.E2E資材_%",
    order: "name.asc",
    limit: "20",
  });
  return restSelect<Material>("materials", params);
}

export async function getMaterial(materialId: string): Promise<Material> {
  const params = new URLSearchParams({
    select: "id,name,manufacturer_name,review_count,avg_rating,seller_id",
    id: `eq.${materialId}`,
  });
  const rows = await restSelect<Material>("materials", params);
  const material = rows[0];

  if (material === undefined) {
    throw new Error(`資材 ${materialId} が見つかりません。`);
  }

  return material;
}

export async function firstCrop(): Promise<{ id: string; name: string }> {
  const params = new URLSearchParams({
    select: "id,name",
    name: "eq.トマト",
    limit: "1",
  });
  const rows = await restSelect<{ id: string; name: string }>("crops", params);
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

  return restInsert<Review>("reviews", {
    material_id: input.materialId,
    author_user_id: input.authorUserId,
    rating: input.rating,
    body: input.body,
    crop_id: crop.id,
    pesticide_ack: true,
    status: "published",
  });
}

export async function reviewByAuthor(authorUserId: string): Promise<Review | null> {
  const params = new URLSearchParams({
    select: "id,material_id,author_user_id,rating,body,status",
    author_user_id: `eq.${authorUserId}`,
    limit: "1",
  });
  const rows = await restSelect<Review>("reviews", params);
  return rows[0] ?? null;
}

export async function createPendingUsageReport(input: {
  materialId: string;
  authorUserId: string;
  title: string;
}): Promise<UsageReport> {
  const crop = await firstCrop();

  return restInsert<UsageReport>("usage_reports", {
    material_id: input.materialId,
    author_user_id: input.authorUserId,
    title: input.title,
    status: "pending",
    crop_id: crop.id,
    purpose_tags: ["樹勢改善"],
    prefecture_code: 13,
    cultivation_type: "open_field",
    cultivation_tags: ["土耕"],
    growth_stage: "栄養生長期",
    observed_change: "E2E 編集局確認用の観察結果",
    summary: "E2E 編集局確認用のまとめ",
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
  const rows = await restSelect<UsageReport>("usage_reports", params);
  return rows[0] ?? null;
}

export async function tagsByNames(names: string[]): Promise<Tag[]> {
  const params = new URLSearchParams({
    select: "id,name,category",
    name: `in.(${names.join(",")})`,
  });
  return restSelect<Tag>("tags", params);
}

import * as v from "valibot";

import type { E2eAdminAccount } from "./admin-accounts";
import { uniqueToken } from "./test-data";

const IdSchema = v.object({ id: v.pipe(v.string(), v.uuid()) });
const TagSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.string(),
  category: v.string(),
  sort_order: v.number(),
});
const ArticleSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  title: v.string(),
  body: v.string(),
  hero_image_url: v.nullable(v.string()),
  status: v.string(),
});
const EditorialSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  title: v.nullable(v.string()),
  observed_change: v.nullable(v.string()),
  editor_note: v.nullable(v.string()),
  status: v.string(),
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.length === 0) throw new Error(`Missing E2E environment ${name}`);
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = requireEnv("SUPABASE_SECRET_KEY");
if (new URL(supabaseUrl).origin !== "http://127.0.0.1:54321") {
  throw new Error("Admin/content E2E fixtures require local Supabase.");
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("apikey", secretKey);
  headers.set("Authorization", `Bearer ${secretKey}`);
  const response = await fetch(new URL(path, supabaseUrl), { ...init, headers });
  if (!response.ok)
    throw new Error(
      `${init?.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`,
    );
  return response;
}

async function select<TSchema extends v.GenericSchema>(
  schema: TSchema,
  table: string,
  params: URLSearchParams,
): Promise<Array<v.InferOutput<TSchema>>> {
  const response = await request(`/rest/v1/${table}?${params}`);
  return v.parse(v.array(schema), await response.json());
}

export async function createContentAdmin(
  prefix: string,
): Promise<E2eAdminAccount & { id: string }> {
  const email = `${uniqueToken(prefix)}@example.test`;
  const password = "Farmille-E2E-Content-Admin-2026!";
  const response = await request("/auth/v1/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: { account_type: "admin" },
    }),
  });
  const user = v.parse(IdSchema, await response.json());
  return { id: user.id, email, password };
}

export async function materialByOwnedName(name: string): Promise<string | null> {
  if (!name.startsWith("E2E資材_e2e-"))
    throw new Error("Material lookup requires a test-owned name.");
  const rows = await select(
    IdSchema,
    "materials",
    new URLSearchParams({ select: "id", name: `eq.${name}` }),
  );
  return rows[0]?.id ?? null;
}

export async function tagByOwnedName(name: string) {
  if (!name.startsWith("e2e-")) throw new Error("Tag lookup requires a test-owned name.");
  const rows = await select(
    TagSchema,
    "search_tags",
    new URLSearchParams({ select: "id,name,category,sort_order", name: `eq.${name}` }),
  );
  return rows[0] ?? null;
}

export async function deleteOwnedTag(name: string): Promise<void> {
  const tag = await tagByOwnedName(name);
  if (tag !== null)
    await request(`/rest/v1/search_tags?${new URLSearchParams({ id: `eq.${tag.id}` })}`, {
      method: "DELETE",
    });
}

export async function articleBySeller(sellerId: string) {
  const rows = await select(
    ArticleSchema,
    "articles",
    new URLSearchParams({
      select: "id,title,body,hero_image_url,status",
      seller_id: `eq.${sellerId}`,
    }),
  );
  return rows[0] ?? null;
}

export async function editorialReportById(reportId: string) {
  const rows = await select(
    EditorialSchema,
    "usage_reports",
    new URLSearchParams({
      select: "id,title,observed_change,editor_note,status",
      id: `eq.${reportId}`,
    }),
  );
  return rows[0] ?? null;
}

export async function cleanupArticleImages(sellerId: string): Promise<void> {
  const sellers = await select(
    v.object({ login_id: v.string() }),
    "seller_accounts",
    new URLSearchParams({ select: "login_id", id: `eq.${sellerId}` }),
  );
  if (!sellers[0]?.login_id.startsWith("e2e-"))
    throw new Error("Image cleanup requires a test-owned seller.");
  const response = await request("/storage/v1/object/list/article-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: sellerId, limit: 100 }),
  });
  const objects = v.parse(v.array(v.object({ name: v.string() })), await response.json());
  if (objects.length > 0)
    await request("/storage/v1/object/article-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: objects.map((item) => `${sellerId}/${item.name}`) }),
    });
}

export async function materialTagNames(materialId: string): Promise<string[]> {
  const rows = await select(
    v.object({ search_tag: v.object({ name: v.string() }) }),
    "material_search_tags",
    new URLSearchParams({
      select: "search_tag:search_tags(name)",
      material_id: `eq.${materialId}`,
    }),
  );
  return rows.map((row) => row.search_tag.name);
}

export async function articleMaterialIds(articleId: string): Promise<string[]> {
  const rows = await select(
    v.object({ material_id: v.string() }),
    "article_materials",
    new URLSearchParams({ select: "material_id", article_id: `eq.${articleId}` }),
  );
  return rows.map((row) => row.material_id);
}

export async function materialManuscripts(materialId: string) {
  return select(
    v.object({
      id: v.pipe(v.string(), v.uuid()),
      status: v.string(),
      review_note: v.nullable(v.string()),
    }),
    "material_page_versions",
    new URLSearchParams({
      select: "id,status,review_note",
      material_id: `eq.${materialId}`,
      order: "created_at.asc",
    }),
  );
}

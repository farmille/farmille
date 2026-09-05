import type { SupabaseClient } from "@supabase/supabase-js";
import * as v from "valibot";

import { formDataString } from "@/lib/validation";
import type { ErrorCode } from "@/server/errors";
import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ArticleStatus = "draft" | "published";

export type ArticleInput = {
  title: string;
  body: string;
  heroImageUrl: string | null;
  status: ArticleStatus;
  materialIds: string[];
};

type ValidationSuccess<T> = {
  ok: true;
  input: T;
};

type ValidationFailure = {
  ok: false;
  fieldErrors: Record<string, string>;
};

export type InputValidation<T> = ValidationSuccess<T> | ValidationFailure;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorCodeForMutation(error: { code?: string }): ErrorCode {
  switch (error.code) {
    case "42501":
      return "forbidden";
    case "23505":
      return "conflict";
    case "23514":
    case "22P02":
      return "invalid_body";
    default:
      return "internal";
  }
}

function reportMutationError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/mutations/articles] ${operation}`, error);
}

function optionalText(
  value: FormDataEntryValue | null,
  field: string,
  fieldErrors: Record<string, string>,
): string | null {
  const parsed = formDataString(value);
  if (parsed === null) {
    fieldErrors[field] = "入力内容を確認してください。";
    return null;
  }

  const normalized = parsed.trim();
  return normalized.length === 0 ? null : normalized;
}

function requiredText(
  value: FormDataEntryValue | null,
  field: string,
  emptyMessage: string,
  fieldErrors: Record<string, string>,
): string | null {
  const normalized = optionalText(value, field, fieldErrors);
  if (normalized === null && fieldErrors[field] === undefined) {
    fieldErrors[field] = emptyMessage;
  }
  return normalized;
}

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isArticleStatus(value: string): value is ArticleStatus {
  return value === "draft" || value === "published";
}

const MaterialIdsSchema = v.array(v.pipe(v.string(), v.regex(UUID_RE)));

function parseMaterialIds(
  value: FormDataEntryValue | null,
  fieldErrors: Record<string, string>,
): string[] {
  const serialized = formDataString(value);
  if (serialized === null || serialized.length === 0) {
    return [];
  }

  try {
    const result = v.safeParse(MaterialIdsSchema, JSON.parse(serialized));
    if (result.success) return [...new Set(result.output)];
    fieldErrors.materialIds = "紐づけ資材の形式が正しくありません。";
    return [];
  } catch {
    fieldErrors.materialIds = "紐づけ資材の形式が正しくありません。";
    return [];
  }
}

/** タイトル・本文必須。hero と資材は任意。公開時も同じ必須項目。 */
export function validateArticleInput(input: {
  title: FormDataEntryValue | null;
  body: FormDataEntryValue | null;
  heroImageUrl: FormDataEntryValue | null;
  status: FormDataEntryValue | null;
  materialIds: FormDataEntryValue | null;
}): InputValidation<ArticleInput> {
  const fieldErrors: Record<string, string> = {};
  const title = requiredText(input.title, "title", "タイトルを入力してください。", fieldErrors);
  const body = requiredText(input.body, "body", "本文を入力してください。", fieldErrors);
  const heroImageUrl = optionalText(input.heroImageUrl, "heroImageUrl", fieldErrors);
  const materialIds = parseMaterialIds(input.materialIds, fieldErrors);

  const statusRaw = formDataString(input.status) ?? "";
  const status = isArticleStatus(statusRaw) ? statusRaw : null;
  if (status === null) {
    fieldErrors.status = "公開状態を選択してください。";
  }

  if (heroImageUrl !== null && !validHttpUrl(heroImageUrl)) {
    fieldErrors.heroImageUrl = "ヒーロー画像のURL形式を確認してください。";
  }

  if (Object.keys(fieldErrors).length > 0 || title === null || body === null || status === null) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      title,
      body,
      heroImageUrl,
      status,
      materialIds,
    },
  };
}

async function ensureOwnedArticle(
  supabase: SupabaseClient<Database>,
  sellerId: string,
  articleId: string,
): Promise<Result<null>> {
  const { data, error } = await supabase
    .from("articles")
    .select("id")
    .eq("id", articleId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error !== null) {
    reportMutationError("記事所有権の確認に失敗", error);
    return fail("internal");
  }

  return data === null ? fail("not_found") : succeed(null);
}

async function ensureMaterialsExist(
  supabase: SupabaseClient<Database>,
  materialIds: string[],
): Promise<Result<null>> {
  if (materialIds.length === 0) return succeed(null);

  const { data, error } = await supabase
    .from("materials")
    .select("id")
    .eq("publication_status", "published")
    .in("id", materialIds);

  if (error !== null) {
    reportMutationError("紐づけ資材の存在確認に失敗", error);
    return fail("internal");
  }

  if (data.length !== materialIds.length) {
    return fail("invalid_body");
  }

  return succeed(null);
}

async function replaceArticleMaterials(
  supabase: SupabaseClient<Database>,
  articleId: string,
  materialIds: string[],
): Promise<Result<null>> {
  const { error: deleteError } = await supabase
    .from("article_materials")
    .delete()
    .eq("article_id", articleId);

  if (deleteError !== null) {
    reportMutationError("記事紐づけ資材の削除に失敗", deleteError);
    return fail(errorCodeForMutation(deleteError));
  }

  if (materialIds.length === 0) return succeed(null);

  const { error: insertError } = await supabase.from("article_materials").insert(
    materialIds.map((materialId) => ({
      article_id: articleId,
      material_id: materialId,
    })),
  );

  if (insertError !== null) {
    reportMutationError("記事紐づけ資材の追加に失敗", insertError);
    return fail(errorCodeForMutation(insertError));
  }

  return succeed(null);
}

/** 本人セッションで記事を新規作成し、紐づけ資材を同期する。 */
export async function createSellerArticle(
  sellerId: string,
  input: ArticleInput,
): Promise<Result<{ id: string }>> {
  const supabase = await createServerSupabase();
  const materials = await ensureMaterialsExist(supabase, input.materialIds);
  if (!materials.ok) return materials;

  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("articles")
    .insert({
      seller_id: sellerId,
      title: input.title,
      body: input.body,
      hero_image_url: input.heroImageUrl,
      status: input.status,
      published_at: publishedAt,
    })
    .select("id")
    .single();

  if (error !== null || data === null) {
    reportMutationError("記事の作成に失敗", error);
    return fail(error === null ? "internal" : errorCodeForMutation(error));
  }

  const linked = await replaceArticleMaterials(supabase, data.id, input.materialIds);
  if (!linked.ok) {
    const { error: cleanupError } = await supabase.from("articles").delete().eq("id", data.id);
    if (cleanupError !== null) {
      reportMutationError("紐づけ失敗後の記事回収に失敗", cleanupError);
    }
    return linked;
  }

  return succeed({ id: data.id });
}

/** 自組織の記事だけを更新する。他組織は not_found。 */
export async function updateSellerArticle(
  sellerId: string,
  articleId: string,
  input: ArticleInput,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const ownership = await ensureOwnedArticle(supabase, sellerId, articleId);
  if (!ownership.ok) return ownership;

  const materials = await ensureMaterialsExist(supabase, input.materialIds);
  if (!materials.ok) return materials;

  const { data: current, error: currentError } = await supabase
    .from("articles")
    .select("published_at")
    .eq("id", articleId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (currentError !== null) {
    reportMutationError("更新対象記事の取得に失敗", currentError);
    return fail("internal");
  }
  if (current === null) return fail("not_found");

  const publishedAt =
    input.status === "published"
      ? (current.published_at ?? new Date().toISOString())
      : current.published_at;

  const { data, error } = await supabase
    .from("articles")
    .update({
      title: input.title,
      body: input.body,
      hero_image_url: input.heroImageUrl,
      status: input.status,
      published_at: publishedAt,
    })
    .eq("id", articleId)
    .eq("seller_id", sellerId)
    .select("id")
    .maybeSingle();

  if (error !== null) {
    reportMutationError("記事の更新に失敗", error);
    return fail(errorCodeForMutation(error));
  }
  if (data === null) return fail("not_found");

  return replaceArticleMaterials(supabase, articleId, input.materialIds);
}

/** 公開／非公開だけを切り替える。 */
export async function setSellerArticleStatus(
  sellerId: string,
  articleId: string,
  status: ArticleStatus,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const ownership = await ensureOwnedArticle(supabase, sellerId, articleId);
  if (!ownership.ok) return ownership;

  const { data: current, error: currentError } = await supabase
    .from("articles")
    .select("published_at")
    .eq("id", articleId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (currentError !== null) {
    reportMutationError("公開状態切替対象の取得に失敗", currentError);
    return fail("internal");
  }
  if (current === null) return fail("not_found");

  const publishedAt =
    status === "published"
      ? (current.published_at ?? new Date().toISOString())
      : current.published_at;

  const { data, error } = await supabase
    .from("articles")
    .update({ status, published_at: publishedAt })
    .eq("id", articleId)
    .eq("seller_id", sellerId)
    .select("id")
    .maybeSingle();

  if (error !== null) {
    reportMutationError("記事の公開状態切替に失敗", error);
    return fail(errorCodeForMutation(error));
  }

  return data === null ? fail("not_found") : succeed(null);
}

/** 自組織の記事を削除する。紐づけは CASCADE。 */
export async function deleteSellerArticle(
  sellerId: string,
  articleId: string,
): Promise<Result<null>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId)
    .eq("seller_id", sellerId)
    .select("id")
    .maybeSingle();

  if (error !== null) {
    reportMutationError("記事の削除に失敗", error);
    return fail(errorCodeForMutation(error));
  }

  return data === null ? fail("not_found") : succeed(null);
}

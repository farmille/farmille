"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SellerArticleFormState } from "./_components/form-state";
import { requireSeller } from "@/server/auth";
import { errorMessageJa, sellerDashboardMessageJa, type ErrorCode } from "@/server/errors";
import {
  createSellerArticle,
  deleteSellerArticle,
  setSellerArticleStatus,
  updateSellerArticle,
  validateArticleInput,
} from "@/server/mutations/articles";
import { searchMaterialsForArticleLink } from "@/server/queries/seller-articles";
import { createServerSupabase } from "@/server/supabase";

function errorState(code: ErrorCode, fieldErrors?: Record<string, string>): SellerArticleFormState {
  return {
    status: "error",
    message: errorMessageJa[code],
    fieldErrors,
  };
}

async function sellerIdForAction(): Promise<
  { ok: true; sellerId: string } | { ok: false; state: SellerArticleFormState }
> {
  const session = await requireSeller();

  if (!session.ok) {
    return { ok: false, state: errorState(session.error) };
  }

  return { ok: true, sellerId: session.data.sellerId };
}

function revalidateArticlePaths(articleId: string, materialIds: string[]): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/articles");
  revalidatePath(`/dashboard/articles/${articleId}/edit`);
  revalidatePath("/articles");
  revalidatePath(`/articles/${articleId}`);
  for (const materialId of materialIds) {
    revalidatePath(`/materials/${materialId}`);
    revalidatePath(`/materials/${materialId}/articles`);
  }
}

async function materialIdsForArticle(articleId: string): Promise<string[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("article_materials")
    .select("material_id")
    .eq("article_id", articleId);

  if (error !== null || data === null) {
    console.error("[dashboard/articles] 紐づけ資材の再検証用取得に失敗", error);
    return [];
  }

  return data.map((row) => row.material_id);
}

function parseMaterialIdsFromForm(formData: FormData): unknown {
  return formData.get("materialIds");
}

export async function createArticleAction(
  _previousState: SellerArticleFormState,
  formData: FormData,
): Promise<SellerArticleFormState> {
  const authorization = await sellerIdForAction();
  if (!authorization.ok) return authorization.state;

  const validation = validateArticleInput({
    title: formData.get("title"),
    body: formData.get("body"),
    heroImageUrl: formData.get("heroImageUrl"),
    status: formData.get("status"),
    materialIds: parseMaterialIdsFromForm(formData),
  });

  if (!validation.ok) {
    return errorState("invalid_body", validation.fieldErrors);
  }

  const result = await createSellerArticle(authorization.sellerId, validation.input);
  if (!result.ok) return errorState(result.error);

  revalidateArticlePaths(result.data.id, validation.input.materialIds);

  if (validation.input.status === "published") {
    redirect(`/articles/${result.data.id}`);
  }

  return {
    status: "success",
    message: sellerDashboardMessageJa.articleDraftSaved,
    articleId: result.data.id,
    published: false,
  };
}

export async function updateArticleAction(
  articleId: string,
  _previousState: SellerArticleFormState,
  formData: FormData,
): Promise<SellerArticleFormState> {
  const authorization = await sellerIdForAction();
  if (!authorization.ok) return authorization.state;

  const validation = validateArticleInput({
    title: formData.get("title"),
    body: formData.get("body"),
    heroImageUrl: formData.get("heroImageUrl"),
    status: formData.get("status"),
    materialIds: parseMaterialIdsFromForm(formData),
  });

  if (!validation.ok) {
    return errorState("invalid_body", validation.fieldErrors);
  }

  const result = await updateSellerArticle(authorization.sellerId, articleId, validation.input);
  if (!result.ok) return errorState(result.error);

  revalidateArticlePaths(articleId, validation.input.materialIds);

  if (validation.input.status === "published") {
    return {
      status: "success",
      message: sellerDashboardMessageJa.articlePublished,
      articleId,
      published: true,
    };
  }

  return {
    status: "success",
    message: sellerDashboardMessageJa.articleUpdated,
    articleId,
    published: false,
  };
}

export async function setArticleStatusAction(
  articleId: string,
  status: "draft" | "published",
): Promise<SellerArticleFormState> {
  const authorization = await sellerIdForAction();
  if (!authorization.ok) return authorization.state;

  const result = await setSellerArticleStatus(authorization.sellerId, articleId, status);
  if (!result.ok) return errorState(result.error);

  const materialIds = await materialIdsForArticle(articleId);
  revalidateArticlePaths(articleId, materialIds);

  return {
    status: "success",
    message:
      status === "published"
        ? sellerDashboardMessageJa.articlePublished
        : sellerDashboardMessageJa.articleUnpublished,
    articleId,
    published: status === "published",
  };
}

export async function deleteArticleAction(articleId: string): Promise<void> {
  const session = await requireSeller();
  if (!session.ok) {
    redirect(`/sellers/login?next=${encodeURIComponent("/dashboard/articles")}`);
  }

  const materialIds = await materialIdsForArticle(articleId);
  const result = await deleteSellerArticle(session.data.sellerId, articleId);
  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  revalidateArticlePaths(articleId, materialIds);
  redirect("/dashboard/articles");
}

export async function searchMaterialsAction(
  query: string,
): Promise<
  | { ok: true; items: Array<{ id: string; name: string; manufacturer_name: string }> }
  | { ok: false; message: string }
> {
  const session = await requireSeller();
  if (!session.ok) {
    return { ok: false, message: errorMessageJa[session.error] };
  }

  const result = await searchMaterialsForArticleLink(query);
  if (!result.ok) {
    return { ok: false, message: errorMessageJa[result.error] };
  }

  return { ok: true, items: result.data };
}

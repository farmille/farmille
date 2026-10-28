import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type PublicSellerRow = Database["public"]["Views"]["public_sellers"]["Row"];
type ViewCountRow = Database["public"]["Views"]["view_counts_total"]["Row"];

type ArticleSeller = Pick<PublicSellerRow, "id" | "official_name" | "logo_url">;

type ArticleMaterial = Pick<
  MaterialRow,
  | "id"
  | "name"
  | "manufacturer_name"
  | "avg_rating"
  | "manufacturer_verified_at"
  | "container_type_id"
>;

type ArticleDetailQueryRow = Pick<
  ArticleRow,
  "id" | "title" | "body" | "hero_image_url" | "published_at" | "seller_id" | "status"
> & {
  seller: ArticleSeller | null;
  article_materials: Array<{
    material: ArticleMaterial | null;
  }>;
};

export type PublishedArticleDetail = {
  id: string;
  title: string;
  body: string;
  heroImageUrl: string | null;
  publishedAt: string;
  seller: ArticleSeller;
  materials: ArticleMaterial[];
  helpfulCount: number;
  viewCount: number;
};

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/articles] ${operation}`, error);
}

async function getArticleCounts(
  supabase: SupabaseClient<Database>,
  articleId: string,
): Promise<Result<{ helpfulCount: number; viewCount: number }>> {
  const [helpfulResult, viewResult] = await Promise.all([
    supabase
      .from("helpful_counts")
      .select("target_id, helpful_count")
      .eq("target_type", "article")
      .eq("target_id", articleId)
      .maybeSingle(),
    supabase
      .from("view_counts_total")
      .select("target_id, view_count")
      .eq("target_type", "article")
      .eq("target_id", articleId)
      .maybeSingle(),
  ]);

  if (helpfulResult.error !== null) {
    reportQueryError("記事の参考になった件数の取得に失敗", helpfulResult.error);
    return fail("internal");
  }

  if (viewResult.error !== null) {
    reportQueryError("記事の閲覧数の取得に失敗", viewResult.error);
    return fail("internal");
  }

  const helpfulRow: Pick<HelpfulCountRow, "target_id" | "helpful_count"> | null =
    helpfulResult.data;
  let helpfulCount = 0;

  if (helpfulRow !== null) {
    if (helpfulRow.helpful_count === null) {
      reportQueryError("参考になった件数にNULLが含まれる", helpfulRow);
      return fail("internal");
    }
    helpfulCount = helpfulRow.helpful_count;
  }

  const viewRow: Pick<ViewCountRow, "target_id" | "view_count"> | null = viewResult.data;
  let viewCount = 0;

  if (viewRow !== null) {
    if (viewRow.view_count === null) {
      reportQueryError("閲覧数にNULLが含まれる", viewRow);
      return fail("internal");
    }
    viewCount = viewRow.view_count;
  }

  return succeed({ helpfulCount, viewCount });
}

/** published の記事詳細。draft 等は null。 */
export async function getPublishedArticle(
  articleId: string,
): Promise<Result<PublishedArticleDetail | null>> {
  if (articleId.length === 0) {
    throw new Error("articleId は空にできません。");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("articles")
    .select(
      `
      id,
      title,
      body,
      hero_image_url,
      published_at,
      seller_id,
      status,
      seller:public_sellers!articles_seller_id_fkey (
        id,
        official_name,
        logo_url
      ),
      article_materials (
        material:materials!article_materials_material_id_fkey (
          id,
          name,
          manufacturer_name,
          avg_rating,
          manufacturer_verified_at,
          container_type_id
        )
      )
    `,
    )
    .eq("id", articleId)
    .eq("status", "published")
    .maybeSingle();

  if (error !== null) {
    reportQueryError("公開記事の取得に失敗", error);
    return fail("internal");
  }

  if (data === null) {
    return succeed(null);
  }

  const row: ArticleDetailQueryRow = data;

  if (row.published_at === null) {
    reportQueryError("published なのに published_at が無い", { id: row.id });
    return fail("internal");
  }

  if (row.seller === null) {
    reportQueryError("記事のメーカー情報が欠落", { id: row.id });
    return fail("internal");
  }

  const materials: ArticleMaterial[] = [];

  for (const relation of row.article_materials) {
    if (relation.material === null) {
      reportQueryError("記事紐づけ資材が欠落", { articleId: row.id });
      return fail("internal");
    }
    materials.push(relation.material);
  }

  const counts = await getArticleCounts(supabase, row.id);

  if (!counts.ok) {
    return counts;
  }

  return succeed({
    id: row.id,
    title: row.title,
    body: row.body,
    heroImageUrl: row.hero_image_url,
    publishedAt: row.published_at,
    seller: row.seller,
    materials,
    helpfulCount: counts.data.helpfulCount,
    viewCount: counts.data.viewCount,
  });
}

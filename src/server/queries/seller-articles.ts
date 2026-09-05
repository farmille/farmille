import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

export type SellerArticleListItem = Pick<
  ArticleRow,
  "id" | "title" | "status" | "published_at" | "updated_at" | "hero_image_url"
>;

export type SellerArticleMaterial = Pick<MaterialRow, "id" | "name" | "manufacturer_name">;

export type SellerArticleDetail = Pick<
  ArticleRow,
  "id" | "title" | "body" | "hero_image_url" | "status" | "published_at" | "updated_at"
> & {
  materials: SellerArticleMaterial[];
};

type SellerArticleQueryRow = Pick<
  ArticleRow,
  "id" | "title" | "body" | "hero_image_url" | "status" | "published_at" | "updated_at"
> & {
  article_materials: Array<{
    material: SellerArticleMaterial | null;
  }>;
};

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/seller-articles] ${operation}`, error);
}

/** 自組織の記事一覧（下書き含む）。更新日時の新しい順。 */
export async function listSellerArticles(
  sellerId: string,
): Promise<Result<SellerArticleListItem[]>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("articles")
    .select("id, title, status, published_at, updated_at, hero_image_url")
    .eq("seller_id", sellerId)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true });

  if (error !== null) {
    reportQueryError("自組織記事一覧の取得に失敗", error);
    return fail("internal");
  }

  const articles: SellerArticleListItem[] = data;
  return succeed(articles);
}

/** 自組織の記事詳細。他組織は not_found（存在を明かさない）。 */
export async function getSellerArticle(
  sellerId: string,
  articleId: string,
): Promise<Result<SellerArticleDetail>> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("articles")
    .select(
      `
      id,
      title,
      body,
      hero_image_url,
      status,
      published_at,
      updated_at,
      article_materials (
        material:materials!article_materials_material_id_fkey (
          id,
          name,
          manufacturer_name
        )
      )
    `,
    )
    .eq("id", articleId)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (error !== null) {
    reportQueryError("自組織記事の取得に失敗", error);
    return fail("internal");
  }

  if (data === null) {
    return fail("not_found");
  }

  const row: SellerArticleQueryRow = data;
  const materials: SellerArticleMaterial[] = [];

  for (const relation of row.article_materials) {
    if (relation.material === null) {
      reportQueryError("記事紐づけ資材が欠落", { articleId: row.id });
      return fail("internal");
    }
    materials.push(relation.material);
  }

  return succeed({
    id: row.id,
    title: row.title,
    body: row.body,
    hero_image_url: row.hero_image_url,
    status: row.status,
    published_at: row.published_at,
    updated_at: row.updated_at,
    materials,
  });
}

/** 記事に紐づける資材の候補検索。他社資材も含め materials 全体から探す。 */
export async function searchMaterialsForArticleLink(
  query: string,
): Promise<Result<SellerArticleMaterial[]>> {
  const normalized = query.trim();
  if (normalized.length === 0) {
    return succeed([]);
  }

  // PostgREST の or フィルタを壊す記号は除く（LIKE のワイルドカードも含む）。
  const safe = normalized
    .replace(/[%_,.()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (safe.length === 0) {
    return succeed([]);
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("materials")
    .select("id, name, manufacturer_name")
    .eq("publication_status", "published")
    .or(`name.ilike.%${safe}%,manufacturer_name.ilike.%${safe}%`)
    .order("name", { ascending: true })
    .order("id", { ascending: true })
    .limit(20);

  if (error !== null) {
    reportQueryError("紐づけ資材の検索に失敗", error);
    return fail("internal");
  }

  const materials: SellerArticleMaterial[] = data;
  return succeed(materials);
}

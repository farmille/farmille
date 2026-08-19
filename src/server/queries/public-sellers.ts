import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, succeed, type Result } from "@/server/result";
import { createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type PublicSellerRow = Database["public"]["Views"]["public_sellers"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialImageRow = Database["public"]["Tables"]["material_images"]["Row"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type HelpfulCountRow = Database["public"]["Views"]["helpful_counts"]["Row"];

type SellerMaterialQueryRow = Pick<
  MaterialRow,
  "id" | "name" | "manufacturer_name" | "avg_rating" | "review_count"
> & {
  material_images: Pick<MaterialImageRow, "id" | "url" | "sort_order">[];
};

type SellerArticleQueryRow = Pick<ArticleRow, "id" | "title" | "hero_image_url" | "published_at">;

export type PublicSellerPageData = {
  seller: {
    id: string;
    officialName: string;
    sellerType: string;
    regionScope: string;
    websiteUrl: string | null;
    logoUrl: string | null;
    profileText: string | null;
  };
  materialCount: number;
  materials: ReadonlyArray<{
    id: string;
    name: string;
    manufacturerName: string;
    averageRating: number | null;
    reviewCount: number;
    imageUrl: string | null;
  }>;
  helpfulCount: number;
  articles: ReadonlyArray<{
    id: string;
    title: string;
    heroImageUrl: string | null;
    publishedAt: string;
  }>;
};

const MATERIAL_PREVIEW_LIMIT = 3;
const IN_FILTER_CHUNK_SIZE = 100;

function reportQueryError(operation: string, error: unknown): void {
  console.error(`[server/queries/public-sellers] ${operation}`, error);
}

function byImageOrder(
  left: Pick<MaterialImageRow, "id" | "sort_order">,
  right: Pick<MaterialImageRow, "id" | "sort_order">,
): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

async function getArticleHelpfulCount(
  supabase: SupabaseClient<Database>,
  articleIds: string[],
): Promise<Result<number>> {
  let total = 0;

  for (let start = 0; start < articleIds.length; start += IN_FILTER_CHUNK_SIZE) {
    const ids = articleIds.slice(start, start + IN_FILTER_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("helpful_counts")
      .select("helpful_count")
      .eq("target_type", "article")
      .in("target_id", ids);

    if (error !== null) {
      reportQueryError("記事の参考になった件数の取得に失敗", error);
      return fail("internal");
    }

    const rows: Pick<HelpfulCountRow, "helpful_count">[] = data;

    for (const row of rows) {
      if (row.helpful_count === null) {
        reportQueryError("記事の参考になった件数にNULLが含まれる", row);
        return fail("internal");
      }

      total += row.helpful_count;
    }
  }

  return succeed(total);
}

/** 承認済み出品者の公開ページに必要な情報だけを取得する。 */
export async function getPublicSellerPage(id: string): Promise<Result<PublicSellerPageData>> {
  const supabase = await createServerSupabase();
  const { data: sellerData, error: sellerError } = await supabase
    .from("public_sellers")
    .select("id, official_name, seller_type, region_scope, website_url, logo_url, profile_text")
    .eq("id", id)
    .maybeSingle();

  if (sellerError !== null) {
    reportQueryError("公開出品者の取得に失敗", sellerError);
    return fail("internal");
  }

  if (sellerData === null) {
    return fail("not_found");
  }

  const seller: Pick<
    PublicSellerRow,
    | "id"
    | "official_name"
    | "seller_type"
    | "region_scope"
    | "website_url"
    | "logo_url"
    | "profile_text"
  > = sellerData;

  if (
    seller.id === null ||
    seller.official_name === null ||
    seller.seller_type === null ||
    seller.region_scope === null
  ) {
    reportQueryError("公開出品者の必須項目が欠落", { id });
    return fail("internal");
  }

  const [materialsResult, articlesResult] = await Promise.all([
    supabase
      .from("materials")
      .select(
        `
          id,
          name,
          manufacturer_name,
          avg_rating,
          review_count,
          material_images (
            id,
            url,
            sort_order
          )
        `,
        { count: "exact" },
      )
      .eq("seller_id", seller.id)
      .order("review_count", { ascending: false })
      .order("id", { ascending: true })
      .limit(MATERIAL_PREVIEW_LIMIT),
    supabase
      .from("articles")
      .select("id, title, hero_image_url, published_at")
      .eq("seller_id", seller.id)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .order("id", { ascending: true }),
  ]);

  if (materialsResult.error !== null) {
    reportQueryError("掲載資材の取得に失敗", materialsResult.error);
    return fail("internal");
  }

  if (materialsResult.count === null) {
    reportQueryError("掲載資材の総件数が返されなかった", { id });
    return fail("internal");
  }

  if (articlesResult.error !== null) {
    reportQueryError("公開記事の取得に失敗", articlesResult.error);
    return fail("internal");
  }

  const materialRows: SellerMaterialQueryRow[] = materialsResult.data;
  const articleRows: SellerArticleQueryRow[] = articlesResult.data;
  const helpfulCount = await getArticleHelpfulCount(
    supabase,
    articleRows.map(({ id: articleId }) => articleId),
  );

  if (!helpfulCount.ok) {
    return helpfulCount;
  }

  const articles: Array<PublicSellerPageData["articles"][number]> = [];

  for (const article of articleRows) {
    if (article.published_at === null) {
      reportQueryError("公開記事の公開日時が欠落", { articleId: article.id });
      return fail("internal");
    }

    articles.push({
      id: article.id,
      title: article.title,
      heroImageUrl: article.hero_image_url,
      publishedAt: article.published_at,
    });
  }

  return succeed({
    seller: {
      id: seller.id,
      officialName: seller.official_name,
      sellerType: seller.seller_type,
      regionScope: seller.region_scope,
      websiteUrl: seller.website_url,
      logoUrl: seller.logo_url,
      profileText: seller.profile_text,
    },
    materialCount: materialsResult.count,
    materials: materialRows.map(({ material_images: images, ...material }) => ({
      id: material.id,
      name: material.name,
      manufacturerName: material.manufacturer_name,
      averageRating: material.avg_rating,
      reviewCount: material.review_count,
      imageUrl: images.toSorted(byImageOrder)[0]?.url ?? null,
    })),
    helpfulCount: helpfulCount.data,
    articles,
  });
}

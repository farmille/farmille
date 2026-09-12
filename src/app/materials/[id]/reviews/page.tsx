import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import type { Metadata } from "next";

import { Button, Select } from "@/components";
import { Pagination } from "@/components/Pagination";
import { createReviewListJsonLd, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import { listReviewsByMaterial } from "@/server/queries/reviews";
import { css } from "../../../../../styled-system/css";

import { MaterialPageShell } from "../_components/PageShell";
import { ReviewList } from "../_components/ReviewList";
import { loadMaterialOrNotFound, materialMetadata } from "../material-page-data";
import { unwrapQueryResult } from "../query-result";
import { parseReviewSearchParams, REVIEW_SORT_OPTIONS } from "./search-params";

type MaterialReviewsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    sort?: string | string[];
    page?: string | string[];
  }>;
};

const materialSummary = css({
  p: "3.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
});

export async function generateMetadata({ params }: MaterialReviewsPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);

  return materialMetadata(material, {
    titleSuffix: "のレビュー",
    description: `${material.name}を使った農家のレビューを一覧で確認できます。`,
    pathSuffix: "/reviews",
  });
}

export default async function MaterialReviewsPage({
  params,
  searchParams,
}: MaterialReviewsPageProps) {
  const [{ id }, requestedSearchParams, session] = await Promise.all([
    params,
    searchParams,
    getSessionUser(),
  ]);
  const material = await loadMaterialOrNotFound(id);
  const { sort, page } = parseReviewSearchParams(requestedSearchParams);
  const viewerUserId =
    session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null;
  const reviews = unwrapQueryResult(await listReviewsByMaterial(id, { sort, page, viewerUserId }));
  const materialPath = `/materials/${material.id}`;
  const reviewsPath = `${materialPath}/reviews`;
  const reviewListJsonLd =
    page === 1
      ? createReviewListJsonLd({
          materialId: material.id,
          materialName: material.name,
          reviews: reviews.items.slice(0, 10).map((review) => ({
            id: review.id,
            rating: review.rating,
            body: review.body,
            createdAt: review.created_at,
            authorName: review.author?.handle ?? "退会したユーザー",
          })),
        })
      : null;
  const hrefForPage = (targetPage: number): string => {
    const query = new URLSearchParams({
      sort,
      page: String(targetPage),
    });

    return `${materialPath}/reviews?${query.toString()}`;
  };

  return (
    <MaterialPageShell title={`${material.name}のレビュー`} backHref={materialPath}>
      {reviewListJsonLd === null ? null : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(reviewListJsonLd) }}
        />
      )}
      <section className={materialSummary} aria-labelledby="reviews-page-heading">
        <h1
          id="reviews-page-heading"
          className={css({ m: "0", fontSize: "xl", fontWeight: "700" })}
        >
          {material.name}
        </h1>
        <p className={css({ m: "0", mt: "1", fontSize: "sm", color: "text.muted" })}>
          {material.manufacturer_name}
        </p>
        <p
          className={css({
            m: "0",
            mt: "2",
            fontSize: "sm",
            color: "text.muted",
            fontVariantNumeric: "tabular-nums",
          })}
        >
          総合評価 {material.avg_rating?.toFixed(1) ?? "—"}・レビュー {reviews.total}件
        </p>
      </section>

      <div
        className={css({
          display: "flex",
          alignItems: "end",
          justifyContent: "space-between",
          gap: "3",
        })}
      >
        <p
          className={css({
            m: "0",
            fontSize: "sm",
            color: "text.muted",
            fontVariantNumeric: "tabular-nums",
          })}
        >
          {reviews.total}件
        </p>
        <form method="get" className={css({ display: "flex", alignItems: "end", gap: "2" })}>
          <label className={css({ display: "flex", flexDirection: "column", gap: "1" })}>
            <span className={css({ fontSize: "xs", color: "text.subtle" })}>並び替え</span>
            <Select name="sort" defaultValue={sort} aria-label="レビューの並び替え">
              {REVIEW_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" variant="ghost" size="sm">
            適用
          </Button>
        </form>
      </div>

      <ReviewList
        reviews={reviews.items}
        emptyDescription="この資材には、公開中のレビューがまだありません。"
        currentPath={reviewsPath}
      />
      <Pagination page={page} totalPages={reviews.totalPages} hrefForPage={hrefForPage} />
    </MaterialPageShell>
  );
}

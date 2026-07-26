import type { Metadata } from "next";

import { Button, Select } from "@/components";
import { listReviewsByMaterial } from "@/server/queries/reviews";
import { css } from "../../../../../styled-system/css";

import { MaterialPageShell } from "../_components/page-shell";
import { Pagination } from "../_components/pagination";
import { ReviewList } from "../_components/review-list";
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
  });
}

export default async function MaterialReviewsPage({
  params,
  searchParams,
}: MaterialReviewsPageProps) {
  const [{ id }, requestedSearchParams] = await Promise.all([params, searchParams]);
  const material = await loadMaterialOrNotFound(id);
  const { sort, page } = parseReviewSearchParams(requestedSearchParams);
  const reviews = unwrapQueryResult(await listReviewsByMaterial(id, { sort, page }));
  const materialPath = `/materials/${material.id}`;
  const hrefForPage = (targetPage: number): string => {
    const query = new URLSearchParams({
      sort,
      page: String(targetPage),
    });

    return `${materialPath}/reviews?${query.toString()}`;
  };

  return (
    <MaterialPageShell title={`${material.name}のレビュー`} backHref={materialPath}>
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
          mt: "5",
          mb: "3",
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
      />
      <Pagination page={page} totalPages={reviews.totalPages} hrefForPage={hrefForPage} />
    </MaterialPageShell>
  );
}

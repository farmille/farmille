import { SitePageShell } from "@/app/_site/SitePageShell";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";

import { Pagination } from "@/components/Pagination";
import { PostActionsLoader } from "@/components/PostActionsLoader";
import { createReviewListJsonLd, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import { getReviewRatingDistribution } from "@/server/queries/material-content";
import { listReviewsByMaterial } from "@/server/queries/reviews";
import { recordViewEvents, viewEventsInsertFor } from "@/server/queries/view-events";
import { createServerSupabase } from "@/server/supabase";

import { css } from "../../../../../styled-system/css";

import { EmptyCard } from "../_components/EmptyCard";
import { MaterialReviewCard } from "../_components/MaterialReviewCard";
import { RatingSummary } from "../_components/RatingSummary";
import { isMaterialId, loadMaterialOrNotFound, materialMetadata } from "../material-page-data";
import { unwrapQueryResult } from "../query-result";
import { ReviewSortSelect } from "./ReviewSortSelect";
import { parseReviewSearchParams } from "./search-params";

const visuallyHiddenStyle = css({ srOnly: true });
const summaryStyle = css({ mb: "3" });
const toolsStyle = css({
  mb: "2.5",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "2",
});
const countStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  fontVariantNumeric: "tabular-nums",
});
const listStyle = css({ display: "flex", flexDirection: "column", gap: "2.5" });

type MaterialReviewsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    sort?: string | string[];
    page?: string | string[];
  }>;
};

export async function generateMetadata({ params }: MaterialReviewsPageProps): Promise<Metadata> {
  const { id } = await params;
  const material = await loadMaterialOrNotFound(id);

  return materialMetadata(material, {
    titleSuffix: "の感想口コミ",
    description: `${material.name}を使った生産者の感想口コミを一覧で確認できます。`,
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

  if (!isMaterialId(id)) {
    notFound();
  }

  const { sort, page } = parseReviewSearchParams(requestedSearchParams);
  const viewerUserId =
    session !== null && canUseGeneralFeatures(session.accountType) ? session.userId : null;
  const [material, reviewsResult, distributionResult] = await Promise.all([
    loadMaterialOrNotFound(id),
    listReviewsByMaterial(id, { sort, page, viewerUserId }),
    getReviewRatingDistribution(id),
  ]);
  const reviews = unwrapQueryResult(reviewsResult);
  const distribution = unwrapQueryResult(distributionResult);
  const insertViewEvents = viewEventsInsertFor(await createServerSupabase());
  after(async () => {
    await recordViewEvents({
      targetType: "review",
      targetIds: reviews.items.map((review) => review.id),
      viewerUserId,
      insert: insertViewEvents,
    });
  });
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
    <SitePageShell title={`${material.name} の感想口コミ`} backHref={materialPath}>
      {reviewListJsonLd === null ? null : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(reviewListJsonLd) }}
        />
      )}
      <h1 className={visuallyHiddenStyle}>{material.name}の感想口コミ</h1>
      <div className={summaryStyle}>
        <RatingSummary
          average={material.avg_rating}
          reviewCount={material.review_count}
          distribution={distribution}
        />
      </div>

      <div className={toolsStyle}>
        <span className={countStyle}>{reviews.total}件</span>
        <ReviewSortSelect sort={sort} />
      </div>

      {reviews.items.length > 0 ? (
        <div className={listStyle}>
          {reviews.items.map((review) => (
            <MaterialReviewCard
              key={review.id}
              review={review}
              currentPath={reviewsPath}
              canManage={viewerUserId !== null && viewerUserId === review.author_user_id}
              actions={
                <PostActionsLoader
                  target="review"
                  id={review.id}
                  currentPath={reviewsPath}
                  helpfulCount={review.helpfulCount}
                />
              }
            />
          ))}
        </div>
      ) : (
        <EmptyCard
          align="center"
          title="まだ感想口コミがありません"
          description="この資材には、公開中の感想口コミがまだありません。"
        />
      )}
      <Pagination page={page} totalPages={reviews.totalPages} hrefForPage={hrefForPage} />
    </SitePageShell>
  );
}

import { MockPageShell } from "@/app/_mock/MockPageShell";
// mock.css（MockPageShell が読み込む）より後に読み込む。
import "@/app/_mock/reports-articles.css";

import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Pagination } from "@/components/Pagination";
import { PostActionsLoader } from "@/components/PostActionsLoader";
import { createReviewListJsonLd, serializeJsonLd } from "@/lib/seo";
import { getSessionUser } from "@/server/auth";
import { getReviewRatingDistribution } from "@/server/queries/material-content";
import { listReviewsByMaterial } from "@/server/queries/reviews";

import { MockReviewCard } from "../_components/MockReviewCard";
import { RatingSummary } from "../_components/RatingSummary";
import { isMaterialId, loadMaterialOrNotFound, materialMetadata } from "../material-page-data";
import { unwrapQueryResult } from "../query-result";
import { ReviewSortSelect } from "./ReviewSortSelect";
import { parseReviewSearchParams } from "./search-params";

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
    description: `${material.name}を使った農家の感想口コミを一覧で確認できます。`,
    pathSuffix: "/reviews",
  });
}

// 見本 S.reviewsAll の `.body`。スタイルは src/app/_mock/（.fm 配下に閉じている）。
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
    <MockPageShell title={`${material.name} の感想口コミ`} backHref={materialPath}>
      {reviewListJsonLd === null ? null : (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(reviewListJsonLd) }}
        />
      )}
      <h1 className="sr-only">{material.name}の感想口コミ</h1>
      <div style={{ marginBottom: 12 }}>
        <RatingSummary
          average={material.avg_rating}
          reviewCount={material.review_count}
          distribution={distribution}
        />
      </div>

      <div className="rv-tools">
        <span className="muted tnum" style={{ fontSize: 12 }}>
          {reviews.total}件
        </span>
        <ReviewSortSelect sort={sort} />
      </div>

      {reviews.items.length > 0 ? (
        <div className="stack">
          {reviews.items.map((review) => (
            <MockReviewCard
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
        <div className="card pad" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 700 }}>まだ感想口コミがありません</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            この資材には、公開中の感想口コミがまだありません。
          </p>
        </div>
      )}
      <Pagination page={page} totalPages={reviews.totalPages} hrefForPage={hrefForPage} />
    </MockPageShell>
  );
}

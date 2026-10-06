import Link from "next/link";
import { Suspense } from "react";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import { RatingSkeleton, SkeletonRegion } from "@/components/Skeleton";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { getSessionUser } from "@/server/auth";
import { getReviewRatingDistribution } from "@/server/queries/material-content";
import type { MaterialDetail } from "@/server/queries/materials";
import { listReviewsByMaterial } from "@/server/queries/reviews";

import { unwrapQueryResult } from "../query-result";
import { MockReviewCard } from "./MockReviewCard";
import { RatingSummary } from "./RatingSummary";

/** 見本 S.material の感想口コミ見出し（`.sec-h`）。読み込み中の表示でも使う。 */
export function ReviewsHeading({ count }: { count?: number }) {
  return (
    <div className="sec-h" id="anchorReviews" style={{ marginTop: 26 }}>
      <h2 id="reviews-heading">
        感想口コミ{" "}
        {count === undefined ? null : (
          <span className="muted tnum" style={{ fontSize: 12 }}>
            {count}件
          </span>
        )}
      </h2>
    </div>
  );
}

async function MaterialRating({ material }: { material: MaterialDetail }) {
  const distribution = unwrapQueryResult(await getReviewRatingDistribution(material.id));
  return (
    <RatingSummary
      average={material.avg_rating}
      reviewCount={material.review_count}
      distribution={distribution}
    />
  );
}

/** 見本 S.material の boxReviews（評価の分布・新しい3件・もっと見る）。 */
export async function MaterialReviewsSection({
  material,
  viewerUserId,
}: {
  material: MaterialDetail;
  viewerUserId: string | null;
}) {
  const [reviewsResult, session] = await Promise.all([
    listReviewsByMaterial(material.id, { sort: "newest", page: 1, viewerUserId }),
    getSessionUser(),
  ]);
  const reviews = unwrapQueryResult(reviewsResult);
  const materialPath = `/materials/${material.id}`;
  const viewerIsGeneral = session !== null && canUseGeneralFeatures(session.accountType);

  return (
    <section aria-labelledby="reviews-heading">
      <ReviewsHeading count={reviews.total} />
      <Suspense
        fallback={
          <SkeletonRegion label="評価の分布を読み込んでいます">
            <RatingSkeleton />
          </SkeletonRegion>
        }
      >
        <MaterialRating material={material} />
      </Suspense>
      {reviews.items.length > 0 ? (
        <div className="stack" style={{ marginTop: 10 }}>
          {reviews.items.slice(0, 3).map((review) => (
            <MockReviewCard
              key={review.id}
              review={review}
              currentPath={materialPath}
              canManage={viewerIsGeneral && session.userId === review.author_user_id}
              actions={
                <PostActionsLoader
                  target="review"
                  id={review.id}
                  currentPath={materialPath}
                  helpfulCount={review.helpfulCount}
                />
              }
            />
          ))}
        </div>
      ) : (
        <div className="card pad" style={{ marginTop: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700 }}>まだ感想口コミがありません</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            この資材の最初の感想口コミを投稿できます。
          </p>
        </div>
      )}
      {reviews.total > 0 ? (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <div
            className="muted"
            aria-hidden="true"
            style={{ letterSpacing: ".2em", marginBottom: 2 }}
          >
            ・・・
          </div>
          <Link className="link-more" href={`${materialPath}/reviews`}>
            もっと見る（全{reviews.total}件） →
          </Link>
        </div>
      ) : null}
    </section>
  );
}

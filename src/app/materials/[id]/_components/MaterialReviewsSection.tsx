import type { ReactNode } from "react";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import type { ReviewListItem } from "@/server/queries/reviews";

import { css } from "../../../../../styled-system/css";

import { EmptyCard } from "./EmptyCard";
import { MaterialSectionHeading } from "./MaterialSectionHeading";
import { MockReviewCard } from "./MockReviewCard";
import { MoreLink } from "./MoreLink";
import { ScrollToHashOnMount } from "./ScrollToHashOnMount";

const listStyle = css({ mt: "2.5", display: "flex", flexDirection: "column", gap: "2.5" });
const emptyStyle = css({ mt: "2.5" });
const moreStyle = css({ mt: "3", textAlign: "center" });
const ellipsisStyle = css({ mb: "0.5", color: "text.subtle", letterSpacing: "0.2em" });

/** 感想口コミの見出し。読み込み中の表示でも使う。 */
export function ReviewsHeading({ count }: { count?: number }) {
  return (
    <MaterialSectionHeading
      id="anchorReviews"
      headingId="reviews-heading"
      title="感想口コミ"
      count={count}
      spacing="section"
    />
  );
}

type MaterialReviewsSectionProps = {
  materialPath: string;
  reviews: ReviewListItem[];
  total: number;
  /** 一般ユーザーとしてログインしている閲覧者。自分の感想口コミに編集・削除を出す。 */
  viewerUserId: string | null;
  /** 評価の分布（読み込み中は Suspense の代替表示が入る）。 */
  rating: ReactNode;
};

/** 資材ページの感想口コミ欄（評価の分布・新しい3件・もっと見る）。 */
export function MaterialReviewsSection({
  materialPath,
  reviews,
  total,
  viewerUserId,
  rating,
}: MaterialReviewsSectionProps) {
  return (
    <section aria-labelledby="reviews-heading">
      <ReviewsHeading count={total} />
      {/* 投稿・削除後の `?review=…#reviews-heading` で、この欄が出たあとに見出しまで移る */}
      <ScrollToHashOnMount targetId="reviews-heading" trigger={total} />
      {rating}
      {reviews.length > 0 ? (
        <div className={listStyle}>
          {reviews.map((review) => (
            <MockReviewCard
              key={review.id}
              review={review}
              currentPath={materialPath}
              canManage={viewerUserId !== null && viewerUserId === review.author_user_id}
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
        <EmptyCard
          className={emptyStyle}
          title="まだ感想口コミがありません"
          description="この資材の最初の感想口コミを投稿できます。"
        />
      )}
      {total > 0 ? (
        <div className={moreStyle}>
          <div className={ellipsisStyle} aria-hidden="true">
            ・・・
          </div>
          <MoreLink href={`${materialPath}/reviews`}>もっと見る（全{total}件） →</MoreLink>
        </div>
      ) : null}
    </section>
  );
}

import { Icon } from "@/components/Icon";
import type { ReactNode } from "react";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import type { ReviewListItem } from "@/server/queries/reviews";

import { css } from "../../../../../styled-system/css";

import { EmptyCard } from "./EmptyCard";
import { MaterialSectionHeading } from "./MaterialSectionHeading";
import { MaterialReviewCard } from "./MaterialReviewCard";
import { MoreLink } from "./MoreLink";
import { ScrollToHashOnMount } from "./ScrollToHashOnMount";

const listStyle = css({ mt: "2.5", display: "flex", flexDirection: "column", gap: "2.5" });
const emptyStyle = css({ mt: "2.5" });
const moreStyle = css({ mt: "3", textAlign: "center" });
const ellipsisStyle = css({ mb: "0.5", color: "text.subtle", letterSpacing: "[0.2em]" });

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
  viewerUserId: string | null;
  rating: ReactNode;
};

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
      <ScrollToHashOnMount targetId="reviews-heading" trigger={total} />
      {rating}
      {reviews.length > 0 ? (
        <div className={listStyle}>
          {reviews.map((review) => (
            <MaterialReviewCard
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
          <MoreLink href={`${materialPath}/reviews`}>
            もっと見る（全{total}件） <Icon name="arrow_forward" size="xs" />
          </MoreLink>
        </div>
      ) : null}
    </section>
  );
}

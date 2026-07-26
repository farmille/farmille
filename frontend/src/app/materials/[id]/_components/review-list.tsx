import { EmptyState, ReviewCard } from "@/components";
import type { ReviewListItem } from "@/server/queries/reviews";
import { css } from "../../../../../styled-system/css";

type ReviewListProps = {
  reviews: ReviewListItem[];
  emptyDescription?: string;
};

export function ReviewList({ reviews, emptyDescription }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="まだレビューがありません"
        description={emptyDescription ?? "この資材の最初のレビューを投稿できます。"}
      />
    );
  }

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "2.5" })}>
      {reviews.map((review) => (
        <div key={review.id} id={`review-${review.id}`} className={css({ scrollMarginTop: "16" })}>
          <ReviewCard
            handle={review.author?.handle ?? "退会したユーザー"}
            authorHref={review.author?.user_id ? `/users/${review.author.user_id}` : undefined}
            avatarSrc={review.author?.avatar_url ?? undefined}
            crop={review.crop?.name ?? "作目情報なし"}
            rating={review.rating}
            helpfulCount={review.helpfulCount}
            body={review.body}
            photos={review.photos.map((photo) => ({
              id: photo.id,
              src: photo.url,
              alt: photo.caption ?? "レビュー写真",
            }))}
          />
        </div>
      ))}
    </div>
  );
}

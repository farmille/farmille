import { EmptyState, ReviewCard } from "@/components";
import { getSessionUser } from "@/server/auth";
import type { ReviewListItem } from "@/server/queries/reviews";
import { css } from "../../../../../styled-system/css";

type ReviewListProps = {
  reviews: ReviewListItem[];
  emptyDescription?: string;
  /** ログイン誘導・revalidatePath の対象パス（省略時は資材詳細ページ）。 */
  currentPath?: string;
};

export async function ReviewList({ reviews, emptyDescription, currentPath }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="まだレビューがありません"
        description={emptyDescription ?? "この資材の最初のレビューを投稿できます。"}
      />
    );
  }

  const session = await getSessionUser();

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "2.5" })}>
      {reviews.map((review) => (
        <div key={review.id} id={`review-${review.id}`} className={css({ scrollMarginTop: "16" })}>
          <ReviewCard
            reviewId={review.id}
            materialId={review.material_id}
            canManage={
              session?.accountType === "general" && session.userId === review.author_user_id
            }
            helpfulVoted={review.helpfulVotedByViewer}
            currentPath={currentPath}
            handle={review.author?.handle ?? "退会したユーザー"}
            authorHref={review.author?.user_id ? `/users/${review.author.user_id}` : undefined}
            avatarSrc={review.author?.avatar_url ?? undefined}
            crop={review.crops.map(({ name }) => name).join("・")}
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

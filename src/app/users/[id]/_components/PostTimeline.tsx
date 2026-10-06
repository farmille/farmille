import { PostActionsLoader } from "@/components/PostActionsLoader";
import { Icon } from "@/components/Icon";
import Link from "next/link";

import { EmptyState, ReportCard, ReviewCard } from "@/components";
import type { PublicProfilePageData, PublicProfilePost } from "@/server/queries/public-profiles";
import { css } from "../../../../../styled-system/css";

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  tab: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    alignItems: "start",
  },
});

const reviewDestination = css({
  display: "inline-flex",
  mt: "2",
  color: "primary.700",
  fontSize: "sm",
  fontWeight: "bold",
  textDecoration: "none",
});

type PostTimelineProps = {
  profile: PublicProfilePageData["profile"];
  posts: readonly PublicProfilePost[];
  /** ログイン中の一般ユーザーの user_id。未ログインは null。 */
  viewerUserId?: string | null;
};

export function PostTimeline({ profile, posts, viewerUserId = null }: PostTimelineProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        title="公開中の投稿はまだありません"
        description="感想口コミや実証詳細レポートが公開されると、ここに表示されます。"
      />
    );
  }

  const authorHref = `/users/${profile.userId}`;
  // プロフィール本人が自分の公開プロフィールを見ている場合は、
  // 自分の投稿に「参考になった」「通報する」を出さない（materialId は渡さないため
  // 編集・削除ボタンも表示されない）。
  const isOwnReview = viewerUserId !== null && viewerUserId === profile.userId;

  return (
    <div className={stack}>
      {posts.map((post) =>
        post.kind === "review" ? (
          <article key={`review-${post.id}`}>
            <ReviewCard
              actions={
                <PostActionsLoader
                  target="review"
                  id={post.id}
                  currentPath={authorHref}
                  helpfulCount={post.helpfulCount}
                />
              }
              reviewId={post.id}
              canManage={isOwnReview}
              currentPath={authorHref}
              handle={profile.handle}
              authorHref={authorHref}
              avatarSrc={profile.avatarUrl ?? undefined}
              crop={post.cropName}
              rating={post.rating}
              helpfulCount={post.helpfulCount}
              body={post.body}
              materialName={post.materialName}
              photos={post.photos.map((photo) => ({
                id: photo.id,
                src: photo.url,
                alt: photo.alt,
              }))}
            />
            <Link
              href={`/materials/${post.materialId}#review-${post.id}`}
              className={reviewDestination}
            >
              資材詳細でこの感想口コミを見る <Icon name="arrow_forward" size="sm" />
            </Link>
          </article>
        ) : (
          <ReportCard
            actions={
              <PostActionsLoader
                target="usage_report"
                id={post.id}
                currentPath={`/reports/${post.id}`}
                helpfulCount={post.helpfulCount}
              />
            }
            reportId={post.id}
            key={`usage-report-${post.id}`}
            title={post.title}
            author={profile.handle}
            authorHref={authorHref}
            avatarSrc={profile.avatarUrl ?? undefined}
            crop={post.cropName}
            helpfulCount={post.helpfulCount}
            coverSrc={post.coverUrl ?? undefined}
            href={`/reports/${post.id}`}
            layout="list"
          />
        ),
      )}
    </div>
  );
}

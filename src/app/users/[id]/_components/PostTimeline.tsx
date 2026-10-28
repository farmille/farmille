import { PostActionsLoader } from "@/components/PostActionsLoader";
import { ProfileReviewCard } from "@/components/ProfileReviewCard";
import { UsageReportCard } from "@/app/materials/[id]/_components/UsageReportCard";
import type { PublicProfilePageData, PublicProfilePost } from "@/server/queries/public-profiles";

import { EmptyNote, postStackStyle } from "@/app/me/_components/ProfileParts";

type PostTimelineProps = {
  profile: PublicProfilePageData["profile"];
  posts: readonly PublicProfilePost[];
  authorLabel?: string;
  /** ログイン中の一般ユーザーの user_id。未ログインは null。 */
  viewerUserId?: string | null;
};

export function PostTimeline({
  profile,
  posts,
  authorLabel,
  viewerUserId = null,
}: PostTimelineProps) {
  if (posts.length === 0) {
    return (
      <EmptyNote
        title="公開中の投稿はまだありません"
        description="感想口コミや実証詳細レポートが公開されると、ここに表示されます。"
      />
    );
  }

  const authorHref = `/users/${profile.userId}`;
  const isOwnProfile = viewerUserId !== null && viewerUserId === profile.userId;

  return (
    <div className={postStackStyle}>
      {posts.map((post) =>
        post.kind === "review" ? (
          <ProfileReviewCard
            key={`review-${post.id}`}
            review={post}
            author={{
              name: profile.handle,
              avatarUrl: profile.avatarUrl,
              label: authorLabel ?? "",
              href: authorHref,
            }}
            actions={
              <PostActionsLoader
                target="review"
                id={post.id}
                currentPath={authorHref}
                helpfulCount={post.helpfulCount}
                own={isOwnProfile}
              />
            }
            reportReturnPath={isOwnProfile ? undefined : authorHref}
          />
        ) : (
          <UsageReportCard
            key={`usage-report-${post.id}`}
            href={`/reports/${post.id}`}
            title={post.title}
            author={profile.handle}
            avatarSrc={profile.avatarUrl}
            coverSrc={post.coverUrl ?? undefined}
            crop={post.cropName}
            actions={
              <PostActionsLoader
                target="usage_report"
                id={post.id}
                currentPath={`/reports/${post.id}`}
                helpfulCount={post.helpfulCount}
              />
            }
          />
        ),
      )}
    </div>
  );
}

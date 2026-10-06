import { PostActionsLoader } from "@/components/PostActionsLoader";
import { MockProfileReviewCard } from "@/app/_mock/MockProfileReviewCard";
import { MockReportCard } from "@/app/materials/[id]/_components/MockReportCard";
import type { PublicProfilePageData, PublicProfilePost } from "@/server/queries/public-profiles";

type PostTimelineProps = {
  profile: PublicProfilePageData["profile"];
  posts: readonly PublicProfilePost[];
  /** 投稿者の肩書き（立場・都道府県）。 */
  authorLabel?: string;
  /** ログイン中の一般ユーザーの user_id。未ログインは null。 */
  viewerUserId?: string | null;
};

/** 見本 S.profilePublic の「これまでの投稿」（`.stack` に reportCard・reviewCard）。 */
export function PostTimeline({
  profile,
  posts,
  authorLabel,
  viewerUserId = null,
}: PostTimelineProps) {
  if (posts.length === 0) {
    return (
      <div className="card pad empty-note">
        <b>公開中の投稿はまだありません</b>
        感想口コミや実証詳細レポートが公開されると、ここに表示されます。
      </div>
    );
  }

  const authorHref = `/users/${profile.userId}`;
  // プロフィール本人が自分の公開プロフィールを見ている場合は、自分の投稿に「通報する」を出さない。
  const isOwnProfile = viewerUserId !== null && viewerUserId === profile.userId;

  return (
    <div className="stack">
      {posts.map((post) =>
        post.kind === "review" ? (
          <MockProfileReviewCard
            key={`review-${post.id}`}
            review={post}
            author={{
              handle: profile.handle,
              avatarUrl: profile.avatarUrl,
              href: authorHref,
              label: authorLabel,
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
          <MockReportCard
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

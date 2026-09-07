import Link from "next/link";

import {
  Badge,
  EmptyState,
  MaterialCard,
  MaterialCardRail,
  ReportCard,
  ReviewCard,
  SectionHeading,
} from "@/components";
import type { HelpfulItem, OwnPostItem } from "@/server/queries/me-page";
import type { OwnProfile } from "@/server/queries/profiles";
import type { SavedMaterialItem } from "@/server/queries/saved-materials";
import { css } from "../../../../styled-system/css";

const stack = css({
  display: "flex",
  flexDirection: "column",
  gap: "2.5",
  lg: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    alignItems: "start",
  },
});

const reviewLink = css({
  display: "inline-flex",
  mt: "2",
  color: "brand.primary",
  fontSize: "sm",
  fontWeight: "700",
  textDecoration: "none",
});

const statusRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  mb: "2",
});

type UsageReportStatusPresentation = {
  label: string;
  variant: "optional" | "required" | "published";
};

function usageReportStatusLabel(
  status: OwnPostItem & { kind: "usage_report" },
): UsageReportStatusPresentation {
  switch (status.status) {
    case "draft":
      return { label: "下書き", variant: "optional" };
    case "pending":
      return { label: "調整中", variant: "required" };
    case "published":
      return { label: "公開済み", variant: "published" };
    case "declined":
      return { label: "差し戻し", variant: "required" };
  }
}

type PostsShelfProps = {
  profile: OwnProfile;
  posts: readonly OwnPostItem[];
};

export function PostsShelf({ profile, posts }: PostsShelfProps) {
  return (
    <section aria-labelledby="me-posts-heading">
      <SectionHeading title={<span id="me-posts-heading">自分の投稿</span>} />
      {posts.length === 0 ? (
        <EmptyState
          title="まだ投稿がありません"
          description="レビューや使用レポートを書くと、ここに並びます。"
        />
      ) : (
        <div className={stack}>
          {posts.map((post) =>
            post.kind === "review" ? (
              <article key={`review-${post.id}`}>
                <ReviewCard
                  handle={profile.handle}
                  avatarSrc={profile.avatarUrl ?? undefined}
                  crop={post.cropName}
                  rating={post.rating}
                  helpfulCount={post.helpfulCount}
                  body={post.body}
                  materialName={post.materialName}
                />
                <Link
                  href={`/materials/${post.materialId}#review-${post.id}`}
                  className={reviewLink}
                >
                  資材詳細でこのレビューを見る →
                </Link>
              </article>
            ) : (
              <article key={`report-${post.id}`}>
                <div className={statusRow}>
                  <Badge variant={usageReportStatusLabel(post).variant}>
                    {usageReportStatusLabel(post).label}
                  </Badge>
                  {post.status === "draft" ? (
                    <Link
                      href={`/materials/${post.materialId}/report/new`}
                      className={css({
                        color: "brand.primary",
                        fontSize: "xs",
                        fontWeight: "700",
                        textDecoration: "none",
                      })}
                    >
                      フォームを再開 →
                    </Link>
                  ) : null}
                </div>
                {post.status === "published" ? (
                  <ReportCard
                    title={post.title}
                    author={profile.handle}
                    avatarSrc={profile.avatarUrl ?? undefined}
                    crop={post.cropName}
                    helpfulCount={post.helpfulCount}
                    href={`/reports/${post.id}`}
                    layout="list"
                  />
                ) : (
                  <div
                    className={css({
                      p: "3.5",
                      bg: "surface.card",
                      borderWidth: "1px",
                      borderStyle: "solid",
                      borderColor: "border.default",
                      borderRadius: "card",
                      boxShadow: "shadow",
                    })}
                  >
                    <p className={css({ m: "0", fontWeight: "700", fontSize: "md" })}>
                      {post.title}
                    </p>
                    <p
                      className={css({
                        m: "0",
                        mt: "1.5",
                        color: "text.muted",
                        fontSize: "sm",
                      })}
                    >
                      {post.cropName}
                    </p>
                  </div>
                )}
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

type SavedShelfProps = {
  items: readonly SavedMaterialItem[];
};

export function SavedShelf({ items }: SavedShelfProps) {
  return (
    <section aria-labelledby="me-saved-heading">
      <SectionHeading
        title={<span id="me-saved-heading">検討リスト</span>}
        href="/me/saved"
        linkLabel="すべて見る →"
      />
      {items.length === 0 ? (
        <EmptyState
          title="保存した資材はまだありません"
          description="気になる資材を保存すると、比較やあとからの確認がしやすくなります。"
        />
      ) : (
        <MaterialCardRail>
          {items.map((item) => (
            <MaterialCard
              key={item.savedId}
              variant="scroll"
              name={item.name}
              maker={item.manufacturerName}
              rating={item.avgRating ?? 0}
              reviewCount={item.reviewCount}
              official={item.official}
              href={`/materials/${item.materialId}`}
              imageSrc={item.primaryImageUrl ?? undefined}
            />
          ))}
        </MaterialCardRail>
      )}
    </section>
  );
}

type HelpfulShelfProps = {
  items: readonly HelpfulItem[];
};

export function HelpfulShelf({ items }: HelpfulShelfProps) {
  return (
    <section aria-labelledby="me-helpful-heading">
      <SectionHeading title={<span id="me-helpful-heading">参考になった</span>} />
      {items.length === 0 ? (
        <EmptyState
          title="まだ参考になったを付けていません"
          description="役に立ったレビューや使用レポートに付けると、ここに残ります。"
        />
      ) : (
        <div className={stack}>
          {items.map((item) =>
            item.kind === "review" ? (
              <article key={`helpful-review-${item.id}`}>
                <ReviewCard
                  reviewId={item.id}
                  helpfulVoted
                  currentPath="/me"
                  handle={item.authorHandle}
                  authorHref={item.authorUserId ? `/users/${item.authorUserId}` : undefined}
                  crop={item.cropName}
                  rating={item.rating}
                  helpfulCount={item.helpfulCount}
                  body={item.body}
                  materialName={item.materialName}
                />
                <Link
                  href={`/materials/${item.materialId}#review-${item.id}`}
                  className={reviewLink}
                >
                  資材詳細でこのレビューを見る →
                </Link>
              </article>
            ) : (
              <ReportCard
                key={`helpful-report-${item.id}`}
                title={item.title}
                author={item.authorHandle}
                authorHref={item.authorUserId ? `/users/${item.authorUserId}` : undefined}
                crop={item.cropName}
                helpfulCount={item.helpfulCount}
                href={`/reports/${item.id}`}
                layout="list"
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}

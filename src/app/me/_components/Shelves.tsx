import { Icon } from "@/components/Icon";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/Badge";
import { PostActionsLoader } from "@/components/PostActionsLoader";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { ProfileReviewCard } from "@/components/ProfileReviewCard";
import { UsageReportCard } from "@/app/materials/[id]/_components/UsageReportCard";
import type { HelpfulItem, OwnPostItem } from "@/server/queries/me-page";
import type { OwnProfile } from "@/server/queries/profiles";
import type { SavedMaterialItem } from "@/server/queries/saved-materials";
import { css, cva } from "../../../../styled-system/css";

import { EmptyNote, postStackStyle, ProfileSectionHeading } from "./ProfileParts";

const linkRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  px: "3.5",
  py: "3",
  color: "inherit",
  textDecoration: "none",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  _last: { borderBottomWidth: "0" },
});

const postList = cva({
  base: { mt: "2.5" },
  variants: {
    kind: {
      reports: {
        display: "flex",
        alignItems: "flex-start",
        gap: "2.5",
        mx: "-4",
        px: "4",
        pt: "0.5",
        pb: "1.5",
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        "& > *": { flex: "0 0 74%", scrollSnapAlign: "start" },
        tab: {
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "3",
          mx: "0",
          px: "0",
          overflow: "visible",
          "& > *": { flex: "none", w: "auto" },
        },
      },
      reviews: { display: "flex", flexDirection: "column", gap: "3" },
    },
  },
});

const unpublishedCard = css(surfaceCardRecipe.raw(), { overflow: "hidden" });

const postStatus = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  mb: "1.5",
  fontSize: "sm",
  "& a": { color: "primary.800", fontWeight: "bold", textDecoration: "none" },
});

const postTitle = css({ textStyle: "body", fontWeight: "bold" });

const postCrop = css({ mt: "1", color: "text.subtle", textStyle: "note" });

const savedList = css(surfaceCardRecipe.raw({ padding: "flush" }));

const savedName = css({ mt: "0.5", textStyle: "body", fontWeight: "bold" });

const savedMaker = css({ mt: "0.5", color: "text.subtle", textStyle: "note" });

export function LinkRow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className={linkRow} href={href}>
      <div className={css({ minW: "0" })}>{children}</div>
      <Icon name="chevron_right" size="sm" className={css({ color: "text.subtle" })} />
    </Link>
  );
}

function UsageReportStatus({
  status,
}: {
  status: (OwnPostItem & { kind: "usage_report" })["status"];
}) {
  switch (status) {
    case "draft":
      return <Badge variant="optional">下書き</Badge>;
    case "pending":
      return <Badge variant="required">運営で確認中</Badge>;
    case "published":
      return <Badge variant="published">公開済み</Badge>;
    case "declined":
      return <Badge variant="required">差し戻し</Badge>;
  }
}

type PostsShelfProps = {
  profile: OwnProfile;
  posts: readonly OwnPostItem[];
  kind?: "reports" | "reviews";
  authorLabel?: string;
};

export function PostsShelf({ profile, posts, kind = "reviews", authorLabel }: PostsShelfProps) {
  if (posts.length === 0) {
    return (
      <div className={css({ mt: "2.5" })}>
        <EmptyNote
          title="まだ投稿がありません"
          description="感想口コミや実証詳細レポートを書くと、ここに並びます。"
        />
      </div>
    );
  }

  return (
    <div className={postList({ kind })} aria-labelledby="me-posts-heading" role="region">
      {posts.map((post) =>
        post.kind === "review" ? (
          <ProfileReviewCard
            key={`review-${post.id}`}
            review={post}
            author={{ handle: profile.handle, avatarUrl: profile.avatarUrl, label: authorLabel }}
            actions={
              <PostActionsLoader
                target="review"
                id={post.id}
                currentPath="/me"
                helpfulCount={post.helpfulCount}
              />
            }
            reportReturnPath={`/materials/${post.materialId}`}
          />
        ) : post.status === "published" ? (
          <UsageReportCard
            key={`report-${post.id}`}
            href={`/reports/${post.id}`}
            title={post.title}
            author={profile.handle}
            avatarSrc={profile.avatarUrl}
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
        ) : (
          <article key={`report-${post.id}`} className={unpublishedCard}>
            <div className={postStatus}>
              <UsageReportStatus status={post.status} />
              {post.status === "draft" ? (
                <Link href={`/materials/${post.materialId}/report/new`}>フォームを再開 →</Link>
              ) : null}
            </div>
            <div className={postTitle}>{post.title}</div>
            <div className={postCrop}>{post.cropName}</div>
          </article>
        ),
      )}
    </div>
  );
}

type SavedShelfProps = {
  items: readonly SavedMaterialItem[];
};

export function SavedShelf({ items }: SavedShelfProps) {
  return (
    <section aria-labelledby="me-saved-heading">
      <ProfileSectionHeading
        id="me-saved-heading"
        count={`${items.length}件`}
        more={{ href: "/me/saved", label: "すべて見る・比較する" }}
      >
        お気に入りの資材
      </ProfileSectionHeading>
      {items.length === 0 ? (
        <EmptyNote
          title="保存した資材はまだありません"
          description="気になる資材を保存すると、比較やあとからの確認がしやすくなります。"
        />
      ) : (
        <div className={savedList}>
          {items.map((item) => (
            <LinkRow key={item.savedId} href={`/materials/${item.materialId}`}>
              <div className={savedName}>★ {item.name}</div>
              <div className={savedMaker}>{item.manufacturerName}</div>
            </LinkRow>
          ))}
        </div>
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
      <ProfileSectionHeading id="me-helpful-heading">参考になった</ProfileSectionHeading>
      {items.length === 0 ? (
        <EmptyNote
          title="まだ参考になったを付けていません"
          description="役に立った感想口コミや実証詳細レポートに付けると、ここに残ります。"
        />
      ) : (
        <div className={postStackStyle}>
          {items.map((item) =>
            item.kind === "review" ? (
              <ProfileReviewCard
                key={`helpful-review-${item.id}`}
                review={item}
                author={{
                  handle: item.authorHandle,
                  href: item.authorUserId ? `/users/${item.authorUserId}` : undefined,
                }}
                actions={
                  <PostActionsLoader
                    target="review"
                    id={item.id}
                    currentPath="/me"
                    helpfulCount={item.helpfulCount}
                  />
                }
                reportReturnPath="/me"
              />
            ) : (
              <UsageReportCard
                key={`helpful-report-${item.id}`}
                href={`/reports/${item.id}`}
                title={item.title}
                author={item.authorHandle}
                crop={item.cropName}
                actions={
                  <PostActionsLoader
                    target="usage_report"
                    id={item.id}
                    currentPath={`/reports/${item.id}`}
                    helpfulCount={item.helpfulCount}
                  />
                }
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}

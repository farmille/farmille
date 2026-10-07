import Link from "next/link";
import type { ReactNode } from "react";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import { MockProfileReviewCard } from "@/app/_mock/MockProfileReviewCard";
import { MockReportCard } from "@/app/materials/[id]/_components/MockReportCard";
import type { HelpfulItem, OwnPostItem } from "@/server/queries/me-page";
import type { OwnProfile } from "@/server/queries/profiles";
import type { SavedMaterialItem } from "@/server/queries/saved-materials";

/** 見本の CHEV（行の右端の ›）。 */
function Chevron() {
  return (
    <svg
      className="chev"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** 見本 S.mypage の `.detail-row`（タップで移動する行）。 */
export function MockLinkRow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="detail-row"
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <div style={{ minWidth: 0 }}>{children}</div>
      <Chevron />
    </Link>
  );
}

function EmptyNote({ title, description }: { title: string; description: string }) {
  return (
    <div className="card pad empty-note">
      <b>{title}</b>
      {description}
    </div>
  );
}

function usageReportStatusLabel(status: (OwnPostItem & { kind: "usage_report" })["status"]) {
  switch (status) {
    case "draft":
      return { label: "下書き", className: "badge badge-opt" };
    case "pending":
      return { label: "調整中", className: "badge badge-req" };
    case "published":
      return { label: "公開済み", className: "badge badge-pub" };
    case "declined":
      return { label: "差し戻し", className: "badge badge-req" };
  }
}

type PostsShelfProps = {
  profile: OwnProfile;
  posts: readonly OwnPostItem[];
  /** 見本は実証詳細レポートを横スクロール、感想口コミを縦に並べる。 */
  kind?: "reports" | "reviews";
  /** 投稿者の肩書き（立場・都道府県）。 */
  authorLabel?: string;
};

/** 見本 S.mypage の「これまでの投稿」（`#myRep` の `.report-scroll`／`#myRev` の `.stack`）。 */
export function PostsShelf({ profile, posts, kind = "reviews", authorLabel }: PostsShelfProps) {
  if (posts.length === 0) {
    return (
      <div style={{ marginTop: 10 }}>
        <EmptyNote
          title="まだ投稿がありません"
          description="感想口コミや実証詳細レポートを書くと、ここに並びます。"
        />
      </div>
    );
  }

  return (
    <div
      className={kind === "reports" ? "report-scroll" : "stack"}
      // 下書き・調整中のカードは表紙が無く低い。横並びで公開済みカードの高さに引き伸ばされて空白ができないよう、上揃えにする。
      style={kind === "reports" ? { marginTop: 10, alignItems: "flex-start" } : { marginTop: 10 }}
      aria-labelledby="me-posts-heading"
      role="region"
    >
      {posts.map((post) =>
        post.kind === "review" ? (
          <MockProfileReviewCard
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
          <MockReportCard
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
          <article key={`report-${post.id}`} className="card pad alist-card">
            <div className="post-status">
              <span className={usageReportStatusLabel(post.status).className}>
                {usageReportStatusLabel(post.status).label}
              </span>
              {post.status === "draft" ? (
                <Link href={`/materials/${post.materialId}/report/new`}>フォームを再開 →</Link>
              ) : null}
            </div>
            <div className="t" style={{ fontWeight: 700, fontSize: 13.5 }}>
              {post.title}
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
              {post.cropName}
            </div>
          </article>
        ),
      )}
    </div>
  );
}

type SavedShelfProps = {
  items: readonly SavedMaterialItem[];
};

/** 見本 S.mypage の「お気に入りの資材」（`.card` の中に `.detail-row`）。 */
export function SavedShelf({ items }: SavedShelfProps) {
  return (
    <section aria-labelledby="me-saved-heading">
      <div className="sec-h">
        <h2 id="me-saved-heading">
          お気に入りの資材{" "}
          <span className="muted tnum" style={{ fontSize: 12 }}>
            {items.length}件
          </span>
        </h2>
        <Link className="link-more" href="/me/saved">
          すべて見る・比較する
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyNote
          title="保存した資材はまだありません"
          description="気になる資材を保存すると、比較やあとからの確認がしやすくなります。"
        />
      ) : (
        <div className="card">
          {items.map((item) => (
            <MockLinkRow key={item.savedId} href={`/materials/${item.materialId}`}>
              <div className="dv" style={{ fontWeight: 700 }}>
                ★ {item.name}
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                {item.manufacturerName}
              </div>
            </MockLinkRow>
          ))}
        </div>
      )}
    </section>
  );
}

type HelpfulShelfProps = {
  items: readonly HelpfulItem[];
};

/** 「参考になった」を付けた投稿（見本に無い本番の機能。見本のカードで並べる）。 */
export function HelpfulShelf({ items }: HelpfulShelfProps) {
  return (
    <section aria-labelledby="me-helpful-heading">
      <div className="sec-h">
        <h2 id="me-helpful-heading">参考になった</h2>
      </div>
      {items.length === 0 ? (
        <EmptyNote
          title="まだ参考になったを付けていません"
          description="役に立った感想口コミや実証詳細レポートに付けると、ここに残ります。"
        />
      ) : (
        <div className="stack">
          {items.map((item) =>
            item.kind === "review" ? (
              <MockProfileReviewCard
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
              <MockReportCard
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

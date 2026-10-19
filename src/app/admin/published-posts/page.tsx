import Link from "next/link";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { adminBodyStyle, Panel } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { formatDateJa } from "@/components";
import { listPublishedPosts } from "@/server/admin/published-posts";
import { errorMessageJa } from "@/server/errors";
import { RemovalForm } from "./RemovalForm";
import { css } from "../../../../styled-system/css";

export const metadata = { title: "公開済みの投稿" };

export default async function PublishedPostsPage() {
  await requireAdminPage("/admin/published-posts");
  const result = await listPublishedPosts();
  if (!result.ok) throw new Error(errorMessageJa[result.error]);
  return (
    <AdminShell
      title="公開済みの投稿"
      backHref="/admin"
      description="公開中の感想口コミ・実証詳細レポートを確認し、必要に応じて非公開にする。"
    >
      {result.data.length === 0 ? (
        <p className={adminBodyStyle}>公開済みの投稿はありません。</p>
      ) : null}
      {result.data.map((post) => (
        <Panel
          key={`${post.type}-${post.id}`}
          title={post.type === "review" ? "感想口コミ" : "実証詳細レポート"}
          note={formatDateJa(post.createdAt)}
        >
          <Link
            href={post.href}
            className={css({
              display: "block",
              textStyle: "body",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              color: "text.brand",
              mb: "3",
            })}
          >
            {post.title}
          </Link>
          <RemovalForm id={post.id} type={post.type} />
        </Panel>
      ))}
    </AdminShell>
  );
}

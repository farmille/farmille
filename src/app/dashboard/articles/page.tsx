import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState, FormPageShell, SurfaceCard, buttonRecipe } from "@/components";
import { SellerAccessDenied } from "../_components/AccessDenied";
import { requireSeller } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { listSellerArticles } from "@/server/queries/seller-articles";
import { css } from "../../../../styled-system/css";
import { ArticleListItem } from "./_components/ArticleListItem";

const pageStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
});

export default async function DashboardArticlesPage() {
  const session = await requireSeller();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent("/dashboard/articles")}`);
    }
    return <SellerAccessDenied backHref="/dashboard" />;
  }

  const result = await listSellerArticles(session.data.sellerId);
  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  return (
    <FormPageShell chrome="seller" backHref="/dashboard" title="記事管理">
      <div className={pageStack}>
        <Link className={buttonRecipe()} href="/dashboard/articles/new">
          新しい記事を書く
        </Link>

        {result.data.length === 0 ? (
          <SurfaceCard>
            <EmptyState
              description="タイトルと本文を書いて、下書きまたは公開できます。"
              title="まだ記事がありません"
            />
          </SurfaceCard>
        ) : (
          result.data.map((article) => <ArticleListItem article={article} key={article.id} />)
        )}
      </div>
    </FormPageShell>
  );
}

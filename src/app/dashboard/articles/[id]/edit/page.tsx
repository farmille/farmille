import { notFound, redirect } from "next/navigation";

import { FormPageShell, SurfaceCard } from "@/components";
import { SellerAccessDenied } from "../../../_components/AccessDenied";
import { requireSeller } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { getSellerArticle } from "@/server/queries/seller-articles";
import { ArticleForm } from "../../_components/ArticleForm";

type EditArticlePageProps = {
  params: Promise<{ id: string }>;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const session = await requireSeller();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent(`/dashboard/articles/${id}/edit`)}`);
    }
    return <SellerAccessDenied backHref="/dashboard" />;
  }

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const result = await getSellerArticle(session.data.sellerId, id);
  if (!result.ok) {
    if (result.error === "not_found") notFound();
    throw new Error(errorMessageJa[result.error]);
  }

  const article = result.data;
  const status = article.status === "published" ? "published" : "draft";

  return (
    <FormPageShell chrome="seller" backHref="/dashboard/articles" title="記事を編集">
      <SurfaceCard
        description="内容を更新したあと、下書き保存または公開できます。"
        title={article.title}
      >
        <ArticleForm
          articleId={article.id}
          initialBody={article.body}
          initialHeroImageUrl={article.hero_image_url}
          initialMaterials={article.materials}
          initialStatus={status}
          initialTitle={article.title}
          mode="edit"
          sellerId={session.data.sellerId}
        />
      </SurfaceCard>
    </FormPageShell>
  );
}

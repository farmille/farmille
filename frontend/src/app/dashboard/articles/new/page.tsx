import { redirect } from "next/navigation";

import { FormPageShell, SurfaceCard } from "@/components";
import { SellerAccessDenied } from "../../_components/access-denied";
import { requireSeller } from "@/server/auth";
import { ArticleForm } from "../_components/article-form";

export default async function NewArticlePage() {
  const session = await requireSeller();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent("/dashboard/articles/new")}`);
    }
    return <SellerAccessDenied backHref="/dashboard" />;
  }

  return (
    <FormPageShell backHref="/dashboard/articles" title="記事を作成">
      <SurfaceCard
        description="Markdown で本文を書き、必要なら資材を紐づけて公開できます。"
        title="新規記事"
      >
        <ArticleForm mode="create" sellerId={session.data.sellerId} />
      </SurfaceCard>
    </FormPageShell>
  );
}

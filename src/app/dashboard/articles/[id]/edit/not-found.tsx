import { PageNotice } from "@/components/PageNotice";
import Link from "next/link";

import { FormPageShell, buttonRecipe } from "@/components";

export default function EditArticleNotFound() {
  return (
    <FormPageShell chrome="seller" backHref="/dashboard/articles" title="記事を編集">
      <PageNotice
        description="指定の記事は見つからないか、別の組織の記事です。"
        title="記事が見つかりません"
      >
        <Link className={buttonRecipe({ variant: "ghost" })} href="/dashboard/articles">
          記事一覧へ戻る
        </Link>
      </PageNotice>
    </FormPageShell>
  );
}

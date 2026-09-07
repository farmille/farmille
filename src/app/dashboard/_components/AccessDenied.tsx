import Link from "next/link";

import { FormPageShell, SurfaceCard, buttonRecipe } from "@/components";

export function SellerAccessDenied({ backHref = "/" }: { backHref?: string }) {
  return (
    <FormPageShell chrome="seller" backHref={backHref} title="メーカーダッシュボード">
      <SurfaceCard
        description="この画面を利用するには、承認済みのメーカーアカウントが必要です。"
        title="メーカーアカウントでログインしてください"
      >
        <Link className={buttonRecipe()} href="/sellers/login">
          メーカーログインへ
        </Link>
      </SurfaceCard>
    </FormPageShell>
  );
}

import Link from "next/link";

import { FormPageShell, SurfaceCard, buttonRecipe } from "@/components";

export function SellerAccessDenied({ backHref = "/" }: { backHref?: string }) {
  return (
    <FormPageShell backHref={backHref} title="出品者ダッシュボード">
      <SurfaceCard
        description="この画面を利用するには、承認済みの出品者アカウントが必要です。"
        title="出品者アカウントでログインしてください"
      >
        <Link className={buttonRecipe()} href="/sellers/login">
          出品者ログインへ
        </Link>
      </SurfaceCard>
    </FormPageShell>
  );
}

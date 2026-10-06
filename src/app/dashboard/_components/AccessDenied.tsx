import { PageNotice } from "@/components/PageNotice";
import Link from "next/link";

import { FormPageShell, buttonRecipe } from "@/components";

export function SellerAccessDenied({ backHref = "/" }: { backHref?: string }) {
  return (
    <FormPageShell chrome="seller" backHref={backHref} title="企業会員ダッシュボード">
      <PageNotice
        description="この画面を利用するには、企業会員登録の承認が必要です。"
        title="企業会員のログインIDでログインしてください"
      >
        <Link className={buttonRecipe()} href="/sellers/login">
          メーカーログインへ
        </Link>
      </PageNotice>
    </FormPageShell>
  );
}

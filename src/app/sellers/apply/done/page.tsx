import type { Metadata } from "next";
import { buttonRecipe } from "@/components/Button";
import Link from "next/link";

import { FormPageShell } from "@/components/FormPageShell";
import { DoneMessage } from "@/app/company-requests/_components/DoneMessage";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "申請を受け付けました",
  robots: NO_INDEX_ROBOTS,
};

export default function SellerApplyDonePage() {
  return (
    <FormPageShell chrome="public" backHref="/" title="申請受付完了">
      <DoneMessage
        className={css({ maxW: "content.reading", mx: "auto" })}
        spacing="section"
        title="申請を受け付けました"
        actions={
          <>
            <Link className={buttonRecipe({ variant: "primary" })} href="/sellers">
              メーカーの方へ に戻る
            </Link>
            <Link className={buttonRecipe({ variant: "ghost" })} href="/">
              ホームへ
            </Link>
          </>
        }
      >
        <p>内容を確認し、ご登録の連絡先メールアドレスへご案内します。</p>
        <p>
          Farmille企業会員IDとパスワード設定のご案内をお送りします。ログイン後、貴社の資材について資材オーナー権限を申請いただけます。運営が確認した資材ごとに資材オーナー権限をお渡しし、製品情報の編集が可能になります。
        </p>
      </DoneMessage>
    </FormPageShell>
  );
}

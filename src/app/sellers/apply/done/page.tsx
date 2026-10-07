import type { Metadata } from "next";
import { buttonRecipe } from "@/components/Button";
import Link from "next/link";

import { SitePageShell } from "@/app/_site/SitePageShell";
import { DoneMessage } from "@/app/company-requests/_components/DoneMessage";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "申請を受け付けました",
  robots: NO_INDEX_ROBOTS,
};

export default function SellerApplyDonePage() {
  return (
    <SitePageShell title="申請受付完了" backHref="/">
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
          ログインIDとパスワード設定のご案内をお送りします。ログイン後、掲載・オーナー権限の申請フォームから対象資材と確認資料をご提出ください。運営が確認した資材ごとに編集権をお渡しします。
        </p>
      </DoneMessage>
    </SitePageShell>
  );
}

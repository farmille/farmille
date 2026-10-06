import type { Metadata } from "next";
import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { FormPageShell } from "@/components/FormPageShell";
import { formActionsStyle, HintBox } from "@/components/auth/Fields";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "申請を受け付けました",
  robots: NO_INDEX_ROBOTS,
};

const titleStyle = css({
  fontSize: "xl",
  lineHeight: "snug",
  mb: "3",
});

const bodyStyle = css({
  fontSize: "md",
  color: "text.muted",
  lineHeight: "relaxed",
  mb: "4",
});

export default function SellerApplyDonePage() {
  return (
    <FormPageShell chrome="public" backHref="/" title="申請受付完了">
      <h2 className={titleStyle}>申請を受け付けました</h2>
      <p className={bodyStyle}>内容を確認し、ご登録の連絡先メールアドレスへご案内します。</p>
      <HintBox>
        ログインIDとパスワード設定のご案内をお送りします。ログイン後、掲載・オーナー権限の申請フォームから対象資材と確認資料をご提出ください。運営が確認した資材ごとに編集権をお渡しします。
      </HintBox>
      <div className={formActionsStyle}>
        <Link className={buttonRecipe({ variant: "ghost", size: "md" })} href="/">
          ホームへ
        </Link>
      </div>
    </FormPageShell>
  );
}

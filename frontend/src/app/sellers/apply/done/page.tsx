import type { Metadata } from "next";
import Link from "next/link";

import { FormPageShell } from "@/components/form-page-shell";
import { formActionsStyle, ghostButtonStyle, HintBox } from "@/components/auth/fields";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { css } from "../../../../../styled-system/css";

export const metadata: Metadata = {
  title: "申請を受け付けました",
  robots: NO_INDEX_ROBOTS,
};

const titleStyle = css({
  fontSize: "xl",
  fontWeight: "700",
  lineHeight: "1.4",
  mb: "3",
});

const bodyStyle = css({
  fontSize: "md",
  color: "text.muted",
  lineHeight: "1.7",
  mb: "4",
});

export default function SellerApplyDonePage() {
  return (
    <FormPageShell backHref="/" title="申請受付完了">
      <h2 className={titleStyle}>申請を受け付けました</h2>
      <p className={bodyStyle}>
        内容を確認し、通常3営業日以内にご連絡します。審査結果はご登録の連絡先メールアドレスへお送りします。
      </p>
      <HintBox>
        ログイン情報は承認後にご案内します。追加の資料が必要な場合は、担当者からご連絡することがあります。
      </HintBox>
      <div className={formActionsStyle}>
        <Link className={ghostButtonStyle} href="/">
          ホームへ
        </Link>
      </div>
    </FormPageShell>
  );
}

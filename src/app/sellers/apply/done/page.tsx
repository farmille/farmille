import type { Metadata } from "next";
import Link from "next/link";

import { FormPageShell } from "@/components/FormPageShell";
import { formActionsStyle, ghostButtonStyle, HintBox } from "@/components/auth/Fields";
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
    <FormPageShell chrome="public" backHref="/" title="申請受付完了">
      <h2 className={titleStyle}>申請を受け付けました</h2>
      <p className={bodyStyle}>内容を確認し、ご登録の連絡先メールアドレスへご案内します。</p>
      <HintBox>
        ログインIDとパスワード設定のご案内、資材候補一覧、編集権の申込書類をお送りします。書類をご返送いただき、所有権を確認した資材の編集権をお渡しします。
      </HintBox>
      <div className={formActionsStyle}>
        <Link className={ghostButtonStyle} href="/">
          ホームへ
        </Link>
      </div>
    </FormPageShell>
  );
}

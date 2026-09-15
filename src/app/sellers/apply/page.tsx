import type { Metadata } from "next";

import { SellerApplyForm } from "@/app/sellers/apply/SellerApplyForm";
import { FormPageShell } from "@/components/FormPageShell";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "メーカーアカウントの申請",
  description:
    "農業資材メーカー専用アカウントの申請フォームです。申請内容を確認し、メールでご案内します。申請・掲載・編集は無料です。",
  robots: NO_INDEX_ROBOTS,
};

const leadStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  lineHeight: "1.6",
  mb: "4.5",
});

type SellerApplyPageProps = {
  searchParams: Promise<{ from?: string | string[] }>;
};

/** 任意URLは受け取らず、既知の入口だけを安全な戻り先へ対応させる。 */
function backHrefFor(source: string | string[] | undefined): "/me" | "/sellers" {
  return source === "me" ? "/me" : "/sellers";
}

export default async function SellerApplyPage({ searchParams }: SellerApplyPageProps) {
  const { from } = await searchParams;

  return (
    <FormPageShell
      chrome="public"
      active="me"
      backHref={backHrefFor(from)}
      title="メーカーアカウントの申請"
    >
      <p className={leadStyle}>
        農業資材メーカー専用のアカウントです。内容を確認し、ログインIDとパスワード設定のご案内、資材候補一覧、編集権の申込書類をメールでお送りします。編集権は書類確認後に資材ごとにお渡しします。申請・掲載・編集は無料です。
      </p>
      <SellerApplyForm />
    </FormPageShell>
  );
}

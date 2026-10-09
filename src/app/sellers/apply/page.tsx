import type { Metadata } from "next";

import { FormPageShell } from "@/components/FormPageShell";
import { SellerApplyForm } from "@/app/sellers/apply/SellerApplyForm";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "企業会員登録の申請",
  description:
    "企業会員登録の申請フォームです。申請内容を確認し、メールでご案内します。申請・掲載・編集は無料です。",
  robots: NO_INDEX_ROBOTS,
};

const leadStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  lineHeight: "relaxed",
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
      title="企業会員登録の申請"
    >
      <h1 className={css({ srOnly: true })}>企業会員登録の申請</h1>
      <p className={leadStyle}>
        農業資材メーカー専用の企業会員アカウントです。内容を確認し、ログインIDとパスワード設定のご案内をメールでお送りします。ログイン後、掲載・オーナー権限の申請フォームから対象資材と確認資料をご提出ください。運営が確認した資材ごとに編集権をお渡しします。申請・掲載・編集は無料です。
      </p>
      <SellerApplyForm />
    </FormPageShell>
  );
}

import type { Metadata } from "next";

import { SellerApplyForm } from "@/app/sellers/apply/SellerApplyForm";
import { FormPageShell } from "@/components/FormPageShell";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "メーカーアカウントの申請",
  description:
    "農業資材メーカー専用アカウントの申請フォームです。審査のうえ、通常3営業日以内にご連絡します。",
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
        農業資材メーカー専用のアカウントです。自社資材の情報確認や変更申請、記事管理に利用できます。審査のうえ、通常3営業日以内にご連絡します。
      </p>
      <SellerApplyForm />
    </FormPageShell>
  );
}

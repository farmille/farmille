import type { Metadata } from "next";

import { SellerApplyForm } from "@/app/sellers/apply/SellerApplyForm";
import { FormPageShell } from "@/components/FormPageShell";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "メーカー・出品者アカウントの申請",
  description:
    "メーカー・出品者アカウントの申請フォームです。審査のうえ、通常3営業日以内にご連絡します。",
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
function backHrefFor(source: string | string[] | undefined): "/me" | "/signup" {
  return source === "me" ? "/me" : "/signup";
}

export default async function SellerApplyPage({ searchParams }: SellerApplyPageProps) {
  const { from } = await searchParams;

  return (
    <FormPageShell
      chrome="public"
      active="me"
      backHref={backHrefFor(from)}
      title="メーカー・出品者アカウントの申請"
    >
      <p className={leadStyle}>
        メーカー・JA・農業法人・専門家などの組織用アカウントです。審査のうえ、通常3営業日以内にご連絡します。
      </p>
      <SellerApplyForm />
    </FormPageShell>
  );
}

import type { Metadata } from "next";

import { SellerApplyForm } from "@/app/sellers/apply/SellerApplyForm";
import { FormPageShell } from "@/components/FormPageShell";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { css } from "../../../../styled-system/css";

export const metadata: Metadata = {
  title: "出品者アカウントの申請",
  description: "出品者アカウントの申請フォームです。審査のうえ、通常3営業日以内にご連絡します。",
  robots: NO_INDEX_ROBOTS,
};

const leadStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  lineHeight: "1.6",
  mb: "4.5",
});

export default function SellerApplyPage() {
  return (
    <FormPageShell chrome="public" active="me" backHref="/me" title="出品者アカウントの申請">
      <p className={leadStyle}>
        審査のうえ、通常3営業日以内にご連絡します。資材の掲載がなくても、記事や回答での情報発信にご利用いただけます。
      </p>
      <SellerApplyForm />
    </FormPageShell>
  );
}

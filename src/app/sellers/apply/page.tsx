import "../../_mock/forms.css";
import "../../_mock/sellers.css";

import type { Metadata } from "next";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { SellerApplyForm } from "@/app/sellers/apply/SellerApplyForm";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "企業会員登録の申請",
  description:
    "企業会員登録の申請フォームです。申請内容を確認し、メールでご案内します。申請・掲載・編集は無料です。",
  robots: NO_INDEX_ROBOTS,
};

type SellerApplyPageProps = {
  searchParams: Promise<{ from?: string | string[] }>;
};

/** 任意URLは受け取らず、既知の入口だけを安全な戻り先へ対応させる。 */
function backHrefFor(source: string | string[] | undefined): "/me" | "/sellers" {
  return source === "me" ? "/me" : "/sellers";
}

/** 見本 S.sellerApply。案内文は本番の手順（ログイン後に申請フォームから資料を提出）に合わせる。 */
export default async function SellerApplyPage({ searchParams }: SellerApplyPageProps) {
  const { from } = await searchParams;

  return (
    <MockPageShell title="企業会員登録の申請" backHref={backHrefFor(from)}>
      <div className="fm-narrow" style={{ maxWidth: 640, marginInline: "auto" }}>
        <h1 className="sr-only">企業会員登録の申請</h1>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 18 }}>
          農業資材メーカー専用の企業会員アカウントです。内容を確認し、ログインIDとパスワード設定のご案内をメールでお送りします。ログイン後、掲載・オーナー権限の申請フォームから対象資材と確認資料をご提出ください。運営が確認した資材ごとに編集権をお渡しします。申請・掲載・編集は無料です。
        </p>
        <SellerApplyForm />
      </div>
    </MockPageShell>
  );
}

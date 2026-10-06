import { applicationSellerPage } from "./_lib/access";
import { SellerAccessDenied } from "../_components/AccessDenied";
import Link from "next/link";
import { FormPageShell, SurfaceCard } from "@/components";
import { listCompanyApplications } from "@/server/company-applications";
import { css } from "../../../../styled-system/css";
export default async function ApplicationsPage() {
  if (!(await applicationSellerPage("/dashboard/applications"))) return <SellerAccessDenied />;
  const receipts = await listCompanyApplications();
  return (
    <FormPageShell chrome="seller" title="各種お手続き" backHref="/dashboard">
      <p>資材の掲載・管理、資材オーナー権限の移行、終売・非表示に関するお手続きを行えます。</p>
      <div className={css({ display: "grid", gap: "4" })}>
        {[
          {
            title: "自社の資材を掲載する／掲載済みの自社資材を管理する",
            href: "/dashboard/applications/new/registration",
            description:
              "新規掲載または掲載済み資材の資材オーナー権限を、申請フォームAからお申し込みください。",
          },
          {
            title: "資材オーナー権限を別の会社に引き渡す",
            href: "/dashboard/applications/new/transfer_out",
            description: "現在の資材オーナー企業から、申請フォームBで権限の移行を申請します。",
          },
          {
            title: "別の会社から資材の事業を引き継いだ",
            href: "/dashboard/applications/new/transfer_in",
            description:
              "事業譲渡・合併などで事業を引き継いだ企業から、申請フォームCで権限の移行を申請します。",
          },
          {
            title: "終売・販売終了の反映、資材ページの非表示",
            href: "/company-requests/removal",
            description:
              "受付フォームをご入力いただくと、申請フォームのURLをメールでお送りします。企業会員でなくても申請できます。",
          },
        ].map((item) => (
          <SurfaceCard title={item.title} key={item.href}>
            <p>{item.description}</p>
            <Link
              className={css({
                color: "primary.700",
                textDecoration: "underline",
                fontWeight: "bold",
              })}
              href={item.href}
            >
              {item.href === "/company-requests/removal"
                ? "受付フォームへ進む"
                : "申請フォームへ進む"}{" "}
              →
            </Link>
          </SurfaceCard>
        ))}
      </div>
      <h2>受付済みの申請</h2>
      {receipts.length === 0 ? (
        <p>受付済みの申請はありません。</p>
      ) : (
        receipts.map((receipt) => (
          <p key={receipt.id}>
            <Link href={`/dashboard/applications/${receipt.id}`}>
              受付番号 {receipt.receipt_number}：{receipt.company_name}（
              {new Date(receipt.submitted_at).toLocaleDateString("ja-JP", {
                timeZone: "Asia/Tokyo",
              })}
              ）
            </Link>
          </p>
        ))
      )}
    </FormPageShell>
  );
}

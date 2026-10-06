import { FormPageShell, SectionHeading, SurfaceCard, TextLink } from "@/components";
import type { listCompanyApplications } from "@/server/company-applications";
import { css } from "../../../../styled-system/css";

/** 手続きの案内と受付済み申請への導線を表示する。 */
export function ApplicationsContent({
  receipts,
}: {
  receipts: Awaited<ReturnType<typeof listCompanyApplications>>;
}) {
  return (
    <FormPageShell chrome="seller" title="各種お手続き" backHref="/dashboard">
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "6",
          fontSize: "md",
          lineHeight: "relaxed",
        })}
      >
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
              <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
                <p>{item.description}</p>
                <TextLink href={item.href}>
                  {item.href === "/company-requests/removal"
                    ? "受付フォームへ進む"
                    : "申請フォームへ進む"}{" "}
                  →
                </TextLink>
              </div>
            </SurfaceCard>
          ))}
        </div>
        <section>
          <SectionHeading title="受付済みの申請" first />
          <div className={css({ display: "flex", flexDirection: "column", gap: "3" })}>
            {receipts.length === 0 ? (
              <p>受付済みの申請はありません。</p>
            ) : (
              receipts.map((receipt) => (
                <p key={receipt.id}>
                  <TextLink href={`/dashboard/applications/${receipt.id}`}>
                    受付番号 {receipt.receipt_number}：{receipt.company_name}（
                    {new Date(receipt.submitted_at).toLocaleDateString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                    ）
                  </TextLink>
                </p>
              ))
            )}
          </div>
        </section>
      </div>
    </FormPageShell>
  );
}

import Link from "next/link";

import { SitePageShell } from "@/app/_site/SitePageShell";
import type { listCompanyApplications } from "@/server/company-applications";

import { css } from "../../../../styled-system/css";
import {
  cardList,
  logDate,
  logRow,
  logText,
  sectionHeading,
  workspaceColumn,
} from "../_components/dashboard-styles";
import { ProcedureRow } from "../_components/ProcedureRow";

const PROCEDURES = [
  {
    title: "自社の資材を掲載する／掲載済みの自社資材を管理する",
    description: "資材情報の新規掲載と、掲載済み資材の資材オーナー権限の申請。",
    needs: "資材ごとのパッケージ画像 or 製品ページURL、法人番号、掲載済み資材はそのページURL",
    href: "/dashboard/applications/new/registration",
    label: "申請フォーム A",
  },
  {
    title: "資材オーナー権限を別の会社に引き渡す",
    description: "貴社が資材オーナー企業になっている資材について、権限を別の会社に移す申請。",
    needs:
      "対象資材のページURL、移行先の法人番号・FarmilleアカウントID・担当者連絡先、移行先企業名が載ったパッケージ画像 or 製品ページURL",
    href: "/dashboard/applications/new/transfer_out",
    label: "申請フォーム B",
  },
  {
    title: "別の会社から資材の事業を引き継いだ",
    description:
      "事業譲渡・合併などで資材を引き継いだ会社からの申請。現在の資材オーナー企業に通知し、14日間の確認期間を経て対応します。",
    needs: "対象資材のページURL、貴社の関与がわかる資料、引き継ぎの経緯がわかる資料",
    href: "/dashboard/applications/new/transfer_in",
    label: "申請フォーム C",
  },
  {
    title: "終売・販売終了の反映、資材ページの非表示",
    description:
      "企業会員の方も、公開側の受付フォームからお手続きください。受付フォームをご入力いただくと、申請フォームのURLをメールでお送りします。企業会員でなくても申請できます。",
    needs: null,
    href: "/company-requests/removal",
    label: "受付フォームへ",
  },
] as const;

const pageTitle = css({ fontSize: "lg", mb: "2.5", tab: { fontSize: "3xl" } });

const lead = css({
  fontSize: "md",
  lineHeight: "loose",
  color: "text.muted",
  mt: "2",
  mb: "1.5",
});

const requirementNote = css({
  fontSize: "sm",
  lineHeight: "prose",
  color: "text.subtle",
  mb: "3.5",
});

const procedureStack = css({ display: "flex", flexDirection: "column", gap: "3" });

const backLink = css({
  display: "block",
  mt: "3.5",
  fontSize: "sm",
  color: "primary.700",
  textDecoration: "none",
  whiteSpace: "nowrap",
});

export function ApplicationsContent({
  receipts,
}: {
  receipts: Awaited<ReturnType<typeof listCompanyApplications>>;
}) {
  return (
    <SitePageShell title="各種お手続き" backHref="/dashboard">
      <div className={workspaceColumn}>
        <h1 className={pageTitle}>各種お手続き</h1>
        <p className={lead}>
          資材の掲載・資材オーナー権限の移行・終売・非表示に関するお手続きは、以下の申請フォームから行います。申請後、内容を確認のうえ結果をメールでお知らせします。
        </p>
        <p className={requirementNote}>
          どの申請にも、貴社のFarmilleアカウントIDと、資材ごとのパッケージ画像（貴社名の記載箇所）または製品ページのURLが必要です。
        </p>
        <div className={procedureStack}>
          {PROCEDURES.map((item) => (
            <ProcedureRow
              key={item.href}
              heading="h2"
              title={item.title}
              href={item.href}
              actionLabel={item.label}
            >
              {item.description}
              {item.needs ? (
                <>
                  <br />
                  <b>必要なもの：</b>
                  {item.needs}
                </>
              ) : null}
            </ProcedureRow>
          ))}
        </div>

        <section aria-labelledby="receipts-heading">
          <h2 id="receipts-heading" className={sectionHeading}>
            受付済みの申請
          </h2>
          <ul className={cardList}>
            {receipts.length === 0 ? (
              <li className={logRow}>
                <div className={logText}>受付済みの申請はありません。</div>
              </li>
            ) : (
              receipts.map((receipt) => (
                <li className={logRow} key={receipt.id}>
                  <span className={logDate}>
                    {new Date(receipt.submitted_at).toLocaleDateString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </span>
                  <div className={logText}>
                    <Link href={`/dashboard/applications/${receipt.id}`}>
                      受付番号 {receipt.receipt_number}：{receipt.company_name}
                    </Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <Link className={backLink} href="/dashboard">
          ← 企業会員ダッシュボードへ
        </Link>
      </div>
    </SitePageShell>
  );
}

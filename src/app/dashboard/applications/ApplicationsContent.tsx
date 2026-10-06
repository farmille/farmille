import "../../_mock/dashboard.css";

import Link from "next/link";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import type { listCompanyApplications } from "@/server/company-applications";

const PROCEDURES = [
  {
    title: "自社の資材を掲載する／掲載済みの自社資材を管理する",
    description:
      "資材情報の新規掲載と、掲載済み資材の資材オーナー権限の申請。",
    needs: "資材ごとのパッケージ画像 or 製品ページURL、法人番号、掲載済み資材はそのページURL",
    href: "/dashboard/applications/new/registration",
    label: "申請フォーム A",
  },
  {
    title: "資材オーナー権限を別の会社に引き渡す",
    description:
      "貴社が資材オーナー企業になっている資材について、権限を別の会社に移す申請。",
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

/** 見本 S.makerProcs（各種お手続き）。下に受付済みの申請（受付票）への導線を置く。 */
export function ApplicationsContent({
  receipts,
}: {
  receipts: Awaited<ReturnType<typeof listCompanyApplications>>;
}) {
  return (
    <MockPageShell title="各種お手続き" backHref="/dashboard">
      <div className="dash-mid">
        <div className="sec-h" style={{ marginTop: 0 }}>
          <h1 className="dash-title">各種お手続き</h1>
        </div>
        <p className="guide-lead" style={{ marginBottom: 6 }}>
          資材の掲載・資材オーナー権限の移行・終売・非表示に関するお手続きは、以下の申請フォームから行います。申請後、内容を確認のうえ結果をメールでお知らせします。
        </p>
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.8, marginBottom: 14 }}>
          どの申請にも、貴社のFarmilleアカウントIDと、資材ごとのパッケージ画像（貴社名の記載箇所）または製品ページのURLが必要です。
        </p>
        <div className="stack">
          {PROCEDURES.map((item) => (
            <div className="card proc-row" key={item.href}>
              <div className="pr-main">
                <h2 style={{ fontSize: 14 }}>{item.title}</h2>
                <p>
                  {item.description}
                  {item.needs ? (
                    <>
                      <br />
                      <b>必要なもの：</b>
                      {item.needs}
                    </>
                  ) : null}
                </p>
              </div>
              <Link className="btn btn-ghost" href={item.href}>
                {item.label}
              </Link>
            </div>
          ))}
        </div>

        <section aria-labelledby="receipts-heading">
          <h2 id="receipts-heading" className="dash-sec-h">
            受付済みの申請
          </h2>
          <ul className="card" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {receipts.length === 0 ? (
              <li className="md-log">
                <div className="t">受付済みの申請はありません。</div>
              </li>
            ) : (
              receipts.map((receipt) => (
                <li className="md-log" key={receipt.id}>
                  <span className="d tnum">
                    {new Date(receipt.submitted_at).toLocaleDateString("ja-JP", {
                      timeZone: "Asia/Tokyo",
                    })}
                  </span>
                  <div className="t">
                    <Link href={`/dashboard/applications/${receipt.id}`}>
                      受付番号 {receipt.receipt_number}：{receipt.company_name}
                    </Link>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="dash-back">
          <Link className="link-more" href="/dashboard">
            ← 企業会員ダッシュボードへ
          </Link>
        </div>
      </div>
    </MockPageShell>
  );
}

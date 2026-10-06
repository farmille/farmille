import "../../../_mock/forms.css";
import "../../../_mock/sellers.css";

import type { Metadata } from "next";
import Link from "next/link";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "申請を受け付けました",
  robots: NO_INDEX_ROBOTS,
};

/** 見本の送信完了（.done-wrap）の形。文言は本番のまま。 */
export default function SellerApplyDonePage() {
  return (
    <MockPageShell title="申請受付完了" backHref="/">
      <div className="fm-narrow">
        <div className="done-wrap" style={{ paddingTop: 40 }}>
          <div className="done-check" aria-hidden="true">
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M5 12l5 5 9-11" />
            </svg>
          </div>
          <h2>申請を受け付けました</h2>
          <p>内容を確認し、ご登録の連絡先メールアドレスへご案内します。</p>
          <p>
            ログインIDとパスワード設定のご案内をお送りします。ログイン後、掲載・オーナー権限の申請フォームから対象資材と確認資料をご提出ください。運営が確認した資材ごとに編集権をお渡しします。
          </p>
          <div className="done-actions">
            <Link className="btn btn-primary" href="/sellers">
              メーカーの方へ に戻る
            </Link>
            <Link className="btn btn-ghost" href="/">
              ホームへ
            </Link>
          </div>
        </div>
      </div>
    </MockPageShell>
  );
}

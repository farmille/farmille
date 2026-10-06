"use client";
import "../_mock/mock.css";
import "../_mock/forms.css";
import "../_mock/sellers.css";

import Link from "next/link";

/**
 * 申請ページを開けなかったときの表示。error.tsx はクライアント部品なので、
 * サーバーでログイン状態を読む見本の外枠（MockPageShell）は使わず、見本の .fm と .done-wrap だけを当てる。
 */
export default function ApplicationErrorPage({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <div className="fm fm-page">
      <main className="body">
        <div className="done-wrap" style={{ maxWidth: 640, marginInline: "auto" }}>
          <h1 style={{ fontSize: 20 }}>申請ページを開けませんでした</h1>
          <p>
            認証の有効期限が切れた場合は、確認メールを再発行してください。受付済みの申請は、受付番号とメールアドレスで再確認できます。時間をおいても開けない場合は、受付番号を添えて運営へご連絡ください。
          </p>
          <div className="done-actions">
            <button className="btn btn-primary" onClick={unstable_retry} type="button">
              再読み込み
            </button>
            <Link className="btn btn-ghost" href="/company-requests/receipts">
              受付票の確認メールを再発行
            </Link>
            <Link className="btn btn-ghost" href="/company-requests/removal">
              申請用メールを再発行
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

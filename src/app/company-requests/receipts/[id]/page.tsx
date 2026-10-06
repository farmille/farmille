import "../../../_mock/forms.css";
import "../../../_mock/sellers.css";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { readCompanyApplication } from "@/server/company-applications";

import { ApplicationReceipt } from "../../_components/ApplicationReceipt";

/**
 * 申請受付票。見本の送信完了（S.appDone）の見出しを上に置き、受付票の本文・印刷・再送は本番のまま。
 * 受付票の部品はメーカーダッシュボード・運営画面と共通なので、見本のクラスに作り替えない。
 */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const receipt = await readCompanyApplication((await params).id);
  return (
    <MockPageShell title="申請受付票" backHref="/company-requests/receipts">
      <div className="fm-narrow">
        <div className="done-wrap application-print-hidden" style={{ padding: "24px 24px 8px" }}>
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
          <h1 style={{ fontSize: 20 }}>ご申請を受け付けました</h1>
        </div>
        <div className="card pad">
          <ApplicationReceipt receipt={receipt} />
        </div>
      </div>
    </MockPageShell>
  );
}

import "../../_mock/forms.css";
import "../../_mock/sellers.css";

import { MockPageShell } from "@/app/_mock/MockPageShell";

import { VerificationForm } from "../_components/VerificationForm";

/** 受付票の確認メールの再発行。見本に画面はなく、簡易受付（S.delistIntake）と同じ部品で組む。 */
export default function ReceiptAccessPage() {
  return (
    <MockPageShell title="受付票の確認" backHref="/company-requests/removal">
      <div className="fm-chic" style={{ maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>受付票の確認</h1>
        <div className="card intro-card" style={{ marginTop: 12 }}>
          <p>
            申請時の受付番号と確認済みメールアドレスを入力してください。受付票を開くための確認メールをお送りします。
          </p>
        </div>
        <VerificationForm receipt />
      </div>
    </MockPageShell>
  );
}

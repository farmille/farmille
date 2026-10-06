import "../../_mock/forms.css";
import "../../_mock/sellers.css";

import Link from "next/link";

import { MockPageShell } from "@/app/_mock/MockPageShell";

import { VerificationForm } from "../_components/VerificationForm";

/** 見本 S.delistIntake（終売・廃盤／非表示の申請 受付）。 */
export default function RemovalEntryPage() {
  return (
    <MockPageShell title="終売・廃盤／非表示の申請 受付" backHref="/sellers">
      <div className="fm-chic" style={{ maxWidth: 820, marginLeft: "auto", marginRight: "auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>終売・廃盤／非表示の申請 受付フォーム</h1>
        <div className="card intro-card" style={{ marginTop: 12 }}>
          <p>
            掲載されている資材ページについて、終売・廃盤の表示、または非表示をご希望の企業様向けの受付フォームです。ここで法人名・ご担当者名・メールアドレスを送信すると、申請フォームのURLをメールでお送りします。申請そのものは、メールで届く申請フォームから行います。
          </p>
          <ul>
            <li>
              受付対象は、当該資材の製造元・販売元・輸入元に該当する企業様です。特定地域の販売代理店、二次卸・三次卸、小売店の皆様からのご申請は受け付けておりません。
            </li>
            <li>
              企業会員でなくても申請できます。企業会員の方は、申請フォームにFarmilleアカウントIDを記入いただくと確認が早くなります。
            </li>
            <li>資材ページや感想口コミ・実証詳細レポートのデータは削除しません。</li>
          </ul>
        </div>
        <div className="form-sec">
          <span className="no">1</span>
          <h2 className="sec-title">申請者情報</h2>
        </div>
        <VerificationForm />
        <p className="form-note" style={{ textAlign: "center" }}>
          <Link href="/company-requests/receipts">受付済みの申請を確認する</Link>
        </p>
      </div>
    </MockPageShell>
  );
}

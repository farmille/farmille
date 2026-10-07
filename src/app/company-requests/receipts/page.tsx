import { SitePageShell } from "@/app/_site/SitePageShell";

import { formalPageRecipe, formalTitleStyle, introStyle } from "../_components/formal-styles";
import { VerificationForm } from "../_components/VerificationForm";

export default function ReceiptAccessPage() {
  return (
    <SitePageShell title="受付票の確認" backHref="/company-requests/removal">
      <div className={formalPageRecipe({ width: "narrow" })}>
        <h1 className={formalTitleStyle}>受付票の確認</h1>
        <div className={introStyle}>
          <p>
            申請時の受付番号と確認済みメールアドレスを入力してください。受付票を開くための確認メールをお送りします。
          </p>
        </div>
        <VerificationForm receipt />
      </div>
    </SitePageShell>
  );
}

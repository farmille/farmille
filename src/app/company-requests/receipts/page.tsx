import { FormPageShell } from "@/components";
import { VerificationForm } from "../_components/VerificationForm";
export default function ReceiptAccessPage() {
  return (
    <FormPageShell chrome="public" title="受付票の確認" backHref="/company-requests/removal">
      <p>
        申請時の受付番号と確認済みメールアドレスを入力してください。受付票を開くための確認メールをお送りします。
      </p>
      <VerificationForm receipt />
    </FormPageShell>
  );
}

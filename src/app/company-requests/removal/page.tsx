import Link from "next/link";
import { FormPageShell } from "@/components";
import { VerificationForm } from "../_components/VerificationForm";
export default function RemovalEntryPage() {
  return (
    <FormPageShell chrome="public" title="終売・廃盤／非表示の申請受付" backHref="/">
      <p>
        当該資材の製造元・販売元・輸入元にあたる企業様から受け付けます。特定地域の販売代理店・卸・小売店は対象外です。法人メールアドレスの確認後、申請フォームを開きます。
      </p>
      <VerificationForm />
      <Link href="/company-requests/receipts">受付済みの申請を確認する</Link>
    </FormPageShell>
  );
}

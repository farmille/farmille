import { FormPageShell } from "@/components/FormPageShell";

import { css } from "../../../../styled-system/css";

import { VerificationForm } from "../_components/VerificationForm";

const leadStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  lineHeight: "relaxed",
  mb: "4.5",
});

export default function ReceiptAccessPage() {
  return (
    <FormPageShell chrome="public" title="受付票の確認" backHref="/sellers">
      <h1 className={css({ srOnly: true })}>受付票の確認</h1>
      <p className={leadStyle}>
        申請時の受付番号と確認済みメールアドレスを入力してください。受付票を開くための確認メールをお送りします。
      </p>
      <VerificationForm />
    </FormPageShell>
  );
}

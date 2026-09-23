import { FormPageShell } from "@/components";
export default function NotFound() {
  return (
    <FormPageShell
      chrome="public"
      title="申請が見つかりません"
      backHref="/company-requests/receipts"
    >
      <p>受付番号をご確認ください。</p>
    </FormPageShell>
  );
}

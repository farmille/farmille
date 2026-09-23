import { FormPageShell } from "@/components";
import { readCompanyApplication } from "@/server/company-applications";
import { ApplicationReceipt } from "../../_components/ApplicationReceipt";
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const receipt = await readCompanyApplication((await params).id);
  return (
    <FormPageShell chrome="public" title="申請受付票" backHref="/company-requests/receipts">
      <ApplicationReceipt receipt={receipt} />
    </FormPageShell>
  );
}

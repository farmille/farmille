import { FormPageShell } from "@/components";
import { readCompanyApplication } from "@/server/company-applications";
import { ApplicationReceipt } from "@/app/company-requests/_components/ApplicationReceipt";
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const receipt = await readCompanyApplication((await params).id);
  return (
    <FormPageShell chrome="seller" title="申請受付票" backHref="/dashboard/applications">
      <ApplicationReceipt receipt={receipt} />
    </FormPageShell>
  );
}

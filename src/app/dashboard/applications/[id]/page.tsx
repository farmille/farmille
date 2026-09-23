import { applicationSellerPage } from "../_lib/access";
import { SellerAccessDenied } from "../../_components/AccessDenied";
import { FormPageShell } from "@/components";
import { readCompanyApplication } from "@/server/company-applications";
import { ApplicationReceipt } from "@/app/company-requests/_components/ApplicationReceipt";
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await applicationSellerPage(`/dashboard/applications/${id}`)))
    return <SellerAccessDenied />;
  const receipt = await readCompanyApplication(id);
  return (
    <FormPageShell chrome="seller" title="申請受付票" backHref="/dashboard/applications">
      <ApplicationReceipt receipt={receipt} />
    </FormPageShell>
  );
}

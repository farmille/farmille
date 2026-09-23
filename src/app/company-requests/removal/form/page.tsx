import { cleanupExpiredApplicationUploads } from "@/server/company-application-evidence";
import { redirect } from "next/navigation";
import { FormPageShell } from "@/components";
import { removalApplicationAccess } from "@/server/company-application-auth";
import { beginCompanyApplication } from "@/server/company-applications";
import { CompanyApplicationForm } from "../../_components/CompanyApplicationForm";
import { emptyContact } from "../../_components/ContactFields";
export default async function RemovalFormPage() {
  const { access } = await removalApplicationAccess();
  await cleanupExpiredApplicationUploads();
  const intent = await beginCompanyApplication("removal");
  if (intent.submitted_at) redirect(`/company-requests/receipts/${intent.id}`);
  return (
    <FormPageShell
      chrome="public"
      title="資材ページに関する申請（終売・廃盤／非表示）"
      backHref="/company-requests/removal"
    >
      <CompanyApplicationForm
        intentId={intent.id}
        kind="removal"
        defaults={{
          ...emptyContact,
          companyName: access.company_name,
          contactName: access.contact_name,
          email: access.email,
        }}
        recipient={access.email}
      />
    </FormPageShell>
  );
}

import { cleanupExpiredApplicationUploads } from "@/server/company-application-evidence";
import { notFound } from "next/navigation";
import * as v from "valibot";
import { FormPageShell } from "@/components";
import { applicationKindSchema } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";
import { applicationSellerPage } from "../../_lib/access";
import { SellerAccessDenied } from "../../../_components/AccessDenied";
import { beginCompanyApplication } from "@/server/company-applications";
import { CompanyApplicationForm } from "@/app/company-requests/_components/CompanyApplicationForm";
import { emptyContact } from "@/app/company-requests/_components/ContactFields";
export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const parsed = v.safeParse(applicationKindSchema, (await params).kind);
  if (!parsed.success || parsed.output === "removal") notFound();
  const kind = parsed.output;
  const session = await applicationSellerPage(`/dashboard/applications/new/${kind}`);
  if (!session) return <SellerAccessDenied />;
  const { seller } = session;
  await cleanupExpiredApplicationUploads();
  const intent = await beginCompanyApplication(kind);
  return (
    <FormPageShell
      chrome="seller"
      title={applicationCopy[kind].title}
      backHref="/dashboard/applications"
    >
      <CompanyApplicationForm
        intentId={intent.id}
        kind={kind}
        defaults={{
          ...emptyContact,
          companyName: seller.official_name,
          corporateNumber: seller.corporate_number ?? "",
          accountId: seller.login_id ?? "",
          contactName: seller.contact_name,
          email: seller.contact_email,
        }}
        recipient={seller.contact_email}
      />
    </FormPageShell>
  );
}

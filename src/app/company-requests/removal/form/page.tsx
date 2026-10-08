import { redirect } from "next/navigation";

import { FormPageShell } from "@/components/FormPageShell";
import { applicationCopy } from "@/lib/company-application-copy";
import { removalApplicationAccess } from "@/server/company-application-auth";
import { cleanupExpiredApplicationUploads } from "@/server/company-application-evidence";
import { beginCompanyApplication } from "@/server/company-applications";

import { CompanyApplicationForm } from "../../_components/CompanyApplicationForm";
import { emptyContact } from "../../_components/ContactFields";
import { formalPageRecipe } from "../../_components/formal-styles";

import { css } from "../../../../../styled-system/css";

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
      <div className={formalPageRecipe()}>
        <h1 className={css({ fontSize: "xl" })}>{applicationCopy.removal.title}</h1>
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
      </div>
    </FormPageShell>
  );
}

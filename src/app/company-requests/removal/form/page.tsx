import { redirect } from "next/navigation";

import { SitePageShell } from "@/app/_site/SitePageShell";
import { applicationCopy } from "@/lib/company-application-copy";
import { removalApplicationAccess } from "@/server/company-application-auth";
import { cleanupExpiredApplicationUploads } from "@/server/company-application-evidence";
import { beginCompanyApplication } from "@/server/company-applications";

import { CompanyApplicationForm } from "../../_components/CompanyApplicationForm";
import { emptyContact } from "../../_components/ContactFields";
import { formalPageRecipe } from "../../_components/formal-styles";

import { css } from "../../../../../styled-system/css";

/** 資材ページに関する申請フォーム（終売・非表示）。メールの確認リンクから開く。 */
export default async function RemovalFormPage() {
  const { access } = await removalApplicationAccess();
  await cleanupExpiredApplicationUploads();
  const intent = await beginCompanyApplication("removal");
  if (intent.submitted_at) redirect(`/company-requests/receipts/${intent.id}`);
  return (
    <SitePageShell title={applicationCopy.removal.title} backHref="/company-requests/removal">
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
    </SitePageShell>
  );
}

import "../../../_mock/forms.css";
import "../../../_mock/sellers.css";

import { redirect } from "next/navigation";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { applicationCopy } from "@/lib/company-application-copy";
import { removalApplicationAccess } from "@/server/company-application-auth";
import { cleanupExpiredApplicationUploads } from "@/server/company-application-evidence";
import { beginCompanyApplication } from "@/server/company-applications";

import { CompanyApplicationForm } from "../../_components/CompanyApplicationForm";
import { emptyContact } from "../../_components/ContactFields";

/** 見本 S.formD（資材ページに関する申請フォーム）。メールの確認リンクから開く。 */
export default async function RemovalFormPage() {
  const { access } = await removalApplicationAccess();
  await cleanupExpiredApplicationUploads();
  const intent = await beginCompanyApplication("removal");
  if (intent.submitted_at) redirect(`/company-requests/receipts/${intent.id}`);
  return (
    <MockPageShell title={applicationCopy.removal.title} backHref="/company-requests/removal">
      <div className="fm-chic">
        <h1 style={{ fontSize: 19 }}>{applicationCopy.removal.title}</h1>
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
    </MockPageShell>
  );
}

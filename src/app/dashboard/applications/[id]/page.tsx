import * as v from "valibot";
import { applicationSellerPage } from "../_lib/access";
import { SellerAccessDenied } from "../../_components/AccessDenied";
import { MockPageShell } from "@/app/_mock/MockPageShell";
import { applicationKindSchema } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";
import { readCompanyApplication } from "@/server/company-applications";
import { ApplicationReceivedHeader } from "../ApplicationReceivedHeader";
import { ApplicationReceipt } from "@/app/company-requests/_components/ApplicationReceipt";
import { surfaceCardRecipe } from "@/components";
import { readingColumn } from "../../_components/dashboard-styles";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await applicationSellerPage(`/dashboard/applications/${id}`)))
    return <SellerAccessDenied />;
  const receipt = await readCompanyApplication(id);
  const kind = v.safeParse(applicationKindSchema, receipt.application.kind);
  return (
    <MockPageShell title="申請受付票" backHref="/dashboard/applications">
      <div className={readingColumn}>
        <ApplicationReceivedHeader
          title={kind.success ? applicationCopy[kind.output].title : null}
        />
        <div className={surfaceCardRecipe()}>
          <ApplicationReceipt receipt={receipt} />
        </div>
      </div>
    </MockPageShell>
  );
}

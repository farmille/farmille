import { notFound } from "next/navigation";
import * as v from "valibot";

import { FormPageShell } from "@/components/FormPageShell";
import { emptyContact } from "@/app/company-requests/_components/ContactFields";
import { submittableKindSchema } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";
import { NewApplicationForm } from "./NewApplicationForm";

import { css } from "../../../../../../styled-system/css";
import { SellerAccessDenied } from "../../../_components/AccessDenied";
import { applicationSellerPage } from "../../_lib/access";

export default async function NewApplicationPage({
  params,
}: {
  params: Promise<{ kind: string }>;
}) {
  const parsed = v.safeParse(submittableKindSchema, (await params).kind);
  if (!parsed.success) notFound();
  const kind = parsed.output;
  const session = await applicationSellerPage(`/dashboard/applications/new/${kind}`);
  if (!session) return <SellerAccessDenied />;
  const { seller } = session;
  return (
    <FormPageShell
      chrome="seller"
      title={applicationCopy[kind].title}
      backHref="/dashboard/applications"
    >
      <div className={css({ maxW: "content.medium", mx: "auto", pt: "6.5" })}>
        <h1 className={css({ fontSize: "xl" })}>{applicationCopy[kind].title}</h1>
        <NewApplicationForm
          key={kind}
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
      </div>
    </FormPageShell>
  );
}

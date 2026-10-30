import { FormPageShell } from "@/components/FormPageShell";
import { readCompanyApplication } from "@/server/company-applications";

import { ApplicationReceipt } from "../../_components/ApplicationReceipt";
import { DoneMessage } from "../../_components/DoneMessage";

import { css } from "../../../../../styled-system/css";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const receipt = await readCompanyApplication((await params).id);

  return (
    <FormPageShell chrome="public" title="申請受付票" backHref="/company-requests/receipts">
      <div className={css({ maxW: "content.reading", mx: "auto" })}>
        <DoneMessage as="h1" spacing="compact" title="ご申請を受け付けました" />
        <ApplicationReceipt receipt={receipt} hideMissingCorporateNumber />
      </div>
    </FormPageShell>
  );
}

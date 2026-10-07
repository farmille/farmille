import { SitePageShell } from "@/app/_site/SitePageShell";
import { SurfaceCard } from "@/components/SurfaceCard";
import { readCompanyApplication } from "@/server/company-applications";

import { ApplicationReceipt } from "../../_components/ApplicationReceipt";
import { DoneMessage } from "../../_components/DoneMessage";

import { css } from "../../../../../styled-system/css";

/** 申請受付票。受付票の部品はメーカーダッシュボード・運営画面と共通。 */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const receipt = await readCompanyApplication((await params).id);
  return (
    <SitePageShell title="申請受付票" backHref="/company-requests/receipts">
      <div className={css({ maxW: "content.reading", mx: "auto" })}>
        <DoneMessage
          as="h1"
          className="application-print-hidden"
          spacing="compact"
          title="ご申請を受け付けました"
        />
        <SurfaceCard padding="standard">
          <ApplicationReceipt receipt={receipt} hideMissingCorporateNumber />
        </SurfaceCard>
      </div>
    </SitePageShell>
  );
}

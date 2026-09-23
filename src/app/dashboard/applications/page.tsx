import Link from "next/link";
import { FormPageShell, SurfaceCard } from "@/components";
import { listCompanyApplications } from "@/server/company-applications";
import { applicationCopy } from "@/lib/company-application-copy";
export default async function ApplicationsPage() {
  const receipts = await listCompanyApplications();
  return (
    <FormPageShell chrome="seller" title="各種お手続き" backHref="/dashboard">
      <SurfaceCard title="申請する">
        <p>
          <Link href="/dashboard/applications/new/registration">
            A：{applicationCopy.registration.title}
          </Link>
        </p>
        <p>
          <Link href="/dashboard/applications/new/transfer_out">
            B：{applicationCopy.transfer_out.title}
          </Link>
        </p>
        <p>
          <Link href="/dashboard/applications/new/transfer_in">
            C：{applicationCopy.transfer_in.title}
          </Link>
        </p>
        <p>
          <Link href="/company-requests/removal">終売・廃盤／非表示の申請</Link>
        </p>
      </SurfaceCard>
      <h2>受付済みの申請</h2>
      {receipts.length === 0 ? (
        <p>受付済みの申請はありません。</p>
      ) : (
        receipts.map((receipt) => (
          <p key={receipt.id}>
            <Link href={`/dashboard/applications/${receipt.id}`}>
              受付番号 {receipt.receipt_number}：{receipt.company_name}（
              {new Date(receipt.submitted_at).toLocaleDateString("ja-JP", {
                timeZone: "Asia/Tokyo",
              })}
              ）
            </Link>
          </p>
        ))
      )}
    </FormPageShell>
  );
}

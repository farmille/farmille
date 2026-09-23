import Link from "next/link";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { listCompanyApplications } from "@/server/company-applications";
export default async function AdminApplicationsPage() {
  await requireAdminPage("/admin/company-applications");
  const receipts = await listCompanyApplications(true);
  return (
    <AdminShell
      title="企業からの申請"
      description="受付内容と添付資料を確認します。審査後の変更は既存の資材管理から行ってください。"
    >
      {receipts.length === 0 ? (
        <p>申請はありません。</p>
      ) : (
        receipts.map((receipt) => (
          <p key={receipt.id}>
            <Link href={`/admin/company-applications/${receipt.id}`}>
              受付番号 {receipt.receipt_number}：{receipt.company_name}（
              {new Date(receipt.submitted_at).toLocaleDateString("ja-JP", {
                timeZone: "Asia/Tokyo",
              })}
              ）
            </Link>{" "}
            {receipt.company_application_mail_deliveries?.sent_at ? "控え送信済み" : "控え未送信"}
          </p>
        ))
      )}
    </AdminShell>
  );
}

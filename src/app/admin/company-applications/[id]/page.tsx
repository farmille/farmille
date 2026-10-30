import Link from "next/link";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { adminBodyStyle } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { readCompanyApplication } from "@/server/company-applications";
import { ApplicationReceipt } from "@/app/company-requests/_components/ApplicationReceipt";

export default async function AdminReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/company-applications/${id}`);
  const receipt = await readCompanyApplication(id);

  return (
    <AdminShell
      title={`申請受付票 ${receipt.application.receipt_number}`}
      description="提出時点の回答と資料です。"
    >
      <ApplicationReceipt receipt={receipt} />
      <p className={adminBodyStyle}>
        <Link href="/admin/materials">資材・資材オーナー権限の管理を開く</Link>
      </p>
    </AdminShell>
  );
}

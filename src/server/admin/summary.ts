import { reportAdminError, withAdmin } from "@/server/admin/guard";
import { fail, succeed, type Result } from "@/server/result";

export type AdminSummary = {
  appliedSellerCount: number;
  openReportCount: number;
  pendingUsageReportCount: number;
  pendingMaterialChangeCount: number;
};

/** `/admin` トップのサマリー。件数だけを数える（head: true で行は転送しない）。 */
export async function getAdminSummary(): Promise<Result<AdminSummary>> {
  return withAdmin(async ({ supabase }) => {
    const countOf = { count: "exact" as const, head: true };
    const [sellers, reports, usageReports, editRequests] = await Promise.all([
      supabase.from("seller_accounts").select("id", countOf).eq("status", "applied"),
      supabase.from("content_reports").select("id", countOf).eq("status", "open"),
      supabase.from("usage_reports").select("id", countOf).eq("status", "pending"),
      supabase.from("material_change_requests").select("id", countOf).eq("status", "pending"),
    ]);

    const failed = sellers.error ?? reports.error ?? usageReports.error ?? editRequests.error;

    if (failed !== null) {
      reportAdminError("summary", "サマリーの集計に失敗", failed);
      return fail("internal");
    }

    return succeed({
      appliedSellerCount: sellers.count ?? 0,
      openReportCount: reports.count ?? 0,
      pendingUsageReportCount: usageReports.count ?? 0,
      pendingMaterialChangeCount: editRequests.count ?? 0,
    });
  });
}

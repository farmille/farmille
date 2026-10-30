import { redirect } from "next/navigation";
import { SellerAccessDenied } from "./_components/AccessDenied";
import { DashboardContent } from "./_components/DashboardContent";
import { requireSeller } from "@/server/auth";
import { getSellerDashboardData } from "@/server/queries/seller-dashboard";

export default async function DashboardPage() {
  const session = await requireSeller();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent("/dashboard")}`);
    }

    return <SellerAccessDenied />;
  }

  const result = await getSellerDashboardData(session.data.sellerId);

  if (!result.ok) {
    if (result.error === "forbidden") return <SellerAccessDenied />;
    throw new Error("企業会員ダッシュボードの取得に失敗しました。");
  }

  return <DashboardContent {...result.data} />;
}

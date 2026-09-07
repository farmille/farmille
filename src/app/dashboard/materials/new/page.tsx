import { redirect } from "next/navigation";

import { FormPageShell, SurfaceCard } from "@/components";
import { requireSeller } from "@/server/auth";
import { listClassificationOptions } from "@/server/queries/classifications";
import { getSellerDashboardData } from "@/server/queries/seller-dashboard";
import { css } from "../../../../../styled-system/css";
import { SellerAccessDenied } from "../../_components/AccessDenied";
import { MaterialChangeForm } from "../_components/MaterialChangeForm";

const pageStack = css({ display: "flex", flexDirection: "column", gap: "5" });

export default async function SellerMaterialNewPage() {
  const session = await requireSeller();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent("/dashboard/materials/new")}`);
    }
    return <SellerAccessDenied backHref="/dashboard/materials" />;
  }

  const [dashboard, classifications] = await Promise.all([
    getSellerDashboardData(session.data.sellerId),
    listClassificationOptions(),
  ]);
  if (!dashboard.ok || !classifications.ok) {
    throw new Error("資材新規登録フォームの取得に失敗しました。");
  }

  return (
    <FormPageShell chrome="seller" backHref="/dashboard/materials" title="資材を新規登録">
      <div className={pageStack}>
        <SurfaceCard
          description="入力した内容は承認待ちになります。運営が確認するまでは公開されません。"
          title="メーカーから登録申請"
          tone="soft"
        >
          <p>資材名と分かる範囲の一次情報を入力してください。</p>
        </SurfaceCard>
        <SurfaceCard>
          <MaterialChangeForm
            classifications={classifications.data}
            manufacturerName={
              dashboard.data.seller.manufacturer_name ?? dashboard.data.seller.official_name
            }
            material={null}
          />
        </SurfaceCard>
      </div>
    </FormPageShell>
  );
}

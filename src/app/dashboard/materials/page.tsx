import { redirect } from "next/navigation";
import { EmptyState, FormPageShell, MaterialRefCard, SurfaceCard } from "@/components";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { requireSeller } from "@/server/auth";
import { getSellerMaterialsPageData } from "@/server/queries/seller-dashboard";
import { SellerAccessDenied } from "../_components/AccessDenied";

export default async function SellerMaterialsPage() {
  const session = await requireSeller();
  if (!session.ok) {
    if (session.error === "unauthorized") redirect("/sellers/login?next=%2Fdashboard%2Fmaterials");
    return <SellerAccessDenied backHref="/dashboard" />;
  }
  const result = await getSellerMaterialsPageData(session.data.sellerId);
  if (!result.ok) throw new Error("製品一覧を取得できませんでした。");
  return (
    <FormPageShell chrome="seller" backHref="/dashboard" title="製品情報の管理">
      <div className={materialPageStack}>
        <SurfaceCard title={result.data.sellerName}>
          <p>
            編集権を付与された製品を選び、公開ページと同じ構成で情報を編集できます。下書き・プレビュー・変更履歴は各製品から開けます。
          </p>
        </SurfaceCard>
        {result.data.materials.length === 0 ? (
          <EmptyState
            title="編集できる製品はまだありません"
            description="既存の紐づけがある場合も、編集権の書類確認が必要です。運営からの案内をご確認ください。公開中の製品情報は維持されています。"
          />
        ) : (
          result.data.materials.map((material) => (
            <MaterialRefCard
              key={material.id}
              name={
                material.publication_status === "archived"
                  ? `${material.name}（非公開）`
                  : material.name
              }
              manufacturerName={material.manufacturer_name}
              avgRating={material.avg_rating}
              href={`/dashboard/materials/${material.id}`}
            />
          ))
        )}
        <SurfaceCard title="掲載・編集する製品を追加する">
          <p>
            製品の正式名称を運営へご連絡ください。公開ページの用意と、編集権の書類確認を進めます。申請・掲載・編集は無料です。
          </p>
          <p>登録時に届いた案内メールへの返信でご連絡ください。</p>
        </SurfaceCard>
      </div>
    </FormPageShell>
  );
}

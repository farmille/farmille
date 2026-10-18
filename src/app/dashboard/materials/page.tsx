import { redirect } from "next/navigation";
import { EmptyState, FormPageShell, MaterialRefCard, SurfaceCard, TextLink } from "@/components";
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
  if (!result.ok) throw new Error("資材一覧を取得できませんでした。");
  return (
    <FormPageShell chrome="seller" backHref="/dashboard" title="製品情報の管理">
      <div className={materialPageStack}>
        <SurfaceCard title={result.data.sellerName}>
          <p>
            掲載中の資材の製品情報を編集できます。下書き・プレビュー・変更履歴は各資材から開けます。
          </p>
        </SurfaceCard>
        {result.data.materials.length === 0 ? (
          <EmptyState
            title="編集できる資材はまだありません"
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
        <SurfaceCard title="掲載・編集する資材を追加する">
          <p>
            フォームAから新規掲載または掲載済み資材のオーナー権限を申請してください。運営が申請と確認資料を審査します。申請・掲載・編集は無料です。
          </p>
          <TextLink href="/dashboard/applications/new/registration">
            掲載・オーナー権限を申請する
          </TextLink>
        </SurfaceCard>
      </div>
    </FormPageShell>
  );
}

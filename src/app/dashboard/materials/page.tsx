import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Badge,
  EmptyState,
  FormPageShell,
  MaterialRefCard,
  SectionHeading,
  SurfaceCard,
  TextLink,
  buttonRecipe,
  formatDateJa,
} from "@/components";
import {
  isMaterialChangeRequestStatus,
  isMaterialChangeType,
  MATERIAL_CHANGE_REQUEST_STATUS_LABELS,
  MATERIAL_CHANGE_TYPE_LABELS,
} from "@/lib/material-change";
import { requireSeller } from "@/server/auth";
import { getSellerMaterialsPageData } from "@/server/queries/seller-dashboard";
import { css } from "../../../../styled-system/css";
import { SellerAccessDenied } from "../_components/AccessDenied";

const pageStack = css({ display: "flex", flexDirection: "column", gap: "6" });
const listStack = css({ display: "flex", flexDirection: "column", gap: "3" });
const requestHeader = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  flexWrap: "wrap",
});
const requestMeta = css({ fontSize: "sm", color: "text.muted", mt: "2" });

export default async function SellerMaterialsPage() {
  const session = await requireSeller();
  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent("/dashboard/materials")}`);
    }
    return <SellerAccessDenied backHref="/dashboard" />;
  }

  const result = await getSellerMaterialsPageData(session.data.sellerId);
  if (!result.ok) throw new Error("資材管理画面の取得に失敗しました。");

  const pending = result.data.changeRequests.filter(({ status }) => status === "pending");
  const history = result.data.changeRequests.filter(({ status }) => status !== "pending");

  return (
    <FormPageShell chrome="seller" backHref="/dashboard" title="資材管理">
      <div className={pageStack}>
        <SurfaceCard
          description="メーカーからの登録・変更・掲載終了は、運営の承認後に公開されます。"
          title={result.data.sellerName}
          tone="soft"
        >
          <Link className={buttonRecipe()} href="/dashboard/materials/new">
            資材を新規登録
          </Link>
        </SurfaceCard>

        <section aria-label="自社資材">
          <SectionHeading first title="公開資材" />
          {result.data.materials.length === 0 ? (
            <SurfaceCard>
              <EmptyState
                description="運営が先に登録した資材をclaimすることも、メーカーから新規登録を申請することもできます。"
                title="公開中の自社資材はありません"
              />
            </SurfaceCard>
          ) : (
            <div className={listStack}>
              {result.data.materials.map((material) => (
                <MaterialRefCard
                  avgRating={material.avg_rating}
                  href={`/dashboard/materials/${material.id}`}
                  isOfficial={material.manufacturer_verified_at !== null}
                  key={material.id}
                  manufacturerName={material.manufacturer_name}
                  name={
                    material.publication_status === "archived"
                      ? `${material.name}（掲載終了）`
                      : material.name
                  }
                />
              ))}
            </div>
          )}
        </section>

        <section aria-label="承認待ちの申請">
          <SectionHeading title="承認待ち" />
          {pending.length === 0 ? (
            <SurfaceCard>
              <EmptyState title="承認待ちの申請はありません" />
            </SurfaceCard>
          ) : (
            <div className={listStack}>
              {pending.map((request) => (
                <SurfaceCard key={request.id} title={request.materialName}>
                  <div className={requestHeader}>
                    <Badge variant="required">
                      {isMaterialChangeType(request.change_type)
                        ? MATERIAL_CHANGE_TYPE_LABELS[request.change_type]
                        : request.change_type}
                    </Badge>
                    <TextLink href={`/dashboard/materials/requests/${request.id}`}>
                      申請内容を見る
                    </TextLink>
                  </div>
                  <p className={requestMeta}>{formatDateJa(request.submitted_at)}に申請</p>
                </SurfaceCard>
              ))}
            </div>
          )}
        </section>

        {history.length > 0 ? (
          <section aria-label="申請履歴">
            <SectionHeading title="申請履歴" />
            <div className={listStack}>
              {history.map((request) => (
                <SurfaceCard key={request.id} title={request.materialName} tone="soft">
                  <div className={requestHeader}>
                    <Badge variant={request.status === "approved" ? "published" : "optional"}>
                      {isMaterialChangeRequestStatus(request.status)
                        ? MATERIAL_CHANGE_REQUEST_STATUS_LABELS[request.status]
                        : request.status}
                    </Badge>
                    <TextLink href={`/dashboard/materials/requests/${request.id}`}>
                      詳細を見る
                    </TextLink>
                  </div>
                </SurfaceCard>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </FormPageShell>
  );
}

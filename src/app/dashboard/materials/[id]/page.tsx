import { notFound, redirect } from "next/navigation";

import {
  Badge,
  DataList,
  EmptyState,
  FormPageShell,
  SurfaceCard,
  TextLink,
  formatDateJa,
} from "@/components";
import { SellerAccessDenied } from "../../_components/AccessDenied";
import { requireSeller } from "@/server/auth";
import { getSellerMaterialPageData } from "@/server/queries/seller-dashboard";
import { css } from "../../../../../styled-system/css";
import { EditRequestForm } from "./_components/EditRequestForm";
import { EvidenceManager } from "./_components/EvidenceManager";
import { PrimaryInformationForm } from "./_components/PrimaryInformationForm";

const pageStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
});

const historyLayout = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

type RequestStatusPresentation = {
  label: string;
  variant: "required" | "published" | "optional";
};

function requestStatus(status: string): RequestStatusPresentation {
  switch (status) {
    case "open":
      return { label: "受付中", variant: "required" };
    case "done":
      return { label: "対応済み", variant: "published" };
    case "declined":
      return { label: "見送り", variant: "optional" };
    default:
      throw new Error(`未対応の分類変更申請ステータスです：${status}`);
  }
}

function namesOrNull(items: ReadonlyArray<{ name: string }>): string | null {
  return items.length === 0 ? null : items.map(({ name }) => name).join("、");
}

export default async function SellerMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSeller();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent(`/dashboard/materials/${id}`)}`);
    }

    return <SellerAccessDenied backHref="/dashboard" />;
  }

  const result = await getSellerMaterialPageData(session.data.sellerId, id);
  if (!result.ok) {
    if (result.error === "not_found") notFound();
    throw new Error("自社資材の取得に失敗しました。");
  }

  const { material, editRequests } = result.data;

  return (
    <FormPageShell chrome="seller" backHref="/dashboard" title={material.name}>
      <div className={pageStack}>
        <SurfaceCard
          description={`${material.manufacturer_name}のclaim済み資材`}
          title={material.name}
          tone="soft"
        >
          <DataList
            rows={[
              {
                label: "公開画面",
                value: <TextLink href={`/materials/${material.id}`}>資材詳細を確認</TextLink>,
              },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard
          description="ここで保存した内容は公開側の資材詳細へ反映されます。"
          title="一次情報を編集"
        >
          <PrimaryInformationForm material={material} />
        </SurfaceCard>

        <EvidenceManager
          evidences={material.evidences}
          materialId={material.id}
          sellerId={session.data.sellerId}
        />

        <SurfaceCard
          description="分類・検索層はFarmilleが管理します。変更が必要な場合は下のフォームから申請してください。"
          title="分類・検索情報"
        >
          <DataList
            rows={[
              { label: "資材名", value: material.name },
              { label: "メーカー名", value: material.manufacturer_name },
              { label: "組成タイプ", value: material.compositionType?.name ?? null },
              { label: "効果", value: namesOrNull(material.effects) },
              {
                label: "対象作物（メーカー表記）",
                value:
                  material.targetCrops.length === 0
                    ? null
                    : material.targetCrops.map(({ sourceName }) => sourceName).join("、"),
              },
              { label: "対象作物（Farmille正規化）", value: namesOrNull(material.targetCrops) },
              { label: "JBSA材料分類", value: namesOrNull(material.ingredientCategories) },
              { label: "個別材料", value: namesOrNull(material.ingredients) },
              { label: "製品タイプ", value: namesOrNull(material.productTypes) },
              { label: "販売状態", value: material.sales_status },
              {
                label: "検索補助タグ",
                value: namesOrNull(material.searchTags),
              },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard
          description="資材名、メーカー名、各分類、販売状態、検索補助タグの変更は運営が確認します。"
          title="分類変更を申請"
        >
          <EditRequestForm materialId={material.id} />
        </SurfaceCard>

        <SurfaceCard title="申請履歴">
          {editRequests.length === 0 ? (
            <EmptyState title="分類変更の申請はありません" />
          ) : (
            <div className={historyLayout}>
              {editRequests.map((request) => {
                const status = requestStatus(request.status);

                return (
                  <SurfaceCard
                    key={request.id}
                    title={formatDateJa(request.created_at)}
                    tone="soft"
                  >
                    <DataList
                      rows={[
                        {
                          label: "状態",
                          value: <Badge variant={status.variant}>{status.label}</Badge>,
                        },
                        { label: "申請内容", value: request.request_text },
                      ]}
                    />
                  </SurfaceCard>
                );
              })}
            </div>
          )}
        </SurfaceCard>
      </div>
    </FormPageShell>
  );
}

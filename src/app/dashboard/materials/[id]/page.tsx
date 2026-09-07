import { notFound, redirect } from "next/navigation";

import { MaterialChangeForm } from "@/app/dashboard/materials/_components/MaterialChangeForm";
import {
  Badge,
  DataList,
  EmptyState,
  FormPageShell,
  SurfaceCard,
  TextLink,
  formatDateJa,
} from "@/components";
import {
  isMaterialChangeRequestStatus,
  isMaterialChangeType,
  MATERIAL_CHANGE_REQUEST_STATUS_LABELS,
  MATERIAL_CHANGE_TYPE_LABELS,
} from "@/lib/material-change";
import { requireSeller } from "@/server/auth";
import { listClassificationOptions } from "@/server/queries/classifications";
import { getSellerMaterialPageData } from "@/server/queries/seller-dashboard";
import { css } from "../../../../../styled-system/css";
import { SellerAccessDenied } from "../../_components/AccessDenied";
import { EvidenceManager } from "./_components/EvidenceManager";
import {
  ArchiveMaterialForm,
  ConfirmMaterialInformationForm,
} from "./_components/MaterialWorkflowForms";

const pageStack = css({ display: "flex", flexDirection: "column", gap: "6" });
const historyLayout = css({ display: "flex", flexDirection: "column", gap: "3" });

export default async function SellerMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSeller();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent(`/dashboard/materials/${id}`)}`);
    }
    return <SellerAccessDenied backHref="/dashboard/materials" />;
  }

  const [result, classifications] = await Promise.all([
    getSellerMaterialPageData(session.data.sellerId, id),
    listClassificationOptions(),
  ]);
  if (!result.ok) {
    if (result.error === "not_found") notFound();
    throw new Error("自社資材の取得に失敗しました。");
  }
  if (!classifications.ok) throw new Error("資材分類の取得に失敗しました。");

  const { material, changeRequests } = result.data;
  const pendingRequest = changeRequests.find(({ status }) => status === "pending") ?? null;
  const isArchived = material.publication_status === "archived";
  const isVerified = material.manufacturer_verified_at !== null;

  return (
    <FormPageShell chrome="seller" backHref="/dashboard/materials" title={material.name}>
      <div className={pageStack}>
        <SurfaceCard
          description={`${material.manufacturer_name}の自社資材`}
          title={material.name}
          tone="soft"
        >
          <DataList
            rows={[
              {
                label: "公開状態",
                value: (
                  <Badge variant={isArchived ? "optional" : "published"}>
                    {isArchived ? "非公開" : "公開中"}
                  </Badge>
                ),
              },
              { label: "メーカー確認", value: isVerified ? "確認済み" : "未確認" },
              {
                label: "公開画面",
                value: <TextLink href={`/materials/${material.id}`}>資材詳細を確認</TextLink>,
              },
            ]}
          />
        </SurfaceCard>

        {!isVerified ? (
          <SurfaceCard
            description="運営が先に登録した情報が正しい場合は、変更申請を出さずに確認済みにできます。"
            title="初期データを確認"
          >
            <ConfirmMaterialInformationForm materialId={material.id} />
          </SurfaceCard>
        ) : null}

        {pendingRequest === null && !isArchived ? (
          <SurfaceCard
            description="送信後も公開中の内容は変わりません。運営が承認すると反映されます。"
            title="資材情報を変更"
          >
            <MaterialChangeForm
              classifications={classifications.data}
              manufacturerName={material.manufacturer_name}
              material={material}
            />
          </SurfaceCard>
        ) : null}

        {pendingRequest === null && !isArchived ? (
          <EvidenceManager
            evidences={material.evidences}
            materialId={material.id}
            sellerId={session.data.sellerId}
          />
        ) : null}

        {pendingRequest !== null ? (
          <SurfaceCard
            description="同じ資材へ重複して申請できません。運営の処理を待つか、申請詳細から取り消してください。"
            title="承認待ちの申請があります"
          >
            <TextLink href={`/dashboard/materials/requests/${pendingRequest.id}`}>
              申請内容を見る
            </TextLink>
          </SurfaceCard>
        ) : null}

        {pendingRequest === null && !isArchived ? (
          <SurfaceCard
            description="運営の承認後、一般ユーザーは資材の検索・詳細閲覧・新規投稿ができなくなります。データは削除せず、メーカーと運営が引き続き確認できます。"
            title="資材を非公開にする"
          >
            <ArchiveMaterialForm materialId={material.id} />
          </SurfaceCard>
        ) : null}

        <SurfaceCard title="申請履歴">
          {changeRequests.length === 0 ? (
            <EmptyState title="資材変更の申請はありません" />
          ) : (
            <div className={historyLayout}>
              {changeRequests.map((request) => (
                <SurfaceCard
                  key={request.id}
                  title={formatDateJa(request.submitted_at)}
                  tone="soft"
                >
                  <DataList
                    rows={[
                      {
                        label: "申請種別",
                        value: isMaterialChangeType(request.change_type)
                          ? MATERIAL_CHANGE_TYPE_LABELS[request.change_type]
                          : request.change_type,
                      },
                      {
                        label: "状態",
                        value: isMaterialChangeRequestStatus(request.status)
                          ? MATERIAL_CHANGE_REQUEST_STATUS_LABELS[request.status]
                          : request.status,
                      },
                      {
                        label: "詳細",
                        value: (
                          <TextLink href={`/dashboard/materials/requests/${request.id}`}>
                            申請内容を見る
                          </TextLink>
                        ),
                      },
                    ]}
                  />
                </SurfaceCard>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </FormPageShell>
  );
}

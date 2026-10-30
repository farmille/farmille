import { notFound, redirect } from "next/navigation";

import { Badge, DataList, FormPageShell, SurfaceCard, TextLink, formatDateJa } from "@/components";
import {
  isMaterialChangeRequestStatus,
  isMaterialChangeType,
  MATERIAL_CHANGE_REQUEST_STATUS_LABELS,
  MATERIAL_CHANGE_TYPE_LABELS,
} from "@/lib/material-change";
import { requireSeller } from "@/server/auth";
import { getSellerMaterialChangeRequest } from "@/server/queries/seller-dashboard";
import { css } from "../../../../../../styled-system/css";
import { SellerAccessDenied } from "../../../_components/AccessDenied";
import { RequestCancelButton } from "./RequestCancelButton";

const pageStack = css({ display: "flex", flexDirection: "column", gap: "5" });

export default async function SellerMaterialRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSeller();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/sellers/login?next=${encodeURIComponent(`/dashboard/materials/requests/${id}`)}`);
    }

    return <SellerAccessDenied backHref="/dashboard/materials" />;
  }

  const result = await getSellerMaterialChangeRequest(session.data.sellerId, id);

  if (!result.ok) {
    if (result.error === "not_found") notFound();
    throw new Error("資材変更申請の取得に失敗しました。");
  }

  const { request, proposal } = result.data;

  const statusLabel = isMaterialChangeRequestStatus(request.status)
    ? MATERIAL_CHANGE_REQUEST_STATUS_LABELS[request.status]
    : request.status;

  const typeLabel = isMaterialChangeType(request.change_type)
    ? MATERIAL_CHANGE_TYPE_LABELS[request.change_type]
    : request.change_type;

  return (
    <FormPageShell chrome="seller" backHref="/dashboard/materials" title="資材変更申請">
      <div className={pageStack}>
        <SurfaceCard
          description={`${formatDateJa(request.submitted_at)}に申請`}
          title={proposal.name}
        >
          <DataList
            rows={[
              { label: "申請種別", value: typeLabel },
              {
                label: "状態",
                value: (
                  <Badge variant={request.status === "approved" ? "published" : "required"}>
                    {statusLabel}
                  </Badge>
                ),
              },
              { label: "申請メモ", value: request.reason },
              {
                label: "運営からの回答",
                value: request.review_note,
              },
              {
                label: "公開資材",
                value:
                  request.result_material_id === null ? null : (
                    <TextLink href={`/materials/${request.result_material_id}`}>
                      公開画面を見る
                    </TextLink>
                  ),
              },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard title="申請した内容">
          <DataList
            rows={[
              { label: "資材名", value: proposal.name },
              { label: "メーカー名", value: proposal.manufacturer_name },
              { label: "販売状況", value: proposal.sales_status },
              { label: "紹介文", value: proposal.description },
              { label: "一般用途", value: proposal.general_use },
              { label: "主成分", value: proposal.main_components },
              { label: "作用機作", value: proposal.mechanism },
              { label: "使い方", value: proposal.usage_text },
              { label: "価格帯", value: proposal.price_range },
              { label: "公式URL", value: proposal.official_url },
              { label: "カタログURL", value: proposal.catalog_url },
            ]}
          />
        </SurfaceCard>

        {request.status === "pending" ? (
          <SurfaceCard
            description="取り消した申請は運営の承認対象から外れます。"
            title="申請を取り消す"
          >
            <RequestCancelButton requestId={request.id} />
          </SurfaceCard>
        ) : null}
      </div>
    </FormPageShell>
  );
}

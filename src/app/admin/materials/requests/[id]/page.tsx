import { notFound } from "next/navigation";

import { AdminShell } from "@/app/admin/_components/AdminShell";
import { Panel } from "@/app/admin/_components/AdminUI";
import { requireAdminPage } from "@/app/admin/_lib/access";
import { Badge, DataList, TextLink, formatDateJa } from "@/components";
import { FormMessage } from "@/components/auth/Fields";
import {
  isMaterialChangeRequestStatus,
  isMaterialChangeType,
  MATERIAL_CHANGE_REQUEST_STATUS_LABELS,
  MATERIAL_CHANGE_TYPE_LABELS,
} from "@/lib/material-change";
import { getMaterialChangeRequest } from "@/server/admin/material-change-requests";
import { listClassificationOptions } from "@/server/queries/classifications";
import { css } from "../../../../../../styled-system/css";
import { RequestDecisionForm } from "./RequestDecisionForm";

const comparisonGrid = css({
  display: "grid",
  gridTemplateColumns: "minmax(120px, 0.7fr) repeat(2, minmax(0, 1fr))",
  borderTopWidth: "1px",
  borderLeftWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
});

const comparisonCell = css({
  p: "3",
  borderRightWidth: "1px",
  borderBottomWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  fontSize: "sm",
});

const headingCell = css({ fontWeight: "700", bg: "surface.subtle" });

function display(value: string | null | undefined): string {
  return value === null || value === undefined || value.length === 0 ? "—" : value;
}

function names(ids: string[], options: { id: string; name: string }[]): string {
  const byId = new Map(options.map((option) => [option.id, option.name]));
  return ids.map((id) => byId.get(id) ?? `不明：${id}`).join("、") || "—";
}

export default async function AdminMaterialChangeRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ resolved?: string }>;
}) {
  const [{ id }, { resolved }] = await Promise.all([params, searchParams]);
  await requireAdminPage(`/admin/materials/requests/${id}`);

  const [result, classifications] = await Promise.all([
    getMaterialChangeRequest(id),
    listClassificationOptions(),
  ]);
  if (!result.ok) {
    if (result.error === "not_found") notFound();
    throw new Error("資材変更申請の取得に失敗しました。");
  }
  if (!classifications.ok) throw new Error("資材分類の取得に失敗しました。");

  const { request, proposal, current, sellerName } = result.data;
  const currentValues = {
    name: current?.name,
    manufacturer: current?.manufacturer_name,
    salesStatus: current?.sales_status,
    description: current?.description,
    generalUse: current?.general_use,
    mainComponents: current?.main_components,
    mechanism: current?.mechanism,
    usageText: current?.usage_text,
    priceRange: current?.price_range,
    officialUrl: current?.official_url,
    catalogUrl: current?.catalog_url,
    crops: current === null ? "—" : names(current.cropIds, classifications.data.crops),
    effects: current === null ? "—" : names(current.effectIds, classifications.data.effects),
    ingredientCategories:
      current === null
        ? "—"
        : names(current.ingredientCategoryIds, classifications.data.ingredientCategories),
    productTypes:
      current === null ? "—" : names(current.productTypeIds, classifications.data.productTypes),
  };
  const rows = [
    ["資材名", currentValues.name, proposal.name],
    ["メーカー名", currentValues.manufacturer, proposal.manufacturerName],
    ["販売状況", currentValues.salesStatus, proposal.salesStatus],
    ["紹介文", currentValues.description, proposal.description],
    ["一般用途", currentValues.generalUse, proposal.generalUse],
    ["主成分", currentValues.mainComponents, proposal.mainComponents],
    ["作用機序", currentValues.mechanism, proposal.mechanism],
    ["使い方", currentValues.usageText, proposal.usageText],
    ["価格帯", currentValues.priceRange, proposal.priceRange],
    ["公式URL", currentValues.officialUrl, proposal.officialUrl],
    ["カタログURL", currentValues.catalogUrl, proposal.catalogUrl],
    ["対象作物", currentValues.crops, names(proposal.cropIds, classifications.data.crops)],
    ["効果", currentValues.effects, names(proposal.effectIds, classifications.data.effects)],
    [
      "JBSA材料分類",
      currentValues.ingredientCategories,
      names(proposal.ingredientCategoryIds, classifications.data.ingredientCategories),
    ],
    [
      "製品タイプ",
      currentValues.productTypes,
      names(proposal.productTypeIds, classifications.data.productTypes),
    ],
    [
      "エビデンス件数",
      current === null
        ? "—"
        : String(
            proposal.evidences.filter(({ source_evidence_id }) => source_evidence_id !== null)
              .length,
          ),
      String(proposal.evidences.length),
    ],
  ];

  return (
    <AdminShell
      backHref="/admin/materials/requests"
      backLabel="← 資材変更申請"
      description="公開中の内容とメーカー申請を比較し、承認後にだけ公開行へ反映する。"
      title="資材変更申請を確認"
    >
      {resolved === "approve" ? (
        <FormMessage tone="info">申請を承認して公開内容へ反映しました。</FormMessage>
      ) : null}
      {resolved === "reject" ? <FormMessage tone="info">申請を却下しました。</FormMessage> : null}
      <Panel title={proposal.name}>
        <DataList
          rows={[
            { label: "メーカー", value: sellerName },
            {
              label: "申請種別",
              value: isMaterialChangeType(request.change_type)
                ? MATERIAL_CHANGE_TYPE_LABELS[request.change_type]
                : request.change_type,
            },
            {
              label: "状態",
              value: (
                <Badge variant={request.status === "approved" ? "published" : "required"}>
                  {isMaterialChangeRequestStatus(request.status)
                    ? MATERIAL_CHANGE_REQUEST_STATUS_LABELS[request.status]
                    : request.status}
                </Badge>
              ),
            },
            { label: "申請日", value: formatDateJa(request.submitted_at) },
            { label: "申請メモ", value: request.reason },
            { label: "処理メモ", value: request.review_note },
            {
              label: "対象の公開資材",
              value:
                request.material_id === null ? null : (
                  <TextLink href={`/admin/materials/${request.material_id}`}>資材を開く</TextLink>
                ),
            },
          ]}
        />
      </Panel>

      <Panel title="公開内容との比較">
        <div className={comparisonGrid}>
          <div className={`${comparisonCell} ${headingCell}`}>項目</div>
          <div className={`${comparisonCell} ${headingCell}`}>現在の公開内容</div>
          <div className={`${comparisonCell} ${headingCell}`}>メーカー申請</div>
          {rows.map(([label, currentValue, proposalValue]) => (
            <div key={label} className={css({ display: "contents" })}>
              <div className={`${comparisonCell} ${headingCell}`}>{label}</div>
              <div className={comparisonCell}>{display(currentValue)}</div>
              <div className={comparisonCell}>{display(proposalValue)}</div>
            </div>
          ))}
        </div>
      </Panel>

      {request.status === "pending" ? (
        <Panel title="承認判断">
          <RequestDecisionForm requestId={request.id} />
        </Panel>
      ) : null}
    </AdminShell>
  );
}

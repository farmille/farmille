import type { ReactNode } from "react";

import { MaterialRegistrationBadges } from "@/components/materials/MaterialRegistrationBadges";
import {
  APPLICATION_METHODS,
  materialRegistrationRows,
  type MaterialPageContent,
} from "@/lib/material-page-editor";
import type { MaterialDetail } from "@/server/queries/materials";

import { MockChip } from "./MockParts";

type DetailRow = {
  label: string;
  value: ReactNode;
};

function methodLabel(method: string): string {
  return APPLICATION_METHODS.find((item) => item.value === method)?.label ?? method;
}

/** 見本の tagRow：タグを `.ts-chips` に並べる。無ければ「−」。 */
function tags(names: readonly string[], tone?: "grey"): ReactNode {
  const unique = [...new Set(names)];
  if (unique.length === 0) return "−";
  return (
    <div className="ts-chips" style={{ marginTop: 2 }}>
      {unique.map((name) => (
        <MockChip key={name} tone={tone}>
          {name}
        </MockChip>
      ))}
    </div>
  );
}

/**
 * 見本 S.material の boxSpec（製品詳細）。
 * 分類は登録された名前を表示し、メーカー未入力の説明を補完しない。全行を常に出し、未入力は「−」。
 */
export function MaterialDetailTable({
  material,
  content,
}: {
  material: MaterialDetail;
  content?: MaterialPageContent;
}) {
  const methods = [
    ...new Set([
      ...material.applicationMethods.map((item) => item.method),
      ...(content?.usages.map((item) => item.method) ?? []),
    ]),
  ];
  const usageBlocks = (content?.usages ?? []).filter(
    (usage) => usage.method !== "other" && usage.detail.trim().length > 0,
  );
  const rows: DetailRow[] = [
    { label: "期待効果", value: tags(material.effects.map(({ name }) => name)) },
    {
      label: "資材ジャンル",
      value: tags(
        material.ingredientCategories.map(({ name }) => name),
        "grey",
      ),
    },
    { label: "主な成分", value: material.main_components || "−" },
    {
      label: "対象作物",
      value: tags([...material.targetCrops, ...material.targetCropGroups].map(({ name }) => name)),
    },
    {
      label: "施用方法",
      value: (
        <>
          {methods.length > 0 ? tags(methods.map(methodLabel)) : "−"}
          {usageBlocks.length > 0 ? (
            <details className="usage-more">
              <summary>詳細を見る</summary>
              {usageBlocks.map((usage, index) => (
                <div
                  key={index}
                  className="usage-b"
                  style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {methodLabel(usage.method)}：{usage.detail}
                </div>
              ))}
            </details>
          ) : (
            <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>
              詳細：−
            </div>
          )}
        </>
      ),
    },
    { label: "技術・作用機作", value: content?.mechanism || "−" },
    {
      label: "登録・認証",
      value: (
        <MaterialRegistrationBadges
          registrations={content?.registrations ?? []}
          certifications={content?.certifications ?? []}
        />
      ),
    },
    ...materialRegistrationRows(content?.registrations ?? []),
    {
      label: "関係会社（販売元、製造元、輸入元など）",
      value: content ? content.relatedCompanies.join("、") || "−" : material.manufacturer_name,
    },
  ];

  return (
    <section aria-labelledby="material-detail-heading">
      <h2 id="material-detail-heading" className="pp-h">
        製品詳細
      </h2>
      <dl className="card" style={{ margin: 0 }}>
        {rows.map((row) => (
          <div key={row.label} className="detail-row">
            <dt className="dk">{row.label}</dt>
            <dd className="dv" style={{ margin: 0, overflowWrap: "anywhere" }}>
              {row.value ?? "−"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

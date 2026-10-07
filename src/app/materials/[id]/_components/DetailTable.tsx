import type { ReactNode } from "react";

import { MaterialRegistrationBadges } from "@/components/materials/MaterialRegistrationBadges";
import {
  APPLICATION_METHODS,
  materialRegistrationRows,
  type MaterialPageContent,
} from "@/lib/material-page-editor";
import type { MaterialDetail } from "@/server/queries/materials";

import { css, cx } from "../../../../../styled-system/css";

import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { MaterialBox } from "./MaterialBox";
import { MockChip } from "./MockParts";

const chipsStyle = css({ display: "flex", flexWrap: "wrap", gap: "1.5", mt: "0.5" });
const usageMoreStyle = css({ mt: "1.5", "&[open] > summary::after": { content: '"▴"' } });
const usageSummaryStyle = css({
  cursor: "pointer",
  fontSize: "sm",
  color: "primary.800",
  fontWeight: "semibold",
  listStyle: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  "&::-webkit-details-marker": { display: "none" },
  _after: { content: '"▾"', fontSize: "xs" },
});
const usageBlockStyle = css({
  mt: "1.5",
  px: "3",
  py: "2",
  bg: "surface.page",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "input",
  fontSize: "sm",
  lineHeight: "prose",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});
const usageEmptyStyle = css({ mt: "1.5", fontSize: "xs", color: "text.subtle" });
const rowStyle = css({
  px: "3.5",
  py: "2.5",
  borderBottomWidth: "1px",
  borderColor: "border.default",
  _last: { borderBottomWidth: "0" },
});
const termStyle = css({ fontSize: "xs", color: "text.subtle" });
const valueStyle = css({
  m: "0",
  mt: "0.5",
  fontSize: "md",
  lineHeight: "relaxed",
  overflowWrap: "anywhere",
});

type DetailRow = {
  label: string;
  value: ReactNode;
};

function methodLabel(method: string): string {
  return APPLICATION_METHODS.find((item) => item.value === method)?.label ?? method;
}

/** タグを並べる。無ければ「−」。 */
function tags(names: readonly string[], tone?: "grey"): ReactNode {
  const unique = [...new Set(names)];
  if (unique.length === 0) return "−";
  return (
    <div className={chipsStyle}>
      {unique.map((name) => (
        <MockChip key={name} tone={tone}>
          {name}
        </MockChip>
      ))}
    </div>
  );
}

/**
 * 製品詳細。
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
            <details className={usageMoreStyle}>
              <summary className={usageSummaryStyle}>詳細を見る</summary>
              {usageBlocks.map((usage, index) => (
                <div key={index} className={usageBlockStyle}>
                  {methodLabel(usage.method)}：{usage.detail}
                </div>
              ))}
            </details>
          ) : (
            <div className={usageEmptyStyle}>詳細：−</div>
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
    <MaterialBox headingId="material-detail-heading" title="製品詳細">
      <dl className={cx(surfaceCardRecipe({ padding: "flush" }), css({ m: "0" }))}>
        {rows.map((row) => (
          <div key={row.label} className={rowStyle}>
            <dt className={termStyle}>{row.label}</dt>
            <dd className={valueStyle}>{row.value ?? "−"}</dd>
          </div>
        ))}
      </dl>
    </MaterialBox>
  );
}

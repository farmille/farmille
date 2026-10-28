import type { ReactNode } from "react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
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

// 名前の途中ではなく「、」の位置で折り返す
const joinedNamesStyle = css({ wordBreak: "keep-all" });
const nameListStyle = css({ listStyle: "none", m: "0", p: "0" });
// 対象作物は数が多いので2列に並べて拾いやすくする
const cropListStyle = css({
  listStyle: "none",
  m: "0",
  p: "0",
  display: "grid",
  gridTemplateColumns: "[repeat(2, minmax(0, 1fr))]",
  columnGap: "3",
});
const usageMoreStyle = css({ mt: "1.5" });
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
const termStyle = css({ textStyle: "note", color: "text.subtle" });
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

function joinedNames(names: readonly string[]): ReactNode {
  const unique = [...new Set(names)];
  if (unique.length === 0) return "−";
  return <span className={joinedNamesStyle}>{unique.join("、")}</span>;
}

function nameList(names: readonly string[], className: string): ReactNode {
  const unique = [...new Set(names)];
  if (unique.length === 0) return "−";
  return (
    <ul className={className}>
      {unique.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
}

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
    { label: "正式名称", value: material.official_name ?? "−" },
    { label: "期待効果", value: joinedNames(material.effects.map(({ name }) => name)) },
    {
      label: "資材ジャンル",
      value: nameList(
        material.ingredientCategories.map(({ name }) => name),
        nameListStyle,
      ),
    },
    { label: "主な成分", value: material.main_components || "−" },
    {
      label: "対象作物",
      value: nameList(
        [...material.targetCrops, ...material.targetCropGroups].map(({ name }) => name),
        cropListStyle,
      ),
    },
    {
      label: "施用方法",
      value: (
        <>
          {joinedNames(methods.map(methodLabel))}
          {usageBlocks.length > 0 ? (
            <Collapsible className={usageMoreStyle}>
              <CollapsibleTrigger variant="link">詳細を見る</CollapsibleTrigger>
              <CollapsiblePanel hiddenUntilFound>
                {usageBlocks.map((usage, index) => (
                  <div key={index} className={usageBlockStyle}>
                    {methodLabel(usage.method)}：{usage.detail}
                  </div>
                ))}
              </CollapsiblePanel>
            </Collapsible>
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

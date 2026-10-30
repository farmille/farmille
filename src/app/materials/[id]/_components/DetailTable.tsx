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

const RELATED_COMPANIES_LABEL = "関係会社（販売元、製造元、輸入元など）";
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

export type DetailRow = {
  label: string;
  value: ReactNode;
};

function methodLabel(method: string): string {
  return APPLICATION_METHODS.find((item) => item.value === method)?.label ?? method;
}

function joinedNames(names: readonly string[]): ReactNode {
  return <span className={joinedNamesStyle}>{names.join("、")}</span>;
}

function nameList(names: readonly string[], className: string): ReactNode {
  return (
    <ul className={className}>
      {names.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
}

function namesRow(
  label: string,
  names: readonly string[],
  render: (unique: readonly string[]) => ReactNode,
): DetailRow[] {
  const unique = [...new Set(names)];

  return unique.length === 0 ? [] : [{ label, value: render(unique) }];
}

function textRow(label: string, value: string | null | undefined): DetailRow[] {
  return value ? [{ label, value }] : [];
}

/** 値のある項目だけを、公開ページの順に並べる。 */
export function materialDetailRows(
  material: MaterialDetail,
  content: MaterialPageContent | undefined,
): DetailRow[] {
  const methods = [
    ...new Set([
      ...material.applicationMethods.map((item) => item.method),
      ...(content?.usages.map((item) => item.method) ?? []),
    ]),
  ];

  const usageBlocks = (content?.usages ?? []).filter(
    (usage) => usage.method !== "other" && usage.detail.trim().length > 0,
  );

  const registrations = content?.registrations ?? [];
  const certifications = content?.certifications ?? [];

  const rows: DetailRow[] = [
    ...textRow("正式名称", material.official_name),
    ...namesRow(
      "期待効果",
      material.effects.map(({ name }) => name),
      joinedNames,
    ),
    ...namesRow(
      "資材ジャンル",
      material.ingredientCategories.map(({ name }) => name),
      (names) => nameList(names, nameListStyle),
    ),
    ...textRow("主な成分", material.main_components),
    ...namesRow(
      "対象作物",
      [...material.targetCrops, ...material.targetCropGroups].map(({ name }) => name),
      (names) => nameList(names, cropListStyle),
    ),
    ...(methods.length === 0
      ? []
      : [
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
                ) : null}
              </>
            ),
          },
        ]),
    ...textRow("技術・作用機作", content?.mechanism),
    ...(registrations.length === 0 && certifications.length === 0
      ? []
      : [
          {
            label: "登録・認証",
            value: (
              <MaterialRegistrationBadges
                registrations={registrations}
                certifications={certifications}
              />
            ),
          },
        ]),
    ...materialRegistrationRows(registrations),
  ];

  if (content !== undefined) {
    // 原稿で会社をすべて外したときは「−」を出す（manufacturer-editor-SPEC.md）
    return [
      ...rows,
      { label: RELATED_COMPANIES_LABEL, value: content.relatedCompanies.join("、") || "−" },
    ];
  }

  // 原稿の無い資材の会社名は上部と同じなので、ほかに製品情報があるときだけ添える
  return rows.length === 0
    ? []
    : [...rows, { label: RELATED_COMPANIES_LABEL, value: material.manufacturer_name }];
}

export function MaterialDetailTable({ rows }: { rows: readonly DetailRow[] }) {
  return (
    <MaterialBox headingId="material-detail-heading" title="製品詳細">
      <dl className={cx(surfaceCardRecipe({ padding: "flush" }), css({ m: "0" }))}>
        {rows.map((row) => (
          <div key={row.label} className={rowStyle}>
            <dt className={termStyle}>{row.label}</dt>
            <dd className={valueStyle}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </MaterialBox>
  );
}

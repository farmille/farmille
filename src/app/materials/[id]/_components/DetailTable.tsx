import { MaterialRegistrationBadges } from "@/components/materials/MaterialRegistrationBadges";
import type { ReactNode } from "react";
import {
  APPLICATION_METHODS,
  materialRegistrationRows,
  type MaterialPageContent,
} from "@/lib/material-page-editor";
import type { MaterialDetail } from "@/server/queries/materials";
import { css } from "../../../../../styled-system/css";

type DetailRow = {
  label: string;
  value: ReactNode;
  manufacturerEntry?: boolean;
};

const tableCard = css({
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  overflow: "hidden",
});

// 分類は登録された名前を表示し、メーカー未入力の説明を補完しない。
export function MaterialDetailTable({
  material,
  content,
}: {
  material: MaterialDetail;
  content?: MaterialPageContent;
}) {
  const tags = (items: ReadonlyArray<{ name: string }>): ReactNode =>
    items.length === 0 ? (
      "−"
    ) : (
      <span className={css({ display: "flex", flexWrap: "wrap", gap: "1.5" })}>
        {[...new Set(items.map(({ name }) => name))].map((name) => (
          <span
            key={name}
            className={css({
              bg: "surface.panel",
              borderRadius: "button",
              px: "2",
              py: "1",
              fontSize: "xs",
            })}
          >
            {name}
          </span>
        ))}
      </span>
    );
  const methods = [
    ...new Set([
      ...material.applicationMethods.map((item) => item.method),
      ...(content?.usages.map((item) => item.method) ?? []),
    ]),
  ];
  const rows: DetailRow[] = [
    { label: "期待効果", value: tags(material.effects) },
    { label: "資材ジャンル", value: tags(material.ingredientCategories) },
    { label: "主な成分", value: material.main_components },
    { label: "対象作物", value: tags([...material.targetCrops, ...material.targetCropGroups]) },
    {
      label: "施用方法",
      value: methods.length
        ? methods.map((method, index) => (
            <div key={index} className={css({ mb: "2" })}>
              {tags(
                APPLICATION_METHODS.filter((item) => item.value === method).map((method) => ({
                  name: method.label,
                })),
              )}
              {method !== "other" ? (
                <details className={css({ mt: "1" })}>
                  <summary>詳細</summary>
                  <p className={css({ whiteSpace: "pre-wrap", overflowWrap: "anywhere" })}>
                    {content?.usages.find((usage) => usage.method === method)?.detail || "−"}
                  </p>
                </details>
              ) : null}
            </div>
          ))
        : "−",
    },
    { label: "技術", value: "−" },
    { label: "作用機作", manufacturerEntry: true, value: content?.mechanism || "−" },
    {
      label: "登録・認証",
      manufacturerEntry: true,
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
      manufacturerEntry: true,
      value: content ? content.relatedCompanies.join("、") || "−" : material.manufacturer_name,
    },
  ];

  return (
    <section aria-labelledby="material-detail-heading">
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2",
          mb: "2.5",
        })}
      >
        <h2
          id="material-detail-heading"
          className={css({ m: "0", fontSize: "lg", fontWeight: "700" })}
        >
          製品詳細
        </h2>
      </div>
      <dl className={tableCard}>
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={css({
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
              gap: "3",
              px: "3.5",
              py: "3",
              borderTopWidth: index === 0 ? "0" : "1px",
              borderTopStyle: "solid",
              borderTopColor: "border.default",
            })}
          >
            <dt className={css({ fontSize: "sm", fontWeight: "700", color: "text.muted" })}>
              {row.label.split("・").map((part, index) => (
                <span key={part} className={css({ display: "inline-block" })}>
                  {index > 0 ? "・" : ""}
                  {part}
                </span>
              ))}
              {row.manufacturerEntry &&
              row.value !== null &&
              row.value !== "−" &&
              material.manufacturer_verified_at !== null ? (
                <small
                  className={css({
                    display: "block",
                    fontSize: "2xs",
                    fontWeight: "400",
                    color: "text.subtle",
                    mt: "1",
                  })}
                >
                  メーカー記入
                </small>
              ) : null}
            </dt>
            <dd className={css({ m: "0", fontSize: "sm", lineHeight: "1.65" })}>
              {row.value ?? "−"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

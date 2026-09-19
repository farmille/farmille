import type { ReactNode } from "react";
import { APPLICATION_METHODS, type MaterialPageContent } from "@/lib/material-page-editor";
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

// 分類名だけを表示し、含有量やメーカー未入力の説明を補完しない。
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
  const rows: DetailRow[] = [
    { label: "期待効果", value: tags(material.effects) },
    { label: "資材ジャンル", value: tags(material.ingredientCategories) },
    { label: "主な成分", value: tags(material.ingredients) },
    { label: "対象作物", value: tags(material.targetCrops) },
    {
      label: "施用方法",
      value: content?.usages.length
        ? content.usages.map((usage, index) => (
            <div key={index} className={css({ mb: "2" })}>
              {tags(
                APPLICATION_METHODS.filter((method) => method.value === usage.method).map(
                  (method) => ({ name: method.label }),
                ),
              )}
              {usage.method !== "other" ? (
                <details className={css({ mt: "1" })}>
                  <summary>詳細</summary>
                  <p className={css({ whiteSpace: "pre-wrap", overflowWrap: "anywhere" })}>
                    {usage.detail || "−"}
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
      value: content?.certifications.join("・") || "−",
    },
    { label: "製造元・販売元・輸入元", manufacturerEntry: true, value: material.manufacturer_name },
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
      <p className={css({ mt: "3", fontSize: "xs", color: "text.subtle", lineHeight: "relaxed" })}>
        作物・効果・施用方法の分類は、農林水産省の通知（30消安第6281号）・JBSAの公式分類を参考にFarmilleが整理・解釈しています。効果を検証・保証するものではありません。
      </p>
    </section>
  );
}

import { Badge } from "@/components";
import type { MaterialDetail } from "@/server/queries/materials";
import { css } from "../../../../../styled-system/css";

type DetailRow = {
  label: string;
  value: string | null;
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

export function MaterialDetailTable({ material }: { material: MaterialDetail }) {
  const names = (items: ReadonlyArray<{ name: string }>): string | null =>
    items.length === 0 ? null : items.map(({ name }) => name).join("・");
  const manufacturerCrops =
    material.targetCrops.length === 0
      ? null
      : material.targetCrops.map(({ sourceName }) => sourceName).join("・");
  const rows: DetailRow[] = [
    { label: "一般用途", value: material.general_use },
    { label: "組成タイプ", value: material.compositionType?.name ?? null },
    { label: "製品タイプ（メーカー分類）", value: names(material.productTypes) },
    { label: "主成分", value: material.main_components },
    { label: "JBSA材料分類", value: names(material.ingredientCategories) },
    { label: "個別材料", value: names(material.ingredients) },
    { label: "作用機序", value: material.mechanism },
    { label: "効果", value: names(material.effects) },
    { label: "対象作物（メーカー表記）", value: manufacturerCrops },
    { label: "対象作物（Farmille正規化）", value: names(material.targetCrops) },
    { label: "販売状況", value: material.sales_status },
    { label: "製造元", value: material.manufacturer_name },
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
          資材詳細
        </h2>
        {material.manufacturer_verified_at !== null ? (
          <Badge variant="optional">メーカー入力済み</Badge>
        ) : null}
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
              {row.label}
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

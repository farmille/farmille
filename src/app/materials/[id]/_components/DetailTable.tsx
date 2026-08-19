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
  const targetCrops = material.tags
    .filter(({ category }) => category === "crop")
    .map(({ name }) => name)
    .join("・");
  const rows: DetailRow[] = [
    { label: "一般用途", value: material.general_use },
    { label: "製品タイプ", value: material.product_type },
    { label: "主成分", value: material.ingredients },
    { label: "作用機序", value: material.mechanism },
    { label: "効果分類（JBSA基準・製造元申告）", value: material.jbsa_class },
    { label: "対象作目", value: targetCrops.length > 0 ? targetCrops : null },
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
          mt: "6",
          mb: "2.5",
        })}
      >
        <h2
          id="material-detail-heading"
          className={css({ m: "0", fontSize: "lg", fontWeight: "700" })}
        >
          資材詳細
        </h2>
        {material.seller_id ? <Badge variant="official">メーカー確認済み</Badge> : null}
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
              {row.value ?? "未設定"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

import { StarRating } from "@/components";
import type { CompareMaterialItem } from "@/server/queries/saved-materials";
import { css } from "../../../../../styled-system/css";

const scroll = css({
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  boxShadow: "shadow",
});

const table = css({
  borderCollapse: "collapse",
  minW: "100%",
  fontSize: "sm",
});

const th = css({
  position: "sticky",
  left: "0",
  zIndex: "1",
  bg: "surface.page",
  color: "text.subtle",
  fontWeight: "700",
  fontSize: "xs",
  textAlign: "left",
  px: "3",
  py: "2.5",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  borderRightWidth: "1px",
  borderRightStyle: "solid",
  borderRightColor: "border.default",
  whiteSpace: "nowrap",
  minW: "96px",
});

const td = css({
  px: "3",
  py: "2.5",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  verticalAlign: "top",
  minW: "140px",
  maxW: "180px",
});

const materialLink = css({
  color: "primary.700",
  fontWeight: "700",
  textDecoration: "none",
});

const tagList = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "1",
});

const tag = css({
  display: "inline-flex",
  px: "2",
  py: "0.5",
  borderRadius: "pill",
  bg: "primary.200",
  color: "primary.700",
  fontSize: "2xs",
  fontWeight: "600",
});

function formatRating(rating: number | null): string {
  if (rating === null) return "—";
  return rating.toFixed(1);
}

type CompareTableProps = {
  materials: readonly CompareMaterialItem[];
};

/** 選択資材の横スクロール比較表。 */
export function CompareTable({ materials }: CompareTableProps) {
  const rows: Array<{
    label: string;
    render: (material: CompareMaterialItem) => ReactNode;
  }> = [
    {
      label: "名前",
      render: (material) => (
        <Link href={`/materials/${material.id}`} className={materialLink}>
          {material.name}
        </Link>
      ),
    },
    {
      label: "メーカー",
      render: (material) => material.manufacturerName,
    },
    {
      label: "平均評価",
      render: (material) => (
        <div className={css({ display: "flex", flexDirection: "column", gap: "1" })}>
          <span className={css({ fontWeight: "800", fontVariantNumeric: "tabular-nums" })}>
            {formatRating(material.avgRating)}
          </span>
          {material.avgRating !== null ? <StarRating value={material.avgRating} size="sm" /> : null}
        </div>
      ),
    },
    {
      label: "感想口コミ数",
      render: (material) => (
        <span className={css({ fontVariantNumeric: "tabular-nums" })}>{material.reviewCount}</span>
      ),
    },
    {
      label: "資材ジャンル（JBSA材料8分類）",
      render: (material) => material.genre ?? "—",
    },
    {
      label: "主な分類",
      render: (material) =>
        material.tags.length === 0 ? (
          "—"
        ) : (
          <div className={tagList}>
            {material.tags.slice(0, 6).map((item) => (
              <span key={item.id} className={tag}>
                {item.name}
              </span>
            ))}
          </div>
        ),
    },
    {
      label: "価格帯",
      render: (material) => material.priceRange ?? "—",
    },
  ];

  return (
    <div className={scroll}>
      <table className={table}>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className={th}>
                {row.label}
              </th>
              {materials.map((material) => (
                <td key={`${row.label}-${material.id}`} className={td}>
                  {row.render(material)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

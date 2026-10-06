import type { ReactNode } from "react";

import { cva, css } from "../../styled-system/css";

const rowRecipe = cva({
  base: {
    display: "grid",
    gridTemplateColumns: "minmax(96px, 0.8fr) minmax(0, 1.4fr)",
    gap: "3",
    py: "2.5",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
  },
  variants: {
    first: {
      true: { borderTopWidth: "0", pt: "0" },
      false: { borderTopWidth: "1px" },
    },
    last: {
      true: { pb: "0" },
      false: {},
    },
  },
  defaultVariants: {
    first: false,
    last: false,
  },
});

export type DataListRow = {
  label: string;
  value: ReactNode;
};

type DataListProps = {
  rows: readonly DataListRow[];
  emptyLabel?: string;
};

/** 組織情報や読み取り専用項目を表示する定義リスト。 */
export function DataList({ rows, emptyLabel = "未設定" }: DataListProps) {
  return (
    <dl className={css({ m: "0" })}>
      {rows.map((row, index) => (
        <div
          className={rowRecipe({
            first: index === 0,
            last: index === rows.length - 1,
          })}
          key={row.label}
        >
          <dt className={css({ color: "text.subtle", fontSize: "sm", fontWeight: "bold" })}>
            {row.label}
          </dt>
          <dd
            className={css({
              m: "0",
              minW: "0",
              color: "text.default",
              fontSize: "sm",
              lineHeight: "relaxed",
              overflowWrap: "anywhere",
            })}
          >
            {row.value === null || row.value === undefined || row.value === ""
              ? emptyLabel
              : row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

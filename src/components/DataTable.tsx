import type { ReactNode } from "react";

import { cva, css, cx } from "../../styled-system/css";

const wrapStyle = css({
  w: "full",
  overflowX: "auto",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
});

const tableStyle = css({
  w: "full",
  borderCollapse: "collapse",
  textStyle: "body",
  whiteSpace: "nowrap",
});

const cellRecipe = cva({
  base: {
    px: "3",
    py: "2.5",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.default",
    verticalAlign: "top",
  },
  variants: {
    role: {
      header: {
        bg: "surface.panel",
        color: "text.muted",
        fontSize: "sm",
        fontWeight: "bold",
        position: "sticky",
        top: "0",
      },
      body: {
        color: "text.default",
      },
    },
    align: {
      start: { textAlign: "start" },
      end: { textAlign: "end", fontVariantNumeric: "tabular-nums" },
    },
  },
  defaultVariants: {
    role: "body",
    align: "start",
  },
});

const emptyStyle = css({
  px: "3",
  py: "8",
  textAlign: "center",
  color: "text.subtle",
  textStyle: "body",
});

export type DataTableColumn<Row> = {
  key: string;
  header: ReactNode;
  cell: (row: Row) => ReactNode;
  align?: "start" | "end";
};

type DataTableProps<Row> = {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  emptyMessage?: string;
  className?: string;
};

/**
 * 運営管理の一覧に使う素のテーブル（02 §2 の admin 系はモック基準外）。
 * 横幅が足りない場合はテーブルだけを横スクロールさせ、ページ本体は横に伸ばさない。
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  emptyMessage = "対象のデータがありません。",
  className,
}: DataTableProps<Row>) {
  if (rows.length === 0) {
    return (
      <div className={cx(wrapStyle, className)}>
        <p className={emptyStyle}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cx(wrapStyle, className)}>
      <table className={tableStyle}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                className={cellRecipe({ role: "header", align: column.align ?? "start" })}
                key={column.key}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  className={cellRecipe({ role: "body", align: column.align ?? "start" })}
                  key={column.key}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

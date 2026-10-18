import type { ReceiptField } from "@/lib/company-application-receipt";

import { css, cva, cx } from "../../../../styled-system/css";

// 見出しと値が並ぶ幅が無ければ、見出しを値の上へ折り返す。画面幅ではなく置き場の幅で決まるので、印刷でもそろう。
const rowStyle = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  columnGap: "4",
  breakInside: "avoid",
});

const labelRecipe = cva({
  base: { flexShrink: "0", textStyle: "supporting", color: "text.muted" },
  variants: {
    labelWidth: {
      narrow: { flexBasis: "20" },
      wide: { flexBasis: "36" },
      // 置き場の幅によらず、見出しを値の上に置く。
      full: { flexBasis: "full" },
    },
  },
});

const valueStyle = css({
  flexGrow: "1",
  flexBasis: "48",
  minW: "0",
  m: "0",
  textStyle: "supporting",
  whiteSpace: "pre-line",
  overflowWrap: "anywhere",
});

/** 受付票の項目名と回答。回答の改行はそのまま見せる。 */
export function ReceiptFields({
  fields,
  labelWidth = "wide",
  className,
}: {
  fields: ReceiptField[];
  labelWidth?: "narrow" | "wide" | "full";
  className?: string;
}) {
  return (
    <dl
      className={cx(
        css({ display: "flex", flexDirection: "column", gap: "1.5", m: "0" }),
        className,
      )}
    >
      {fields.map((field, index) => (
        <div className={rowStyle} key={`${index}-${field.label}`}>
          <dt className={labelRecipe({ labelWidth })}>{field.label}</dt>
          <dd className={valueStyle}>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

import type { ReceiptItem } from "@/lib/company-application-receipt";

import { ReceiptFields } from "./ReceiptFields";

import { css } from "../../../../styled-system/css";

const headRow = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: "4",
  pb: "2",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.strong",
  breakAfter: "avoid",
});

const headLabel = css({ textStyle: "supporting", fontWeight: "bold", color: "text.muted" });

const rowStyle = css({
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  columnGap: "3",
  rowGap: "2",
  py: "4",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  breakInside: "avoid",
  _last: { borderBottomColor: "border.strong" },
});

const numberStyle = css({
  minW: "4",
  textStyle: "body",
  color: "text.muted",
  fontVariantNumeric: "tabular-nums",
});

// 資材名と申請内容は、並ぶ幅が無ければ申請内容を資材名の下へ折り返す。
const mainLine = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  justifyContent: "space-between",
  columnGap: "6",
  rowGap: "0.5",
});

const nameStyle = css({
  flexGrow: "1",
  flexBasis: "56",
  textStyle: "body",
  fontWeight: "bold",
  overflowWrap: "anywhere",
});

// 折り返しても右端に寄せ、見出しの「申請内容」と同じ列に見せる。
const requestStyle = css({
  ml: "auto",
  textStyle: "body",
  textAlign: "end",
  overflowWrap: "anywhere",
});

const totalRow = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "baseline",
  columnGap: "4",
  pt: "3",
  textStyle: "body",
  breakInside: "avoid",
});

/** 請求書の明細のように、対象資材を1行ずつ並べ、件数を合計の位置に置く。 */
export function ReceiptItems({
  items,
  attachmentCount,
}: {
  items: ReceiptItem[];
  attachmentCount: number;
}) {
  return (
    <section>
      <div className={headRow}>
        <h3 className={headLabel}>対象資材</h3>
        {items.some((item) => item.request !== null) ? (
          <span className={headLabel} aria-hidden="true">
            申請内容
          </span>
        ) : null}
      </div>
      <ol className={css({ listStyle: "none", m: "0", p: "0" })}>
        {items.map((item, index) => (
          <li className={rowStyle} key={`${index}-${item.name}`}>
            <span className={numberStyle}>{index + 1}</span>
            <div className={mainLine}>
              <p className={nameStyle}>{item.name}</p>
              {item.request === null ? null : <p className={requestStyle}>{item.request}</p>}
            </div>
            {item.fields.length === 0 ? null : (
              <ReceiptFields fields={item.fields} className={css({ gridColumn: "2" })} />
            )}
          </li>
        ))}
      </ol>
      <p className={totalRow}>
        <span className={css({ color: "text.muted" })}>件数</span>
        <span className={css({ fontWeight: "bold" })}>
          対象資材 {items.length}件・添付資料 {attachmentCount}件
        </span>
      </p>
    </section>
  );
}

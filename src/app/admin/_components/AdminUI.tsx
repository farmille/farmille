import type { ReactNode } from "react";

import { css } from "../../../../styled-system/css";

const panelStyle = css({
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  p: "4",
  boxShadow: "shadow",
});

const panelHeadStyle = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  gap: "2",
  mb: "3",
});

const panelTitleStyle = css({
  fontSize: "lg",
  fontWeight: "700",
  m: "0",
});

const panelNoteStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  lineHeight: "1.6",
});

/** 運営管理の区画。見出し＋補足＋中身。 */
export function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className={panelStyle}>
      <div className={panelHeadStyle}>
        <h2 className={panelTitleStyle}>{title}</h2>
        {note === undefined ? null : <p className={panelNoteStyle}>{note}</p>}
      </div>
      {children}
    </section>
  );
}

const listStyle = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "0",
  m: "0",
  tab: { gridTemplateColumns: "180px 1fr" },
});

const termStyle = css({
  fontSize: "sm",
  fontWeight: "700",
  color: "text.muted",
  py: "2",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});

const valueStyle = css({
  fontSize: "md",
  color: "text.default",
  lineHeight: "1.6",
  m: "0",
  py: "2",
  wordBreak: "break-word",
  whiteSpace: "pre-wrap",
  tab: {
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
  },
});

export type DescriptionItem = {
  term: string;
  value: ReactNode;
};

/** 申請内容・資材の内部項目を並べる定義リスト。 */
export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className={listStyle}>
      {items.map((item) => (
        <div className={css({ display: "contents" })} key={item.term}>
          <dt className={termStyle}>{item.term}</dt>
          <dd className={valueStyle}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const emptyValueStyle = css({ color: "text.subtle" });

/** 未入力の内部項目は空白ではなく「未設定」と明示する。 */
export function OptionalValue({ value }: { value: string | null | undefined }) {
  if (value === null || value === undefined || value.trim().length === 0) {
    return <span className={emptyValueStyle}>未設定</span>;
  }

  return <>{value}</>;
}

export const adminFormStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

export const adminFormRowStyle = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  gap: "3",
});

export const adminActionsStyle = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2.5",
  mt: "1",
});

export const adminFieldGridStyle = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "3",
  tab: { gridTemplateColumns: "1fr 1fr" },
});

export const adminInlineNoteStyle = css({
  fontSize: "sm",
  color: "text.subtle",
  lineHeight: "1.6",
});

export const adminCodeStyle = css({
  display: "inline-block",
  fontFamily: "monospace",
  fontSize: "lg",
  fontWeight: "700",
  bg: "surface.page",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "input",
  px: "2.5",
  py: "1.5",
  userSelect: "all",
  wordBreak: "break-all",
});

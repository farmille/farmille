"use client";

import { createContext, useContext, type ReactNode } from "react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/Collapsible";
import type { PdfReadingField } from "@/lib/pdf-reading";

import { css } from "../../../../../../styled-system/css";

import type { ReportMarkField } from "./report-page-state";

const root = css({ mt: "1.5" });

const trigger = css({
  px: "2",
  py: "0.5",
  borderRadius: "pill",
  bg: "primary.soft",
  color: "text.brandOnSoft",
  fontSize: "xs",
});

const quotes = css({
  m: "0",
  mt: "1.5",
  px: "3",
  py: "2",
  listStyleType: "none",
  borderRadius: "input",
  bg: "surface.panel",
  textStyle: "supporting",
  color: "text.default",
  display: "grid",
  gap: "1",
});

const fieldName = css({ fontWeight: "bold" });

const MarksContext = createContext<ReadonlyMap<string, string>>(new Map());

/** 印を出す欄と引用。marks は、今の値が読み取りで入れた値と同じ欄だけを渡す。 */
export function ReportPdfReadingMarks({
  marks,
  children,
}: {
  marks: PdfReadingField[];
  children: ReactNode;
}) {
  return (
    <MarksContext value={new Map(marks.map(({ fieldKey, quote }) => [fieldKey, quote]))}>
      {children}
    </MarksContext>
  );
}

/** PDF読み取りで入った欄の印。開くと根拠の引用が見える。印のある欄が無ければ何も出さない。 */
export function ReportPdfReadingMark({ fields }: { fields: ReportMarkField[] }) {
  const marks = useContext(MarksContext);

  const found = fields.flatMap(({ key, label }) => {
    const quote = marks.get(key);

    return quote === undefined ? [] : [{ key, label, quote }];
  });

  if (found.length === 0) return null;

  return (
    <Collapsible className={root}>
      <CollapsibleTrigger variant="link" className={trigger}>
        PDF読み取り
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <ul className={quotes} aria-label="PDF読み取りの根拠">
          {found.map(({ key, label, quote }) => (
            <li key={key}>
              {label === undefined ? null : <span className={fieldName}>{label}：</span>}
              {quote.trim() === "" ? "根拠の引用はありません" : quote}
            </li>
          ))}
        </ul>
      </CollapsiblePanel>
    </Collapsible>
  );
}

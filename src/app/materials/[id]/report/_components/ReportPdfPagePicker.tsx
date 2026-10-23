"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";

import { css, cva } from "../../../../../../styled-system/css";

import { PDF_PAGE_LIMIT, renderPdfThumb } from "./report-page-images";

const grid = css({
  display: "grid",
  gridTemplateColumns: "[repeat(auto-fill, minmax(9rem, 1fr))]",
  gap: "3",
  p: "3.5",
  alignContent: "start",
});

const pageRecipe = cva({
  base: {
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    bg: "surface.card",
    p: "1.5",
    textAlign: "center",
    fontSize: "sm",
    cursor: "pointer",
    "& img": { display: "block", w: "full", borderRadius: "input" },
  },
  variants: {
    on: {
      true: { borderColor: "primary.600", bg: "primary.soft", color: "text.brandOnSoft", fontWeight: "bold" },
      false: {},
    },
  },
});

const placeholder = css({ display: "grid", placeItems: "center", h: "36", color: "text.muted" });

const bar = css({
  position: "sticky",
  bottom: "0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "3",
  px: "4",
  py: "3",
  bg: "surface.card",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  textStyle: "supporting",
});

/** 複数ページの PDF から、差し込むページを選ぶ。ページの絵を描いている途中でも選べる。 */
export function ReportPdfPagePicker({
  doc,
  name,
  onPick,
  onCancel,
}: {
  doc: PDFDocumentProxy | null;
  name: string;
  onPick: (pages: number[]) => void;
  onCancel: () => void;
}) {
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const count = doc === null ? 0 : Math.min(doc.numPages, PDF_PAGE_LIMIT);

  useEffect(() => {
    setThumbs({});
    setSelected(new Set());
    if (doc === null) return;
    let active = true;
    void (async () => {
      for (let page = 1; page <= Math.min(doc.numPages, PDF_PAGE_LIMIT); page++) {
        const canvas = await renderPdfThumb(doc, page);
        if (!active) return;
        const url = canvas.toDataURL("image/jpeg", 0.7);
        setThumbs((previous) => ({ ...previous, [page]: url }));
      }
    })();
    return () => {
      active = false;
    };
  }, [doc]);

  return (
    <Dialog
      open={doc !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      size="fullscreen"
      title={`使うページを選ぶ（全${doc?.numPages ?? 0}ページ）`}
      description={name}
      closeLabel="キャンセル"
    >
      <div className={grid}>
        {Array.from({ length: count }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            type="button"
            aria-pressed={selected.has(page)}
            className={pageRecipe({ on: selected.has(page) })}
            onClick={() =>
              setSelected((previous) => {
                const next = new Set(previous);
                if (next.has(page)) next.delete(page);
                else next.add(page);
                return next;
              })
            }
          >
            {thumbs[page] === undefined ? (
              <span className={placeholder}>読み込み中…</span>
            ) : (
              <img src={thumbs[page]} alt="" />
            )}
            {page}ページ{selected.has(page) ? "（使う）" : ""}
          </button>
        ))}
      </div>
      <div className={bar}>
        <span>{selected.size}ページを選んでいます</span>
        <Button
          variant="primary"
          size="sm"
          disabled={selected.size === 0}
          onClick={() => onPick([...selected].toSorted((a, b) => a - b))}
        >
          追加
        </Button>
      </div>
    </Dialog>
  );
}

"use client";

import { useReducer, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";

import { css, cva } from "../../../../../../styled-system/css";

import { renderPdfThumb } from "./report-page-images";

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
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
    "& img": { display: "block", w: "full", borderRadius: "input" },
  },
  variants: {
    on: {
      true: {
        borderColor: "primary.600",
        bg: "primary.soft",
        color: "text.brandOnSoft",
        fontWeight: "bold",
      },
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

type Thumbnail = { page: number; url: string };

/** 文書のページの絵を1ページ目から順に描いて渡す。文書があるときだけ置く。 */
function PdfThumbnailQueue({
  doc,
  onThumbnail,
}: {
  doc: PDFDocumentProxy;
  onThumbnail: (thumbnail: Thumbnail) => void;
}) {
  // 描画を1本に保ち、Strict Modeの再実行でも同じページを並行して描かない。
  const queue = useRef<{ stopped: boolean } | null>(null);
  useMountEffect(() => {
    const running = queue.current;
    if (running !== null) {
      running.stopped = false;
      return () => {
        running.stopped = true;
      };
    }
    const state = { stopped: false };
    queue.current = state;
    void (async () => {
      for (let page = 1; page <= doc.numPages; page++) {
        const canvas = await renderPdfThumb(doc, page);
        if (state.stopped) return;
        onThumbnail({ page, url: canvas.toDataURL("image/jpeg", 0.7) });
      }
    })();
    return () => {
      state.stopped = true;
    };
  });
  return null;
}

/** 複数ページの PDF から、差し込むページを選ぶ。ページの絵を描いている途中でも選べる。PDFごとに呼び出し側が作り直す（key）。 */
export function ReportPdfPagePicker({
  doc,
  name,
  max,
  onPick,
  onCancel,
}: {
  doc: PDFDocumentProxy | null;
  name: string;
  /** 選べるページ数（レポートの画像の残り）。 */
  max: number;
  onPick: (pages: number[]) => void;
  onCancel: () => void;
}) {
  const [thumbs, addThumbnail] = useReducer(
    (current: Record<number, string>, next: Thumbnail) => ({ ...current, [next.page]: next.url }),
    {},
  );
  const [selected, togglePage] = useReducer((previous: ReadonlySet<number>, page: number) => {
    const next = new Set(previous);
    if (next.has(page)) next.delete(page);
    else next.add(page);
    return next;
  }, new Set<number>());
  const count = doc === null ? 0 : doc.numPages;
  const full = selected.size >= max;

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
      {doc !== null && <PdfThumbnailQueue doc={doc} onThumbnail={addThumbnail} />}
      <div className={grid}>
        {Array.from({ length: count }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            type="button"
            aria-pressed={selected.has(page)}
            disabled={full && !selected.has(page)}
            className={pageRecipe({ on: selected.has(page) })}
            onClick={() => togglePage(page)}
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
        <span>
          {selected.size}ページを選んでいます（あと{Math.max(0, max - selected.size)}
          ページ選べます）
        </span>
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

"use client";

import { useEffect, useReducer, useRef } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPdfThumb } from "@/app/materials/[id]/report/_components/report-page-images";

export function useReportPdfThumbnails(doc: PDFDocumentProxy | null) {
  const [thumbs, addThumbnail] = useReducer(
    (current: Record<number, string>, next: { page: number; url: string }) => ({
      ...current,
      [next.page]: next.url,
    }),
    {},
  );
  // 同じ文書の描画を1本に保ち、Strict Modeの再実行でも同じページを並行して描かない。
  const queue = useRef<{ doc: PDFDocumentProxy; stopped: boolean } | null>(null);
  useEffect(() => {
    if (doc === null) return;
    const running = queue.current;
    if (running !== null && running.doc === doc) {
      running.stopped = false;
      return () => {
        running.stopped = true;
      };
    }
    const state = { doc, stopped: false };
    queue.current = state;
    void (async () => {
      for (let page = 1; page <= doc.numPages; page++) {
        const canvas = await renderPdfThumb(doc, page);
        if (state.stopped) return;
        addThumbnail({ page, url: canvas.toDataURL("image/jpeg", 0.7) });
      }
    })();
    return () => {
      state.stopped = true;
    };
  }, [doc]);
  return thumbs;
}

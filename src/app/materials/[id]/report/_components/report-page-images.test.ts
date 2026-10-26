import { afterEach, describe, expect, it } from "vitest";

import { fileTooLarge, fitCanvas, pdfTooLong } from "./report-page-images";
import { REPORT_PDF_LIMITS, REPORT_PHOTO_LIMITS } from "./report-page-state";

describe("差し込む資料の大きさとページ数", () => {
  it("PDF は20MBまで、写真は50MBまで読み込める", () => {
    const pdf = { name: "成績書.pdf", type: "application/pdf" };
    expect(fileTooLarge({ ...pdf, size: REPORT_PDF_LIMITS.bytes })).toBeNull();
    expect(fileTooLarge({ ...pdf, size: REPORT_PDF_LIMITS.bytes + 1 })).toBe(
      "「成績書.pdf」は20MBを超えているため、追加できません。",
    );
    const photo = { name: "畑.jpg", type: "image/jpeg" };
    expect(fileTooLarge({ ...photo, size: REPORT_PHOTO_LIMITS.bytes })).toBeNull();
    expect(fileTooLarge({ ...photo, size: REPORT_PHOTO_LIMITS.bytes + 1 })).toBe(
      "「畑.jpg」は50MBを超えているため、追加できません。",
    );
  });

  it("PDF は40ページまで差し込める", () => {
    expect(pdfTooLong("成績書.pdf", REPORT_PDF_LIMITS.pages)).toBeNull();
    expect(pdfTooLong("成績書.pdf", REPORT_PDF_LIMITS.pages + 1)).toContain(
      "「成績書.pdf」は40ページを超えているため、追加できません。",
    );
  });
});

describe("写真の取り込み", () => {
  const getContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext");
  afterEach(() => {
    if (getContext !== undefined)
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", getContext);
  });

  it("透過の画像は、白の紙に描いてから取り込む（JPEG にしても透明な部分が黒くならない）", () => {
    // happy-dom は描けないので、描く手順だけを控える
    const calls: string[] = [];
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => ({
        set fillStyle(color: string) {
          calls.push(`fill:${color}`);
        },
        fillRect: () => calls.push("fillRect"),
        drawImage: () => calls.push("drawImage"),
        imageSmoothingQuality: "high",
      }),
    });
    fitCanvas(document.createElement("canvas"), 400, 300);
    expect(calls).toEqual(["fill:white", "fillRect", "drawImage"]);
  });
});

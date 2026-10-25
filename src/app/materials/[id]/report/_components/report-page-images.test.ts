import { describe, expect, it } from "vitest";

import { fileTooLarge, pdfTooLong } from "./report-page-images";
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

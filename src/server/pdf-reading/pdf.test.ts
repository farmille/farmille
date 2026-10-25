// @vitest-environment node
import { describe, expect, it } from "vitest";

import { inspectPdf } from "./pdf";

function pdfWithPages(count: number, trailer = ""): Uint8Array {
  const pages = Array.from({ length: count }, (_, i) => i + 3);
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    `2 0 obj << /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(" ")}] /Count ${count} >> endobj`,
    ...pages.map(
      (id) => `${id} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 10 10] >> endobj`,
    ),
  ];
  return new TextEncoder().encode(
    `%PDF-1.4\n${objects.join("\n")}\ntrailer << /Root 1 0 R ${trailer}>>\n%%EOF\n`,
  );
}

describe("inspectPdf", () => {
  it("40ページまでの PDF はページ数を返す", async () => {
    expect(await inspectPdf(pdfWithPages(3))).toEqual({ ok: true, pages: 3 });
    expect(await inspectPdf(pdfWithPages(40))).toEqual({ ok: true, pages: 40 });
  });

  it("41ページ以上は止める", async () => {
    expect(await inspectPdf(pdfWithPages(41))).toEqual({ ok: false, error: "pdf_too_many_pages" });
  });

  it("20MB を超えるものは開かずに止める", async () => {
    const big = new Uint8Array(20 * 1024 * 1024 + 1);
    big.set(new TextEncoder().encode("%PDF-1.4"));
    expect(await inspectPdf(big)).toEqual({ ok: false, error: "pdf_too_large" });
  });

  it("PDF でないもの・暗号化されたもの・壊れたものは止める", async () => {
    const encrypted = pdfWithPages(1, "/Encrypt 9 0 R ");
    for (const bytes of [
      new TextEncoder().encode("<html>not a pdf</html>"),
      encrypted,
      new TextEncoder().encode("%PDF-1.4\nbroken"),
    ]) {
      expect(await inspectPdf(bytes)).toEqual({ ok: false, error: "pdf_invalid" });
    }
  });

  it("渡した bytes は検査の後もそのまま使える", async () => {
    const bytes = pdfWithPages(2);
    const length = bytes.byteLength;
    await inspectPdf(bytes);
    expect(bytes.byteLength).toBe(length);
  });
});

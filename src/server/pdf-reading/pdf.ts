import { REPORT_PDF_LIMITS } from "@/lib/usage-report";

export type PdfInspection =
  | { ok: true; pages: number }
  | { ok: false; error: "pdf_invalid" | "pdf_too_large" | "pdf_too_many_pages" };

const SIGNATURE = "%PDF-";

/** AI に送る前に、PDF であること・暗号化されていないこと・大きさとページ数の上限を確かめる。 */
export async function inspectPdf(bytes: Uint8Array): Promise<PdfInspection> {
  if (bytes.byteLength > REPORT_PDF_LIMITS.bytes) return { ok: false, error: "pdf_too_large" };
  const data = Buffer.from(bytes);

  if (!data.subarray(0, SIGNATURE.length).equals(Buffer.from(SIGNATURE)))
    return { ok: false, error: "pdf_invalid" };

  // 暗号化の辞書は trailer（圧縮されない）に置かれる。Anthropic は暗号化された PDF を受け付けない
  if (data.includes("/Encrypt")) return { ok: false, error: "pdf_invalid" };
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // pdf.js は渡した配列を作業用に引き取るので、AI に送る bytes とは別の写しを渡す
  const task = getDocument({ data: new Uint8Array(bytes), isEvalSupported: false });

  try {
    const { numPages } = await task.promise;

    return numPages > REPORT_PDF_LIMITS.pages
      ? { ok: false, error: "pdf_too_many_pages" }
      : { ok: true, pages: numPages };
  } catch (error) {
    console.error("[pdf-reading] PDF を開けない", error);

    return { ok: false, error: "pdf_invalid" };
  } finally {
    await task.destroy();
  }
}

import type { PDFDocumentProxy } from "pdfjs-dist";

import { createAuthBrowserClient } from "@/lib/auth/browser";

import { REPORT_PDF_LIMITS, REPORT_PHOTO_LIMITS } from "./report-page-state";

/** 差し込む画像の長い辺の上限。写真・PDF のページはこの大きさまで縮めてから扱う。 */
const MAX_SIDE = 2400;
/** 保存する画像の長い辺の上限。 */
const SAVE_SIDE = 1600;
/** PDF のページ選びに出す縮小画像の長い辺。 */
const THUMB_SIDE = 280;

export function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("画像を扱えませんでした。別のブラウザでお試しください。");
  return ctx;
}

export function fitCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  max = MAX_SIDE,
): HTMLCanvasElement {
  const scale = Math.min(1, max / Math.max(width, height));
  const canvas = makeCanvas(width * scale, height * scale);
  const ctx = context(canvas);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function rotateCanvas(source: HTMLCanvasElement, direction: 1 | -1): HTMLCanvasElement {
  const canvas = makeCanvas(source.height, source.width);
  const ctx = context(canvas);
  if (direction > 0) {
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
  } else {
    ctx.translate(0, canvas.height);
    ctx.rotate(-Math.PI / 2);
  }
  ctx.drawImage(source, 0, 0);
  return canvas;
}

export type Rect = { x: number; y: number; w: number; h: number };

export function cropCanvas(source: HTMLCanvasElement, rect: Rect): HTMLCanvasElement {
  const canvas = makeCanvas(rect.w, rect.h);
  context(canvas).drawImage(
    source,
    rect.x,
    rect.y,
    rect.w,
    rect.h,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

/** 塗りつぶしは画像そのものを塗る（上に重ねるのではないので、下の文字は残らない）。 */
export function redactCanvas(source: HTMLCanvasElement, rect: Rect): HTMLCanvasElement {
  const canvas = makeCanvas(source.width, source.height);
  const ctx = context(canvas);
  ctx.drawImage(source, 0, 0);
  ctx.fillStyle = "black";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  return canvas;
}

export async function canvasFromImageFile(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return fitCanvas(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

/** 保存済みの画像を、編集し直すために読み込む。 */
export async function canvasFromUrl(url: string): Promise<HTMLCanvasElement> {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error("保存した画像を読み込めませんでした。");
  return canvasFromImageFile(await response.blob());
}

type PickedFile = Pick<File, "name" | "size" | "type">;

export function isPdf(file: PickedFile): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export function isImage(file: PickedFile): boolean {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
}

export const megabytes = (bytes: number) => `${bytes / 1024 / 1024}MB`;

/** 読み込む前に大きさを確かめる。上限を超えていれば、追加できない理由を返す。 */
export function fileTooLarge(file: PickedFile): string | null {
  const limit = isPdf(file) ? REPORT_PDF_LIMITS.bytes : REPORT_PHOTO_LIMITS.bytes;
  return file.size > limit
    ? `「${file.name}」は${megabytes(limit)}を超えているため、追加できません。`
    : null;
}

/** 開いた PDF のページ数を確かめる。上限を超えていれば、追加できない理由を返す。 */
export function pdfTooLong(name: string, pages: number): string | null {
  return pages > REPORT_PDF_LIMITS.pages
    ? `「${name}」は${REPORT_PDF_LIMITS.pages}ページを超えているため、追加できません。使うページだけのPDFにすると追加できます。`
    : null;
}

export async function openPdf(file: File): Promise<PDFDocumentProxy> {
  // PDF を差し込むときだけ読み込む
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  return pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
}

// 同じ PDF のページを同時に描くと pdf.js が止まることがあるので、PDFごとに1つずつ順に描く
const pdfQueues = new WeakMap<PDFDocumentProxy, Promise<unknown>>();

export function renderPdfPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  max = MAX_SIDE,
): Promise<HTMLCanvasElement> {
  const previous = pdfQueues.get(doc) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() => drawPdfPage(doc, pageNumber, max));
  pdfQueues.set(doc, next);
  return next;
}

async function drawPdfPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  max = MAX_SIDE,
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: max / Math.max(base.width, base.height) });
  const canvas = makeCanvas(viewport.width, viewport.height);
  const ctx = context(canvas);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

export function renderPdfThumb(doc: PDFDocumentProxy, pageNumber: number) {
  return renderPdfPage(doc, pageNumber, THUMB_SIDE);
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob === null ? reject(new Error("画像を保存用に変換できませんでした。")) : resolve(blob),
      "image/jpeg",
      0.86,
    );
  });
}

/** 編集後の画像を report-media に保存し、公開URLを返す。元の写真・PDF は保存しない。 */
export async function uploadReportImage(
  canvas: HTMLCanvasElement,
  userId: string,
  reportId: string,
  imageId: string,
): Promise<string> {
  const blob = await canvasBlob(fitCanvas(canvas, canvas.width, canvas.height, SAVE_SIDE));
  const client = createAuthBrowserClient();
  const path = `${userId}/${reportId}/${imageId}.jpg`;
  const { error } = await client.storage
    .from("report-media")
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error !== null) throw new Error("画像を保存できませんでした。もう一度お試しください。");
  return client.storage.from("report-media").getPublicUrl(path).data.publicUrl;
}

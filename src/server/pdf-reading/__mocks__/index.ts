import { fn } from "storybook/test";

import { succeed } from "@/server/result";

// Storybook 専用モック。実モジュールと同じ runtime export を揃える。
// モッカーは元モジュールの id のまま配信するので、runtime import は @ エイリアスで書く。
type PdfReading = typeof import("@/server/pdf-reading/index");

export const getPdfReadingEntry = fn<PdfReading["getPdfReadingEntry"]>(async () =>
  succeed({ remaining: 8, siteKey: "storybook-site-key" }),
).mockName("getPdfReadingEntry");

export const readPdfIntoDraft = fn<PdfReading["readPdfIntoDraft"]>(async () => {
  throw new Error("Storybook では PDF読み取りを呼びません。");
}).mockName("readPdfIntoDraft");

export const createPdfReadingDeps = fn<PdfReading["createPdfReadingDeps"]>(async () => {
  throw new Error("Storybook では PDF読み取りを呼びません。");
}).mockName("createPdfReadingDeps");

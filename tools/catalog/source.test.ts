import { expect, it } from "vitest";
import { MATERIAL_LINK_GROUPS } from "../../src/lib/material-page-editor.ts";
import { sourceLinks, validateSource, type CatalogSource } from "./source.ts";

function source(): CatalogSource {
  return { 製品: [], タグマスター: [], 表示値: [], 出典: [], 根拠原文: [], 資材ページのリンク: [] };
}

const link = {
  product_id: "PRD-000001",
  区分: MATERIAL_LINK_GROUPS[0].label,
  資料名: "製品資料",
  URL: "https://example.com/document",
  資料種別: "資料",
  source_id: "SRC-1",
};

it("拡張子のない画像資料とクエリ付き画像を除く", () => {
  const input = source();
  input.資材ページのリンク = [
    { ...link, URL: "https://example.com/image.PNG?download=1" },
    { ...link, 資料種別: "画像（パッケージ・チラシ）" },
    { ...link, URL: "https://example.com/manual.pdf" },
  ];
  const result = sourceLinks(input);
  expect(result.excluded).toHaveLength(2);
  expect(result.links.get(link.product_id)?.map((row) => row.url)).toEqual([
    "https://example.com/manual.pdf",
  ]);
});

it("URLの空白表記を統一し、重複資料の具体的な題名を残す", () => {
  const input = source();
  input.資材ページのリンク = [
    { ...link, URL: "https://example.com/my file.pdf", 資料名: "タイトルなし" },
    { ...link, URL: "https://example.com/my%20file.pdf" },
  ];
  expect(sourceLinks(input).links.get(link.product_id)).toHaveLength(1);
  expect(sourceLinks(input).links.get(link.product_id)?.[0].title).toBe("製品資料");
});

it("同じURLで分類が競合する場合は判断を要求する", () => {
  const input = source();
  input.資材ページのリンク = [link, { ...link, 区分: MATERIAL_LINK_GROUPS[1].label }];
  expect(() => sourceLinks(input)).toThrow("分類が異なります");
});

it("参照する製品のない資料を受け付けない", () => {
  const input = source();
  input.資材ページのリンク = [link];
  input.出典 = [{ source_id: "SRC-1", URL: link.URL, 資料名: link.資料名 }];
  expect(() => validateSource(input)).toThrow("参照先の製品");
});

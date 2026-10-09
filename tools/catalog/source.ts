import { createHash } from "node:crypto";
import * as v from "valibot";
import { MATERIAL_LINK_GROUPS } from "../../src/lib/material-page-editor.ts";

const nonempty = v.pipe(v.string(), v.trim(), v.minLength(1));
const nullableText = v.nullable(v.string());
const productId = v.pipe(v.string(), v.regex(/^PRD-\d{6}$/));
const order = v.pipe(
  v.union([v.string(), v.number()]),
  v.transform(Number),
  v.integer(),
  v.minValue(0),
);
const product = v.object({
  product_id: productId,
  表示製品名: nonempty,
  情報掲載責任会社: nonempty,
  掲載判定: v.picklist(["掲載可", "保留", "除外", "要判断"]),
  非表示フラグ: v.boolean(),
  正式名称: nullableText,
  読み: nullableText,
  別名: nullableText,
  容器形状: nullableText,
});
const fieldCode = v.picklist([
  "target_crop",
  "expected_effect",
  "material_category",
  "application_method",
  "main_ingredient",
]);
export const SourceSchema = v.object({
  製品: v.array(product),
  タグマスター: v.array(
    v.object({
      tag_id: nonempty,
      field_code: fieldCode,
      タグ名: nonempty,
      表示順: order,
      階層区分: nullableText,
      親tag_id: nullableText,
      同義語: nullableText,
    }),
  ),
  表示値: v.array(
    v.object({
      value_id: nonempty,
      product_id: productId,
      field_code: fieldCode,
      tag_id: nullableText,
      確定表示値: nonempty,
      表示順: order,
      状態: nonempty,
      "判断理由・詳細": nullableText,
    }),
  ),
  出典: v.array(v.object({ source_id: nonempty, URL: nullableText, 資料名: nullableText })),
  根拠原文: v.array(
    v.object({
      evidence_id: nonempty,
      product_id: productId,
      field_code: nonempty,
      原文: v.string(),
      source_id: nullableText,
    }),
  ),
  資材ページのリンク: v.array(
    v.object({
      product_id: productId,
      区分: nonempty,
      資料名: nonempty,
      URL: nonempty,
      資料種別: nonempty,
      source_id: nonempty,
    }),
  ),
});
export type CatalogSource = v.InferOutput<typeof SourceSchema>;
export type SourceProduct = CatalogSource["製品"][number];
export type SourceTag = CatalogSource["タグマスター"][number];

export const ProductMapSchema = v.record(productId, v.pipe(v.string(), v.uuid()));
export const LinkSchema = v.object({
  group_name: v.picklist(["overview", "safety", "technical", "public_trial", "other_trial"]),
  title: v.pipe(nonempty, v.maxLength(500)),
  url: v.pipe(v.string(), v.url(), v.regex(/^https?:\/\//), v.maxLength(4000)),
  trial_crops: v.string(),
  trial_summary: v.string(),
  trial_institution: v.string(),
  trial_year: v.nullable(v.number()),
  trial_page_count: v.nullable(v.number()),
});
export type CatalogLink = v.InferOutput<typeof LinkSchema>;

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function catalogId(key: string): string {
  const namespace = Buffer.from("6ba7b8119dad11d180b400c04fd430c8", "hex");
  const digest = createHash("sha1")
    .update(namespace)
    .update(`https://farmille.com/catalog/20260915/${key}`)
    .digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const hex = digest.toString("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function containerType(value: string | null): number | null {
  if (value === null || value.trim() === "" || value === "未分類") return null;
  const match = /^(\d+)\s+/.exec(value);
  if (!match) throw new Error(`容器分類を確認してください：${value}`);
  return v.parse(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(10)), Number(match[1]));
}

export function sourceLinks(source: CatalogSource) {
  const links = new Map<string, CatalogLink[]>();
  const excluded: { productId: string; url: string }[] = [];
  for (const row of source.資材ページのリンク) {
    const url = new URL(row.URL.trim());
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error(`資料URLの形式を確認してください：${row.URL}`);
    if (
      /\.(?:jpe?g|png|gif|webp|svg|avif|bmp|tiff?)$/i.test(url.pathname) ||
      row.資料種別 === "画像（パッケージ・チラシ）"
    ) {
      excluded.push({ productId: row.product_id, url: url.href });
      continue;
    }
    const group = MATERIAL_LINK_GROUPS.find((item) => item.label === row.区分);
    if (!group) throw new Error(`資料の分類が不明です：${row.区分}`);
    const link = v.parse(LinkSchema, {
      group_name: group.value,
      title: row.資料名,
      url: url.href,
      trial_crops: "",
      trial_summary: "",
      trial_institution: "",
      trial_year: null,
      trial_page_count: null,
    });
    const current = links.get(row.product_id) ?? [];
    const duplicate = current.find((item) => item.url === link.url);
    if (duplicate) {
      if (duplicate.group_name !== link.group_name)
        throw new Error(`同じ資料URLの分類が異なります：${link.url}`);
      if (duplicate.title === "タイトルなし") duplicate.title = link.title;
      else if (link.title !== "タイトルなし" && duplicate.title !== link.title)
        throw new Error(`同じ資料URLに異なる題名があります：${link.url}`);
    } else current.push(link);
    links.set(row.product_id, current);
  }
  return { links, excluded };
}

export function validateSource(source: CatalogSource): CatalogSource {
  const products = new Set(source.製品.map((row) => row.product_id));
  if (products.size !== source.製品.length) throw new Error("製品IDが重複しています。");
  const tags = new Set(source.タグマスター.map((row) => row.tag_id));
  if (tags.size !== source.タグマスター.length) throw new Error("タグIDが重複しています。");
  const sources = new Set(source.出典.map((row) => row.source_id));
  if (sources.size !== source.出典.length) throw new Error("出典IDが重複しています。");
  if (new Set(source.根拠原文.map((row) => row.evidence_id)).size !== source.根拠原文.length)
    throw new Error("根拠原文のIDが重複しています。");
  for (const row of [...source.根拠原文, ...source.資材ページのリンク]) {
    if (row.source_id && !sources.has(row.source_id))
      throw new Error(`参照先の出典がありません：${row.source_id}`);
  }
  for (const row of source.製品) {
    if ((row.掲載判定 === "掲載可") === row.非表示フラグ)
      throw new Error(`掲載判定と非表示フラグが矛盾しています：${row.product_id}`);
  }
  for (const row of [...source.表示値, ...source.資材ページのリンク, ...source.根拠原文]) {
    if (!products.has(row.product_id))
      throw new Error(`参照先の製品がありません：${row.product_id}`);
  }
  for (const row of source.表示値) {
    if (row.状態 !== "現行レビュー反映値" || row.field_code === "main_ingredient") continue;
    if (!row.tag_id || !tags.has(row.tag_id))
      throw new Error(`確定値のタグがありません：${row.value_id}`);
  }
  return source;
}

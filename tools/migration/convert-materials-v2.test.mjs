import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  KNOWN_BROKEN_IMAGE_URLS,
  normalizeDataset,
  parseCsv,
  parseLegacySeedSql,
  parseTableDump,
  parseTagSeed,
  renderSeedSql,
} from "./convert-materials-v2.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_SQL = path.join(
  TEST_DIR,
  "legacy/migrations-v1/20260526000003_seed_products_from_ryosei_export.sql",
);
const TAG_SEED_SQL = path.join(
  TEST_DIR,
  "../../supabase/migrations/20260726121253_seed_masters.sql",
);

function loadNormalized() {
  const rawDataset = parseLegacySeedSql(fs.readFileSync(SOURCE_SQL, "utf8"), "test source");
  const tags = parseTagSeed(fs.readFileSync(TAG_SEED_SQL, "utf8"));
  return normalizeDataset(rawDataset, tags);
}

test("旧seed SQLから全レコードを欠落なく抽出する", () => {
  const normalized = loadNormalized();

  assert.deepEqual(normalized.counts, {
    source_product_rows: 15,
    duplicate_product_rows: 1,
    unique_materials: 14,
    source_product_images: 13,
    excluded_product_images: 3,
    product_images: 10,
    application_recipes: 98,
    material_product_type_links: 14,
    material_crop_links: 7,
    material_effect_links: 0,
    material_search_tag_links: 0,
  });
  assert.deepEqual(normalized.duplicate_products, [
    {
      name: "BIOZ Nephrite",
      manufacturer_name: "ICL JAPAN",
      source_rows: [6, 7],
      handling: "旧SQLとv2の一意キーに従い、後の行で統合",
    },
  ]);
  assert.deepEqual(
    normalized.excluded_images.map((image) => image.url).toSorted(),
    [...KNOWN_BROKEN_IMAGE_URLS].toSorted(),
  );
  assert.ok(
    normalized.materials.every((material) =>
      material.images.every((image) => !KNOWN_BROKEN_IMAGE_URLS.has(image.url)),
    ),
  );
});

test("一次情報、施用レシピ、画像enum、正規化分類をv2へ変換する", () => {
  const normalized = loadNormalized();
  const material = normalized.materials.find((candidate) => candidate.name === "BIOZ Moonstone");

  assert.ok(material);
  assert.equal(material.manufacturer_name, "ICL JAPAN");
  assert.equal(material.main_components, material.legacy.primary_compound);
  assert.equal(material.seller_id, null);
  assert.match(material.usage_text, /^概要：/);
  assert.match(material.usage_text, /・作物：水稲／目的：.+／使い方：/);
  assert.equal(material.images[0].image_type, "package");
  assert.deepEqual(material.product_types, [
    { name: "バイオスティミュラント", source_value: "バイオスティミュラント" },
  ]);
  assert.ok(material.target_crops.some((crop) => crop.name === "水稲"));
});

test("生成SQLは再実行可能なupsertと関連データ置換を含む", () => {
  const sql = renderSeedSql(loadNormalized());

  assert.match(sql, /on conflict \(name, manufacturer_name\) do update set/);
  assert.match(sql, /delete from public\.material_product_types/);
  assert.match(sql, /delete from public\.material_crops/);
  assert.match(sql, /insert into public\.product_types/);
  assert.match(sql, /insert into public\.material_product_types/);
  assert.match(sql, /delete from public\.material_images/);
  for (const url of KNOWN_BROKEN_IMAGE_URLS) {
    assert.ok(!sql.includes(url));
  }
  assert.match(sql, /raise exception '資材件数が一致しません/);
  assert.match(sql, /source_product_rows/);
  assert.match(sql, /commit;/);
});

test("CSVは引用符、カンマ、改行、NULLを保持して解析する", () => {
  const rows = parseCsv('\uFEFFid,name,note,nullable\r\n1,"資材, A","1行目\n2行目",\r\n');

  assert.deepEqual(rows, [
    {
      id: "1",
      name: "資材, A",
      note: "1行目\n2行目",
      nullable: null,
    },
  ]);
});

test("JSON／CSVテーブルdumpは外部キーからメーカーと関連データを解決する", () => {
  const rawDataset = parseTableDump({
    maker_profiles: [{ user_id: "maker-1", company_name: "メーカーA" }],
    product_types: [{ id: "type-1", name: "微生物資材" }],
    products: [
      {
        id: "product-1",
        maker_id: "maker-1",
        product_type_id: "type-1",
        name: "資材A",
        general_purpose: "生育を支援する",
      },
    ],
    product_images: [
      {
        product_id: "product-1",
        url: "https://example.com/a.png",
        image_type: "product_packaging",
        order: "0",
      },
    ],
    product_application_recipes: [
      {
        product_id: "product-1",
        crop_name: "水稲",
        application_method: "葉面散布",
        sort_order: "0",
      },
    ],
  });
  const normalized = normalizeDataset(rawDataset, [{ category: "type", name: "微生物資材" }]);

  assert.equal(normalized.materials[0].manufacturer_name, "メーカーA");
  assert.equal(normalized.materials[0].images[0].image_type, "package");
  assert.deepEqual(normalized.materials[0].product_types, [
    { name: "微生物資材", source_value: "微生物資材" },
  ]);
  assert.match(normalized.materials[0].usage_text, /・作物：水稲/);
});

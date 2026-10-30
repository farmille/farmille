import { describe, expect, it } from "vitest";
import { planCatalog, valueHash } from "./plan.ts";
import { FieldNameSchema, type CatalogSnapshot, type LiveMaterial } from "./snapshot.ts";
import { catalogId, type CatalogSource } from "./source.ts";
import { applySql } from "./sql.ts";

const productId = "PRD-000001";
const id = catalogId(productId);
const productMap = new Map([[productId, id]]);

function source(): CatalogSource {
  return {
    製品: [
      {
        product_id: productId,
        表示製品名: "検証資材",
        情報掲載責任会社: "検証メーカー",
        掲載判定: "掲載可",
        非表示フラグ: false,
        正式名称: "検証資材正式名",
        読み: "ケンショウシザイ",
        別名: "TEST",
        容器形状: "2 ボトル",
      },
    ],
    タグマスター: [],
    表示値: [],
    出典: [],
    根拠原文: [],
    資材ページのリンク: [
      {
        product_id: productId,
        区分: "概要（製品説明・パンフレット・画像）",
        資料名: "資料",
        URL: "https://example.com/trial",
        資料種別: "資料",
        source_id: "SRC-1",
      },
    ],
  };
}

function emptySnapshot(): CatalogSnapshot {
  return {
    guard: "0".repeat(64),
    materials: [],
    product_map: [],
    baselines: [],
    crop_groups: [],
    crops: [],
    effects: [],
    ingredient_categories: [],
  };
}

function importedSnapshot(): CatalogSnapshot {
  const snapshot = emptySnapshot();
  const plan = planCatalog(source(), snapshot, productMap, []);
  const material = plan.materials[0];

  const live: LiveMaterial = {
    id,
    fields: structuredClone(material.fields),
    published_page_version_id: catalogId("published"),
    content_revision: 1,
    seller_id: null,
    manufacturer_verified_at: null,
    protected_references: 1,
    working_version: null,
  };

  snapshot.materials.push(live);
  snapshot.product_map.push({ source_product_id: productId, material_id: id });
  snapshot.baselines = FieldNameSchema.options.map((field) => ({
    material_id: id,
    field_name: field,
    source_sha256: valueHash(material.fields[field]),
  }));

  return snapshot;
}

describe("カタログ再取り込み", () => {
  it("同じ資料の再取り込みでは公開版を増やさない", () => {
    const plan = planCatalog(source(), importedSnapshot(), productMap, []);
    expect(plan.conflicts).toEqual([]);
    expect(plan.materials[0].changed).toEqual([]);
    expect(applySql(plan, source())).not.toContain("insert into public.material_page_versions");
  });
  it("メーカーが削除した資料を復活させない", () => {
    const snapshot = importedSnapshot();
    snapshot.materials[0].fields.links = [];
    const plan = planCatalog(source(), snapshot, productMap, []);
    expect(plan.conflicts).toEqual([]);
    expect(plan.materials[0].fields.links).toEqual([]);
    expect(plan.materials[0].changed).toEqual([]);
  });
  it("メーカーと取り込み元が同じ項目を変更したらSQLを生成しない", () => {
    const snapshot = importedSnapshot();
    snapshot.materials[0].fields.links = [];
    const incoming = source();
    incoming.資材ページのリンク[0].資料名 = "改訂資料";
    const plan = planCatalog(incoming, snapshot, productMap, []);
    expect(plan.conflicts).toHaveLength(1);
    expect(() => applySql(plan, incoming)).toThrow("未解決");
    const conflict = plan.conflicts[0];

    const kept = planCatalog(incoming, snapshot, productMap, [
      { ...conflict, action: "keep_current" },
    ]);

    expect(kept.conflicts).toEqual([]);
    expect(kept.materials[0].fields.links).toEqual([]);
    expect(kept.materials[0].sourceFields.links[0].title).toBe("改訂資料");
  });
  it("現在値が前回と同じなら元資料の改訂を反映する", () => {
    const incoming = source();
    incoming.資材ページのリンク[0].資料名 = "改訂資料";
    const plan = planCatalog(incoming, importedSnapshot(), productMap, []);
    expect(plan.conflicts).toEqual([]);
    expect(plan.materials[0].changed).toEqual(["links"]);
    expect(plan.materials[0].fields.links[0].title).toBe("改訂資料");
  });
  it("メーカー原稿がある場合は公開版の変更を止める", () => {
    const snapshot = importedSnapshot();
    snapshot.materials[0].working_version = {
      id: catalogId("draft"),
      status: "draft",
      base_revision: 1,
    };
    const incoming = source();
    incoming.製品[0].表示製品名 = "改訂資材";
    const plan = planCatalog(incoming, snapshot, productMap, []);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].reason).toContain("メーカー原稿");
    const conflict = plan.conflicts[0];
    expect(
      planCatalog(incoming, snapshot, productMap, [{ ...conflict, action: "take_source" }])
        .conflicts,
    ).toHaveLength(1);
  });
  it("古いハッシュの解決指定を受け付けない", () => {
    const snapshot = importedSnapshot();
    snapshot.baselines = [];
    snapshot.materials[0].fields.name = "運営による変更";
    const plan = planCatalog(source(), snapshot, productMap, []);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].reason).toContain("初回");
    const conflict = plan.conflicts[0];
    snapshot.materials[0].fields.name = "再変更";
    expect(() =>
      planCatalog(source(), snapshot, productMap, [{ ...conflict, action: "take_source" }]),
    ).toThrow("古く");
  });
  it("投稿や原稿を持つUUIDの対応先を変更しない", () => {
    const snapshot = importedSnapshot();
    const plan = planCatalog(source(), snapshot, new Map([[productId, catalogId("other")]]), []);
    expect(plan.conflicts[0].reason).toContain("旧UUID");
    expect(plan.productMap.get(productId)).toBe(id);
  });
  it("資材オーナー権限または確認記録のあるメーカー名は変更しない", () => {
    const snapshot = importedSnapshot();
    snapshot.materials[0].manufacturer_verified_at = "2026-10-10T00:00:00Z";
    const incoming = source();
    incoming.製品[0].情報掲載責任会社 = "別のメーカー";
    const plan = planCatalog(incoming, snapshot, productMap, []);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].reason).toContain("メーカー確認");
  });
});

import { describe, expect, it } from "vitest";
import { catalogId, type CatalogSource, type SourceTag } from "./source.ts";
import type { CatalogSnapshot } from "./snapshot.ts";
import { sourceTaxonomy } from "./taxonomy.ts";

function tag(input: Partial<SourceTag> & Pick<SourceTag, "tag_id" | "タグ名">): SourceTag {
  return {
    field_code: "target_crop",
    表示順: 1,
    階層区分: "個別作目",
    親tag_id: "TAG-MIDDLE",
    同義語: null,
    ...input,
  };
}

function source(crops: SourceTag[]): CatalogSource {
  return {
    製品: [],
    タグマスター: [
      tag({ tag_id: "TAG-MAJOR", タグ名: "野菜", 階層区分: "大分類", 親tag_id: null }),
      tag({ tag_id: "TAG-MIDDLE", タグ名: "根菜類", 階層区分: "中分類", 親tag_id: "TAG-MAJOR" }),
      ...crops,
    ],
    表示値: [],
    出典: [],
    根拠原文: [],
    資材ページのリンク: [],
  };
}

function snapshot(crops: CatalogSnapshot["crops"] = []): CatalogSnapshot {
  return {
    guard: "0".repeat(64),
    materials: [],
    product_map: [],
    baselines: [],
    crop_groups: [],
    crops,
    effects: [],
    ingredient_categories: [],
  };
}

describe("作目の別名", () => {
  it("括弧の中が別名の作目は、括弧の前を名前にし、括弧の中を同義語に加える", () => {
    const { crops } = sourceTaxonomy(
      source([
        tag({
          tag_id: "TAG-HORSERADISH",
          タグ名: "ホースラディッシュ（西洋わさび）",
          同義語: "わさび大根",
        }),
      ]),
      snapshot(),
    );

    expect(crops).toEqual([
      expect.objectContaining({
        name: "ホースラディッシュ",
        aliases: ["西洋わさび", "わさび大根"],
      }),
    ]);
  });

  it("区別に要る括弧は名前に残す", () => {
    const { crops } = sourceTaxonomy(
      source([tag({ tag_id: "TAG-LILY", タグ名: "ユリ（切花）" })]),
      snapshot(),
    );

    expect(crops).toEqual([expect.objectContaining({ name: "ユリ（切花）", aliases: [] })]);
  });

  it("名前を分けた後のDBの作目にも対応し、新しい作目を作らない", () => {
    const existingId = "00000000-0000-4000-8000-000000000999";
    const { crops } = sourceTaxonomy(
      source([tag({ tag_id: "TAG-HORSERADISH", タグ名: "ホースラディッシュ（西洋わさび）" })]),
      snapshot([
        {
          id: existingId,
          name: "ホースラディッシュ",
          group_id: catalogId("TAG-MIDDLE"),
          aliases: ["西洋わさび"],
          sort_order: 1,
          is_active: true,
        },
      ]),
    );

    expect(crops).toEqual([
      expect.objectContaining({
        id: existingId,
        name: "ホースラディッシュ",
        aliases: ["西洋わさび"],
      }),
    ]);
  });
});

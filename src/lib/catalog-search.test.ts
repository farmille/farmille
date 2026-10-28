import type { CatalogSearch } from "@/server/queries/catalog-search";
import { describe, expect, it } from "vitest";
import { cropAncestors, cropEvidence, filterCatalog } from "./catalog-search";

const base: CatalogSearch["materials"][number] = {
  id: "direct",
  name: "葉菜資材",
  manufacturer_name: "農業社",
  description: null,
  avg_rating: null,
  review_count: 0,
  created_at: "2026-09-01",
  imageUrl: null,
  container_type_id: null,
  official_name: null,
  name_reading: null,
  material_name_aliases: [],
  manufacturer_verified_at: null,
  material_crops: [{ crop_id: "onion" }],
  material_crop_groups: [],
  material_effects: [{ effect_id: "growth" }],
  material_ingredient_categories: [],
  material_search_tags: [],
  material_application_methods: [{ method: "葉面散布" }],
};
const catalog: CatalogSearch = {
  materials: [
    base,
    {
      ...base,
      id: "broad",
      material_crops: [],
      material_crop_groups: [{ crop_group_id: "major" }],
    },
  ],
  crops: [
    {
      id: "onion",
      name: "たまねぎ",
      aliases: ["玉ねぎ"],
      sort_order: 1,
      groupId: "middle",
      groupName: "鱗茎類",
      groupSortOrder: 2,
    },
  ],
  groups: [
    { id: "major", name: "野菜類", parent_id: null, hierarchy_level: "major", sort_order: 1 },
    { id: "middle", name: "鱗茎類", parent_id: "major", hierarchy_level: "middle", sort_order: 2 },
  ],
  effects: [],
  counts: [],
};

describe("作物階層を使った資材検索", () => {
  it("個別作目と上位分類の根拠を分けて返す", () => {
    const filters = [{ category: "crop", id: "onion" }] satisfies Parameters<
      typeof cropEvidence
    >[1];
    expect(cropEvidence(base, filters, catalog)).toEqual({ direct: ["たまねぎ"], groups: [] });
    expect(cropEvidence(catalog.materials[1], filters, catalog)).toEqual({
      direct: [],
      groups: ["野菜類"],
    });
    expect(filterCatalog(catalog, filters, [], []).map((row) => row.id)).toEqual([
      "direct",
      "broad",
    ]);
  });
  it("分類検索では下位作目の資材も含める", () => {
    expect(filterCatalog(catalog, [{ category: "crop_group", id: "major" }], [], [])).toHaveLength(
      2,
    );
  });
  it("同分類内はOR、作物と効果の組み合わせはANDで絞る", () => {
    expect(
      filterCatalog(
        catalog,
        [
          { category: "crop", id: "missing" },
          { category: "crop", id: "onion" },
          { category: "effect", id: "growth" },
        ],
        [],
        [],
      ),
    ).toHaveLength(2);
    expect(
      filterCatalog(
        catalog,
        [
          { category: "crop", id: "onion" },
          { category: "effect", id: "missing" },
        ],
        [],
        [],
      ),
    ).toHaveLength(0);
  });
  it("循環した分類は明確に失敗する", () => {
    expect(() => cropAncestors("major", [{ ...catalog.groups[0], parent_id: "major" }])).toThrow(
      "循環",
    );
  });
});

it("資材ジャンルは同じ分類内をOR、作目との間をANDで絞る", () => {
  const withGenre = {
    ...catalog,
    materials: [
      {
        ...base,
        material_ingredient_categories: [
          { ingredient_category_id: "seaweed", ingredient_categories: { name: "海藻" } },
        ],
      },
      catalog.materials[1],
    ],
  };
  expect(
    filterCatalog(
      withGenre,
      [
        { category: "genre", id: "missing" },
        { category: "genre", id: "seaweed" },
        { category: "crop", id: "onion" },
      ],
      [],
      [],
    ).map((row) => row.id),
  ).toEqual(["direct"]);
  expect(
    filterCatalog(
      withGenre,
      [
        { category: "genre", id: "seaweed" },
        { category: "crop", id: "missing" },
      ],
      [],
      [],
    ),
  ).toEqual([]);
});

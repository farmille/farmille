import type { SearchCatalog } from "@/lib/material-search";
import type { CatalogSearch } from "@/server/queries/catalog-search";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const ONION = id(2);
const TOMATO = id(12);
const VEGETABLES = id(3);
const BULBS = id(4);
const FRUIT_VEGETABLES = id(13);
const NUTRIENT = id(5);
const HEAT = id(8);
const MICROBE = id(6);
const SEAWEED = id(14);

const material = (
  n: number,
  fields: Partial<CatalogSearch["materials"][number]>,
): CatalogSearch["materials"][number] => ({
  id: id(n),
  name: "植物活力液",
  manufacturer_name: "農業資材株式会社",
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
  material_crops: [],
  material_crop_groups: [],
  material_effects: [],
  material_ingredient_categories: [],
  material_search_tags: [],
  material_application_methods: [],
  ...fields,
});

export const storyCatalog: CatalogSearch = {
  materials: [
    material(1, {
      material_crops: [{ crop_id: ONION }],
      material_crop_groups: [{ crop_group_id: BULBS }],
      material_effects: [{ effect_id: NUTRIENT }],
      material_ingredient_categories: [
        { ingredient_category_id: MICROBE, ingredient_categories: { name: "微生物資材" } },
      ],
    }),
    material(21, {
      name: "根張りエース",
      manufacturer_name: "みどり化成工業",
      description:
        "定植前の土壌に混和して使う微生物資材。根の伸長を促し、活着を早める。トマト・きゅうりなど果菜類の育苗期から使える。",
      avg_rating: 4.3,
      review_count: 18,
      imageUrl: "/images/container-shapes/5.png",
      material_crops: [{ crop_id: TOMATO }],
      material_crop_groups: [{ crop_group_id: FRUIT_VEGETABLES }],
      material_effects: [{ effect_id: NUTRIENT }, { effect_id: HEAT }],
      material_ingredient_categories: [
        { ingredient_category_id: MICROBE, ingredient_categories: { name: "微生物資材" } },
        {
          ingredient_category_id: SEAWEED,
          ingredient_categories: {
            name: "海藻・海藻抽出物（アルギン酸・ラミナリンなどを含むもの）",
          },
        },
      ],
    }),
    material(22, {
      name: "海藻アミノ 有機一番",
      manufacturer_name: "三陸水産資材",
      avg_rating: 3.6,
      review_count: 5,
      material_crop_groups: [{ crop_group_id: VEGETABLES }],
      material_ingredient_categories: [
        {
          ingredient_category_id: SEAWEED,
          ingredient_categories: {
            name: "海藻・海藻抽出物（アルギン酸・ラミナリンなどを含むもの）",
          },
        },
      ],
    }),
  ],
  crops: [
    {
      id: ONION,
      name: "たまねぎ",
      aliases: ["玉ねぎ"],
      sort_order: 1,
      groupId: BULBS,
      groupName: "鱗茎類",
      groupSortOrder: 1,
    },
    {
      id: TOMATO,
      name: "トマト",
      aliases: ["ミニトマト"],
      sort_order: 2,
      groupId: FRUIT_VEGETABLES,
      groupName: "果菜類",
      groupSortOrder: 2,
    },
  ],
  groups: [
    { id: VEGETABLES, name: "野菜類", parent_id: null, hierarchy_level: "major", sort_order: 1 },
    { id: BULBS, name: "鱗茎類", parent_id: VEGETABLES, hierarchy_level: "middle", sort_order: 1 },
    {
      id: FRUIT_VEGETABLES,
      name: "果菜類",
      parent_id: VEGETABLES,
      hierarchy_level: "middle",
      sort_order: 2,
    },
  ],
  effects: [
    {
      id: NUTRIENT,
      name: "養分吸収の改善",
      sort_order: 1,
      categoryId: id(7),
      categoryName: "栄養利用の効率改善",
      categorySortOrder: 1,
    },
    {
      id: HEAT,
      name: "耐暑性改善",
      sort_order: 1,
      categoryId: id(9),
      categoryName: "非生物的ストレス耐性の改善",
      categorySortOrder: 2,
    },
  ],
  counts: [
    { material_id: id(1), report_count: 0, saved_count: 0 },
    { material_id: id(21), report_count: 4, saved_count: 27 },
    { material_id: id(22), report_count: 1, saved_count: 3 },
  ],
};

export const storySearchCatalog: SearchCatalog = {
  filters: [
    { category: "crop", id: ONION, name: "たまねぎ", aliases: ["玉ねぎ"], sort_order: 1 },
    { category: "crop", id: TOMATO, name: "トマト", aliases: ["ミニトマト"], sort_order: 2 },
    { category: "crop_group", id: BULBS, name: "鱗茎類", aliases: [], sort_order: 1 },
    { category: "effect", id: NUTRIENT, name: "養分吸収の改善", aliases: [], sort_order: 1 },
    { category: "effect", id: HEAT, name: "耐暑性改善", aliases: ["暑さ対策"], sort_order: 2 },
    { category: "genre", id: MICROBE, name: "微生物資材", aliases: [], sort_order: 1 },
    {
      category: "genre",
      id: SEAWEED,
      name: "海藻・海藻抽出物（アルギン酸・ラミナリンなどを含むもの）",
      aliases: [],
      sort_order: 2,
    },
    { category: "method", id: "葉面散布", name: "葉面散布", aliases: [], sort_order: 1 },
    { category: "method", id: "土壌混和", name: "土壌混和", aliases: [], sort_order: 2 },
  ],
  makers: ["みどり化成工業", "三陸水産資材", "農業資材株式会社"],
  materials: ["根張りエース", "植物活力液", "海藻アミノ 有機一番"].map((name) => ({
    name,
    aliases: [],
  })),
};

export const storyIds = { onion: ONION, tomato: TOMATO, nutrient: NUTRIENT, microbe: MICROBE };

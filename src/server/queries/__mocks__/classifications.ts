import { fn } from "storybook/test";
export const listSearchFiltersByRefs = fn<
  typeof import("@/server/queries/classifications").listSearchFiltersByRefs
>(async () => ({
  ok: true,
  data: [
    {
      category: "method",
      id: "11111111-1111-4111-8111-111111111111",
      aliases: [],
      name: "葉面散布",
      sort_order: 3,
    },
  ],
})).mockName("listSearchFiltersByRefs");
export const listClassificationOptions = fn<
  typeof import("@/server/queries/classifications").listClassificationOptions
>(async () => ({
  ok: true,
  data: {
    compositionTypes: [{ id: "11111111-1111-4111-8111-111111111111", name: "液体", sort_order: 3 }],
    crops: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "トマト",
        sort_order: 3,
        aliases: [],
        groupId: "11111111-1111-4111-8111-111111111111",
        groupName: "果菜類",
        groupSortOrder: 3,
      },
    ],
    cropGroups: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "果菜類",
        sort_order: 3,
        hierarchy_level: "group",
        parent_id: null,
      },
    ],
    effectCategories: [
      { id: "11111111-1111-4111-8111-111111111111", name: "生育支援", sort_order: 3 },
    ],
    effects: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "樹勢改善",
        sort_order: 3,
        categoryId: "11111111-1111-4111-8111-111111111111",
        categoryName: "生育支援",
        categorySortOrder: 3,
      },
    ],
    ingredientCategories: [
      { id: "11111111-1111-4111-8111-111111111111", name: "微生物資材", sort_order: 3 },
    ],
    ingredients: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "バチルス属菌",
        sort_order: 3,
        categoryId: "11111111-1111-4111-8111-111111111111",
        categoryName: "微生物資材",
        categorySortOrder: 3,
      },
    ],
    productTypes: [
      { id: "11111111-1111-4111-8111-111111111111", name: "バイオスティミュラント", sort_order: 3 },
    ],
    searchTags: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "高温期の生育維持",
        sort_order: 3,
        category: "condition",
      },
    ],
  },
})).mockName("listClassificationOptions");

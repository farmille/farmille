import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatalogSidebar } from "./CatalogSidebar";
const meta = {
  title: "App/Search/CatalogSidebar",
  component: CatalogSidebar,
  args: {
    catalog: {
      materials: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "植物活力液",
          manufacturer_name: "農業資材株式会社",
          description: null,
          avg_rating: null,
          review_count: 0,
          created_at: "2026-09-01",
          material_images: [],
          material_crops: [{ crop_id: "00000000-0000-4000-8000-000000000002" }],
          material_crop_groups: [{ crop_group_id: "00000000-0000-4000-8000-000000000004" }],
          material_effects: [],
          material_ingredient_categories: [],
          material_search_tags: [],
          material_application_methods: [],
        },
      ],
      crops: [
        {
          id: "00000000-0000-4000-8000-000000000002",
          name: "たまねぎ",
          aliases: ["玉ねぎ"],
          sort_order: 1,
          groupId: "00000000-0000-4000-8000-000000000004",
          groupName: "鱗茎類",
          groupSortOrder: 1,
        },
      ],
      groups: [
        {
          id: "00000000-0000-4000-8000-000000000003",
          name: "野菜類",
          parent_id: null,
          hierarchy_level: "major",
          sort_order: 1,
        },
        {
          id: "00000000-0000-4000-8000-000000000004",
          name: "鱗茎類",
          parent_id: "00000000-0000-4000-8000-000000000003",
          hierarchy_level: "middle",
          sort_order: 1,
        },
      ],
      effects: [
        {
          id: "00000000-0000-4000-8000-000000000005",
          name: "養分吸収の改善",
          sort_order: 1,
          categoryId: "00000000-0000-4000-8000-000000000007",
          categoryName: "栄養利用の効率改善",
          categorySortOrder: 1,
        },
        {
          id: "00000000-0000-4000-8000-000000000008",
          name: "耐暑性改善",
          sort_order: 1,
          categoryId: "00000000-0000-4000-8000-000000000009",
          categoryName: "非生物的ストレス耐性の改善",
          categorySortOrder: 2,
        },
      ],
      counts: [],
    },
    search: {
      filters: [
        {
          category: "effect",
          id: "00000000-0000-4000-8000-000000000005",
          name: "養分吸収の改善",
          aliases: [],
          sort_order: 1,
        },
        {
          category: "genre",
          id: "00000000-0000-4000-8000-000000000006",
          name: "微生物資材",
          aliases: [],
          sort_order: 1,
        },
        { category: "method", id: "葉面散布", name: "葉面散布", aliases: [], sort_order: 1 },
      ],
      makers: ["農業資材株式会社"],
      materialNames: [],
    },
    selected: [],
    sort: "newest",
    query: "",
  },
} satisfies Meta<typeof CatalogSidebar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = {
  args: {
    selected: [
      {
        kind: "filter",
        category: "effect",
        id: "00000000-0000-4000-8000-000000000005",
        name: "養分吸収の改善",
      },
    ],
    sort: "rating",
    query: "植物",
  },
};

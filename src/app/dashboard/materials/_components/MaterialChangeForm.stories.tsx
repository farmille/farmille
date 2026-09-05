import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { materialDetail } from "@/app/materials/[id]/_components/story-fixtures";
import type { ClassificationOptions } from "@/server/queries/classifications";

import { MaterialChangeForm } from "./MaterialChangeForm";

const classifications: ClassificationOptions = {
  compositionTypes: [{ id: "00000000-0000-4000-8000-000000000301", name: "液体", sort_order: 10 }],
  crops: [
    {
      id: "00000000-0000-4000-8000-000000000304",
      name: "トマト",
      aliases: ["ミニトマト"],
      sort_order: 10,
      groupId: "00000000-0000-4000-8000-000000000305",
      groupName: "果菜類",
      groupSortOrder: 10,
    },
  ],
  effectCategories: [
    { id: "00000000-0000-4000-8000-000000000303", name: "その他", sort_order: 40 },
  ],
  effects: [
    {
      id: "00000000-0000-4000-8000-000000000302",
      name: "樹勢改善",
      sort_order: 10,
      categoryId: "00000000-0000-4000-8000-000000000303",
      categoryName: "その他",
      categorySortOrder: 40,
    },
  ],
  ingredientCategories: [
    { id: "00000000-0000-4000-8000-000000000306", name: "微生物資材", sort_order: 10 },
  ],
  ingredients: [
    {
      id: "00000000-0000-4000-8000-000000000307",
      name: "バチルス属菌",
      sort_order: 10,
      categoryId: "00000000-0000-4000-8000-000000000306",
      categoryName: "微生物資材",
      categorySortOrder: 10,
    },
  ],
  productTypes: [
    { id: "00000000-0000-4000-8000-000000000308", name: "微生物資材", sort_order: 10 },
  ],
  searchTags: [
    {
      id: "00000000-0000-4000-8000-000000000309",
      name: "根張り改善",
      category: "concern",
      sort_order: 10,
    },
  ],
};

const meta = {
  title: "App/Dashboard/Materials/MaterialChangeForm",
  component: MaterialChangeForm,
  args: {
    classifications,
    manufacturerName: "グリーンバイオ株式会社",
    material: materialDetail,
  },
  parameters: {
    nextjs: { navigation: { pathname: "/dashboard/materials/storybook" } },
  },
} satisfies Meta<typeof MaterialChangeForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Update: Story = {};

export const Create: Story = {
  args: { material: null },
};

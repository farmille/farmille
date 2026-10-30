import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked, userEvent, within } from "storybook/test";

import { updateMaterialAction } from "@/app/admin/materials/actions";
import type { AdminMaterialDetail } from "@/server/admin/materials";
import type { ClassificationOptions } from "@/server/queries/classifications";

import { MaterialForm } from "./MaterialForm";

const classifications: ClassificationOptions = {
  compositionTypes: [{ id: "00000000-0000-4000-8000-000000000301", name: "液体", sort_order: 10 }],
  crops: [
    {
      id: "00000000-0000-4000-8000-000000000302",
      name: "トマト",
      aliases: [],
      sort_order: 10,
      groupId: "00000000-0000-4000-8000-000000000303",
      groupName: "果菜類",
      groupSortOrder: 10,
    },
  ],
  cropGroups: [
    {
      id: "00000000-0000-4000-8000-000000000303",
      name: "果菜類",
      parent_id: null,
      hierarchy_level: "major",
      sort_order: 10,
    },
  ],
  effectCategories: [
    { id: "00000000-0000-4000-8000-000000000304", name: "その他", sort_order: 40 },
  ],
  effects: [
    {
      id: "00000000-0000-4000-8000-000000000305",
      name: "樹勢改善",
      sort_order: 10,
      categoryId: "00000000-0000-4000-8000-000000000304",
      categoryName: "その他",
      categorySortOrder: 40,
    },
  ],
  ingredientCategories: [
    {
      id: "00000000-0000-4000-8000-000000000306",
      name: "微生物",
      short_name: "微生物",
      sort_order: 10,
    },
  ],
  ingredients: [
    {
      id: "00000000-0000-4000-8000-000000000307",
      name: "バチルス属菌",
      sort_order: 10,
      categoryId: "00000000-0000-4000-8000-000000000306",
      categoryName: "微生物",
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
      aliases: [],
      effectIds: [],
      sort_order: 10,
    },
  ],
};

const material: AdminMaterialDetail = {
  official_name: null,
  name_reading: null,
  container_type_id: null,
  published_page_version_id: null,
  id: "00000000-0000-4000-8000-000000000101",
  name: "土づくり微生物資材",
  manufacturer_name: "グリーンバイオ株式会社",
  composition_type_id: "00000000-0000-4000-8000-000000000301",
  sales_status: "販売中",
  description: "土壌環境を整えるための微生物資材です。",
  general_use: "定植前の土づくりに使用します。",
  main_components: "バチルス属菌",
  mechanism: "有用微生物の定着を支援します。",
  usage_text: "10aあたり1kgを均一に散布します。",
  price_range: "5,000〜8,000円",
  official_url: "https://example.com/material",
  catalog_url: "https://example.com/catalog.pdf",
  avg_rating: 4.2,
  control_plot_ratio: null,
  review_count: 18,
  seller_id: "00000000-0000-4000-8000-000000000201",
  publication_status: "published",
  archived_at: null,
  content_revision: 1,
  manufacturer_verified_at: "2026-07-02T00:00:00.000Z",
  manufacturer_verified_by_seller_id: "00000000-0000-4000-8000-000000000201",
  manufacturer_verification_method: "confirmed_existing",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
  cropIds: ["00000000-0000-4000-8000-000000000302"],
  effectIds: ["00000000-0000-4000-8000-000000000305"],
  ingredientCategoryIds: ["00000000-0000-4000-8000-000000000306"],
  ingredientIds: ["00000000-0000-4000-8000-000000000307"],
  productTypeIds: ["00000000-0000-4000-8000-000000000308"],
  searchTagIds: ["00000000-0000-4000-8000-000000000309"],
  sellerName: "グリーンバイオ株式会社",
};

const meta = {
  title: "Pages/admin/materials/MaterialForm",
  component: MaterialForm,
  args: { classifications, material },
} satisfies Meta<typeof MaterialForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Edit: Story = { args: { classifications, material } };

export const Create: Story = {
  args: { classifications, material: null },
};

export const ClassificationError: Story = {
  args: { material: { ...material, effectIds: [] } },
  beforeEach() {
    mocked(updateMaterialAction).mockResolvedValueOnce({
      status: "error",
      message: "入力内容を確認してください。",
      fieldErrors: { classifications: "効果は1件以上選んでください。" },
    });
  },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "保存する" }));
  },
};

export const WithoutClassifications: Story = {
  args: {
    classifications: {
      compositionTypes: [],
      crops: [],
      cropGroups: [],
      effectCategories: [],
      effects: [],
      ingredientCategories: [],
      ingredients: [],
      productTypes: [],
      searchTags: [],
    },
    material,
  },
};

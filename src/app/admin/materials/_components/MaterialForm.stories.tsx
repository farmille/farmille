import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { AdminMaterialDetail } from "@/server/admin/materials";
import type { AdminTagItem } from "@/server/admin/tags";

import { MaterialForm } from "./MaterialForm";

const tags: AdminTagItem[] = [
  { id: "tag-crop", name: "トマト", category: "crop", sort_order: 10, usageCount: 12 },
  { id: "tag-effect", name: "発根促進", category: "effect", sort_order: 20, usageCount: 4 },
  { id: "tag-type", name: "微生物資材", category: "type", sort_order: 30, usageCount: 8 },
];

const material: AdminMaterialDetail = {
  id: "00000000-0000-4000-8000-000000000101",
  name: "土づくり微生物資材",
  manufacturer_name: "グリーンバイオ株式会社",
  product_type: "微生物資材",
  jbsa_class: "土壌改良",
  sales_status: "販売中",
  description: "土壌環境を整えるための微生物資材です。",
  general_use: "定植前の土づくりに使用します。",
  ingredients: "バチルス属菌",
  mechanism: "有用微生物の定着を支援します。",
  usage_text: "10aあたり1kgを均一に散布します。",
  price_range: "5,000〜8,000円",
  official_url: "https://example.com/material",
  catalog_url: "https://example.com/catalog.pdf",
  avg_rating: 4.2,
  control_plot_ratio: null,
  review_count: 18,
  seller_id: "00000000-0000-4000-8000-000000000201",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
  tagIds: ["tag-crop", "tag-type"],
  sellerName: "グリーンバイオ株式会社",
};

const meta = {
  title: "App/Admin/Materials/MaterialForm",
  component: MaterialForm,
  args: { material, tags },
} satisfies Meta<typeof MaterialForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Edit: Story = {};

export const Create: Story = {
  args: { material: null },
};

export const WithoutTags: Story = {
  args: { tags: [] },
};

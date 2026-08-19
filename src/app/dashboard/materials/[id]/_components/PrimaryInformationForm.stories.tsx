import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { SellerMaterialDetail } from "@/server/queries/seller-dashboard";

import { PrimaryInformationForm } from "./PrimaryInformationForm";

const material: SellerMaterialDetail = {
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
  tags: [
    { id: "tag-type", name: "微生物資材", category: "type", sort_order: 10 },
    { id: "tag-effect", name: "発根促進", category: "effect", sort_order: 20 },
  ],
  evidences: [],
};

const meta = {
  title: "App/Dashboard/Materials/PrimaryInformationForm",
  component: PrimaryInformationForm,
  args: { material },
} satisfies Meta<typeof PrimaryInformationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

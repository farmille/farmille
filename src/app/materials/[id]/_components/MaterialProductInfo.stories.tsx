import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import type { MaterialPageContent } from "@/lib/material-page-editor";

import { MaterialProductInfo } from "./MaterialProductInfo";
import { materialDetail, materialLinks } from "./story-fixtures";

const content: MaterialPageContent = {
  description:
    "土壌環境を整え、定植後の根張りを支える微生物資材です。\nバチルス属菌が根圏に定着し、養分の吸収を助けます。",
  mainComponents: "",
  mechanism: "根圏の微生物相を整えます。",
  links: materialLinks,
  images: [],
  timings: [0, 1, 3],
  registrations: [],
  relatedCompanies: ["グリーンバイオ株式会社"],
  certifications: [],
  usages: [{ method: "spray", detail: "使用前に製品ラベルをご確認ください。" }],
};

const bareMaterial = {
  ...materialDetail,
  official_name: null,
  main_components: null,
  official_url: null,
  catalog_url: null,
  evidences: [],
  effects: [],
  targetCrops: [],
  targetCropGroups: [],
  applicationMethods: [],
  ingredientCategories: [],
};

const meta = {
  title: "Pages/materials/[id]/MaterialProductInfo",
  component: MaterialProductInfo,
  args: { material: materialDetail, content },
} satisfies Meta<typeof MaterialProductInfo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Published: Story = {};

export const CatalogOnly: Story = {
  args: { content: undefined },
};

export const PartlyRegistered: Story = {
  args: { material: { ...bareMaterial, main_components: "Fe 15,000mg/L" }, content: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "製品詳細" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "製品説明" })).toBeNull();
    await expect(canvas.queryByText("−")).toBeNull();
  },
};

export const NotRegistered: Story = {
  args: { material: bareMaterial, content: undefined },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText("この資材の製品情報は、まだ登録されていません。"),
    ).toBeVisible();
  },
};

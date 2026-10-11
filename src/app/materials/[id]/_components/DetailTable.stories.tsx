import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { MaterialDetailTable } from "./DetailTable";
import { materialDetail } from "./story-fixtures";

const meta = {
  title: "App/Materials/DetailTable",
  component: MaterialDetailTable,
  args: { material: materialDetail },
} satisfies Meta<typeof MaterialDetailTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Official: Story = {};

export const UnclaimedWithMissingValues: Story = {
  args: {
    material: {
      ...materialDetail,
      seller_id: null,
      general_use: null,
      main_components: null,
      mechanism: null,
      effects: [],
      targetCrops: [],
      targetCropGroups: [],
      applicationMethods: [],
      ingredientCategories: [],
      ingredients: [],
      productTypes: [],
      searchTags: [],
    },
  },
};

export const ManufacturerContent: Story = {
  args: {
    content: {
      description: "製品説明",
      mainComponents: "",
      mechanism: "メーカー記入の作用機作",
      links: [],
      images: [],
      timings: [],
      registrations: [],
      relatedCompanies: [],
      certifications: ["肥料登録"],
      usages: [
        { method: "spray", detail: "使用前に製品ラベルをご確認ください。" },
        { method: "other", detail: "表示しない補足" },
      ],
    },
  },
};

export const ManufacturerContentUsageOpen: Story = {
  args: ManufacturerContent.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "詳細を見る" }));
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import type { MaterialPageContent } from "@/lib/material-page-editor";

import { MaterialDetailTable, materialDetailRows } from "./DetailTable";
import { materialDetail } from "./story-fixtures";

const meta = {
  title: "Pages/materials/[id]/DetailTable",
  component: MaterialDetailTable,
  args: { rows: materialDetailRows(materialDetail, undefined) },
} satisfies Meta<typeof MaterialDetailTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Official: Story = {};

export const UnclaimedWithMissingValues: Story = {
  args: {
    rows: materialDetailRows(
      {
        ...materialDetail,
        seller_id: null,
        general_use: null,
        official_name: null,
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
      undefined,
    ),
  },
};

const manufacturerContent: MaterialPageContent = {
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
};

export const ManufacturerContent: Story = {
  args: { rows: materialDetailRows(materialDetail, manufacturerContent) },
};

export const ManufacturerContentUsageOpen: Story = {
  args: ManufacturerContent.args,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "詳細を見る" }));
  },
};

const manyCropNames = [
  "トマト",
  "ミニトマト",
  "きゅうり",
  "なす",
  "ピーマン",
  "いちご",
  "水稲",
  "キャベツ",
  "ホースラディッシュ",
];

export const ManyCrops: Story = {
  args: {
    rows: materialDetailRows(
      {
        ...materialDetail,
        effects: ["根張り改善", "耐暑性改善", "収量増加"].map((name, index) => ({
          id: `00000000-0000-4000-8000-0000000004${index}0`,
          name,
          sort_order: index,
          categoryId: "00000000-0000-4000-8000-000000000303",
          categoryName: "その他",
          categorySortOrder: 40,
        })),
        targetCrops: manyCropNames.map((name, index) => ({
          id: `00000000-0000-4000-8000-0000000005${index}0`,
          name,
          sort_order: index,
          groupId: "00000000-0000-4000-8000-000000000305",
          groupName: "果菜類",
          groupSortOrder: 10,
          sourceName: name,
        })),
        targetCropGroups: [
          {
            id: "00000000-0000-4000-8000-000000000600",
            name: "あぶらな科野菜（花蕾及び茎）",
            sort_order: 10,
          },
        ],
      },
      undefined,
    ),
  },
};

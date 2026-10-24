import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReportPageForm } from "./ReportPageForm";
import { filledReport, varietyReport } from "./reportStoryFixture";

const crops = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "トマト",
    aliases: ["大玉トマト"],
    groupName: "果菜類",
  },
  {
    id: "22222222-2222-4222-8222-222222222223",
    name: "ミニトマト",
    aliases: [],
    groupName: "果菜類",
  },
  {
    id: "22222222-2222-4222-8222-222222222224",
    name: "いちご",
    aliases: ["イチゴ"],
    groupName: "果菜類",
  },
];

const effects = [
  { id: "e1", name: "収量向上", categoryName: "収量・品質の改善" },
  { id: "e2", name: "品質向上", categoryName: "収量・品質の改善" },
  { id: "e3", name: "耐暑性改善", categoryName: "非生物的ストレス耐性の改善" },
];

const meta = {
  title: "Pages/materials/[id]/report/ReportPageForm",
  component: ReportPageForm,
  parameters: { layout: "fullscreen" },
  args: {
    material: {
      id: "11111111-1111-4111-8111-111111111111",
      name: "スキーポン",
      manufacturerName: "ファーム技研",
    },
    userId: "00000000-0000-4000-8000-000000000001",
    authorName: "しおさい農園",
    crops,
    effects,
    materialEffectNames: ["耐暑性改善"],
    favoriteCropIds: ["22222222-2222-4222-8222-222222222224"],
    materialCropIds: ["22222222-2222-4222-8222-222222222223"],
    draft: null,
    registeredAddress: { prefectureCode: 8 },
  },
} satisfies Meta<typeof ReportPageForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blank: Story = {};

export const Draft: Story = { args: { draft: filledReport } };

export const Varieties: Story = { args: { draft: varietyReport } };

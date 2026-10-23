import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportPageProperties } from "./ReportPageProperties";
import { filledReport } from "./reportStoryFixture";

const meta = {
  title: "Pages/materials/[id]/report/ReportPageProperties",
  component: ReportPageProperties,
  args: {
    input: filledReport,
    onChange: fn(),
    missing: new Set<string>(),
    material: { id: filledReport.materialId, name: "スキーポン", manufacturerName: "ファーム技研" },
    pageMaterialId: filledReport.materialId,
    onMaterialChange: fn(),
    crops: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "トマト",
        aliases: [],
        groupName: "果菜類",
      },
    ],
    favoriteCropIds: [],
    materialCropIds: [],
    effects: [
      { id: "e1", name: "収量向上", categoryName: "収量・品質の改善" },
      { id: "e2", name: "品質向上", categoryName: "収量・品質の改善" },
    ],
    materialEffectNames: [],
    authorName: "しおさい農園",
    onMessage: fn(),
  },
} satisfies Meta<typeof ReportPageProperties>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Missing: Story = {
  args: {
    input: { ...filledReport, cropId: null, purposeTags: [], timingStages: [] },
    missing: new Set(["cropId", "purposeTags", "timingStages"]),
  },
};

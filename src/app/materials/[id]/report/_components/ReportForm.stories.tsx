import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { createBlankUsageReport } from "@/lib/usage-report";
import { ReportForm } from "./ReportForm";
const draft = createBlankUsageReport("00000000-0000-4000-8000-000000000101");
const meta = {
  title: "App/Materials/Report/ReportForm",
  component: ReportForm,
  args: {
    material: {
      id: draft.materialId,
      name: "土づくり微生物資材",
      manufacturerName: "グリーンバイオ株式会社",
      imageUrl: null,
    },
    userId: "00000000-0000-4000-8000-000000000901",
    crops: [
      {
        id: "00000000-0000-4000-8000-000000000201",
        name: "トマト",
        aliases: ["ミニトマト"],
        groupName: "なす科果菜類",
      },
    ],
    effects: [{ id: "water", name: "水分吸収の改善", categoryName: "栄養利用の効率改善" }],
    materialEffectNames: [],
    favoriteCropIds: [],
    materialCropIds: [],
    draft,
    registeredAddress: { prefectureCode: 45, city: "宮崎市" },
  },
} satisfies Meta<typeof ReportForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Draft: Story = {};
export const Blank: Story = { args: { draft: null } };

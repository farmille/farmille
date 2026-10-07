import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { createBlankUsageReport } from "@/lib/usage-report";

import { ReportStepBasics } from "./ReportStepBasics";
import { reportFrame } from "./ReportFormParts";

const blank = createBlankUsageReport("00000000-0000-4000-8000-000000000101");
const crops = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    name: "トマト",
    aliases: ["ミニトマト"],
    groupName: "なす科果菜類",
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    name: "ピーマン",
    aliases: [],
    groupName: "なす科果菜類",
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    name: "きゅうり",
    aliases: [],
    groupName: "うり科果菜類",
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    name: "いちご",
    aliases: [],
    groupName: "果実的野菜",
  },
];

const meta = {
  title: "App/Materials/Report/ReportStepBasics",
  component: ReportStepBasics,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  args: {
    input: { ...blank, cropId: crops[0]?.id ?? null, variety: "桃太郎" },
    onChange: fn(),
    errors: {},
    material: {
      id: blank.materialId,
      name: "土づくり微生物資材",
      manufacturerName: "グリーンバイオ株式会社",
      imageUrl: null,
    },
    pageMaterialId: blank.materialId,
    onMaterialChange: fn(),
    crops,
    favoriteCropIds: ["00000000-0000-4000-8000-000000000204"],
    materialCropIds: [
      "00000000-0000-4000-8000-000000000202",
      "00000000-0000-4000-8000-000000000203",
    ],
    onMessage: fn(),
  },
  render: function BasicsStory(args) {
    const [input, setInput] = useState(args.input);
    return <ReportStepBasics {...args} input={input} onChange={setInput} />;
  },
} satisfies Meta<typeof ReportStepBasics>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Missing: Story = {
  args: {
    input: blank,
    errors: { cropId: "使用作物を選んでください", variety: "品種を入力してください" },
  },
};
export const VarietyUnknown: Story = {
  args: { input: { ...blank, varietyUnknown: true } },
};

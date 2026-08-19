import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { createBlankCropReport } from "@/server/usage-reports/model";

import { CropReportFields } from "./CropReportFields";

const input = {
  ...createBlankCropReport("crop-tomato"),
  observedChange: "定植後の根張りがそろい、午後の萎れが少なくなりました。",
  negativeNote: "散布直後は特有のにおいがありました。",
  purposeTags: ["水分吸収の改善", "しおれ軽減"],
  prefectureCode: "1",
  fieldName: "第2ハウス",
  variety: "桃太郎",
  plantingDate: "2026-04-15",
  cultivationType: "facility" as const,
  cultivationTags: ["ハウス", "養液土耕"],
  growthStage: "定植・活着期",
  applicationDates: ["2026-04-10", "2026-04-17"],
  applicationMethod: "soil" as const,
  soilMethod: "株元灌注",
  soilAmountValue: "200",
  soilAmountUnit: "mL/株",
};

const meta = {
  title: "App/Materials/Report/CropReportFields",
  component: CropReportFields,
  args: {
    input,
    crop: {
      id: "crop-tomato",
      name: "トマト",
      aliases: ["ミニトマト"],
      groupName: "なす科果菜類",
    },
    initialMonth: "2026-04",
    tabbed: false,
    errors: {},
    onChange: fn(),
  },
} satisfies Meta<typeof CropReportFields>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const BlankWithErrors: Story = {
  args: {
    input: createBlankCropReport("crop-tomato"),
    errors: {
      "crop-tomato.observedChange": "使用後の変化を入力してください。",
      "crop-tomato.purposeTags": "使用目的を選んでください。",
    },
  },
};

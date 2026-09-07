import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { UsageReportDraft } from "@/server/queries/usage-report-form";
import { createBlankCropReport } from "@/server/usage-reports/model";

import { ReportForm } from "./ReportForm";

const crops = [
  { id: "crop-tomato", name: "トマト", aliases: ["ミニトマト"], groupName: "なす科果菜類" },
  { id: "crop-pepper", name: "ピーマン", aliases: ["パプリカ"], groupName: "なす科果菜類" },
  { id: "crop-orange", name: "温州みかん", aliases: ["みかん"], groupName: "かんきつ類" },
];

const tomatoReport = {
  ...createBlankCropReport("crop-tomato"),
  observedChange: "定植後の根張りがそろい、初期生育の差が小さくなりました。",
  purposeTags: ["水分吸収の改善", "しおれ軽減"],
  prefectureCode: "1",
  fieldName: "第2ハウス",
  variety: "桃太郎",
  plantingDate: "2026-04-15",
  cultivationType: "facility" as const,
  cultivationTags: ["ハウス", "養液土耕"],
  growthStage: "定植・活着期",
  applicationDates: ["2026-04-10"],
  applicationMethod: "soil" as const,
  soilMethod: "株元灌注",
  soilAmountValue: "200",
  soilAmountUnit: "mL/株",
};

const draft: UsageReportDraft = {
  cropReports: [tomatoReport],
  media: [],
  summary: "低温期の定植で根張りの改善を確認しました。",
};

const meta = {
  title: "App/Materials/Report/ReportForm",
  component: ReportForm,
  args: {
    material: {
      id: "00000000-0000-4000-8000-000000000101",
      name: "土づくり微生物資材",
      manufacturerName: "グリーンバイオ株式会社",
      isOfficial: true,
      imageUrl: null,
    },
    userId: "00000000-0000-4000-8000-000000000901",
    crops,
    draft,
    initialMonth: "2026-04",
  },
} satisfies Meta<typeof ReportForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = {};

export const Blank: Story = {
  args: { draft: null },
};

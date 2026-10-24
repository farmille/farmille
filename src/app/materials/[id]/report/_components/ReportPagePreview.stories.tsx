import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportPagePreview } from "./ReportPagePreview";
import { itemsFromInput } from "./report-page-state";
import { filledReport, varietyReport } from "./reportStoryFixture";

const meta = {
  title: "Pages/materials/[id]/report/ReportPagePreview",
  component: ReportPagePreview,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    onOpenChange: fn(),
    input: filledReport,
    items: itemsFromInput(filledReport),
    title: "スキーポン 実証詳細レポート｜トマト",
    materialName: "スキーポン",
    manufacturerName: "ファーム技研",
    cropName: "トマト",
    authorName: "しおさい農園",
    missing: [],
  },
} satisfies Meta<typeof ReportPagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMissing: Story = { args: { missing: ["処理日を記入した確認", "公開の同意"] } };

export const ByVariety: Story = {
  args: { input: varietyReport, items: itemsFromInput(varietyReport) },
};

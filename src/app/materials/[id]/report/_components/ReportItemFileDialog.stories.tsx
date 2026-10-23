import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportItemFileDialog } from "./ReportItemFileDialog";
import { createReportPageItem, itemsFromInput } from "./report-page-state";
import { filledReport } from "./reportStoryFixture";

const [withImage] = itemsFromInput(filledReport);
if (withImage === undefined) throw new Error("記入例の調査項目がありません。");

const meta = {
  title: "Pages/materials/[id]/report/ReportItemFileDialog",
  component: ReportItemFileDialog,
  args: {
    item: { ...createReportPageItem(), name: "可販果収量" },
    isNew: true,
    userId: "00000000-0000-4000-8000-000000000001",
    reportId: filledReport.reportId,
    onCommit: fn(),
    onDelete: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof ReportItemFileDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};

export const Change: Story = { args: { item: withImage, isNew: false } };

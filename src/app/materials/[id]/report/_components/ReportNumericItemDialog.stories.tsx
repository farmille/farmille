import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { reportPlotLayout } from "@/lib/usage-report-plots";

import { ReportNumericItemDialog } from "./ReportNumericItemDialog";
import { itemsFromInput } from "./report-page-state";
import { storyMaterialName, varietyReport } from "./reportStoryFixture";

const numeric = itemsFromInput(varietyReport).find((item) => item.mode === "numeric");
if (numeric?.mode !== "numeric") throw new Error("記入例に数値の調査項目がありません。");

const meta = {
  title: "Pages/materials/[id]/report/ReportNumericItemDialog",
  component: ReportNumericItemDialog,
  args: {
    item: numeric,
    plots: varietyReport.plots,
    layout: reportPlotLayout(varietyReport, storyMaterialName),
    onCommit: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof ReportNumericItemDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

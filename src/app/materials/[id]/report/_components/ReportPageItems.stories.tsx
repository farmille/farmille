import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { REPORT_MEASUREMENT_LIMIT } from "@/lib/usage-report";
import { reportPlotLayout } from "@/lib/usage-report-plots";

import { ReportPageItems } from "./ReportPageItems";
import { createReportPageItem, itemsFromInput } from "./report-page-state";
import { filledReport, storyMaterialName, varietyReport } from "./reportStoryFixture";

const meta = {
  title: "Pages/materials/[id]/report/ReportPageItems",
  component: ReportPageItems,
  args: {
    items: [...itemsFromInput(filledReport), { ...createReportPageItem(), name: "糖度" }],
    plots: filledReport.plots,
    layout: reportPlotLayout(filledReport, storyMaterialName),
    onChange: fn(),
    onOpenFile: fn(),
    onEditNumeric: fn(),
    missing: false,
  },
} satisfies Meta<typeof ReportPageItems>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Missing: Story = { args: { missing: true } };

export const NumericGraph: Story = {
  args: {
    items: itemsFromInput(varietyReport),
    plots: varietyReport.plots,
    layout: reportPlotLayout(varietyReport, storyMaterialName),
  },
};

export const AtLimit: Story = {
  args: {
    items: Array.from({ length: REPORT_MEASUREMENT_LIMIT }, (_, index) => ({
      ...createReportPageItem(),
      mode: "text" as const,
      name: `調査項目${index + 1}`,
      body: "区の間に大きな差はなかった。",
    })),
  },
};

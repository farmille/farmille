import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { createBlankUsageReport, withSingleVariety } from "@/lib/usage-report";
import { reportPlotEdits, reportPlotLayout, withAutoPlotNames } from "@/lib/usage-report-plots";

import { css } from "../../styled-system/css";

import { ReportPlotList } from "./ReportPlotList";

const posted = "ヒートインパクト";
const base = withSingleVariety(
  createBlankUsageReport("11111111-1111-4111-8111-111111111111"),
  "新藍",
  false,
);
const single = withAutoPlotNames(base, base, posted);
const varieties = reportPlotEdits.addComparedMaterial(
  reportPlotEdits.addVariety(single, "味珠", posted),
  "ノビテク",
  posted,
);
const described = (input: typeof single) => ({
  ...input,
  plots: input.plots.map((plot) => ({
    ...plot,
    description: plot.treatment?.kind === "untreated" ? "資材なし" : "1,000倍で葉面散布。",
  })),
});

const meta = {
  title: "Pages/Shared/ReportPlotList",
  component: ReportPlotList,
  decorators: [
    (Story) => (
      <div className={css({ maxW: "content.form", px: "4", py: "4" })}>
        <Story />
      </div>
    ),
  ],
  args: {
    layout: reportPlotLayout(described(single), posted),
    commonDescription: "",
  },
} satisfies Meta<typeof ReportPlotList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TwoPlots: Story = {};

export const ByVariety: Story = {
  args: {
    layout: reportPlotLayout(described(varieties), posted),
    commonDescription: "かん水と施肥は全区同じ。1区5株、4反復。",
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PlotList, ReportBars } from "./ReportArticleParts";
import { filledReport } from "./reportStoryFixture";

const graph = filledReport.measurements[0]?.graphs[0];
if (!graph) throw new Error("グラフの初期データがありません。");

const meta = {
  title: "Pages/materials/[id]/report/ReportArticleParts",
  component: PlotList,
  args: { plots: filledReport.plots },
} satisfies Meta<typeof PlotList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Plots: Story = {};
export const Bars: Story = {
  render: (args) => <ReportBars graph={graph} plots={args.plots} />,
};

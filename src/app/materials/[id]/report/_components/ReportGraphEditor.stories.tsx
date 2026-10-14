import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { createBlankUsageReport } from "@/lib/usage-report";

import { ReportGraphEditor } from "./ReportGraphEditor";
import { filledReport } from "./reportStoryFixture";

const input = createBlankUsageReport("11111111-1111-4111-8111-111111111111");
const measurement = input.measurements[0];
const filled = filledReport.measurements[0];
if (!measurement?.graphs[0] || !filled?.graphs[0])
  throw new Error("グラフの初期データがありません。");
const meta = {
  title: "Pages/materials/[id]/report/ReportGraphEditor",
  component: ReportGraphEditor,
  args: {
    measurement,
    graph: measurement.graphs[0],
    plots: input.plots,
    graphNumber: 1,
    mobile: true,
    active: null,
    periodHint: false,
    onEdit: fn(),
    onAddPlot: fn(),
    onRemovePlot: fn(),
    onAddPeriod: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof ReportGraphEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blank: Story = {};
export const Filled: Story = {
  args: {
    measurement: filled,
    graph: filled.graphs[0],
    plots: filledReport.plots,
    active: { k: "val", g: filled.graphs[0].id, p: filledReport.plots[1]?.id ?? "" },
  },
};
export const FilledDesktop: Story = {
  args: { ...Filled.args, mobile: false, active: { k: "title", g: filled.graphs[0].id } },
};

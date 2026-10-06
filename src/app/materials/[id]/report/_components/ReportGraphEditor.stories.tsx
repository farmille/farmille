import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { createBlankUsageReport } from "@/lib/usage-report";
import { ReportGraphEditor } from "./ReportGraphEditor";
const input = createBlankUsageReport("11111111-1111-4111-8111-111111111111");
const measurement = input.measurements[0];
if (!measurement || !measurement.graphs[0]) throw new Error("グラフの初期データがありません。");
const meta = {
  title: "App/Materials/Report/ReportGraphEditor",
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

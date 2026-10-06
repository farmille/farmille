import { useState } from "react";
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
  render: function ReportGraphStory(args) {
    const [current, setCurrent] = useState(args.measurement);
    return (
      <ReportGraphEditor
        {...args}
        measurement={current}
        onMeasurementChange={(value) => {
          args.onMeasurementChange(value);
          setCurrent(value);
        }}
      />
    );
  },
  args: {
    measurement,
    graph: measurement.graphs[0],
    plots: input.plots,
    graphNumber: 1,
    unitIsManual: false,
    onManualUnit: fn(),
    onMeasurementChange: fn(),
    onPlotChange: fn(),
    onAddPlot: fn(),
    onRemovePlot: fn(),
    onAddPeriod: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof ReportGraphEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blank: Story = {};

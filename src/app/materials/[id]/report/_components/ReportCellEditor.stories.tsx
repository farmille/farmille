import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { ReportCellEditor } from "./ReportCellEditor";
import { ReportGraphEditor } from "./ReportGraphEditor";
import { filledReport } from "./reportStoryFixture";

const measurement = filledReport.measurements[0];
const graph = measurement?.graphs[0];
const plot = filledReport.plots[1];
if (!measurement || !graph || !plot) throw new Error("グラフの初期データがありません。");
const badGraph = {
  ...graph,
  rows: graph.rows.map((row) => (row.plotId === plot.id ? { ...row, value: "多い" } : row)),
};

const meta = {
  title: "App/Materials/Report/ReportCellEditor",
  component: ReportCellEditor,
  args: {
    target: { k: "val", g: graph.id, p: plot.id },
    graphNumber: 1,
    measurement,
    graph,
    plots: filledReport.plots,
    mobile: true,
    unitIsManual: false,
    onManualUnit: fn(),
    onMeasurementChange: fn(),
    onGraphChange: fn(),
    onPlotChange: fn(),
    onRangeAll: fn(),
    onRemovePlot: fn(),
    onNext: fn(),
    onClose: fn(),
  },
  render: (args) => (
    <ReportGraphEditor
      measurement={args.measurement}
      graph={args.graph}
      plots={args.plots}
      graphNumber={args.graphNumber}
      mobile={args.mobile}
      active={args.target}
      periodHint={false}
      onEdit={fn()}
      onAddPlot={fn()}
      onRemovePlot={fn()}
      onAddPeriod={fn()}
      onRemove={fn()}
    >
      <ReportCellEditor {...args} />
    </ReportGraphEditor>
  ),
} satisfies Meta<typeof ReportCellEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Value: Story = {};
export const BadValue: Story = { args: { graph: badGraph } };
export const PlotName: Story = { args: { target: { k: "name", g: graph.id, p: plot.id } } };
export const Axis: Story = { args: { target: { k: "axis", g: graph.id } } };
export const AxisPickUnit: Story = {
  args: Axis.args,
  async play({ canvasElement, args }) {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "%" }));
    await expect(args.onManualUnit).toHaveBeenCalled();
    await expect(args.onMeasurementChange).toHaveBeenCalledWith(
      expect.objectContaining({ unit: "%" }),
    );
  },
};
export const TitleDesktop: Story = {
  args: { target: { k: "title", g: graph.id }, mobile: false },
};
export const PlotNameDesktop: Story = {
  args: { target: { k: "name", g: graph.id, p: plot.id }, mobile: false },
};

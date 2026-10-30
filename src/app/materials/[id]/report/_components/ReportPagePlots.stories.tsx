import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useReducer } from "react";
import { fn } from "storybook/test";

import type { UsageReportInput } from "@/lib/usage-report";

import { ReportPagePlots } from "./ReportPagePlots";
import { filledReport, storyMaterialName, varietyReport } from "./reportStoryFixture";

function Stateful({ initial, missing }: { initial: UsageReportInput; missing: boolean }) {
  const [input, setInput] = useReducer(
    (_current: UsageReportInput, next: UsageReportInput) => next,
    initial,
  );
  return (
    <ReportPagePlots
      input={input}
      postedName={storyMaterialName}
      onChange={setInput}
      missing={missing}
    />
  );
}

const meta = {
  title: "Pages/materials/[id]/report/ReportPagePlots",
  component: ReportPagePlots,
  args: { input: filledReport, postedName: storyMaterialName, onChange: fn(), missing: false },
  render: (args) => <Stateful initial={args.input} missing={args.missing} />,
} satisfies Meta<typeof ReportPagePlots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Missing: Story = { args: { missing: true } };

export const Varieties: Story = { args: { input: varietyReport } };

export const UnchosenMaterial: Story = {
  args: {
    input: {
      ...filledReport,
      plots: filledReport.plots.map((plot) => ({ ...plot, treatment: null })),
    },
    missing: true,
  },
};

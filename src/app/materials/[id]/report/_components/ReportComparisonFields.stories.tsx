import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { createBlankUsageReport } from "@/lib/usage-report";
import { ReportComparisonFields } from "./ReportComparisonFields";
import { reportFrame } from "./ReportFormParts";
const meta = {
  title: "App/Materials/Report/ReportComparisonFields",
  component: ReportComparisonFields,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  args: {
    input: createBlankUsageReport("11111111-1111-4111-8111-111111111111"),
    errors: {},
    onChange: fn(),
    manualUnits: new Set<string>(),
    onManualUnit: fn(),
  },
  render: function ComparisonStory(args) {
    const [input, setInput] = useState(args.input);
    const [manualUnits, setManualUnits] = useState(args.manualUnits);
    return (
      <ReportComparisonFields
        {...args}
        input={input}
        onChange={setInput}
        manualUnits={manualUnits}
        onManualUnit={(id) => setManualUnits((previous) => new Set([...previous, id]))}
      />
    );
  },
} satisfies Meta<typeof ReportComparisonFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blank: Story = {};
export const Missing: Story = {
  args: {
    errors: {
      measurements: "グラフの調査項目と数値を入力してください",
      plots: "比較する区を2つ以上作ってください",
      "plots.0.scope": "区の調査した範囲を入力してください",
      methodDetailsAck: "使用方法の明記を確認してください",
    },
  },
};

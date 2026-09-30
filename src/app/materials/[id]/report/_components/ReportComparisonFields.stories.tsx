import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { createBlankUsageReport } from "@/lib/usage-report";
import { ReportComparisonFields } from "./ReportComparisonFields";
const meta = {
  title: "App/Materials/Report/ReportComparisonFields",
  component: ReportComparisonFields,
  args: {
    input: createBlankUsageReport("11111111-1111-4111-8111-111111111111"),
    errors: {},
    onChange: fn(),
    manualUnits: new Set<string>(),
    onManualUnit: fn(),
  },
} satisfies Meta<typeof ReportComparisonFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blank: Story = {
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
};

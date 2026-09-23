import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
  },
} satisfies Meta<typeof ReportComparisonFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Blank: Story = {};

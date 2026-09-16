import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReportReadingGate } from "./ReportReadingGate";

const meta = {
  title: "Reports/ReadingGate",
  component: ReportReadingGate,
  args: { reportPath: "/reports/sample" },
} satisfies Meta<typeof ReportReadingGate>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

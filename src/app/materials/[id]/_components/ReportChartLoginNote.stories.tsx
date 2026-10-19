import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReportChartLoginNote } from "./ReportChartLoginNote";

const meta = {
  title: "Pages/materials/[id]/ReportChartLoginNote",
  component: ReportChartLoginNote,
} satisfies Meta<typeof ReportChartLoginNote>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportPagePlots } from "./ReportPagePlots";
import { filledReport } from "./reportStoryFixture";

const meta = {
  title: "Pages/materials/[id]/report/ReportPagePlots",
  component: ReportPagePlots,
  args: { plots: filledReport.plots, onChange: fn(), missing: false },
} satisfies Meta<typeof ReportPagePlots>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Missing: Story = { args: { missing: true } };

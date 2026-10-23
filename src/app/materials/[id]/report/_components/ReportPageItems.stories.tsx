import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportPageItems } from "./ReportPageItems";
import { createReportPageItem, itemsFromInput } from "./report-page-state";
import { filledReport } from "./reportStoryFixture";

const meta = {
  title: "Pages/materials/[id]/report/ReportPageItems",
  component: ReportPageItems,
  args: {
    items: [...itemsFromInput(filledReport), { ...createReportPageItem(), name: "糖度" }],
    onChange: fn(),
    onOpenFile: fn(),
    missing: false,
  },
} satisfies Meta<typeof ReportPageItems>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Missing: Story = { args: { missing: true } };

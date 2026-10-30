import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { readingFrame } from "../../articles/_components/story-frame";

import { ReportGate } from "./ReportGate";

const meta = {
  title: "Pages/reports/[id]/ReportGate",
  component: ReportGate,
  decorators: [(Story) => readingFrame(Story())],
  args: { reportPath: "/reports/73000000-0000-4000-8000-000000000051" },
} satisfies Meta<typeof ReportGate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

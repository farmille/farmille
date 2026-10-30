import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { readingFrame } from "../../articles/_components/story-frame";

import { LegacyReportSections } from "./LegacyReportSections";
import { legacyReport } from "./story-fixtures";

const meta = {
  title: "Pages/reports/[id]/LegacyReportSections",
  component: LegacyReportSections,
  decorators: [(Story) => readingFrame(Story())],
  args: { report: legacyReport, coverId: null },
} satisfies Meta<typeof LegacyReportSections>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

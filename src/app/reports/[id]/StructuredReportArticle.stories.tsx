import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { readingFrame } from "../../articles/_components/story-frame";

import { StructuredReportArticle } from "./StructuredReportArticle";
import { structuredReport } from "./story-fixtures";

const meta = {
  title: "Pages/reports/[id]/StructuredReportArticle",
  component: StructuredReportArticle,
  decorators: [(Story) => readingFrame(Story())],
  args: {
    input: structuredReport,
    cropLabel: "ミニトマト（アイコ）",
    documentUrls: [
      { id: "73000000-0000-4000-8000-000000000041", url: "https://example.com/a.pdf" },
    ],
  },
} satisfies Meta<typeof StructuredReportArticle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

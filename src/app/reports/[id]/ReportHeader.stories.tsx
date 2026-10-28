import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { readingFrame } from "../../articles/_components/story-frame";

import { ReportHeader } from "./ReportHeader";
import { legacyReport } from "./story-fixtures";

const meta = {
  title: "Pages/reports/[id]/ReportHeader",
  component: ReportHeader,
  decorators: [(Story) => readingFrame(Story())],
  args: {
    report: legacyReport,
    cropLabel: "ミニトマト（アイコ）",
    materialPath: "/materials/73000000-0000-4000-8000-000000000063",
  },
} satisfies Meta<typeof ReportHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ManyTags: Story = {
  args: {
    report: {
      ...legacyReport,
      author: { ...legacyReport.author, label: "" },
      purposeTags: ["耐暑性改善", "しおれ軽減", "根張り改善", "食味向上"],
    },
  },
};
export const WithdrawnAuthor: Story = {
  args: {
    report: {
      ...legacyReport,
      author: { name: "退会済みユーザー", avatarUrl: null, label: "", href: null },
    },
  },
};

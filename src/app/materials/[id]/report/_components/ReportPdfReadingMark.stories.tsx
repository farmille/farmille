import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReportPdfReadingMark, ReportPdfReadingMarks } from "./ReportPdfReadingMark";
import { filledReport } from "./reportStoryFixture";

const [plot] = filledReport.plots;
if (plot === undefined) throw new Error("記入例に区がありません。");

const meta = {
  title: "Pages/materials/[id]/report/ReportPdfReadingMark",
  component: ReportPdfReadingMark,
  args: {
    fields: [
      { key: "cultivationEnvironment", label: "栽培環境" },
      { key: `plots.${plot.id}.name`, label: "区の名前" },
      { key: `plots.${plot.id}.description`, label: "区の説明" },
    ],
  },
  decorators: [
    (Story) => (
      <ReportPdfReadingMarks
        marks={[
          {
            fieldKey: "cultivationEnvironment",
            value: "露地",
            quote: "「露地栽培（黒ボク土）」（1ページ）",
          },
          { fieldKey: `plots.${plot.id}.name`, value: plot.name, quote: "「無処理区」（2ページ）" },
          { fieldKey: `plots.${plot.id}.description`, value: plot.description, quote: "" },
        ]}
      >
        <Story />
      </ReportPdfReadingMarks>
    ),
  ],
} satisfies Meta<typeof ReportPdfReadingMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PostActionsLoader } from "@/components/PostActionsLoader";
import { css } from "../../../../../styled-system/css";

import { ReportCardChart } from "./ReportCardChart";
import { ReportChartLoginNote } from "./ReportChartLoginNote";
import { UsageReportCard } from "./UsageReportCard";
import { storyReportChart } from "./story-fixtures";
import { storyImageUrl } from "./story-fixtures";

const reportId = "00000000-0000-4000-8000-000000000851";

const meta = {
  title: "Pages/materials/[id]/UsageReportCard",
  component: UsageReportCard,
  decorators: [(Story) => <div className={css({ maxW: "80" })}>{Story()}</div>],
  args: {
    href: `/reports/${reportId}`,
    title: "トマト促成栽培での根張り比較（対照区あり）",
    author: "北のトマト農家",
    coverSrc: storyImageUrl,
    crop: "トマト",
    actions: (
      <PostActionsLoader
        target="usage_report"
        id={reportId}
        currentPath={`/reports/${reportId}`}
        helpfulCount={8}
      />
    ),
  },
} satisfies Meta<typeof UsageReportCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoCover: Story = {
  args: { coverSrc: undefined, crop: null, avatarSrc: storyImageUrl },
};

export const LongTitle: Story = {
  args: {
    title:
      "促成トマトの定植前後に3回灌注し、対照区と根量・収量・糖度を2作続けて比較した記録（高温期の追加試験つき）",
    author: "南の施設園芸ファーム研究会長期試験担当",
  },
};

/** 会員には地域と比較のグラフを添える。 */
export const WithChart: Story = {
  args: { place: "熊本県", figure: <ReportCardChart chart={storyReportChart} /> },
};

/** ログインしていない閲覧者には数値を出さず、ログインで見られることだけを伝える。 */
export const ChartLocked: Story = {
  args: { figure: <ReportChartLoginNote /> },
};

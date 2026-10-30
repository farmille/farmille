import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArticleGrid } from "./FeedCard";

import { PostActions } from "@/components/PostActions";

import { FeedReportCard } from "./FeedReportCard";

const reportId = "71000000-0000-4000-8000-000000000101";

const meta = {
  title: "Pages/articles/FeedReportCard",
  component: FeedReportCard,
  decorators: [(Story) => <ArticleGrid>{Story()}</ArticleGrid>],
  args: {
    href: `/reports/${reportId}`,
    title: "高温期のミニトマトで萎れが軽くなった",
    author: "みどり農園",
    coverSrc: null,
    publishedAt: "2026-09-06T03:00:00.000Z",
    crop: "ミニトマト",
    actions: (
      <PostActions
        target="usage_report"
        id={reportId}
        currentPath={`/reports/${reportId}`}
        helpfulCount={12}
        viewCount={340}
        saved={false}
        voted={false}
      />
    ),
  },
} satisfies Meta<typeof FeedReportCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongTitleAndAuthor: Story = {
  args: {
    title: "定植直後から3回散布し、梅雨明けの高温でも株の勢いが落ちにくかった実証の記録",
    author: "とても長いハンドルネームの生産者さん",
    crop: "中玉トマト（フルティカ）",
  },
};

export const WithoutCropAndDate: Story = { args: { crop: null, publishedAt: undefined } };
export const WithCover: Story = { args: { coverSrc: "/missing-material-image.png" } };

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArticleGrid } from "./FeedCard";

import { OrgArticleCard } from "./OrgArticleCard";

const meta = {
  title: "Pages/articles/OrgArticleCard",
  component: OrgArticleCard,
  decorators: [(Story) => <ArticleGrid>{Story()}</ArticleGrid>],
  args: {
    href: "/articles/72000000-0000-4000-8000-000000000101",
    title: "微生物資材を土に定着させる3つのポイント",
    organization: "グリーンバイオ株式会社",
    typeLabel: "メーカー",
    coverSrc: null,
    helpfulCount: 8,
    viewCount: 1520,
  },
} satisfies Meta<typeof OrgArticleCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongTitle: Story = {
  args: {
    title: "夏場の高温ストレス対策として、葉面散布と灌注を組み合わせた場合の使い分けと注意点",
    organization: "とても長い名前の農業資材メーカー株式会社",
  },
};
export const WithCover: Story = { args: { coverSrc: "/missing-material-image.png" } };

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArticleGrid, FeedCard } from "./FeedCard";

const meta = {
  title: "Pages/articles/FeedCard",
  component: FeedCard,
  decorators: [
    (Story) => (
      <ArticleGrid>
        {Story()}
        {Story()}
        {Story()}
      </ArticleGrid>
    ),
  ],
  args: {
    href: "/articles/72000000-0000-4000-8000-000000000101",
    title: "微生物資材を土に定着させる3つのポイント",
    coverSrc: null,
    children: "カードの種類ごとの中身",
  },
} satisfies Meta<typeof FeedCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

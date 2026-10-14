import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArticleListItem } from "./ArticleListItem";

const article = {
  id: "00000000-0000-4000-8000-000000000601",
  title: "高温期のトマト栽培で微生物資材を使うポイント",
  status: "draft",
  published_at: null,
  updated_at: "2026-08-09T02:00:00.000Z",
  hero_image_url: null,
};

const meta = {
  title: "Pages/dashboard/articles/ArticleListItem",
  component: ArticleListItem,
  args: { article },
  parameters: {
    nextjs: { navigation: { pathname: "/dashboard/articles" } },
  },
} satisfies Meta<typeof ArticleListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = {};

export const Published: Story = {
  args: {
    article: {
      ...article,
      status: "published",
      published_at: "2026-08-08T02:00:00.000Z",
    },
  },
};

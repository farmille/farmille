import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { readingFrame } from "./story-frame";

import { ArticleHeader } from "./ArticleHeader";

const meta = {
  title: "Pages/articles/ArticleHeader",
  component: ArticleHeader,
  decorators: [(Story) => readingFrame(Story())],
  args: {
    title: "微生物資材を土に定着させる3つのポイント",
    sellerName: "グリーンバイオ株式会社",
    sellerPath: "/sellers/00000000-0000-4000-8000-000000000201",
    logoUrl: null,
    publishedAt: "2026-09-06T03:00:00.000Z",
    heroImageUrl: null,
  },
} satisfies Meta<typeof ArticleHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithHeroImage: Story = { args: { heroImageUrl: "/missing-material-image.png" } };
export const LongTitle: Story = {
  args: {
    title:
      "夏場の高温ストレス対策として、葉面散布と灌注を組み合わせた場合の使い分けと、散布のタイミングで気をつけたいこと",
    sellerName: "とても長い名前の農業資材メーカー株式会社",
  },
};

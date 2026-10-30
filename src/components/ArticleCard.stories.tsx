import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ArticleCard } from "./ArticleCard";

const sampleImage =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#E8F5E9"/><circle cx="320" cy="180" r="90" fill="#2E7D32"/></svg>',
  );

const meta = {
  title: "Pages/Shared/ArticleCard",
  component: ArticleCard,
  args: {
    title: "施設トマトにおける高温対策の実践",
    organization: "グリーンバイオ株式会社",
    typeLabel: "メーカー",
    helpfulCount: 18,
  },
} satisfies Meta<typeof ArticleCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCover: Story = {
  args: {
    coverSrc: sampleImage,
    viewCount: 320,
  },
};

export const NotOfficial: Story = {
  args: {
    official: false,
    organization: "農家サポート研究会",
    typeLabel: "その他",
    viewCount: 152,
  },
};

export const Popular: Story = {
  args: {
    coverSrc: sampleImage,
    helpfulCount: 246,
    viewCount: 3980,
  },
};

export const LongTitle: Story = {
  args: {
    title: "光合成細菌とバチルス菌を組み合わせた土壌改良の実践事例と施用量の目安について詳しく解説",
    coverSrc: sampleImage,
    viewCount: 540,
  },
};

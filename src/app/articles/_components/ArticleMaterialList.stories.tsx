import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { readingFrame } from "./story-frame";

import { ArticleMaterialList } from "./ArticleMaterialList";

const meta = {
  title: "Pages/articles/ArticleMaterialList",
  component: ArticleMaterialList,
  decorators: [(Story) => readingFrame(Story())],
  args: {
    materials: [
      {
        id: "00000000-0000-4000-8000-000000000301",
        name: "バイオリーフ液剤",
        manufacturer_name: "グリーンバイオ株式会社",
        avg_rating: 4.2,
        manufacturer_verified_at: "2026-07-01T00:00:00.000Z",
      },
      {
        id: "00000000-0000-4000-8000-000000000302",
        name: "とても長い名前の土壌改良用微生物資材スーパープレミアム顆粒タイプ",
        manufacturer_name: "とても長い名前の農業資材メーカー株式会社",
        avg_rating: null,
        manufacturer_verified_at: null,
      },
    ],
  },
} satisfies Meta<typeof ArticleMaterialList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

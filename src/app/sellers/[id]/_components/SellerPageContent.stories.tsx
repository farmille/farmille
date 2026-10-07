import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PublicSellerPageData } from "@/server/queries/public-sellers";

import { css } from "../../../../../styled-system/css";

import { SellerPageContent } from "./SellerPageContent";

const data = {
  seller: {
    id: "11111111-1111-4111-8111-111111111111",
    officialName: "グリーンバイオ株式会社",
    regionScope: "全国",
    websiteUrl: "https://example.com/green-bio",
    logoUrl: null,
    profileText: "農業現場で扱いやすい微生物資材を開発し、試験データと使用方法を公開しています。",
  },
  materialCount: 5,
  materials: [
    {
      id: "m1",
      name: "土づくりサポート バチルス",
      manufacturerName: "グリーンバイオ株式会社",
      averageRating: 4.2,
      reviewCount: 12,
      manufacturerVerified: true,
      imageUrl: null,
    },
    {
      id: "m2",
      name: "根張りアシスト トリコデルマ菌入り液体資材",
      manufacturerName: "グリーンバイオ株式会社",
      averageRating: 3.6,
      reviewCount: 4,
      manufacturerVerified: true,
      imageUrl: null,
    },
    {
      id: "m3",
      name: "葉面散布ミネラル",
      manufacturerName: "グリーンバイオ株式会社",
      averageRating: null,
      reviewCount: 0,
      manufacturerVerified: true,
      imageUrl: null,
    },
  ],
  helpfulCount: 38,
  articles: [
    {
      id: "a1",
      title: "水稲の育苗期に微生物資材を使うときの3つのポイント",
      heroImageUrl: null,
      publishedAt: "2026-09-01T00:00:00Z",
    },
    {
      id: "a2",
      title: "連作障害の圃場で試した土壌改良の記録",
      heroImageUrl: null,
      publishedAt: "2026-08-12T00:00:00Z",
    },
  ],
} satisfies PublicSellerPageData;

const meta = {
  title: "App/Sellers/SellerPageContent",
  component: SellerPageContent,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="fm">
        <div className={css({ p: "4", bg: "surface.panel" })}>{Story()}</div>
      </div>
    ),
  ],
  args: { data },
} satisfies Meta<typeof SellerPageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ArticlesOnly: Story = {
  args: { data: { ...data, materialCount: 0, materials: [], helpfulCount: 0, articles: [] } },
};

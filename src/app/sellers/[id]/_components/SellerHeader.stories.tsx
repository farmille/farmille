import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { PublicSellerPageData } from "@/server/queries/public-sellers";
import { SellerHeader } from "./SellerHeader";

const seller = {
  id: "seller-1",
  officialName: "グリーンバイオ株式会社",
  sellerType: "maker",
  regionScope: "全国",
  websiteUrl: "https://example.com/green-bio",
  logoUrl: null,
  profileText: "農業現場で扱いやすい微生物資材を開発し、試験データと使用方法を公開しています。",
} satisfies PublicSellerPageData["seller"];

const meta = {
  title: "App/Sellers/SellerHeader",
  component: SellerHeader,
  args: { seller },
} satisfies Meta<typeof SellerHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Maker: Story = {};

export const JaWithoutProfile: Story = {
  args: {
    seller: { ...seller, officialName: "JAみのり", sellerType: "ja", profileText: null },
  },
};

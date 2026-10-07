import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../../styled-system/css";

import type { PublicSellerPageData } from "@/server/queries/public-sellers";
import { SellerHeader } from "./SellerHeader";

const seller = {
  id: "seller-1",
  officialName: "グリーンバイオ株式会社",
  regionScope: "全国",
  websiteUrl: "https://example.com/green-bio",
  logoUrl: null,
  profileText: "農業現場で扱いやすい微生物資材を開発し、試験データと使用方法を公開しています。",
} satisfies PublicSellerPageData["seller"];

const meta = {
  title: "App/Sellers/SellerHeader",
  component: SellerHeader,
  args: { seller },
  decorators: [
    (Story) => (
      <div className="fm">
        <div className={css({ p: "4", bg: "surface.panel" })}>{Story()}</div>
      </div>
    ),
  ],
} satisfies Meta<typeof SellerHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Maker: Story = {};

export const WithoutProfile: Story = {
  args: {
    seller: { ...seller, officialName: "みのりバイオ株式会社", profileText: null },
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialCard } from "./MaterialCard";

const loadedImageUrl =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20450%22%3E%3Crect%20width%3D%22600%22%20height%3D%22450%22%20fill%3D%22%23dcefd8%22%2F%3E%3Ccircle%20cx%3D%22300%22%20cy%3D%22225%22%20r%3D%22120%22%20fill%3D%22%23618d48%22%2F%3E%3C%2Fsvg%3E";

const meta = {
  title: "Pages/Shared/MaterialCard",
  component: MaterialCard,
  args: {
    name: "バチルス菌体資材 ツチイキル",
    maker: "グリーンバイオ株式会社",
    rating: 4.2,
    reviewCount: 128,
  },
} satisfies Meta<typeof MaterialCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {
  args: {
    articleCount: 6,
    description: "納豆菌群の力で土壌の団粒化を促進し、連作障害を軽減する微生物資材。",
  },
};

export const ListOfficial: Story = {
  args: {
    official: true,
    articleCount: 6,
    description: "納豆菌群の力で土壌の団粒化を促進し、連作障害を軽減する微生物資材。",
  },
};

export const ListMinimal: Story = {
  args: {
    reviewCount: 0,
    rating: 0,
  },
};

export const Scroll: Story = {
  args: {
    variant: "scroll",
  },
};

export const ScrollOfficial: Story = {
  args: {
    variant: "scroll",
    official: true,
  },
};

export const ListImageLoaded: Story = {
  args: { imageSrc: loadedImageUrl },
};

export const ListImageFailure: Story = {
  args: { imageSrc: "/missing-material-image.png" },
};

export const ScrollImageLoaded: Story = {
  args: { imageSrc: loadedImageUrl, variant: "scroll" },
};

export const ScrollImageFailure: Story = {
  args: { imageSrc: "/missing-material-image.png", variant: "scroll" },
};

export const ListLongName: Story = {
  args: {
    name: "光合成細菌・バチルス菌・トリコデルマ菌を配合した土壌改良用複合微生物資材 ツチイキルプレミアム 業務用20kg",
    maker: "土壌微生物と持続可能な農業を研究するグリーンバイオ株式会社",
    articleCount: 6,
    categories: ["微生物資材", "土壌改良"],
    description:
      "納豆菌群の働きで土壌の団粒化を促し、施設野菜の連作障害を軽減する微生物資材。定植前の土づくりから生育中の管理まで使えます。",
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialCard } from "./MaterialCard";

const meta = {
  title: "Components/MaterialCard",
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

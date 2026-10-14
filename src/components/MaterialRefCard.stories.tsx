import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialRefCard } from "./MaterialRefCard";

const meta = {
  title: "Pages/Shared/MaterialRefCard",
  component: MaterialRefCard,
  args: {
    href: "/materials/mat-001",
    name: "バチルス菌体資材 ツチイキル",
    manufacturerName: "グリーンバイオ株式会社",
  },
} satisfies Meta<typeof MaterialRefCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRating: Story = {
  args: {
    avgRating: 4.3,
  },
};

export const Official: Story = {
  args: {
    isOfficial: true,
    avgRating: 4.6,
  },
};

export const TargetLabel: Story = {
  args: {
    showTargetLabel: true,
    avgRating: 4.1,
  },
};

export const LongName: Story = {
  args: {
    name: "光合成細菌×バチルス菌×トリコデルマ菌 複合微生物資材 ツチイキルプレミアムセット2026年版〈業務用20kg〉",
    isOfficial: true,
    avgRating: 3.8,
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatCard } from "./StatCard";

const meta = {
  title: "Components/StatCard",
  component: StatCard,
  args: {
    value: 128,
    label: "感想口コミ",
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StringValue: Story = {
  args: {
    value: "48件",
    label: "掲載資材",
  },
};

export const ZeroValue: Story = {
  args: {
    value: 0,
    label: "実証詳細レポート",
  },
};

export const LongLabel: Story = {
  args: {
    value: 12,
    label: "確認待ちの実証詳細レポート",
  },
};

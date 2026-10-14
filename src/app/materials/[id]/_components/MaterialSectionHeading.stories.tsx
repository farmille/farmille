import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialSectionHeading } from "./MaterialSectionHeading";

const meta = {
  title: "Pages/materials/[id]/MaterialSectionHeading",
  component: MaterialSectionHeading,
  args: { title: "感想口コミ", spacing: "section" },
} satisfies Meta<typeof MaterialSectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const WithCountAndMore: Story = {
  args: {
    title: "実証詳細レポート",
    count: 12,
    more: { href: "/materials/storybook/articles", label: "すべて見る →" },
  },
};

export const Standalone: Story = {
  args: { title: "資材詳細", spacing: "standalone" },
};

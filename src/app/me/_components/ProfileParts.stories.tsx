import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EmptyNote, ProfileSectionHeading } from "./ProfileParts";

const meta = {
  title: "Pages/me/ProfileParts",
  component: ProfileSectionHeading,
  args: { id: "heading", children: "これまでの投稿" },
} satisfies Meta<typeof ProfileSectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Heading: Story = {};

export const HeadingWithCountAndLink: Story = {
  args: {
    children: "お気に入りの資材",
    count: "3件",
    more: { href: "/me/saved", label: "すべて見る・比較する" },
  },
};

export const Empty: Story = {
  render: () => (
    <EmptyNote
      title="まだ投稿がありません"
      description="感想口コミや実証詳細レポートを書くと、ここに並びます。"
    />
  ),
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MoreLink } from "./MoreLink";

const meta = {
  title: "App/Materials/MoreLink",
  component: MoreLink,
  args: { href: "/materials/storybook/articles", children: "すべて見る →" },
} satisfies Meta<typeof MoreLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

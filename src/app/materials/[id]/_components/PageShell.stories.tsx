import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SurfaceCard } from "@/components";

import { MaterialPageShell } from "./PageShell";

const meta = {
  title: "Pages/materials/[id]/PageShell",
  component: MaterialPageShell,
  args: {
    title: "感想口コミを書く",
    backHref: "/materials/storybook",
    children: <SurfaceCard title="投稿内容">フォームコンテンツ</SurfaceCard>,
  },
} satisfies Meta<typeof MaterialPageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithFabSpace: Story = {
  args: { hasFab: true },
};

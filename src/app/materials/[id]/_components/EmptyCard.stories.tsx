import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EmptyCard } from "./EmptyCard";

const meta = {
  title: "Pages/materials/[id]/EmptyCard",
  component: EmptyCard,
  args: {
    title: "まだ感想口コミがありません",
    description: "この資材の最初の感想口コミを投稿できます。",
  },
} satisfies Meta<typeof EmptyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Start: Story = {};

export const Center: Story = {
  args: { align: "center" },
};

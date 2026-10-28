import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialGenres } from "./MaterialGenres";

const meta = {
  title: "Components/Display/MaterialGenres",
  component: MaterialGenres,
  args: { names: ["微生物", "海藻、海藻抽出物"] },
} satisfies Meta<typeof MaterialGenres>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OverLimit: Story = {
  args: {
    names: ["微生物", "海藻、海藻抽出物", "アミノ酸、ペプチド、タンパク質加水分解物"],
    max: 1,
  },
};

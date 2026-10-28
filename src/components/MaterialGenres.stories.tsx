import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialGenres } from "./MaterialGenres";

const meta = {
  title: "Components/Display/MaterialGenres",
  component: MaterialGenres,
  args: { names: ["微生物", "海藻"] },
} satisfies Meta<typeof MaterialGenres>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OverLimit: Story = {
  args: {
    names: ["微生物", "海藻", "アミノ酸"],
    max: 1,
  },
};

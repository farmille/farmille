import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeVerticalCopy } from "./HomeVerticalCopy";

const meta = {
  title: "Pages/Home/HomeVerticalCopy",
  component: HomeVerticalCopy,
  args: {
    as: "p",
    lines: ["日本で唯一の", "バイオスティミュラント資材の", "検索・口コミサイト"],
    motion: "load",
  },
} satisfies Meta<typeof HomeVerticalCopy>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnLoad: Story = {};
export const Mission: Story = {
  args: { lines: ["「豊かな実りを、", "微力ながら", "支えさせてください。」"] },
};

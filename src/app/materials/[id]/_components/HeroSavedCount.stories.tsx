import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HeroCount } from "./HeroSavedCount";

const meta = {
  title: "Pages/materials/[id]/HeroSavedCount",
  component: HeroCount,
  args: { children: "12" },
} satisfies Meta<typeof HeroCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const ReportsHighlighted: Story = {
  args: { tone: "highlight", children: "3件" },
};

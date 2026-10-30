import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeLetters } from "./HomeLetters";

const meta = {
  title: "Pages/Home/HomeLetters",
  component: HomeLetters,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomeLetters>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

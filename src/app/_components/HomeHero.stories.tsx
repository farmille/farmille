import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeHero } from "./HomeHero";

const meta = {
  title: "Pages/Home/HomeHero",
  component: HomeHero,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomeHero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

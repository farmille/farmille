import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomeMission } from "./HomeMission";

const meta = {
  title: "Pages/Home/HomeMission",
  component: HomeMission,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof HomeMission>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

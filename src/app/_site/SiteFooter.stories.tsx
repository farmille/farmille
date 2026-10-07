import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteFooter } from "./SiteFooter";

const meta = {
  title: "App/Site/SiteFooter",
  component: SiteFooter,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

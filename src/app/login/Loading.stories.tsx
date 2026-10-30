import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./loading";

const meta = {
  title: "Pages/login/Loading",
  component: Page,
  parameters: { layout: "fullscreen" },
  args: {},
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

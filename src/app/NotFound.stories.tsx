import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./not-found";
const meta = {
  title: "Pages/Home/NotFound",
  component: Page,
  parameters: { layout: "fullscreen" },
  args: {},
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

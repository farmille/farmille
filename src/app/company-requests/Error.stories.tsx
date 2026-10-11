import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import Page from "./error";
const meta = {
  title: "Pages/company-requests/Error",
  component: Page,
  parameters: { layout: "fullscreen" },
  args: { unstable_retry: fn() },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import Page from "./error";

const meta = {
  title: "Pages/account/Error",
  component: Page,
  parameters: { layout: "fullscreen" },
  args: { unstable_retry: fn(), error: new Error("データを取得できませんでした。") },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

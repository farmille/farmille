import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import Page from "./error";

const meta = {
  title: "Pages/materials/[id]/review/Error",
  component: Page,
  parameters: { layout: "fullscreen" },
  args: { error: new Error("データを取得できませんでした。"), unstable_retry: fn() },
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

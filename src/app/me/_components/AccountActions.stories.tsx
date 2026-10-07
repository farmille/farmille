import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountActions } from "./AccountActions";

const meta = {
  title: "App/Me/AccountActions",
  component: AccountActions,
} satisfies Meta<typeof AccountActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

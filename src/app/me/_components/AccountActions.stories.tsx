import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AccountActions } from "./AccountActions";

const meta = {
  title: "Pages/me/AccountActions",
  component: AccountActions,
} satisfies Meta<typeof AccountActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Admin: Story = { args: { admin: true } };

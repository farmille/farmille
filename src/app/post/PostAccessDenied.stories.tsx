import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PostAccessDenied } from "./PostAccessDenied";

const meta = {
  title: "Pages/post/PostAccessDenied",
  component: PostAccessDenied,
  args: { accountType: "seller" },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PostAccessDenied>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Seller: Story = {};

export const Admin: Story = {
  args: { accountType: "admin" },
};

export const UnknownAccount: Story = {
  args: { accountType: null },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Icon } from "@/components/Icon";

import { PostAccessDenied } from "./PostAccessDenied";

const meta = {
  title: "Pages/post/PostAccessDenied",
  component: PostAccessDenied,
  args: {
    accountType: "seller",
    account: { kind: "member", avatar: <Icon name="person" size="md" />, canPost: false },
  },
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

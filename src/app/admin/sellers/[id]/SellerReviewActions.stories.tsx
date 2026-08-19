import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SellerReviewActions } from "./SellerReviewActions";

const meta = {
  title: "App/Admin/Sellers/SellerReviewActions",
  component: SellerReviewActions,
  args: {
    sellerId: "00000000-0000-4000-8000-000000000201",
    status: "applied",
    inviteCode: null,
  },
} satisfies Meta<typeof SellerReviewActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Applied: Story = {};

export const Approved: Story = {
  args: { status: "approved", inviteCode: "FARM-2026" },
};

export const Suspended: Story = {
  args: { status: "suspended" },
};

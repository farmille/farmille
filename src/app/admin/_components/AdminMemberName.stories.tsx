import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AdminMemberName } from "./AdminMemberName";

const meta = {
  title: "Pages/admin/AdminMemberName",
  component: AdminMemberName,
  args: {
    linkClassName: "",
    member: {
      userId: "11111111-1111-4111-8111-111111111111",
      handle: "緑の畑",
      withdrawnAt: null,
    },
  },
} satisfies Meta<typeof AdminMemberName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = {};

export const Withdrawn: Story = {
  args: {
    member: {
      userId: "11111111-1111-4111-8111-111111111111",
      handle: null,
      withdrawnAt: "2026-10-28T03:00:00.000Z",
    },
  },
};

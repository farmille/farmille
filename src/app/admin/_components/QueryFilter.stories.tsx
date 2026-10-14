import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { QueryFilter } from "./QueryFilter";

const meta = {
  title: "Pages/admin/QueryFilter",
  component: QueryFilter,
  args: {
    ariaLabel: "確認状態で絞り込む",
    options: [
      { value: "all", label: "すべて" },
      { value: "applied", label: "申請中" },
      { value: "approved", label: "承認済み" },
    ],
    param: "status",
    value: "applied",
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/admin/sellers",
        query: { status: "applied" },
      },
    },
  },
} satisfies Meta<typeof QueryFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

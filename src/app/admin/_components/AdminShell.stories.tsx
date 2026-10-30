import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Panel } from "./AdminUI";
import { AdminShell } from "./AdminShell";

const meta = {
  title: "Pages/admin/AdminShell",
  component: AdminShell,
  args: {
    title: "メーカー確認",
    description: "申請内容を確認し、共有ログインを発行します。",
    backHref: "/admin",
    children: (
      <Panel title="申請中のメーカー" note="2件">
        一覧コンテンツ
      </Panel>
    ),
  },
} satisfies Meta<typeof AdminShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutBackLink: Story = {
  args: { backHref: undefined },
};

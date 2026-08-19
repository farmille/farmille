import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReportActions } from "./ReportActions";

const meta = {
  title: "App/Admin/Reports/ReportActions",
  component: ReportActions,
  args: {
    reportId: "00000000-0000-4000-8000-000000000401",
    targetType: "review",
  },
} satisfies Meta<typeof ReportActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Content: Story = {};

export const Profile: Story = {
  args: { targetType: "profile" },
};

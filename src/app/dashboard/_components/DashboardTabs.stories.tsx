import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DashboardTabs } from "./DashboardTabs";
const meta = {
  title: "Dashboard/DashboardTabs",
  component: DashboardTabs,
  args: { active: "dash" },
} satisfies Meta<typeof DashboardTabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Profile: Story = { args: { active: "profile" } };

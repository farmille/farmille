import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RemovalForm } from "./RemovalForm";
const meta = {
  title: "App/Admin/PublishedPosts/RemovalForm",
  component: RemovalForm,
  args: { id: "00000000-0000-4000-8000-000000000401", type: "review" },
} satisfies Meta<typeof RemovalForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {};
export const UsageReport: Story = { args: { type: "usage_report" } };

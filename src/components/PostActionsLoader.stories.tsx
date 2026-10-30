import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostActionsLoader } from "./PostActionsLoader";

const meta = {
  title: "Pages/Shared/PostActionsLoader",
  component: PostActionsLoader,
  args: {
    target: "review",
    id: "71000000-0000-4000-8000-000000000001",
    currentPath: "/me/saved",
    helpfulCount: 12,
  },
} satisfies Meta<typeof PostActionsLoader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Review: Story = {};
export const Report: Story = { args: { target: "usage_report" } };

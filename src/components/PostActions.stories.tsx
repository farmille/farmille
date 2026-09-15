import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostActions } from "./PostActions";

const meta = {
  title: "Components/PostActions",
  component: PostActions,
  args: {
    target: "review",
    id: "71000000-0000-4000-8000-000000000001",
    currentPath: "/",
    helpfulCount: 12,
    viewCount: 125,
    saved: false,
    voted: false,
  },
} satisfies Meta<typeof PostActions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Review: Story = {};
export const Report: Story = { args: { target: "usage_report" } };
export const Saved: Story = { args: { saved: true, voted: true } };

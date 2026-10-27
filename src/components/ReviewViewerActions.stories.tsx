import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewViewerActions } from "./ReviewViewerActions";

const meta = {
  title: "Pages/Shared/ReviewViewerActions",
  component: ReviewViewerActions,
  args: {
    reviewId: "review-001",
    materialId: "material-001",
    canManage: false,
    reportReturnPath: "/materials/material-001",
  },
} satisfies Meta<typeof ReviewViewerActions>;

export default meta;
type Story = StoryObj<typeof meta>;

// 他人の投稿：通報
export const Report: Story = {};

// 本人の投稿：編集・削除
export const Owner: Story = { args: { canManage: true } };

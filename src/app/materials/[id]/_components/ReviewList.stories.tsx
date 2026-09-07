import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewList } from "./ReviewList";
import { materialReviews } from "./story-fixtures";

const meta = {
  title: "App/Materials/ReviewList",
  component: ReviewList,
  args: {
    reviews: materialReviews,
    currentPath: "/materials/storybook",
  },
} satisfies Meta<typeof ReviewList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { reviews: [] },
};

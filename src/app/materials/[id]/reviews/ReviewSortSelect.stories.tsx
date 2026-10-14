import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewSortSelect } from "./ReviewSortSelect";

const meta = {
  title: "Pages/materials/[id]/reviews/ReviewSortSelect",
  component: ReviewSortSelect,
  args: { sort: "newest" },
} satisfies Meta<typeof ReviewSortSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Newest: Story = {};

export const Helpful: Story = {
  args: { sort: "helpful" },
};

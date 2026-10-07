import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReviewSortSelect } from "./ReviewSortSelect";

const meta = {
  title: "App/Materials/ReviewSortSelect",
  component: ReviewSortSelect,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: { sort: "newest" },
} satisfies Meta<typeof ReviewSortSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Newest: Story = {};

export const Helpful: Story = {
  args: { sort: "helpful" },
};

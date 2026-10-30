import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SortSelect } from "./SortSelect";

const meta = {
  title: "Pages/search/SortSelect",
  component: SortSelect,
  args: { selected: [], sort: "reviews" },
} satisfies Meta<typeof SortSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Newest: Story = { args: { sort: "newest" } };

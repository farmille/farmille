import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MockSortSelect } from "./MockSortSelect";

const meta = {
  title: "App/Search/MockSortSelect",
  component: MockSortSelect,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: { selected: [], sort: "reviews" },
} satisfies Meta<typeof MockSortSelect>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Newest: Story = { args: { sort: "newest" } };

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  MockChevronIcon,
  MockEyeIcon,
  MockImagePlaceholderIcon,
  MockSearchIcon,
  MockSeedIcon,
  MockThumbIcon,
  MockViewCount,
} from "./MockIcons";

const meta = {
  title: "Articles/MockIcons",
  component: MockViewCount,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: { count: 12345 },
} satisfies Meta<typeof MockViewCount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ViewCount: Story = {};
export const Icons: Story = {
  render: () => (
    <div>
      <MockThumbIcon />
      <MockEyeIcon />
      <MockSeedIcon />
      <MockChevronIcon />
      <MockImagePlaceholderIcon />
      <MockSearchIcon />
    </div>
  ),
};

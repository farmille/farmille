import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ChevronIcon,
  EyeIcon,
  ArticleImagePlaceholderIcon,
  ArticleSearchIcon,
  SeedIcon,
  ThumbIcon,
  ViewCount,
} from "./ArticleIcons";

const meta = {
  title: "Articles/ArticleIcons",
  component: ViewCount,
  args: { count: 12345 },
} satisfies Meta<typeof ViewCount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Icons: Story = {
  render: () => (
    <div>
      <ThumbIcon />
      <EyeIcon />
      <SeedIcon />
      <ChevronIcon />
      <ArticleImagePlaceholderIcon />
      <ArticleSearchIcon />
    </div>
  ),
};

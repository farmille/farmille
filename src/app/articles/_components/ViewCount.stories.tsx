import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ViewCount } from "./ViewCount";

const meta = {
  title: "Pages/articles/ViewCount",
  component: ViewCount,
  args: { count: 12345 },
} satisfies Meta<typeof ViewCount>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

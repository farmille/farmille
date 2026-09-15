import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../styled-system/css";

import { ReviewAnalytics } from "./ReviewAnalytics";

const noteStyle = css({ color: "text.subtle", fontSize: "sm" });

const meta = {
  title: "App/Materials/ReviewAnalytics",
  component: ReviewAnalytics,
  args: {
    materialId: "00000000-0000-4000-8000-000000000101",
    submitted: true,
  },
  render: (args) => (
    <>
      <ReviewAnalytics {...args} />
      <p className={noteStyle}>表示を持たず、感想口コミ投稿完了イベントだけを送ります。</p>
    </>
  ),
} satisfies Meta<typeof ReviewAnalytics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Submitted: Story = {};

export const NotSubmitted: Story = {
  args: { submitted: false },
};

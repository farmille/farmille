import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../../styled-system/css";

import { ScrollToHashOnMount } from "./ScrollToHashOnMount";

const noteStyle = css({ color: "text.subtle", fontSize: "sm" });

const meta = {
  title: "Pages/materials/[id]/ScrollToHashOnMount",
  component: ScrollToHashOnMount,
  args: { headingId: "reviews-heading", cardIdPrefix: "review-" },
  render: (args) => (
    <>
      <ScrollToHashOnMount {...args} />
      <p className={noteStyle}>
        表示を持たず、URL のハッシュが headingId か cardIdPrefix で始まる ID
        のときだけ、その要素まで移ります。
      </p>
    </>
  ),
} satisfies Meta<typeof ScrollToHashOnMount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

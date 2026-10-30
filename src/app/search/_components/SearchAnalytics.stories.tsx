import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../styled-system/css";
import { SearchAnalytics } from "./SearchAnalytics";

const meta = {
  title: "Pages/search/SearchAnalytics",
  component: SearchAnalytics,
  args: { filterCount: 2, resultCount: 18, sort: "reviews" },
} satisfies Meta<typeof SearchAnalytics>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Tracked: Story = {
  render: (args) => (
    <div className={css({ color: "text.muted", textStyle: "supporting" })}>
      <SearchAnalytics {...args} />
      検索イベントは Storybook 上でモック送信されます。
    </div>
  ),
};

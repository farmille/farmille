import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../styled-system/css";
import { ReviewCompletionToast } from "./ReviewCompletionToast";
import { Toaster } from "./Toaster";

/**
 * このコンポーネントは URL の ?review= クエリだけを見て表示を決める。
 * beforeEach で iframe の URL を一時的に書き換え、ストーリー離脱時に元へ戻す。
 * トーストは表示から4秒で自動的に消える点に注意。
 */
function withReviewQuery(value: "posted" | "updated" | "deleted" | null) {
  return () => {
    const originalUrl = window.location.href;
    const url = new URL(window.location.href);
    if (value === null) {
      url.searchParams.delete("review");
    } else {
      url.searchParams.set("review", value);
    }
    window.history.replaceState(null, "", url);
    return () => {
      window.history.replaceState(null, "", originalUrl);
    };
  };
}

const meta = {
  title: "Pages/Shared/ReviewCompletionToast",
  component: ReviewCompletionToast,
  decorators: [
    (Story) => (
      <div className={css({ position: "relative", minH: "[160px]", maxW: "phone" })}>
        <Story />
        <Toaster />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewCompletionToast>;

export default meta;
type Story = StoryObj<typeof meta>;

// 感想口コミ投稿完了（?review=posted）
export const Posted: Story = {
  beforeEach: withReviewQuery("posted"),
};

// 感想口コミ更新完了（?review=updated）
export const Updated: Story = {
  beforeEach: withReviewQuery("updated"),
};

// 感想口コミ削除完了（?review=deleted）
export const Deleted: Story = {
  beforeEach: withReviewQuery("deleted"),
};

// クエリが無い場合は何も表示しない
export const NoQuery: Story = {
  beforeEach: withReviewQuery(null),
};

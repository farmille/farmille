import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

import { css } from "../../styled-system/css";
import { ReviewCompletionToast } from "./ReviewCompletionToast";
import { Toaster } from "./Toaster";

function CompletionStory({ value }: { value: "posted" | "updated" | "deleted" | null }) {
  return (
    <NuqsTestingAdapter searchParams={value === null ? "" : `?review=${value}`} hasMemory>
      <ReviewCompletionToast />
    </NuqsTestingAdapter>
  );
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
  render: () => <CompletionStory value="posted" />,
};

// 感想口コミ更新完了（?review=updated）
export const Updated: Story = {
  render: () => <CompletionStory value="updated" />,
};

// 感想口コミ削除完了（?review=deleted）
export const Deleted: Story = {
  render: () => <CompletionStory value="deleted" />,
};

// クエリが無い場合は何も表示しない
export const NoQuery: Story = {
  render: () => <CompletionStory value={null} />,
};

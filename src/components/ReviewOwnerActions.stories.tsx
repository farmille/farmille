import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { ReviewOwnerActions } from "./ReviewOwnerActions";

const meta = {
  title: "Components/ReviewOwnerActions",
  component: ReviewOwnerActions,
  args: {
    materialId: "material-001",
    reviewId: "review-001",
  },
} satisfies Meta<typeof ReviewOwnerActions>;

export default meta;
type Story = StoryObj<typeof meta>;

// 編集リンク＋削除ボタン（ダイアログは閉じた状態）
export const Default: Story = {};

// play で削除確認ダイアログを開いた状態。
// 「削除する」を押すと実サーバーアクション（deleteReviewAction）が呼ばれるため、
// この play では開くところまでにとどめる。
export const DeleteDialogOpened: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "削除" }));
  },
};

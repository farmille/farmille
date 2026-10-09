import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";

import { css } from "../../styled-system/css";
import { Button } from "./Button";
import { Dialog, DialogActions, DialogClose } from "./Dialog";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const body = (
  <p className={css({ mt: "3", fontSize: "sm", lineHeight: "relaxed" })}>
    通報内容は運営だけが確認します。投稿者に通報者が知らされることはありません。
  </p>
);

// トリガーのみ（閉じた状態）
export const Closed: Story = {
  args: {
    title: "この感想口コミを通報する",
    trigger: <Button variant="ghost">通報する</Button>,
    children: body,
  },
};

// トリガーから開いた状態
export const Panel: Story = {
  args: {
    title: "この感想口コミを通報する",
    description: "不適切な内容を見つけた場合にお知らせください。",
    trigger: <Button variant="ghost">通報する</Button>,
    children: (
      <>
        {body}
        <DialogActions>
          <DialogClose>キャンセル</DialogClose>
          <DialogClose variant="primary">通報する</DialogClose>
        </DialogActions>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "通報する" }));
  },
};

// 開閉を呼び出し側で持つ（開いた状態）
export const Controlled: Story = {
  args: {
    title: "通報を受け付けました",
    description: "内容を確認のうえ対応いたします。ご協力ありがとうございます。",
    open: true,
    onOpenChange: fn(),
    children: (
      <DialogActions>
        <DialogClose>閉じる</DialogClose>
      </DialogActions>
    ),
  },
};

// 画面全体のプレビュー（上部バーに閉じるボタン）
export const Fullscreen: Story = {
  args: {
    title: "公開後の見え方",
    size: "fullscreen",
    closeLabel: "プレビューに戻る",
    open: true,
    onOpenChange: fn(),
    children: (
      <div className={css({ px: "4", py: "4" })}>
        <h1 className={css({ fontSize: "2xl" })}>土壌改良材A 実証詳細レポート｜トマト</h1>
        {body}
      </div>
    ),
  },
};
